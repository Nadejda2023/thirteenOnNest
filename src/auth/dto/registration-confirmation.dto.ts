import { IsString } from 'class-validator';

export class RegistrationConfirmationDto {
  @IsString()
  //@IsUUID()
  code: string;
}
