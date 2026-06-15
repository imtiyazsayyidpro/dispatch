import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateBody } from '@/src/middlewares/validate.js';
import {
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  loginSchema,
  onboardingSchema,
} from './auth.validation.js';
import { authenticate } from '@/src/middlewares/authenticate.js';
import { authLimiter, emailLimiter } from '@/src/middlewares/rateLimit.js';

const authRouter = Router();

authRouter.post('/register', emailLimiter, validateBody(registerSchema), authController.register);
authRouter.post('/verify-email', authLimiter, validateBody(verifyEmailSchema), authController.verifyEmail);
authRouter.post('/resend-verification', emailLimiter, validateBody(resendVerificationSchema), authController.resendVerification);
authRouter.post('/forgot-password', emailLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
authRouter.post('/login', authLimiter, validateBody(loginSchema), authController.login);
authRouter.post('/logout', authenticate, authController.logout);
authRouter.post('/onboarding', authenticate, validateBody(onboardingSchema), authController.completeOnboarding);

export default authRouter;
