import { NextFunction, Request, Response, RequestHandler } from "express";
import { IAccessTokenService } from "../../application/ports/IAccessTokenService";
import ApiError from "../../domain/errors/apiError";
import { Role } from '../../domain/entities/User';

export const requireAuth = (accessTokenService: IAccessTokenService): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next(ApiError.Unauthorized("No valid AccessToken"));
    }

    const accessToken = authHeader.split(" ")[1];
    const userData = accessTokenService.verifyAccessToken(accessToken);

    if (!userData) {
      return next(ApiError.Unauthorized("Invalid AccessToken"));
    }

    req.user = userData; 
    return next();
  } catch {
    return next(ApiError.Unauthorized("Session not found"));
  }
}
};

export const requireRole = (role: Role) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.activeRole !== role) {
      return next(ApiError.Unauthorized("Invalid Role"));
    }
    next();
};

