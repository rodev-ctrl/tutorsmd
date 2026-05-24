import { ILessonRepository } from '../../../../domain/repositories/lesson/ILessonRepository';
import { ILessonMaterialRepository, LessonMaterialRecord, MaterialType } from '../../../../domain/repositories/lesson/ILessonMaterialRepository';
import { IFileStorageFactory } from '../../../ports/file/IFileStorageFactory';
import { ClientId, TutorId, LessonId } from '../../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { DomainError } from '../../../../domain/errors/DomainError';

export interface LessonMaterialDto {
  id:               string;
  materialType:     MaterialType;
  fileName:         string;
  fileSize:         number | null;
  mimeType:         string | null;
  downloadUrl:      string;           // presigned download URL
  uploadedByTutor:  string | null;
  uploadedByClient: string | null;
  createdAt:        Date;
}

export interface GetLessonMaterialDto {
  lessonId:     string;
  requesterId:  string;
  requesterRole: 'client' | 'tutor';
}

export class GetLessonMaterialUseCase {
  constructor(
    private readonly lessonRepo:   ILessonRepository,
    private readonly materialRepo: ILessonMaterialRepository,
    private readonly fileStorage:  IFileStorageFactory,
  ) {}

  async execute(dto: GetLessonMaterialDto): Promise<LessonMaterialDto[]> {
    const lessonId = new LessonId(dto.lessonId);

    // 1. Найти урок
    const lesson = await this.lessonRepo.findById(lessonId.value);
    if (!lesson) throw new NotFoundError('Lesson not found');

    // 2. Проверить участника
    if (dto.requesterRole === 'client') {
      const clientId = new ClientId(dto.requesterId);
      if (lesson.clientId !== clientId.value) {
        throw new DomainError('You are not the client of this lesson');
      }
    } else {
      const tutorId = new TutorId(dto.requesterId);
      if (lesson.tutorId !== tutorId.value) {
        throw new DomainError('You are not the tutor of this lesson');
      }
    }

    // 3. Получить материалы
    const materials = await this.materialRepo.findByLessonId(lessonId.value);

    // 4. Генерируем presigned download URL для каждого файла параллельно
    return Promise.all(materials.map(m => this.toDto(m)));
  }

  private async toDto(m: LessonMaterialRecord): Promise<LessonMaterialDto> {
    let downloadUrl = '';
    try {
      downloadUrl = await this.fileStorage.getPresignedDownloadUrl(
        m.fileUrl, // fileUrl хранит R2 key
        3600,      // 1 час
      );
    } catch (err) {
      console.error(`[GetLessonMaterial] presign failed for key=${m.fileUrl}:`, err);
    }

    return {
      id:               m.id,
      materialType:     m.materialType,
      fileName:         m.fileName,
      fileSize:         m.fileSize ? Number(m.fileSize) : null,
      mimeType:         m.mimeType,
      downloadUrl,
      uploadedByTutor:  m.uploadedByTutor,
      uploadedByClient: m.uploadedByClient,
      createdAt:        m.createdAt,
    };
  }
}