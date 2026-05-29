import { logger } from './logger';
import { env } from './env';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Minimal mail port — production: swap in resend / postmark / SES.
 * Dev: logs the message + magic link to console.
 */
export const mail = {
  async send(msg: MailMessage) {
    if (env.NODE_ENV !== 'production') {
      logger.info({ to: msg.to, subject: msg.subject }, 'mail.send (dev — console only)');
      logger.info(msg.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      return;
    }
    // TODO: wire production transport (Resend / Postmark / SES)
    logger.warn('production mail transport not configured — message dropped');
  }
};
