import { RequestHandler } from 'express';
import bcrypt from "bcrypt";

import Gast from "../../infrastructure/database/models/gastModel";
import Client from "../../infrastructure/database/models/clientModel";
import Tutor from "../../infrastructure/database/models/tutorModel";
import ClientToken from "../../infrastructure/database/models/tokenModel";
import TutorToken from "../../infrastructure/database/models/tokenTutorModel";

import { encrypt } from "../../infrastructure/encryption/encryption";

import ApiError from "../../domain/errors/apiError";

export class AdminController {
  constructor() {
    
  }

  
  // ---------- CLIENTS ----------
  static async getClientsWithTokens() {
    try {
      const clients = await Client.findAll({ raw: true });
      const tokens = await ClientToken.findAll({ raw: true });

      const tokensByClientId: Record<
        number,
        { refreshtoken: string; deviceid: string }[]
      > = {};

      tokens.forEach((t: any) => {
        if (!tokensByClientId[t.clientid]) tokensByClientId[t.clientid] = [];
        tokensByClientId[t.clientid].push({
          refreshtoken: t.refreshtoken,
          deviceid: t.deviceid
        });
      });

      return clients.map((c: any) => ({
        ...c,
        tokens: tokensByClientId[c.id] || []
      }));
    } catch {
      throw ApiError.Internal("Failed to fetch clients with tokens");
    }
  }

  // ---------- TUTORS ----------
  static async getTutorsWithTokens() {
    try {
      const tutors = await Tutor.findAll({ raw: true });
      const tokens = await TutorToken.findAll({ raw: true });

      const tokensByTutorId: Record<
        number,
        { refreshtoken: string; deviceid: string }[]
      > = {};

      tokens.forEach((t: any) => {
        if (!tokensByTutorId[t.tutorid]) tokensByTutorId[t.tutorid] = [];
        tokensByTutorId[t.tutorid].push({
          refreshtoken: t.refreshtoken,
          deviceid: t.deviceid
        });
      });

      return tutors.map((t: any) => ({
        ...t,
        tokens: tokensByTutorId[t.id] || []
      }));
    } catch {
      throw ApiError.Internal("Failed to fetch tutors with tokens");
    }
  }

  // ---------- MESSAGES ----------
  static ReceiveAllMessagesFromUsers: RequestHandler = async (req, res) => {
    try {
      const users: any = {};

      const gasts = await Gast.findAll();
      users.gasts = gasts.map((g: any) => ({
        userid: g.userid,
        chatid: g.chatid,
        messages: g.messages
      }));

      const clients = await this.getClientsWithTokens();
      users.clients = clients.map((c: any) => ({
        userid: c.id,
        name: c.name,
        surname: c.surname,
        email: c.email,
        chatid: encrypt(c.email),
        messages: c.messages,
        tokens: c.tokens
      }));

      const tutors = await this.getTutorsWithTokens();
      users.tutors = tutors.map((t: any) => ({
        userid: t.id,
        name: t.name,
        surname: t.surname,
        email: t.email,
        chatid: encrypt(t.email),
        messages: t.messages,
        availableSubjects: t.availableSubjects,
        tokens: t.tokens
      }));

      return res.status(200).json({
        message: "messages",
        users
      });
    } catch {
      throw ApiError.Internal("Failed to load messages");
    }
  }

  // ---------- ADMIN ----------
  static getAdminToken: RequestHandler = async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw ApiError.BadRequest("Invalid admin request");
    return res.status(200).json({ refreshToken });
  }

  static getAdmin: RequestHandler = async (req, res) => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) throw ApiError.Unauthorized("No token");

      const admin = await Tutor.findOne({
        where: { namegerman: "Roman", surnamegerman: "Ivanov" }
      });

      if (!admin) throw ApiError.Forbidden("Admin not found");

      const list = await TutorToken.findAll({
        where: { tutorid: admin.id }
      });

      for (const t of list) {
        if (await bcrypt.compare(refreshToken, t.refreshtoken)) {
          return res.status(200).json({ access: true });
        }
      }

      throw ApiError.Forbidden("Token mismatch");
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw ApiError.Internal("Admin check failed");
    }
  }

  /*
  // ---------- DECRYPT ----------
  private decrypt(req: Request, res: Response) {
    const { id } = req.body;

    if (!id || typeof id !== "string") {
      throw ApiError.BadRequest("Invalid encrypted value");
    }

    const [ivHex, encrypted] = id.split(":");
    if (!ivHex || !encrypted) {
      throw ApiError.BadRequest("Invalid encrypted format");
    }

    const ivBuf = Buffer.from(ivHex, "hex");
    const iv = new Uint8Array(ivBuf.buffer, ivBuf.byteOffset, ivBuf.byteLength);

    const decipher = createDecipheriv(this.algorithm, this.secretKey, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return res.status(200).json({ decrypted });
  }
    */
}



