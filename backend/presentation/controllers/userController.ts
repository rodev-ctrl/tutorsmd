/*
const uuid = require('uuid');
// const Stripe = require("stripe");


const bcrypt = require('bcrypt');

const Gast = require('../models/gastModel');
const Client = require('../models/clientModel');
const Tutor = require('../models/tutorModel');
const TokenSchema = require('../models/tokenModel');
const TokenTutorSchema = require('../models/tokenTutorModel');
const Offer = require('../models/offerModel');
const Booking = require('../models/bookingModel');
const BookingDto = require('../dto/bookingDto');
const UserService = require('../service/userService');


const crypto = require("crypto");
// const stripe = new Stripe("sk_test_123"); // Твой Secret Key



class UserController {
    constructor() {
        this.receiveMessagesFromUser = this.receiveMessagesFromUser.bind(this);
        this.encrypt = this.encrypt.bind(this);
        this.algorithm = 'aes-256-cbc';
        const secretKeyEnv = process.env.SECRET_KEY?.trim().substring(0, 64); // Оставляем только первые 64 символа
  if (!secretKeyEnv) {
    throw new Error('SECRET_KEY is not defined in the environment variables');
  }

  if (secretKeyEnv.length !== 64) {
    throw new Error(`SECRET_KEY must be 64 hexadecimal characters, but got ${rawKey.length}`);
  }

  this.secretKey = Buffer.from(secretKeyEnv, 'hex'); // Преобразование из hex в Buffer
        //this.secretKey = crypto.randomBytes(32); // Генерация секретного ключа
      }


 async setGastCookie(req, res) {
  
    const {gastToken} = req.cookies;
    if(!gastToken || gastToken.length == 0 || gastToken == null || Object.prototype.toString.call(gastToken) === '[object Object]' && Object.getPrototypeOf(gastToken) === null) {
        const gastToken = uuid.v4();
        res.cookie('gastToken', gastToken, { 
        maxAge: 1 * 24 * 60 * 60 * 1000, 
        httpOnly: true, 
        sameSite: 'lax', 
        priority: 'high', 
        secure: true
    });

    return res.status(200).json({ message: "Cookie set", gastToken: gastToken });
    } else {
        return res.status(200).json({ message: "Cookie set", gastToken: gastToken });
    }




   
}


 generateIV(id) {
    return crypto.createHash('md5').update(id).digest(); // Детерминированный IV
  }

  
  // Функция для шифрования
  encrypt(id) {
    if (!id || typeof id !== "string") {
      
      //console.log(id);
      throw new Error("Invalid input for encryption");
    }
    //console.log(id);
    const iv = this.generateIV(id); // IV основан на данных
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    let encrypted = cipher.update(id, "utf8", "hex");
    encrypted += cipher.final("hex");
    //return encrypted;
    return `${iv.toString('hex')}:${encrypted}`
  }
  
  // Функция для расшифровки
  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid input for decryption');
    }
    const [ivHex, encrypted] = encryptedData.split(":");
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
  
    //const iv = generateIV(id); // IV основан на данных
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }


  async receiveMessagesFromUser(req, res) {
    try {
      const { role, email, userToken } = req.body;

      console.log("RECEIVEMESSAGESFROMUSER");
      console.log("EMAIL:");
      console.log(email);
  
      console.log("ROLE:");
      console.log(role);
  
      console.log("USERTOKEN:");
      console.log(userToken);
    
    
      try {
        let userCheck = null;
        let token = userToken;
    
        if (role === "client") {
          const client = await Client.findOne({ where: {email: email} });
          if(client) {
  
            const allTokens = await TokenSchema.findAll( {where: {clientid: client.id} } );
            for (const dbToken of allTokens) {
              if (token && dbToken?.refreshtoken) {
                const isMatch = await bcrypt.compare(token, dbToken.refreshtoken);
                if (isMatch) {
                  const id = dbToken.clientid;
                  userCheck = await Client.findOne({ where: { id } });
                  break;
                }
              }
            }
          }
         
        }
        
    
        else if (role === "tutor") {
          const tutor = await Tutor.findOne({ where: {email: email} });
          console.log("TUTOR:");
          console.log(tutor);
          if(tutor) {
  
          const allTokens = await TokenTutorSchema.findAll( {where: {tutorid: tutor.id} } );
          console.log("ALLTOKENS:");
          console.log(allTokens);
          for (const dbToken of allTokens) {
            if (token && dbToken?.refreshtoken) {
              const isMatch = await bcrypt.compare(token, dbToken.refreshtoken);
              console.log(isMatch);
              if (isMatch) {
                const id = dbToken.tutorid;
                userCheck = await Tutor.findOne({ where: { id } });
                console.log("USERCHECK TUTOR: ");
                console.log(userCheck);
                break;
              }
            }
          }
        }
      }
        
    
        else if (role === "gast") {
          const encryptedToken = this.encrypt(token);
          userCheck = await Gast.findOne({ where: { userid: encryptedToken } });
        }
    console.log("SEND BACK MESSAGES:");
    console.log(userCheck);
    console.log(userCheck.messages);
        if (userCheck && userCheck.messages) {
          return res.status(200).json({
            message: "Received messages",
            messages: userCheck.messages,
            token,
          });
        } else {
          return res.status(404).json({ message: "User or messages not found" });
        }
    
      } catch (e) {
        console.error("Error in receiveMessagesFromUser:", e);
        return res.status(500).json({ message: "Internal server error" });
      }
    } catch(e) {
      console.log(e);
    }
    
  }

  



async offers(req, res) {

  const {offer} = req.body;
  console.log(req.body);
  console.log("hey");
  
  try{
              await Offer.create({
                offer: offer
              })
              return res.status(200).json({ message: "Received offer", offer: offer });
          
  } catch(e) {
      console.log(e);
  }
  } 



  async bookings(req, res) {

    const {clientid, userToken, tutorEmail, dateTime, email} = req.body;
    console.log(clientid);
    console.log(userToken);
    console.log(tutorEmail);
    console.log(dateTime);
    console.log("booking");
    
    try{
       const booking = await UserService.bookings(clientid, userToken, tutorEmail, dateTime, email);
       if(booking) {
        console.log("Controller send to frontend");
        console.log(booking);
        console.log(booking.booking);
        console.log(booking.data);
       return res.status(200).json({ 
        message: "Received booking", 
        booking: booking.booking // Обернули plainBookingDto в свойство `booking`
    });
}
    } catch(e) {
        console.log(e);
        res.status(500).json({ message: "Internal Server Error" });
    }
    } 
    
    
    async getBooking(req, res) {

      const {id, userToken, tutorEmail, randomLessonId} = req.body;

      try{
         const booking = await UserService.getBooking(id, userToken, tutorEmail, randomLessonId);
         if(booking) {
          console.log("Controller send to frontend");
          console.log(booking);
          console.log(booking.booking);
          console.log(booking.data);
         return res.status(200).json({ 
          message: "Received booking", 
          booking: booking.booking // Обернули plainBookingDto в свойство `booking`
      });
  }
      } catch(e) {
          console.log(e);
          res.status(500).json({ message: "Internal Server Error" });
      }
      }
      
      
      async cancelBooking(req, res) {

        const {userToken, tutorEmail, dateTime } = req.body;
  
        console.log("booking cancel");
        console.log(userToken);
        console.log(tutorEmail);
        
        try{
           const booking = await UserService.cancelBooking(userToken, tutorEmail, dateTime);
           if(booking) {
           return res.status(200).json({ 
            message: "Canceled booking"
        });
    }
        } catch(e) {
            console.log(e);
            res.status(500).json({ message: "Internal Server Error" });
        }
        }




        async reviewSend(req, res) {

          const {email, name, grade, review} = req.body;
          console.log(email);
          console.log(name);
          console.log(grade);
          console.log(review);
          console.log("review");
          
          try{
             const reviewData = await UserService.reviewSend(email, name, grade, review);
             if(reviewData) {
              console.log("Controller send to frontend");
              console.log(reviewData);
             return res.status(200).json({ 
              message: "Received review", 
              review: reviewData.review 
          });
      }
          } catch(e) {
              console.log(e);
              res.status(500).json({ message: "Internal Server Error" });
          }
          } 



          async lessonLive(req, res) {

            const {lessonid} = req.params;
 console.log(lessonid);
 const URL = `${process.env.CLIENT_URL}/dashboard/lessons/${lessonid}`;
            
            try{
              return res.redirect(URL);
        
            } catch(e) {
                console.log(e);
                res.status(500).json({ message: "Internal Server Error" });
            }
            } 

            async deskSave(req, res) {

              const {randomLessonId} = req.params;
   console.log(randomLessonId);
              
              try{
                
              } catch(e) {
                  console.log(e);
                  res.status(500).json({ message: "Internal Server Error" });
              }
              }


              async emailChange(req, res) {
                try {
                  
                  const { newEmail, oldEmail, role } = req.body;
console.log(newEmail);
console.log(oldEmail);
console.log(role);
                  if(role == "tutor") {
                    await UserService.emailChange(oldEmail, newEmail, Tutor);
                  }
                  if(role == "client") {
                    await UserService.emailChange(oldEmail, newEmail, Client);
                  } 
                  
                } catch(e) {
                  console.log(e);
                  res.status(500).json({ message: "Internal Server Error" });
                }
              }

              async emailIsChanged(req, res) {
                try {
                  const { changeEmailLink } = req.params;
              
                  // Проверяем, есть ли такой код в базе
                  const tutor = await Tutor.findOne({ where: { changeEmailLink: changeEmailLink } });
                  const client = await Client.findOne({ where: { changeEmailLink: changeEmailLink } });
              
                  const person = tutor || client;
              
                  if (!person) {
                    return res.status(400).json({ message: "Ссылка недействительна" });
                  }
              
                  // Обновляем email и удаляем `changeEmailLink`
                  await person.update({ email: person.newEmail, newEmail: null, changeEmailLink: null });
              
                  return res.json({ message: "Email успешно изменен!" });
                } catch (e) {
                  console.log(e);
                  res.status(500).json({ message: "Ошибка сервера" });
                }
              }


              async deleteAccount(req, res) {
                const { email, role, refreshToken } = req.body;

                if(role == "tutor") {
                  const tutor = await Tutor.destroy({ where: { email: email } });

                  const allTokens = await TokenTutorSchema.findAll({ where: {id: tutor.id}}); // получаем все токены
        
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
                    const tutorToken = await TokenTutorSchema.destroy({ where: {refreshtoken: matchedToken.refreshToken} });
                    //const personId = matchedToken.clientid;
                    //console.log(matchedToken.dataValues);
                    //console.log(personId);
          
                    // await this.changingPassword(personId, Client, newPassword);
                  }

                
                  
                }

                if(role == "client") {
                  const client = await Client.destroy({ where: { email: email } });

                  const allTokens = await TokenSchema.findAll({ where: {id: client.id}}); // получаем все токены
        
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
                    const tutorToken = await TokenSchema.destroy({ where: {refreshtoken: matchedToken.refreshToken} });
                    //const personId = matchedToken.clientid;
                    //console.log(matchedToken.dataValues);
                    //console.log(personId);
          
                    // await this.changingPassword(personId, Client, newPassword);
                  }

                
                  
                }

                return true;
                
              }

              async checkCookiesAllow(req, res) {
                 const {refreshToken} = req.cookies;
                 console.log(refreshToken);

                 if(refreshToken) {
                  return res.status(200).json({message: "isAllow"});
                 } else {
                  return false;
                 }
              }

              async areCookiesForUsage(req, res) {
              
                if(req.cookies.refreshToken || req.cookies.gastToken || req.cookies.accessToken) {
                 return res.status(200).json({message: "isAllow"});
                } else {
                 return false;
                }
             }


              async addCard(req, res) {

                try {
                  const { paymentMethodId, email } = req.body;

                  if (!paymentMethodId) {
                    return res.status(400).json({ error: "paymentMethodId is required" });
                  }

                  if (!email) {
                    return res.status(400).json({ error: "Email is required" });
                  }


                     // Предположим, что у пользователя уже есть ID (например, берём из базы)
    const customer = await stripe.customers.create({
      payment_method: paymentMethodId,
      email: email, // Здесь можно использовать email из базы
      invoice_settings: { default_payment_method: paymentMethodId },
    });

     // Создаём подписку
     const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }], // ID цены из Stripe
      expand: ["latest_invoice.payment_intent"], // Раскрываем объект платежа
    });
    
    res.json({ success: true, subscription });
                } catch(e) {
                  console.log(e);
                  res.status(500).json({ e: e.message });
                }
                  

              }


              async getCookie(req, res) {
                const {refreshToken} = req.cookies;

                return res.status(200).json({ message: "Is RefreshToken", data: refreshToken });
              }
              


// Добавление пользователя в Redis
async addUser(req, res) {
  const { userToken, booking } = req.body;
  console.log("ADDUSER");
  console.log(userToken);
  console.log(booking);
  
  await redis.hset(`user:${userToken}`, {
    id: booking.id.toString(),
    usertoken: booking.usertoken,
    tutoremail: booking.tutoremail,
    datetime: booking.datetime,
    lessonid: booking.lessonid
  });
  await redis.sadd(`room:${booking.lessonid}`, userToken);
  
}

// Получение всех пользователей в комнате
async getUsersInRoom(req, res) {
  console.log("GETUSERS");
  const {lessonid} = req.body;
  console.log(lessonid);

  
  const tokens = await redis.smembers(`room:${lessonid}`);
  console.log("Tokens in Redis:", tokens);
  const users = await Promise.all(
    tokens.map(async (token) => {
      const userData = await redis.hgetall(`user:${token}`);
      return { token, ...userData };
    })
  );
  
  console.log("Users in Redis:", users);
  return res.status(200).json({ data: users });
}
  

// Удаление пользователя
async removeUser(req, res) {

  console.log("DELETE USER");
  const {usertoken, lessonid} = req.body;

  console.log(usertoken, lessonid);

  // await redis.del(`user:${usertoken}`);
  // await redis.srem(`room:${lessonid}`, usertoken);
}



// ===== Presence (in-memory) вместо Redis =====
const users = new Map();   // userToken -> booking
const rooms = new Map();   // lessonId  -> Set(userToken)

function addUserToRoom(userToken, booking) {
  users.set(userToken, { ...booking, id: String(booking.id) });
  let set = rooms.get(booking.lessonid);
  if (!set) { set = new Set(); rooms.set(booking.lessonid, set); }
  set.add(userToken);
}

function removeUserFromRoom(usertoken, lessonid) {
  users.delete(usertoken);
  const set = rooms.get(lessonid);
  if (set) {
    set.delete(usertoken);
    if (set.size === 0) rooms.delete(lessonid);
  }
}

function listTokens(lessonid) {
  return Array.from(rooms.get(lessonid) ?? []);
}

function listUsers(lessonid) {
  return listTokens(lessonid).map((token) => ({ token, ...(users.get(token) || {}) }));
}
// =============================================

    
}




module.exports = new UserController();
*/


