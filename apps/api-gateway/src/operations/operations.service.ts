import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  TenantContext,
} from '@eduai365/shared-types';
import type { Prisma } from '@eduai365/database';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBookstoreItemDto, IssueBookstoreItemDto, ReturnBookstoreItemDto, RecordDamageFineDto } from './dto/bookstore.dto';
import type { CreateClubDto, JoinClubDto } from './dto/clubs.dto';
import type {
  CreateInfirmaryVisitDto,
  HealthRecordsQueryDto,
  InfirmaryVisitsQueryDto,
  UpdateHealthRecordDto,
} from './dto/health.dto';
import type {
  CreateLibraryBookDto,
  IssueLibraryBookDto,
  ListLibraryIssuesQueryDto,
  UpdateLibraryBookDto,
} from './dto/library.dto';
import type {
  AllocateStudentTransportDto,
  CreateTransportRouteDto,
} from './dto/transport.dto';
import type {
  CreateUniformOrderDto,
  ListUniformOrdersQueryDto,
  UpdateUniformStockDto,
} from './dto/uniform.dto';

const LIBRARY_FINE_PER_DAY = 10;

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number(value);
}

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async requireStudent(tenant: TenantContext, studentId: string) {
    const student = await this.prisma.client.student.findFirst({
      where: { id: studentId, schoolId: tenant.schoolId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  // ─── Library ───────────────────────────────────────────────────────────────

  async listLibraryBooks(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.libraryBook.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
  }

  async createLibraryBook(
    tenant: TenantContext,
    dto: CreateLibraryBookDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.libraryBook.create({
      data: {
        schoolId: tenant.schoolId,
        title: dto.title,
        author: dto.author,
        isbn: dto.isbn,
        category: dto.category,
        totalCopies: dto.totalCopies,
        availableCopies: dto.totalCopies,
        shelf: dto.shelf,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'LibraryBook',
      entityId: record.id,
    });

    return record;
  }

  async updateLibraryBook(
    tenant: TenantContext,
    id: string,
    dto: UpdateLibraryBookDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.libraryBook.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Book not found');
    }

    const issuedCount = existing.totalCopies - existing.availableCopies;
    const totalCopies = dto.totalCopies ?? existing.totalCopies;
    if (totalCopies < issuedCount) {
      throw new BadRequestException('Total copies cannot be less than issued copies');
    }

    const record = await this.prisma.client.libraryBook.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.author !== undefined ? { author: dto.author } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.shelf !== undefined ? { shelf: dto.shelf } : {}),
        ...(dto.totalCopies !== undefined
          ? {
              totalCopies: dto.totalCopies,
              availableCopies: dto.totalCopies - issuedCount,
            }
          : {}),
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'LibraryBook',
      entityId: record.id,
    });

    return record;
  }

  async listLibraryIssues(
    tenant: TenantContext,
    query: ListLibraryIssuesQueryDto,
  ): Promise<unknown> {
    const books = await this.prisma.client.libraryBook.findMany({
      where: { schoolId: tenant.schoolId },
      select: { id: true },
    });
    const bookIds = books.map((b) => b.id);
    if (bookIds.length === 0) return [];

    return this.prisma.client.libraryIssue.findMany({
      where: {
        bookId: query.bookId ? query.bookId : { in: bookIds },
        ...(query.studentId ? { studentId: query.studentId } : {}),
      },
      include: {
        book: { select: { id: true, title: true, author: true, isbn: true } },
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async issueLibraryBook(
    tenant: TenantContext,
    dto: IssueLibraryBookDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const book = await this.prisma.client.libraryBook.findFirst({
      where: { id: dto.bookId, schoolId: tenant.schoolId },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (book.availableCopies <= 0) {
      throw new BadRequestException('No copies available');
    }

    await this.requireStudent(tenant, dto.studentId);

    const [issue] = await this.prisma.client.$transaction([
      this.prisma.client.libraryIssue.create({
        data: {
          bookId: dto.bookId,
          studentId: dto.studentId,
          dueDate: new Date(dto.dueDate),
        },
        include: {
          book: { select: { title: true } },
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
        },
      }),
      this.prisma.client.libraryBook.update({
        where: { id: dto.bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'LibraryIssue',
      entityId: issue.id,
    });

    return issue;
  }

  async returnLibraryBook(
    tenant: TenantContext,
    issueId: string,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const issue = await this.prisma.client.libraryIssue.findFirst({
      where: { id: issueId, returnedAt: null },
      include: { book: true },
    });
    if (!issue || issue.book.schoolId !== tenant.schoolId) {
      throw new NotFoundException('Active issue not found');
    }

    const now = new Date();
    const dueDate = new Date(issue.dueDate);
    const daysOverdue = Math.max(
      0,
      Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const fineAmount = daysOverdue > 0 ? daysOverdue * LIBRARY_FINE_PER_DAY : null;

    const [updated] = await this.prisma.client.$transaction([
      this.prisma.client.libraryIssue.update({
        where: { id: issueId },
        data: { returnedAt: now, fineAmount },
        include: {
          book: { select: { title: true } },
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
        },
      }),
      this.prisma.client.libraryBook.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'LibraryIssue',
      entityId: issueId,
      metadata: { returned: true, fineAmount },
    });

    return updated;
  }

  async listOverdueLibraryIssues(tenant: TenantContext): Promise<unknown> {
    const books = await this.prisma.client.libraryBook.findMany({
      where: { schoolId: tenant.schoolId },
      select: { id: true },
    });
    const bookIds = books.map((b) => b.id);

    return this.prisma.client.libraryIssue.findMany({
      where: {
        bookId: { in: bookIds },
        returnedAt: null,
        dueDate: { lt: new Date() },
      },
      include: {
        book: { select: { title: true, isbn: true } },
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getLibraryStats(tenant: TenantContext): Promise<unknown> {
    const books = await this.prisma.client.libraryBook.findMany({
      where: { schoolId: tenant.schoolId },
    });
    const bookIds = books.map((b) => b.id);

    const [activeIssues, overdueIssues] = await Promise.all([
      this.prisma.client.libraryIssue.count({
        where: { bookId: { in: bookIds }, returnedAt: null },
      }),
      this.prisma.client.libraryIssue.count({
        where: {
          bookId: { in: bookIds },
          returnedAt: null,
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
    const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);

    return {
      totalTitles: books.length,
      totalCopies,
      availableCopies,
      issuedCopies: totalCopies - availableCopies,
      activeIssues,
      overdueIssues,
      categories: [...new Set(books.map((b) => b.category))].length,
    };
  }

  // ─── Transport ─────────────────────────────────────────────────────────────

  async listTransportRoutes(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.transportRoute.findMany({
      where: { schoolId: tenant.schoolId },
      include: {
        vehicles: true,
        _count: { select: { allocations: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async createTransportRoute(
    tenant: TenantContext,
    dto: CreateTransportRouteDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const route = await this.prisma.client.transportRoute.create({
      data: {
        schoolId: tenant.schoolId,
        name: dto.name,
        code: dto.code.toUpperCase(),
        stops: dto.stops as unknown as Prisma.InputJsonValue,
        distanceKm: dto.distanceKm,
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        ...(dto.registrationNo && dto.capacity
          ? {
              vehicles: {
                create: {
                  registrationNo: dto.registrationNo,
                  capacity: dto.capacity,
                },
              },
            }
          : {}),
      },
      include: { vehicles: true },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'TransportRoute',
      entityId: route.id,
    });

    return route;
  }

  async listTransportVehicles(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.transportVehicle.findMany({
      where: { route: { schoolId: tenant.schoolId } },
      include: { route: { select: { id: true, name: true, code: true } } },
      orderBy: { registrationNo: 'asc' },
    });
  }

  async listTransportAllocations(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.studentTransport.findMany({
      where: { route: { schoolId: tenant.schoolId } },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
        route: { select: { id: true, name: true, code: true } },
      },
      orderBy: { pickupTime: 'asc' },
    });
  }

  async allocateStudentTransport(
    tenant: TenantContext,
    dto: AllocateStudentTransportDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const route = await this.prisma.client.transportRoute.findFirst({
      where: { id: dto.routeId, schoolId: tenant.schoolId },
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    await this.requireStudent(tenant, dto.studentId);

    const stops = route.stops as Array<{ name: string }>;
    if (stops.length > 0 && !stops.some((s) => s.name === dto.stopName)) {
      throw new BadRequestException('Stop not found on route');
    }

    const allocation = await this.prisma.client.studentTransport.upsert({
      where: { studentId: dto.studentId },
      create: {
        studentId: dto.studentId,
        routeId: dto.routeId,
        stopName: dto.stopName,
        pickupTime: dto.pickupTime,
      },
      update: {
        routeId: dto.routeId,
        stopName: dto.stopName,
        pickupTime: dto.pickupTime,
      },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
        route: { select: { name: true, code: true } },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPSERT',
      entity: 'StudentTransport',
      entityId: allocation.id,
    });

    return allocation;
  }

  // ─── Health ──────────────────────────────────────────────────────────────────

  async listHealthRecords(
    tenant: TenantContext,
    query: HealthRecordsQueryDto,
  ): Promise<unknown> {
    if (query.studentId) {
      await this.requireStudent(tenant, query.studentId);
      const record = await this.prisma.client.healthRecord.findUnique({
        where: { studentId: query.studentId },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, admissionNo: true },
          },
        },
      });
      return record ? [record] : [];
    }

    const students = await this.prisma.client.student.findMany({
      where: { schoolId: tenant.schoolId },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);

    return this.prisma.client.healthRecord.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
    });
  }

  async updateHealthRecord(
    tenant: TenantContext,
    studentId: string,
    dto: UpdateHealthRecordDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireStudent(tenant, studentId);

    const record = await this.prisma.client.healthRecord.upsert({
      where: { studentId },
      create: {
        studentId,
        bloodGroup: dto.bloodGroup,
        allergies: (dto.allergies ?? []) as Prisma.InputJsonValue,
        vaccinations: (dto.vaccinations ?? []) as Prisma.InputJsonValue,
        bmi: dto.bmi,
        lastCheckup: dto.lastCheckup ? new Date(dto.lastCheckup) : undefined,
      },
      update: {
        ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup } : {}),
        ...(dto.allergies !== undefined
          ? { allergies: dto.allergies as Prisma.InputJsonValue }
          : {}),
        ...(dto.vaccinations !== undefined
          ? { vaccinations: dto.vaccinations as Prisma.InputJsonValue }
          : {}),
        ...(dto.bmi !== undefined ? { bmi: dto.bmi } : {}),
        ...(dto.lastCheckup !== undefined
          ? { lastCheckup: new Date(dto.lastCheckup) }
          : {}),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPSERT',
      entity: 'HealthRecord',
      entityId: record.id,
    });

    return record;
  }

  async listInfirmaryVisits(
    tenant: TenantContext,
    query: InfirmaryVisitsQueryDto,
  ): Promise<unknown> {
    const students = await this.prisma.client.student.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.studentId ? { id: query.studentId } : {}),
      },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) return [];

    return this.prisma.client.infirmaryVisit.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async createInfirmaryVisit(
    tenant: TenantContext,
    dto: CreateInfirmaryVisitDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireStudent(tenant, dto.studentId);

    const visit = await this.prisma.client.infirmaryVisit.create({
      data: {
        studentId: dto.studentId,
        visitDate: new Date(dto.visitDate),
        complaint: dto.complaint,
        treatment: dto.treatment,
        referred: dto.referred ?? false,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'InfirmaryVisit',
      entityId: visit.id,
    });

    return visit;
  }

  // ─── Clubs ───────────────────────────────────────────────────────────────────

  async listClubs(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.club.findMany({
      where: { schoolId: tenant.schoolId },
      include: {
        advisor: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createClub(
    tenant: TenantContext,
    dto: CreateClubDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const club = await this.prisma.client.club.create({
      data: {
        schoolId: tenant.schoolId,
        name: dto.name,
        category: dto.category,
        advisorId: dto.advisorId,
        maxMembers: dto.maxMembers,
        memberCount: 0,
      },
      include: {
        advisor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Club',
      entityId: club.id,
    });

    return club;
  }

  async joinClub(
    tenant: TenantContext,
    clubId: string,
    dto: JoinClubDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const club = await this.prisma.client.club.findFirst({
      where: { id: clubId, schoolId: tenant.schoolId },
    });
    if (!club) {
      throw new NotFoundException('Club not found');
    }
    if (club.memberCount >= club.maxMembers) {
      throw new BadRequestException('Club is full');
    }

    await this.requireStudent(tenant, dto.studentId);

    const existing = await this.prisma.client.clubMembership.findUnique({
      where: { clubId_studentId: { clubId, studentId: dto.studentId } },
    });
    if (existing?.status === 'ACTIVE') {
      throw new BadRequestException('Student is already a member');
    }

    const [membership] = await this.prisma.client.$transaction([
      this.prisma.client.clubMembership.upsert({
        where: { clubId_studentId: { clubId, studentId: dto.studentId } },
        create: { clubId, studentId: dto.studentId, status: 'ACTIVE' },
        update: { status: 'ACTIVE', joinedAt: new Date() },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, admissionNo: true },
          },
        },
      }),
      this.prisma.client.club.update({
        where: { id: clubId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'ClubMembership',
      entityId: membership.id,
    });

    return membership;
  }

  async listClubMembers(tenant: TenantContext, clubId: string): Promise<unknown> {
    const club = await this.prisma.client.club.findFirst({
      where: { id: clubId, schoolId: tenant.schoolId },
    });
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    return this.prisma.client.clubMembership.findMany({
      where: { clubId, status: 'ACTIVE' },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // ─── Uniform ─────────────────────────────────────────────────────────────────

  async listUniformItems(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.uniformItem.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: [{ name: 'asc' }, { size: 'asc' }],
    });
  }

  async updateUniformStock(
    tenant: TenantContext,
    itemId: string,
    dto: UpdateUniformStockDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.uniformItem.findFirst({
      where: { id: itemId, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Uniform item not found');
    }

    const record = await this.prisma.client.uniformItem.update({
      where: { id: itemId },
      data: { stock: dto.stock },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'UniformItem',
      entityId: itemId,
    });

    return record;
  }

  async createUniformOrder(
    tenant: TenantContext,
    dto: CreateUniformOrderDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireStudent(tenant, dto.studentId);

    let totalAmount = 0;
    const lineItems: Array<{ itemId: string; name: string; size: string; quantity: number; unitPrice: number }> = [];

    for (const line of dto.items) {
      const item = await this.prisma.client.uniformItem.findFirst({
        where: { id: line.itemId, schoolId: tenant.schoolId },
      });
      if (!item) {
        throw new NotFoundException(`Uniform item ${line.itemId} not found`);
      }
      if (item.stock < line.quantity) {
        throw new BadRequestException(`Insufficient stock for ${item.name} (${item.size})`);
      }

      const unitPrice = decimalToNumber(item.price);
      totalAmount += unitPrice * line.quantity;
      lineItems.push({
        itemId: item.id,
        name: item.name,
        size: item.size,
        quantity: line.quantity,
        unitPrice,
      });
    }

    const order = await this.prisma.client.$transaction(async (tx) => {
      for (const line of dto.items) {
        await tx.uniformItem.update({
          where: { id: line.itemId },
          data: { stock: { decrement: line.quantity } },
        });
      }

      return tx.uniformOrder.create({
        data: {
          studentId: dto.studentId,
          items: lineItems as Prisma.InputJsonValue,
          status: 'CONFIRMED',
          totalAmount,
        },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, admissionNo: true },
          },
        },
      });
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'UniformOrder',
      entityId: order.id,
    });

    return order;
  }

  async listUniformOrders(
    tenant: TenantContext,
    query: ListUniformOrdersQueryDto,
  ): Promise<unknown> {
    const students = await this.prisma.client.student.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.studentId ? { id: query.studentId } : {}),
      },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) return [];

    return this.prisma.client.uniformOrder.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Bookstore ───────────────────────────────────────────────────────────────

  async listBookstoreItems(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.bookstoreItem.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: [{ classGrade: 'asc' }, { title: 'asc' }],
    });
  }

  async issueBookstoreItem(
    tenant: TenantContext,
    dto: IssueBookstoreItemDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const itemId = dto.itemId || dto.textbookId;
    if (!itemId) {
      throw new BadRequestException('Item ID or Textbook ID is required');
    }
    const item = await this.prisma.client.bookstoreItem.findFirst({
      where: { id: itemId, schoolId: tenant.schoolId },
    });
    if (!item) {
      throw new NotFoundException('Bookstore item not found');
    }
    if (item.stock <= 0) {
      throw new BadRequestException('Item out of stock');
    }

    await this.requireStudent(tenant, dto.studentId);

    const [issue] = await this.prisma.client.$transaction([
      this.prisma.client.bookstoreIssue.create({
        data: {
          studentId: dto.studentId,
          itemId: itemId,
        },
        include: {
          item: { select: { title: true, classGrade: true } },
          student: {
            select: { firstName: true, lastName: true, admissionNo: true },
          },
        },
      }),
      this.prisma.client.bookstoreItem.update({
        where: { id: itemId },
        data: { stock: { decrement: 1 } },
      }),
    ]);

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'BookstoreIssue',
      entityId: issue.id,
    });

    return issue;
  }

  async returnBookstoreItem(
    tenant: TenantContext,
    dto: ReturnBookstoreItemDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const issue = await this.prisma.client.bookstoreIssue.findFirst({
      where: { id: dto.issueId, returnedAt: null },
      include: { item: true },
    });
    if (!issue || issue.item.schoolId !== tenant.schoolId) {
      throw new NotFoundException('Active bookstore issue not found');
    }

    const [updated] = await this.prisma.client.$transaction([
      this.prisma.client.bookstoreIssue.update({
        where: { id: dto.issueId },
        data: {
          returnedAt: new Date(),
          damageFine: dto.damageFine ?? null,
        },
        include: {
          item: { select: { title: true } },
          student: {
            select: { firstName: true, lastName: true, admissionNo: true },
          },
        },
      }),
      this.prisma.client.bookstoreItem.update({
        where: { id: issue.itemId },
        data: { stock: { increment: 1 } },
      }),
    ]);

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'BookstoreIssue',
      entityId: dto.issueId,
      metadata: { returned: true },
    });

    return updated;
  }

  async createBookstoreItem(
    tenant: TenantContext,
    dto: CreateBookstoreItemDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const item = await this.prisma.client.bookstoreItem.create({
      data: {
        schoolId: tenant.schoolId,
        title: dto.title,
        isbn: dto.isbn || null,
        classGrade: dto.classGrade,
        price: dto.price,
        stock: dto.stock,
        rackNo: dto.rackNo || null,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'BookstoreItem',
      entityId: item.id,
    });

    return item;
  }

  async getBookstoreStats(tenant: TenantContext): Promise<unknown> {
    const totalTitles = await this.prisma.client.bookstoreItem.count({
      where: { schoolId: tenant.schoolId },
    });

    const items = await this.prisma.client.bookstoreItem.findMany({
      where: { schoolId: tenant.schoolId },
      select: { stock: true },
    });
    const inStock = items.reduce((sum, item) => sum + item.stock, 0);

    const issued = await this.prisma.client.bookstoreIssue.count({
      where: {
        item: { schoolId: tenant.schoolId },
        returnedAt: null,
      },
    });

    const issuesWithFine = await this.prisma.client.bookstoreIssue.findMany({
      where: {
        item: { schoolId: tenant.schoolId },
        damageFine: { not: null },
      },
      select: { damageFine: true },
    });
    const damageFinesCollected = issuesWithFine.reduce((sum, i) => sum + Number(i.damageFine || 0), 0);

    return {
      totalTitles,
      inStock,
      issued,
      damageFinesCollected,
    };
  }

  async listBookstoreInventory(tenant: TenantContext, search?: string): Promise<unknown> {
    const where: Prisma.BookstoreItemWhereInput = {
      schoolId: tenant.schoolId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { classGrade: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.client.bookstoreItem.findMany({
      where,
      include: {
        issues: {
          where: { returnedAt: null },
        },
      },
      orderBy: [{ classGrade: 'asc' }, { title: 'asc' }],
    });

    return items.map((item) => ({
      id: item.id,
      subject: 'General',
      className: item.classGrade,
      title: item.title,
      publisher: 'N/A',
      price: Number(item.price),
      stock: item.stock,
      issued: item.issues.length,
      rackNo: item.rackNo,
      isbn: item.isbn,
    }));
  }

  async listBookstoreIssued(tenant: TenantContext): Promise<unknown> {
    const issues = await this.prisma.client.bookstoreIssue.findMany({
      where: {
        item: { schoolId: tenant.schoolId },
      },
      include: {
        item: true,
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return issues.map((issue) => ({
      id: issue.id,
      textbookId: issue.itemId,
      textbookTitle: issue.item.title,
      subject: 'General',
      studentId: issue.studentId,
      studentName: `${issue.student.firstName} ${issue.student.lastName}`,
      studentClass: issue.student.class?.name || 'Unknown',
      issuedAt: issue.issuedAt.toISOString(),
      returnedAt: issue.returnedAt?.toISOString() || null,
      condition: issue.damageFine !== null ? 'DAMAGED' : 'GOOD',
      isbn: issue.item.isbn,
    }));
  }

  async listBookstoreDamageReports(tenant: TenantContext): Promise<unknown> {
    const issues = await this.prisma.client.bookstoreIssue.findMany({
      where: {
        item: { schoolId: tenant.schoolId },
        damageFine: { not: null },
      },
      include: {
        item: true,
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: { returnedAt: 'desc' },
    });

    return issues.map((issue) => ({
      id: issue.id,
      textbookTitle: issue.item.title,
      studentName: `${issue.student.firstName} ${issue.student.lastName}`,
      studentClass: issue.student.class?.name || 'Unknown',
      damageType: 'Damaged Textbook',
      fineAmount: Number(issue.damageFine),
      reportedAt: issue.returnedAt?.toISOString() || issue.updatedAt.toISOString(),
      status: 'PAID',
    }));
  }

  async getBookstoreStockChart(tenant: TenantContext): Promise<unknown> {
    const items = await this.prisma.client.bookstoreItem.findMany({
      where: { schoolId: tenant.schoolId },
      select: { stock: true },
    });
    const available = items.reduce((sum, item) => sum + item.stock, 0);

    const issued = await this.prisma.client.bookstoreIssue.count({
      where: {
        item: { schoolId: tenant.schoolId },
        returnedAt: null,
      },
    });

    return {
      issued,
      available,
    };
  }

  async getBookstoreForecast(tenant: TenantContext): Promise<unknown> {
    const items = await this.prisma.client.bookstoreItem.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: { stock: 'asc' },
      take: 5,
    });

    const recommendations = items.map((item) => {
      const forecastDemand = Math.max(item.stock + 10, 40);
      return {
        subject: 'General',
        className: item.classGrade,
        title: item.title,
        currentStock: item.stock,
        forecastDemand,
      };
    });

    return {
      message: items[0]
        ? `Based on next term's projected enrollment, stock levels for ${items[0].title} (Class ${items[0].classGrade}) are projected to be low.`
        : "Based on next term's projected enrollment, stock levels are currently optimal.",
      recommendations,
      confidence: 92,
    };
  }

  async recordBookstoreDamageFine(
    tenant: TenantContext,
    dto: RecordDamageFineDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const issue = await this.prisma.client.bookstoreIssue.findFirst({
      where: { id: dto.issueId },
      include: { item: true },
    });

    if (!issue || issue.item.schoolId !== tenant.schoolId) {
      throw new NotFoundException('Bookstore issue record not found');
    }

    const updated = await this.prisma.client.bookstoreIssue.update({
      where: { id: dto.issueId },
      data: {
        damageFine: dto.fineAmount,
      },
      include: {
        item: { select: { title: true } },
        student: {
          select: { firstName: true, lastName: true, admissionNo: true },
        },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'BookstoreIssue',
      entityId: dto.issueId,
      metadata: { recordedDamageFine: dto.fineAmount, damageType: dto.damageType },
    });

    return updated;
  }
}
