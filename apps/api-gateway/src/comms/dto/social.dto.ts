import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSocialPostDto {
  @ApiProperty({ description: 'The text content of the social network message' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content!: string;
}
