import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  TenantContext,
} from '@eduai365/shared-types';
import type { AdmissionStage } from '@eduai365/database';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdvanceAdmissionStageDto,
  CreateAdmissionDto,
  ListAdmissionsQueryDto,
  UpdateAdmissionDto,
} from './dto/admissions.dto';
import type {
  CalendarEventsQueryDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
} from './dto/calendar.dto';
import type {
  ClassReportCardsQueryDto,
  CreateExamDto,
  CreateExamScheduleEntryDto,
  ExamResultsQueryDto,
  ReportCardsQueryDto,
  UpdateExamResultDto,
  UpdateExamStatusDto,
} from './dto/exams.dto';
import type { CreateHomeworkDto, ListHomeworkQueryDto } from './dto/homework.dto';
import type {
  ClassTimetableQueryDto,
  TeacherTimetableQueryDto,
  TimetableConflictsQueryDto,
  UpsertTimetableSlotDto,
} from './dto/timetable.dto';
import type { CreateSubjectsBatchDto, UpdateSubjectDto } from './dto/subjects.dto';

const ADMISSION_STAGE_ORDER: AdmissionStage[] = [
  'INQUIRY',
  'APPLICATION',
  'ENTRANCE_TEST',
  'INTERVIEW',
  'OFFER',
  'FEE_PAID',
  'ENROLLED',
];

const SHORTLISTED_STAGES: AdmissionStage[] = [
  'ENTRANCE_TEST',
  'INTERVIEW',
  'OFFER',
  'FEE_PAID',
];

const TIMETABLE_SLOT_INCLUDE = {
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, firstName: true, lastName: true } },
  class: { select: { id: true, name: true, grade: true } },
  section: { select: { id: true, name: true } },
} as const;

function computeGrade(marks: number, maxMarks: number): string {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

function mockAttendance(studentId: string): number {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash + studentId.charCodeAt(i) * (i + 1)) % 100;
  }
  return 82 + (hash % 15);
}

