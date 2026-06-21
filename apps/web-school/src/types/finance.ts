export const FEE_MATRIX_GRADES = [
  'Nursery',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
] as const;

export type FeeMatrixGrade = (typeof FEE_MATRIX_GRADES)[number];

export const FEE_HEAD_CATEGORIES = [
  'Tuition',
  'Admission',
  'Exam',
  'Transport',
  'Library',
  'Lab',
  'Sports',
  'Meals',
  'Uniform',
  'Late Fine',
] as const;

export type FeeHeadCategory = (typeof FEE_HEAD_CATEGORIES)[number];

export interface FeeHead {
  id: string;
  name: string;
  code: string;
  category: string;
  amount: number;
  isActive: boolean;
  isMandatory: boolean;
}

export interface CreateFeeHeadInput {
  name: string;
  code: string;
  category: string;
  amount: number;
  isActive: boolean;
  isMandatory: boolean;
}

export interface UpdateFeeHeadInput {
  name?: string;
  code?: string;
  category?: string;
  amount?: number;
  isActive?: boolean;
  isMandatory?: boolean;
}

export interface FeeMatrixFee {
  feeHeadId: string;
  feeHeadName: string;
  amount: number;
}

export interface FeeMatrixRow {
  grade: string;
  fees: FeeMatrixFee[];
}

export interface FeeMatrixUpdate {
  grade: string;
  feeHeadId: string;
  amount: number;
}

export interface PatchFeeMatrixInput {
  academicYear: string;
  updates: FeeMatrixUpdate[];
}

export const SCHOLARSHIP_TYPES = ['Merit', 'Need', 'Staff Ward'] as const;

export type ScholarshipType = (typeof SCHOLARSHIP_TYPES)[number];

export interface Scholarship {
  id: string;
  name: string;
  type: string;
  discountPercent: number;
  isActive: boolean;
}

export interface CreateScholarshipInput {
  name: string;
  type: string;
  discountPercent: number;
  isActive: boolean;
}

export interface Concession {
  id: string;
  studentId: string;
  studentName: string;
  discountPercent: number;
  reason: string;
}

export interface OverdueInvoice {
  invoiceId: string;
  studentName: string;
  class: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  defaultRiskScore: number;
}

export interface CollectionStat {
  className: string;
  collected: number;
  target: number;
}

export type PaymentMethod = 'CARD' | 'UPI' | 'NET_BANKING' | 'CHALLAN';

export interface InvoiceLineItem {
  id: string;
  feeHeadId: string;
  description: string;
  amount: number;
}

export interface StudentInvoice {
  id: string;
  studentId: string;
  invoiceNo: string;
  academicYear: string;
  term: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  lateFine: number;
}

export interface InvoiceDetail extends StudentInvoice {
  lineItems: InvoiceLineItem[];
}

export interface PaymentInitiateInput {
  studentId: string;
  invoiceId: string;
  lineItemIds: string[];
  method: PaymentMethod;
  amount: number;
}

export interface PaymentInitiateResult {
  paymentId: string;
  amount: number;
  convenienceFee: number;
  grandTotal: number;
}

export interface PaymentConfirmInput {
  paymentId: string;
  transactionId?: string;
  simulateWebhook?: boolean;
}

export interface PaymentReceipt {
  paymentId: string;
  receiptNo: string;
  transactionId: string;
  amount: number;
  convenienceFee: number;
  grandTotal: number;
  paidAt: string;
  method: PaymentMethod;
  studentName: string;
  invoiceNo: string;
}

export interface FinancePerformanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  gstCollected: number;
  collectionRate: number;
  defaultRiskSummary?: string;
}

export interface MonthlyPerformancePoint {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryPerformancePoint {
  category: string;
  amount: number;
  percentage: number;
}
