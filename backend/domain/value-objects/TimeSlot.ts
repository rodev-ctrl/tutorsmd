// domain/value-objects/TimeSlot.ts

export class TimeSlot {
  private readonly _dateTime: Date;

  constructor(dateTime: Date) {
    if (!(dateTime instanceof Date) || isNaN(dateTime.getTime())) {
      throw new Error('Invalid date time');
    }
    this._dateTime = dateTime;
  }

  isPast(): boolean {
    return this._dateTime.getTime() < Date.now();
  }

  isFuture(): boolean {
    return this._dateTime.getTime() > Date.now();
  }

  isLessThan24HoursAway(): boolean {
    const diff = this._dateTime.getTime() - Date.now();
    return diff < 24 * 60 * 60 * 1000 && diff > 0;
  }

  isAtLeast24HoursAway(): boolean {
    const diff = this._dateTime.getTime() - Date.now();
    return diff >= 24 * 60 * 60 * 1000;
  }

  get dateTime(): Date {
    return new Date(this._dateTime);
  }

  equals(other: TimeSlot): boolean {
    return this._dateTime.getTime() === other._dateTime.getTime();
  }

  toString(): string {
    return this._dateTime.toISOString();
  }
}