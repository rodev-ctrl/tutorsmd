import TokenSchema from "../models/tokenModel";

require("dotenv").config();
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from "uuid";

// Services
import FileService from "./fileService";
import MailService from "./mailService";
import TokenService from "./tokenService";
import MainService from "./authService";

// encrypt/decrypt
import { encrypt } from "../encryption/encryption";

// Models
import Client from "../models/clientModel";

// DTO / Errors
import ClientDto from "../dto/clientDto";
import ApiError from "../../domain/errors/apiError";
import Tutor from "../models/tutorModel";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/InterfaceUserRepository";


class ClientService {

    private readonly userRepo: IUserRepository;
    private readonly emailService: IEmailService;

    constructor(userRepo: IUserRepository, emailService: IEmailService) {
        this.userRepo = userRepo;
        this.emailService = emailService;
    }

 
static async createClient(name:string, surname:string, email:string, password:string) {
  
  try {

      const existingTutor = await Tutor.findOne({ where: { email } });
      if (existingTutor) throw ApiError.BadRequest("Email already in use");
      
      const existingClient = await Client.findOne({ where: { email } });
      if (existingClient) throw ApiError.BadRequest("Email already in use");

        const activationLink = uuidv4();
          const baseUsername = `${name[0]}.${surname[0]}`.toLowerCase();
          const username = `${baseUsername}.${uuidv4().slice(0, 6)}`;
            const id = await this.userRepository.getNextId();

          const user = User.create(id, name, surname, email, password, "client", false, activationLink, username);

        const client = await Client.create({
            name: user.name, surname: user.surname, email: user.email,
            password: user.hashedPassword,
            isActivated: false,
            activationLink: user.activationLink,
            username: user.username,
            newEmail: '', 
            changeEmailLink: '', 
            messages: [], 
            progress: []
        });

        MailService.sendActivationLink(email, `${process.env.URL}activate/${activationLink}`);

        const clientDto = new ClientDto(client);

        return { person: clientDto };
    } catch (e: any) {
        if (e.name === "SequelizeUniqueConstraintError") {
            throw ApiError.BadRequest("User already exists with this email");
        }
        throw ApiError.Internal("Server error");
    }
}

static async activateClient(activationLink: string) {
  try {
    const client = await Client.findOne({ where: { activationLink } });
    
    if (!client) throw ApiError.BadRequest("Invalid activation link");

    // если чел активирован, то не пересохраняем его в базе, чтобы лишнего запроса не было
    if(!client.isActivated) {
      client.isActivated = true;
      await client.save();
      await this.fileMethod(client.email);
    }
   
    const clientDto = new ClientDto(client);

    // 4) Сохраняем refreshToken в таблицу tokensclients
    //    deviceId временный, чтобы пройти NOT NULL.
    //    Реальный deviceId привяжем позже в /refreshClient.
    // const activationDeviceId = `activation-${clientDto.id}`;
    const tokens = TokenService.generateTokens({
      ...clientDto,
      role: "client",
    });
  

    await TokenService.saveToken(
      clientDto.id,
      tokens.refreshToken,
      tokens.deviceId,
      "client"
    );
    
/*
    await TokenService.removeActivationTokenByDevice(
      clientDto.id,
      activationDeviceId
    );
    */

    
    return {
      person: clientDto,
      ...tokens, 
    };
  } catch (e) {
    throw ApiError.Internal("Client activation failed");
  }
}





static async fileMethod(email:string) {
    try {
        // Генерируем имя папки (зашифрованный email)
        const encryptedFolderName = encrypt(email);
        // Вызываем сервис файловой системы
        await FileService.createDir(encryptedFolderName);
    } catch (e) {
      throw ApiError.Internal("Creation folder for User failed");
    }
}


  /*
  static async forgotPassword(email:string, passwordLink:string, language: string) {
    return await MainService.forgotPassword(email, "client", passwordLink, language);
  }
    */


  static async getClients() {
     const clients = await Client.findAll();
     return clients;
  }

  static async getOneClient(link:string) {
    const client = await Client.findOne({where: {activationLink: link}});
    if(!client) return;

    const clientDto = new ClientDto(client);
    let tokenData;
    try {
      tokenData = await TokenSchema.findOne({where: { clientid: clientDto.id }});
      //console.log("TOKENDATA from clientService (getOneClient)");
      //console.log(tokenData);   
  
      
              // Если в базе данных токен(ACCESS) найден
              if(tokenData) {
                // то перезаписываем у этого поля токен(REFRESH) 
                // tokenData.refreshtoken = refreshToken;
                //console.log("Service RefreshToken: ");
    //console.log(tokenData.refreshToken);
                // '.save()' - чтобы REFRESH-токен в базе данных обновился
                // return await tokenData.save();
                return tokenData
            } 
    } catch (e) {
      console.log(e);
    }

    return {client: clientDto, tokenData: tokenData};
 }


 static async deleteClient(email:string) {
  const clientCopy = await Client.destroy({where: {email: email}});
  return clientCopy;
 }

 static async saveProgress(
  week_range: string,
  total_hours: number,
  email: string
) {
  const client = await Client.findOne({ where: { email } });

  if (!client) throw ApiError.NotFound("Client not found");

  const current = Array.isArray(client.progress)
    ? client.progress
    : [];

  const updated = [
    ...current,
    { week_range, total_hours }
  ];

  await client.update({ progress: updated });

  return updated;
}


static async getProgress(email: string) {
  const client = await Client.findOne({ where: { email } });

  if (!client) throw ApiError.NotFound("Client not found");

  return client.progress ?? [];
}

 /*
 async fileMethod(user, name) {
  await fileService.createDir(new File({user: user.id, name: name}));
 }
  */


}

export default ClientService;
