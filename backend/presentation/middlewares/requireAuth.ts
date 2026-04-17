import { RequestHandler } from "express";
import { ITokenService } from "../../application/ports/ITokenService";
import ApiError from "../../domain/errors/apiError";

export const requireAuth = (tokenService: ITokenService): RequestHandler => {
  return async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next(ApiError.Unauthorized("No valid AccessToken"));
    }

    const accessToken = authHeader.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);

    if (!userData) {
      return next(ApiError.Unauthorized("Invalid AccessToken"));
    }

    req.user = userData; // теперь тип совпадает
    return next();
  } catch {
    return next(ApiError.Unauthorized("Session not found"));
  }
}
};

