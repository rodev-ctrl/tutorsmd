// tokenService.ts
import "dotenv/config";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { ModelStatic } from "sequelize";

import TokenSchema from "../database/models/tokenModel";
import TokenTutorSchema from "../database/models/tokenTutorModel";

import { ITokenService } from "../../application/ports/IAccessTokenService";
import ApiError from "../../domain/errors/apiError";

type Role = "client" | "tutor";

interface TokenPayload extends JwtPayload {
  id: number;
  email: string;
  role: Role;
  deviceId?: string; // ✅ Опционально (только в refreshToken)
}

class TokenService implements ITokenService {
  /*
  private static getTokenModel(role: Role): ModelStatic<any> {
    return role === "client" ? TokenSchema : TokenTutorSchema;
  }
    */

  private generateTokens(payload: TokenPayload) {
    try {
      const deviceId = uuidv4();
      
      const accessToken = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { ...payload, deviceId }, // ✅ deviceId в refreshToken
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: "30d" }
      );

      return { accessToken, refreshToken, deviceId };
    } catch (e) {
      throw ApiError.Internal("Failed to generate tokens");
    }
  }
/*
  static async saveToken(
    userId: number,
    refreshToken: string,
    deviceId: string,
    role: Role
  ) {
    try {
      const Token = this.getTokenModel(role);
      const key = role === "client" ? "clientid" : "tutorid";

      const hashed = await bcrypt.hash(refreshToken, 10);

      const existing = await Token.findOne({
        where: { [key]: userId, deviceid: deviceId }
      });

      if (existing) {
        existing.refreshtoken = hashed;
        return await existing.save();
      }

      return await Token.create({
        [key]: userId,
        refreshtoken: hashed,
        deviceid: deviceId
      });
    } catch (e) {
      throw ApiError.Internal("Failed to save token");
    }
  }
*/
  static validateAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string
      ) as TokenPayload;
    } catch {
      return null;
    }
  }


  static validateRefreshToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET as string
      ) as TokenPayload;

      if (!decoded.deviceId) {
        console.warn('refreshToken без deviceId (старый формат?)');
        return null;
      }
      
      return decoded;
    } catch {
      return null;
    }
  }
/*
  static async findToken(refreshToken: string, role: Role) {
    try {
      // ✅ Извлекаем deviceId из токена
      const payload = this.validateRefreshToken(refreshToken);
      if (!payload || !payload.deviceId) return null;

      const Token = this.getTokenModel(role);

      const record = await Token.findOne({ 
        where: { deviceid: payload.deviceId } 
      });

      if (!record) return null;

      const ok = await bcrypt.compare(refreshToken, record.refreshtoken);
      return ok ? record : null;
    } catch (e) {
      throw ApiError.Internal("Failed to find refresh token");
    }
  }


  static async removeToken(refreshToken: string, role: Role) {
    try {
      const payload = this.validateRefreshToken(refreshToken);
      if (!payload || !payload.deviceId) return false;

      const Token = this.getTokenModel(role);

      const record = await Token.findOne({ 
        where: { deviceid: payload.deviceId } 
      });

      if (!record) return false;

      const ok = await bcrypt.compare(refreshToken, record.refreshtoken);
      if (!ok) return false;

      await Token.destroy({ where: { deviceid: payload.deviceId } });

      return true;
    } catch (e) {
      throw ApiError.Internal("Failed to remove token");
    }
  }

  static async logoutAllDevices(userId: number, role: Role) {
    try {
      const Token = this.getTokenModel(role);
      if (role === "client") {
        await Token.destroy({ where: { clientid: userId } });
      } else {
        await Token.destroy({ where: { tutorid: userId } });
      }
    } catch (e) {
      throw ApiError.Internal("Failed to logout user from all devices");
    }
  }
*/
}

export default new TokenService();