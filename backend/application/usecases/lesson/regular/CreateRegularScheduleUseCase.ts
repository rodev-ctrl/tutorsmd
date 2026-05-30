import { Lesson } from '../../../../domain/entities/Lesson';
import { RegularSchedule } from '../../../../domain/entities/RegularSchedule';
import { IRegularScheduleRepository } from '../../../../domain/repositories/lesson/IRegularScheduleRepository';
import { ILessonRepository } from '../../../../domain/repositories/lesson/ILessonRepository';
import { IClientRepository } from '../../../../domain/repositories/IClientRepository';
import { ITutorRepository } from '../../../../domain/repositories/ITutorRepository';
import { IUnitOfWork } from '../../../ports/IUnitOfWork';
import { IUUIDGenerator } from '../../../ports/IUUIDGenerator';
import { ClientId, TutorId, SubjectId, RecurringScheduleId, LessonId } from '../../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { DomainError } from '../../../../domain/errors/DomainError';
import { ConflictError } from '../../../../domain/errors/ConflictError';

export interface CreateRegularScheduleDto {
  clientId: string;
  tutorId: string;
  subjectId: string;
  dayOfWeek: number;    // 0-6
  timeOfDay: Date;      // только время
  durationMinutes?: number;
  firstLessonAt: Date;  // дата первого урока
}

export interface CreateRegularScheduleResult {
  scheduleId: string;
  firstLessonId: string;
  firstLessonAt: Date;
}

export class CreateRegularScheduleUseCase {
  constructor(
    private readonly scheduleRepo: IRegularScheduleRepository,
    private readonly lessonRepo: ILessonRepository,
    private readonly clientRepo: IClientRepository,
    private readonly tutorRepo: ITutorRepository,
    private readonly unitOfWork: IUnitOfWork,
    private readonly idGenerator: IUUIDGenerator,
  ) {}

  async execute(dto: CreateRegularScheduleDto): Promise<CreateRegularScheduleResult> {
    const clientId = new ClientId(dto.clientId);
    const tutorId = new TutorId(dto.tutorId);
    const subjectId = new SubjectId(dto.subjectId);
    const scheduleId = new RecurringScheduleId(this.idGenerator.generate());
    const firstLessonId = new LessonId(this.idGenerator.generate());

    // 1. Проверяем участников
    const client = await this.clientRepo.findById(clientId.value);
    if (!client) throw new NotFoundError('Client not found');

    const tutor = await this.tutorRepo.findById(tutorId.value);
    if (!tutor) throw new NotFoundError('Tutor not found');
    if (!tutor.isApproved) throw new DomainError('Tutor is not approved');

    // 2. Проверяем что нет активного расписания на это время
    const existing = await this.scheduleRepo.findByClientAndTutor(
      clientId.value,
      tutorId.value,
    );
    const hasActiveOnSameSlot = existing.some(
      s => s.isActive &&
           s.dayOfWeek === dto.dayOfWeek &&
           s.timeOfDay.getHours() === dto.timeOfDay.getHours() &&
           s.timeOfDay.getMinutes() === dto.timeOfDay.getMinutes()
    );
    if (hasActiveOnSameSlot) {
      throw new ConflictError('Active schedule already exists for this time slot');
    }

    // 3. Проверяем конфликт первого урока у тьютора
    const hasConflict = await this.lessonRepo.existsConflict(
      tutorId.value,
      dto.firstLessonAt,
      dto.durationMinutes ?? 60,
    );
    if (hasConflict) {
      throw new ConflictError('First lesson time slot is already taken');
    }

    // 4. Создаём расписание
    const schedule = RegularSchedule.create({
      id: scheduleId.value,
      clientId: clientId.value,
      tutorId: tutorId.value,
      subjectId: subjectId.value,
      dayOfWeek: dto.dayOfWeek,
      timeOfDay: dto.timeOfDay,
      durationMinutes: dto.durationMinutes,
    });

    // 5. Создаём первый урок
    const firstLesson = Lesson.create({
      id: firstLessonId.value,
      clientId: clientId.value,
      tutorId: tutorId.value,
      subjectId: subjectId.value,
      type: 'regular',
      scheduledAt: dto.firstLessonAt,
      durationMinutes: dto.durationMinutes,
      recurringScheduleId: scheduleId.value,
    });


    await this.unitOfWork.run(async () => {
      await this.scheduleRepo.create(schedule);
      await this.lessonRepo.create(firstLesson);
    });

    return {
      scheduleId: schedule.id,
      firstLessonId: firstLesson.id,
      firstLessonAt: firstLesson.scheduledAt,
    };
  }
}