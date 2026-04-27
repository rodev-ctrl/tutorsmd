// domain/repositories/IUserRepository.ts
import { User } from '../entities/User';

export interface IUserRepository {
  // Поиск
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;

  // Проверка существования
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;

  // Запись
  create(user: User): Promise<void>;
  save(user: User): Promise<void>;

  // Удаление
  delete(id: string): Promise<void>;
}