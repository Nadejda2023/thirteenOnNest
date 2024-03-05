import { Controller, Get, Delete, Res, Req } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceRepository } from './device.repository';
import { AuthRepository } from '../auth/auth.repository';

@Controller('device')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    protected deviceRepository: DeviceRepository,
    protected authRepository: AuthRepository,
  ) {}
  @Get('')
  async getDeviceByUserId(@Req() req, @Res() res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }
    const isValid =
      await this.authRepository.validateRefreshToken(refreshToken);

    if (!isValid || !isValid.userId || !isValid.deviceId) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const user = await this.authRepository.findUserByID(isValid.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const device = await this.deviceRepository.findDeviceById(isValid.deviceId);
    if (!device) {
      return res.status(401).json({ message: 'Device not found' });
    }

    if (isValid.userId !== device.userId) {
      return res.status(401).json({ message: 'Unauthorized access to device' });
    }

    const result = await this.deviceRepository.getAllDeviceByUserId(
      isValid.userId,
    );

    if (result) {
      res.status(200).send(result);
    } else {
      res.sendStatus(401);
    }
  }
  @Delete('')
  async deleteAllDeviceExceptOneDevice(@Req() req, @Res() res) {
    const refreshToken = req.cookies.refreshToken;
    const isValid =
      await this.authRepository.validateRefreshToken(refreshToken);
    if (!isValid || !isValid.userId || !isValid.deviceId) {
      return res.status(401).json({ message: 'Unauthorized ' });
    }

    const result = await this.deviceRepository.deleteAllExceptOne(
      isValid.userId,
      isValid.deviceId,
    ); // delete({userId, $..: deviceId})
    if (result) {
      res.sendStatus(204);
    } else {
      res.sendStatus(500);
    }
  }
  @Delete(':id')
  async deleteDeviceById(@Req() req, @Res() res) {
    const refreshToken = req.cookies.refreshToken;
    const deviceId = req.params.deviceId;
    const isValid =
      await this.authRepository.validateRefreshToken(refreshToken);
    if (!isValid || !isValid.userId || !isValid.deviceId) {
      return res.status(401).json({ message: 'Unauthorized ' });
    }

    const user = await this.authRepository.findUserByID(isValid.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const device = await this.deviceRepository.findDeviceById(deviceId); //
    if (!device) {
      return res.sendStatus(404);
    }

    if (device.userId !== isValid.userId) {
      return res.sendStatus(403);
    }

    await this.deviceRepository.deleteDeviceId(deviceId);
    res.sendStatus(204);
  }
}
