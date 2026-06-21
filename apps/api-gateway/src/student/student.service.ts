import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TenantContext } from '@eduai365/shared-types';
import {
  computeGrade,
  decimalToNumber,
  endOfMonth,
  getTodayDayOfWeek,
  startOfMonth,
} from '../common/portal/portal.helpers';
import { PrismaService } from '../prisma/prisma.service';

const TIMETABLE_SLOT_INCLUDE = {
  subject: { select: { id: true, name: true, code: true } },
  class: { select: { id: true, name: true, grade: true } },
  section: { select: { id: true, name: true } },
  teacher: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenant: TenantContext, userId: string): Promise<unknown> {
    const student = await this.requireStudentByUser(tenant, userId);

    const [courses, upcomingAssignments, feeStatus, todayTimetable] = await Promise.all([
      this.getCourses(tenant, userId),
      this.getAssignments(tenant, userId),
      this.getFeeSummary(tenant, student.id),
      this.getTodayTimetable(tenant, userId),
    ]);

    const attendancePercent = await this.getOverallAttendancePercent(tenant, student.id);

    const libraryBooks = await this.getLibraryHistory(tenant, student.id);

    const dbMemberships = await this.prisma.client.clubMembership.findMany({
      where: { studentId: student.id, status: 'ACTIVE' },
      include: { club: { select: { id: true, name: true } } },
    });
    const clubs = dbMemberships.map((m) => ({
      id: m.club.id,
      name: m.club.name,
      role: 'Member',
    }));

    return {
      courses,
      upcomingAssignments: (upcomingAssignments as Array<{ dueDate: string; status: string }>).slice(0, 5),
      attendancePercent,
      feeStatus,
      todayTimetable,
      libraryBooks,
      clubs,
    };
  }

  async getLibraryHistory(tenant: TenantContext, studentId: string): Promise<unknown> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const issues = await this.prisma.client.libraryIssue.findMany({
      where: {
        studentId,
        OR: [
          { issuedAt: { gte: threeMonthsAgo } },
          { returnedAt: { gte: threeMonthsAgo } },
        ],
      },
      include: {
        book: {
          select: {
            title: true,
            author: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return issues.map((issue) => ({
      id: issue.id,
      title: issue.book.title,
      author: issue.book.author,
      issuedAt: issue.issuedAt.toISOString(),
      dueDate: issue.dueDate.toISOString(),
      returnedAt: issue.returnedAt ? issue.returnedAt.toISOString() : null,
      status: issue.returnedAt ? 'RETURNED' : 'ISSUED',
    }));
  }

  async getCourses(tenant: TenantContext, userId: string): Promise<unknown> {
    const student = await this.requireStudentByUser(tenant, userId);

    const slots = student.classId
      ? await this.prisma.client.timetableSlot.findMany({
          where: {
            schoolId: tenant.schoolId,
            classId: student.classId,
            ...(student.sectionId ? { sectionId: student.sectionId } : {}),
          },
          include: { subject: { select: { id: true, name: true, code: true } } },
        })
      : [];

    const subjectMap = new Map<string, { id: string; name: string; code: string }>();
    for (const slot of slots) {
      if (slot.subject) subjectMap.set(slot.subject.id, slot.subject);
    }

    const exam = await this.prisma.client.exam.findFirst({
      where: { schoolId: tenant.schoolId, status: { in: ['COMPLETED', 'PUBLISHED', 'SCHEDULED'] } },
      orderBy: { startDate: 'desc' },
    });

    const results = exam
      ? await this.prisma.client.examResult.findMany({
          where: { examId: exam.id, studentId: student.id },
        })
      : [];

    const resultMap = new Map(results.map((r) => [r.subjectId, r]));

    return [...subjectMap.values()].map((subject) => {
      const result = resultMap.get(subject.id);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        code: subject.code,
        grade: result?.grade ?? null,
        marksObtained: result?.marksObtained ?? null,
        maxMarks: result?.maxMarks ?? null,
      };
    });
  }

  async getAssignments(tenant: TenantContext, userId: string): Promise<unknown> {
    const student = await this.requireStudentByUser(tenant, userId);
    if (!student.classId) return [];

    const now = new Date();
    const homework = await this.prisma.client.homeworkAssignment.findMany({
      where: {
        schoolId: tenant.schoolId,
        classId: student.classId,
        status: 'PUBLISHED',
      },
      include: {
        subject: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return homework.map((h) => ({
      id: h.id,
      title: h.title,
      subject: h.subject.name,
      dueDate: h.dueDate.toISOString(),
      status: h.dueDate < now ? 'OVERDUE' : 'PENDING',
      description: h.description,
    }));
  }

  async getAttendance(
    tenant: TenantContext,
    userId: string,
    targetYear?: number,
    targetMonth?: number,
  ): Promise<unknown> {
    const student = await this.requireStudentByUser(tenant, userId);
    const now = new Date();
    const year = targetYear ?? now.getFullYear();
    const month = targetMonth ?? (now.getMonth() + 1);

    const start = startOfMonth(year, month);
    const end = endOfMonth(year, month);
    const daysInMonth = end.getDate();

    const records = await this.prisma.client.attendanceRecord.findMany({
      where: {
        schoolId: tenant.schoolId,
        studentId: student.id,
        date: { gte: start, lte: end },
      },
    });

    const recordMap = new Map(
      records.map((r) => [r.date.toISOString().slice(0, 10), r.status]),
    );

    const heatmap: Array<{ date: string; status: string }> = [];
    let presentDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      if (d > now) break;
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0) continue;

      const status = recordMap.get(dateStr) ?? 'ABSENT';
      if (status === 'PRESENT' || status === 'LATE') presentDays += 1;
      heatmap.push({ date: dateStr, status });
    }

    const totalDays = heatmap.length || 1;
    const overallPercent =
      records.length > 0
        ? Math.round((presentDays / totalDays) * 1000) / 10
        : 0;

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      heatmap,
      overallPercent,
    };
  }

  async getTodayTimetable(tenant: TenantContext, userId: string): Promise<unknown> {
    const student = await this.requireStudentByUser(tenant, userId);
    if (!student.classId) return { dayOfWeek: getTodayDayOfWeek(), periods: [] };

    const dayOfWeek = getTodayDayOfWeek();
    if (dayOfWeek > 6) return { dayOfWeek, periods: [] };

    const slots = await this.prisma.client.timetableSlot.findMany({
      where: {
        schoolId: tenant.schoolId,
        classId: student.classId,
        ...(student.sectionId ? { sectionId: student.sectionId } : {}),
        dayOfWeek,
      },
      include: TIMETABLE_SLOT_INCLUDE,
      orderBy: { period: 'asc' },
    });

    return { dayOfWeek, periods: slots };
  }

  async getFees(tenant: TenantContext, userId: string): Promise<unknown> {
    const student = await this.requireStudentByUser(tenant, userId);
    return this.getFeeSummary(tenant, student.id);
  }

  async getPerformance(tenant: TenantContext, userId: string): Promise<unknown> {
    const student = await this.requireStudentByUser(tenant, userId);

    const exam = await this.prisma.client.exam.findFirst({
      where: { schoolId: tenant.schoolId, status: { in: ['COMPLETED', 'PUBLISHED', 'SCHEDULED'] } },
      orderBy: { startDate: 'desc' },
    });

    if (!exam) {
      return { exam: null, subjects: [], radar: [] };
    }

    const results = await this.prisma.client.examResult.findMany({
      where: { examId: exam.id, studentId: student.id },
      include: { subject: { select: { id: true, name: true, code: true } } },
      take: 6,
    });

    const radar = results.map((r) => ({
      subject: r.subject.name,
      score: Math.round((r.marksObtained / r.maxMarks) * 100),
      marksObtained: r.marksObtained,
      maxMarks: r.maxMarks,
      grade: r.grade ?? computeGrade(r.marksObtained, r.maxMarks),
    }));



    return {
      exam: { id: exam.id, name: exam.name, term: exam.term },
      subjects: radar.map((r) => r.subject),
      radar: radar.slice(0, 6),
    };
  }

  async getResults(tenant: TenantContext, userId: string): Promise<unknown> {
    const student = await this.requireStudentByUser(tenant, userId);

    const results = await this.prisma.client.examResult.findMany({
      where: { studentId: student.id },
      include: {
        exam: true,
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    const examMap = new Map<string, any>();
    for (const r of results) {
      const examId = r.examId;
      if (!examMap.has(examId)) {
        examMap.set(examId, {
          exam: {
            id: r.exam.id,
            name: r.exam.name,
            term: r.exam.term,
            academicYear: r.exam.academicYear,
          },
          results: [],
        });
      }
      examMap.get(examId).results.push({
        subject: r.subject.name,
        score: r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0,
        marksObtained: r.marksObtained,
        maxMarks: r.maxMarks,
        grade: r.grade ?? computeGrade(r.marksObtained, r.maxMarks),
        remarks: r.remarks ?? 'N/A',
      });
    }

    return Array.from(examMap.values());
  }

  private async getFeeSummary(tenant: TenantContext, studentId: string) {
    const invoices = await this.prisma.client.studentInvoice.findMany({
      where: { schoolId: tenant.schoolId, studentId },
      orderBy: { dueDate: 'desc' },
    });

    let outstanding = 0;
    const summary = invoices.map((inv) => {
      const total = decimalToNumber(inv.totalAmount);
      const paid = decimalToNumber(inv.paidAmount);
      const fine = decimalToNumber(inv.lateFine);
      const due = total + fine - paid;
      outstanding += due;
      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        term: inv.term,
        totalAmount: total,
        paidAmount: paid,
        outstanding: due,
        status: inv.status,
        dueDate: inv.dueDate.toISOString(),
      };
    });

    return {
      outstanding,
      status:
        outstanding <= 0
          ? 'PAID'
          : summary.length > 0 && outstanding < (summary[0]?.totalAmount ?? 0)
            ? 'PARTIAL'
            : 'DUE',
      invoices: summary,
    };
  }

  private async getOverallAttendancePercent(tenant: TenantContext, studentId: string) {
    const records = await this.prisma.client.attendanceRecord.findMany({
      where: { schoolId: tenant.schoolId, studentId },
    });

    if (records.length === 0) return 0;

    const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    return Math.round((present / records.length) * 1000) / 10;
  }

  private async requireStudentByUser(tenant: TenantContext, userId: string) {
    const student = await this.prisma.client.student.findFirst({
      where: { schoolId: tenant.schoolId, userId, status: 'ACTIVE' },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        section: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student record not linked to this account');
    }

    return student;
  }
}
