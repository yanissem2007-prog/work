import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { renderOtpEmail } from './templates/otp';

let _transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: env.MAILTRAP_HOST,
    port: env.MAILTRAP_PORT,
    auth: env.MAILTRAP_USER && env.MAILTRAP_PASS
      ? { user: env.MAILTRAP_USER, pass: env.MAILTRAP_PASS }
      : undefined,
    secure: false
  });
  return _transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(msg: MailMessage): Promise<void> {
  if (!env.MAILTRAP_USER || !env.MAILTRAP_PASS) {
    logger.info({ to: msg.to, subject: msg.subject }, 'mail.send (no SMTP creds — preview only)');
    logger.info(msg.text ?? msg.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    return;
  }
  try {
    await getTransporter().sendMail({ from: env.MAIL_FROM, ...msg });
  } catch (e) {
    logger.error(e, 'mail.send failed');
    throw e;
  }
}

/* High-level convenience: OTP email */
export async function sendOtpEmail(opts: { to: string; name?: string; code: string; minutes: number }) {
  const { subject, html, text } = renderOtpEmail(opts);
  await sendMail({ to: opts.to, subject, html, text });
}
