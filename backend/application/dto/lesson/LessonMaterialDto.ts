import { MaterialType } from '../../../domain/repositories/lesson/ILessonMaterialRepository';

export interface LessonMaterialDto {
  id:               string;
  materialType:     MaterialType;
  fileName:         string;
  fileSize:         number | null;
  mimeType:         string | null;
  downloadUrl:      string;
  uploadedByTutor:  string | null;
  uploadedByClient: string | null;
  createdAt:        Date;
  updatedAt:        Date;
}