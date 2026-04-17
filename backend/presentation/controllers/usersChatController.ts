import { Request, Response } from "express";
import { Op } from "sequelize";
import TokenService from "../../infrastructure/service/tokenService";
import Ticket from "../../models/ticketModel";
import ApiError from "../../domain/errors/apiError";
import { v4 as uuidv4 } from "uuid";

export class UsersChatController {
  static async ticket(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw ApiError.Unauthorized("No refresh token");
      }

      await Ticket.destroy({
        where: { expires_at: { [Op.lt]: new Date() } },
      });

      const user = TokenService.validateRefreshToken(refreshToken);

      if (!user) {
        throw ApiError.Unauthorized("Invalid token");
      }
      const email = user.email;

      let ticket = await Ticket.findOne({
        where: { user_email: email },
      });

      if (!ticket) {
        ticket = await Ticket.create({
          ticket: uuidv4(),
          user_email: email,
          expires_at: new Date(Date.now() + 2 * 60 * 1000),
        });
      } else {
        await ticket.update({
          expires_at: new Date(Date.now() + 2 * 60 * 1000),
        });
      }

      return res.status(200).json({ ticket: ticket.ticket });
    } catch (e) {
      console.error(e);
      throw e instanceof ApiError
        ? e
        : ApiError.Internal("Ticket generation failed");
    }
  }
}
