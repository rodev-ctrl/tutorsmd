// application/usecases/auth/RegisterClientUseCase.ts

import { User } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/InterfaceUserRepository';
import { IEmailService } from '../../ports/IEmailService';
import { IUUIdGenerator } from '../../ports/IUUIDGenerator';
import { IPasswordHasher } from '../../ports/IPasswordHasher';


export class RegisterClientUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly idGenerator: IUUIdGenerator,  // ← инъекция
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(
    name: string,
    surname: string,
    email: string,
    password: string
  ): Promise<void> {
    if (password.length < 8) throw new Error('Password too short');

    const exists = await this.userRepo.existsByEmail(email);
    if (exists) throw new Error('Email already in use');

    // ✅ Используем через интерфейс
    const activationLink = this.idGenerator.generate();
    const baseUsername = `${name[0]}.${surname[0]}`.toLowerCase();
    const username = `${baseUsername}.${this.idGenerator.generate().slice(0, 6)}`;

        // 3. ХЕШИРОВАНИЕ в Use Case
    const hashedPassword = await this.passwordHasher.hash(password);

    const user = await User.create(
      name,
      surname,
      email,
      hashedPassword,
      'client',
      activationLink,
      username
    );

    await this.userRepo.create(user);
    await this.emailService.sendActivationLink(
      email,
      `${process.env.URL}/activate/${activationLink}`
    );
  }
}