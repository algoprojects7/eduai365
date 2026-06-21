import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  TenantContext,
} from '@eduai365/shared-types';
import type { Prisma } from '@eduai365/database';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  EnrollEmployeeDto,
  ListEmployeesQueryDto,
  UpdateEmployeeDto,
} from './dto/employees.dto';
import type {
  ApplyLeaveDto,
  LeaveBalancesQueryDto,
  LeaveCalendarQueryDto,
  ListLeaveQueryDto,
  UpdateLeaveDto,
} from './dto/leave.dto';
import type { ListPayrollQueryDto, RunPayrollDto } from './dto/payroll.dto';
import type {
  AssignSubstitutionDto,
  ListSubstitutionsQueryDto,
  SubstitutionSuggestionsQueryDto,
} from './dto/substitution.dto';

const BCRYPT_ROUNDS = 12;

const EMPLOYEE_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
    },
  },
} satisfies Prisma.EmployeeProfileInclude;

function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function mockAiMatchScore(teacherId: string, absentId: string): number {
  let hash = 0;
  const key = `${teacherId}:${absentId}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % 100;
  }
  return Math.round((0.55 + (hash % 45) / 100) * 100) / 100;
}

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Employees ─────────────────────────────────────────────────────────────

  async listEmployees(tenant: TenantContext, query: ListEmployeesQueryDto): Promise<unknown> {
    return this.prisma.client.employeeProfile.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.type ? { employmentType: query.type } : {}),
      },
      include: EMPLOYEE_INCLUDE,
      orderBy: [{ department: 'asc' }, { employeeId: 'asc' }],
    });
  }

  async getEmployeeStats(tenant: TenantContext): Promise<unknown> {
    const [total, teaching, nonTeaching, onLeave] = await Promise.all([
      this.prisma.client.employeeProfile.count({ where: { schoolId: tenant.schoolId } }),
      this.prisma.client.employeeProfile.count({
        where: { schoolId: tenant.schoolId, employmentType: 'TEACHING' },
      }),
      this.prisma.client.employeeProfile.count({
        where: { schoolId: tenant.schoolId, employmentType: 'NON_TEACHING' },
      }),
      this.prisma.client.leaveRequest.count({
        where: {
          schoolId: tenant.schoolId,
          status: 'APPROVED',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      }),
    ]);

    return { total, teaching, nonTeaching, onLeave };
  }

  async getEmployee(tenant: TenantContext, id: string): Promise<unknown> {
    const profile = await this.prisma.client.employeeProfile.findFirst({
      where: { id, schoolId: tenant.schoolId },
      include: {
        ...EMPLOYEE_INCLUDE,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Employee not found');
    }

    const balances = await this.prisma.client.leaveBalance.findMany({
      where: { employeeId: profile.userId },
    });

    return { ...profile, leaveBalances: balances };
  }

  async enrollEmployee(
    tenant: TenantContext,
    dto: EnrollEmployeeDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.client.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`Email '${email}' is already registered`);
    }

    const count = await this.prisma.client.employeeProfile.count({
      where: { schoolId: tenant.schoolId },
    });
    const employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;

    const temporaryPassword = randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    const record = await this.prisma.client.$transaction(async (tx) => {
      const newUser = await tx.user.create({
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
      });

      const profile = await tx.employeeProfile.create({
        data: {
          userId: newUser.id,
          schoolId: tenant.schoolId,
          employeeId,
          department: dto.department,
          designation: dto.designation,
          joinDate: new Date(dto.joinDate),
          bloodGroup: dto.bloodGroup,
          aadhaar: dto.aadhaar,
          pan: dto.pan,
          qualifications: (dto.qualifications ?? []) as Prisma.InputJsonValue,
          payGrade: dto.payGrade,
          basicSalary: dto.basicSalary,
          hra: dto.hra,
          da: dto.da,
          pfPercent: dto.pfPercent,
          tdsPercent: dto.tdsPercent,
          employmentType: dto.employmentType,
          ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        },
        include: EMPLOYEE_INCLUDE,
      });

      const leaveTypes = ['CL', 'SL', 'EL'] as const;
      const defaults: Record<(typeof leaveTypes)[number], number> = {
        CL: 12,
        SL: 10,
        EL: 15,
      };

      for (const type of leaveTypes) {
        await tx.leaveBalance.create({
          data: {
            employeeId: newUser.id,
            type,
            total: defaults[type],
            used: 0,
            remaining: defaults[type],
          },
        });
      }

      return profile;
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'EmployeeProfile',
      entityId: record.id,
      metadata: { email, employeeId },
    });

    return { employee: record, temporaryPassword };
  }

  async updateEmployee(
    tenant: TenantContext,
    id: string,
    dto: UpdateEmployeeDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireEmployee(tenant, id);

    const record = await this.prisma.client.employeeProfile.update({
      where: { id },
      data: {
        ...(dto.department !== undefined ? { department: dto.department } : {}),
        ...(dto.designation !== undefined ? { designation: dto.designation } : {}),
        ...(dto.joinDate !== undefined ? { joinDate: new Date(dto.joinDate) } : {}),
        ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup } : {}),
        ...(dto.aadhaar !== undefined ? { aadhaar: dto.aadhaar } : {}),
        ...(dto.pan !== undefined ? { pan: dto.pan } : {}),
        ...(dto.qualifications !== undefined
          ? { qualifications: dto.qualifications as Prisma.InputJsonValue }
          : {}),
        ...(dto.payGrade !== undefined ? { payGrade: dto.payGrade } : {}),
        ...(dto.basicSalary !== undefined ? { basicSalary: dto.basicSalary } : {}),
        ...(dto.hra !== undefined ? { hra: dto.hra } : {}),
        ...(dto.da !== undefined ? { da: dto.da } : {}),
        ...(dto.pfPercent !== undefined ? { pfPercent: dto.pfPercent } : {}),
        ...(dto.tdsPercent !== undefined ? { tdsPercent: dto.tdsPercent } : {}),
        ...(dto.employmentType !== undefined ? { employmentType: dto.employmentType } : {}),
        ...(dto.dateOfBirth !== undefined
          ? { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }
          : {}),
        ...((dto.firstName !== undefined || dto.lastName !== undefined || dto.phone !== undefined)
          ? {
              user: {
                update: {
                  ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
                  ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
                  ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
                },
              },
            }
          : {}),
      },
      include: EMPLOYEE_INCLUDE,
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'EmployeeProfile',
      entityId: id,
    });

    return record;
  }

  // ─── Leave ───────────────────────────────────────────────────────────────────

  async listLeave(tenant: TenantContext, query: ListLeaveQueryDto): Promise<unknown> {
    return this.prisma.client.leaveRequest.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        substitute: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeaveBalances(tenant: TenantContext, query: LeaveBalancesQueryDto): Promise<unknown> {
    if (query.employeeId) {
      await this.requireEmployeeByUserId(tenant, query.employeeId);
    }

    const employeeIds = query.employeeId
      ? [query.employeeId]
      : (
          await this.prisma.client.employeeProfile.findMany({
            where: { schoolId: tenant.schoolId },
            select: { userId: true },
          })
        ).map((e) => e.userId);

    return this.prisma.client.leaveBalance.findMany({
      where: { employeeId: { in: employeeIds } },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [{ employeeId: 'asc' }, { type: 'asc' }],
    });
  }

  async getLeaveCalendar(tenant: TenantContext, query: LeaveCalendarQueryDto): Promise<unknown> {
    const now = new Date();
    const [year, month] = query.month
      ? query.month.split('-').map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    const start = new Date(year!, month! - 1, 1);
    const end = new Date(year!, month!, 0);

    const leaves = await this.prisma.client.leaveRequest.findMany({
      where: {
        schoolId: tenant.schoolId,
        status: 'APPROVED',
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return { month: `${year}-${String(month).padStart(2, '0')}`, absences: leaves };
  }

  async applyLeave(tenant: TenantContext, dto: ApplyLeaveDto, user: AuthenticatedUser): Promise<unknown> {
    await this.requireEmployeeByUserId(tenant, dto.employeeId);

    const balance = await this.prisma.client.leaveBalance.findUnique({
      where: {
        employeeId_type: { employeeId: dto.employeeId, type: dto.type },
      },
    });

    if (balance && balance.remaining < dto.days) {
      throw new BadRequestException(
        `Insufficient ${dto.type} balance (${balance.remaining} remaining)`,
      );
    }

    const record = await this.prisma.client.leaveRequest.create({
      data: {
        schoolId: tenant.schoolId,
        employeeId: dto.employeeId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        days: dto.days,
        reason: dto.reason,
        substituteId: dto.substituteId,
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'LeaveRequest',
      entityId: record.id,
    });

    return record;
  }

  async updateLeave(
    tenant: TenantContext,
    id: string,
    dto: UpdateLeaveDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const leave = await this.prisma.client.leaveRequest.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.status !== 'PENDING') {
      throw new BadRequestException('Leave request has already been processed');
    }

    const record = await this.prisma.client.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.substituteId !== undefined ? { substituteId: dto.substituteId } : {}),
        },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          substitute: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (dto.status === 'APPROVED') {
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_type: { employeeId: leave.employeeId, type: leave.type },
          },
        });

        if (balance) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              used: balance.used + leave.days,
              remaining: Math.max(0, balance.remaining - leave.days),
            },
          });
        }
      }

      return updated;
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'LeaveRequest',
      entityId: id,
      metadata: { status: dto.status },
    });

    return record;
  }

  async getLeaveTrends(tenant: TenantContext): Promise<unknown> {
    const leaves = await this.prisma.client.leaveRequest.findMany({
      where: { schoolId: tenant.schoolId, status: 'APPROVED' },
      select: { type: true, startDate: true, days: true },
    });

    const byMonth: Record<string, Record<string, number>> = {};

    for (const leave of leaves) {
      const d = leave.startDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { CL: 0, SL: 0, EL: 0, ML: 0, PL: 0 };
      byMonth[key]![leave.type] = (byMonth[key]![leave.type] ?? 0) + leave.days;
    }

    const months = Object.keys(byMonth).sort();
    return {
      labels: months,
      datasets: ['CL', 'SL', 'EL', 'ML', 'PL'].map((type) => ({
        type,
        data: months.map((m) => byMonth[m]?.[type] ?? 0),
      })),
    };
  }

  // ─── Payroll ─────────────────────────────────────────────────────────────────

  async listPayrollRuns(tenant: TenantContext, query: ListPayrollQueryDto): Promise<unknown> {
    return this.prisma.client.payrollRun.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.month !== undefined ? { month: query.month } : {}),
        ...(query.year !== undefined ? { year: query.year } : {}),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getPayrollRun(tenant: TenantContext, id: string): Promise<unknown> {
    const run = await this.prisma.client.payrollRun.findFirst({
      where: { id, schoolId: tenant.schoolId },
      include: {
        entries: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { employee: { lastName: 'asc' } },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Payroll run not found');
    }

    return run;
  }

  async runPayroll(tenant: TenantContext, dto: RunPayrollDto, user: AuthenticatedUser): Promise<unknown> {
    const existing = await this.prisma.client.payrollRun.findUnique({
      where: {
        schoolId_month_year: {
          schoolId: tenant.schoolId,
          month: dto.month,
          year: dto.year,
        },
      },
    });

    if (existing && existing.status !== 'DRAFT') {
      throw new ConflictException('Payroll for this month has already been processed');
    }

    const employees = await this.prisma.client.employeeProfile.findMany({
      where: { schoolId: tenant.schoolId },
    });

    if (employees.length === 0) {
      throw new BadRequestException('No employees found for payroll');
    }

    const run = await this.prisma.client.$transaction(async (tx) => {
      const payrollRun =
        existing ??
        (await tx.payrollRun.create({
          data: {
            schoolId: tenant.schoolId,
            month: dto.month,
            year: dto.year,
            status: 'DRAFT',
          },
        }));

      let totalPayable = 0;
      let totalPf = 0;
      let totalTds = 0;
      let netPayable = 0;

      for (const emp of employees) {
        const basic = decimalToNumber(emp.basicSalary);
        const hra = decimalToNumber(emp.hra);
        const da = decimalToNumber(emp.da);
        const gross = basic + hra + da;
        const pf = Math.round(gross * (decimalToNumber(emp.pfPercent) / 100) * 100) / 100;
        const tds = Math.round(gross * (decimalToNumber(emp.tdsPercent) / 100) * 100) / 100;
        const net = Math.round((gross - pf - tds) * 100) / 100;

        totalPayable += gross;
        totalPf += pf;
        totalTds += tds;
        netPayable += net;

        await tx.payrollEntry.upsert({
          where: {
            payrollRunId_employeeId: {
              payrollRunId: payrollRun.id,
              employeeId: emp.userId,
            },
          },
          create: {
            payrollRunId: payrollRun.id,
            employeeId: emp.userId,
            basic,
            hra,
            da,
            pf,
            tds,
            net,
            status: 'PROCESSED',
          },
          update: { basic, hra, da, pf, tds, net, status: 'PROCESSED' },
        });
      }

      return tx.payrollRun.update({
        where: { id: payrollRun.id },
        data: {
          status: 'PROCESSED',
          totalPayable,
          totalPf,
          totalTds,
          netPayable,
          processedAt: new Date(),
        },
        include: {
          entries: {
            include: {
              employee: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'PayrollRun',
      entityId: run.id,
      metadata: { month: dto.month, year: dto.year },
    });

    return run;
  }

  async markPayrollPaid(tenant: TenantContext, id: string, user: AuthenticatedUser): Promise<unknown> {
    const run = await this.prisma.client.payrollRun.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });

    if (!run) {
      throw new NotFoundException('Payroll run not found');
    }

    if (run.status !== 'PROCESSED') {
      throw new BadRequestException('Payroll must be processed before marking as paid');
    }

    const updated = await this.prisma.client.$transaction(async (tx) => {
      await tx.payrollEntry.updateMany({
        where: { payrollRunId: id },
        data: { status: 'PAID' },
      });

      return tx.payrollRun.update({
        where: { id },
        data: { status: 'PAID' },
      });
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'PayrollRun',
      entityId: id,
      metadata: { status: 'PAID' },
    });

    return updated;
  }

  async getSalarySlip(tenant: TenantContext, runId: string, employeeId: string): Promise<unknown> {
    const run = await this.prisma.client.payrollRun.findFirst({
      where: { id: runId, schoolId: tenant.schoolId },
    });

    if (!run) {
      throw new NotFoundException('Payroll run not found');
    }

    const entry = await this.prisma.client.payrollEntry.findUnique({
      where: {
        payrollRunId_employeeId: { payrollRunId: runId, employeeId },
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Payroll entry not found for employee');
    }

    const profile = await this.prisma.client.employeeProfile.findUnique({
      where: { userId: employeeId },
    });

    return {
      run: {
        id: run.id,
        month: run.month,
        year: run.year,
        status: run.status,
      },
      employee: entry.employee,
      profile: profile
        ? {
            employeeId: profile.employeeId,
            department: profile.department,
            designation: profile.designation,
            payGrade: profile.payGrade,
          }
        : null,
      earnings: {
        basic: decimalToNumber(entry.basic),
        hra: decimalToNumber(entry.hra),
        da: decimalToNumber(entry.da),
        gross:
          decimalToNumber(entry.basic) +
          decimalToNumber(entry.hra) +
          decimalToNumber(entry.da),
      },
      deductions: {
        pf: decimalToNumber(entry.pf),
        tds: decimalToNumber(entry.tds),
      },
      net: decimalToNumber(entry.net),
      status: entry.status,
    };
  }

  // ─── Substitution ────────────────────────────────────────────────────────────

  async listSubstitutions(tenant: TenantContext, query: ListSubstitutionsQueryDto): Promise<unknown> {
    const date = query.date ? new Date(query.date) : new Date();

    return this.prisma.client.substitutionAssignment.findMany({
      where: {
        schoolId: tenant.schoolId,
        date,
      },
      include: {
        absentTeacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        substituteTeacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ period: 'asc' }],
    });
  }

  async assignSubstitution(
    tenant: TenantContext,
    dto: AssignSubstitutionDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireEmployeeByUserId(tenant, dto.absentTeacherId);
    await this.requireEmployeeByUserId(tenant, dto.substituteTeacherId);

    const aiMatchScore = mockAiMatchScore(dto.substituteTeacherId, dto.absentTeacherId);

    const record = await this.prisma.client.substitutionAssignment.create({
      data: {
        schoolId: tenant.schoolId,
        absentTeacherId: dto.absentTeacherId,
        substituteTeacherId: dto.substituteTeacherId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        date: new Date(dto.date),
        period: dto.period,
        status: 'ASSIGNED',
        aiMatchScore,
      },
      include: {
        absentTeacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        substituteTeacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'SubstitutionAssignment',
      entityId: record.id,
    });

    return record;
  }

  async getSubstitutionSuggestions(
    tenant: TenantContext,
    query: SubstitutionSuggestionsQueryDto,
  ): Promise<unknown> {
    await this.requireEmployeeByUserId(tenant, query.absentTeacherId);

    const date = new Date(query.date);
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

    const absentSlots = await this.prisma.client.timetableSlot.findMany({
      where: { schoolId: tenant.schoolId, teacherId: query.absentTeacherId, dayOfWeek },
      include: { subject: { select: { id: true, name: true, code: true } } },
    });

    const teachingStaff = await this.prisma.client.employeeProfile.findMany({
      where: {
        schoolId: tenant.schoolId,
        employmentType: 'TEACHING',
        userId: { not: query.absentTeacherId },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const suggestions = teachingStaff
      .map((teacher) => ({
        teacher: teacher.user,
        employeeId: teacher.employeeId,
        department: teacher.department,
        aiMatchScore: mockAiMatchScore(teacher.userId, query.absentTeacherId),
        availablePeriods: absentSlots.map((s) => s.period),
      }))
      .sort((a, b) => b.aiMatchScore - a.aiMatchScore);

    return {
      absentTeacherId: query.absentTeacherId,
      date: query.date,
      absentSchedule: absentSlots,
      suggestions,
    };
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  async getFacultyAnalytics(tenant: TenantContext): Promise<unknown> {
    const profiles = await this.prisma.client.employeeProfile.findMany({
      where: { schoolId: tenant.schoolId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, isActive: true } },
      },
    });

    const deptMap: Record<
      string,
      { count: number; teaching: number; nonTeaching: number; contract: number }
    > = {};

    for (const p of profiles) {
      if (!deptMap[p.department]) {
        deptMap[p.department] = { count: 0, teaching: 0, nonTeaching: 0, contract: 0 };
      }
      const dept = deptMap[p.department]!;
      dept.count++;
      if (p.employmentType === 'TEACHING') dept.teaching++;
      else if (p.employmentType === 'NON_TEACHING') dept.nonTeaching++;
      else dept.contract++;
    }

    const now = new Date();
    const thirtyDaysOut = new Date(now);
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

    const contractsExpiring = profiles
      .filter((p) => {
        if (p.employmentType !== 'CONTRACT') return false;
        const expiry = new Date(p.joinDate);
        expiry.setFullYear(expiry.getFullYear() + 1);
        return expiry <= thirtyDaysOut && expiry >= now;
      })
      .map((p) => {
        const expiry = new Date(p.joinDate);
        expiry.setFullYear(expiry.getFullYear() + 1);
        return {
          employeeId: p.employeeId,
          name: `${p.user.firstName} ${p.user.lastName}`,
          department: p.department,
          contractExpiry: expiry.toISOString().slice(0, 10),
          aiAlert: true,
          aiRiskScore: mockAiMatchScore(p.userId, 'contract-expiry'),
        };
      });

    return {
      totalFaculty: profiles.length,
      activeFaculty: profiles.filter((p) => p.user.isActive).length,
      byDepartment: Object.entries(deptMap).map(([department, metrics]) => ({
        department,
        ...metrics,
      })),
      contractsExpiring,
      aiInsights: {
        renewalRecommended: contractsExpiring.length,
        message:
          contractsExpiring.length > 0
            ? `${contractsExpiring.length} contract(s) expiring within 30 days — review recommended`
            : 'No contract renewals due in the next 30 days',
      },
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async requireEmployee(tenant: TenantContext, id: string) {
    const profile = await this.prisma.client.employeeProfile.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });

    if (!profile) {
      throw new NotFoundException('Employee not found');
    }

    return profile;
  }

  private async requireEmployeeByUserId(tenant: TenantContext, userId: string) {
    const profile = await this.prisma.client.employeeProfile.findFirst({
      where: { userId, schoolId: tenant.schoolId },
    });

    if (!profile) {
      throw new NotFoundException('Employee not found');
    }

    return profile;
  }
}
