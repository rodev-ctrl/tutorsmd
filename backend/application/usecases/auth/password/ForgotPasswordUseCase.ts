import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IEmailService } from '../../../ports/IEmailService';
import { IUUIDGenerator } from '../../../ports/IUUIDGenerator';
import { IPasswordResetRepository } from '../../../../domain/repositories/IPasswordResetRepository';
import { RefreshToken } from '../../../../domain/value-objects/RefreshToken';

export interface ForgotPasswordDto {
  email: string;
}

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordResetRepo: IPasswordResetRepository,
    private readonly emailService: IEmailService,
    private readonly idGenerator: IUUIDGenerator,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    // 1. Найти юзера
    // Не бросаем ошибку если юзер не найден — защита от email enumeration
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) return; // тихий возврат

    // 2. OAuth юзер не может сбросить пароль
    if (user.isOAuthUser()) return; // тихий возврат

    // 3. Генерация токена сброса
    const resetToken = this.idGenerator.generate();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    const tokenHash = RefreshToken.fromRaw(resetToken).hash;
    // 4. Сохранить токен (upsert — один активный токен на юзера)
    await this.passwordResetRepo.upsert({
      userId: user.id,
      link: tokenHash,
      expiresAt,
    });


    // 5. Отправить письмо
    const link = `${process.env.CLIENT_URL}/password/reset/${resetToken}`;
    await this.emailService.sendPasswordResetLink(dto.email, link);
  }
}