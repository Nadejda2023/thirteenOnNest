import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './users.service';
import { PaginatedUser, UsersModel } from 'src/dto/usersSchemas';
import { getUsersPagination } from 'src/hellpers/pagination';
import { UsersQueryRepository } from './users.queryRepository';

@Controller('users')
export class UsersController {
  constructor(
    protected usersService: UserService,
    protected usersQueryRepository: UsersQueryRepository,
  ) {}

  @Post()
  async createUser(@Req() req, @Res() res) {
    const { login, email, password } = req.body;
    const newUser = await this.usersService.createUser(login, email, password);

    if (!newUser) {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }

    return res.status(HttpStatus.CREATED).json(newUser);
  }

  @Get()
  async getUsers(@Query() query, @Res() res): Promise<void> {
    const pagination = getUsersPagination(query);
    const foundAllUsers: PaginatedUser<UsersModel> =
      await this.usersQueryRepository.findUsers(pagination);
    res.status(HttpStatus.OK).json(foundAllUsers);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Res() res): Promise<void> {
    const isDeleted = await this.usersService.deleteUserById(id);

    if (isDeleted) {
      res.status(HttpStatus.NO_CONTENT).send();
    } else {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
