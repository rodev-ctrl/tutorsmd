export interface IEmailChangeRepository {
  upsert(data: { userId: string; newEmail: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<{ userId: string; newEmail: string; expiresAt: Date } | null>;
  deleteByUserId(userId: string): Promise<void>;
}