import { ILessonRepository } from '../../../domain/repositories/lesson/ILessonRepository';
import { Lesson } from '../../../domain/entities/Lesson';

export interface GetUserLessonsDto {
  profileId: string;
  role: 'client' | 'tutor' | 'admin';
}

export class GetUserLessonsUseCase {
  constructor(private readonly lessonRepo: ILessonRepository) {}

  async execute(dto: GetUserLessonsDto): Promise<Lesson[]> {
    return this.lessonRepo.findMany(
      dto.role === 'client'
        ? { clientId: dto.profileId }
        : dto.role === 'tutor'
        ? { tutorId: dto.profileId }
        : {}
    );
  }
}