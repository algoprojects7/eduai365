import {
  Body,
  Controller,
  Delete,
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
import type {
  CheckoutAssetDto,
  CreateAssetDto,
  ListAssetCheckoutsQueryDto,
  UpdateAssetDto,
} from './dto/assets.dto';
import type {
  CreateAlumniCampaignDto,
  CreateAlumniProfileDto,
  ListAlumniQueryDto,
  UpdateAlumniCampaignDto,
  UpdateAlumniProfileDto,
} from './dto/alumni.dto';
import type {
  AssignHostelResidentDto,
  CheckoutHostelResidentDto,
  CreateHostelBlockDto,
  CreateHostelRoomDto,
  CreateVisitorLogDto,
  ListHostelResidentsQueryDto,
  UpdateHostelBlockDto,
  UpdateHostelRoomDto,
} from './dto/hostel.dto';
import type {
  AdjustInventoryStockDto,
  CreateInventoryItemDto,
  UpdateConsumableStockDto,
  UpdateInventoryItemDto,
} from './dto/inventory.dto';
import { ExtendedService } from './extended.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const EXTENDED_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'HOSTEL_WARDEN',
  'RECEPTIONIST',
  'ACCOUNTANT',
  'HR_MANAGER',
  'ASSET_MANAGER',
  'OPERATOR',
] as const;

@ApiTags('extended')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles(...EXTENDED_ROLES)
@Controller('extended')
export class ExtendedController {
  constructor(private readonly extended: ExtendedService) {}

  // ─── Assets ────────────────────────────────────────────────────────────────