import { Request, Response } from "express";
import { Model } from "sequelize";
import bcrypt from "bcrypt";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import * as Types from "../../interfaces/InteraceUserController";

import { v4 as uuidv4 } from "uuid";

dayjs.extend(utc);
dayjs.extend(tz);

// Модели
import Gast from "../../infrastructure/database/models/gastModel";
import Client from "../../models/clientModel";
import Tutor from "../../models/tutorModel";
import Offer from "../../models/offerModel";
import Booking from "../../models/bookingModel";
import Complaint from "../../models/complaintModel";

// encrypt/decrypt
import { encrypt } from "../../infrastructure/encryption/encryption";

// Сервисы
import UserService from "../../infrastructure/service/userService";

// Исключения
import ApiError from "../../domain/errors/apiError";
import Lesson from "../../models/lessonModel";
import MainService from "../../infrastructure/service/authService";

export class UserController {


  static async receiveMessagesFromUser(req: Request, res: Response) {
    try {
      const { role, email, userToken } = req.body as {
        role: "client" | "tutor" | "gast" | "admin";
        email?: string;
        userToken: string;
      };

      console.log("MESSSSSSSSSSSAAAAAAAAAAAGGGGGGEEEESSSSSSS");
      console.log(req.body);

      if ((!role || !email) || (role == "gast" && !userToken)) {
        throw ApiError.BadRequest("Not enough data for Messages to receive");
      }

      let user: any = null;

      if (role === "client") {
        const client = await Client.findOne({ where: { email } });
        if (!client) throw ApiError.NotFound("Client not found");
        
        user = client;
      }

      if (role === "tutor") {
        const tutor = await Tutor.findOne({ where: { email } });
        if (!tutor) throw ApiError.NotFound("Tutor not found");

        user = tutor;
      }

      if (role === "gast") {
        const encryptedToken = encrypt(userToken);
        const gast = await Gast.findOne({ where: { userid: encryptedToken } });
        if(!gast) throw ApiError.NotFound("Gast not found");

        user = gast;
      }

      if (role === "admin") {
        user =
          (await Tutor.findOne({ where: { email } })) ||
          (await Client.findOne({ where: { email } })) ||
          (await Gast.findOne({ where: { chatid: email } }));
      }

      if (!user || !user.messages) {
        throw ApiError.NotFound("Messages not found");
      }

      return res.status(200).json({
        message: "Messages received",
        messages: user.messages,
      });
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }


  static async offers(req: Request, res: Response) {
    try {
      const { offer } = req.body;
      if (!offer) throw ApiError.BadRequest("No offer provided");

      await Offer.create({ offer });

      return res.status(200).json({ message: "Offer received" });
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }

  
  static async bookings(req: Request, res: Response) {
    try {
      const { userid, tutorEmail, dateTime, email, role } = req.body;

      console.log(req.body)
      if (!userid || !tutorEmail || !dateTime) {
        throw ApiError.BadRequest("Not enough data");
      }

      if (email === tutorEmail) {
        throw ApiError.BadRequest("You cannot book a lesson with yourself");
      }

      const booking = await UserService.bookings(
        userid,
        tutorEmail,
        dateTime,
        email,
        role
      );

      if(!booking) throw ApiError.NotFound("Booking not found");

      return res.status(200).json({
        message: "Booking created",
        booking: booking.booking,
      });
    } catch (e) {
      console.error(e);
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }

  static async getBooking(req: Request, res: Response) {
    try {
      const { id, tutorEmail, role, lessonid } = req.body;
      const booking = await UserService.getBooking(
        id, tutorEmail, role, lessonid
      );

      return res.status(200).json(booking);
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }

  static async cancelBooking(req: Request, res: Response) {
    try {
      const { id, lessonid } = req.body;

      const ok = await UserService.cancelBooking(id, lessonid);

      if (!ok) throw ApiError.BadRequest("Cancel failed");

      return res.status(200).json(ok);
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }

  static async deleteBooking(req: Request, res: Response) {
    try {
      const { lessonid } = req.body;
      const { role, id } = req.user;
      if (!lessonid || !role || !id) throw ApiError.BadRequest("Invalid delete booking request");

      const deleted = await UserService.deleteBooking(lessonid, role, id);

      if(!deleted) throw ApiError.BadRequest("Deleted failed");

      return res.status(200).json({ message: "Deleted" });
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }

 /*
  static async reviewSend(req: Request, res: Response) {
    try {
      const { email, name, grade, review } = req.body;

      const data = await UserService.reviewSend(email, name, grade, review);

      if (!data) throw ApiError.Internal("Review not saved");

        return res.status(200).json({
          message: "Review saved",
          review: data.review,
        });
      
      
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }


  static async reviewEdit(req: Request, res: Response) {
    try {
      const { email, name, grade, review } = req.body;

      const data = await UserService.reviewEdit(email, name, grade, review);

      if (!data) throw ApiError.Internal("Review not edited");

        return res.status(200).json({
          message: "Review edited",
          review: data.review,
        });
      
      
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }
    */

/*
  static async lessonLive(req: Request, res: Response) {
    const { lessonid } = req.params;
    if (!lessonid) throw ApiError.BadRequest("lessonid required");

    return res.redirect(
      `${process.env.CLIENT_URL}/dashboard/lessons/${lessonid}`
    );
  }
    */


/*
  static async getRefreshToken(req: Request, res: Response) {
    return res.status(200).json({
      refreshToken: req.cookies?.refreshToken ?? null,
    });
  }
    */


  static async sendComplaint(req: Request, res: Response) {
    try {
      const { complaint } = req.body;
      const id = req.user.id;

      if (!complaint) throw ApiError.BadRequest("Complaint is required");
      if (!id) throw ApiError.Unauthorized("Not authenticated");

      const saveComplaint = await Complaint.create({
        clientid: id,
        complaint,
      });

      if(!saveComplaint) throw ApiError.Internal("Complaint not save");

      return res.status(200).json({ message: "Complaint sent" });
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }

  static async getLessonsScheduleByTutor(req: Request, res: Response) {
    try {
      const { tutor_email } = req.body;
  
      if (!tutor_email)
        throw ApiError.BadRequest("tutor_email required");
  
      const lessons = await Lesson.findAll({
        where: { tutor_email }
      });
  
      return res.status(200).json(lessons);
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Failed to get tutor lessons");
    }
  }
  
  static async checkCookiesAllow(req: Request, res: Response) {
    if(req.cookies) {
      return res.status(200).json({ ok: true });
    } else {
      return ApiError.Internal("Cookies not allowed")
    }
    
  }

  static async getLessons(req: Request, res: Response) {
    try {
      const client_email = req.user.email;
      const lessons = await Lesson.findAll({ where: { client_email }});
  
      return res.status(200).json(lessons);
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Failed to get lessons");
    }
  }

  static async setLessonSchedule(req: Request, res: Response) {
    try {
      const { lessonid, plan, client_email, tutor_email } = req.body as {
        lessonid: string, 
        plan: Object,
        client_email: string,
        tutor_email: string
      };
      console.log(req.body);
      if (!lessonid || !plan || !client_email || !tutor_email) {
        console.log("not enough data");
        console.log(req.body);
    
        throw ApiError.BadRequest("Not enough data");
      }
  
      const lesson = await Lesson.findOne({
        where: { lessonid, client_email, tutor_email },
      });

      if(lesson) throw ApiError.Internal("Lesson is already created")
  
        console.log("not founded lesson");
     console.log("ok before create");
      await Lesson.create({
        lessonid,
        client_email,
        tutor_email,
        start_at: new Date(),
        duration_minutes: 90,        
        status: "process",      
        updated_at: new Date(),
        datetime: plan
      });
  
      return res.status(200).json({
        message: "Lesson schedule saved",
        lesson,
      });
    } catch (e: any) {
      console.error("ОШИБКА ПРИ CREATE LESSON:", e);
      console.error(e.parent?.detail);
      console.log(e.message);
      console.log(e.errors?.[0]?.message);

      throw e instanceof ApiError
        ? e
        : ApiError.Internal("Failed to save lesson schedule");
    }
  }
  






  static async getTutors(req: Request, res: Response) {
    try {
      const tutors = await UserService.getTutors();

      return res.status(200).json({
        message: "Successfully tutors get!",
        data: tutors,
      });
    } catch (e: any) {
      console.error(e);
      throw ApiError.Internal("Failed to get tutors");
    }
  }

  static async getOneTutor(req: Request, res: Response) {
    const { name, surname } = req.params;
    const { language } = req.body;
    console.log("GET 1 TUTOR");
console.log(req.params);
console.log(req.body);

    try {
      console.log(name);
      console.log(surname);
      console.log(language);
      if(!name || !surname || !language) {
        throw ApiError.BadRequest("Name, surname and language are required");
      }

      const tutor = await UserService.getTutor(
        name,
        surname,
        language
      );

      return res.status(200).json({
        message: "Successfully tutor get!",
        data: tutor,
      });
    } catch (e: any) {
      console.error(e);
      throw ApiError.Internal("Failed to get tutor");
    }
  }
  

  
  


  // =======================================================

  // =================== helper: schedule ==================
  /**
   * Возвращает ближайшее занятие (Date в UTC) согласно weekly-плану.
   * weekly: [{ dow: 1..7 (Пн..Вс), time: "HH:mm" }]
   */
  /*
  private computeNextStartAt(schedule: { timezone: string; weekly: Array<{ dow: number; time: string }> }) {
    const { timezone, weekly } = schedule;

    const now = dayjs().tz(timezone);
    let best: any = null;

    // nowIso: 1..7 (пн..вс)
    const nowIso = ((now.day() + 6) % 7) + 1; // day(): 0..6, где 0=вс

    for (const { dow, time } of weekly) {
      const [hh, mm] = time.split(":").map(Number);

      // на сколько дней сдвинуться вперёд
      let addDays = (dow - nowIso + 7) % 7;

      // кандидат
      let cand = now
        .startOf("day")
        .add(addDays, "day")
        .hour(hh)
        .minute(mm)
        .second(0)
        .millisecond(0);

      // если сегодня слот уже прошёл — переносим на следующую неделю
      if (cand.isSame(now, "day") && cand.isBefore(now)) {
        cand = cand.add(7, "day");
      }

      if (!best || cand.isBefore(best)) best = cand;
    }

    return best.utc().toDate(); // Date (UTC) для TIMESTAMPTZ
  }
  */
  // =======================================================

  // ====================== endpoints ======================



  // ===== (опционально) API для in-memory presence =====
  /*
  async addUser(req: Request, res: Response) {
    const { userToken, booking } = req.body as { userToken: string; booking: BookingRec };
    addUserToRoom(userToken, booking);
    return res.sendStatus(200);
  }
  async getUsersInRoom(req: Request, res: Response) {
    const { lessonid } = req.body as { lessonid: string };
    const data = listUsers(lessonid);
    return res.status(200).json({ data });
  }
  async removeUser(req: Request, res: Response) {
    const { usertoken, lessonid } = req.body as { usertoken: string; lessonid: string };
    removeUserFromRoom(usertoken, lessonid);
    return res.sendStatus(200);
  }
  */
}

