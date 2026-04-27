// domain/repositories/IClientRepository.ts
import { Client } from '../entities/Client';

export interface IClientRepository {
  findById(id: string): Promise<Client | null>;
  findByUserId(userId: string): Promise<Client | null>;

  create(client: Client): Promise<void>;
  save(client: Client): Promise<void>;

  delete(id: string): Promise<void>;
}