  @Get('assets')
  @Permissions('assets:read')
  @ApiOperation({ summary: 'List school assets' })
  async listAssets(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listAssets(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('assets/checkouts')
  @Permissions('assets:read')
  @ApiOperation({ summary: 'List asset checkouts' })
  async listAssetCheckouts(
    @Query() query: ListAssetCheckoutsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listAssetCheckouts(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('assets/:id')
  @Permissions('assets:read')
  @ApiOperation({ summary: 'Get asset by id' })
  async getAsset(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.getAsset(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('assets')
  @Permissions('assets:write')
  @ApiOperation({ summary: 'Create asset' })
  async createAsset(
    @Body() dto: CreateAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.createAsset(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('assets/:id')
  @Permissions('assets:write')
  @ApiOperation({ summary: 'Update asset' })
  async updateAsset(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.updateAsset(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('assets/:id')
  @Permissions('assets:write')
  @ApiOperation({ summary: 'Delete asset' })
  async deleteAsset(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.deleteAsset(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('assets/:id/checkout')
  @Permissions('assets:checkout')
  @ApiOperation({ summary: 'Check out asset to employee' })
  async checkoutAsset(
    @Param('id') id: string,
    @Body() dto: CheckoutAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.checkoutAsset(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('assets/checkouts/:checkoutId/return')
  @Permissions('assets:checkout')
  @ApiOperation({ summary: 'Return checked-out asset' })
  async returnAsset(
    @Param('checkoutId') checkoutId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.returnAsset(tenant, checkoutId, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Alumni ────────────────────────────────────────────────────────────────

  @Get('alumni')
  @Permissions('alumni:read')
  @ApiOperation({ summary: 'List alumni directory' })
  async listAlumniProfiles(
    @Query() query: ListAlumniQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listAlumniProfiles(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('alumni/campaigns')
  @Permissions('alumni:read')
  @ApiOperation({ summary: 'List alumni fundraising campaigns' })
  async listAlumniCampaigns(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listAlumniCampaigns(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('alumni/campaigns/:id')
  @Permissions('alumni:read')
  @ApiOperation({ summary: 'Get alumni campaign' })
  async getAlumniCampaign(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.getAlumniCampaign(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('alumni/campaigns')
  @Permissions('alumni:write')
  @ApiOperation({ summary: 'Create alumni campaign' })
  async createAlumniCampaign(
    @Body() dto: CreateAlumniCampaignDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.createAlumniCampaign(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('alumni/campaigns/:id')
  @Permissions('alumni:write')
  @ApiOperation({ summary: 'Update alumni campaign' })
  async updateAlumniCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateAlumniCampaignDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.updateAlumniCampaign(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('alumni/:id')
  @Permissions('alumni:read')
  @ApiOperation({ summary: 'Get alumni profile' })
  async getAlumniProfile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.getAlumniProfile(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('alumni')
  @Permissions('alumni:write')
  @ApiOperation({ summary: 'Create alumni profile' })
  async createAlumniProfile(
    @Body() dto: CreateAlumniProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.createAlumniProfile(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('alumni/:id')
  @Permissions('alumni:write')
  @ApiOperation({ summary: 'Update alumni profile' })
  async updateAlumniProfile(
    @Param('id') id: string,
    @Body() dto: UpdateAlumniProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.updateAlumniProfile(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('alumni/:id')
  @Permissions('alumni:write')
  @ApiOperation({ summary: 'Delete alumni profile' })
  async deleteAlumniProfile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.deleteAlumniProfile(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Hostel ────────────────────────────────────────────────────────────────

  @Get('hostel/blocks')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'List hostel blocks with rooms' })
  async listHostelBlocks(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listHostelBlocks(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('hostel/blocks')
  @Permissions('hostel:rooms:write')
  @ApiOperation({ summary: 'Create hostel block' })
  async createHostelBlock(
    @Body() dto: CreateHostelBlockDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.createHostelBlock(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('hostel/blocks/:id')
  @Permissions('hostel:rooms:write')
  @ApiOperation({ summary: 'Update hostel block' })
  async updateHostelBlock(
    @Param('id') id: string,
    @Body() dto: UpdateHostelBlockDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.updateHostelBlock(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('hostel/blocks/:id')
  @Permissions('hostel:rooms:write')
  @ApiOperation({ summary: 'Delete hostel block' })
  async deleteHostelBlock(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.deleteHostelBlock(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('hostel/blocks/:blockId/rooms')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'List rooms in hostel block' })
  async listHostelRooms(
    @Param('blockId') blockId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listHostelRooms(tenant, blockId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('hostel/blocks/:blockId/rooms')
  @Permissions('hostel:rooms:write')
  @ApiOperation({ summary: 'Create hostel room' })
  async createHostelRoom(
    @Param('blockId') blockId: string,
    @Body() dto: CreateHostelRoomDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.createHostelRoom(tenant, blockId, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('hostel/rooms/:id')
  @Permissions('hostel:rooms:write')
  @ApiOperation({ summary: 'Update hostel room' })
  async updateHostelRoom(
    @Param('id') id: string,
    @Body() dto: UpdateHostelRoomDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.updateHostelRoom(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('hostel/rooms/:id')
  @Permissions('hostel:rooms:write')
  @ApiOperation({ summary: 'Delete hostel room' })
  async deleteHostelRoom(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.deleteHostelRoom(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('hostel/residents')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'List hostel residents' })
  async listHostelResidents(
    @Query() query: ListHostelResidentsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listHostelResidents(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('hostel/residents')
  @Permissions('hostel:residents:manage')
  @ApiOperation({ summary: 'Assign student to hostel room' })
  async assignHostelResident(
    @Body() dto: AssignHostelResidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.assignHostelResident(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('hostel/residents/:id/checkout')
  @Permissions('hostel:residents:manage')
  @ApiOperation({ summary: 'Check out hostel resident' })
  async checkoutHostelResident(
    @Param('id') id: string,
    @Body() dto: CheckoutHostelResidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.checkoutHostelResident(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('hostel/stats')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'Hostel occupancy and fee KPIs' })
  async getHostelStats(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.getHostelStats(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('hostel/rooms')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'Room allocation overview for UI' })
  async getHostelRoomsOverview(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.getHostelRoomsOverview(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('hostel/mess')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'Weekly mess menu (mock)' })
  async getMessMenu(@CurrentUser() user: AuthenticatedUser): ApiResult {
    assertTenantAccess(user);
    const data = await this.extended.getMessMenu();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('hostel/visitors')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'Hostel visitor log' })
  async listHostelVisitors(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listVisitors(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('hostel/visitors')
  @Permissions('hostel:residents:manage')
  @ApiOperation({ summary: 'Log hostel visitor' })
  async createHostelVisitor(
    @Body() dto: CreateVisitorLogDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.createVisitor(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('hostel/visitors/:id/checkout')
  @Permissions('hostel:residents:manage')
  @ApiOperation({ summary: 'Check out hostel visitor' })
  async checkoutHostelVisitor(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.checkoutVisitor(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('hostel/fees')
  @Permissions('hostel:rooms:read')
  @ApiOperation({ summary: 'Hostel fee ledger (mock)' })
  async listHostelFees(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listHostelFees(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Inventory ─────────────────────────────────────────────────────────────

  @Get('inventory/stats')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'General inventory KPIs' })
  async getInventoryStats(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.getInventoryStats(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('inventory/items')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Consumables stock for UI' })
  async listConsumables(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listConsumables(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('inventory/alerts')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Reorder alerts for low/out-of-stock items' })
  async listReorderAlerts(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listReorderAlerts(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('inventory/items/:id/stock')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Set consumable stock level' })
  async updateConsumableStock(
    @Param('id') id: string,
    @Body() dto: UpdateConsumableStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.updateConsumableStock(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('inventory')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List inventory items' })
  async listInventoryItems(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.listInventoryItems(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('inventory/:id')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Get inventory item' })
  async getInventoryItem(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.getInventoryItem(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('inventory')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Create inventory item' })
  async createInventoryItem(
    @Body() dto: CreateInventoryItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.createInventoryItem(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('inventory/:id')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Update inventory item' })
  async updateInventoryItem(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.updateInventoryItem(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('inventory/:id/stock')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Adjust inventory stock quantity' })
  async adjustInventoryStock(
    @Param('id') id: string,
    @Body() dto: AdjustInventoryStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.adjustInventoryStock(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('inventory/:id')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Delete inventory item' })
  async deleteInventoryItem(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.extended.deleteInventoryItem(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
