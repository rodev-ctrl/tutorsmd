// domain/repositories/IBookingRepository.ts

import { Booking } from '../entities/Booking';

export interface IBookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByClient(clientId: number): Promise<Booking[]>;
  findByTutor(tutorEmail: string): Promise<Booking[]>;
  existsByClientAndTutor(clientId: number, tutorEmail: string, dateTime: Date): Promise<boolean>;
  create(booking: Booking): Promise<void>;
  save(booking: Booking): Promise<void>;
  delete(id: string): Promise<void>;
}