import { PrismaClient } from '../../../../generated/prisma';
import { IClientRepository } from '../../../domain/repositories/IClientRepository';
import { Client } from '../../../domain/entities/Client';

export class PrismaClientRepository implements IClientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Client | null> {
    const record = await this.prisma.client.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUserId(userId: string): Promise<Client | null> {
    const record = await this.prisma.client.findUnique({ where: { userId } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async create(client: Client): Promise<void> {
    await this.prisma.client.create({
      data: {
        id: client.id,
        userId: client.userId,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
    });
  }

  async save(client: Client): Promise<void> {
    await this.prisma.client.update({
      where: { id: client.id },
      data: {
        updatedAt: client.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.delete({ where: { id } });
  }

  private toDomain(record: any): Client {
    return Client.restore({
      id: record.id,
      userId: record.userId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}