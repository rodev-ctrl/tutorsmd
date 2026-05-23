import { Prisma, PrismaClient } from '../../../generated/prisma';
import { IAvailableSlotRepository } from '../../../domain/repositories/IAvailableSlotRepository';
import { AvailableSlot } from '../../../domain/entities/AvailableSlot';

type AvailableSlotRecord = Prisma.AvailableSlotGetPayload<{}>;

export class PrismaAvailableSlotRepository implements IAvailableSlotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<AvailableSlot | null> {
    const record = await this.prisma.availableSlot.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByTutorId(tutorId: string, onlyActive = true): Promise<AvailableSlot[]> {
    const records = await this.prisma.availableSlot.findMany({
      where: {
        tutorId,
        ...(onlyActive && { isActive: true }),
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return records.map(r => this.toDomain(r));
  }

  async existsConflict(
    tutorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<boolean> {
    // Ищем слоты которые пересекаются с новым временем
    // Пересечение: существующий startTime < новый endTime
    //          И существующий endTime > новый startTime
    const conflict = await this.prisma.availableSlot.findFirst({
      where: {
        tutorId,
        dayOfWeek,
        isActive: true,
        ...(excludeId && { id: { not: excludeId } }),
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
      select: { id: true },
    });
    return conflict !== null;
  }

  async create(slot: AvailableSlot): Promise<void> {
    await this.prisma.availableSlot.create({
      data: {
        id: slot.id,
        tutorId: slot.tutorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive,
        createdAt: slot.createdAt,
      },
    });
  }

  async save(slot: AvailableSlot): Promise<void> {
    await this.prisma.availableSlot.update({
      where: { id: slot.id },
      data: {
        isActive: slot.isActive,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.availableSlot.delete({ where: { id } });
  }

  private toDomain(record: AvailableSlotRecord): AvailableSlot {
    return AvailableSlot.restore({
      id: record.id,
      tutorId: record.tutorId,
      dayOfWeek: record.dayOfWeek,
      startTime: record.startTime,
      endTime: record.endTime,
      isActive: record.isActive,
      createdAt: record.createdAt,
    });
  }
}