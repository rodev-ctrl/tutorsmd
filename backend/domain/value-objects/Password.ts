import { DomainError } from '../errors/DomainError';

export class Password {
  static readonly MIN_LENGTH = 15;
  static readonly MAX_LENGTH = 64;

  private readonly value: string;

  private constructor(plain: string) {
    this.value = plain;
  }

  static validate(plain: string): Password {

    if (!plain || plain.trim().length === 0) {
      throw new DomainError('Password cannot be empty');
    }

    // Длина считается по оригиналу — пробелы внутри разрешены по OWASP
    if (plain.length < Password.MIN_LENGTH) {
      throw new DomainError(
        `Password must be at least ${Password.MIN_LENGTH} characters`
      );
    }

    if (plain.length > Password.MAX_LENGTH) {
      throw new DomainError(
        `Password must be at most ${Password.MAX_LENGTH} characters`
      );
    }

    // 4. Новый стандарт — Argon2id принимает любые символы, ограничений нет
    return new Password(plain);
  }

  getValue(): string {
    return this.value;
  }
}