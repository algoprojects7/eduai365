import {
  BadRequestException,
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
import { AcademicsService } from './academics.service';
import {
  AdvanceAdmissionStageDto,
  CreateAdmissionDto,
  ListAdmissionsQueryDto,
  UpdateAdmissionDto,
} from './dto/admissions.dto';
import {
  CalendarEventsQueryDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
} from './dto/calendar.dto';
import {
  ClassReportCardsQueryDto,
  CreateExamDto,
  CreateExamScheduleEntryDto,
  ExamResultsQueryDto,
  ReportCardsQueryDto,
  UpdateExamResultDto,
  UpdateExamStatusDto,
} from './dto/exams.dto';
import { CreateHomeworkDto, ListHomeworkQueryDto } from './dto/homework.dto';
import {
  ClassTimetableQueryDto,
  TeacherTimetableQueryDto,
  TimetableConflictsQueryDto,
  UpsertTimetableSlotDto,
} from './dto/timetable.dto';
import { CreateSubjectsBatchDto, UpdateSubjectDto } from './dto/subjects.dto';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const ACADEMICS_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'EXAM_CONTROLLER',
  'RECEPTIONIST',
] as const;

@ApiTags('academics')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles(...ACADEMICS_ROLES)
@Controller('academics')
export class AcademicsController {
  constructor(private readonly academics: AcademicsService) {}

  // ─── Admissions ────────────────────────────────────────────────────────────

