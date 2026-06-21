import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ComplianceService } from './compliance.service';
import { RecordConsentDto } from './dto/consent.dto';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

@ApiTags('compliance')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: false })
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get('consent')
  @ApiOperation({ summary: 'Get current user consent preferences (DPDPA/GDPR)' })
  async getConsent(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const data = await this.compliance.getConsent(user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('consent')
  @ApiOperation({ summary: 'Record or update consent preferences' })
  async recordConsent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordConsentDto,
    @Req() req: Request,
  ): ApiResult {
    const data = await this.compliance.recordConsent(user.id, dto, req.ip);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export personal data for the current user as JSON' })
  async exportData(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const data = await this.compliance.exportUserData(user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('account')
  @ApiOperation({ summary: 'Request account deletion (soft delete mock)' })
  async requestDeletion(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): ApiResult {
    const data = await this.compliance.requestAccountDeletion(user.id, req.ip);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
