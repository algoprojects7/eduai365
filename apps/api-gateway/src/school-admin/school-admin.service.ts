import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AuthenticatedUser, TenantContext, UserRole } from '@eduai365/shared-types';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateStudentDto } from './dto/create-student.dto';
import type { CreateTeacherDto } from './dto/create-teacher.dto';
import type { PaginationQueryDto } from './dto/pagination-query.dto';
import type { UpdateSchoolProfileDto } from './dto/update-school-profile.dto';
import type { UpdateStudentDto } from './dto/update-student.dto';

const BCRYPT_ROUNDS = 12;

const STAFF_ROLES: UserRole[] = [
  'TEACHER',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'EXAM_CONTROLLER',
  'COUNSELLOR',
  'LIBRARIAN',
  'ACCOUNTANT',
  'RECEPTIONIST',
  'TRANSPORT_MANAGER',
  'HR_MANAGER',
  'HOSTEL_WARDEN',
];

const STAFF_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

const STUDENT_LIST_SELECT = {
  id: true,
  admissionNo: true,
  firstName: true,
  lastName: true,
  status: true,
  classId: true,
  sectionId: true,
  createdAt: true,
  class: { select: { id: true, name: true, grade: true } },
  section: { select: { id: true, name: true } },
} as const;

const STUDENT_DETAIL_SELECT = {
  ...STUDENT_LIST_SELECT,
  updatedAt: true,
  schoolId: true,
} as const;

@Injectable()
export class SchoolAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getDashboard(tenant: TenantContext) {
    const schoolId = tenant.schoolId;

    const [enrolledStudents, activeStaff, inactiveStudents, school, invoices, attendanceRecords, studentsList] = await Promise.all([
      this.prisma.client.student.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.client.user.count({
        where: {
          schoolId,
          isActive: true,
          role: { in: [...STAFF_ROLES, 'SCHOOL_ADMIN'] },
        },
      }),
      this.prisma.client.student.count({ where: { schoolId, status: 'INACTIVE' } }),
      this.prisma.client.school.findUnique({
        where: { id: schoolId },
        select: { studentCount: true, plan: true },
      }),
      this.prisma.client.studentInvoice.findMany({
        where: { schoolId },
        select: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.client.attendanceRecord.findMany({
        where: { schoolId },
        select: { status: true },
      }),
      this.prisma.client.student.findMany({
        where: { schoolId, status: 'ACTIVE' },
        select: {
          id: true,
          attendanceRecords: { select: { status: true } },
          invoices: {
            where: { status: 'OVERDUE' },
            select: { id: true },
          },
        },
      }),
    ]);

    const feesTarget = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const feesCollected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);

    let avgAttendance = 100;
    if (attendanceRecords.length > 0) {
      const present = attendanceRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      avgAttendance = Math.round((present / attendanceRecords.length) * 1000) / 10;
    }

    let dropoutRiskCount = 0;
    for (const s of studentsList) {
      const overdue = s.invoices.length;
      if (overdue > 0) {
        dropoutRiskCount++;
        continue;
      }
      const totalRecs = s.attendanceRecords.length;
      if (totalRecs > 0) {
        const present = s.attendanceRecords.filter(
          (r) => r.status === 'PRESENT' || r.status === 'LATE',
        ).length;
        const percent = (present / totalRecs) * 100;
        if (percent < 85) {
          dropoutRiskCount++;
        }
      }
    }

    return {
      enrolledStudents,
      activeStaff,
      avgAttendance,
      feesCollected,
      feesTarget,
      aiInsights: {
        dropoutRiskCount,
        feeDefaultPrediction:
          dropoutRiskCount > 5
            ? `${dropoutRiskCount} students flagged for potential fee default this term`
            : 'Fee collection on track — no significant default risk detected',
      },
      plan: school?.plan ?? tenant.plan,
    };
  }

