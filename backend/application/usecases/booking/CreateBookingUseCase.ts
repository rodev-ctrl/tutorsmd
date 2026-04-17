import { Booking } from '../../../domain/entities/Booking';
import { IBookingRepository } from '../../../domain/repositories/InterfaceBookingRepository';
import { IUserRepository } from '../../../domain/repositories/InterfaceUserRepository';
import { IUUIdGenerator } from '../../ports/IUUIDGenerator';

export class CreateBookingUseCase {
  constructor(
    private readonly bookingRepo: IBookingRepository,
    private readonly userRepo: IUserRepository,
    private readonly idGenerator: IUUIdGenerator  // ← добавили
  ) {}

  async create(
    clientId: number,
    tutorEmail: string,
    dateTime: Date
  ): Promise<{ booking: Booking }> {
    const client = await this.userRepo.findById(clientId, 'client');
    if (!client) throw new Error('Client not found');

    const tutor = await this.userRepo.findByEmail(tutorEmail, 'tutor');
    if (!tutor) throw new Error('Tutor not found');

    const exists = await this.bookingRepo.existsByClientAndTutor(
      clientId,
      tutorEmail,
      dateTime
    );
    if (exists) throw new Error('Booking already exists');

    const bookingId = this.idGenerator.generate();
    const booking = Booking.create(bookingId, clientId, tutorEmail, dateTime);

    await this.bookingRepo.create(booking);

    return { booking: booking };
  }
}