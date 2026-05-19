import { LanguageCode, User } from '../../../../domain/entities/User';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IEmailVerificationRepository } from '../../../../domain/repositories/email/IEmailVerificationRepository';
import { IEmailService } from '../../../ports/IEmailService';
import { IUUIDGenerator } from '../../../ports/IUUIDGenerator';
import { IPasswordHasher } from '../../../ports/IPasswordHasher';
import { IUnitOfWork } from '../../../ports/IUnitOfWork';
import { IProfileCreator } from '../../../ports/IProfileCreator';
import { IEmailVerificationTokenFactory } from '../../../ports/email/IEmailVerificationTokenFactory';
import { Password } from '../../../../domain/value-objects/Password';
import { Email } from '../../../../domain/value-objects/Email';
import { DomainError } from '../../../../domain/errors/DomainError';

export interface RegisterUserDto {
  name: string;
  surname: string;
  email: string;
  password: string;
  languageCode?: LanguageCode;
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
    private readonly verificationTokenFactory: IEmailVerificationTokenFactory
  ) {}

  async execute(dto: RegisterUserDto): Promise<void> {
    Password.validate(dto.password);
    Email.create(dto.email);

    const exists = await this.userRepo.existsByEmail(dto.email);
    if (exists) throw new DomainError('Email already in use');

    const userId    = this.idGenerator.generate();
    const profileId = this.idGenerator.generate();
    const username  = await this.generateUniqueUsername(dto.name, dto.surname);

    const hashedPassword = await this.passwordHasher.hash(dto.password);

    // SHA-256 через фабрику — не Argon2
    const verificationToken = this.verificationTokenFactory.generateVerificationToken();

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
      languageCode: dto.languageCode
    });

    await this.unitOfWork.run(async () => {
      await this.userRepo.create(user);
      // Create user/tutor
      await this.profileCreator.createProfile(userId, profileId);
      await this.emailVerificationRepo.upsert({
        userId,
        tokenHash: verificationToken.hash, // SHA-256 hash в БД
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    });

    const link = `${process.env.CLIENT_URL}/activate/${verificationToken.raw}`;
    await this.emailService.sendActivationLink(user.email, link, user.languageCode);
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