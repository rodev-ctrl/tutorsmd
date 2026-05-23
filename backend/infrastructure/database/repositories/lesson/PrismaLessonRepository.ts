import { Prisma, PrismaClient } from '../../../../generated/prisma';
import { ILessonRepository, FindLessonsFilter } from '../../../../domain/repositories/lesson/ILessonRepository';
import { Lesson, LessonStatus, LessonType } from '../../../../domain/entities/Lesson';
import { ConflictError } from '../../../../domain/errors/ConflictError';

type LessonRecord = Prisma.LessonGetPayload<{}>;

export class PrismaLessonRepository implements ILessonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Lesson | null> {
    const record = await this.prisma.lesson.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findMany(filter: FindLessonsFilter): Promise<Lesson[]> {
    const records = await this.prisma.lesson.findMany({
      where: {
        ...(filter.clientId && { clientId: filter.clientId }),
        ...(filter.tutorId && { tutorId: filter.tutorId }),
        ...(filter.status && { status: filter.status }),
        ...(filter.type && { type: filter.type }),
        ...(filter.recurringScheduleId && { recurringScheduleId: filter.recurringScheduleId }),
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return records.map(r => this.toDomain(r));
  }

  async existsConflict(
    tutorId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeId?: string,
  ): Promise<boolean> {
    const newStart = scheduledAt;
    const newEnd = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

    // Ищем уроки тьютора которые пересекаются с новым слотом
    const conflict = await this.prisma.lesson.findFirst({
      where: {
        tutorId,
        status: { in: ['pending', 'confirmed', 'in_progress'] },
        ...(excludeId && { id: { not: excludeId } }),
        // Пересечение: существующий урок начался до конца нового
        // И закончился после начала нового
        AND: [
          { scheduledAt: { lt: newEnd } },
          {
            // scheduledAt + durationMinutes > newStart
            // Prisma не умеет считать арифметику дат — используем raw
          },
        ],
      },
      select: { id: true, scheduledAt: true, durationMinutes: true },
    });

    if (!conflict) return false;

    // Проверяем пересечение на уровне приложения
    const existingEnd = new Date(
      conflict.scheduledAt.getTime() + conflict.durationMinutes * 60 * 1000,
    );

    return conflict.scheduledAt < newEnd && existingEnd > newStart;
  }

  async existsActiveTrial(clientId: string, tutorId: string): Promise<boolean> {
    const trial = await this.prisma.lesson.findFirst({
      where: {
        clientId,
        tutorId,
        type: 'trial',
        status: {
          notIn: ['cancelled_by_client', 'cancelled_by_tutor', 'rescheduled'],
        },
      },
      select: { id: true },
    });

    return trial !== null;
  }

  async findLastInSchedule(recurringScheduleId: string): Promise<Lesson | null> {
    const record = await this.prisma.lesson.findFirst({
      where: { recurringScheduleId },
      orderBy: { scheduledAt: 'desc' },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  async create(lesson: Lesson): Promise<void> {
    try {
      await this.prisma.lesson.create({
        data: {
          id: lesson.id,
          clientId: lesson.clientId,
          tutorId: lesson.tutorId,
          subjectId: lesson.subjectId,
          type: lesson.type,
          status: lesson.status,
          scheduledAt: lesson.scheduledAt,
          durationMinutes: lesson.durationMinutes,
          recurringScheduleId: lesson.recurringScheduleId,
          rescheduledFromId: lesson.rescheduledFromId,
          roomId: lesson.roomId,
          cancellationReason: lesson.cancellationReason,
          startedAt: lesson.startedAt,
          completedAt: lesson.completedAt,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
        },
      });
    } catch (err: any) {
      // P2002 — Prisma unique constraint violation
      if (err?.code === 'P2002') {
        throw new ConflictError('Lesson slot conflict detected');
      }
      throw err;
    }
  }

  async save(lesson: Lesson): Promise<void> {
    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        status: lesson.status,
        roomId: lesson.roomId,
        cancellationReason: lesson.cancellationReason,
        proposedScheduledAt: lesson.proposedScheduledAt,
        proposedExpiresAt: lesson.proposedExpiresAt,
        startedAt: lesson.startedAt,
        completedAt: lesson.completedAt,
        updatedAt: lesson.updatedAt,
      },
    });
  }

  private toDomain(record: LessonRecord): Lesson {
    return Lesson.restore({
      id: record.id,
      clientId: record.clientId,
      tutorId: record.tutorId,
      subjectId: record.subjectId,
      type: record.type as LessonType,
      status: record.status as LessonStatus,
      scheduledAt: record.scheduledAt,
      durationMinutes: record.durationMinutes,
      recurringScheduleId: record.recurringScheduleId,
      rescheduledFromId: record.rescheduledFromId,
      roomId: record.roomId,
      cancellationReason: record.cancellationReason,
      proposedScheduledAt: record.proposedScheduledAt,
      proposedExpiresAt: record.proposedExpiresAt,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}