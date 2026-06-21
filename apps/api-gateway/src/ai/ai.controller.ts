import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
import { AiService } from './ai.service';
import { ChatCopilotDto } from './dto/chat.dto';
import { DashboardInsightsQueryDto } from './dto/insights.dto';
import { GenerateLessonPlanDto } from './dto/lesson-plan.dto';
import { GenerateReportNarrativeDto } from './dto/report-narrative.dto';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const AI_CHAT_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'TEACHER',
  'PARENT',
  'STUDENT',
] as const;

const AI_ANALYTICS_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'COUNSELLOR',
] as const;

const AI_TEACHER_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'TEACHER',
] as const;

@ApiTags('ai')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  @Roles(...AI_CHAT_ROLES)
  @ApiOperation({ summary: 'Role-aware copilot chat with RAG citations' })
  async chat(
    @Body() dto: ChatCopilotDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.ai.chat(tenant, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('insights/dashboard')
  @Roles(...AI_CHAT_ROLES)
  @ApiOperation({ summary: 'AI insight cards for role dashboards' })
  async dashboardInsights(
    @Query() query: DashboardInsightsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    assertTenantAccess(user);
    const data = this.ai.getDashboardInsights(query.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('predictions/dropout-risk')
  @Roles(...AI_ANALYTICS_ROLES)
  @Permissions('school:reports:read', 'students:read')
  @ApiOperation({ summary: 'Student dropout risk predictions' })
  async dropoutRisk(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.ai.getDropoutRisk(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('predictions/fee-default')
  @Roles(...AI_ANALYTICS_ROLES)
  @Permissions('school:reports:read', 'finance:fees:read')
  @ApiOperation({ summary: 'Fee default risk predictions' })
  async feeDefault(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.ai.getFeeDefaultPredictions(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('predictions/attendance')
  @Roles(...AI_ANALYTICS_ROLES)
  @Permissions('school:reports:read', 'students:attendance:read')
  @ApiOperation({ summary: 'At-risk attendance predictions' })
  async attendanceRisk(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.ai.getAttendanceRisk(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('lesson-plan/generate')
  @Roles(...AI_TEACHER_ROLES)
  @Permissions('academics:classes:read')
  @ApiOperation({ summary: 'Generate teacher lesson plan' })
  async generateLessonPlan(
    @Body() dto: GenerateLessonPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    assertTenantAccess(user);
    const data = await this.ai.generateLessonPlan(dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('report/narrative')
  @Roles(...AI_TEACHER_ROLES)
  @Permissions('school:reports:read')
  @ApiOperation({ summary: 'Generate narrative report text' })
  async generateReportNarrative(
    @Body() dto: GenerateReportNarrativeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    assertTenantAccess(user);
    const data = await this.ai.generateReportNarrative(dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
