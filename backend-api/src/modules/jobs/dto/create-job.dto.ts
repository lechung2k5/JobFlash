import { IsString, IsNotEmpty, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WageType } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({ example: 'Bốc xếp bàn ghế tiệc cưới' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Sự kiện 🎉' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 3, minimum: 1 })
  @IsNumber()
  @Min(1)
  workersNeeded: number;

  @ApiProperty({ enum: WageType, example: WageType.PACKAGE })
  @IsEnum(WageType)
  wageType: WageType;

  @ApiProperty({ example: 350000, description: 'Mức lương trên mỗi thợ (VND)' })
  @IsNumber()
  wagePerWorker: number;

  @ApiProperty({ example: 10.7924, description: 'Vĩ độ điểm tập kết (Latitude)' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 106.6835, description: 'Kinh độ điểm tập kết (Longitude)' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 'Sảnh Diamond, White Palace, Q.Phú Nhuận, TP.HCM' })
  @IsString()
  @IsNotEmpty()
  address: string;
}
