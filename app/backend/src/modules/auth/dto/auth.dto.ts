import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  // Date contact.
  @IsString() contactPerson: string;
  @IsEmail() email: string;
  @IsString() phone: string;

  // Date firmă.
  @IsString() companyName: string;
  @IsString() cui: string;
  @IsString() address: string;
  @IsString() city: string;
  @IsString() judet: string;
  @IsString() tipActivitate: string;

  @IsOptional() @IsString() ansvsaAuthorization?: string;

  @IsOptional() @IsInt() @Min(1)
  workpoints?: number;

  @IsOptional() @IsString()
  promotionCode?: string;
}

export class ActivateDto {
  @IsString() token: string;
  @MinLength(8, { message: 'Parola trebuie să aibă minimum 8 caractere' })
  password: string;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

export class ForgotPasswordDto {
  @IsEmail() email: string;
}

export class ResetPasswordDto {
  @IsString() token: string;
  @MinLength(8, { message: 'Parola trebuie să aibă minimum 8 caractere' })
  password: string;
}
