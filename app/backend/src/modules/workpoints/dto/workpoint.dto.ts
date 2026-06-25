import { IsOptional, IsString } from 'class-validator';

export class CreateWorkpointDto {
  @IsOptional() @IsString() denumire?: string;
  @IsString() address: string;
  @IsString() tipActivitate: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsString() sanitaryAuthNumber: string;
}

export class UpdateWorkpointDto {
  @IsOptional() @IsString() denumire?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() tipActivitate?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() sanitaryAuthNumber?: string;
}
