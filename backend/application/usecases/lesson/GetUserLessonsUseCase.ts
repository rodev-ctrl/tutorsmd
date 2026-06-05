import { ILessonRepository } from '../../../domain/repositories/lesson/ILessonRepository';

export interface GetUserLessonsDto {
  profileId: string;
  role: 'client' | 'tutor' | 'admin';
}

export class GetUserLessonsUseCase {
  constructor(private readonly lessonRepo: ILessonRepository) {}

  async execute(dto: GetUserLessonsDto) {
    const lessons = await this.lessonRepo.findMany(
      dto.role === 'client'
        ? { clientId: dto.profileId }
        : dto.role === 'tutor'
        ? { tutorId: dto.profileId }
        : {}
    );

    return lessons.map(l => ({
      id:                  l.id,
      clientId:            l.clientId,
      tutorId:             l.tutorId,
      subjectId:           l.subjectId,
      type:                l.type,
      status:              l.status,
      scheduledAt:         l.scheduledAt,
      durationMinutes:     l.durationMinutes,
      recurringScheduleId: l.recurringScheduleId,
      rescheduledFromId:   l.rescheduledFromId,
      roomId:              l.roomId,
      cancellationReason:  l.cancellationReason,
      proposedScheduledAt: l.proposedScheduledAt,
      proposedExpiresAt:   l.proposedExpiresAt,
      startedAt:           l.startedAt,
      completedAt:         l.completedAt,
      createdAt:           l.createdAt,
      updatedAt:           l.updatedAt,
    }));
  }
}