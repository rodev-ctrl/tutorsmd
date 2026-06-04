import { FileNamespace } from './File';

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/ogg",
  "text/plain",
  "application/zip",
]);

export const SIZE_LIMITS: Record<FileNamespace, number> = {
  avatars:             2  * 1024 * 1024,
  "support/chats":     25  * 1024 * 1024,
  "lessons":           50 * 1024 * 1024,
  "lessons/materials": 20 * 1024 * 1024,
};


// Presigned URL живёт 5 минут — достаточно для одного файла
export const PRESIGN_TTL_SECONDS = 300;

