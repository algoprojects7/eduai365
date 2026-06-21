import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { config } from '@eduai365/config';
import type { AuthenticatedUser, AuthTokens, LoginResponse } from '@eduai365/shared-types';
import { getPermissionsForRole } from '@eduai365/rbac';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import type { ChangePasswordDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { school: { select: { id: true, slug: true, isActive: true } } },
    });

    if (!user || !user.isActive) {
      await this.recordLoginFailure(dto.email, ipAddress, userAgent, 'Invalid credentials');
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      await this.recordLoginFailure(dto.email, ipAddress, userAgent, 'Invalid password');
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role !== 'SUPER_ADMIN') {
      if (!user.schoolId || !user.school) {
        throw new BadRequestException('User is not assigned to a school');
      }
      if (!user.school.isActive) {
        throw new ForbiddenException('School tenant is inactive');
      }
      if (dto.schoolSlug && user.school.slug !== dto.schoolSlug.toLowerCase()) {
        throw new ForbiddenException('User does not belong to the specified school tenant');
      }
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role, user.schoolId ?? undefined);

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.client.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        success: true,
      },
    });

    await this.auditService.log({
      action: 'auth.login',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      schoolId: user.schoolId ?? undefined,
      ipAddress,
    });

    const authenticatedUser = this.toAuthenticatedUser(user);

    return { user: authenticatedUser, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.client.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    await this.prisma.client.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      stored.user.schoolId ?? undefined,
    );
  }

  async logout(refreshToken: string, userId?: string) {
    await this.prisma.client.refreshToken.updateMany({
      where: {
        token: refreshToken,
        ...(userId ? { userId } : {}),
      },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthenticatedUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const validPassword = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!validPassword) {
      throw new BadRequestException('Incorrect old password');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.auditService.log({
      action: 'auth.change-password',
      entity: 'User',
      entityId: userId,
      userId: userId,
      schoolId: user.schoolId ?? undefined,
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    schoolId?: string,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email, role, schoolId };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: config.jwt.expiresIn as '15m',
    });

    const refreshTokenValue = randomBytes(48).toString('hex');
    const refreshExpiresMs = this.parseExpiry(config.jwt.refreshExpiresIn);

    await this.prisma.client.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: this.parseExpiry(config.jwt.expiresIn) / 1000,
    };
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    role: string;
    schoolId: string | null;
    firstName: string;
    lastName: string;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role as AuthenticatedUser['role'],
      schoolId: user.schoolId ?? undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions: [...getPermissionsForRole(user.role as AuthenticatedUser['role'])],
    };
  }

  private async recordLoginFailure(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
  ) {
    const user = await this.prisma.client.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      await this.prisma.client.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
          success: false,
          failureReason: reason,
        },
      });
    }
  }

  private parseExpiry(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 900_000;
    const amount = Number(match[1]);
    const unit = match[2] ?? 'm';
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return amount * (multipliers[unit] ?? 60_000);
  }
}
