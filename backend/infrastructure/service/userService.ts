import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import fs from "fs";
import path from "path";

dayjs.extend(customParseFormat);

// Models
import Booking from "../models/bookingModel";
import Tutor from "../models/tutorModel";
import Desk from "../models/desk";

import BookingDto from "../dto/bookingDto";
import MailService from "./mailService";

import ApiError from "../../domain/errors/apiError";
import PasswordResetModel from "../models/PasswordResetModel";
import { Op } from "sequelize";
import Client from "../models/clientModel";
import TokenService from "./tokenService";
import ClientDto from "../dto/clientDto";
import TutorDto from "../dto/tutorDto";
// import Review from "../models/reviewModel";

class UserService {
  


  // ================= BOOKINGS =================

  static async bookings(
    userid: number,
    tutorEmail: string,
    dateTime: string,
    email: string,
    role: string
  ) {
    try {
      
      let exists;
      if(role == "client") {
        exists = await Booking.findOne({
          where: { clientid: userid, tutoremail: tutorEmail },
        });
      }

      if(role == "tutor") {
        exists = await Booking.findOne({
          where: { tutorid: userid, tutoremail: tutorEmail },
        });
      }
      

      if (exists) throw ApiError.BadRequest("Already booked");

      const lessonid = uuidv4();

      console.log("BOOKING SERVICE /////////////////////////")

      const booking = await Booking.create({
        clientid: role === "client" ? userid : null,
        tutoremail: tutorEmail,
        datetime: dateTime,
        lessonid,
        status: "process",
        tutorid: (role == "tutor") ? userid : null
      });

      console.log("BOOKING CREATE /////////////////////////")
      console.log(booking);

      const dto = new BookingDto(booking);
/*
      await MailService.sendLessonLink(
        tutorEmail,
        dateTime,
        `${process.env.URL}/api/lessons/${lessonid}`
      );

      await MailService.sendLessonLink(
        email,
        dateTime,
        `${process.env.URL}/api/lessons/${lessonid}`
      );
      */

      return { booking: dto };
    } catch (e) {
      console.error(e);
      throw e instanceof ApiError ? e : ApiError.Internal("Booking failed");
    }
  }

  static async getBooking(
    id: number,
    tutorEmail: string,
    role: string, 
    lessonid: string
  ) {
    try {
      console.log("GGGGGGEEEEEEEEEETTTTTTTTTTTTTTTttt");
      console.log(id);
      console.log(role);
      if (!id || !role) throw ApiError.BadRequest("Not enough data");

      let booking = null;
      if(role == "client") {
        if(tutorEmail) {
          booking = await Booking.findOne({
            where: { clientid: id, tutoremail: tutorEmail },
          });
          
        } else {
          booking = await Booking.findOne({
            where: { clientid: id },
          });
        }
       
      } else if(role == "tutor") {
        if(tutorEmail) {
          booking = await Booking.findOne({
            where: { tutorid: id, tutoremail: tutorEmail },
          });
        } else {
          booking = await Booking.findOne({
            where: { tutorid: id },
          });
        }
      }
      

      if (!booking) return null;
console.log(booking);
console.log(id);
      if (booking.clientid !== id && booking.tutorid !== id) {
        throw ApiError.Forbidden("Access denied");
      }

      const now = Date.now();
      let dt = dayjs(booking.datetime, "YYYY.MM.DD HH:mm", true);

      if (!dt.isValid()) dt = dayjs(booking.datetime);

      // после 2 часов -> урок completed 
      if (now > dt.valueOf() + 2 * 60 * 60 * 1000) {
        await booking.update({ status: "completed" });
      }

      /*
      let ok = true;
      if (userToken) {
        try {
          const hash = this.decrypt(booking.usertoken);
          ok = await bcrypt.compare(userToken, hash);
        } catch {
          ok = false;
        }
      }
        

      if (!ok) throw ApiError.Forbidden("Invalid token");
      */
      const dto = new BookingDto(booking);

      return {
          ...dto,
          status: booking.status
      };
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Get booking error");
    }
  }

