import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  passwordSalt: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop()
  recoveryCode?: string;

  @Prop({
    required: true,
    type: {
      isConfirmed: Boolean,
      confirmationCode: String,
      expirationDate: Date,
    },
  })
  emailConfirmation: EmailConfirmationType;
}

export const UserSchema = SchemaFactory.createForClass(User);

export type PaginatedUser<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export type UsersModelSw = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};
export class UserType {
  constructor(
    public id: string,
    public login: string,
    public email: string,
    public createdAt: string,
    public passwordSalt: string,
    public passwordHash: string,
    public emailConfirmation: EmailConfirmationType,
    public recoveryCode?: string | undefined,
  ) {}
}

export type UsersModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
  recoveryCode?: string | undefined;
  emailConfirmation: EmailConfirmationType;
  //refreshTokenBlackList: string[]
};

export type EmailConfirmationType = {
  // usera
  isConfirmed: boolean;
  confirmationCode: string;
  expirationDate: Date;
};

export type UsersInputModel = {
  login: string;
  password: string;
  email: string;
};

export type CreateUserModel = {
  id: string;
  login: string;
  createdAt: string;
  email: string;
};
