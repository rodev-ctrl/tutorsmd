// domain/repositories/ITokenRepository.ts

export interface ITokenRepository {
  // Сохранить refresh token
  save(userId: number, refreshToken: string, deviceId: string, role: 'client' | 'tutor'): Promise<void>;
  
  // Найти refresh token
  findByDeviceId(deviceId: string, role: 'client' | 'tutor'): Promise<string | null>;
  
  // Проверить существование токена
  exists(deviceId: string, role: 'client' | 'tutor'): Promise<boolean>;
  
  // Удалить токен
  remove(deviceId: string, role: 'client' | 'tutor'): Promise<void>;
  
  // Удалить все токены пользователя
  removeAllByUserId(userId: number, role: 'client' | 'tutor'): Promise<void>;
}