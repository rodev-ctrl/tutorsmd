
import "dotenv/config";
import bcrypt from "bcrypt";

import TokenSchema from "../models/tokenModel";
import TokenTutorSchema from "../models/tokenTutorModel";
import Client from "../models/clientModel";
import Tutor from "../models/tutorModel";

import TokenService from "./tokenService";
import MailService from "./mailService";

import ClientDto from "../dto/clientDto";
import TutorDto from "../dto/tutorDto";

import ApiError from "../../domain/errors/apiError";
import PasswordResetModel from "../models/PasswordResetModel";
import { Op } from "sequelize"
import Model from "sequelize/types/model";

type Role = "client" | "tutor";

interface RefreshPayload {
  id: number;
  email: string;
  role: Role;
}

class AuthService {
  
/*
  // ================= LOGIN =================
  static async login(email: string, password: string, role: Role) {

    if (role === "client") {
      const user = await Client.findOne({ where: { email } });
      if (!user) throw ApiError.NotFound("User not found");
  
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw ApiError.Unauthorized("Incorrect password");
  
      const dto = new ClientDto(user);
      const tokens = TokenService.generateTokens({
        userId: dto.id,
        email: dto.email,
        role,
      });
  
      await TokenService.saveToken(dto.id, tokens.refreshToken, tokens.deviceId!, role);
  
      return { ...tokens, person: dto };
    }
  
    if (role === "tutor") {
      const user = await Tutor.findOne({ where: { email } });
      if (!user) throw ApiError.NotFound("User not found");
  
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw ApiError.Unauthorized("Incorrect password");
  
      const dto = new TutorDto(user);
      const tokens = TokenService.generateTokens({
        id: dto.id,
        email: dto.email,
        role,
      });
  
      await TokenService.saveToken(dto.id, tokens.refreshToken, tokens.deviceId, role);
  
      return { ...tokens, person: dto };
    }
  
    throw ApiError.BadRequest("Invalid role");
  }


  static async logout(refreshToken: string, role: Role) {
    await TokenService.removeToken(refreshToken, role);
    return true;
  }

  static async refresh(refreshToken: string) {
    if (!refreshToken) throw ApiError.Unauthorized("No refresh token");
  
    const payload = TokenService.validateRefreshToken(refreshToken);
    if (!payload) throw ApiError.Unauthorized("Invalid refresh token");
  
    const tokenDoc = await TokenService.findToken(refreshToken, payload.role);
    if (!tokenDoc) throw ApiError.Unauthorized("Session not found");
  
    if (payload.role === "client") {
      const user = await Client.findByPk(tokenDoc.clientid);
      if (!user) throw ApiError.NotFound("User not found");
  
      const dto = new ClientDto(user);
      const { accessToken } = TokenService.generateTokens({
        id: dto.id,
        email: dto.email,
        role: "client",
      });
  
      return { accessToken, client: dto, role: "client" };
    }
  
    if (payload.role === "tutor") {
      const user = await Tutor.findByPk(tokenDoc.tutorid);
      if (!user) throw ApiError.NotFound("User not found");
  
      const dto = new TutorDto(user);
      const { accessToken } = TokenService.generateTokens({
        id: dto.id,
        email: dto.email,
        role: "tutor",
      });
  
      return { accessToken, tutor: dto, role: "tutor" };
    }
  
    throw ApiError.BadRequest("Invalid role");
  }

 
static async refreshSoft(
  refreshToken: string
): Promise<{ accessToken: string } | null> {

  if (!refreshToken) return null;

  const userData = TokenService.validateRefreshToken(refreshToken);
  if (!userData) return null;

  const { role } = userData;

  const tokenFromDB = await TokenService.findToken(
    refreshToken,
    role
  );

  if (!tokenFromDB) return null;

  const { accessToken } = TokenService.generateTokens({
    id: userData.id,
    email: userData.email,
    role
  });

  return { accessToken };
}
  */


