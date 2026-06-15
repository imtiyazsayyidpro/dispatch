import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const onboardingSchema = z.object({
  heardFrom: z.enum(['Word of mouth', 'Twitter/X', 'GitHub', 'Google', 'Other']),
  role: z.enum(['Developer', 'DevOps Engineer', 'Indie Hacker', 'Founder', 'Other']),
  building: z.string().min(1, 'Please tell us what you are building'),
  teamSize: z.enum(['Just me', '2-5', '6-20', '20+']),
  primaryUseCase: z.enum([
    'Sending reminders',
    'Triggering background jobs',
    'Webhook scheduling',
    'Other',
  ]),
});
