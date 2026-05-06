export interface UpsertPasswordResetDto {
  userId: string;
  link: string;
  expiresAt: Date;
}
 
export interface PasswordResetRecord {
  userId: string;
  link: string;
  expiresAt: Date;
}
 
export interface IPasswordResetRepository {
  upsert(data: UpsertPasswordResetDto): Promise<void>;
  findBylink(link: string): Promise<PasswordResetRecord | null>;
  deleteByUserId(userId: string): Promise<void>;
}
 