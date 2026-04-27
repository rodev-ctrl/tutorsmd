import { IProfileCreator } from '../../application/ports/IProfileCreator';
import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { Client } from '../../domain/entities/Client';

export class ClientProfileCreator implements IProfileCreator {
  readonly role = 'client' as const;
  
  constructor(private readonly clientRepo: IClientRepository) {}

  async createProfile(userId: string, profileId: string): Promise<void> {
    const client = Client.create({ id: profileId, userId });
    await this.clientRepo.create(client);
  }
}