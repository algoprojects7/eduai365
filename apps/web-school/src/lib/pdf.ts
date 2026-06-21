import type { PdfTemplate } from '@eduai365/shared-utils';
import { apiFetch } from '@/lib/api';
import type { ReportCard } from '@/types/academics';
import type { PaymentReceipt } from '@/types/finance';
import type { SalarySlip } from '@/types/hr';
import { MONTH_NAMES } from '@/types/hr';

import { translateToAssamese } from '@/lib/assamese-translations';

export interface PdfGenerateResult {
  template: PdfTemplate;
  mimeType: string;
  content: string;
  fileName: string;
  renderMode: 'pdf' | 'html';
}

export async function generatePdf(
  template: PdfTemplate,
  data: Record<string, unknown>,
): Promise<PdfGenerateResult> {
  return apiFetch<PdfGenerateResult>('/pdf/generate', {
    method: 'POST',
    body: JSON.stringify({ template, data }),
  });
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadGeneratedDocument(result: PdfGenerateResult, fileName?: string): void {
  const name = fileName ?? result.fileName;

  if (result.renderMode === 'html') {
    const blob = new Blob([result.content], { type: 'text/html;charset=utf-8' });
    triggerDownload(blob, name);
    return;
  }

  const binary = atob(result.content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: result.mimeType });
  triggerDownload(blob, name);
}

export async function downloadPdf(
  template: PdfTemplate,
  data: Record<string, unknown>,
  fileName?: string,
): Promise<void> {
  const result = await generatePdf(template, data);
  downloadGeneratedDocument(result, fileName);
}

export function reportCardPdfData(card: ReportCard, schoolName: string, language: 'en' | 'as' = 'en'): Record<string, unknown> {
  return {
    schoolName,
    studentName: card.student.name,
    className: card.student.class ?? '—',
    term: language === 'as' ? translateToAssamese(card.term) : card.term,
    subjects: card.subjects.map((subject) => ({
      name: language === 'as' ? translateToAssamese(subject.name) : subject.name,
      marks: subject.marks,
      grade: subject.grade,
    })),
    // Additional labels for the template to consume if it supports dynamic labels
    labels: {
      progressReport: language === 'as' ? translateToAssamese('Progress Report') : 'Progress Report',
      name: language === 'as' ? translateToAssamese('Name') : 'Name',
      class: language === 'as' ? translateToAssamese('Class') : 'Class',
      term: language === 'as' ? translateToAssamese('Term') : 'Term',
      subject: language === 'as' ? translateToAssamese('Subject') : 'Subject',
      marks: language === 'as' ? translateToAssamese('Marks') : 'Marks',
      grade: language === 'as' ? translateToAssamese('Grade') : 'Grade',
      total: language === 'as' ? translateToAssamese('Total') : 'Total',
    }
  };
}

export function receiptPdfData(receipt: PaymentReceipt): Record<string, unknown> {
  return {
    receiptNo: receipt.receiptNo,
    amount: receipt.grandTotal,
    paidBy: receipt.studentName,
  };
}

export function salarySlipPdfData(slip: SalarySlip): Record<string, unknown> {
  return {
    schoolName: slip.schoolName,
    employeeName: slip.employeeName,
    month: `${MONTH_NAMES[slip.month - 1]} ${slip.year}`,
    netPay: slip.net,
  };
}
