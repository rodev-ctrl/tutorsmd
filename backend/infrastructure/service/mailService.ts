import "dotenv/config";
import nodemailer, { Transporter } from "nodemailer";
import ApiError from "../../domain/errors/apiError";
import PasswordResetModel from "../models/PasswordResetModel";

class MailService {
  private static transporter: Transporter | null = null;

  private static init() {
    if (this.transporter) return;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, NODE_ENV } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
      throw new Error("SMTP environment variables are not configured");
    }

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: NODE_ENV === "production" || SMTP_PORT === "465",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private static async sendMail(to: string, subject: string, html: string, text = "") {
    try {
      this.init();
      return await this.transporter!.sendMail({
        from: `"TutorsMD" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      
    } catch (e) {
      console.error("Nodemailer Error:", e);
      throw ApiError.Internal("Failed to send email");
    }
  }

  /**
   * Общий шаблон для красивых писем с кнопкой
   */
  private static generateHtmlTemplate(content: {
    greeting: string;
    instruction: string;
    buttonText: string;
    link: string;
    warning?: string;
    footerText: string;
  }) {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4A90E2; margin: 0;">TutorsMD</h2>
      </div>
      <p style="font-size: 16px;">${content.greeting}</p>
      <p style="font-size: 14px; color: #555;">${content.instruction}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${content.link}" style="background-color: #4A90E2; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
          ${content.buttonText}
        </a>
      </div>
      ${content.warning ? `<p style="font-size: 12px; color: #d9534f; font-weight: bold; text-align: center;">${content.warning}</p>` : ""}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">${content.footerText}</p>
      <p style="font-size: 11px; color: #bbb; text-align: center;">
        Direct link: <a href="${content.link}" style="color: #4A90E2;">${content.link}</a>
      </p>
    </div>`;
  }

  static async sendActivationLink(email: string, link: string, language = "english") {
    const translations: any = {
      russian: {
        subject: "Активация аккаунта TutorsMD",
        greeting: "Добро пожаловать!",
        instruction: "Для завершения регистрации и активации вашего аккаунта, пожалуйста, подтвердите ваш email.",
        button: "Активировать аккаунт",
        footer: "Если вы не регистрировались на нашем сайте, просто удалите это письмо."
      },
      german: {
        subject: "TutorsMD-Konto aktivieren",
        greeting: "Willkommen!",
        instruction: "Um Ihre Registrierung abzuschließen, bestätigen Sie bitte Ihre E-Mail-Adresse.",
        button: "Konto aktivieren",
        footer: "Wenn Sie sich nicht registriert haben, ignorieren Sie bitte diese Nachricht."
      },
      english: {
        subject: "Activate your TutorsMD account",
        greeting: "Welcome!",
        instruction: "To complete your registration and activate your account, please confirm your email address.",
        button: "Activate Account",
        footer: "If you didn't create an account, you can safely ignore this email."
      }
    };

    const t = translations[language] || translations.english;
    const html = this.generateHtmlTemplate({
      greeting: t.greeting,
      instruction: t.instruction,
      buttonText: t.button,
      link,
      footerText: t.footer
    });

    await this.sendMail(email, t.subject, html);
   
  }

  static async sendPasswordForgotLink(email: string, link: string, language = "english") {
    const translations: any = {
      russian: {
        subject: "Сброс пароля для TutorsMD",
        greeting: "Здравствуйте!",
        instruction: "Вы получили это письмо, потому что запросили сброс пароля для вашего аккаунта.",
        warning: "Эта ссылка действительна только в течение 15 минут.",
        button: "Сбросить пароль",
        footer: "Если вы не запрашивали сброс, просто проигнорируйте письмо."
      },
      german: {
        subject: "Passwort zurücksetzen – TutorsMD",
        greeting: "Hallo!",
        instruction: "Sie erhalten diese E-Mail, weil Sie das Passwort für Ihr Konto zurücksetzen möchten.",
        warning: "Dieser Link ist nur 15 Minuten lang gültig.",
        button: "Passwort zurücksetzen",
        footer: "Falls Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren."
      },
      english: {
        subject: "Reset Password for TutorsMD",
        greeting: "Hello!",
        instruction: "You are receiving this email because you requested a password reset for your account.",
        warning: "This link is only valid for 15 minutes.",
        button: "Reset Password",
        footer: "If you did not request a password reset, no further action is required."
      }
    };

    const t = translations[language] || translations.english;

    const fullUrl = `${process.env.CLIENT_URL}/password/forgot/${link}`;

    const html = this.generateHtmlTemplate({
      greeting: t.greeting,
      instruction: t.instruction,
      buttonText: t.button,
      link: fullUrl,
      warning: t.warning,
      footerText: t.footer
    });


  const sent = await this.sendMail(email, t.subject, html);
  if(!sent) throw ApiError.Internal("Email not sent");
  return true;
  }

  static async sendLessonLink(email: string, time: string | Date, link: string) {
    const formattedTime = time instanceof Date ? time.toLocaleString() : time;
    const subject = `Lesson Reminder - ${formattedTime}`;
    const html = this.generateHtmlTemplate({
      greeting: "Hello!",
      instruction: `Your lesson is scheduled for ${formattedTime}. You can join the virtual classroom using the button below.`,
      buttonText: "Join Lesson",
      link,
      footerText: "We recommend joining 5 minutes before the start."
    });

    await this.sendMail(email, subject, html);
  }

  static async sendEmailChangeLink(email: string, link: string) {
    const subject = "Confirm New Email Address";
    const html = this.generateHtmlTemplate({
      greeting: "Security Update",
      instruction: "You requested to change your email address. Please confirm the new address within 48 hours.",
      buttonText: "Confirm New Email",
      link,
      footerText: "If you didn't initiate this change, please contact support immediately."
    });

    await this.sendMail(email, subject, html);
  }
}

export default MailService;