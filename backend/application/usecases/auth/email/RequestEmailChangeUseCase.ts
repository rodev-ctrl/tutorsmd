// application/usecases/auth/email/RequestEmailChangeUseCase.ts
import crypto from 'crypto';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IEmailChangeRepository } from '../../../../domain/repositories/email/IEmailChangeRepository';
import { IEmailService } from '../../../ports/IEmailService';
import { IUUIDGenerator } from '../../../ports/IUUIDGenerator';
import { Email } from '../../../../domain/value-objects/Email';
import { DomainError } from '../../../../domain/errors/DomainError';
import { ConflictError } from '../../../../domain/errors/ConflictError';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { IRefreshTokenFactory } from '../../../ports/token/IRefreshTokenFactory';

export interface RequestEmailChangeDto {
  userId: string;
  newEmail: string;
  password: string;
}

export class RequestEmailChangeUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailChangeRepo: IEmailChangeRepository,
    private readonly emailService: IEmailService,
    private readonly idGenerator: IUUIDGenerator,
    private readonly tokenFactory: IRefreshTokenFactory,
  ) {}

  async execute(dto: RequestEmailChangeDto): Promise<void> {
    // 1. Валидация нового email через value object
    const newEmailVO = Email.create(dto.newEmail);

    // 2. Найти юзера
    const user = await this.userRepo.findById(dto.userId);
    if (!user) throw new NotFoundError('User not found');

    // 3. OAuth юзер не может менять email через пароль
    if (user.isOAuthUser()) {
      throw new DomainError('OAuth users cannot change email this way');
    }

    // 4. Новый email не должен совпадать с текущим
    if (user.email === newEmailVO.value) {
      throw new DomainError('New email is the same as current');
    }

    // 5. Новый email должен быть свободен
    const taken = await this.userRepo.existsByEmail(newEmailVO.value);
    if (taken) throw new ConflictError('Email already in use');

    // 6. Генерация токена
    const rawToken = this.idGenerator.generate();
    const linkEmail = this.tokenFactory.fromRaw(rawToken);

    // 7. Сохранить запрос (upsert — один активный на юзера)
    await this.emailChangeRepo.upsert({
      userId: dto.userId,
      newEmail: newEmailVO.value,
      link: linkEmail.hash,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 часов
    });

    // 8. Отправить письмо на НОВЫЙ email
    const link = `${process.env.CLIENT_URL}/email/change/${rawToken}`;
    await this.emailService.sendEmailChangeConfirmation(newEmailVO.value, link, user.languageCode);
  }
}