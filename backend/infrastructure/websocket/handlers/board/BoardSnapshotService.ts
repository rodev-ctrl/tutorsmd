import { IFileStorageFactory } from '../../../../application/ports/file/IFileStorageFactory';
import { loadBoardFromRedis, clearBoardFromRedis } from './BoardHandler';

export class BoardSnapshotService {
  constructor(private readonly fileStorage: IFileStorageFactory) {}

  async saveSnapshot(lessonId: string): Promise<string | null> {
    try {
      const fullState = await loadBoardFromRedis(lessonId);
      if (Object.keys(fullState).length === 0) return null;

      const key = `board-snapshots/${lessonId}/snapshot.json`;
      const json = JSON.stringify(fullState);

      // Загружаем JSON в R2
      const uploadUrl = await this.fileStorage.getPresignedUploadUrl(
        key, 'application/json', 3600
      );

      await fetch(uploadUrl, {
        method: 'PUT',
        body: json,
        headers: { 'Content-Type': 'application/json' },
      });

      await clearBoardFromRedis(lessonId);
      console.log(`[BoardSnapshot] Saved snapshot for lesson ${lessonId}`);
      return key;
    } catch (err) {
      console.error(`[BoardSnapshot] Failed to save snapshot for lesson ${lessonId}:`, err);
      return null;
    }
  }

  async loadSnapshot(lessonId: string): Promise<Record<number, any[]> | null | unknown> {
    try {
      const key = `board-snapshots/${lessonId}/snapshot.json`;
      const TTL = 60 * 60 * 6;
      const url = await this.fileStorage.getPresignedDownloadUrl(key, TTL);
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}
