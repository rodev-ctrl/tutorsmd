import { Prisma, PrismaClient } from '../../../../generated/prisma';
import { IRegularScheduleRepository } from '../../../../domain/repositories/lesson/IRegularScheduleRepository';
import { RegularSchedule, CancelledByRole } from '../../../../domain/entities/RegularSchedule';

type ScheduleRecord = Prisma.RegularScheduleGetPayload<{}>;

export class PrismaRegularScheduleRepository implements IRegularScheduleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<RegularSchedule | null> {
    const record = await this.prisma.regularSchedule.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByClientAndTutor(
    clientId: string,
    tutorId: string,
  ): Promise<RegularSchedule[]> {
    const records = await this.prisma.regularSchedule.findMany({
      where: { clientId, tutorId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toDomain(r));
  }

  async findActiveByTutor(tutorId: string): Promise<RegularSchedule[]> {
    const records = await this.prisma.regularSchedule.findMany({
      where:   { tutorId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });
    return records.map(r => this.toDomain(r));
  }

  async findActiveByClient(clientId: string): Promise<RegularSchedule[]> {
    const records = await this.prisma.regularSchedule.findMany({
      where:   { clientId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });
    return records.map(r => this.toDomain(r));
  }

  async create(schedule: RegularSchedule): Promise<void> {
    await this.prisma.regularSchedule.create({
      data: {
        id:              schedule.id,
        clientId:        schedule.clientId,
        tutorId:         schedule.tutorId,
        subjectId:       schedule.subjectId,
        dayOfWeek:       schedule.dayOfWeek,
        timeOfDay:       schedule.timeOfDay,
        durationMinutes: schedule.durationMinutes,
        isActive:        schedule.isActive,
        cancelledAt:     schedule.cancelledAt,
        cancelledBy:     schedule.cancelledBy,
        createdAt:       schedule.createdAt,
        updatedAt:       schedule.updatedAt,
      },
    });
  }

  async save(schedule: RegularSchedule): Promise<void> {
    await this.prisma.regularSchedule.update({
      where: { id: schedule.id },
      data: {
        isActive:    schedule.isActive,
        cancelledAt: schedule.cancelledAt,
        cancelledBy: schedule.cancelledBy,
        updatedAt:   schedule.updatedAt,
      },
    });
  }

  private toDomain(r: ScheduleRecord): RegularSchedule {
    return RegularSchedule.restore({
      id:              r.id,
      clientId:        r.clientId,
      tutorId:         r.tutorId,
      subjectId:       r.subjectId,
      dayOfWeek:       r.dayOfWeek,
      timeOfDay:       r.timeOfDay,
      durationMinutes: r.durationMinutes,
      isActive:        r.isActive,
      cancelledAt:     r.cancelledAt,
      cancelledBy:     r.cancelledBy as CancelledByRole | null,
      createdAt:       r.createdAt,
      updatedAt:       r.updatedAt,
    });
  }
}