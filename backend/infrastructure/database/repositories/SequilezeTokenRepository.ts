// infrastructure/database/repositories/SequelizeTokenRepository.ts

import bcrypt from 'bcrypt';
import { ITokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import TokenClientModel from '../models/tokenModel';
import TokenTutorModel from '../models/tokenTutorModel';
import ApiError from '../../../domain/errors/apiError';

export class SequelizeTokenRepository implements ITokenRepository {
  
  private getModel(role: 'client' | 'tutor') {
    return role === 'client' ? TokenClientModel : TokenTutorModel;
  }

  async save(
    userId: number,
    refreshToken: string,
    deviceId: string,
    role: 'client' | 'tutor'
  ): Promise<void> {
    try {
      const Model = this.getModel(role);
      const key = role === 'client' ? 'clientid' : 'tutorid';
      
      const hashedToken = await bcrypt.hash(refreshToken, 10);

      const existing = await Model.findOne({
        where: { [key]: userId, deviceid: deviceId }
      });

      if (existing) {
        existing.refreshtoken = hashedToken;
        await existing.save();
      } else {
        await Model.create({
          [key]: userId,
          refreshtoken: hashedToken,
          deviceid: deviceId
        });
      }
    } catch (error) {
      throw ApiError.Internal('Failed to save token');
    }
  }

  async findByDeviceId(deviceId: string, role: 'client' | 'tutor'): Promise<string | null> {
    try {
      const Model = this.getModel(role);
      
      const record = await Model.findOne({
        where: { deviceid: deviceId }
      });

      return record ? record.refreshtoken : null;
    } catch (error) {
      throw ApiError.Internal('Failed to find token');
    }
  }

  async exists(deviceId: string, role: 'client' | 'tutor'): Promise<boolean> {
    try {
      const Model = this.getModel(role);
      
      const count = await Model.count({
        where: { deviceid: deviceId }
      });

      return count > 0;
    } catch (error) {
      throw ApiError.Internal('Failed to check token existence');
    }
  }

  async remove(deviceId: string, role: 'client' | 'tutor'): Promise<void> {
    try {
      const Model = this.getModel(role);
      
      await Model.destroy({
        where: { deviceid: deviceId }
      });
    } catch (error) {
      throw ApiError.Internal('Failed to remove token');
    }
  }

  async removeAllByUserId(userId: number, role: 'client' | 'tutor'): Promise<void> {
    try {
      const Model = this.getModel(role);
      const key = role === 'client' ? 'clientid' : 'tutorid';
      
      await Model.destroy({
        where: { [key]: userId }
      });
    } catch (error) {
      throw ApiError.Internal('Failed to remove all tokens');
    }
  }
}