import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import type { InvoiceStatus, PaymentMethod } from '@eduai365/database';

const INVOICE_STATUSES: InvoiceStatus[] = [
  'DRAFT',
  'ISSUED',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'CANCELLED',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'CARD',
  'UPI',
  'NET_BANKING',
  'CHALLAN',
  'CASH',
];

export class ListInvoicesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ enum: INVOICE_STATUSES })
  @IsOptional()
  @IsEnum(INVOICE_STATUSES)
  status?: InvoiceStatus;
}

export class ListPaymentsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @MinLength(1)
  academicYear!: string;

  @ApiProperty({ example: 'Term 1' })
  @IsString()
  @MinLength(1)
  term!: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ description: 'Fee head IDs to include; defaults to mandatory heads' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  feeHeadIds?: string[];
}

export class InitiatePaymentDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiProperty({ example: 52500 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsEnum(PAYMENT_METHODS)
  method!: PaymentMethod;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lineItemIds?: string[];
}

export class ConfirmPaymentDto {
  @ApiProperty()
  @IsString()
  paymentId!: string;

  @ApiProperty({ example: 'TXN-000001' })
  @IsString()
  @MinLength(1)
  transactionId!: string;

  @ApiPropertyOptional({
    description: 'POST a simulated Razorpay webhook for reconciliation demo',
  })
  @IsOptional()
  @IsBoolean()
  simulateWebhook?: boolean;
}

export class RefundPaymentDto {
  @ApiProperty()
  @IsString()
  paymentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
