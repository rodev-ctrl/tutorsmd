import Router from "express";
const BookingRouter = Router();

import BookingController from "../controllers/bookingController";
import { requireAuth } from "../middlewares/requireAuth";


BookingRouter.post("/bookings", requireAuth, BookingController.create);
BookingRouter.get("/bookings/:id", requireAuth, BookingController.getBooking);
BookingRouter.delete("/bookings/:id", requireAuth, BookingController.cancelBooking);
BookingRouter.post("/bookings/delete", requireAuth, BookingController.deleteBooking);