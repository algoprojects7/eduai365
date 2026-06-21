import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('tenants')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active schools for landing page demo tiles' })
  async listSchools(): Promise<{ success: boolean; data: unknown; timestamp: string }> {
    const schools = await this.prisma.client.school.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        studentCount: true,
        logoUrl: true,
        isVerified: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: schools,
      timestamp: new Date().toISOString(),
    };
  }
}
