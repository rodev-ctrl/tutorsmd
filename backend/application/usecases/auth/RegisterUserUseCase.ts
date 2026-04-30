import { User } from '../../../domain/entities/User';
import { Client } from '../../../domain/entities/Client';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IClientRepository } from '../../../domain/repositories/IClientRepository';
import { IEmailVerificationRepository } from '../../../domain/repositories/IEmailVerificationRepository';
import { IEmailService } from '../../ports/IEmailService';
import { IUUIDGenerator } from '../../ports/IUUIDGenerator';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import { IUnitOfWork } from '../../ports/IUnitOfWork';
import { IProfileCreator } from '../../ports/IProfileCreator';
import { Password } from '../../../domain/value-objects/Password';
import { Email } from '../../../domain/value-objects/Email'
import { DomainError } from '../../../domain/errors/DomainError';

export interface RegisterUserDto {
  name: string;
  surname: string;
  email: string;
  password: string;
  timezone?: string;
}
export class RegisterUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly profileCreator: IProfileCreator,
    private readonly emailVerificationRepo: IEmailVerificationRepository,
    private readonly emailService: IEmailService,
    private readonly idGenerator: IUUIDGenerator,
    private readonly passwordHasher: IPasswordHasher,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: RegisterUserDto): Promise<void> {
    // 1. Валидация пароля
    Password.validate(dto.password);
    Email.

    // 2. Проверка уникальности email
    const exists = await this.userRepo.existsByEmail(dto.email);
    if (exists) throw new DomainError('Email already in use');

    // 3. Подготовка данных до транзакции — дорогие операции вне транзакции
    const userId = this.idGenerator.generate();
    const profileId = this.idGenerator.generate();
    const verificationToken = this.idGenerator.generate();
    const username = await this.generateUniqueUsername(dto.name, dto.surname);
    const hashedPassword = await this.passwordHasher.hash(dto.password);

    // 4. Создание User entity — роль берётся из profileCreator
    const user = User.create({
      id: userId,
      name: dto.name,
      surname: dto.surname,
      username,
      email: dto.email,
      hashedPassword,
      authProvider: 'local',
      roles: [this.profileCreator.role],
      timezone: dto.timezone ?? 'UTC',
    });

    // 5. Атомарное сохранение в БД
    await this.unitOfWork.run(async () => {
      await this.userRepo.create(user);
      await this.profileCreator.createProfile(userId, profileId);
      await this.emailVerificationRepo.upsert({
        userId,
        link: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
      });
    });

    // 6. Email вне транзакции — side effect
    // Если письмо не дошло — юзер может запросить повторно
    const link = `${process.env.CLIENT_URL}/activate/${verificationToken}`;
    await this.emailService.sendActivationLink(dto.email, link);
  }

  private async generateUniqueUsername(name: string, surname: string): Promise<string> {
    const base = `${name[0]}${surname[0]}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const candidate = `${base}_${this.idGenerator.generate().slice(0, 6)}`;

    const taken = await this.userRepo.existsByUsername(candidate);
    if (taken) return this.generateUniqueUsername(name, surname);

    return candidate;
  }
}