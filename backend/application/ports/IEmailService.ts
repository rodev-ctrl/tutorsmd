export interface IEmailService {
  sendActivationLink(email: string, link: string, language?: string): Promise<void>;
  sendPasswordResetLink(email: string, link: string, language?: string): Promise<void>;
  sendEmailChangeConfirmation(email: string, link: string, language?: string): Promise<void>;
  sendLessonReminder(email: string, link: string, time: string, language?: string): Promise<void>;
}