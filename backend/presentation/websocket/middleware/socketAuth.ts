import { Socket } from 'socket.io';
import { ITokenService } from '../../../application/ports/ITokenService';

export const socketAuthMiddleware = (tokenService: ITokenService) => {
  return async (socket: Socket, next: (err?: Error) => void) => {
    try {
      console.log('=== SOCKET AUTH CHECK START ===');

      // 1. Получаем токен
      const token = 
        socket.request.headers.cookie?.match(/refreshToken=([^;]+)/)?.[1] ||
        socket.handshake.auth.userToken;

      if (!token) {
        console.log('No token found');
        return next(new Error('Unauthorized: No token'));
      }

      // 2. Валидируем токен (через DI)
      const user = tokenService.validateRefreshToken(token);

      if (!user) {
        console.log('Invalid token');
        return next(new Error('Unauthorized: Invalid User'));
      }

      console.log('User verified:', user);

      // 3. Сохраняем данные пользователя в socket
      socket.data.user = {
        id: user.id,
        deviceId: user.deviceId,
        role: user.role
      };

      next();
    } catch (err) {
      console.error('Middleware error:', err);
      next(new Error('Authentication error'));
    }
  };
};