import { Request, Response } from 'express';
import { Controller, Get, Post } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { UsersQueryRepository } from 'src/users/users.queryRepository';
import { JwtService } from 'src/application/jwt.service';
import { EmailService } from 'src/adapters/email-adapter';
import { randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersModel } from 'src/dto/usersSchemas';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailAdapter: EmailService,
    private readonly authRepository: AuthRepository,
    // private readonly deviceRepository: DeviceRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    @InjectModel('User') private readonly userModel: Model<UsersModel>,
  ) {}

  @Post('login')
  async createAuthUser(req: Request, res: Response) {
    const user = await this.authRepository.checkCredentials(
      req.body.loginOrEmail,
      req.body.password,
    );
    if (user) {
      const deviceId = randomUUID();
      const userId = user.id;
      const accessToken = await this.jwtService.createJWT(user);
      const refreshToken = await this.jwtService.createJWTRT(userId, deviceId);
      // const lastActiveDate =
      //   await this.jwtService.getLastActiveDate(refreshToken);
      // const newDevice: DeviceDbModel = {
      //   _id: new ObjectId(),
      //   ip: req.ip,
      //   title: req.headers['user-agent'] || 'title',
      //   lastActiveDate,
      //   deviceId,
      //   userId,
      // };
      //await DeviceModel.insertMany([newDevice]);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
      });

      res.status(200).json({ accessToken });
    } else {
      res.sendStatus(401);
    }
  }
  @Post('password-recovery')
  async createPasswordRecovery(req: Request, res: Response) {
    const email = req.body.email;
    const user = await this.usersQueryRepository.findUserByEmail(email);

    if (!user) {
      return res.sendStatus(204);
    }
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    await this.userModel.updateOne({ id: user.id }, { $set: { recoveryCode } });
    try {
      this.emailAdapter.sendEmailWithRecoveryCode(user.email, recoveryCode);
      return res.status(204).json({ message: 'Ok' });
    } catch (error) {
      console.error('create recovery code:', error);
      res.status(500).json({ error });
    }
  }
  @Post('new-password')
  async createNewPassword(req: Request, res: Response) {
    const { newPassword, recoveryCode } = req.body;
    const user = await this.userModel.findOne({ recoveryCode });

    if (!user) {
      return res.status(400).json({
        errorsMessages: [
          {
            message: 'send recovery code',
            field: 'recoveryCode',
          },
        ],
      });
    }
    const result = await this.authRepository.resetPasswordWithRecoveryCode(
      user.id,
      newPassword,
    );
    if (result.success) {
      return res.sendStatus(204);
    }
  }
  @Post('refresh-token')
  async createRefreshToken(req: Request, res: Response) {
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

      // const device = await DeviceModel.findOne({ deviceId: isValid.deviceId });
      // if (!device) {
      //   return res.status(401).json({ message: 'no device' });
      // }

      // const lastActiveDate =
      //   await this.jwtService.getLastActiveDate(refreshToken);
      // if (lastActiveDate !== device.lastActiveDate) {
      //   return res
      //     .status(401)
      //     .json({ message: 'Invalid refresh token version' });
      // }

      const newTokens = await this.authRepository.refreshTokens(
        user.id,
        //device.deviceId,
      );
      // const newLastActiveDate = await this.jwtService.getLastActiveDate(
      //   newTokens.newRefreshToken,
      // );
      // await DeviceModel.updateOne(
      //   { deviceId: device.deviceId },
      //   { $set: { lastActiveDate: newLastActiveDate } },
      // ),
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
  @Post('registration-confirmation')
  async createRegistrationConfirmation(req: Request, res: Response) {
    const result = await this.authRepository.confirmEmail(req.body.code);
    if (result) {
      return res.sendStatus(204);
    } else {
      return res.status(400).send({
        errorsMessages: [
          {
            message: 'test code',
            field: 'code',
          },
        ],
      });
    }
  }
  @Post('registration')
  async createRegistration(req: Request, res: Response) {
    const user = await this.authRepository.createUser(
      req.body.login,
      req.body.email,
      req.body.password,
    );
    if (user) {
      return res.sendStatus(204);
    } else {
      return res.status(400).send({
        errorsMessages: [
          {
            message: 'email already confirmed',
            field: 'email',
          },
        ],
      });
    }
  }
  @Post('registration-email-ressending')
  async createRegistrationEmailResending(req: Request, res: Response) {
    const result = await this.authRepository.ressendingEmail(req.body.email);
    if (result) {
      return res.status(204).send(`	
        Input data is accepted. Email with confirmation code will be send to passed email address. Confirmation code should be inside link as query param, for example: https://some-front.com/confirm-registration?code=youtcodehere`);
    } else {
      return res.status(400).send({
        errorsMessages: [
          {
            message: 'email already confirmed',
            field: 'email',
          },
        ],
      });
    }
  }
  @Post('logout')
  async createUserLogout(req: Request, res: Response) {
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

      // const device = await DeviceModel.findOne({ deviceId: isValid.deviceId });
      // if (!device) {
      //   return res.status(401).json({ message: 'Invalid refresh token' });
      // }

      // const lastActiveDate =
      //   await this.jwtService.getLastActiveDate(refreshToken);
      // if (lastActiveDate !== device.lastActiveDate) {
      //   return res.status(401).json({ message: 'Invalid refresh token' });
      // }

      //await deviceRepository.deleteDeviceId(isValid.deviceId);

      res.clearCookie('refreshToken', { httpOnly: true, secure: true });
      res.sendStatus(204);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
  @Get('me')
  async createUserMe(req: Request, res: Response) {
    if (!req.user) {
      //это ошибка уйдет когда добавлю мидлл вари
      return res.sendStatus(401);
    } else {
      return res.status(200).send({
        email: req.user.email,
        login: req.user.login,
        userId: req.user.id,
      });
    }
  }
}
