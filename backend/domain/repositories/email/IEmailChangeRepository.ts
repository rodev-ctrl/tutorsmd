export interface EmailChangeRecord {
  id:        string;
  userId:    string;
  newEmail:  string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IEmailChangeRepository {
  upsert(data: { userId: string; newEmail: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  consumeToken(tokenHash: string): Promise<EmailChangeRecord | null>;
  deleteByUserId(userId: string): Promise<void>;
}