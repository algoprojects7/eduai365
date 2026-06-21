import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
import { ParentService } from './parent.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

@ApiTags('parent')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles('PARENT')
@Controller('parent')
export class ParentController {
  constructor(private readonly parent: ParentService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Parent dashboard with linked children' })
  async dashboard(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getDashboard(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('children')
  @ApiOperation({ summary: 'List linked children' })
  async children(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getChildren(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('children/:id/academics')
  @ApiOperation({ summary: 'Child GPA, rank, and term results' })
  async childAcademics(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getChildAcademics(tenant, user.id, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('children/:id/attendance')
  @ApiOperation({ summary: 'Child monthly attendance summary' })
  async childAttendance(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getChildAttendance(tenant, user.id, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('children/:id/fees')
  @ApiOperation({ summary: 'Child fee outstanding and invoices' })
  async childFees(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getChildFees(tenant, user.id, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('children/:id/exams')
  @ApiOperation({ summary: 'Child upcoming exam schedule' })
  async childExams(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getChildExams(tenant, user.id, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('children/:id/library')
  @ApiOperation({ summary: 'Child library books' })
  async childLibrary(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getChildLibrary(tenant, user.id, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('children/:id/results')
  @ApiOperation({ summary: 'Child exam results (Sessional, Half Yearly, Annual)' })
  async childResults(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getChildResults(tenant, user.id, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('children/:id/assignments')
  @ApiOperation({ summary: 'Child homework assignments' })
  async childAssignments(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getChildAssignments(tenant, user.id, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }


  @Get('messages')
  @ApiOperation({ summary: 'Teacher messages' })
  async messages(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getMessages(tenant, user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('children/add')
  @ApiOperation({ summary: 'Link a child to this parent account by admission number or full name' })
  async addChild(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { admissionNumber?: string; firstName?: string; lastName?: string; relation?: string },
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.addChild(tenant, user.id, {
      admissionNumber: body.admissionNumber,
      firstName: body.firstName,
      lastName: body.lastName,
      relation: body.relation ?? 'Parent',
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('transport/routes')
  @ApiOperation({ summary: 'Get all transport routes' })
  async getTransportRoutes(
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.getTransportRoutes(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('children/:id/apply-bus')
  @ApiOperation({ summary: 'Apply for school bus service for a child' })
  async applyBus(
    @Param('id') id: string,
    @Body() dto: { routeId: string; stopName: string },
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.parent.applyChildBus(tenant, user.id, id, dto.routeId, dto.stopName);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
