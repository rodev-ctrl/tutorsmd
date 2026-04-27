// infrastructure/database/repositories/PrismaUserRepository.ts

import { PrismaClient } from '../../../../generated/prisma';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User, Role, AuthProvider } from '../../../domain/entities/User';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: true },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: { userRoles: true },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUsername(username: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { username },
      include: { userRoles: true },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { username } });
    return count > 0;
  }

  async create(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        username: user.username,
        passwordHash: user.hashedPassword,
        authProvider: user.authProvider,
        timezone: user.timezone,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        userRoles: {
          create: user.roles.map(role => ({ role })),
        },
      },
    });
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        name: user.name,
        surname: user.surname,
        username: user.username,
        passwordHash: user.hashedPassword,
        timezone: user.timezone,
        isEmailVerified: user.isEmailVerified,
        updatedAt: user.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toDomain(record: any): User {
    return User.restore({
      id: record.id,
      email: record.email,
      name: record.name,
      surname: record.surname,
      username: record.username,
      hashedPassword: record.passwordHash,
      authProvider: record.authProvider as AuthProvider,
      roles: record.userRoles.map((r: any) => r.role as Role),
      isEmailVerified: record.isEmailVerified,
      timezone: record.timezone,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}