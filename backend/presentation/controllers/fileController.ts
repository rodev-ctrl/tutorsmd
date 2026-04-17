import { Request, RequestHandler, Response } from "express";

import { encrypt } from "../../infrastructure/encryption/encryption";
import FileService from "../../infrastructure/service/fileService";
import ApiError from "../../domain/errors/apiError";

export class FileController {

  constructor() {}

  // ===============================
  // CREATE USER DIRECTORY
  // ===============================
  static createDir: RequestHandler = async(req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw ApiError.BadRequest("Email is required");
      }

      const folderName = encrypt(email);

      const result = await FileService.createDir(folderName);

      return res.status(200).json(result);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw ApiError.Internal("File system error");
    }
  }

  // ===============================
  // CREATE FILE / FOLDER
  // ===============================
  static createFile: RequestHandler = async(req, res) => {
    try {
      const { name, type, parent, email } = req.body;

      if (!email || !name || !type) {
        throw ApiError.BadRequest("Not enough data");
      }

      const encryptedEmail = encrypt(email);

      const file = {
        name,
        type,
        parent,
        user: encryptedEmail,
        path: ""
      };

      // если родителя нет — создаём корневую директорию
      if (!parent) {
        file.path = name;

        await FileService.createFile(file);
      } else {
        file.path = `${parent}//${name}`;

        await FileService.createFile(file);
      }

      return res.status(200).json(file);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw ApiError.Internal("Failed to create file");
    }
  }
}

