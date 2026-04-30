// domain/value-objects/Password.ts
import { DomainError } from '../errors/DomainError';

export class Password {
  static readonly MIN_LENGTH = 15;
  static readonly MAX_LENGTH = 64;

  private readonly value: string;

  private constructor(plain: string) {
    this.value = plain;
  }

  static validate(plain: string): Password {
    // Только проверка на полностью пустую строку — пробелы внутри разрешены по OWASP
    if (!plain || plain.trim().length === 0) {
      throw new DomainError('Password cannot be empty');
    }
    // Длина считается по оригиналу без trim
    if (plain.length < Password.MIN_LENGTH) {
      throw new DomainError(
        `Password must be at least ${Password.MIN_LENGTH} characters`
      );
    }
    // Защита от DoS на Argon2 — максимум 64 символа
    if (plain.length > Password.MAX_LENGTH) {
      throw new DomainError(
        `Password must be at most ${Password.MAX_LENGTH} characters`
      );
    }
    // OWASP: не требуем состав символов (заглавные, цифры, спецсимволы)
    // Длина важнее состава

    return new Password(plain);
  }

  getValue(): string {
    return this.value;
  }
}