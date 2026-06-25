import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class GenerateContractDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  workpointIds: string[];
}

export class SignContractDto {
  /** Semnătura ca data URL PNG (base64). */
  @IsString()
  signature: string;
}
