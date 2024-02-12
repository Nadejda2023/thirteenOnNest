import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedUser, UsersModel } from 'src/dto/usersSchemas';
import { TUsersPagination } from 'src/hellpers/pagination';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UsersModel>,
  ) {}

  async findUsers(
    pagination: TUsersPagination,
  ): Promise<PaginatedUser<UsersModel>> {
    const filter = {
      $or: [
        { email: { $regex: pagination.searchEmailTerm, $options: 'i' } },
        { login: { $regex: pagination.searchLoginTerm, $options: 'i' } },
      ],
    };

    const result = await this.userModel
      .find(filter)
      .select('-_id -__v')
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const totalCount: number = await this.userModel.countDocuments(filter);
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result,
    };
  }

  async findUserById(id: string): Promise<UsersModel | null> {
    const foundedUser = await this.userModel.findOne(
      { id: id },
      {
        passwordSalt: 0,
        passwordHash: 0,
        emailConfirmation: 0,
        refreshTokenBlackList: 0,
      },
    );

    if (!foundedUser) {
      return null;
    }
    return foundedUser;
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UsersModel | null> {
    const user = await this.userModel.findOne({
      $or: [{ email: loginOrEmail }, { login: loginOrEmail }],
    });
    return user;
  }

  async findUserByEmail(email: string): Promise<UsersModel | null> {
    const user = await this.userModel.findOne({ email: email });
    return user;
  }

  async findTokenInBL(userId: string, token: string): Promise<boolean> {
    const userByToken = await this.userModel.findOne({
      id: userId,
      refreshTokenBlackList: { $in: [token] },
    });
    return !!userByToken;
  }

  async findUserByToken(refreshToken: string): Promise<UsersModel | null> {
    const foundedUser = await this.userModel.findOne(
      { refreshToken: refreshToken },
      {
        passwordSalt: 0,
        passwordHash: 0,
        emailConfirmation: 0,
        refreshTokenBlackList: 0,
      },
    );
    return foundedUser;
  }
}
