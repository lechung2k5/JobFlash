import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWorkerProfileDto {
  @ApiProperty({ example: 'Nguyễn Hoàng Long', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: '079099012345', required: false, description: 'Số CCCD 12 số' })
  @IsString()
  @IsOptional()
  idCardNumber?: string;

  @ApiProperty({ example: '2022-05-15', required: false })
  @IsDateString()
  @IsOptional()
  idCardIssueDate?: string;

  @ApiProperty({ example: 'Cục Cảnh sát QLHC về TTXH', required: false })
  @IsString()
  @IsOptional()
  idCardIssuePlace?: string;

  @ApiProperty({ example: 'https://cdn.jobflash.vn/cccd-front.jpg', required: false })
  @IsString()
  @IsOptional()
  idCardFrontUrl?: string;

  @ApiProperty({ example: 'https://cdn.jobflash.vn/cccd-back.jpg', required: false })
  @IsString()
  @IsOptional()
  idCardBackUrl?: string;

  @ApiProperty({ example: 'https://cdn.jobflash.vn/portrait.jpg', required: false })
  @IsString()
  @IsOptional()
  portraitUrl?: string;

  @ApiProperty({ example: '1998-10-20', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: 'MALE', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 'Phường 7, Quận Phú Nhuận, TP.HCM', required: false })
  @IsString()
  @IsOptional()
  currentAddress?: string;

  @ApiProperty({ example: ['Bốc xếp', 'Sự kiện', 'Phục vụ'], required: false })
  @IsArray()
  @IsOptional()
  skills?: string[];

  @ApiProperty({ example: 2, required: false })
  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @ApiProperty({ example: 'MBBank', required: false })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiProperty({ example: 'NGUYEN HOANG LONG', required: false })
  @IsString()
  @IsOptional()
  bankAccountHolder?: string;

  @ApiProperty({ example: 'Nguyễn Văn A', required: false })
  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @ApiProperty({ example: '0988777666', required: false })
  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @ApiProperty({ example: 'Bố ruột', required: false })
  @IsString()
  @IsOptional()
  emergencyContactRelation?: string;

  @ApiProperty({ example: 10.7924, required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 106.6835, required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;
}
