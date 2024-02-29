import { BadRequestException, Injectable } from '@nestjs/common';
import { Auth, AuthDocument } from 'src/models/authSchemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuthRepository } from './auth.repository';
import { UserRepository } from 'src/users/users.repository';
import { EmailService } from 'src/adapters/email-adapter';
import { UsersQueryRepository } from 'src/users/users.queryRepository';
import { UserService } from 'src/users/users.service';
import { NewPasswordDto } from './dto/new-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private authModel: Model<AuthDocument>,
    protected usersQueryRepository: UsersQueryRepository,
    protected userRepository: UserRepository,
    protected authRepository: AuthRepository,
    protected emailService: EmailService,
    protected usersService: UserService,
  ) {}
  async passwordRecovery(email: string) {
    const user = await this.usersQueryRepository.findByLoginOrEmail(email);
    if (!user) return null;
    const recoveryCode = await this.usersService.recoveryPassword(user.id);
    return this.emailService.sendEmailWithRecoveryCode(
      user.email,
      recoveryCode,
    );
  }

  async newPassword(newPasswordDto: NewPasswordDto) {
    const user = await this.usersQueryRepository.findUserByPasswordRecoveryCode(
      newPasswordDto.recoveryCode,
    );
    if (!user) throw new BadRequestException();
    return this.authRepository.resetPasswordWithRecoveryCode(
      user.id,
      newPasswordDto.newPassword,
    );
  }
}
