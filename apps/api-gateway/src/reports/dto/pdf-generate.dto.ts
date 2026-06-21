import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsObject, IsString } from 'class-validator';

export const PDF_TEMPLATES = [
  'report-card',
  'receipt',
  'salary-slip',
  'hall-ticket',
  'bonafide',
  'transfer-certificate',
] as const;

export type PdfTemplate = (typeof PDF_TEMPLATES)[number];

export class PdfGenerateDto {
  @ApiProperty({
    enum: PDF_TEMPLATES,
    example: 'report-card',
    description: 'Document template to render',
  })
  @IsIn(PDF_TEMPLATES)
  template!: PdfTemplate;

  @ApiProperty({
    example: {
      studentName: 'Aarav Mehta',
      className: 'Grade 10-A',
      term: 'Term II 2025-26',
      subjects: [{ name: 'Mathematics', marks: 88, grade: 'A' }],
    },
  })
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, unknown>;
}
