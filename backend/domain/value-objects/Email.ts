import { DomainError } from '../errors/DomainError';

// RFC 5321 — максимальная длина email
const MAX_LENGTH = 254;
// Локальная часть (до @) — максимум 64 символа по RFC 5321
const MAX_LOCAL_LENGTH = 64;


const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export class Email {
  private readonly _value: string;

  private constructor(email: string) {
    this._value = email;
  }

  // Фабричный метод — валидирует и создаёт
  static create(raw: string): Email {
    if (!raw || raw.trim().length === 0) {
      throw new DomainError('Email cannot be empty');
    }

    const normalized = raw.toLowerCase().trim();

    if (normalized.length > MAX_LENGTH) {
      throw new DomainError(`Email must not exceed ${MAX_LENGTH} characters`);
    }

    const [local] = normalized.split('@');
    if (local && local.length > MAX_LOCAL_LENGTH) {
      throw new DomainError(`Email local part must not exceed ${MAX_LOCAL_LENGTH} characters`);
    }

    if (!EMAIL_REGEX.test(normalized)) {
      throw new DomainError('Invalid email format');
    }

    // Защита от consecutive dots (test..email@domain.com)
    if (normalized.includes('..')) {
      throw new DomainError('Invalid email format');
    }

    return new Email(normalized);
  }

  static fromPersistence(raw: string): Email {
    return new Email(raw);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}