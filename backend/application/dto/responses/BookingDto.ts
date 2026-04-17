// application/dto/responses/BookingDto.ts

import { Booking } from '../../../domain/entities/Booking';

export class BookingDto {
  readonly id: string;
  readonly clientId: number;
  readonly tutorEmail: string;
  readonly dateTime: string;
  readonly status: string;

  constructor(booking: Booking) {
    this.id = booking.id;
    this.clientId = booking.clientId;
    this.tutorEmail = booking.tutorEmail;
    this.dateTime = booking.dateTime.toISOString();
    this.status = booking.status;
  }

  static fromArray(bookings: Booking[]): BookingDto[] {
    return bookings.map(b => new BookingDto(b));
  }
}
