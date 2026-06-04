import { Lesson } from '../../../../domain/entities/Lesson';
import { ILessonRepository } from '../../../../domain/repositories/lesson/ILessonRepository';
import { IClientRepository } from '../../../../domain/repositories/IClientRepository';
import { ITutorRepository } from '../../../../domain/repositories/ITutorRepository';
import { IUnitOfWork } from '../../../ports/IUnitOfWork';
import { IUUIDGenerator } from '../../../ports/IUUIDGenerator';
import { ClientId } from '../../../../domain/value-objects/EntityId';
import { TutorId } from '../../../../domain/value-objects/EntityId';
import { SubjectId } from '../../../../domain/value-objects/EntityId';
import { LessonId } from '../../../../domain/value-objects/EntityId';
import { DomainError } from '../../../../domain/errors/DomainError';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { ConflictError } from '../../../../domain/errors/ConflictError';

export interface CreateTrialLessonDto {
  clientId: string;
  tutorId: string;
  subjectId: string;
  scheduledAt: Date;
  durationMinutes?: number;
}

export interface CreateTrialLessonResult {
  lessonId: string;
  scheduledAt: Date;
  status: string;
}

export class CreateTrialLessonUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository,
    private readonly clientRepo: IClientRepository,
    private readonly tutorRepo: ITutorRepository,
    private readonly unitOfWork: IUnitOfWork,
    private readonly idGenerator: IUUIDGenerator,
  ) {}

  async execute(dto: CreateTrialLessonDto): Promise<CreateTrialLessonResult> {
  const clientId  = new ClientId(dto.clientId);
  const tutorId  = new TutorId(dto.tutorId);
  const subjectId = new SubjectId(dto.subjectId);
  const lessonId  = new LessonId(this.idGenerator.generate());

  // 1. Найти клиента по userId
  const client = await this.clientRepo.findById(clientId.value);
  if (!client) throw new NotFoundError('Client not found');


  // 2. Проверить тьютора
  const tutor = await this.tutorRepo.findById(tutorId.value);
  if (!tutor) throw new NotFoundError('Tutor not found');
  if (!tutor.isApproved) throw new DomainError('Tutor is not approved yet');

  // 3. Уникальность trial
  const trialExists = await this.lessonRepo.existsActiveTrial(
    clientId.value,
    tutorId.value,
  );
  if (trialExists) throw new ConflictError('You already have a trial lesson with this tutor');

  // 4. Конфликт слотов
  const hasConflict = await this.lessonRepo.existsConflict(
    tutorId.value,
    dto.scheduledAt,
    dto.durationMinutes ?? 60,
  );
  if (hasConflict) throw new ConflictError('This time slot is already taken');

  // 5. Создать урок
  const lesson = Lesson.create({
    id:              lessonId.value,
    clientId:        clientId.value,
    tutorId:         tutorId.value,
    subjectId:       subjectId.value,
    type:            'trial',
    scheduledAt:     dto.scheduledAt,
    durationMinutes: dto.durationMinutes,
  });

  await this.lessonRepo.create(lesson);

  return {
    lessonId:    lesson.id,
    scheduledAt: lesson.scheduledAt,
    status:      lesson.status,
  };
}
}