export interface IEmailVerificationRepository {
  upsert(data: { userId: string; link: string; expiresAt: Date }): Promise<void>;
  findByLink(link: string): Promise<{ userId: string; expiresAt: Date } | null>;
  deleteByUserId(userId: string): Promise<void>;
}
 