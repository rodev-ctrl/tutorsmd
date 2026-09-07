// domain/repositories/IUserRepository.ts
import { User } from '../entities/User';

export interface OAuthLinkData {
  provider:   string;   // 'google' | 'github' — совпадает с User.authProvider
  providerId: string;   // 'sub' у Google — стабильный ID аккаунта у провайдера
  email:      string | null;
}

export interface IUserRepository {
  // Поиск
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  // Возвращающийся OAuth-пользователь — ищем по связке (provider, providerId),
  // а не по email, т.к. email у провайдера может отличаться/меняться.
  findByOAuthProvider(provider: string, providerId: string): Promise<User | null>;

  // Проверка существования
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;

  // Запись. oauth — опционально: передаётся только когда создаём/логиним через
  // провайдера, тогда репозиторий атомарно создаёт ещё и запись в oauth_providers.
  create(user: User, oauth?: OAuthLinkData): Promise<void>;
  save(user: User): Promise<void>;
  // Привязка провайдера к УЖЕ существующему локальному аккаунту (тот же email,
  // подтверждённый провайдером) — отдельно от create, чтобы не пересоздавать User.
  linkOAuthProvider(userId: string, oauth: OAuthLinkData): Promise<void>;

  // Удаление
  delete(id: string): Promise<void>;
}