  static async cancelBooking(id: number, lessonid: string) {
    try {
      const booking = await Booking.findOne({ where: { lessonid } });
      if (!booking) throw ApiError.NotFound("Booking not found");
      if (booking.clientid !== id && booking.tutorid !== id) {
        throw ApiError.Forbidden("Access denied");
      }

      await booking.update({ status: "cancelled" });

      return { message: "Booking cancelled", booking };
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Cancel failed");
    }
  }

  static async deleteBooking(lessonid: string, role: string, id: number) {

    const booking = await Booking.findOne({ where: { lessonid } });
    if (!booking) throw ApiError.NotFound("Booking not found");

    if (role == "client" && id !== booking.clientid) throw ApiError.Forbidden("Access denied");
    if (role == "tutor" && id !== booking.tutorid) throw ApiError.Forbidden("Access denied");

    await booking.destroy();
    return "deleted"
  }
/*
  // ================= REVIEWS =================

  static async reviewSend(email: string, name: string, grade: number, review: string) {
    try {
      const exists = await Review.findOne({
        where: {
          tutor_id: tutorId,
          user_id: user.id,
        },
      });
  
      if (exists) {
        throw ApiError.BadRequest('Review already exists');
      }

      const current =
        Array.isArray(tutor.reviews) ? tutor.reviews : [];

      const updated = [...current, { name, grade, comment: review }];

      await Tutor.update(
        { reviews: updated },
        { where: { email } }
      );

      return { review: updated };
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Review failed");
    }
  }

  static async reviewEdit(email: string, name: string, grade: number, review: string) {
    try {
      const tutor = await Tutor.findOne({ where: { email } });
      if (!tutor) throw ApiError.NotFound("Tutor not found");

      const current =
        Array.isArray(tutor.reviews) ? tutor.reviews : [];
    
        const changed = current.some(r => r.name === name);
        if (!changed) {
          throw ApiError.NotFound("Review not found");
        }

      await Tutor.update(
        { reviews: changed },
        { where: { email } }
      );

      return { review: changed };
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Review failed");
    }
  }
  */


  

  // ================= DESK =================

  static async deskSave(
    lessonid: string,
    pageIndex: number,
    img: string,
    time: Date
  ) {
    try {
      const dir = path.join(__dirname, "..", "desks", lessonid);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filePath = path.join(dir, `${pageIndex}.png`);

      const base64 = img.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(filePath, base64, "base64");

      await Desk.upsert({
        lessonid,
        page_index: pageIndex,
        image_path: filePath,
        updated_at: time,
      });

      return { deskPath: filePath };
    } catch (e) {
      throw ApiError.Internal("Desk save failed");
    }
  }

  static async getDesk(lessonid: string, pageIndex: number) {
    const desk = await Desk.findOne({
      where: { lessonid, page_index: pageIndex },
    });

    if (!desk)
      return { img: null, updatedAt: null };

    const filePath = path.join(
      __dirname,
      "..",
      "desks",
      lessonid,
      `${pageIndex}.png`
    );

    if (!fs.existsSync(filePath))
      return { img: null, updatedAt: desk.updated_at };

    const buffer = fs.readFileSync(filePath);
    const img = `data:image/png;base64,${buffer.toString("base64")}`;

    return { img, updatedAt: desk.updated_at };
  }




  
  static async getTutors() {
    return await Tutor.findAll();
  }

 
  static async getTutor(name: string, surname: string, language: string) {
    try {
      let tutor;

      console.log("GGGGGGGGGGGGGGEEEEEEEEEEEEETTTTTTTTTTTT TTTTTTTTTTTTTUUUUUUTTTTTTOOOOOOOORRRRR");
      console.log(name);
      console.log(surname);
      console.log(language)
      if (language === "russian") {
        tutor = await Tutor.findOne({
          where: { name, surname }
        });
      } else {
        tutor = await Tutor.findOne({
          where: { namegerman: name, surnamegerman: surname }
        });
      }

      console.log(tutor);
  
      if (!tutor) {
        throw ApiError.NotFound("Tutor not found");
      }
  
      return tutor;
  
    } catch (e) {
      throw ApiError.Internal("Failed to fetch tutor");
    }
  }

  
  
}

export default UserService;
