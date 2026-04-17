import { Request, Response } from "express";

import TutorService from "../../infrastructure/service/tutorService";
import ApiError from "../../domain/errors/apiError";

import * as TutorTypes from "../../interfaces/InterfaceTutorController";

export class TutorController {
 

 

   /*

  async changingPassword(personId, Model, newPassword) {

    const newHashPassword = await bcrypt.hash(newPassword, 10); 
    const changedPerson = await Model.update(
      { password: newHashPassword },
      { where: { id: personId } }
    );

    if(changedPerson) {
      console.log("Вы успешно поменяли пароль");
    }

    return changedPerson;
  }

  async passwordIsChanged(req, res) {
    try {
      console.log("work?");
      const { newPassword, email } = req.body;
      const { refreshToken } = req.cookies;

      let personId;

      if (newPassword && refreshToken) {
        
        const tutor = await Tutor.findOne({ where: { email }});
        personId = tutor.id;
      }

      if (newPassword && refreshToken) {

        const allTokens = await TokenTutorSchema.findAll({
          where: { tutorid: personId }
        });

        let matchedToken = null;

        for (const tokenRecord of allTokens) {
          const match = await bcrypt.compare(
            refreshToken,
            tokenRecord.refreshtoken
          );
          if (match) {
            matchedToken = tokenRecord;
            break;
          }
        }

        if (!matchedToken) {
          return res.status(403).json({ message: "Токен не найден или недействителен" });
        } else {
          const personId = matchedToken.tutorid;

          await this.changingPassword(personId, Tutor, newPassword);
        }
      }
    } catch(e) {
      console.log(e);
    }
  }
  */
}



