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
import { CreateBookstoreItemDto, IssueBookstoreItemDto, ReturnBookstoreItemDto, RecordDamageFineDto } from './dto/bookstore.dto';
import { CreateClubDto, JoinClubDto } from './dto/clubs.dto';
import {
  CreateInfirmaryVisitDto,
  HealthRecordsQueryDto,
  InfirmaryVisitsQueryDto,
  UpdateHealthRecordDto,
} from './dto/health.dto';
import {
  CreateLibraryBookDto,
  IssueLibraryBookDto,
  ListLibraryIssuesQueryDto,
  UpdateLibraryBookDto,
} from './dto/library.dto';
import {
  AllocateStudentTransportDto,
  CreateTransportRouteDto,
} from './dto/transport.dto';
import {
  CreateUniformOrderDto,
  ListUniformOrdersQueryDto,
  UpdateUniformStockDto,
} from './dto/uniform.dto';
import { OperationsService } from './operations.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const OPS_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'LIBRARIAN',
  'TRANSPORT_MANAGER',
  'HOSTEL_WARDEN',
  'COUNSELLOR',
  'RECEPTIONIST',
  'TEACHER',
  'CLUB_MANAGER',
  'ASSET_MANAGER',
  'OPERATOR',
  'HR_MANAGER',
] as const;

