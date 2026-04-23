import nodemailer, { Transporter } from 'nodemailer';

export class NodemailerTransport {
  private static instance: Transporter | null = null;

  static get(): Transporter {
    if (this.instance) return this.instance;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, NODE_ENV } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
      throw new Error('SMTP environment variables are not configured');
    }

    this.instance = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: NODE_ENV === 'production' || SMTP_PORT === '465',
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      tls: { rejectUnauthorized: false },
    });

    return this.instance;
  }
}