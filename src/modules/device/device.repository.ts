import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceDbModel, DeviceModel } from '../../models/deviceSchemas';

@Injectable()
export class DeviceRepository {
  constructor(
    @InjectModel('Device') private readonly deviceModel: Model<DeviceModel>,
  ) {}
  async findDeviceById(deviceId: string): Promise<DeviceDbModel | null> {
    try {
      const device = await this.deviceModel.findOne({ deviceId });
      return device;
    } catch (error) {
      console.error('Error finding device by ID:', error);
      return null;
    }
  }
  async deleteAllExceptOne(userId: string, deviceId: string): Promise<boolean> {
    try {
      await this.deviceModel.deleteMany({
        userId,
        deviceId: { $ne: deviceId },
      });

      return true;
    } catch (error) {
      throw new Error('Failed to refresh tokens');
    }
  }
  async getDeviceByUserId(
    userId: string,
    deviceId: string,
  ): Promise<DeviceDbModel | null> {
    try {
      const device = await this.deviceModel.findOne(
        { userId, deviceId },
        { projection: { _id: 0, userId: 0 } },
      );
      return device;
    } catch (error) {
      console.error('Error getting device by user ID:', error);
      return null;
    }
  }
  async getAllDeviceByUserId(userId: string): Promise<DeviceDbModel[]> {
    try {
      const device = await this.deviceModel
        .find({ userId }, { projection: { _id: 0, userId: 0 } })
        .lean();
      return device;
    } catch (error) {
      console.error('Error getting device by user ID:', error);
      return [];
    }
  }
  async deleteDeviceId(deviceId: string): Promise<boolean> {
    try {
      const result = await this.deviceModel.deleteOne({ deviceId });

      if (result.deletedCount === 1) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error deleting device by ID:', error);
      return false;
    }
  }
}
