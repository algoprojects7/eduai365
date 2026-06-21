import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'principal@greenfield.eduai365.ai' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'AlgoDemo#2026' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: 'greenfield', description: 'Required for school-scoped users' })
  @IsOptional()
  @IsString()
  schoolSlug?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword#123' })
  @IsString()
  @MinLength(6)
  oldPassword!: string;

  @ApiProperty({ example: 'NewPassword#123' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}

