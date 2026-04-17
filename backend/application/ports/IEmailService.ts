export interface IEmailService {
  sendActivationLink(email: string, link: string): Promise<void>;
  sendPasswordResetLink(email: string, link: string, language: string): Promise<void>;
  sendEmailChangeConfirmation(email: string, link: string): Promise<void>;
  sendWelcomeEmail(email: string, name: string): Promise<void>;
}