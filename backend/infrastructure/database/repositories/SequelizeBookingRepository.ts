// infrastructure/database/repositories/SequelizeBookingRepository.ts

import { IBookingRepository } from '../../../domain/repositories/InterfaceBookingRepository';
import { Booking } from '../../../domain/entities/Booking';
import { TimeSlot } from '../../../domain/value-objects/TimeSlot';
import BookingModel from '../models/bookingModel';
import { Op } from 'sequelize';

export class SequelizeBookingRepository implements IBookingRepository {
  
  async findById(id: string): Promise<Booking | null> {
    const record = await BookingModel.findOne({ where: { lessonid: id } });
    
    if (!record) return null;
    
    return this.toDomain(record);
  }

  async findByClient(clientId: number): Promise<Booking[]> {
    const records = await BookingModel.findAll({ where: { clientid: clientId } });
    
    return records.map(r => this.toDomain(r));
  }

  async findByTutor(tutorEmail: string): Promise<Booking[]> {
    const records = await BookingModel.findAll({ where: { tutoremail: tutorEmail } });
    
    return records.map(r => this.toDomain(r));
  }

  async existsByClientAndTutor(
    clientId: number,
    tutorEmail: string,
    dateTime: Date
  ): Promise<boolean> {
    const count = await BookingModel.count({
      where: {
        clientid: clientId,
        tutoremail: tutorEmail,
        datetime: dateTime
      }
    });
    
    return count > 0;
  }

  async create(booking: Booking): Promise<void> {
    await BookingModel.create({
      lessonid: booking.id,
      clientid: booking.clientId,
      tutoremail: booking.tutorEmail,
      datetime: booking.dateTime,
      status: booking.status
    });
  }

  async save(booking: Booking): Promise<void> {
    await BookingModel.update(
      {
        status: booking.status,
        datetime: booking.dateTime
      },
      { where: { lessonid: booking.id } }
    );
  }

  async delete(id: string): Promise<void> {
    await BookingModel.destroy({ where: { lessonid: id } });
  }

  private toDomain(record: any): Booking {
    const timeSlot = new TimeSlot(new Date(record.datetime));
    
    return new Booking(
      record.lessonid,
      record.clientid,
      record.tutoremail,
      timeSlot,
      record.status
    );
  }
}