import { PrismaClient } from '@prisma/client';
import { IUserRepository, OAuthLinkData } from '../../../domain/repositories/IUserRepository';
import { User, Role, AuthProvider } from '../../../domain/entities/User';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: true, oauthProvider: true },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: { userRoles: true, oauthProvider: true },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUsername(username: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { username },
      include: { userRoles: true, oauthProvider: true },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByOAuthProvider(provider: string, providerId: string): Promise<User | null> {
    const link = await this.prisma.oAuthProvider.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: { include: { userRoles: true, oauthProvider: true } } },
    });
    if (!link) return null;
    return this.toDomain(link.user);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { username } });
    return count > 0;
  }

  async create(user: User, oauth?: OAuthLinkData): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        username: user.username,
        passwordHash: user.passwordHash,
        authProvider: user.authProvider,
        avatarUrl: user.avatarUrl,
        timezone: user.timezone,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        userRoles: {
          create: user.roles.map(role => ({ role })),
        },
        ...(oauth && {
          oauthProvider: {
            create: {
              provider: oauth.provider,
              providerId: oauth.providerId,
              email: oauth.email,
            },
          },
        }),
      },
    });
  }

  async linkOAuthProvider(userId: string, oauth: OAuthLinkData): Promise<void> {
    await this.prisma.oAuthProvider.create({
      data: {
        userId,
        provider: oauth.provider,
        providerId: oauth.providerId,
        email: oauth.email,
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
        passwordHash: user.passwordHash,
        avatarUrl: user.avatarUrl,
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
    // record.authProvider — это реальная колонка (теперь корректно проставляется
    // в create()); раньше здесь выводили значение из oauthProvider[0], потому что
    // колонка никогда не записывалась — это было обходным путём вокруг бага,
    // не входа reference. Колонка — источник истины, а не связь (пользователь
    // может в будущем привязать несколько провайдеров).
    const authProvider = record.authProvider as AuthProvider;

    return User.restore({
      id: record.id,
      email: record.email,
      name: record.name,
      surname: record.surname,
      username: record.username,
      avatarUrl: record.avatarUrl,
      languageCode: record.languageCode,
      passwordHash: record.passwordHash,
      authProvider,
      roles: record.userRoles.map((r: any) => r.role as Role),
      isEmailVerified: record.isEmailVerified,
      timezone: record.timezone,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}