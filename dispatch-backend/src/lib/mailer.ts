import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

let transporter: Transporter | null = null;

/**
 * Lazily builds a single Gmail transporter from the app-password credentials.
 * Created on first send so the process can boot even if mail is misconfigured.
 */
function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new AppError(
      'Mailer is not configured (missing GMAIL_USER / GMAIL_APP_PASSWORD)',
      statusCodes.INTERNAL_SERVER_ERROR
    );
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter;
}

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail({ to, subject, html, text }: SendMailParams) {
  const from = process.env.GMAIL_USER;
  await getTransporter().sendMail({
    from: `"Dispatch" <${from}>`,
    to,
    subject,
    html,
    text,
  });
}
