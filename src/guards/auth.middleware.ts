import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from 'src/application/jwt.service';
import { User, UserDocument } from 'src/models/usersSchemas';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private usersModel: Model<UserDocument>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authorization.split(' ')[1];
    const userId = await this.jwtService.getUserIdByToken(token);

    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.usersModel.findOne({ id: userId });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Добавляем информацию о пользователе в объект запроса
    request.user = user;

    return true;
  }
}