  @Get('admissions')
  @Permissions('students:admissions:manage')
  @ApiOperation({ summary: 'List admission applications' })
  async listAdmissions(
    @Query() query: ListAdmissionsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.listAdmissions(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('admissions/stats')
  @Permissions('students:admissions:manage')
  @ApiOperation({ summary: 'Admission pipeline statistics' })
  async admissionStats(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.getAdmissionStats(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('admissions/seats')
  @Permissions('students:admissions:manage')
  @ApiOperation({ summary: 'Class-wise seat capacity matrix' })
  async admissionSeats(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.getSeatMatrix(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('admissions')
  @Permissions('students:admissions:manage')
  @ApiOperation({ summary: 'Create admission application' })
  async createAdmission(
    @Body() dto: CreateAdmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.createAdmission(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('admissions/:id')
  @Permissions('students:admissions:manage')
  @ApiOperation({ summary: 'Update admission application' })
  async updateAdmission(
    @Param('id') id: string,
    @Body() dto: UpdateAdmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.updateAdmission(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('admissions/:id/stage')
  @Permissions('students:admissions:manage')
  @ApiOperation({ summary: 'Advance admission to next stage' })
  async advanceAdmissionStage(
    @Param('id') id: string,
    @Body() dto: AdvanceAdmissionStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.advanceAdmissionStage(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Timetable ─────────────────────────────────────────────────────────────

  @Get('timetable/class')
  @Permissions('academics:classes:read')
  @ApiOperation({ summary: 'Class timetable grid (6×8)' })
  async classTimetable(
    @Query() query: ClassTimetableQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.getClassTimetable(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('timetable/teacher')
  @Permissions('academics:classes:read')
  @ApiOperation({ summary: 'Teacher weekly schedule' })
  async teacherTimetable(
    @Query() query: TeacherTimetableQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.getTeacherTimetable(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('timetable/slots')
  @Permissions('academics:classes:write')
  @ApiOperation({ summary: 'Create or update timetable slot' })
  async upsertTimetableSlot(
    @Body() dto: UpsertTimetableSlotDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.upsertTimetableSlot(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('timetable/conflicts')
  @Permissions('academics:classes:read')
  @ApiOperation({ summary: 'Detect teacher and room conflicts' })
  async timetableConflicts(
    @Query() query: TimetableConflictsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.detectTimetableConflicts(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Exams ─────────────────────────────────────────────────────────────────

  @Get('exams')
  @Permissions('exams:schedule:read')
  @ApiOperation({ summary: 'List exams' })
  async listExams(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.listExams(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('exams/:id')
  @Permissions('exams:schedule:read')
  @ApiOperation({ summary: 'Get exam with schedule entries' })
  async getExam(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.getExam(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('exams')
  @Permissions('exams:schedule:write')
  @ApiOperation({ summary: 'Create exam' })
  async createExam(
    @Body() dto: CreateExamDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.createExam(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('exams/:id')
  @Permissions('exams:schedule:write')
  @ApiOperation({ summary: 'Update exam status' })
  async updateExamStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExamStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.updateExamStatus(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('exams/:id/schedule')
  @Permissions('exams:schedule:read')
  @ApiOperation({ summary: 'Exam schedule table' })
  async getExamSchedule(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.getExamSchedule(tenant, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('exams/:id/schedule')
  @Permissions('exams:schedule:write')
  @ApiOperation({ summary: 'Add exam schedule entry' })
  async addExamScheduleEntry(
    @Param('id') id: string,
    @Body() dto: CreateExamScheduleEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.addExamScheduleEntry(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('exams/:id/results')
  @Permissions('exams:results:read')
  @ApiOperation({ summary: 'Mark entry grid for exam' })
  async getExamResults(
    @Param('id') id: string,
    @Query() query: ExamResultsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.getExamResultsGrid(tenant, id, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('exams/:id/results/:studentId')
  @Permissions('exams:results:write')
  @ApiOperation({ summary: 'Update student exam marks' })
  async updateExamResult(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateExamResultDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.updateExamResult(tenant, id, studentId, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Calendar ──────────────────────────────────────────────────────────────

  @Get('calendar/events')
  @Permissions('academics:classes:read')
  @ApiOperation({ summary: 'Calendar events for month' })
  async listCalendarEvents(
    @Query() query: CalendarEventsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.listCalendarEvents(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('calendar/events')
  @Permissions('academics:classes:write')
  @ApiOperation({ summary: 'Create calendar event' })
  async createCalendarEvent(
    @Body() dto: CreateCalendarEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.createCalendarEvent(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('calendar/events/:id')
  @Permissions('academics:classes:write')
  @ApiOperation({ summary: 'Update calendar event' })
  async updateCalendarEvent(
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.updateCalendarEvent(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('calendar/events/:id')
  @Permissions('academics:classes:write')
  @ApiOperation({ summary: 'Delete calendar event' })
  async deleteCalendarEvent(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.deleteCalendarEvent(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Homework ──────────────────────────────────────────────────────────────

  @Get('homework')
  @Permissions('academics:assignments:read')
  @ApiOperation({ summary: 'List homework assignments' })
  async listHomework(
    @Query() query: ListHomeworkQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.listHomework(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('homework')
  @Permissions('academics:assignments:write')
  @ApiOperation({ summary: 'Create homework assignment' })
  async createHomework(
    @Body() dto: CreateHomeworkDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.createHomework(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Report Cards ──────────────────────────────────────────────────────────

  @Get('report-cards')
  @Permissions('exams:results:read')
  @ApiOperation({ summary: 'Student report card' })
  async studentReportCard(
    @Query() query: ReportCardsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.getStudentReportCard(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('report-cards/class')
  @Permissions('exams:results:read')
  @ApiOperation({ summary: 'Bulk report cards for class' })
  async classReportCards(
    @Query() query: ClassReportCardsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.getClassReportCards(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Subjects ──────────────────────────────────────────────────────────────

  @Post('subjects/batch')
  @Permissions('academics:classes:write')
  @ApiOperation({ summary: 'Create subjects in batch for a class' })
  async createSubjectsBatch(
    @Body() dto: CreateSubjectsBatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.createSubjectsBatch(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('subjects/:id')
  @Permissions('academics:classes:write')
  @ApiOperation({ summary: 'Update a specific subject' })
  async updateSubject(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.updateSubject(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('subjects/:id')
  @Permissions('academics:classes:write')
  @ApiOperation({ summary: 'Delete a specific subject' })
  async deleteSubject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.academics.deleteSubject(tenant, id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('subjects')
  @Permissions('academics:classes:read')
  @ApiOperation({ summary: 'Get subjects for a class and session' })
  async getSubjects(
    @Query('session') session: string,
    @Query('className') className: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    if (!session || !className) {
      throw new BadRequestException('session and className are required');
    }
    const data = await this.academics.getSubjects(tenant, session, className);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
