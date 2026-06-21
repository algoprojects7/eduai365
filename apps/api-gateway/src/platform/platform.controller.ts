import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { Permissions, Roles } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSchoolDto } from './dto/create-school.dto';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('dashboard')
  @Permissions('super_admin:schools:read')
  @ApiOperation({ summary: 'Super Admin platform KPI dashboard' })
  async dashboard() {
    const data = await this.platform.getDashboard();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('schools')
  @Permissions('super_admin:schools:read')
  @ApiOperation({ summary: 'List all school tenants with billing summary' })
  async schools(): Promise<{ success: boolean; data: any[]; timestamp: string }> {
    const data = await this.platform.listSchools();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('schools')
  @Permissions('super_admin:schools:write')
  @ApiOperation({ summary: 'Create a new school tenant' })
  async createSchool(
    @Body() dto: CreateSchoolDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.platform.createSchool(dto, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('schools/:id/settings')
  @Permissions('super_admin:schools:write')
  @ApiOperation({ summary: 'Update school settings (disabled services)' })
  async updateSchoolSettings(
    @Param('id') id: string,
    @Body() body: { disabledServices: string[] },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; data: any; timestamp: string }> {
    const data = await this.platform.updateSchoolSettings(id, body, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('revenue')
  @Permissions('super_admin:schools:read')
  @ApiOperation({ summary: '12-month MRR trend for revenue chart' })
  async revenue() {
    const data = await this.platform.getRevenue();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('ai-usage')
  @Permissions('super_admin:schools:read')
  @ApiOperation({ summary: 'AI usage bar chart data per school' })
  async aiUsage() {
    const data = await this.platform.getAiUsage();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('system-health')
  @Permissions('super_admin:schools:read')
  @ApiOperation({ summary: 'Platform system health metrics' })
  async systemHealth() {
    const data = await this.platform.getSystemHealth();
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
