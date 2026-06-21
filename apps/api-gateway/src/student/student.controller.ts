import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { Roles } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { assertTenantAccess } from '../school-admin/helpers/tenant-access.helper';
import { StudentService } from './student.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

@ApiTags('student')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles('STUDENT')
@Controller('student')
export class StudentController {
  constructor(private readonly student: StudentService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Student dashboard overview' })
  async dashboard(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.student.getDashboard(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('courses')
  @ApiOperation({ summary: 'Enrolled subjects with grades' })
  async courses(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.student.getCourses(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Homework assignments with due dates' })
  async assignments(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.student.getAssignments(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Monthly attendance heatmap' })
  async attendance(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const y = year ? parseInt(year, 10) : undefined;
    const m = month ? parseInt(month, 10) : undefined;
    const data = await this.student.getAttendance(tenant, user.id, y, m);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('timetable/today')
  @ApiOperation({ summary: "Today's class schedule" })
  async todayTimetable(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.student.getTodayTimetable(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('fees')
  @ApiOperation({ summary: 'Fee status and invoices' })
  async fees(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.student.getFees(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('performance')
  @ApiOperation({ summary: '6-subject performance radar data' })
  async performance(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.student.getPerformance(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('results')
  @ApiOperation({ summary: 'Student exam results (Sessional, Half Yearly, Annual)' })
  async results(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.student.getResults(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
