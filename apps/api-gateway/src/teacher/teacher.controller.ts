import {
  Body,
  Controller,
  Get,
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
import { Roles } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateHomeworkDto } from '../academics/dto/homework.dto';
import { assertTenantAccess } from '../school-admin/helpers/tenant-access.helper';
import {
  AttendanceQueryDto,
  GradebookQueryDto,
  MarkAttendanceDto,
} from './dto/attendance.dto';
import { TeacherService } from './teacher.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

@ApiTags('teacher')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles('TEACHER', 'PRINCIPAL')
@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacher: TeacherService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Teacher dashboard overview' })
  async dashboard(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.teacher.getDashboard(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('classes')
  @ApiOperation({ summary: 'Assigned classes with student counts' })
  async classes(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.teacher.getClasses(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Class attendance for a date' })
  async attendance(
    @Query() query: AttendanceQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.teacher.getAttendance(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('attendance')
  @ApiOperation({ summary: 'Mark class attendance' })
  async markAttendance(
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.teacher.markAttendance(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('gradebook')
  @ApiOperation({ summary: 'Gradebook grid for a class' })
  async gradebook(
    @Query() query: GradebookQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.teacher.getGradebook(tenant, query.classId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('homework')
  @ApiOperation({ summary: 'Homework created by teacher' })
  async homework(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.teacher.listHomework(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('homework')
  @ApiOperation({ summary: 'Create homework assignment' })
  async createHomework(
    @Body() dto: CreateHomeworkDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.teacher.createHomework(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('timetable/today')
  @ApiOperation({ summary: "Today's timetable periods" })
  async todayTimetable(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.teacher.getTodayTimetable(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
