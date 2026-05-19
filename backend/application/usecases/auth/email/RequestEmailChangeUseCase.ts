// application/usecases/auth/email/RequestEmailChangeUseCase.ts
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IEmailChangeRepository } from '../../../../domain/repositories/email/IEmailChangeRepository';
import { IEmailService } from '../../../ports/IEmailService';
import { IPasswordHasher } from '../../../ports/IPasswordHasher';
import { Email } from '../../../../domain/value-objects/Email';
import { DomainError } from '../../../../domain/errors/DomainError';
import { ConflictError } from '../../../../domain/errors/ConflictError';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { IEmailChangeTokenFactory } from '../../../ports/email/IEmailChangeTokenFactory';

export interface RequestEmailChangeDto {
  userId: string;
  newEmail: string;
  password: string;
}

export class RequestEmailChangeUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailChangeRepo: IEmailChangeRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly emailService: IEmailService,
    private readonly tokenFactory: IEmailChangeTokenFactory,
  ) {}

  async execute(dto: RequestEmailChangeDto): Promise<void> {
    const newEmailVO = Email.create(dto.newEmail);

    const user = await this.userRepo.findById(dto.userId);
    if (!user) throw new NotFoundError('User not found');

    if (user.isOAuthUser()) {
      throw new DomainError('OAuth users cannot change email this way');
    }

    // Проверка пароля — обязательна для смены email
    const isValid = await this.passwordHasher.compare(dto.password, user.hashedPassword!);
    if (!isValid) throw new DomainError('Incorrect password');

    if (user.email === newEmailVO.value) {
      throw new DomainError('New email is the same as current');
    }

    const taken = await this.userRepo.existsByEmail(newEmailVO.value);
    if (taken) throw new ConflictError('Email already in use');

    const { raw, hash } = this.tokenFactory.generateEmailChangeToken();

    await this.emailChangeRepo.upsert({
      userId: dto.userId,
      newEmail: newEmailVO.value,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 часов
    });

    const link = `${process.env.CLIENT_URL}/email/change/${raw}`;
    await this.emailService.sendEmailChangeConfirmation(newEmailVO.value, link, user.languageCode);
  }
}