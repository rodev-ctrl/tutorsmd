import { DomainError } from '../errors/DomainError';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class UserId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainError('UserId cannot be empty');
    }
    if (!UUID_REGEX.test(value)) {
      throw new DomainError('UserId must be a valid UUID v4');
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}