// infrastructure/service/NodemailerEmailService.ts

import { IEmailService } from '../../application/ports/IEmailService';
import MailService from './mailService';

export class NodemailerEmailService implements IEmailService {
  async sendActivationLink(email: string, link: string): Promise<void> {
    await MailService.sendActivationLink(email, link);
  }

  async sendPasswordResetLink(email: string, link: string, language: string): Promise<void> {
    await MailService.sendPasswordForgotLink(email, link, language);
  }

  async sendEmailChangeConfirmation(email: string, link: string): Promise<void> {
    await MailService.sendEmailChangeLink(email, link);
  }

  async sendWelcomeEmail(email: string, _name: string): Promise<void> {
    await MailService.sendActivationLink(email, '');
  }
}
