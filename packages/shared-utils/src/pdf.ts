export const PDF_TEMPLATES = [
  'report-card',
  'receipt',
  'salary-slip',
  'hall-ticket',
  'bonafide',
  'transfer-certificate',
] as const;

export type PdfTemplate = (typeof PDF_TEMPLATES)[number];

export interface PdfDocumentResult {
  mimeType: string;
  content: string;
  fileName: string;
  renderMode: 'pdf' | 'html';
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderDocumentHtml(
  template: PdfTemplate,
  data: Record<string, unknown>,
): string {
  const schoolName = escapeHtml(data.schoolName ?? 'Greenfield Academy');
  const generatedAt = new Date().toLocaleString('en-IN');

  if (template === 'report-card') {
    const studentName = escapeHtml(data.studentName ?? 'Student');
    const className = escapeHtml(data.className ?? '—');
    const term = escapeHtml(data.term ?? 'Current Term');
    const subjects = Array.isArray(data.subjects) ? data.subjects : [];

    const subjectRows = subjects
      .map((subject) => {
        const row = subject as Record<string, unknown>;
        return `<tr><td>${escapeHtml(row.name ?? '—')}</td><td>${escapeHtml(row.marks ?? '—')}</td><td>${escapeHtml(row.grade ?? '—')}</td></tr>`;
      })
      .join('');

    return `<!DOCTYPE html><html><head><title>Report Card</title><style>
      body{font-family:Georgia,serif;margin:40px;color:#1a1a2e}
      .header{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:16px}
      table{width:100%;border-collapse:collapse;margin-top:24px}
      th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}
      th{background:#eff6ff}
    </style></head><body>
      <div class="header"><h1>${schoolName}</h1><h2>Report Card — ${term}</h2></div>
      <p><strong>Student:</strong> ${studentName} &nbsp;|&nbsp; <strong>Class:</strong> ${className}</p>
      <table><thead><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
      <tbody>${subjectRows || '<tr><td colspan="3">No subjects provided</td></tr>'}</tbody></table>
      <p style="margin-top:32px;font-size:12px;color:#64748b">Generated ${generatedAt}</p>
    </body></html>`;
  }

  if (template === 'receipt') {
    const receiptNo = escapeHtml(data.receiptNo ?? `RCP-${Date.now()}`);
    const amount = escapeHtml(data.amount ?? '0');
    const paidBy = escapeHtml(data.paidBy ?? '—');

    return `<!DOCTYPE html><html><head><title>Fee Receipt</title><style>
      body{font-family:Arial,sans-serif;margin:40px;max-width:480px}
      .receipt{border:1px dashed #94a3b8;padding:24px}
      h1{font-size:18px;margin:0 0 8px}
      .amount{font-size:28px;font-weight:bold;color:#059669;margin:16px 0}
    </style></head><body><div class="receipt">
      <h1>${schoolName}</h1><p>Fee Payment Receipt</p>
      <p>Receipt No: <strong>${receiptNo}</strong></p>
      <p>Paid By: ${paidBy}</p>
      <div class="amount">₹${amount}</div>
      <p style="font-size:12px;color:#64748b">Generated ${generatedAt}</p>
    </div></body></html>`;
  }

  if (template === 'salary-slip') {
    const employeeName = escapeHtml(data.employeeName ?? 'Employee');
    const month = escapeHtml(
      data.month ?? new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
    );
    const netPay = escapeHtml(data.netPay ?? '0');

    return `<!DOCTYPE html><html><head><title>Salary Slip</title><style>
      body{font-family:Arial,sans-serif;margin:40px}
      .slip{border:1px solid #e2e8f0;padding:24px;border-radius:8px}
      h1{font-size:16px;margin:0}
      .net{font-size:24px;font-weight:bold;margin-top:16px}
    </style></head><body><div class="slip">
      <h1>${schoolName} — Salary Slip</h1>
      <p>${month}</p>
      <p>Employee: <strong>${employeeName}</strong></p>
      <div class="net">Net Pay: ₹${netPay}</div>
      <p style="font-size:12px;color:#64748b;margin-top:24px">Generated ${generatedAt}</p>
    </div></body></html>`;
  }

  return `<!DOCTYPE html><html><body><p>Template ${escapeHtml(template)} preview</p></body></html>`;
}

export function buildPdfDocument(
  template: PdfTemplate,
  data: Record<string, unknown>,
): PdfDocumentResult {
  const fileName = `${template}-${Date.now()}.pdf`;
  const html = renderDocumentHtml(template, data);

  const pdfPlaceholder = Buffer.from(
    `%PDF-1.4\n% EduCore simulated PDF\n% Template: ${template}\n% Generated: ${new Date().toISOString()}\n`,
  ).toString('base64');

  const useHtml =
    template === 'report-card' || template === 'receipt' || template === 'salary-slip';

  return {
    mimeType: useHtml ? 'text/html' : 'application/pdf',
    content: useHtml ? html : pdfPlaceholder,
    fileName: useHtml ? fileName.replace('.pdf', '.html') : fileName,
    renderMode: useHtml ? 'html' : 'pdf',
  };
}
