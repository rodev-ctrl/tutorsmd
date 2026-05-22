import { Socket } from "socket.io";
import { IAccessTokenFactory } from "../../../application/ports/token/IAccessTokenFactory";

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const socketAuthMiddleware = (
  accessTokenFactory: IAccessTokenFactory
): SocketMiddleware => {
  return (socket: Socket, next: (err?: Error) => void): void => {
    const token = socket.handshake.auth.accessToken as string | undefined;

    if (!token) {
      return next(new Error("Unauthorized: No token"));
    }

    const payload = accessTokenFactory.verify(token);

    if (!payload) {
      return next(new Error("Unauthorized: Invalid token"));
    }

    socket.data.user = {
      id: payload.userId,
      activeRole: payload.activeRole,
    };

    next();
  };
};