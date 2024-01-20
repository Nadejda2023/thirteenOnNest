import { Injectable } from '@nestjs/common';
import { UserRepository } from './users.repository';
import {
  CreateUserModel,
  User,
  UserDocument,
  UsersModel,
} from 'src/blogs/dto/usersSchemas';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { UsersQueryRepository } from './users.queryRepository';
import { randomUUID } from 'crypto';
import { EmailService } from 'src/adapters/email-adapter';
import { addHours, addMinutes } from 'date-fns';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private usersModel: Model<UserDocument>,
    protected userRepository: UserRepository,
    protected usersQueryRepository: UsersQueryRepository,
    protected emailService: EmailService,
  ) {}

  async createUser(
    login: string,
    email: string,
    //password: string,
  ): Promise<CreateUserModel> {
    // const passwordSalt = await bcrypt.genSalt(10);
    // const passwordHash = await this._generateHash(password, passwordSalt);

    const newUser = {
      id: randomUUID(),
      login,
      email,
      //passwordHash,
      //passwordSalt,
      createdAt: new Date().toISOString(),
      //recoveryCode: uuidv4(),
      emailConfirmation: {
        confirmationCode: uuidv4(),
        expirationDate: addMinutes(addHours(new Date(), 1), 2),
        isConfirmed: false,
      },
    };

    await this.usersQueryRepository.createUser({ ...newUser });

    try {
      await this.emailService.sendEmail(
        newUser.email,
        'code',
        newUser.emailConfirmation.confirmationCode,
      );
    } catch (error) {
      console.error('create email error:', error);
    }

    return {
      id: newUser.id,
      login,
      createdAt: newUser.createdAt,
      email: newUser.email,
    };
  }

  async findUserById(id: string): Promise<UsersModel | null> {
    const foundedUser = await this.usersModel.findOne(
      { id: id },
      {
        projection: {
          _id: 0,
          passwordSalt: 0,
          passwordHash: 0,
          emailConfirmation: 0,
          //refreshTokenBlackList: 0,
        },
      },
    );

    if (!foundedUser) {
      return null;
    }

    return foundedUser;
  }

  async generateHash(password: string, salt: string) {
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  async deleteUserById(id: string): Promise<boolean> {
    return await this.userRepository.deleteUsers(id);
  }

  async deleteAll(): Promise<boolean> {
    return await this.userRepository.deleteAll();
  }
}
