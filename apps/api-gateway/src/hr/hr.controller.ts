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
  EnrollEmployeeDto,
  ListEmployeesQueryDto,
  UpdateEmployeeDto,
} from './dto/employees.dto';
import {
  ApplyLeaveDto,
  LeaveBalancesQueryDto,
  LeaveCalendarQueryDto,
  ListLeaveQueryDto,
  UpdateLeaveDto,
} from './dto/leave.dto';
import { ListPayrollQueryDto, RunPayrollDto } from './dto/payroll.dto';
import {
  AssignSubstitutionDto,
  ListSubstitutionsQueryDto,
  SubstitutionSuggestionsQueryDto,
} from './dto/substitution.dto';
import { HrService } from './hr.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const HR_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'HR_MANAGER',
] as const;

@ApiTags('hr')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles(...HR_ROLES)
@Controller('hr')
export class HrController {
  constructor(private readonly hr: HrService) {}

  // ─── Employees ─────────────────────────────────────────────────────────────

  @Get('employees/stats')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'Employee counts by type and on-leave' })
  async getEmployeeStats(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.getEmployeeStats(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('employees')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'List employees with optional type filter' })
  async listEmployees(
    @Query() query: ListEmployeesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.listEmployees(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('employees/:id')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'Employee profile detail' })
  async getEmployee(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.getEmployee(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('employees/enroll')
  @Permissions('hr:employees:write')
  @ApiOperation({ summary: 'Enroll employee (create user + profile)' })
  async enrollEmployee(
    @Body() dto: EnrollEmployeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.enrollEmployee(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('employees/:id')
  @Permissions('hr:employees:write')
  @ApiOperation({ summary: 'Update employee profile' })
  async updateEmployee(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.updateEmployee(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Leave ─────────────────────────────────────────────────────────────────

  @Get('leave/trends')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'Leave trends chart data by month and type' })
  async getLeaveTrends(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.getLeaveTrends(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('leave/balances')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'Leave balances by employee' })
  async getLeaveBalances(
    @Query() query: LeaveBalancesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.getLeaveBalances(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('leave/calendar')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'Approved leave calendar for a month' })
  async getLeaveCalendar(
    @Query() query: LeaveCalendarQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.getLeaveCalendar(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('leave')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'List leave requests' })
  async listLeave(
    @Query() query: ListLeaveQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.listLeave(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('leave')
  @Permissions('hr:employees:write')
  @ApiOperation({ summary: 'Apply for leave' })
  async applyLeave(
    @Body() dto: ApplyLeaveDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.applyLeave(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('leave/:id')
  @Permissions('hr:employees:write')
  @ApiOperation({ summary: 'Approve or reject leave request' })
  async updateLeave(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.updateLeave(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Payroll ─────────────────────────────────────────────────────────────────

  @Get('payroll')
  @Permissions('hr:payroll:read')
  @ApiOperation({ summary: 'List payroll runs' })
  async listPayrollRuns(
    @Query() query: ListPayrollQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.listPayrollRuns(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('payroll/run')
  @Permissions('hr:payroll:write')
  @ApiOperation({ summary: 'Create and process payroll for a month' })
  async runPayroll(
    @Body() dto: RunPayrollDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.runPayroll(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('payroll/:id')
  @Permissions('hr:payroll:read')
  @ApiOperation({ summary: 'Payroll run with entries table' })
  async getPayrollRun(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.getPayrollRun(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('payroll/:id/pay')
  @Permissions('hr:payroll:write')
  @ApiOperation({ summary: 'Mark payroll run as paid' })
  async markPayrollPaid(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.markPayrollPaid(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('payroll/:id/slip/:employeeId')
  @Permissions('hr:payroll:read')
  @ApiOperation({ summary: 'Salary slip data for an employee' })
  async getSalarySlip(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.getSalarySlip(tenant, id, employeeId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Substitution ────────────────────────────────────────────────────────────

  @Get('substitutions/suggestions')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'AI smart-match substitute teacher suggestions' })
  async getSubstitutionSuggestions(
    @Query() query: SubstitutionSuggestionsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.getSubstitutionSuggestions(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('substitutions')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'List substitution assignments with AI scores' })
  async listSubstitutions(
    @Query() query: ListSubstitutionsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.listSubstitutions(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('substitutions')
  @Permissions('hr:employees:write')
  @ApiOperation({ summary: 'Assign substitute teacher' })
  async assignSubstitution(
    @Body() dto: AssignSubstitutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.assignSubstitution(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  @Get('analytics/faculty')
  @Permissions('hr:employees:read')
  @ApiOperation({ summary: 'Faculty metrics and contract expiry AI alerts' })
  async getFacultyAnalytics(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.hr.getFacultyAnalytics(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
