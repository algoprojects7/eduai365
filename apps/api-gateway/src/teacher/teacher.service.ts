import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  TenantContext,
} from '@eduai365/shared-types';
import { AuditService } from '../common/audit/audit.service';
import {
  getTodayDayOfWeek,
  mockDailyAttendanceStatus,
  parseDateOnly,
} from '../common/portal/portal.helpers';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateHomeworkDto } from '../academics/dto/homework.dto';
import type { AttendanceQueryDto, MarkAttendanceDto } from './dto/attendance.dto';

const TIMETABLE_SLOT_INCLUDE = {
  subject: { select: { id: true, name: true, code: true } },
  class: { select: { id: true, name: true, grade: true } },
  section: { select: { id: true, name: true } },
} as const;

@Injectable()
export class TeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getDashboard(tenant: TenantContext, userId: string): Promise<unknown> {
    const myClasses = await this.getAssignedClasses(tenant, userId);
    const classIds = myClasses.map((c) => c.classId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const todayRecords =
      classIds.length > 0
        ? await this.prisma.client.attendanceRecord.findMany({
            where: {
              schoolId: tenant.schoolId,
              classId: { in: classIds },
              date: today,
            },
            include: {
              student: {
                select: { id: true, firstName: true, lastName: true, admissionNo: true },
              },
            },
          })
        : [];

    const todayAttendance =
      todayRecords.length > 0
        ? todayRecords.map((r) => ({
            studentId: r.studentId,
            studentName: `${r.student.firstName} ${r.student.lastName}`,
            admissionNo: r.student.admissionNo,
            classId: r.classId,
            status: r.status,
          }))
        : classIds.flatMap((classId) => {
            const cls = myClasses.find((c) => c.classId === classId);
            return (cls?.students ?? []).slice(0, 5).map((s) => ({
              studentId: s.id,
              studentName: `${s.firstName} ${s.lastName}`,
              admissionNo: s.admissionNo,
              classId,
              status: mockDailyAttendanceStatus(s.id, todayStr),
            }));
          });

    const pendingHomework = await this.prisma.client.homeworkAssignment.findMany({
      where: {
        schoolId: tenant.schoolId,
        createdById: userId,
        status: { in: ['DRAFT', 'PUBLISHED'] },
        dueDate: { gte: today },
      },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    const examDuty = await this.prisma.client.examScheduleEntry.findMany({
      where: {
        classId: classIds.length > 0 ? { in: classIds } : undefined,
        date: { gte: today },
        exam: { schoolId: tenant.schoolId, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      },
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        exam: { select: { id: true, name: true, term: true } },
      },
      orderBy: { date: 'asc' },
      take: 5,
    });

    const parentMessages = [
      {
        id: 'msg-1',
        from: 'Fatima Adeyemi',
        subject: 'Chioma — Math homework clarification',
        preview: 'Could you please share the worksheet answers for chapter 5?',
        receivedAt: new Date(Date.now() - 86400000).toISOString(),
        unread: true,
      },
      {
        id: 'msg-2',
        from: 'Emeka Okonkwo',
        subject: 'Parent-teacher meeting request',
        preview: 'I would like to schedule a meeting regarding Emeka\'s progress.',
        receivedAt: new Date(Date.now() - 172800000).toISOString(),
        unread: false,
      },
    ];

    return { myClasses, todayAttendance, pendingHomework, examDuty, parentMessages };
  }

  async getClasses(tenant: TenantContext, userId: string): Promise<unknown> {
    return this.getAssignedClasses(tenant, userId);
  }

  async getAttendance(
    tenant: TenantContext,
    query: AttendanceQueryDto,
  ): Promise<unknown> {
    const date = parseDateOnly(query.date);
    const dateStr = query.date.slice(0, 10);

    const students = await this.prisma.client.student.findMany({
      where: {
        schoolId: tenant.schoolId,
        classId: query.classId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { admissionNo: 'asc' },
    });

    const records = await this.prisma.client.attendanceRecord.findMany({
      where: {
        schoolId: tenant.schoolId,
        classId: query.classId,
        date,
      },
    });

    const recordMap = new Map(records.map((r) => [r.studentId, r.status]));

    return {
      classId: query.classId,
      date: dateStr,
      students: students.map((s) => ({
        studentId: s.id,
        admissionNo: s.admissionNo,
        name: `${s.firstName} ${s.lastName}`,
        status: recordMap.get(s.id) ?? mockDailyAttendanceStatus(s.id, dateStr),
      })),
    };
  }

  async markAttendance(
    tenant: TenantContext,
    dto: MarkAttendanceDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const date = parseDateOnly(dto.date);

    const classExists = await this.prisma.client.class.findFirst({
      where: { id: dto.classId, schoolId: tenant.schoolId },
    });
    if (!classExists) {
      throw new NotFoundException('Class not found');
    }

    const updated = [];
    for (const record of dto.records) {
      const student = await this.prisma.client.student.findFirst({
        where: {
          id: record.studentId,
          schoolId: tenant.schoolId,
          classId: dto.classId,
        },
      });
      if (!student) {
        throw new BadRequestException(`Student ${record.studentId} not in class`);
      }

      const saved = await this.prisma.client.attendanceRecord.upsert({
        where: {
          studentId_date: { studentId: record.studentId, date },
        },
        update: {
          status: record.status,
          markedById: actor.id,
          classId: dto.classId,
        },
        create: {
          schoolId: tenant.schoolId,
          classId: dto.classId,
          studentId: record.studentId,
          date,
          status: record.status,
          markedById: actor.id,
        },
      });
      updated.push(saved);
    }

    await this.audit.log({
      action: 'attendance.mark',
      entity: 'AttendanceRecord',
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { classId: dto.classId, date: dto.date, count: updated.length },
    });

    return { updated: updated.length, records: updated };
  }

  async getGradebook(tenant: TenantContext, classId: string): Promise<unknown> {
    const exam = await this.prisma.client.exam.findFirst({
      where: {
        schoolId: tenant.schoolId,
        status: { in: ['COMPLETED', 'PUBLISHED', 'SCHEDULED'] },
      },
      orderBy: { startDate: 'desc' },
    });

    if (!exam) {
      return { exam: null, subjects: [], grid: [] };
    }

    const scheduleEntries = await this.prisma.client.examScheduleEntry.findMany({
      where: { examId: exam.id, classId },
      include: { subject: { select: { id: true, name: true, code: true } } },
    });

    const students = await this.prisma.client.student.findMany({
      where: { schoolId: tenant.schoolId, classId, status: 'ACTIVE' },
      select: { id: true, admissionNo: true, firstName: true, lastName: true },
      orderBy: { admissionNo: 'asc' },
    });

    const results = await this.prisma.client.examResult.findMany({
      where: { examId: exam.id, studentId: { in: students.map((s) => s.id) } },
    });

    const resultMap = new Map(
      results.map((r) => [`${r.studentId}:${r.subjectId}`, r]),
    );

    const grid = students.map((student) => ({
      student,
      marks: scheduleEntries.map((entry) => {
        const result = resultMap.get(`${student.id}:${entry.subjectId}`);
        return {
          subjectId: entry.subjectId,
          subjectName: entry.subject.name,
          maxMarks: entry.maxMarks,
          marksObtained: result?.marksObtained ?? null,
          grade: result?.grade ?? null,
        };
      }),
    }));

    return {
      exam: { id: exam.id, name: exam.name, term: exam.term },
      subjects: scheduleEntries.map((e) => ({
        id: e.subjectId,
        name: e.subject.name,
        maxMarks: e.maxMarks,
      })),
      grid,
    };
  }

  async listHomework(tenant: TenantContext, userId: string): Promise<unknown> {
    return this.prisma.client.homeworkAssignment.findMany({
      where: { schoolId: tenant.schoolId, createdById: userId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async createHomework(
    tenant: TenantContext,
    dto: CreateHomeworkDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const homework = await this.prisma.client.homeworkAssignment.create({
      data: {
        schoolId: tenant.schoolId,
        title: dto.title,
        subjectId: dto.subjectId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        dueDate: new Date(dto.dueDate),
        status: dto.status ?? 'DRAFT',
        description: dto.description,
        createdById: actor.id,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, grade: true } },
      },
    });

    await this.audit.log({
      action: 'homework.create',
      entity: 'HomeworkAssignment',
      entityId: homework.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
    });

    return homework;
  }

  async getTodayTimetable(tenant: TenantContext, userId: string): Promise<unknown> {
    const dayOfWeek = getTodayDayOfWeek();
    if (dayOfWeek > 6) {
      return { dayOfWeek, periods: [] };
    }

    const slots = await this.prisma.client.timetableSlot.findMany({
      where: {
        schoolId: tenant.schoolId,
        teacherId: userId,
        dayOfWeek,
      },
      include: TIMETABLE_SLOT_INCLUDE,
      orderBy: { period: 'asc' },
    });

    return { dayOfWeek, periods: slots };
  }

  private async getAssignedClasses(tenant: TenantContext, userId: string) {
    const slots = await this.prisma.client.timetableSlot.findMany({
      where: { schoolId: tenant.schoolId, teacherId: userId },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    const byClass = new Map<
      string,
      {
        classId: string;
        className: string;
        grade: string;
        sectionId: string | null;
        sectionName: string | null;
        subjects: Array<{ id: string; name: string; code: string }>;
        studentCount: number;
        students: Array<{ id: string; firstName: string; lastName: string; admissionNo: string }>;
      }
    >();

    for (const slot of slots) {
      if (!slot.classId || !slot.class) continue;
      const key = `${slot.classId}:${slot.sectionId ?? 'all'}`;
      if (!byClass.has(key)) {
        const studentCount = await this.prisma.client.student.count({
          where: {
            schoolId: tenant.schoolId,
            classId: slot.classId,
            ...(slot.sectionId ? { sectionId: slot.sectionId } : {}),
            status: 'ACTIVE',
          },
        });

        const students = await this.prisma.client.student.findMany({
          where: {
            schoolId: tenant.schoolId,
            classId: slot.classId,
            ...(slot.sectionId ? { sectionId: slot.sectionId } : {}),
            status: 'ACTIVE',
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
          },
          take: 50,
        });

        byClass.set(key, {
          classId: slot.classId,
          className: slot.class.name,
          grade: slot.class.grade,
          sectionId: slot.sectionId,
          sectionName: slot.section?.name ?? null,
          subjects: [],
          studentCount,
          students,
        });
      }

      const entry = byClass.get(key)!;
      if (slot.subject && !entry.subjects.some((s) => s.id === slot.subjectId)) {
        entry.subjects.push(slot.subject);
      }
    }

    return [...byClass.values()];
  }
}
