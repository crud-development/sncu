import { IsOptional, IsString } from 'class-validator';

/** Date editabile de client din ecranul de profil (inclusiv administratorul, US-05). */
export class UpdateProfileDto {
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() judet?: string;
  @IsOptional() @IsString() regCom?: string;
  @IsOptional() @IsString() tipActivitate?: string;
  @IsOptional() @IsString() ansvsaAuthorization?: string;

  @IsOptional() @IsString() contactFirstName?: string;
  @IsOptional() @IsString() contactLastName?: string;
  @IsOptional() @IsString() phone?: string;

  // Administrator (necesar înainte de a genera contractul).
  @IsOptional() @IsString() adminName?: string;
  @IsOptional() @IsString() adminIdSeries?: string;
  @IsOptional() @IsString() adminIdNumber?: string;
}