@Injectable()
export class AcademicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Admissions ────────────────────────────────────────────────────────────

  async listAdmissions(
    tenant: TenantContext,
    query: ListAdmissionsQueryDto,
  ): Promise<unknown> {
    const where = {
      schoolId: tenant.schoolId,
      ...(query.stage ? { stage: query.stage } : {}),
    };

    const applications = await this.prisma.client.admissionApplication.findMany({
      where,
      orderBy: [{ stage: 'asc' }, { createdAt: 'desc' }],
    });

    if (query.groupBy === 'stage') {
      const grouped = ADMISSION_STAGE_ORDER.reduce<
        Record<string, typeof applications>
      >((acc, stage) => {
        acc[stage] = applications.filter((a) => a.stage === stage);
        return acc;
      }, {});
      return { applications, grouped };
    }

    return { applications };
  }

  async getAdmissionStats(tenant: TenantContext): Promise<unknown> {
    const schoolId = tenant.schoolId;

    const [total, shortlisted, enrolled, capacities] = await Promise.all([
      this.prisma.client.admissionApplication.count({ where: { schoolId } }),
      this.prisma.client.admissionApplication.count({
        where: { schoolId, stage: { in: SHORTLISTED_STAGES } },
      }),
      this.prisma.client.admissionApplication.count({
        where: { schoolId, stage: 'ENROLLED' },
      }),
      this.prisma.client.classSeatCapacity.findMany({ where: { schoolId } }),
    ]);

    const seatsRemaining = capacities.reduce(
      (sum, c) => sum + Math.max(c.totalSeats - c.filledSeats, 0),
      0,
    );

    return { applications: total, shortlisted, enrolled, seatsRemaining };
  }

  async getSeatMatrix(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.classSeatCapacity.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: { grade: 'asc' },
    });
  }

  async createAdmission(
    tenant: TenantContext,
    dto: CreateAdmissionDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const application = await this.prisma.client.admissionApplication.create({
      data: {
        schoolId: tenant.schoolId,
        applicantName: dto.applicantName,
        parentName: dto.parentName,
        parentEmail: dto.parentEmail,
        parentPhone: dto.parentPhone,
        targetClass: dto.targetClass,
        previousSchool: dto.previousSchool,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        address: dto.address,
        parentWhatsapp: dto.parentWhatsapp,
        stage: dto.stage ?? 'INQUIRY',
        documents: dto.documents ?? [],
        notes: dto.notes,
      },
    });

    await this.audit.log({
      action: 'admission.create',
      entity: 'AdmissionApplication',
      entityId: application.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { applicantName: dto.applicantName, stage: application.stage },
    });

    return application;
  }

  async updateAdmission(
    tenant: TenantContext,
    id: string,
    dto: UpdateAdmissionDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    await this.ensureAdmission(id, tenant.schoolId);

    const application = await this.prisma.client.admissionApplication.update({
      where: { id },
      data: {
        ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.aiScore !== undefined ? { aiScore: dto.aiScore } : {}),
      },
    });

    await this.audit.log({
      action: 'admission.update',
      entity: 'AdmissionApplication',
      entityId: id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: dto as Record<string, unknown>,
    });

    return application;
  }

  async advanceAdmissionStage(
    tenant: TenantContext,
    id: string,
    dto: AdvanceAdmissionStageDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.ensureAdmission(id, tenant.schoolId);
    const currentIndex = ADMISSION_STAGE_ORDER.indexOf(existing.stage as AdmissionStage);

    let nextStage: AdmissionStage;
    if (dto.stage) {
      nextStage = dto.stage;
    } else if (currentIndex < ADMISSION_STAGE_ORDER.length - 1) {
      nextStage = ADMISSION_STAGE_ORDER[currentIndex + 1]!;
    } else {
      throw new BadRequestException('Application is already at the final stage');
    }

    const application = await this.prisma.client.admissionApplication.update({
      where: { id },
      data: { stage: nextStage },
    });

    await this.audit.log({
      action: 'admission.advance_stage',
      entity: 'AdmissionApplication',
      entityId: id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { from: existing.stage, to: nextStage },
    });

    return application;
  }

  private async ensureAdmission(id: string, schoolId: string) {
    const application = await this.prisma.client.admissionApplication.findFirst({
      where: { id, schoolId },
    });
    if (!application) {
      throw new NotFoundException('Admission application not found');
    }
    return application;
  }

  // ─── Timetable ─────────────────────────────────────────────────────────────

  async getClassTimetable(
    tenant: TenantContext,
    query: ClassTimetableQueryDto,
  ): Promise<unknown> {
    const slots = await this.prisma.client.timetableSlot.findMany({
      where: {
        schoolId: tenant.schoolId,
        classId: query.classId,
        ...(query.sectionId ? { sectionId: query.sectionId } : {}),
      },
      include: TIMETABLE_SLOT_INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });

    const grid: Record<number, Record<number, (typeof slots)[number] | null>> = {};
    for (let day = 1; day <= 6; day++) {
      grid[day] = {};
      for (let period = 1; period <= 8; period++) {
        grid[day]![period] = null;
      }
    }

    for (const slot of slots) {
      if (slot.dayOfWeek >= 1 && slot.dayOfWeek <= 6 && slot.period >= 1 && slot.period <= 8) {
        grid[slot.dayOfWeek]![slot.period] = slot;
      }
    }

    return { slots, grid, days: 6, periods: 8 };
  }

  async getTeacherTimetable(
    tenant: TenantContext,
    query: TeacherTimetableQueryDto,
  ): Promise<unknown> {
    const slots = await this.prisma.client.timetableSlot.findMany({
      where: { schoolId: tenant.schoolId, teacherId: query.teacherId },
      include: TIMETABLE_SLOT_INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });

    return { slots };
  }

  async upsertTimetableSlot(
    tenant: TenantContext,
    dto: UpsertTimetableSlotDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const data = {
      schoolId: tenant.schoolId,
      classId: dto.classId,
      sectionId: dto.sectionId,
      teacherId: dto.teacherId,
      subjectId: dto.subjectId,
      dayOfWeek: dto.dayOfWeek,
      period: dto.period,
      startTime: dto.startTime,
      endTime: dto.endTime,
      room: dto.room,
    };

    let slot;
    if (dto.id) {
      slot = await this.prisma.client.timetableSlot.update({
        where: { id: dto.id },
        data,
        include: TIMETABLE_SLOT_INCLUDE,
      });
    } else {
      const existing = await this.prisma.client.timetableSlot.findFirst({
        where: {
          classId: dto.classId,
          sectionId: dto.sectionId ?? null,
          dayOfWeek: dto.dayOfWeek,
          period: dto.period,
        },
      });

      slot = existing
        ? await this.prisma.client.timetableSlot.update({
            where: { id: existing.id },
            data,
            include: TIMETABLE_SLOT_INCLUDE,
          })
        : await this.prisma.client.timetableSlot.create({
            data,
            include: TIMETABLE_SLOT_INCLUDE,
          });
    }

    await this.audit.log({
      action: dto.id ? 'timetable.update_slot' : 'timetable.create_slot',
      entity: 'TimetableSlot',
      entityId: slot.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
    });

    return slot;
  }

  async detectTimetableConflicts(
    tenant: TenantContext,
    query: TimetableConflictsQueryDto,
  ): Promise<unknown> {
    const where = { schoolId: tenant.schoolId };
    const slots = await this.prisma.client.timetableSlot.findMany({
      where,
      include: TIMETABLE_SLOT_INCLUDE,
    });

    const teacherConflicts: Array<{ dayOfWeek: number; period: number; slots: typeof slots }> = [];
    const roomConflicts: Array<{ dayOfWeek: number; period: number; room: string; slots: typeof slots }> = [];

    const byTeacherSlot = new Map<string, typeof slots>();
    const byRoomSlot = new Map<string, typeof slots>();

    for (const slot of slots) {
      if (slot.teacherId) {
        const key = `${slot.teacherId}:${slot.dayOfWeek}:${slot.period}`;
        const group = byTeacherSlot.get(key) ?? [];
        group.push(slot);
        byTeacherSlot.set(key, group);
      }
      if (slot.room) {
        const key = `${slot.room}:${slot.dayOfWeek}:${slot.period}`;
        const group = byRoomSlot.get(key) ?? [];
        group.push(slot);
        byRoomSlot.set(key, group);
      }
    }

    for (const [, group] of byTeacherSlot) {
      if (group.length > 1) {
        teacherConflicts.push({
          dayOfWeek: group[0]!.dayOfWeek,
          period: group[0]!.period,
          slots: group,
        });
      }
    }

    for (const [key, group] of byRoomSlot) {
      if (group.length > 1) {
        const room = key.split(':')[0]!;
        roomConflicts.push({
          dayOfWeek: group[0]!.dayOfWeek,
          period: group[0]!.period,
          room,
          slots: group,
        });
      }
    }

    return {
      teacherConflicts,
      roomConflicts,
      hasConflicts: teacherConflicts.length > 0 || roomConflicts.length > 0,
      filteredBy: query,
    };
  }

  // ─── Exams ─────────────────────────────────────────────────────────────────

  async listExams(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.exam.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: { startDate: 'desc' },
    });
  }

  async getExam(tenant: TenantContext, id: string): Promise<unknown> {
    const exam = await this.prisma.client.exam.findFirst({
      where: { id, schoolId: tenant.schoolId },
      include: {
        scheduleEntries: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true, grade: true } },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return exam;
  }

  async createExam(
    tenant: TenantContext,
    dto: CreateExamDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const exam = await this.prisma.client.exam.create({
      data: {
        schoolId: tenant.schoolId,
        name: dto.name,
        term: dto.term,
        academicYear: dto.academicYear,
        status: dto.status ?? 'DRAFT',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        classes: dto.classes ?? [],
      },
    });

    await this.audit.log({
      action: 'exam.create',
      entity: 'Exam',
      entityId: exam.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { name: dto.name },
    });

    return exam;
  }

  async updateExamStatus(
    tenant: TenantContext,
    id: string,
    dto: UpdateExamStatusDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    await this.ensureExam(id, tenant.schoolId);

    const exam = await this.prisma.client.exam.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.audit.log({
      action: 'exam.update_status',
      entity: 'Exam',
      entityId: id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { status: dto.status },
    });

    return exam;
  }

  async getExamSchedule(tenant: TenantContext, id: string): Promise<unknown> {
    await this.ensureExam(id, tenant.schoolId);

    return this.prisma.client.examScheduleEntry.findMany({
      where: { examId: id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, grade: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async addExamScheduleEntry(
    tenant: TenantContext,
    examId: string,
    dto: CreateExamScheduleEntryDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    await this.ensureExam(examId, tenant.schoolId);

    const entry = await this.prisma.client.examScheduleEntry.create({
      data: {
        examId,
        subjectId: dto.subjectId,
        classId: dto.classId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
        maxMarks: dto.maxMarks,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, grade: true } },
      },
    });

    await this.audit.log({
      action: 'exam.add_schedule',
      entity: 'ExamScheduleEntry',
      entityId: entry.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { examId },
    });

    return entry;
  }

  async getExamResultsGrid(
    tenant: TenantContext,
    examId: string,
    query: ExamResultsQueryDto,
  ): Promise<unknown> {
    const exam = await this.ensureExam(examId, tenant.schoolId);

    const scheduleEntries = await this.prisma.client.examScheduleEntry.findMany({
      where: {
        examId,
        ...(query.classId ? { classId: query.classId } : {}),
      },
      include: { subject: { select: { id: true, name: true, code: true } } },
    });

    const students = await this.prisma.client.student.findMany({
      where: {
        schoolId: tenant.schoolId,
        status: 'ACTIVE',
        ...(query.classId ? { classId: query.classId } : {}),
      },
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        classId: true,
        sectionId: true,
      },
      orderBy: { admissionNo: 'asc' },
    });

    const results = await this.prisma.client.examResult.findMany({
      where: { examId },
    });

    const resultMap = new Map(
      results.map((r) => [`${r.studentId}:${r.subjectId}`, r]),
    );

    const grid = students.map((student) => ({
      student,
      subjects: scheduleEntries.map((entry) => {
        const result = resultMap.get(`${student.id}:${entry.subjectId}`);
        return {
          subjectId: entry.subjectId,
          subjectName: entry.subject.name,
          maxMarks: entry.maxMarks,
          marksObtained: result?.marksObtained ?? null,
          grade: result?.grade ?? null,
          remarks: result?.remarks ?? null,
          resultId: result?.id ?? null,
        };
      }),
    }));

    return { exam, scheduleEntries, grid };
  }

  async updateExamResult(
    tenant: TenantContext,
    examId: string,
    studentId: string,
    dto: UpdateExamResultDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    await this.ensureExam(examId, tenant.schoolId);

    const student = await this.prisma.client.student.findFirst({
      where: { id: studentId, schoolId: tenant.schoolId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const grade = dto.grade ?? computeGrade(dto.marksObtained, dto.maxMarks);

    const result = await this.prisma.client.examResult.upsert({
      where: {
        examId_studentId_subjectId: {
          examId,
          studentId,
          subjectId: dto.subjectId,
        },
      },
      update: {
        marksObtained: dto.marksObtained,
        maxMarks: dto.maxMarks,
        grade,
        remarks: dto.remarks,
      },
      create: {
        examId,
        studentId,
        subjectId: dto.subjectId,
        marksObtained: dto.marksObtained,
        maxMarks: dto.maxMarks,
        grade,
        remarks: dto.remarks,
      },
    });

    await this.audit.log({
      action: 'exam.update_result',
      entity: 'ExamResult',
      entityId: result.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { examId, studentId, subjectId: dto.subjectId },
    });

    return result;
  }

  private async ensureExam(id: string, schoolId: string) {
    const exam = await this.prisma.client.exam.findFirst({
      where: { id, schoolId },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }
    return exam;
  }

  // ─── Calendar ──────────────────────────────────────────────────────────────

  async listCalendarEvents(
    tenant: TenantContext,
    query: CalendarEventsQueryDto,
  ): Promise<unknown> {
    const start = new Date(query.year, query.month - 1, 1);
    const end = new Date(query.year, query.month, 0, 23, 59, 59, 999);

    return this.prisma.client.calendarEvent.findMany({
      where: {
        schoolId: tenant.schoolId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async createCalendarEvent(
    tenant: TenantContext,
    dto: CreateCalendarEventDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const event = await this.prisma.client.calendarEvent.create({
      data: {
        schoolId: tenant.schoolId,
        title: dto.title,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        allDay: dto.allDay ?? false,
        description: dto.description,
        ...(dto.classIds !== undefined ? { classIds: dto.classIds } : {}),
      },
    });

    await this.audit.log({
      action: 'calendar.create',
      entity: 'CalendarEvent',
      entityId: event.id,
      userId: actor.id,
      schoolId: tenant.schoolId,
    });

    return event;
  }

  async updateCalendarEvent(
    tenant: TenantContext,
    id: string,
    dto: UpdateCalendarEventDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    await this.ensureCalendarEvent(id, tenant.schoolId);

    const event = await this.prisma.client.calendarEvent.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        ...(dto.allDay !== undefined ? { allDay: dto.allDay } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.classIds !== undefined ? { classIds: dto.classIds } : {}),
      },
    });

    await this.audit.log({
      action: 'calendar.update',
      entity: 'CalendarEvent',
      entityId: id,
      userId: actor.id,
      schoolId: tenant.schoolId,
    });

    return event;
  }

  async deleteCalendarEvent(
    tenant: TenantContext,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    await this.ensureCalendarEvent(id, tenant.schoolId);

    await this.prisma.client.calendarEvent.delete({ where: { id } });

    await this.audit.log({
      action: 'calendar.delete',
      entity: 'CalendarEvent',
      entityId: id,
      userId: actor.id,
      schoolId: tenant.schoolId,
    });

    return { deleted: true, id };
  }

  private async ensureCalendarEvent(id: string, schoolId: string) {
    const event = await this.prisma.client.calendarEvent.findFirst({
      where: { id, schoolId },
    });
    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }
    return event;
  }

  // ─── Homework ──────────────────────────────────────────────────────────────

  async listHomework(tenant: TenantContext, query: ListHomeworkQueryDto): Promise<unknown> {
    return this.prisma.client.homeworkAssignment.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.classId ? { classId: query.classId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
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

  // ─── Report Cards ──────────────────────────────────────────────────────────

  async getStudentReportCard(tenant: TenantContext, query: ReportCardsQueryDto): Promise<unknown> {
    if (!query.studentId) {
      throw new BadRequestException('studentId is required');
    }

    const student = await this.prisma.client.student.findFirst({
      where: { id: query.studentId, schoolId: tenant.schoolId },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const term = query.term ?? 'Term 1';
    const exams = await this.prisma.client.exam.findMany({
      where: {
        schoolId: tenant.schoolId,
        term,
      },
    });

    const examIds = exams.map((e) => e.id);
    const results = await this.prisma.client.examResult.findMany({
      where: { examId: { in: examIds }, studentId: student.id },
      include: { subject: { select: { id: true, name: true, code: true } } },
    });

    const subjects = results.map((r) => ({
      subjectId: r.subjectId,
      subjectName: r.subject.name,
      marksObtained: r.marksObtained,
      maxMarks: r.maxMarks,
      grade: r.grade,
      remarks: r.remarks,
    }));

    const totalMarks = subjects.reduce((s, x) => s + x.marksObtained, 0);
    const totalMax = subjects.reduce((s, x) => s + x.maxMarks, 0);
    const percentage = totalMax > 0 ? Math.round((totalMarks / totalMax) * 1000) / 10 : 0;
    const attendance = mockAttendance(student.id);

    return {
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        class: student.class,
        section: student.section,
      },
      term,
      subjects,
      summary: {
        totalMarks,
        totalMax,
        percentage,
        overallGrade: computeGrade(totalMarks, totalMax || 100),
        attendancePercent: attendance,
      },
      remarks: percentage >= 75
        ? 'Excellent performance. Keep up the good work.'
        : percentage >= 50
          ? 'Satisfactory progress. Focus on weaker subjects.'
          : 'Needs improvement. Additional support recommended.',
      aiInsights: {
        strengthAreas: subjects.filter((s) => s.grade && ['A+', 'A', 'B+'].includes(s.grade)).map((s) => s.subjectName),
        improvementAreas: subjects.filter((s) => s.grade && ['C', 'D', 'F'].includes(s.grade ?? '')).map((s) => s.subjectName),
        prediction: attendance >= 90
          ? 'High likelihood of term-end distinction'
          : 'Monitor attendance to maintain academic standing',
      },
    };
  }

  async getClassReportCards(
    tenant: TenantContext,
    query: ClassReportCardsQueryDto,
  ): Promise<unknown> {
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

    const cards = await Promise.all(
      students.map((s) =>
        this.getStudentReportCard(tenant, {
          studentId: s.id,
          term: query.term,
        }),
      ),
    );

    return { classId: query.classId, term: query.term ?? 'Term 1', reportCards: cards };
  }

  // ─── Subjects ──────────────────────────────────────────────────────────────

  async createSubjectsBatch(
    tenant: TenantContext,
    dto: CreateSubjectsBatchDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.subject.findMany({
      where: {
        schoolId: tenant.schoolId,
        className: dto.className,
        academicYear: dto.session,
        isActive: true,
      },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));
    const incomingNames = new Set<string>();

    for (const subject of dto.subjects) {
      const nameLower = subject.name.trim().toLowerCase();
      if (!nameLower) continue;

      if (incomingNames.has(nameLower)) {
        throw new BadRequestException(`Duplicate subject in batch: ${subject.name}`);
      }
      if (existingNames.has(nameLower)) {
        throw new BadRequestException(`Duplicate subject found: ${subject.name} already exists for this class and session.`);
      }
      incomingNames.add(nameLower);
    }

    const results = [];
    for (const subject of dto.subjects) {
      if (!subject.name.trim()) continue;

      const code = subject.name.substring(0, 3).toUpperCase() + dto.className.replace(/[^0-9]/g, '');
      const created = await this.prisma.client.subject.create({
        data: {
          schoolId: tenant.schoolId,
          name: subject.name,
          code,
          className: dto.className,
          academicYear: dto.session,
          maxMarks: subject.maxMarks,
        },
      });
      results.push(created);
    }

    await this.audit.log({
      action: 'subjects.batch_create',
      entity: 'Subject',
      entityId: 'batch',
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { count: results.length, className: dto.className, session: dto.session },
    });

    return results;
  }

  async updateSubject(
    tenant: TenantContext,
    id: string,
    dto: UpdateSubjectDto,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const subject = await this.prisma.client.subject.findUnique({
      where: { id },
    });
    if (!subject || subject.schoolId !== tenant.schoolId) {
      throw new NotFoundException('Subject not found');
    }

    if (dto.name) {
      const nameLower = dto.name.trim().toLowerCase();
      if (nameLower !== subject.name.toLowerCase()) {
        const existing = await this.prisma.client.subject.findFirst({
          where: {
            schoolId: tenant.schoolId,
            className: subject.className,
            academicYear: subject.academicYear,
            name: { equals: dto.name.trim(), mode: 'insensitive' },
            isActive: true,
          },
        });
        if (existing) {
          throw new BadRequestException(`Subject ${dto.name} already exists for this class.`);
        }
      }
    }

    let code = subject.code;
    if (dto.name) {
      code = dto.name.trim().substring(0, 3).toUpperCase() + (subject.className?.replace(/[^0-9]/g, '') || '');
    }

    const updated = await this.prisma.client.subject.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim(), code }),
        ...(dto.maxMarks !== undefined && { maxMarks: dto.maxMarks }),
      },
    });

    await this.audit.log({
      action: 'subjects.update',
      entity: 'Subject',
      entityId: id,
      userId: actor.id,
      schoolId: tenant.schoolId,
    });

    return updated;
  }

  async deleteSubject(
    tenant: TenantContext,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<unknown> {
    const subject = await this.prisma.client.subject.findUnique({
      where: { id },
      include: {
        timetableSlots: { select: { id: true }, take: 1 },
        examScheduleEntries: { select: { id: true }, take: 1 },
        examResults: { select: { id: true }, take: 1 },
      },
    });
    if (!subject || subject.schoolId !== tenant.schoolId) {
      throw new NotFoundException('Subject not found');
    }

    if (
      subject.timetableSlots.length > 0 ||
      subject.examScheduleEntries.length > 0 ||
      subject.examResults.length > 0
    ) {
      throw new BadRequestException('Cannot delete subject that is linked to timetable or exams');
    }

    await this.prisma.client.subject.delete({
      where: { id },
    });

    await this.audit.log({
      action: 'subjects.delete',
      entity: 'Subject',
      entityId: id,
      userId: actor.id,
      schoolId: tenant.schoolId,
    });

    return { id };
  }


  async getSubjects(
    tenant: TenantContext,
    session: string,
    className: string,
  ): Promise<unknown> {
    return this.prisma.client.subject.findMany({
      where: {
        schoolId: tenant.schoolId,
        academicYear: session,
        className,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
