import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  CATEGORII_SNCU,
  ORIGINE_PRODUS,
  STARE_PRODUS,
  TIP_AMBALARE,
} from '../../../common/data/romania';

export class CreateOrderDto {
  @IsString() workpointId: string;
  @IsDateString() desiredDate: string;
  @IsOptional() @IsString() timeInterval?: string;

  @IsString() wasteName: string;
  @IsIn(ORIGINE_PRODUS as unknown as string[]) origin: string;
  @IsIn(CATEGORII_SNCU as unknown as string[]) sncuCategory: string;

  @Type(() => Number) @IsNumber() @Min(0) estimatedQuantityKg: number;

  @IsOptional() @IsString() exactAddress?: string;
  @IsIn(STARE_PRODUS as unknown as string[]) productState: string;

  @IsOptional() @Type(() => Number) @IsNumber() accountingValue?: number;
  @IsOptional() @IsString() countryOfOrigin?: string;
  @IsOptional() @IsString() producer?: string;
  @IsOptional() @IsString() distributor?: string;

  @IsIn(TIP_AMBALARE as unknown as string[]) packagingType: string;

  @IsOptional() @IsString() activity?: string;
  @IsOptional() @IsString() sanitaryAuthNumber?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() csvDoc?: string;
  @IsOptional() @IsString() observations?: string;
}

export class CancelOrderDto {
  @IsOptional() @IsString() reason?: string;
}
