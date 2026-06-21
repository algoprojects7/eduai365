import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Max, Min } from 'class-validator';

export class GpsIngestDto {
  @ApiProperty({ example: 'vehicle_cuid_456' })
  @IsString()
  vehicleId!: string;

  @ApiProperty({ example: 28.6139 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: 77.209 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiProperty({ example: 42.5, description: 'Speed in km/h' })
  @IsNumber()
  @Min(0)
  speed!: number;
}

export interface GpsPosition {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  updatedAt: string;
}
