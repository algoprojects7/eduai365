import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TenantContext } from '@eduai365/shared-types';
import {
  computeGrade,
  decimalToNumber,
  endOfMonth,
  gpaFromPercentage,
  startOfMonth,
} from '../common/portal/portal.helpers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenant: TenantContext, parentId: string): Promise<unknown> {
    const children = await this.getLinkedChildren(tenant, parentId);
    const parent = await this.prisma.client.user.findUnique({ where: { id: parentId } });
    const parentName = parent ? `${parent.firstName} ${parent.lastName}` : 'Parent';

    const childrenSummary = await Promise.all(
      children.map(async (child) => {
        const [academics, attendancePercent, fees] = await Promise.all([
          this.getChildAcademics(tenant, parentId, child.id),
          this.getChildAttendancePercent(tenant, child.id),
          this.getChildFeeOutstanding(tenant, child.id),
        ]);

        const acad = academics as {
          gpa: number;
          rank: number | null;
        };

        return {
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          className: child.class?.name ?? 'Unassigned',
          section: child.section?.name ?? '',
          name: `${child.firstName} ${child.lastName}`,
          class: child.class?.name ?? 'Unassigned',
          gpa: acad.gpa,
          rank: acad.rank,
          attendancePercent,
          feeOutstanding: fees,
          aiAlerts: this.buildAiAlerts(child.id, acad.gpa, attendancePercent, fees),
        };
      }),
    );

    return { parentName, children: childrenSummary };
  }

  async getChildren(tenant: TenantContext, parentId: string): Promise<unknown> {
    return this.getLinkedChildren(tenant, parentId);
  }

  async getChildAcademics(
    tenant: TenantContext,
    parentId: string,
    studentId: string,
  ): Promise<unknown> {
    const student = await this.requireLinkedChild(tenant, parentId, studentId);

    const exam = await this.prisma.client.exam.findFirst({
      where: { schoolId: tenant.schoolId, status: { in: ['COMPLETED', 'PUBLISHED', 'SCHEDULED'] } },
      orderBy: { startDate: 'desc' },
    });

    const results = exam
      ? await this.prisma.client.examResult.findMany({
          where: { examId: exam.id, studentId: student.id },
          include: { subject: { select: { id: true, name: true } } },
        })
      : [];

    const totalMarks = results.reduce((s, r) => s + r.marksObtained, 0);
    const totalMax = results.reduce((s, r) => s + r.maxMarks, 0);
    const percentage = totalMax > 0 ? Math.round((totalMarks / totalMax) * 1000) / 10 : 0;
    const gpa = gpaFromPercentage(percentage);

    const classStudents = student.classId
      ? await this.prisma.client.student.findMany({
          where: { schoolId: tenant.schoolId, classId: student.classId, status: 'ACTIVE' },
          select: { id: true },
        })
      : [];

    let rank: number | null = null;
    if (exam && classStudents.length > 0) {
      const allResults = await this.prisma.client.examResult.findMany({
        where: {
          examId: exam.id,
          studentId: { in: classStudents.map((s) => s.id) },
        },
      });

      const totals = new Map<string, { marks: number; max: number }>();
      for (const r of allResults) {
        const entry = totals.get(r.studentId) ?? { marks: 0, max: 0 };
        entry.marks += r.marksObtained;
        entry.max += r.maxMarks;
        totals.set(r.studentId, entry);
      }

      const ranked = [...totals.entries()]
        .map(([id, t]) => ({
          studentId: id,
          pct: t.max > 0 ? t.marks / t.max : 0,
        }))
        .sort((a, b) => b.pct - a.pct);

      rank = ranked.findIndex((r) => r.studentId === student.id) + 1 || null;
    }

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        class: student.class?.name,
        section: student.section?.name,
      },
      term: exam?.term ?? 'Term 1',
      termResult: exam?.term ?? 'Term 1',
      gpa,
      rank: rank ?? 0,
      totalStudents: classStudents.length || 30,
      percentage,
      overallGrade: computeGrade(totalMarks, totalMax || 100),
      subjects: results.map((r) => ({
        name: r.subject.name,
        subject: r.subject.name,
        marksObtained: r.marksObtained,
        maxMarks: r.maxMarks,
        grade: r.grade ?? computeGrade(r.marksObtained, r.maxMarks),
        score: r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0,
      })),
    };
  }

  async getChildAttendance(
    tenant: TenantContext,
    parentId: string,
    studentId: string,
  ): Promise<unknown> {
    await this.requireLinkedChild(tenant, parentId, studentId);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const start = startOfMonth(year, month);
    const end = endOfMonth(year, month);

    const records = await this.prisma.client.attendanceRecord.findMany({
      where: {
        schoolId: tenant.schoolId,
        studentId,
        date: { gte: start, lte: end },
      },
    });

    const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;

    const total = records.length;

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      summary: {
        present,
        absent,
        late,
        totalDays: total,
        percent:
          total > 0
            ? Math.round((present / total) * 1000) / 10
            : 0,
      },
    };
  }

  async getChildFees(
    tenant: TenantContext,
    parentId: string,
    studentId: string,
  ): Promise<unknown> {
    await this.requireLinkedChild(tenant, parentId, studentId);

    const student = await this.prisma.client.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        transportAlloc: true,
      },
    });

    const school = await this.prisma.client.school.findUnique({
      where: { id: tenant.schoolId },
      select: { settings: true },
    });
    const schoolSettings = (school?.settings as Record<string, any>) || {};
    const sessionEndingMonth = schoolSettings.sessionEndingMonth || 'March';

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const sessionEndingIndex = monthNames.findIndex(
      (m) => m.toLowerCase() === sessionEndingMonth.toLowerCase()
    );
    const today = new Date('2026-06-19T00:00:00Z');
    const currentMonth = today.getMonth();
    const isSessionEnded = currentMonth > (sessionEndingIndex >= 0 ? sessionEndingIndex : 4);

    const invoices = await this.prisma.client.studentInvoice.findMany({
      where: { schoolId: tenant.schoolId, studentId },
      include: {
        lineItems: {
          include: {
            feeHead: true,
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    let outstanding = 0;
    const list = invoices.map((inv) => {
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
        lineItems: inv.lineItems.map((li) => ({
          id: li.id,
          description: li.description,
          amount: decimalToNumber(li.amount),
          code: li.feeHead?.code,
        })),
      };
    });

    let monthlyTuition = 4500;
    let monthlyTransport = 800;
    let monthlyLab = 300;
    let monthlyLibrary = 150;
    let monthlySports = 200;

    if (student && student.class) {
      const matrices = await this.prisma.client.classFeeMatrix.findMany({
        where: {
          schoolId: tenant.schoolId,
          grade: student.class.grade,
          academicYear: student.class.academicYear ?? '2025-2026',
        },
        include: {
          feeHead: true,
        },
      });

      for (const matrix of matrices) {
        const annualAmt = decimalToNumber(matrix.amount);
        const monthlyAmt = Math.round(annualAmt / 10);
        const code = matrix.feeHead?.code;
        if (code === 'TUITION') {
          monthlyTuition = monthlyAmt;
        } else if (code === 'TRANSPORT') {
          monthlyTransport = monthlyAmt;
        } else if (code === 'LAB') {
          monthlyLab = monthlyAmt;
        } else if (code === 'LIBRARY') {
          monthlyLibrary = monthlyAmt;
        } else if (code === 'SPORTS') {
          monthlySports = monthlyAmt;
        }
      }
    }

    const academicLineItems = [
      { description: 'Monthly Tuition Fee', amount: monthlyTuition },
      { description: 'Monthly Library Fee', amount: monthlyLibrary },
      { description: 'Monthly Lab Fee', amount: monthlyLab },
      { description: 'Monthly Sports Fee', amount: monthlySports },
    ];
    const academicTotal = academicLineItems.reduce((sum, item) => sum + item.amount, 0);

    const transportLineItems = [];
    if (student?.transportAlloc && student.transportAlloc.pickupTime !== 'PENDING_APPROVAL') {
      transportLineItems.push({
        description: `Monthly Transport Fee (${student.transportAlloc.stopName})`,
        amount: monthlyTransport,
      });
    }
    const transportTotal = transportLineItems.reduce((sum, item) => sum + item.amount, 0);

    const m1 = new Date(today.getFullYear(), today.getMonth() + 1, 10);
    const m2 = new Date(today.getFullYear(), today.getMonth() + 2, 10);

    const upcomingFees = [];

    // Month 1 Academic
    upcomingFees.push({
      month: `${monthNames[m1.getMonth()]} ${m1.getFullYear()}`,
      dueDate: m1.toISOString(),
      totalAmount: academicTotal,
      status: 'UPCOMING',
      lineItems: academicLineItems,
      type: 'Academic Fee Voucher',
    });

    // Month 1 Transport
    if (transportLineItems.length > 0) {
      upcomingFees.push({
        month: `${monthNames[m1.getMonth()]} ${m1.getFullYear()}`,
        dueDate: m1.toISOString(),
        totalAmount: transportTotal,
        status: 'UPCOMING',
        lineItems: transportLineItems,
        type: 'Bus Fee Voucher',
      });
    }

    // Month 2 Academic
    upcomingFees.push({
      month: `${monthNames[m2.getMonth()]} ${m2.getFullYear()}`,
      dueDate: m2.toISOString(),
      totalAmount: academicTotal,
      status: 'UPCOMING',
      lineItems: academicLineItems,
      type: 'Academic Fee Voucher',
    });

    // Month 2 Transport
    if (transportLineItems.length > 0) {
      upcomingFees.push({
        month: `${monthNames[m2.getMonth()]} ${m2.getFullYear()}`,
        dueDate: m2.toISOString(),
        totalAmount: transportTotal,
        status: 'UPCOMING',
        lineItems: transportLineItems,
        type: 'Bus Fee Voucher',
      });
    }

    const unpaidInvoice = list.find((inv) => inv.outstanding > 0);
    const dueDate = unpaidInvoice?.dueDate ?? list[0]?.dueDate ?? new Date().toISOString();
    const status = outstanding > 0 ? 'UNPAID' : 'PAID';
    const paymentUrl = `http://localhost:3005/fees?studentId=${studentId}&sessionEnded=${isSessionEnded}`;

    return {
      outstanding,
      outstandingAmount: outstanding,
      status,
      dueDate,
      paymentUrl,
      sessionEnded: isSessionEnded,
      sessionEndingMonth,
      invoices: list,
      upcomingFees,
      transportAlloc: student?.transportAlloc ? {
        id: student.transportAlloc.id,
        routeId: student.transportAlloc.routeId,
        stopName: student.transportAlloc.stopName,
        pickupTime: student.transportAlloc.pickupTime,
      } : null,
    };
  }

  async getChildExams(
    tenant: TenantContext,
    parentId: string,
    studentId: string,
  ): Promise<unknown> {
    const student = await this.requireLinkedChild(tenant, parentId, studentId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entries = student.classId
      ? await this.prisma.client.examScheduleEntry.findMany({
          where: {
            classId: student.classId,
            date: { gte: today },
            exam: { schoolId: tenant.schoolId, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
          },
          include: {
            subject: { select: { id: true, name: true } },
            exam: { select: { id: true, name: true, term: true } },
          },
          orderBy: { date: 'asc' },
        })
      : [];

    const schedule = entries.map((e) => ({
      examId: e.examId,
      examName: e.exam.name,
      term: e.exam.term,
      subject: e.subject.name,
      date: e.date.toISOString().slice(0, 10),
      startTime: e.startTime,
      endTime: e.endTime,
      room: e.room,
      maxMarks: e.maxMarks,
    }));

    return {
      schedule,
      exams: schedule.map((item) => ({
        id: item.examId,
        name: item.examName,
        subject: item.subject,
        date: item.date,
        room: item.room ?? 'TBD',
      })),
    };
  }

  async getChildLibrary(
    tenant: TenantContext,
    parentId: string,
    studentId: string,
  ): Promise<unknown> {
    const student = await this.requireLinkedChild(tenant, parentId, studentId);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const issues = await this.prisma.client.libraryIssue.findMany({
      where: {
        studentId: student.id,
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

  async getMessages(tenant: TenantContext, parentId: string): Promise<unknown> {
    const logs = await this.prisma.client.notificationLog.findMany({
      where: {
        schoolId: tenant.schoolId,
        recipientId: parentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return logs.map((log) => ({
      id: log.id,
      from: 'School Administration',
      role: 'System',
      subject: log.subject ?? 'Notification',
      body: log.body,
      sentAt: log.sentAt ? log.sentAt.toISOString() : log.createdAt.toISOString(),
      read: true,
    }));
  }

  private async getLinkedChildren(tenant: TenantContext, parentId: string) {
    const links = await this.prisma.client.parentStudent.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            class: { select: { id: true, name: true, grade: true } },
            section: { select: { id: true, name: true } },
          },
        },
      },
    });

    return links
      .filter((l) => l.student.schoolId === tenant.schoolId)
      .map((l) => ({
        ...l.student,
        relation: l.relation,
      }));
  }

  private async requireLinkedChild(
    tenant: TenantContext,
    parentId: string,
    studentId: string,
  ) {
    const children = await this.getLinkedChildren(tenant, parentId);
    const student = children.find((c) => c.id === studentId);

    if (!student) {
      throw new ForbiddenException('Student is not linked to this parent account');
    }

    return student;
  }

  private async getChildAttendancePercent(tenant: TenantContext, studentId: string) {
    const records = await this.prisma.client.attendanceRecord.findMany({
      where: { schoolId: tenant.schoolId, studentId },
    });

    if (records.length === 0) return 0;

    const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    return Math.round((present / records.length) * 1000) / 10;
  }

  private async getChildFeeOutstanding(tenant: TenantContext, studentId: string) {
    const invoices = await this.prisma.client.studentInvoice.findMany({
      where: { schoolId: tenant.schoolId, studentId },
    });

    return invoices.reduce((sum, inv) => {
      const total = decimalToNumber(inv.totalAmount);
      const paid = decimalToNumber(inv.paidAmount);
      const fine = decimalToNumber(inv.lateFine);
      return sum + total + fine - paid;
    }, 0);
  }

  async getChildResults(
    tenant: TenantContext,
    parentId: string,
    studentId: string,
  ): Promise<unknown> {
    const student = await this.requireLinkedChild(tenant, parentId, studentId);

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

  async getChildAssignments(
    tenant: TenantContext,
    parentId: string,
    studentId: string,
  ): Promise<unknown> {
    const student = await this.requireLinkedChild(tenant, parentId, studentId);
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
      priority: 'medium',
    }));
  }

  private buildAiAlerts(
    studentId: string,
    gpa: number,
    attendancePercent: number,
    feeOutstanding: number,
  ) {
    const alerts: Array<{ type: string; message: string; severity: string }> = [];

    if (gpa < 2.5) {
      alerts.push({
        type: 'ACADEMIC',
        message: 'Performance below class average — consider tutoring support',
        severity: 'HIGH',
      });
    }

    if (attendancePercent < 85) {
      alerts.push({
        type: 'ATTENDANCE',
        message: `Attendance at ${attendancePercent}% — below recommended threshold`,
        severity: 'MEDIUM',
      });
    }

    if (feeOutstanding > 0) {
      alerts.push({
        type: 'FEES',
        message: `Outstanding fees of ₹${feeOutstanding.toLocaleString('en-IN')}`,
        severity: feeOutstanding > 10000 ? 'HIGH' : 'LOW',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'GENERAL',
        message: 'All indicators within normal range',
        severity: 'INFO',
      });
    }

    void studentId;
    return alerts;
  }

  async addChild(
    tenant: TenantContext,
    parentId: string,
    payload: {
      admissionNumber?: string;
      firstName?: string;
      lastName?: string;
      relation: string;
    },
  ): Promise<unknown> {
    // Find the student by admission number or by name
    let student: { id: string; firstName: string; lastName: string; schoolId: string } | null = null;

    if (payload.admissionNumber) {
      student = await this.prisma.client.student.findFirst({
        where: {
          schoolId: tenant.schoolId,
          admissionNo: payload.admissionNumber.trim(),
        },
        select: { id: true, firstName: true, lastName: true, schoolId: true },
      });
    } else if (payload.firstName && payload.lastName) {
      student = await this.prisma.client.student.findFirst({
        where: {
          schoolId: tenant.schoolId,
          firstName: { equals: payload.firstName.trim(), mode: 'insensitive' },
          lastName: { equals: payload.lastName.trim(), mode: 'insensitive' },
        },
        select: { id: true, firstName: true, lastName: true, schoolId: true },
      });
    } else {
      throw new BadRequestException('Provide either admissionNumber or full name to find the child.');
    }

    if (!student) {
      throw new NotFoundException('No student found with the provided details in your school.');
    }

    // Check not already linked
    const existing = await this.prisma.client.parentStudent.findFirst({
      where: { parentId, studentId: student.id },
    });
    if (existing) {
      throw new BadRequestException('This child is already linked to your account.');
    }

    const link = await this.prisma.client.parentStudent.create({
      data: {
        parentId,
        studentId: student.id,
        relation: payload.relation || 'Parent',
      },
    });

    return {
      message: `${student.firstName} ${student.lastName} has been linked to your account.`,
      studentId: student.id,
      relation: link.relation,
    };
  }

  async getTransportRoutes(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.transportRoute.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: { code: 'asc' },
    });
  }

  async applyChildBus(
    tenant: TenantContext,
    parentId: string,
    studentId: string,
    routeId: string,
    stopName: string,
  ): Promise<unknown> {
    await this.requireLinkedChild(tenant, parentId, studentId);

    // Upsert or create StudentTransport with pickupTime: "PENDING_APPROVAL"
    const allocation = await this.prisma.client.studentTransport.upsert({
      where: { studentId },
      update: {
        routeId,
        stopName,
        pickupTime: 'PENDING_APPROVAL',
      },
      create: {
        studentId,
        routeId,
        stopName,
        pickupTime: 'PENDING_APPROVAL',
      },
    });

    return allocation;
  }
}