  async getProfile(tenant: TenantContext): Promise<{
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    plan: string;
    slug: string;
    settings: any;
  }> {
    const school = await this.prisma.client.school.findUnique({
      where: { id: tenant.schoolId },
      select: {
        name: true,
        logoUrl: true,
        primaryColor: true,
        plan: true,
        slug: true,
        settings: true,
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school;
  }

  async updateProfile(
    tenant: TenantContext,
    dto: UpdateSchoolProfileDto,
    actor: AuthenticatedUser,
  ): Promise<{
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    plan: string;
    slug: string;
    settings: any;
  }> {
    let settingsUpdate = {};
    if (
      dto.principalRestrictedModules !== undefined ||
      dto.sessionEndingMonth !== undefined ||
      dto.admissionFeeCategories !== undefined ||
      dto.monthlyFeeCategories !== undefined
    ) {
      const existingSchool = await this.prisma.client.school.findUnique({
        where: { id: tenant.schoolId },
        select: { settings: true },
      });
      const currentSettings =
        typeof existingSchool?.settings === 'object' && existingSchool.settings !== null
          ? (existingSchool.settings as Record<string, any>)
          : {};

      const newSettings = {
        ...currentSettings,
        ...(dto.principalRestrictedModules !== undefined ? { principalRestrictedModules: dto.principalRestrictedModules } : {}),
        ...(dto.sessionEndingMonth !== undefined ? { sessionEndingMonth: dto.sessionEndingMonth } : {}),
        ...(dto.admissionFeeCategories !== undefined ? { admissionFeeCategories: dto.admissionFeeCategories } : {}),
        ...(dto.monthlyFeeCategories !== undefined ? { monthlyFeeCategories: dto.monthlyFeeCategories } : {}),
      };
      settingsUpdate = { settings: newSettings };
    }

    const school = await this.prisma.client.school.update({
      where: { id: tenant.schoolId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.primaryColor !== undefined ? { primaryColor: dto.primaryColor } : {}),
        ...settingsUpdate,
      },
      select: {
        name: true,
        logoUrl: true,
        primaryColor: true,
        plan: true,
        slug: true,
        settings: true,
      },
    });

    await this.audit.log({
      action: 'school.profile.update',
      entity: 'School',
      entityId: tenant.schoolId,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { fields: Object.keys(dto) },
    });

    return school;
  }

  async listStudents(query: PaginationQueryDto): Promise<{
    items: unknown[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.client.student.findMany({
        select: STUDENT_LIST_SELECT,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.client.student.count(),
    ]);

    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getStudent(id: string): Promise<unknown> {
    const student = await this.prisma.client.student.findFirst({
      where: { id },
      select: STUDENT_DETAIL_SELECT,
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async createStudent(
    dto: CreateStudentDto,
    actor: AuthenticatedUser,
    tenant: TenantContext,
  ): Promise<unknown> {
    const existing = await this.prisma.client.student.findFirst({
      where: { admissionNo: dto.admissionNo },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`Admission number '${dto.admissionNo}' already exists`);
    }

    const student = await this.prisma.client.student.create({
      data: {
        schoolId: tenant.schoolId,
        admissionNo: dto.admissionNo,
        firstName: dto.firstName,
        lastName: dto.lastName,
        classId: dto.classId,
        sectionId: dto.sectionId,
        status: dto.status ?? 'ACTIVE',
      },
      select: STUDENT_DETAIL_SELECT,
    });

    await this.prisma.client.school.update({
      where: { id: tenant.schoolId },
      data: { studentCount: { increment: 1 } },
    });

    // Generate admission invoice with other relevant fees for the new student/session
    let grade = 'Class 10';
    let academicYear = '2025-2026';
    if (student.classId) {
      const cls = await this.prisma.client.class.findUnique({
        where: { id: student.classId },
      });
      if (cls) {
        grade = cls.grade;
        academicYear = cls.academicYear || '2025-2026';
      }
    }

    const feeHeads = await this.prisma.client.feeHead.findMany({
      where: {
        schoolId: tenant.schoolId,
        isActive: true,
        OR: [
          { isMandatory: true },
          { code: 'ADMISSION' },
          { category: 'ADMISSION' },
        ],
      },
    });

    if (feeHeads.length > 0) {
      const matrixEntries = await this.prisma.client.classFeeMatrix.findMany({
        where: {
          schoolId: tenant.schoolId,
          academicYear,
          grade,
          feeHeadId: { in: feeHeads.map((f) => f.id) },
        },
      });

      const amountByFeeHead = new Map(
        matrixEntries.map((m) => [m.feeHeadId, Number(m.amount)]),
      );

      let totalAmount = 0;
      const lineItems = feeHeads.map((fh) => {
        const baseAmount = amountByFeeHead.get(fh.id) ?? Number(fh.amount);
        totalAmount += baseAmount;
        return {
          feeHeadId: fh.id,
          description: fh.name,
          amount: baseAmount,
        };
      });

      if (lineItems.length > 0) {
        const count = await this.prisma.client.studentInvoice.count({
          where: { schoolId: tenant.schoolId },
        });
        const invoiceNo = `INV-${academicYear.replace('-', '')}-${String(count + 1).padStart(4, '0')}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

        await this.prisma.client.studentInvoice.create({
          data: {
            schoolId: tenant.schoolId,
            studentId: student.id,
            invoiceNo,
            academicYear,
            term: 'Admission & Term 1',
            totalAmount,
            dueDate,
            status: 'ISSUED',
            lineItems: { create: lineItems },
          },
        });
      }
    }

    await this.audit.log({
      action: 'student.create',
      entity: 'Student',
      entityId: student.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { admissionNo: dto.admissionNo },
    });

    return student;
  }

  async updateStudent(
    id: string,
    dto: UpdateStudentDto,
    actor: AuthenticatedUser,
    tenant: TenantContext,
  ): Promise<unknown> {
    const existing = await this.prisma.client.student.findFirst({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Student not found');
    }

    if (dto.admissionNo) {
      const duplicate = await this.prisma.client.student.findFirst({
        where: { admissionNo: dto.admissionNo, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(`Admission number '${dto.admissionNo}' already exists`);
      }
    }

    const student = await this.prisma.client.student.update({
      where: { id },
      data: {
        ...(dto.admissionNo !== undefined ? { admissionNo: dto.admissionNo } : {}),
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.classId !== undefined ? { classId: dto.classId } : {}),
        ...(dto.sectionId !== undefined ? { sectionId: dto.sectionId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      select: STUDENT_DETAIL_SELECT,
    });

    if (dto.status && dto.status !== existing.status) {
      const becameInactive = dto.status !== 'ACTIVE' && existing.status === 'ACTIVE';
      const becameActive = dto.status === 'ACTIVE' && existing.status !== 'ACTIVE';
      if (becameInactive || becameActive) {
        await this.prisma.client.school.update({
          where: { id: tenant.schoolId },
          data: { studentCount: { increment: becameActive ? 1 : -1 } },
        });
      }
    }

    await this.audit.log({
      action: 'student.update',
      entity: 'Student',
      entityId: student.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { fields: Object.keys(dto) },
    });

    return student;
  }

  async listTeachers(
    query: PaginationQueryDto,
    tenant: TenantContext,
  ): Promise<{
    items: unknown[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      schoolId: tenant.schoolId,
      role: { in: STAFF_ROLES },
    };

    const [items, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        select: STAFF_USER_SELECT,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.client.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getTeacher(id: string, tenant: TenantContext): Promise<unknown> {
    const teacher = await this.prisma.client.user.findFirst({
      where: {
        id,
        schoolId: tenant.schoolId,
        role: { in: STAFF_ROLES },
      },
      select: STAFF_USER_SELECT,
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async createTeacher(
    dto: CreateTeacherDto,
    actor: AuthenticatedUser,
    tenant: TenantContext,
  ): Promise<{ teacher: unknown; temporaryPassword: string }> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.client.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`Email '${email}' is already registered`);
    }

    const temporaryPassword = randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    const teacher = await this.prisma.client.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        schoolId: tenant.schoolId,
        isActive: true,
      },
      select: STAFF_USER_SELECT,
    });

    await this.audit.log({
      action: 'teacher.create',
      entity: 'User',
      entityId: teacher.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { email, role: dto.role },
    });

    return { teacher, temporaryPassword };
  }

  async getActivityFeed(tenant: TenantContext) {
    const schoolId = tenant.schoolId;

    const [leaves, admissions] = await Promise.all([
      this.prisma.client.leaveRequest.findMany({
        where: { schoolId, status: 'PENDING' },
        include: { employee: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.client.admissionApplication.findMany({
        where: { schoolId, stage: 'APPLICATION' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const feed = [];

    for (const leave of leaves) {
      const empName = `${leave.employee.firstName} ${leave.employee.lastName}`;
      const startStr = leave.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = leave.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      feed.push({
        id: `act-leave-${leave.id}`,
        type: 'leave_request',
        title: 'Leave request pending approval',
        description: `${empName} requested ${leave.days} days leave (${startStr}–${endStr})`,
        status: 'pending',
        submittedAt: leave.createdAt.toISOString(),
      });
    }

    for (const app of admissions) {
      feed.push({
        id: `act-adm-${app.id}`,
        type: 'admission',
        title: 'New admission application',
        description: `Application received for ${app.targetClass} — ${app.applicantName}`,
        status: 'pending',
        submittedAt: app.createdAt.toISOString(),
      });
    }

    return feed.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }
}
