// application/usecases/lesson/material/UploadLessonMaterialUseCase.ts
import { ILessonRepository } from '../../../../domain/repositories/lesson/ILessonRepository';
import { ILessonMaterialRepository, MaterialType } from '../../../../domain/repositories/lesson/ILessonMaterialRepository';
import { IFileStorageFactory } from '../../../ports/file/IFileStorageFactory';
import { IUUIDGenerator } from '../../../ports/IUUIDGenerator';
import { ClientId, TutorId, LessonId, LessonMaterialId } from '../../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { DomainError } from '../../../../domain/errors/DomainError';
import { ALLOWED_MIME_TYPES, SIZE_LIMITS } from '../../../../domain/entities/file/fileConstants';
import { LessonMaterialDto } from '../../../dto/lesson/LessonMaterialDto';

export interface UploadLessonMaterialDto {
  lessonId:     string;
  uploaderId:   string;       // client.id или tutor.id
  uploaderRole: 'client' | 'tutor';
  materialType: MaterialType;
  fileName:     string;
  mimeType:     string;
  fileSize:     number;
}

export interface UploadLessonMaterialResult {
  uploadUrl: string;          // presigned PUT URL → клиент грузит в R2
  material:  LessonMaterialDto;
}

export class UploadLessonMaterialUseCase {
  constructor(
    private readonly lessonRepo:   ILessonRepository,
    private readonly materialRepo: ILessonMaterialRepository,
    private readonly fileStorage:  IFileStorageFactory,
    private readonly idGenerator:  IUUIDGenerator,
  ) {}

  async execute(dto: UploadLessonMaterialDto): Promise<UploadLessonMaterialResult> {
    const lessonId   = new LessonId(dto.lessonId);
    const materialId = new LessonMaterialId(this.idGenerator.generate());

    // 1. Найти урок
    const lesson = await this.lessonRepo.findById(lessonId.value);
    if (!lesson) throw new NotFoundError('Lesson not found');

    // 2. Проверить участника
    if (dto.uploaderRole === 'client') {
      const clientId = new ClientId(dto.uploaderId);
      if (lesson.clientId !== clientId.value) {
        throw new DomainError('You are not the client of this lesson');
      }
    } else {
      const tutorId = new TutorId(dto.uploaderId);
      if (lesson.tutorId !== tutorId.value) {
        throw new DomainError('You are not the tutor of this lesson');
      }
    }

    // 3. Нельзя загружать в отменённый/перенесённый урок
    if (lesson.isTerminal && !lesson.isCompleted) {
      throw new DomainError('Cannot upload materials to a cancelled or rescheduled lesson');
    }

    // 4. Валидация mime type
    if (!ALLOWED_MIME_TYPES.has(dto.mimeType)) {
      throw new DomainError(`File type "${dto.mimeType}" is not allowed`);
    }

    // 5. Валидация размера
    const maxSize = SIZE_LIMITS['lessons/materials'];
    if (dto.fileSize > maxSize) {
      throw new DomainError(`File too large. Max ${maxSize / 1024 / 1024} MB`);
    }

    // 6. Строим R2 key + presigned upload URL (5 минут на загрузку)
    const fileKey   = this.fileStorage.buildKey('lessons/materials', dto.uploaderId, dto.fileName);
    const uploadUrl = await this.fileStorage.getPresignedUploadUrl(fileKey, dto.mimeType, 300);

    // 7. Сохраняем запись в БД — fileUrl хранит R2 key, не публичный URL
    const created = await this.materialRepo.create({
      id:               materialId.value,
      lessonId:         lessonId.value,
      uploadedByTutor:  dto.uploaderRole === 'tutor'  ? dto.uploaderId : null,
      uploadedByClient: dto.uploaderRole === 'client' ? dto.uploaderId : null,
      materialType:     dto.materialType,
      fileUrl:          fileKey,
      fileName:         dto.fileName,
      fileSize:         BigInt(dto.fileSize),
      mimeType:         dto.mimeType,
    });

    // 8. Генерируем presigned download URL — клиент сразу добавляет в UI
    let downloadUrl = '';
    try {
      downloadUrl = await this.fileStorage.getPresignedDownloadUrl(fileKey, 3600);

      console.log("DOWNLOAD URL", downloadUrl);
    } catch (err) {
      console.error(`[UploadLessonMaterial] presign download failed for key=${fileKey}:`, err);
    }

    return {
      uploadUrl,
      material: {
        id:               created.id,
        materialType:     created.materialType,
        fileName:         created.fileName,
        fileSize:         created.fileSize ? Number(created.fileSize) : null,
        mimeType:         created.mimeType,
        downloadUrl,
        uploadedByTutor:  created.uploadedByTutor,
        uploadedByClient: created.uploadedByClient,
        createdAt:        created.createdAt,
        updatedAt:        created.updatedAt,
      },
    };
  }
}