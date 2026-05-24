export interface CreateAppealDto {
  lessonId:      string;
  appellantId:   string;       // client.id или tutor.id
  appellantRole: 'client' | 'tutor';
  text:          string;
  expiresAt?:    Date | null;
}

export interface CreateAppealResult {
  appealId: string;
}