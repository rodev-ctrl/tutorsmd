import { NextFunction, Request, Response } from "express";
import ApiError from "../../domain/errors/apiError";

export default function errorMiddleware (
  err: Error & { status?: number; statusCode?: number; code?: number; message?: string },
  req: Request,
  res: Response,
  next: NextFunction
  ) {

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

    const status = err.status || err.statusCode || 500;
    return res.status(status).json({
      ok: false,
      code: process.env.NODE_ENV === "production" ? undefined : err.code,
      message: process.env.NODE_ENV === "production" ? "INTERNAL SERVER ERROR" : err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
  

};
