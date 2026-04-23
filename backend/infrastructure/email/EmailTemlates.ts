interface TemplateContent {
  greeting: string;
  instruction: string;
  buttonText: string;
  link: string;
  warning?: string;
  footerText: string;
}

export class EmailTemplates {
  static base(content: TemplateContent): string {
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
      ${content.warning ? `<p style="font-size: 12px; color: #d9534f; font-weight: bold; text-align: center;">${content.warning}</p>` : ''}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">${content.footerText}</p>
      <p style="font-size: 11px; color: #bbb; text-align: center;">
        Direct link: <a href="${content.link}" style="color: #4A90E2;">${content.link}</a>
      </p>
    </div>`;
  }

  static activation(link: string, language = 'english'): { subject: string; html: string } {
    const t = {
      russian: {
        subject: 'Активация аккаунта TutorsMD',
        greeting: 'Добро пожаловать!',
        instruction: 'Для завершения регистрации подтвердите ваш email.',
        button: 'Активировать аккаунт',
        footer: 'Если вы не регистрировались — просто удалите это письмо.',
      },
      german: {
        subject: 'TutorsMD-Konto aktivieren',
        greeting: 'Willkommen!',
        instruction: 'Um Ihre Registrierung abzuschließen, bestätigen Sie bitte Ihre E-Mail-Adresse.',
        button: 'Konto aktivieren',
        footer: 'Wenn Sie sich nicht registriert haben, ignorieren Sie bitte diese Nachricht.',
      },
      english: {
        subject: 'Activate your TutorsMD account',
        greeting: 'Welcome!',
        instruction: 'To complete your registration, please confirm your email address.',
        button: 'Activate Account',
        footer: "If you didn't create an account, you can safely ignore this email.",
      },
    } as const;

    const l = (t as any)[language] ?? t.english;
    return {
      subject: l.subject,
      html: this.base({ greeting: l.greeting, instruction: l.instruction, buttonText: l.button, link, footerText: l.footer }),
    };
  }

  static passwordReset(link: string, language = 'english'): { subject: string; html: string } {
    const t = {
      russian: {
        subject: 'Сброс пароля для TutorsMD',
        greeting: 'Здравствуйте!',
        instruction: 'Вы запросили сброс пароля.',
        warning: 'Ссылка действительна 15 минут.',
        button: 'Сбросить пароль',
        footer: 'Если вы не запрашивали сброс — проигнорируйте письмо.',
      },
      german: {
        subject: 'Passwort zurücksetzen – TutorsMD',
        greeting: 'Hallo!',
        instruction: 'Sie möchten Ihr Passwort zurücksetzen.',
        warning: 'Dieser Link ist nur 15 Minuten lang gültig.',
        button: 'Passwort zurücksetzen',
        footer: 'Falls Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail.',
      },
      english: {
        subject: 'Reset Password for TutorsMD',
        greeting: 'Hello!',
        instruction: 'You requested a password reset for your account.',
        warning: 'This link is only valid for 15 minutes.',
        button: 'Reset Password',
        footer: 'If you did not request a password reset, no further action is required.',
      },
    } as const;

    const l = (t as any)[language] ?? t.english;
    return {
      subject: l.subject,
      html: this.base({ greeting: l.greeting, instruction: l.instruction, buttonText: l.button, link, warning: l.warning, footerText: l.footer }),
    };
  }

  static emailChange(link: string): { subject: string; html: string } {
    return {
      subject: 'Confirm New Email Address',
      html: this.base({
        greeting: 'Security Update',
        instruction: 'You requested to change your email address. Please confirm within 48 hours.',
        buttonText: 'Confirm New Email',
        link,
        footerText: "If you didn't initiate this change, contact support immediately.",
      }),
    };
  }

  static lessonReminder(link: string, time: string): { subject: string; html: string } {
    return {
      subject: `Lesson Reminder - ${time}`,
      html: this.base({
        greeting: 'Hello!',
        instruction: `Your lesson is scheduled for ${time}. Join the virtual classroom below.`,
        buttonText: 'Join Lesson',
        link,
        footerText: 'We recommend joining 5 minutes before the start.',
      }),
    };
  }
}