@ApiTags('operations')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles(...OPS_ROLES)
@Controller('operations')
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  // ─── Library ───────────────────────────────────────────────────────────────

  @Get('library/books')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'List library books' })
  async listLibraryBooks(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listLibraryBooks(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('library/books')
  @Permissions('library:books:write')
  @ApiOperation({ summary: 'Add library book' })
  async createLibraryBook(
    @Body() dto: CreateLibraryBookDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.createLibraryBook(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('library/books/:id')
  @Permissions('library:books:write')
  @ApiOperation({ summary: 'Update library book' })
  async updateLibraryBook(
    @Param('id') id: string,
    @Body() dto: UpdateLibraryBookDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.updateLibraryBook(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('library/issues')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'List library issues' })
  async listLibraryIssues(
    @Query() query: ListLibraryIssuesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listLibraryIssues(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('library/issues')
  @Permissions('library:issues:manage')
  @ApiOperation({ summary: 'Issue book to student' })
  async issueLibraryBook(
    @Body() dto: IssueLibraryBookDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.issueLibraryBook(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('library/issues/return/:id')
  @Permissions('library:issues:manage')
  @ApiOperation({ summary: 'Return issued book' })
  async returnLibraryBook(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.returnLibraryBook(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('library/overdue')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'List overdue library issues' })
  async listOverdueLibraryIssues(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listOverdueLibraryIssues(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('library/stats')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'Library inventory statistics' })
  async getLibraryStats(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.getLibraryStats(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Transport ─────────────────────────────────────────────────────────────

  @Get('transport/routes')
  @Permissions('transport:routes:read')
  @ApiOperation({ summary: 'List transport routes' })
  async listTransportRoutes(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listTransportRoutes(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('transport/routes')
  @Permissions('transport:routes:write')
  @ApiOperation({ summary: 'Create transport route' })
  async createTransportRoute(
    @Body() dto: CreateTransportRouteDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.createTransportRoute(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('transport/vehicles')
  @Permissions('transport:routes:read')
  @ApiOperation({ summary: 'List transport vehicles' })
  async listTransportVehicles(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listTransportVehicles(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('transport/allocations')
  @Permissions('transport:routes:read')
  @ApiOperation({ summary: 'List student transport allocations' })
  async listTransportAllocations(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listTransportAllocations(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('transport/allocate')
  @Permissions('transport:routes:write')
  @ApiOperation({ summary: 'Allocate student to transport route' })
  async allocateStudentTransport(
    @Body() dto: AllocateStudentTransportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.allocateStudentTransport(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Health ────────────────────────────────────────────────────────────────

  @Get('health/records')
  @Permissions('students:read')
  @ApiOperation({ summary: 'List health records' })
  async listHealthRecords(
    @Query() query: HealthRecordsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listHealthRecords(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('health/records/:studentId')
  @Permissions('students:write')
  @ApiOperation({ summary: 'Create or update student health record' })
  async updateHealthRecord(
    @Param('studentId') studentId: string,
    @Body() dto: UpdateHealthRecordDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.updateHealthRecord(tenant, studentId, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('health/infirmary')
  @Permissions('students:read')
  @ApiOperation({ summary: 'List infirmary visits' })
  async listInfirmaryVisits(
    @Query() query: InfirmaryVisitsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listInfirmaryVisits(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('health/infirmary')
  @Permissions('students:write')
  @ApiOperation({ summary: 'Log infirmary visit' })
  async createInfirmaryVisit(
    @Body() dto: CreateInfirmaryVisitDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.createInfirmaryVisit(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Clubs ─────────────────────────────────────────────────────────────────

  @Get('clubs')
  @Permissions('students:read')
  @ApiOperation({ summary: 'List school clubs' })
  async listClubs(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listClubs(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('clubs')
  @Permissions('students:write')
  @ApiOperation({ summary: 'Create club' })
  async createClub(
    @Body() dto: CreateClubDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.createClub(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('clubs/join/:clubId')
  @Permissions('students:write')
  @ApiOperation({ summary: 'Add student to club' })
  async joinClub(
    @Param('clubId') clubId: string,
    @Body() dto: JoinClubDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.joinClub(tenant, clubId, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('clubs/members/:clubId')
  @Permissions('students:read')
  @ApiOperation({ summary: 'List club members' })
  async listClubMembers(
    @Param('clubId') clubId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listClubMembers(tenant, clubId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Uniform ─────────────────────────────────────────────────────────────────

  @Get('uniform/items')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'List uniform inventory' })
  async listUniformItems(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listUniformItems(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('uniform/items/:id/stock')
  @Permissions('hostel:rooms:write')
  @ApiOperation({ summary: 'Update uniform item stock' })
  async updateUniformStock(
    @Param('id') id: string,
    @Body() dto: UpdateUniformStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.updateUniformStock(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('uniform/orders')
  @Permissions('hostel:residents:manage')
  @ApiOperation({ summary: 'Place uniform order' })
  async createUniformOrder(
    @Body() dto: CreateUniformOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.createUniformOrder(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('uniform/orders')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'List uniform orders' })
  async listUniformOrders(
    @Query() query: ListUniformOrdersQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listUniformOrders(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Bookstore ───────────────────────────────────────────────────────────────

  @Get('bookstore/items')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'List bookstore items' })
  async listBookstoreItems(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listBookstoreItems(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('bookstore/issue')
  @Permissions('library:issues:manage')
  @ApiOperation({ summary: 'Issue textbook to student' })
  async issueBookstoreItem(
    @Body() dto: IssueBookstoreItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.issueBookstoreItem(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('bookstore/return')
  @Permissions('library:issues:manage')
  @ApiOperation({ summary: 'Return issued textbook' })
  async returnBookstoreItem(
    @Body() dto: ReturnBookstoreItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.returnBookstoreItem(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('bookstore/items')
  @Permissions('library:books:write')
  @ApiOperation({ summary: 'Create bookstore item' })
  async createBookstoreItem(
    @Body() dto: CreateBookstoreItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.createBookstoreItem(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('bookstore/stats')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'Get bookstore stats' })
  async getBookstoreStats(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.getBookstoreStats(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('bookstore/inventory')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'List bookstore inventory (textbooks)' })
  async listBookstoreInventory(
    @Query('search') search: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listBookstoreInventory(tenant, search);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('bookstore/issued')
  @Permissions('library:issues:manage')
  @ApiOperation({ summary: 'List textbook issues' })
  async listBookstoreIssued(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listBookstoreIssued(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('bookstore/damage-reports')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'List textbook damage reports' })
  async listBookstoreDamageReports(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.listBookstoreDamageReports(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('bookstore/analytics/stock')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'Get bookstore stock distribution' })
  async getBookstoreStockChart(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.getBookstoreStockChart(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('bookstore/ai/forecast')
  @Permissions('library:books:read')
  @ApiOperation({ summary: 'Get AI forecasting for textbooks' })
  async getBookstoreForecast(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.getBookstoreForecast(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('bookstore/damage-fine')
  @Permissions('library:issues:manage')
  @ApiOperation({ summary: 'Record damage fine' })
  async recordBookstoreDamageFine(
    @Body() dto: RecordDamageFineDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.operations.recordBookstoreDamageFine(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
