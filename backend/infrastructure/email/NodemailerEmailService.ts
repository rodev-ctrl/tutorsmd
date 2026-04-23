import { IEmailService } from '../../application/ports/IEmailService';
import { NodemailerTransport } from './NodemailerTransport';
import { EmailTemplates } from "./EmailTemplates";
import { DomainError } from '../../domain/errors/DomainError';

export class NodemailerEmailService implements IEmailService {
  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await NodemailerTransport.get().sendMail({
        from: `"TutorsMD" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
    } catch (e) {
      console.error('Nodemailer Error:', e);
      throw new DomainError('Failed to send email');
    }
  }

  async sendActivationLink(email: string, link: string, language?: string): Promise<void> {
    const { subject, html } = EmailTemplates.activation(link, language);
    await this.send(email, subject, html);
  }

  async sendPasswordResetLink(email: string, link: string, language?: string): Promise<void> {
    const fullUrl = `${process.env.CLIENT_URL}/password/reset/${link}`;
    const { subject, html } = EmailTemplates.passwordReset(fullUrl, language);
    await this.send(email, subject, html);
  }

  async sendEmailChangeConfirmation(email: string, link: string): Promise<void> {
    const { subject, html } = EmailTemplates.emailChange(link);
    await this.send(email, subject, html);
  }

  async sendLessonReminder(email: string, link: string, time: string): Promise<void> {
    const { subject, html } = EmailTemplates.lessonReminder(link, time);
    await this.send(email, subject, html);
  }
}