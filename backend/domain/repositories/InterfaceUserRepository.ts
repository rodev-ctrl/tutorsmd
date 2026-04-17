// domain/repositories/IUserRepository.ts

import { User } from '../entities/User';

export interface IUserRepository {
  // Поиск
  findById(id: number, role: 'client' | 'tutor'): Promise<User | null>;
  findByEmail(email: string, role: 'client' | 'tutor'): Promise<User | null>;
  findByActivationLink(link: string): Promise<User | null>;
  
  // Проверка существования
  existsByEmail(email: string): Promise<boolean>;
  
  // Создание и сохранение
  create(user: User): Promise<void>;
  save(user: User): Promise<void>;
  
  // Удаление
  delete(id: number, role: 'client' | 'tutor'): Promise<void>;
}