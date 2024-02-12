import { Injectable } from '@nestjs/common';
import { Auth, AuthDocument } from 'src/dto/authSchemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuthRepository } from './auth.repository';
import { UserRepository } from 'src/users/users.repository';
import { EmailService } from 'src/adapters/email-adapter';
import { UsersQueryRepository } from 'src/users/users.queryRepository';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private authModel: Model<AuthDocument>,
    protected usersQueryRepository: UsersQueryRepository,
    protected userRepository: UserRepository,
    protected authRepository: AuthRepository,
    protected emailService: EmailService,
  ) {}
}
