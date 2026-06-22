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
import { assertTenantAccess } from './helpers/tenant-access.helper';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateSchoolProfileDto } from './dto/update-school-profile.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { SchoolAdminService } from './school-admin.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const SCHOOL_STAFF_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'TEACHER',
  'ACCOUNTANT',
  'RECEPTIONIST',
  'LIBRARIAN',
  'TRANSPORT_MANAGER',
  'HR_MANAGER',
  'HOSTEL_WARDEN',
  'EXAM_CONTROLLER',
  'COUNSELLOR',
  'CLUB_MANAGER',
  'ASSET_MANAGER',
  'OPERATOR',
] as const;

@ApiTags('school-admin')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles(...SCHOOL_STAFF_ROLES)
@Controller('school')
export class SchoolAdminController {
  constructor(private readonly schoolAdmin: SchoolAdminService) {}

  @Get('dashboard')
  @Permissions('school:reports:read')
  @ApiOperation({ summary: 'School admin KPI dashboard' })
  async dashboard(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.schoolAdmin.getDashboard(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Current school branding and plan' })
  async profile(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.schoolAdmin.getProfile(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('profile')
  @Permissions('school:settings:write')
  @ApiOperation({ summary: 'Update school branding and settings' })
  async updateProfile(
    @Body() dto: UpdateSchoolProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.schoolAdmin.updateProfile(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('students')
  @Permissions('students:read')
  @ApiOperation({ summary: 'List students (paginated)' })
  async listStudents(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    assertTenantAccess(user);
    const data = await this.schoolAdmin.listStudents(query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('students/:id')
  @Permissions('students:read')
  @ApiOperation({ summary: 'Get student detail' })
  async getStudent(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): ApiResult {
    assertTenantAccess(user);
    const data = await this.schoolAdmin.getStudent(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('students')
  @Permissions('students:write')
  @ApiOperation({ summary: 'Create a student record' })
  async createStudent(
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.schoolAdmin.createStudent(dto, user, tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('students/:id')
  @Permissions('students:write')
  @ApiOperation({ summary: 'Update a student record' })
  async updateStudent(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.schoolAdmin.updateStudent(id, dto, user, tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('teachers')
  @Permissions('school:users:read')
  @ApiOperation({ summary: 'List staff / teachers' })
  async listTeachers(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.schoolAdmin.listTeachers(query, tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('teachers/:id')
  @Permissions('school:users:read')
  @ApiOperation({ summary: 'Get staff / teacher detail' })
  async getTeacher(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.schoolAdmin.getTeacher(id, tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('teachers')
  @Permissions('school:users:write')
  @ApiOperation({ summary: 'Create a staff / teacher user' })
  async createTeacher(
    @Body() dto: CreateTeacherDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.schoolAdmin.createTeacher(dto, user, tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('activity')
  @Permissions('school:reports:read')
  @ApiOperation({ summary: 'Pending approvals activity feed' })
  async activity(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.schoolAdmin.getActivityFeed(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
