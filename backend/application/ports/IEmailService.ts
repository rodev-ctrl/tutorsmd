import { LanguageCode } from "../../domain/entities/User";

export interface IEmailService {
  sendActivationLink(email: string, link: string, language?: LanguageCode): Promise<void>;
  sendPasswordResetLink(email: string, link: string, language?: LanguageCode): Promise<void>;
  sendEmailChangeConfirmation(email: string, link: string, language?: LanguageCode): Promise<void>;
  sendLessonReminder(email: string, time: string, language?: LanguageCode): Promise<void>;
  sendTutorApproved(email: string, language?: LanguageCode): Promise<void>;   
  sendTutorRejected(email: string, language?: LanguageCode): Promise<void>;   
}