  static async passwordChange(refreshToken: string, oldPassword: string, newPassword: string) {

    const payload = TokenService.validateRefreshToken(refreshToken) as RefreshPayload;
    if (!payload) throw ApiError.Unauthorized("Invalid token");

    const tokenDoc = await TokenService.findToken(refreshToken, payload.role);
    if (!tokenDoc) throw ApiError.Forbidden("Session not found or expired");

    let user;

    if (payload.role === "client") {

      user = await Client.findByPk(payload.id);
      if (!user) throw ApiError.NotFound("User not found");

      const isOldCorrect = await bcrypt.compare(oldPassword, user.password);
      if (!isOldCorrect) throw ApiError.BadRequest("Old password is incorrect")

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      await TokenSchema.destroy({ where: { clientid: user.id } });

      return true;
    }

    if (payload.role === "tutor") {

      user = await Tutor.findByPk(payload.id);
      if (!user) throw ApiError.NotFound("User not found");

      const isOldCorrect = await bcrypt.compare(oldPassword, user.password);
      if (!isOldCorrect) throw ApiError.BadRequest("Old password is incorrect")

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      await TokenTutorSchema.destroy({ where: { tutorid: user.id } });

      return true;
    }

    throw ApiError.BadRequest("Invalid role");
  }


  
  static async forgotPassword(email: string, passwordLink: string, language: string) {

      const client = await Client.findOne({ where: { email } });
      const tutor = await Tutor.findOne({ where: { email } });
      
      const user = client ?? tutor;
      const role = client ? "client" : tutor ? "tutor" : null;

      if (!user || !role) return true; // Не раскрываем существование email
      
      const sent = await MailService.sendPasswordForgotLink(
        email,
        role,
        language
      );

      if(sent) {  
        await PasswordResetModel.create({ 
        email, 
        role,
        link: passwordLink, 
        expires_at: new Date(Date.now() + 15 * 60 * 1000)
        });
      }

      return true;

  }

  static async passwordReset(link: string, newPassword: string) {
    // 1. Ищем токен в базе данных
    // Проверяем: совпадение строки, что он не использован и время жизни (expires_at > сейчас)
    const resetRecord = await PasswordResetModel.findOne({
      where: {
        link: link,
        used: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!resetRecord) {
      throw ApiError.BadRequest("Reset link is invalid or expired");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
      
  let user;
    // ✅ findByPk возвращает экземпляр модели
  if (resetRecord.role === "client") {
    user = await Client.findOne({ where: { email: resetRecord.email } });
  } else if (resetRecord.role === "tutor") {
    user = await Tutor.findOne({ where: { email: resetRecord.email } });
  } else {
    throw ApiError.BadRequest("Invalid role in reset record");
  }
  if (!user) throw ApiError.NotFound("User not found");

    user.password = hashedPassword;
    await user.save();
    await TokenService.logoutAllDevices(user.id, resetRecord.role);
    await PasswordResetModel.destroy({ where: { email: resetRecord.email } });

    return true;
  }

  
  static async emailChange(
    refreshToken: string,
    newEmail: string,
    password: string,
    changeEmailLink: string,
  ) {
    const payload = TokenService.validateRefreshToken(refreshToken);
    if (!payload) throw ApiError.Unauthorized("Invalid token");
  
    // Проверяем что email не занят
    const existingClient = await Client.findOne({ where: { email: newEmail } });
    const existingTutor = await Tutor.findOne({ where: { email: newEmail } });
    if (existingClient || existingTutor) {
      throw ApiError.BadRequest("Email already in use");
    }

    if (payload.role === "client") {
      const user = await Client.findByPk(payload.id);
      if (!user) throw ApiError.NotFound("User not found");
      
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) throw ApiError.BadRequest("Incorrect password");
      
      await user.update({ changeEmailLink, newEmail });
    } else if (payload.role === "tutor") {
      const user = await Tutor.findByPk(payload.id);
      if (!user) throw ApiError.NotFound("User not found");
      
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) throw ApiError.BadRequest("Incorrect password");
      
      await user.update({ changeEmailLink, newEmail });
    } else {
      throw ApiError.BadRequest("Invalid role");
    }
  
    await MailService.sendEmailChangeLink(
      newEmail,
      `${process.env.URL}/api/email/change/${changeEmailLink}`
    );
  
    return true;
  }

  static async isEmailChanged(changeEmailLink: string) {
    const tutor = await Tutor.findOne({ where: { changeEmailLink } });
    const client = await Client.findOne({ where: { changeEmailLink } });
    const person = (tutor ?? client) as Model & {
       newEmail?: string | null;
       changeEmailLink?: string | null;
    };

    if (!person) throw ApiError.BadRequest("Invalid link");

    const saved = await person.update({
      email: person.newEmail,
      newEmail: null,
      changeEmailLink: null,
    });

    if(saved) return true;
  }
}

export default AuthService;
