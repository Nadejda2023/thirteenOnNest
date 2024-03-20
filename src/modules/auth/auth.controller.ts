import { UserService } from '../users/users.service';
import { Request, Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RegistrationEmailResendingDto } from './dto/registration-email-resending.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { RecoveryPasswordDto } from './dto/recovery-password.dto';
import { AuthService } from './auth.service';
import { NewPasswordDto } from './dto/new-password.dto';
import { RegistrationConfirmationDto } from './dto/registration-confirmation.dto';
import { JwtService } from './application/jwt.service';
import { EmailService } from '../../adapters/email-adapter';
import { AuthGuard } from '../../guards/auth.middleware';
import { UsersValidateDto } from '../../models/input/user.customvalidate.dto';
import { User, UsersModel } from '../../models/usersSchemas';
import { UsersQueryRepository } from '../users/users.queryRepository';
import { Device, DeviceDbModel } from '../../models/deviceSchemas';
import { ObjectId } from 'mongodb';
import { DeviceRepository } from '../device/device.repository';
import { UserDecorator } from '../../infastructure/decorators/param/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailAdapter: EmailService,
    private readonly authRepository: AuthRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly userService: UserService,
    private readonly usersQueryRepository: UsersQueryRepository,
    protected authService: AuthService,
    @InjectModel('Device') private readonly deviceModel: Model<Device>,
    @InjectModel('User') private readonly userModel: Model<UsersModel>,
  ) {}

  @Post('login')
  @HttpCode(200)
  async createAuthUser(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const user = await this.authRepository.checkCredentials(
      loginDto.loginOrEmail,
      loginDto.password,
    );
    if (user) {
      const deviceId = randomUUID();
      const userId = user.id;
      const accessToken = await this.jwtService.createJWT(user);
      const refreshToken = await this.jwtService.createJWTRT(userId, deviceId);
      const lastActiveDate =
        await this.jwtService.getLastActiveDate(refreshToken);
      const newDevice: DeviceDbModel = {
        _id: new ObjectId(),
        ip: ip,
        title: req.headers['user-agent'] || 'title',
        lastActiveDate,
        deviceId,
        userId,
      };
      await this.deviceModel.insertMany([newDevice]);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
      });

      return { accessToken };
    } else {
      throw new UnauthorizedException([
        {
          message: '401',
          field: 'not',
        },
      ]);
    }
  }
  @Throttle({})
  @Post('password-recovery')
  @HttpCode(204)
  async passwordRecovery(@Body() recoveryPasswordDto: RecoveryPasswordDto) {
    return this.authService.passwordRecovery(recoveryPasswordDto.email);
  }

  @Throttle({})
  @Post('new-password')
  @HttpCode(204)
  async newPassword(@Body() newPasswordDto: NewPasswordDto) {
    return this.authService.newPassword(newPasswordDto);
  }
  //
  @Post('refresh-token')
  async createRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: 'no rt in cookie' });
      }

      const isValid =
        await this.authRepository.validateRefreshToken(refreshToken);
      if (!isValid) {
        return res
          .status(401)
          .json({ message: 'rt secretinvalid or rt expired' });
      }

      const user = await this.usersQueryRepository.findUserById(isValid.userId);
      if (!user) {
        return res.status(401).json({ message: 'no user' });
      }

      const device = await this.deviceModel.findOne({
        deviceId: isValid.deviceId,
      });
      if (!device) {
        return res.status(401).json({ message: 'no device' });
      }

      const lastActiveDate =
        await this.jwtService.getLastActiveDate(refreshToken);
      if (lastActiveDate !== device.lastActiveDate) {
        return res
          .status(401)
          .json({ message: 'Invalid refresh token version' });
      }

      const newTokens = await this.authRepository.refreshTokens(
        user.id,
        device.deviceId,
      );
      const newLastActiveDate = await this.jwtService.getLastActiveDate(
        newTokens.newRefreshToken,
      );
      await this.deviceModel.updateOne(
        { deviceId: device.deviceId },
        { $set: { lastActiveDate: newLastActiveDate } },
      ),
        res.cookie('refreshToken', newTokens.newRefreshToken, {
          httpOnly: true,
          secure: true,
        });
      res.status(200).json({ accessToken: newTokens.accessToken });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '' });
    }
  }
  @Throttle({})
  @Post('registration-confirmation')
  @HttpCode(204)
  async createRegistrationConfirmation(
    @Body() registrationConfirmationDto: RegistrationConfirmationDto,
  ) {
    const result = await this.authRepository.confirmUserEmail(
      registrationConfirmationDto.code,
    );

    if (!result) {
      throw new BadRequestException([
        {
          message: 'some error occured',
          field: 'code',
        },
      ]); //
      // } else {
      //   return;
    }
  }
  @Post('registration')
  @Throttle({})
  @HttpCode(204)
  async createRegistration(@Body() createUserDto: UsersValidateDto) {
    // to do UserDto
    return this.authRepository.createUser(
      createUserDto.login,
      createUserDto.email,
      createUserDto.password,
    );
  }
  @Post('registration-email-resending')
  @Throttle({})
  @HttpCode(204)
  async createRegistrationEmailResending(
    @Body() registrationEmailResendingDto: RegistrationEmailResendingDto,
  ) {
    return this.authRepository.ressendingEmail(
      registrationEmailResendingDto.email,
    );
  }

  @Post('logout')
  async createUserLogout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token not found' });
      }
      const isValid =
        await this.authRepository.validateRefreshToken(refreshToken);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const user = await this.usersQueryRepository.findUserById(isValid.userId);
      if (!user) return res.sendStatus(401);

      const device = await this.deviceModel.findOne({
        deviceId: isValid.deviceId,
      });
      if (!device) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const lastActiveDate =
        await this.jwtService.getLastActiveDate(refreshToken);
      if (lastActiveDate !== device.lastActiveDate) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      await this.deviceRepository.deleteDeviceId(isValid.deviceId);

      res.clearCookie('refreshToken', { httpOnly: true, secure: true });
      res.sendStatus(204);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async createUserMe(
    @UserDecorator() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!user) {
      //это ошибка уйдет когда добавлю мидлл вари
      return res.sendStatus(401);
    } else {
      return res.status(200).send({
        email: user.email,
        login: user.login,
        userId: user.id,
      });
    }
  }
}
