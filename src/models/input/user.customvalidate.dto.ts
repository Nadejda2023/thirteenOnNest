import { IsEmail, IsString, Length } from 'class-validator';
import { UserEmailExist } from 'src/infastructure/decorators/param/user.email.exist.decorator';
import { UserLoginExist } from 'src/infastructure/decorators/param/user.login.exist.decorator';

export class UsersValidateDto {
  //@Trim()
  @Length(3, 10)
  @IsString()
  @UserLoginExist()
  login: string;
  @IsEmail()
  @UserEmailExist()
  email: string;
  @Length(6, 20)
  @IsString()
  password: string;
}
