// infrastructure/services/JwtTokenService.ts

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  ITokenService,
  TokenPayload,
  GeneratedTokens
} from '../../application/ports/ITokenService';
import ApiError from '../../domain/errors/apiError';

export class JwtTokenService implements ITokenService {
  
  generateTokens(payload: TokenPayload): GeneratedTokens {
    try {
      const deviceId = uuidv4();

      const accessToken = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { ...payload, deviceId },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '30d' }
      );

      return { accessToken, refreshToken, deviceId };
    } catch (error) {
      throw ApiError.Internal('Failed to generate tokens');
    }
  }

  validateAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string
      ) as TokenPayload;
    } catch {
      return null;
    }
  }

  validateRefreshToken(token: string): (TokenPayload & { deviceId: string }) | null {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET as string
      ) as TokenPayload & { deviceId: string };

      if (!decoded.deviceId) {
        console.warn('refreshToken without deviceId');
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }
}