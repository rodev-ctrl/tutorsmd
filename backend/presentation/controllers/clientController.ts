import { Request, Response } from 'express';
import * as Types from "../../interfaces/InterfaceClientController";

import ClientService from '../../infrastructure/service/clientService';



export class ClientController {
  constructor() {
    // Bind the method to the class instance
    // this.activateClient = this.activateClient.bind(this);
    //this.passwordIsChanged = this.passwordIsChanged.bind(this);
    //this.changingPassword = this.changingPassword.bind(this);
}

static async createClient(req:Request<{}, any, Types.CreateClientBody>, res:Response) {

  const { name, surname, email, password } = req.body;

  const clientData = await ClientService.createClient(
    name,
    surname,
    email,
    password
  );

  return res.status(201).json({
    message: "Client created successfully",
    data: clientData.person
  });
}


static async activateClient(req:Request<Types.ActivateParams>, res:Response) {
  const { activationLink } = req.params;

  const { person, refreshToken } =
    await ClientService.activateClient(activationLink);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.clearCookie("gastToken");

  return res.redirect(`${process.env.CLIENT_URL}/dashboard?role=client`);
}


/*
async getClients(req, res) {
  const clients = await ClientService.getClients();
  return res.json(clients);
}


    async getOneClient(link) {
        const client = await ClientService.getOneClient(link);
        return client;
    }
*/

/*
    async getOneClientByAccessToken(req, res) {
      try {
        const secret = process.env.JWT_ACCESS_SECRET;       
        const {accessToken} = req.cookies;


        if (!accessToken) {
          //console.log(req.cookies);
          throw new Error("No token");
        }
    
        const user = await new Promise((resolve, reject) => {
          jwt.verify(accessToken, secret, (err, decodedUser) => {
            if (err) {
              return reject(err);
            }
            resolve(decodedUser);
          });
        });
    
        const userDTO = new ClientDto(user);
        const plainUserDTO = {
          id: userDTO.id,
          name: userDTO.name,
          surname: userDTO.surname,
          email: userDTO.email,
          password: userDTO.password,
          isActivated: true,
        };
    
        res.json({client: plainUserDTO, accessToken: accessToken}); // Возвращаем объект пользователя
      } catch (e) {
        console.log(e);
      }
    }
    */

    /*
    async checkIsActivated(req, res) {
      const {link} = req.params;
      const client = await this.getOneClient(link);
    
    
      if (!client) {
        return res.status(404).json({ message: 'Activation link is invalid or client not found' });
      }
      
       res.json({user: client});

       // Переброс клиента на фронтенд
       return res.redirect(process.env.CLIENT_URL);
    }
    */


  static async saveProgress(req:Request<{}, any, Types.SaveProgressBody>, res:Response) {

    const { week_range, total_hours, email } = req.body;

    const progress = await ClientService.saveProgress(
      week_range,
      total_hours,
      email
    );

    return res.status(200).json({ message: "Progress saved", progress });
  }


  static async getProgress(req:Request<{}, any, Types.GetProgressBody>, res:Response) {

    const { email } = req.body;

    const progress = await ClientService.getProgress(email);

    return res.status(200).json({ message: "Progress received", progress });
  }

  
/*
    async changingPassword(personId, Model, newPassword) {

      console.log(newPassword);
        const newHashPassword = await bcrypt.hash(newPassword, 10); 
        console.log(newHashPassword);
        const changedPerson = await Model.update({ password: newHashPassword }, {where: {id: personId}});

        if(changedPerson) {
          return res.status(200).json({message: "Вы успешно поменяли пароль"});
        }
        return changedPerson;
    }
      

    getCookie(cookieString, name) {
      if (!cookieString) return null;
      const match = cookieString.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
      return match ? match[1] : null;
    }
  
    async passwordIsChanged(req, res) {
      try {
        const { newPassword, email } = req.body;
        const { refreshToken } = req.cookies;

        console.log("newPassword:", newPassword);
        console.log("RefreshToken:", refreshToken);

        let personId;
        if (newPassword && refreshToken) {
          const client = await Client.findOne({
            where: { email: email },
          });
  
          console.log(client);
           personId = client.id;
        }

        if (newPassword && refreshToken) {
          
          console.log("pass and token ist?");
        
          const allTokens = await TokenSchema.findAll({where: { clientid: personId }}); // получаем все токены
        
          let matchedToken = null;
        
          for (const tokenRecord of allTokens) {
            const match = await bcrypt.compare(refreshToken, tokenRecord.refreshtoken);
            if (match) {
              matchedToken = tokenRecord;
              break;
            }
          }
        
          if (!matchedToken) {
            console.log("НЕ СОВПАДАЕТ");
            return res.status(403).json({ message: "Токен не найден или недействителен" });
          } else {
            const personId = matchedToken.clientid;
            console.log(matchedToken.dataValues);
            console.log(personId);
  
            await this.changingPassword(personId, Client, newPassword);
          }
        }
      } catch (e) {
        console.log(e);
      }
    }



async passwordIsChanged(req, res) {
  try {
    console.log("Запрос на смену пароля");

    const { newPassword, email } = req.body;
    const { refreshToken } = req.cookies;

    if (!newPassword || !refreshToken || !email) {
      return res.status(400).json({ message: "Недостаточно данных" });
    }

    // Найти все токены
    const allTokens = await TokenSchema.findAll();

    let matchedToken = null;

    // Сравнение хэшей
    for (const tokenRecord of allTokens) {
      console.log("REFRESHTOKEN");
      console.log(refreshToken);

      console.log("tokenRecord.refreshtoken");
      console.log(tokenRecord.refreshtoken);

      const match = await bcrypt.compare(refreshToken, tokenRecord.refreshtoken);
      if (match) {
        matchedToken = tokenRecord;
        break;
      }
    }

    if (!matchedToken) {
      console.log("Не найден подходящий refreshToken");
      return res.status(403).json({ message: "Неверный токен или email" });
    }

    // Найдём клиента
    const client = await Client.findByPk(matchedToken.clientid);
    if (!client) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Хешируем и сохраняем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    client.password = hashedPassword;
    await client.save();

    console.log("Пароль успешно обновлён");
    return res.status(200).json({ message: "Пароль изменён успешно" });

  } catch (e) {
    console.error("Ошибка при смене пароля:", e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
}
*/
/*
    async updateClient(req, res) {
        const { name } = req.params;
        const {nameClient, reviews, availableSubjects, highlight, fullDescribe} = req.body;
        const client = await pool.query(`UPDATE client WHERE tutor.name=$1 SET id=$2, name=$3, surname=$4, age=$5`, [name, nameClient, reviews, availableSubjects, highlight, fullDescribe]);
        
        res.send(client.rows);
        return client;
    }

    async deleteClient(req, res) {
        const { email } = req.params;
        //const client = await this.getOneClient(email);

        // const client = await pool.query(`DELETE FROM client WHERE name=$1`, [name]);
        
        res.send(client.rows);
    }
        */ 
    
}