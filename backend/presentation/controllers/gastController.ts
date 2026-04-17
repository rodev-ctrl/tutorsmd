import { Request, Response } from "express";
import { Op } from "sequelize";
import { encrypt } from "../../infrastructure/encryption/encryption";
import { v4 as uuidv4 } from "uuid";
import Gast from '../../models/gastModel';
import ApiError from "../../domain/errors/apiError";

export class GastController {


    static async setGastCookie(req: Request, res: Response) {
        let { gastToken } = req.cookies;
        console.log(gastToken);
        console.log(req.cookies);

        try {
            if (!gastToken || typeof gastToken !== 'string') {
                gastToken = uuidv4();
                console.log(gastToken);
                res.cookie('gastToken', gastToken, { 
                    maxAge: 1 * 24 * 60 * 60 * 1000, 
                    httpOnly: true, 
                    sameSite: 'lax', 
                    secure: false
                });
                
                //res.clearCookie("refreshToken");
            }
    
            return res.status(200).json({ message: "Cookie processed", gastToken });
        } catch(e) {
            throw ApiError.BadRequest("")
        }

        
    }


  static async sendMessageAsGast(req:Request, res:Response) {
      try {
          const { gastToken } = req.cookies;
          const { message, chatid } = req.body;
          const MAX_MESSAGES = 20; // Лимит сообщений для гостя

          if (!gastToken || !message) return res.status(400).json({ message: "No data" });

          const hashedToken = encrypt(gastToken);
          let gastEntry = await Gast.findOne({ 
              where: { userid: hashedToken, chatid: chatid || 'default' } 
          });

          const newMessage = { role: 'user', text: message, date: new Date() };

          if (gastEntry) {
              // ПРОВЕРКА ЛИМИТА
              if (gastEntry.messages && gastEntry.messages.length >= MAX_MESSAGES) {
                  return res.status(403).json({ 
                      message: "Лимит сообщений исчерпан. Пожалуйста, зарегистрируйтесь, чтобы продолжить общение." 
                  });
              }

              // Используем оператор spread для иммутабельного обновления JSON
              const updatedMessages = [...gastEntry.messages, newMessage];
              await gastEntry.update({ messages: updatedMessages });
          } else {
              await Gast.create({
                  userid: hashedToken,
                  chatid: chatid || 'default',
                  messages: [newMessage]
              });
          }

          return res.status(200).json({ status: "success" });
      } catch (e) {
          console.error(e);
          return res.status(500).json({ message: "Error" });
      }
  }

  // МЕТОД ОЧИСТКИ СТАРЫХ ДАННЫХ
  // Его можно вызывать через скрипт по расписанию (Cron)
  static async cleanOldGuestData() {
      try {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          // Удаляем всех гостей, которые не писали более 30 дней
          const deletedCount = await Gast.destroy({
              where: {
                  updatedAt: {
                      [Op.lt]: thirtyDaysAgo // Op.lt = "less than" (меньше чем 30 дней назад)
                  }
              }
          });

          console.log(`[CLEANUP] Удалено устаревших записей гостей: ${deletedCount}`);
      } catch (e) {
          console.error("[CLEANUP ERROR]", e);
      }
  }

    static async receiveMessagesFromGast(req: Request, res: Response) {
        try {
            const { gastToken } = req.cookies;
            if (!gastToken) {
                return res.status(200).json({ messages: [] });
            }

            const hashedToken = encrypt(gastToken);
            const gastCheck = await Gast.findOne({ where: { userid: hashedToken } });

            if (gastCheck && gastCheck.messages) {
                return res.status(200).json({ 
                    message: "Received messages", 
                    messages: gastCheck.messages, 
                    gastToken 
                });
            }

            return res.status(200).json({ messages: [] });
        } catch (e) {
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
