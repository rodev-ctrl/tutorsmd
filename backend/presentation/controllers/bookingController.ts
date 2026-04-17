import { CreateBookingUseCase } from '../../application/usecases/booking/CreateBookingUseCase';
import { CancelBookingUseCase } from '../../application/usecases/booking/CancelBookingUseCase';
import { GetBookingUseCase } from '../../application/usecases/booking/GetBookingUseCase';
import { DeleteBookingUseCase } from '../../application/usecases/booking/DeleteBookingUseCase';
import { Request, Response } from 'express';

class BookingController {
    private createBookingUseCase: CreateBookingUseCase;
    private cancelBookingUseCase: CancelBookingUseCase;
    private getBookingUseCase: GetBookingUseCase;
    private deleteBookingUseCase: DeleteBookingUseCase;

    constructor(
        bookingRepo: IBookingRepository,
        userRepo: IUserRepository,
        idGenerator: IUUIdGenerator
    ) {
        this.createBookingUseCase = new CreateBookingUseCase(bookingRepo, userRepo, idGenerator);
        this.cancelBookingUseCase = new CancelBookingUseCase(bookingRepo, userRepo, idGenerator);
        this.getBookingUseCase = new GetBookingUseCase(bookingRepo, userRepo, idGenerator);
        this.deleteBookingUseCase = new DeleteBookingUseCase(bookingRepo, userRepo, idGenerator);
    }


    async create(req: Request, res: Response) {
      const { userid, tutorEmail, dateTime } as = req.body;

      const booking = await this.createBookingUseCase.create(
        userid,
        tutorEmail,
        dateTime
      );

      if(!booking) throw ApiError.NotFound("Booking not found");

      return res.status(200).json({
        message: "Booking created",
        booking: booking.booking,
      });
  }

   async getBooking(req: Request, res: Response) {
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

  async cancelBooking(req: Request, res: Response) {
    try {
      const { id, lessonid } = req.body;

      const ok = await BookingService.cancelBooking(id, lessonid);

      if (!ok) throw ApiError.BadRequest("Cancel failed");

      return res.status(200).json(ok);
    } catch (e) {
      throw e instanceof ApiError ? e : ApiError.Internal("Server error");
    }
  }

  async deleteBooking(req: Request, res: Response) {
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
}



export default new BookingController();