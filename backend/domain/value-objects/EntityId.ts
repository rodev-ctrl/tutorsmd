import { DomainError } from '../errors/DomainError';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class EntityId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainError('Id cannot be empty');
    }
    if (!UUID_REGEX.test(value)) {
      throw new DomainError(`Invalid UUID v7 format: ${value}`);
    }
    this._value = value;
  }

  get value(): string { return this._value; }

  equals(other: EntityId): boolean {
    return this._value === other._value;
  }

  toString(): string { return this._value; }
}

// ─── Производные типы ───────────────────────────────────────

export class UserId extends EntityId {}
export class ClientId extends EntityId {}
export class TutorId extends EntityId {}
export class AdminId extends EntityId {}
export class LessonId extends EntityId {}
export class SubjectId extends EntityId {}
export class ReviewId extends EntityId {}
export class AppealId extends EntityId {}
export class FeedbackId extends EntityId {}
export class QuizId extends EntityId {}
export class QuizQuestionId extends EntityId {}
export class QuizAnswerId extends EntityId {}
export class LessonMaterialId extends EntityId {}
export class RecurringScheduleId extends EntityId {}
export class AvailableSlotId extends EntityId {}