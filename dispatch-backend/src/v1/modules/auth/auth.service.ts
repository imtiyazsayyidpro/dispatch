import { randomInt, randomBytes } from 'crypto';
import prisma from '@/src/lib/prisma.js';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';
import { sendMail } from '@/src/lib/mailer.js';
import { verificationEmail, passwordResetEmail } from '@/src/lib/emails.js';
import bcrypt from 'bcrypt';
import moment from 'moment';

const CODE_TTL_MINUTES = 15;
const MAX_VERIFY_ATTEMPTS = 5;
const RESET_TTL_MINUTES = 60;

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Invalidates any outstanding codes for the user, mints a fresh one, and
 * emails it. Returns nothing — the code only ever lives in the user's inbox.
 */
async function issueVerificationCode(userId: string, name: string, email: string) {
  await prisma.emailVerification.updateMany({
    where: { userId, isUsed: false },
    data: { isUsed: true },
  });

  const code = generateCode();
  await prisma.emailVerification.create({
    data: {
      userId,
      code,
      expiresAt: moment().add(CODE_TTL_MINUTES, 'minutes').toDate(),
    },
  });

  const { subject, html, text } = verificationEmail(name, code);
  await sendMail({ to: email, subject, html, text });
}

async function register(name: string, email: string, password: string) {
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) throw new AppError('An account with this email already exists', statusCodes.CONFLICT);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await issueVerificationCode(user.id, user.name, user.email);

  return user;
}

/**
 * Confirms an emailed code. On success marks the user verified and the code
 * used, then returns the user so the caller can mint a session.
 */
async function verifyEmail(email: string, code: string) {
  const user = await prisma.user.findFirst({ where: { email, isActive: true } });
  if (!user) throw new AppError('Invalid or expired code', statusCodes.BAD_REQUEST);

  if (user.isEmailVerified) {
    throw new AppError('This email is already verified', statusCodes.CONFLICT);
  }

  const verification = await prisma.emailVerification.findFirst({
    where: { userId: user.id, isUsed: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!verification || moment(verification.expiresAt).isBefore(moment())) {
    throw new AppError('Invalid or expired code. Request a new one.', statusCodes.BAD_REQUEST);
  }

  if (verification.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new AppError('Too many attempts. Request a new code.', statusCodes.BAD_REQUEST);
  }

  if (verification.code !== code) {
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError('Invalid or expired code', statusCodes.BAD_REQUEST);
  }

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { isUsed: true },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    }),
  ]);

  return user;
}

/** Re-issues a code for an as-yet-unverified account. */
async function resendVerification(email: string) {
  const user = await prisma.user.findFirst({ where: { email, isActive: true } });

  // Don't disclose whether an address is registered; silently succeed.
  if (!user || user.isEmailVerified) return;

  await issueVerificationCode(user.id, user.name, user.email);
}

async function login(email: string, password: string) {
  const user = await prisma.user.findFirst({ where: { email, isActive: true } });
  if (!user) throw new AppError('Invalid email or password', statusCodes.UNAUTHORIZED);

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new AppError('Invalid email or password', statusCodes.UNAUTHORIZED);

  if (!user.isEmailVerified) {
    // Re-send a fresh code and tell the client to route into the verify step.
    await issueVerificationCode(user.id, user.name, user.email);
    throw new AppError('Please verify your email to continue', statusCodes.FORBIDDEN, {
      needsVerification: true,
      email: user.email,
    });
  }

  return user;
}

/**
 * Starts a password reset. Always resolves without disclosing whether the
 * address is registered; only sends a link when a matching active account
 * exists.
 */
async function forgotPassword(email: string) {
  const user = await prisma.user.findFirst({ where: { email, isActive: true } });
  if (!user) return;

  // Retire any outstanding reset tokens before issuing a new one.
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, isUsed: false },
    data: { isUsed: true },
  });

  const token = randomBytes(32).toString('hex');
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: moment().add(RESET_TTL_MINUTES, 'minutes').toDate(),
    },
  });

  const base = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '');
  const link = `${base}/reset-password?token=${token}`;
  const { subject, html, text } = passwordResetEmail(user.name, link);
  await sendMail({ to: user.email, subject, html, text });
}

/**
 * Completes a reset: validates the token, sets the new password, burns the
 * token, and signs out every existing session.
 */
async function resetPassword(token: string, newPassword: string) {
  const reset = await prisma.passwordReset.findFirst({ where: { token, isUsed: false } });

  if (!reset || moment(reset.expiresAt).isBefore(moment())) {
    throw new AppError('This reset link is invalid or has expired', statusCodes.BAD_REQUEST);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { isUsed: true } }),
    prisma.session.updateMany({
      where: { userId: reset.userId, isActive: true },
      data: { isActive: false },
    }),
  ]);
}

async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const token = crypto.randomUUID();
  const expiresAt = moment().add(7, 'days').toDate();

  return prisma.session.create({
    data: { userId, token, ipAddress, userAgent, expiresAt },
  });
}

async function completeOnboarding(
  userId: string,
  data: {
    heardFrom: string;
    role: string;
    building: string;
    teamSize: string;
    primaryUseCase: string;
  }
) {
  const existing = await prisma.userOnboarding.findFirst({ where: { userId } });
  if (existing) throw new AppError('Onboarding already completed', statusCodes.CONFLICT);

  await prisma.userOnboarding.create({ data: { userId, ...data } });
  await prisma.user.update({ where: { id: userId }, data: { isOnboarded: true } });
}

async function logout(token: string) {
  const session = await prisma.session.findFirst({ where: { token, isActive: true } });
  if (!session) throw new AppError('Session not found', statusCodes.UNAUTHORIZED);

  await prisma.session.update({ where: { id: session.id }, data: { isActive: false } });
}

export const authService = {
  register,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  login,
  createSession,
  completeOnboarding,
  logout,
};
