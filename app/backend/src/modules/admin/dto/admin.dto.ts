import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { OrderStatus } from '../../orders/schemas/order.schema';

/** 4.1.2 — adăugare client din admin (plată OP automat). */
export class AdminCreateClientDto {
  @IsString() companyName: string;
  @IsString() cui: string;
  @IsOptional() @IsString() regCom?: string;
  @IsString() address: string;
  @IsString() city: string;
  @IsString() judet: string;
  @IsString() tipActivitate: string;
  @IsString() contactFirstName: string;
  @IsString() contactLastName: string;
  @IsEmail() email: string;
  @IsString() phone: string;
  @IsDateString() contractExpiresAt: string;
  @IsOptional() @IsInt() @Min(1) workpoints?: number;
}

export class UpdateOrderStatusDto {
  @IsIn(Object.values(OrderStatus)) status: OrderStatus;
  @IsOptional() @IsString() note?: string;
}

export class SetOrderCostDto {
  @Type(() => Number) @IsNumber() @Min(0) estimatedCost: number;
}

export class UpdateSettingsDto {
  @IsOptional() @IsString() contractSeries?: string;
  @IsOptional() @IsString() orderSeries?: string;
  @IsOptional() @IsDateString() contractStartDate?: string;
  @IsOptional() @IsString() contractTemplateUrl?: string;
  @IsOptional() @IsString() orderTemplateUrl?: string;
  @IsOptional() @IsString() pvTemplateUrl?: string;
  @IsOptional() @IsString() contractTemplateText?: string;
}
