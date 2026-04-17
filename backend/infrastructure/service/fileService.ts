import fs from "fs";
import path from "path";
import ApiError from "../../domain/errors/apiError";

export interface IUserFile {
  user: string;
  path?: string;
}

class FileService {
  private static basePath: string = process.env.FILEPATH || "";

  

  static async createDir(folderName: string): Promise<{ message: string }> {
    try {
      if (!this.basePath) {
        throw ApiError.Internal("FILEPATH is not configured in environment");
      }
      const filePath = path.join(this.basePath, String(folderName));

      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
        return { message: "Directory created successfully" };
      }

      return { message: "Directory already exists" };
    } catch (e) {
      console.error("Error creating directory:", e);
      throw ApiError.Internal("Failed to create directory");
    }
  }

  static async createFile(file: IUserFile): Promise<{ message: string }> {
    try {
      if (!this.basePath) {
        throw ApiError.Internal("FILEPATH is not configured in environment");
      }
      const filePath = path.join(
        this.basePath,
        file.user,
        file.path ?? ""
      );

      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
        return { message: "Directory created successfully" };
      }

      return { message: "Directory already exists" };
    } catch (e) {
      console.error("Error creating directory:", e);
      throw ApiError.Internal("Failed to create file directory");
    }
  }
}

export default FileService;

