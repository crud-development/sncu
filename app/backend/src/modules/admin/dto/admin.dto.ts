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
import { CreateOrderDto } from '../../orders/dto/order.dto';

/** 4.2.2 — comandă adăugată din admin (câmpurile US-06 + clientul vizat). */
export class AdminCreateOrderDto extends CreateOrderDto {
  @IsString() clientId: string;
}

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

/** 4.2.1 — editarea unei comenzi din admin (toate câmpurile opționale). */
export class AdminUpdateOrderDto {
  @IsOptional() @IsDateString() desiredDate?: string;
  @IsOptional() @IsString() timeInterval?: string;
  @IsOptional() @IsString() wasteName?: string;
  @IsOptional() @IsString() origin?: string;
  @IsOptional() @IsString() sncuCategory?: string;
  @IsOptional() @Type(() => Number) @IsNumber() estimatedQuantityKg?: number;
  @IsOptional() @IsString() exactAddress?: string;
  @IsOptional() @IsString() productState?: string;
  @IsOptional() @Type(() => Number) @IsNumber() accountingValue?: number;
  @IsOptional() @IsString() countryOfOrigin?: string;
  @IsOptional() @IsString() producer?: string;
  @IsOptional() @IsString() distributor?: string;
  @IsOptional() @IsString() packagingType?: string;
  @IsOptional() @IsString() activity?: string;
  @IsOptional() @IsString() sanitaryAuthNumber?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() csvDoc?: string;
  @IsOptional() @IsString() observations?: string;
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
