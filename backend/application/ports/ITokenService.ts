export interface TokenPayload {
  id: number;
  email: string;
  role: 'client' | 'tutor' | 'admin';
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

export interface ITokenService {
  // Генерация токенов
  generateTokens(payload: TokenPayload): GeneratedTokens;
  
  // Валидация токенов
  validateAccessToken(token: string): TokenPayload | null;
  validateRefreshToken(token: string): (TokenPayload & { deviceId: string }) | null;
}