export interface UpsertPasswordResetDto {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}
 
export interface PasswordResetRecord {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}
 
export interface IPasswordResetRepository {
  upsert(data: UpsertPasswordResetDto): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null>;
  deleteByUserId(userId: string): Promise<void>;
}
 