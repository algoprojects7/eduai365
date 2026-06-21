import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  TenantContext,
} from '@eduai365/shared-types';
import type { InvoiceStatus, Prisma } from '@eduai365/database';
import { config } from '@eduai365/config';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateConcessionDto,
  CreateFeeHeadDto,
  CreateScholarshipDto,
  FeeMatrixQueryDto,
  ListConcessionsQueryDto,
  UpdateFeeHeadDto,
  UpdateFeeMatrixDto,
} from './dto/fee-structure.dto';
import type { UpdateGatewayConfigDto } from './dto/gateway.dto';
import type {
  ConfirmPaymentDto,
  CreateInvoiceDto,
  InitiatePaymentDto,
  ListInvoicesQueryDto,
  ListPaymentsQueryDto,
  RefundPaymentDto,
} from './dto/payments.dto';

function mockDefaultRisk(studentId: string): { score: number; flag: boolean } {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash + studentId.charCodeAt(i) * (i + 1)) % 100;
  }
  const score = 0.2 + (hash % 80) / 100;
  return { score: Math.round(score * 100) / 100, flag: score >= 0.65 };
}

function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Fee Heads ─────────────────────────────────────────────────────────────

  async listFeeHeads(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.feeHead.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async createFeeHead(
    tenant: TenantContext,
    dto: CreateFeeHeadDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.feeHead.create({
      data: {
        schoolId: tenant.schoolId,
        name: dto.name,
        code: dto.code.toUpperCase(),
        category: dto.category,
        amount: dto.amount,
        isActive: dto.isActive ?? true,
        isMandatory: dto.isMandatory ?? false,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'FeeHead',
      entityId: record.id,
    });

    return record;
  }

  async updateFeeHead(
    tenant: TenantContext,
    id: string,
    dto: UpdateFeeHeadDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireFeeHead(tenant, id);

    const record = await this.prisma.client.feeHead.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isMandatory !== undefined ? { isMandatory: dto.isMandatory } : {}),
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'FeeHead',
      entityId: id,
    });

    return record;
  }

  // ─── Fee Matrix ────────────────────────────────────────────────────────────

  async getFeeMatrix(tenant: TenantContext, query: FeeMatrixQueryDto): Promise<unknown> {
    const [feeHeads, matrix] = await Promise.all([
      this.prisma.client.feeHead.findMany({
        where: { schoolId: tenant.schoolId, isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.classFeeMatrix.findMany({
        where: { schoolId: tenant.schoolId, academicYear: query.academicYear },
        include: { feeHead: { select: { id: true, name: true, code: true, category: true } } },
        orderBy: [{ grade: 'asc' }, { feeHead: { name: 'asc' } }],
      }),
    ]);

    const grades = [...new Set(matrix.map((m) => m.grade))].sort();

    return { academicYear: query.academicYear, feeHeads, grades, matrix };
  }

  async updateFeeMatrix(
    tenant: TenantContext,
    dto: UpdateFeeMatrixDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const updated = [];

    for (const entry of dto.entries) {
      const record = await this.prisma.client.classFeeMatrix.upsert({
        where: {
          schoolId_grade_feeHeadId_academicYear: {
            schoolId: tenant.schoolId,
            grade: entry.grade,
            feeHeadId: entry.feeHeadId,
            academicYear: dto.academicYear,
          },
        },
        update: { amount: entry.amount },
        create: {
          schoolId: tenant.schoolId,
          grade: entry.grade,
          feeHeadId: entry.feeHeadId,
          amount: entry.amount,
          academicYear: dto.academicYear,
        },
      });
      updated.push(record);
    }

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'ClassFeeMatrix',
      metadata: { count: updated.length, academicYear: dto.academicYear },
    });

    return { updated: updated.length, entries: updated };
  }

  // ─── Scholarships & Concessions ────────────────────────────────────────────

  async listScholarships(tenant: TenantContext): Promise<unknown> {
    return this.prisma.client.scholarship.findMany({
      where: { schoolId: tenant.schoolId },
      orderBy: { name: 'asc' },
    });
  }

  async createScholarship(
    tenant: TenantContext,
    dto: CreateScholarshipDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.scholarship.create({
      data: {
        schoolId: tenant.schoolId,
        name: dto.name,
        type: dto.type,
        discountPercent: dto.discountPercent,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Scholarship',
      entityId: record.id,
    });

    return record;
  }

  async listConcessions(
    tenant: TenantContext,
    query: ListConcessionsQueryDto,
  ): Promise<unknown> {
    return this.prisma.client.feeConcession.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.studentId ? { studentId: query.studentId } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        scholarship: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createConcession(
    tenant: TenantContext,
    dto: CreateConcessionDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireStudent(tenant, dto.studentId);

    const record = await this.prisma.client.feeConcession.create({
      data: {
        schoolId: tenant.schoolId,
        studentId: dto.studentId,
        scholarshipId: dto.scholarshipId,
        discountPercent: dto.discountPercent,
        reason: dto.reason,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        scholarship: true,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'FeeConcession',
      entityId: record.id,
    });

    return record;
  }

  // ─── Overdue & Collection Stats ────────────────────────────────────────────

  async getOverdueInvoices(tenant: TenantContext): Promise<unknown> {
    const invoices = await this.prisma.client.studentInvoice.findMany({
      where: {
        schoolId: tenant.schoolId,
        status: { in: ['OVERDUE', 'PARTIAL'] },
        dueDate: { lt: new Date() },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { id: true, name: true, grade: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return invoices.map((inv) => {
      const risk = mockDefaultRisk(inv.studentId);
      const outstanding =
        decimalToNumber(inv.totalAmount) +
        decimalToNumber(inv.lateFine) -
        decimalToNumber(inv.paidAmount);

      return {
        ...inv,
        outstanding,
        aiDefaultRisk: risk,
      };
    });
  }

  async getCollectionStats(tenant: TenantContext): Promise<unknown> {
    const students = await this.prisma.client.student.findMany({
      where: { schoolId: tenant.schoolId, status: 'ACTIVE' },
      select: {
        id: true,
        class: { select: { name: true, grade: true } },
      },
    });

    const invoices = await this.prisma.client.studentInvoice.findMany({
      where: { schoolId: tenant.schoolId },
      select: { studentId: true, totalAmount: true, paidAmount: true },
    });

    const byClass = new Map<
      string,
      { className: string; grade: string; billed: number; collected: number; studentCount: number }
    >();

    for (const student of students) {
      const className = student.class?.name ?? 'Unassigned';
      const grade = student.class?.grade ?? 'N/A';
      const key = className;

      if (!byClass.has(key)) {
        byClass.set(key, { className, grade, billed: 0, collected: 0, studentCount: 0 });
      }
      byClass.get(key)!.studentCount += 1;
    }

    for (const inv of invoices) {
      const student = students.find((s) => s.id === inv.studentId);
      const className = student?.class?.name ?? 'Unassigned';
      const grade = student?.class?.grade ?? 'N/A';
      const key = className;

      if (!byClass.has(key)) {
        byClass.set(key, { className, grade, billed: 0, collected: 0, studentCount: 0 });
      }

      const entry = byClass.get(key)!;
      entry.billed += decimalToNumber(inv.totalAmount);
      entry.collected += decimalToNumber(inv.paidAmount);
    }

    return [...byClass.values()].map((c) => ({
      ...c,
      collectionRate: c.billed > 0 ? Math.round((c.collected / c.billed) * 10000) / 100 : 0,
    }));
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────

  async listInvoices(
    tenant: TenantContext,
    query: ListInvoicesQueryDto,
  ): Promise<unknown> {
    return this.prisma.client.studentInvoice.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.studentId ? { studentId: query.studentId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoice(tenant: TenantContext, id: string): Promise<unknown> {
    const invoice = await this.prisma.client.studentInvoice.findFirst({
      where: { id, schoolId: tenant.schoolId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { name: true, grade: true } },
          },
        },
        lineItems: {
          include: { feeHead: { select: { id: true, name: true, code: true, category: true } } },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async generateInvoice(
    tenant: TenantContext,
    dto: CreateInvoiceDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const student = await this.requireStudent(tenant, dto.studentId);

    // Check if student has previous invoices
    const previousInvoicesCount = await this.prisma.client.studentInvoice.count({
      where: { schoolId: tenant.schoolId, studentId: dto.studentId },
    });

    const isFirstInvoice = previousInvoicesCount === 0;
    const isAdmissionTerm =
      dto.term.toLowerCase().includes('admission') ||
      dto.term.toLowerCase().includes('new session') ||
      dto.term.toLowerCase().includes('term 1');

    const feeHeads = await this.prisma.client.feeHead.findMany({
      where: {
        schoolId: tenant.schoolId,
        isActive: true,
        ...(dto.feeHeadIds?.length
          ? { id: { in: dto.feeHeadIds } }
          : { isMandatory: true }),
      },
    });

    // Filter out Admission Fee if this is NOT the first invoice and NOT an admission term
    const filteredFeeHeads = feeHeads.filter((fh) => {
      const isAdmissionFee = fh.code === 'ADMISSION' || fh.category === 'ADMISSION';
      if (isAdmissionFee) {
        return isFirstInvoice || isAdmissionTerm;
      }
      return true;
    });

    if (filteredFeeHeads.length === 0) {
      throw new BadRequestException('No fee heads available for invoice generation');
    }

    const grade = student.class?.grade ?? student.class?.name ?? 'Class 10';
    const matrixEntries = await this.prisma.client.classFeeMatrix.findMany({
      where: {
        schoolId: tenant.schoolId,
        academicYear: dto.academicYear,
        grade: { in: [grade, student.class?.name ?? grade] },
        feeHeadId: { in: filteredFeeHeads.map((f) => f.id) },
      },
    });

    const amountByFeeHead = new Map(
      matrixEntries.map((m) => [m.feeHeadId, decimalToNumber(m.amount)]),
    );

    const concessions = await this.prisma.client.feeConcession.findMany({
      where: {
        schoolId: tenant.schoolId,
        studentId: dto.studentId,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });

    const discountPercent = concessions.reduce(
      (max, c) => Math.max(max, decimalToNumber(c.discountPercent)),
      0,
    );

    let totalAmount = 0;
    const lineItems = filteredFeeHeads.map((fh) => {
      const baseAmount = amountByFeeHead.get(fh.id) ?? decimalToNumber(fh.amount);
      const amount = Math.round(baseAmount * (1 - discountPercent / 100));
      totalAmount += amount;
      return {
        feeHeadId: fh.id,
        description: fh.name,
        amount,
      };
    });

    const count = await this.prisma.client.studentInvoice.count({
      where: { schoolId: tenant.schoolId },
    });
    const invoiceNo = `INV-${dto.academicYear.replace('-', '')}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await this.prisma.client.studentInvoice.create({
      data: {
        schoolId: tenant.schoolId,
        studentId: dto.studentId,
        invoiceNo,
        academicYear: dto.academicYear,
        term: dto.term,
        totalAmount,
        dueDate: new Date(dto.dueDate),
        status: 'ISSUED',
        lineItems: { create: lineItems },
      },
      include: {
        lineItems: { include: { feeHead: true } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'StudentInvoice',
      entityId: invoice.id,
    });

    return invoice;
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async listPayments(
    tenant: TenantContext,
    query: ListPaymentsQueryDto,
  ): Promise<unknown> {
    return this.prisma.client.payment.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.studentId ? { studentId: query.studentId } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        invoice: { select: { id: true, invoiceNo: true, totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async initiatePayment(
    tenant: TenantContext,
    dto: InitiatePaymentDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    await this.requireStudent(tenant, dto.studentId);

    if (dto.invoiceId) {
      const invoice = await this.prisma.client.studentInvoice.findFirst({
        where: { id: dto.invoiceId, schoolId: tenant.schoolId, studentId: dto.studentId },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
    }

    const payment = await this.prisma.client.payment.create({
      data: {
        schoolId: tenant.schoolId,
        studentId: dto.studentId,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        method: dto.method,
        status: 'PROCESSING',
        metadata: {
          lineItemIds: dto.lineItemIds ?? [],
          initiatedBy: user.id,
        },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      metadata: { status: 'PROCESSING' },
    });

    return {
      payment,
      gatewayUrl: `https://checkout.razorpay.com/v1/mock/${payment.id}`,
    };
  }

  async confirmPayment(
    tenant: TenantContext,
    dto: ConfirmPaymentDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const payment = await this.prisma.client.payment.findFirst({
      where: { id: dto.paymentId, schoolId: tenant.schoolId },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'COMPLETED') {
      throw new BadRequestException('Payment already completed');
    }

    const receiptNo = payment.receiptNo ?? `RCP-${Date.now()}`;

    const updated = await this.prisma.client.$transaction(async (tx) => {
      const confirmed = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          transactionId: dto.transactionId,
          gatewayRef: `rzp_${dto.transactionId}`,
          receiptNo,
          paidAt: new Date(),
        },
      });

      if (payment.invoiceId) {
        const invoice = await tx.studentInvoice.findUnique({
          where: { id: payment.invoiceId },
        });
        if (invoice) {
          const newPaid =
            decimalToNumber(invoice.paidAmount) + decimalToNumber(payment.amount);
          const total = decimalToNumber(invoice.totalAmount);
          let status: InvoiceStatus = 'PARTIAL';
          if (newPaid >= total) status = 'PAID';
          else if (newPaid === 0) status = invoice.status;

          await tx.studentInvoice.update({
            where: { id: invoice.id },
            data: { paidAmount: newPaid, status },
          });
        }
      }

      return confirmed;
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'Payment',
      entityId: payment.id,
      metadata: { status: 'COMPLETED', transactionId: dto.transactionId },
    });

    if (dto.simulateWebhook) {
      void this.simulateRazorpayWebhook(tenant, updated, dto.transactionId);
    }

    return updated;
  }

  private async simulateRazorpayWebhook(
    tenant: TenantContext,
    payment: { id: string; amount: Prisma.Decimal | number },
    transactionId: string,
  ): Promise<void> {
    const eventId = `evt_sim_${payment.id}_${Date.now()}`;
    const payload = {
      event: {
        id: eventId,
        entity: 'event',
        event: 'payment.captured',
      },
      payload: {
        payment: {
          entity: {
            id: transactionId,
            amount: Math.round(decimalToNumber(payment.amount) * 100),
            currency: 'INR',
            status: 'captured',
            notes: {
              paymentId: payment.id,
              schoolId: tenant.schoolId,
              source: 'confirm_payment_simulation',
            },
          },
        },
      },
    };

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/integrations/webhooks/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': tenant.slug,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.warn(
          `Razorpay webhook simulation returned ${response.status}: ${body.slice(0, 200)}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Razorpay webhook simulation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async getReceipt(tenant: TenantContext, paymentId: string): Promise<unknown> {
    const payment = await this.prisma.client.payment.findFirst({
      where: { id: paymentId, schoolId: tenant.schoolId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { name: true } },
          },
        },
        invoice: {
          select: {
            invoiceNo: true,
            academicYear: true,
            term: true,
            lineItems: { include: { feeHead: { select: { name: true } } } },
          },
        },
        school: { select: { name: true, logoUrl: true } },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Receipt available only for completed payments');
    }

    return {
      receiptNo: payment.receiptNo,
      paidAt: payment.paidAt,
      amount: payment.amount,
      method: payment.method,
      transactionId: payment.transactionId,
      student: payment.student,
      invoice: payment.invoice,
      school: payment.school,
    };
  }

  async refundPayment(
    tenant: TenantContext,
    dto: RefundPaymentDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const payment = await this.prisma.client.payment.findFirst({
      where: { id: dto.paymentId, schoolId: tenant.schoolId },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const updated = await this.prisma.client.$transaction(async (tx) => {
      const refunded = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          metadata: {
            ...(typeof payment.metadata === 'object' && payment.metadata !== null
              ? (payment.metadata as Record<string, unknown>)
              : {}),
            refundReason: dto.reason,
            refundedAt: new Date().toISOString(),
          },
        },
      });

      if (payment.invoiceId) {
        const invoice = await tx.studentInvoice.findUnique({
          where: { id: payment.invoiceId },
        });
        if (invoice) {
          const newPaid = Math.max(
            0,
            decimalToNumber(invoice.paidAmount) - decimalToNumber(payment.amount),
          );
          const total = decimalToNumber(invoice.totalAmount);
          let status: InvoiceStatus = newPaid >= total ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'ISSUED';
          if (invoice.dueDate < new Date() && newPaid < total) status = 'OVERDUE';

          await tx.studentInvoice.update({
            where: { id: invoice.id },
            data: { paidAmount: newPaid, status },
          });
        }
      }

      return refunded;
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'Payment',
      entityId: payment.id,
      metadata: { status: 'REFUNDED', reason: dto.reason },
    });

    return updated;
  }

  // ─── Performance ───────────────────────────────────────────────────────────

  async getPerformanceSummary(tenant: TenantContext): Promise<unknown> {
    const [invoices, payments] = await Promise.all([
      this.prisma.client.studentInvoice.findMany({
        where: { schoolId: tenant.schoolId },
        select: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.client.payment.findMany({
        where: { schoolId: tenant.schoolId, status: 'COMPLETED' },
        select: { amount: true },
      }),
    ]);

    const income = payments.reduce((sum, p) => sum + decimalToNumber(p.amount), 0);
    const billed = invoices.reduce((sum, i) => sum + decimalToNumber(i.totalAmount), 0);
    const collected = invoices.reduce((sum, i) => sum + decimalToNumber(i.paidAmount), 0);
    const expenses = Math.round(income * 0.62);
    const gstCollected = Math.round(income * 0.18);

    return {
      income,
      expenses,
      netProfit: income - expenses,
      gstCollected,
      collectionRate: billed > 0 ? Math.round((collected / billed) * 10000) / 100 : 0,
    };
  }

  async getPerformanceMonthly(tenant: TenantContext): Promise<unknown> {
    const payments = await this.prisma.client.payment.findMany({
      where: {
        schoolId: tenant.schoolId,
        status: 'COMPLETED',
        paidAt: { not: null },
      },
      select: { amount: true, paidAt: true },
    });

    const months: Array<{ month: string; income: number; expenses: number }> = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthPayments = payments.filter((p) => {
        const paid = p.paidAt!;
        return paid.getFullYear() === d.getFullYear() && paid.getMonth() === d.getMonth();
      });
      const income = monthPayments.reduce((sum, p) => sum + decimalToNumber(p.amount), 0);
      months.push({
        month: key,
        income,
        expenses: Math.round(income * 0.62),
      });
    }

    return months;
  }

  async getPerformanceByCategory(tenant: TenantContext): Promise<unknown> {
    const lineItems = await this.prisma.client.invoiceLineItem.findMany({
      where: { invoice: { schoolId: tenant.schoolId } },
      include: { feeHead: { select: { category: true, name: true } } },
    });

    const byCategory = new Map<string, number>();
    for (const item of lineItems) {
      const cat = item.feeHead.category;
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + decimalToNumber(item.amount));
    }

    return [...byCategory.entries()].map(([category, amount]) => ({ category, amount }));
  }

  // ─── Gateway ───────────────────────────────────────────────────────────────

  async getGatewayConfig(tenant: TenantContext): Promise<unknown> {
    const configs = await this.prisma.client.paymentGatewayConfig.findMany({
      where: { schoolId: tenant.schoolId },
    });

    return configs.map((c) => ({
      id: c.id,
      provider: c.provider,
      isEnabled: c.isEnabled,
      isTestMode: c.isTestMode,
      config: maskGatewayConfig(c.encryptedConfig),
    }));
  }

  async updateGatewayConfig(
    tenant: TenantContext,
    dto: UpdateGatewayConfigDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const provider = dto.provider ?? 'razorpay';

    const record = await this.prisma.client.paymentGatewayConfig.upsert({
      where: {
        schoolId_provider: { schoolId: tenant.schoolId, provider },
      },
      update: {
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
        ...(dto.isTestMode !== undefined ? { isTestMode: dto.isTestMode } : {}),
        ...(dto.config !== undefined ? { encryptedConfig: dto.config as Prisma.InputJsonValue } : {}),
      },
      create: {
        schoolId: tenant.schoolId,
        provider,
        isEnabled: dto.isEnabled ?? false,
        isTestMode: dto.isTestMode ?? true,
        encryptedConfig: (dto.config ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'PaymentGatewayConfig',
      entityId: record.id,
    });

    return {
      id: record.id,
      provider: record.provider,
      isEnabled: record.isEnabled,
      isTestMode: record.isTestMode,
      config: maskGatewayConfig(record.encryptedConfig),
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async requireFeeHead(tenant: TenantContext, id: string) {
    const record = await this.prisma.client.feeHead.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!record) throw new NotFoundException('Fee head not found');
    return record;
  }

  private async requireStudent(tenant: TenantContext, studentId: string) {
    const student = await this.prisma.client.student.findFirst({
      where: { id: studentId, schoolId: tenant.schoolId },
      include: { class: { select: { id: true, name: true, grade: true } } },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }
}

function maskGatewayConfig(config: unknown): Record<string, unknown> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return {};
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config as Record<string, unknown>)) {
    if (typeof value === 'string' && value.length > 4) {
      masked[key] = value.slice(0, 4) + '********';
    } else {
      masked[key] = value;
    }
  }
  return masked;
}
