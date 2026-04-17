

import { TimeSlot } from '../value-objects/TimeSlot';

export type BookingStatus = 'process' | 'cancelled' | 'completed';

export class Booking {
  constructor(
    public readonly id: string,
    public readonly clientId: number,
    public readonly tutorEmail: string,
    private _timeSlot: TimeSlot,
    private _status: BookingStatus
  ) {}

  // ============ БИЗНЕС-ЛОГИКА ============

  cancel(): void {
    if (this._status === 'completed') {
      throw new Error('Cannot cancel completed booking');
    }

    if (this._status === 'cancelled') {
      throw new Error('Booking already cancelled');
    }

    if (this._timeSlot.isLessThan24HoursAway()) {
      throw new Error('Cannot cancel less than 24 hours before lesson');
    }

    this._status = 'cancelled';
  }

  complete(): void {
    if (this._status === 'cancelled') {
      throw new Error('Cannot complete cancelled booking');
    }

    if (this._status === 'completed') {
      throw new Error('Booking already completed');
    }

    if (!this._timeSlot.isPast()) {
      throw new Error('Cannot complete future booking');
    }

    this._status = 'completed';
  }

  // ============ ПРОВЕРКИ ============

  canBeCancelled(): boolean {
    return (
      this._status !== 'completed' &&
      this._status !== 'cancelled' &&
      !this._timeSlot.isLessThan24HoursAway()
    );
  }

  canBeCompleted(): boolean {
    return (
      this._status !== 'cancelled' &&
      this._status !== 'completed' &&
      this._timeSlot.isPast()
    );
  }

  isActive(): boolean {
    return this._status === 'process';
  }

  // ============ GETTERS ============

  get timeSlot(): TimeSlot {
    return this._timeSlot;
  }

  get status(): BookingStatus {
    return this._status;
  }

  get dateTime(): Date {
    return this._timeSlot.dateTime;
  }

  // ============ FACTORY METHOD ============

  static create(
    id: string,
    clientId: number,
    tutorEmail: string,
    dateTime: Date
  ): Booking {
    const timeSlot = new TimeSlot(dateTime);

    // Валидация при создании
    if (timeSlot.isPast()) {
      throw new Error('Cannot book time slot in the past');
    }

    if (!timeSlot.isAtLeast24HoursAway()) {
      throw new Error('Must book at least 24 hours in advance');
    }

    return new Booking(id, clientId, tutorEmail, timeSlot, 'process');
  }
}
