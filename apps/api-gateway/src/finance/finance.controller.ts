import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { Permissions, Roles } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { assertTenantAccess } from '../school-admin/helpers/tenant-access.helper';
import {
  CreateConcessionDto,
  CreateFeeHeadDto,
  CreateScholarshipDto,
  FeeMatrixQueryDto,
  ListConcessionsQueryDto,
  UpdateFeeHeadDto,
  UpdateFeeMatrixDto,
} from './dto/fee-structure.dto';
import { UpdateGatewayConfigDto } from './dto/gateway.dto';
import {
  ConfirmPaymentDto,
  CreateInvoiceDto,
  InitiatePaymentDto,
  ListInvoicesQueryDto,
  ListPaymentsQueryDto,
  RefundPaymentDto,
} from './dto/payments.dto';
import { FinanceService } from './finance.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const FINANCE_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'ACCOUNTANT',
] as const;

@ApiTags('finance')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles(...FINANCE_ROLES)
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  // ─── Fee Structure ─────────────────────────────────────────────────────────

  @Get('fee-heads')
  @Permissions('finance:fees:read')
  @ApiOperation({ summary: 'List fee heads' })
  async listFeeHeads(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.listFeeHeads(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('fee-heads')
  @Permissions('finance:fees:write')
  @ApiOperation({ summary: 'Create fee head' })
  async createFeeHead(
    @Body() dto: CreateFeeHeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.createFeeHead(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('fee-heads/:id')
  @Permissions('finance:fees:write')
  @ApiOperation({ summary: 'Update fee head' })
  async updateFeeHead(
    @Param('id') id: string,
    @Body() dto: UpdateFeeHeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.updateFeeHead(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('fee-matrix')
  @Permissions('finance:fees:read')
  @ApiOperation({ summary: 'Class × fee head matrix' })
  async getFeeMatrix(
    @Query() query: FeeMatrixQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.getFeeMatrix(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('fee-matrix')
  @Permissions('finance:fees:write')
  @ApiOperation({ summary: 'Bulk update fee matrix amounts' })
  async updateFeeMatrix(
    @Body() dto: UpdateFeeMatrixDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.updateFeeMatrix(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('scholarships')
  @Permissions('finance:fees:read')
  @ApiOperation({ summary: 'List scholarships' })
  async listScholarships(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.listScholarships(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('scholarships')
  @Permissions('finance:fees:write')
  @ApiOperation({ summary: 'Create scholarship' })
  async createScholarship(
    @Body() dto: CreateScholarshipDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.createScholarship(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('concessions')
  @Permissions('finance:fees:read')
  @ApiOperation({ summary: 'List fee concessions' })
  async listConcessions(
    @Query() query: ListConcessionsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.listConcessions(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('concessions')
  @Permissions('finance:fees:write')
  @ApiOperation({ summary: 'Create fee concession' })
  async createConcession(
    @Body() dto: CreateConcessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.createConcession(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('overdue')
  @Permissions('finance:fees:read')
  @ApiOperation({ summary: 'Overdue invoices with AI default risk flag' })
  async getOverdue(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.getOverdueInvoices(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('collection-stats')
  @Permissions('finance:fees:read')
  @ApiOperation({ summary: 'Collection by class for chart' })
  async getCollectionStats(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.getCollectionStats(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  @Get('invoices')
  @Permissions('finance:payments:read')
  @ApiOperation({ summary: 'List student invoices' })
  async listInvoices(
    @Query() query: ListInvoicesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.listInvoices(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('invoices/:id')
  @Permissions('finance:payments:read')
  @ApiOperation({ summary: 'Invoice detail with line items' })
  async getInvoice(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.getInvoice(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('invoices')
  @Permissions('finance:payments:write')
  @ApiOperation({ summary: 'Generate invoice for student' })
  async generateInvoice(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.generateInvoice(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('payments')
  @Permissions('finance:payments:read')
  @ApiOperation({ summary: 'Payment history' })
  async listPayments(
    @Query() query: ListPaymentsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.listPayments(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('payments/initiate')
  @Permissions('finance:payments:write')
  @ApiOperation({ summary: 'Initiate payment via gateway' })
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.initiatePayment(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('payments/confirm')
  @Permissions('finance:payments:write')
  @ApiOperation({ summary: 'Confirm gateway payment success' })
  async confirmPayment(
    @Body() dto: ConfirmPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.confirmPayment(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('payments/:id/receipt')
  @Permissions('finance:payments:read')
  @ApiOperation({ summary: 'Receipt data for PDF generation' })
  async getReceipt(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.getReceipt(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('payments/refund')
  @Permissions('finance:payments:write')
  @ApiOperation({ summary: 'Refund a completed payment' })
  async refundPayment(
    @Body() dto: RefundPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.refundPayment(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Financial Performance ───────────────────────────────────────────────────

  @Get('performance/summary')
  @Permissions('finance:fees:read')
  @ApiOperation({ summary: 'Financial performance summary' })
  async getPerformanceSummary(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.getPerformanceSummary(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('performance/monthly')
  @Permissions('finance:fees:read')
  @ApiOperation({ summary: '12-month income/expense chart data' })
  async getPerformanceMonthly(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.getPerformanceMonthly(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('performance/by-category')
  @Permissions('finance:fees:read')
  @ApiOperation({ summary: 'Fee category breakdown' })
  async getPerformanceByCategory(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.getPerformanceByCategory(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Gateway ───────────────────────────────────────────────────────────────

  @Get('gateway')
  @Permissions('school:settings:write')
  @ApiOperation({ summary: 'Payment gateway config (masked keys)' })
  async getGatewayConfig(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.getGatewayConfig(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('gateway')
  @Permissions('school:settings:write')
  @ApiOperation({ summary: 'Update payment gateway settings' })
  async updateGatewayConfig(
    @Body() dto: UpdateGatewayConfigDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.finance.updateGatewayConfig(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
