import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import sendResponse from '@/src/lib/sendResponse.js';
import { statusCodes } from '@/src/constants/statusCodes.js';
import AppError from '@/src/lib/AppError.js';
import { getAuthUserById } from '@/src/lib/authContext.js';

function getTokenFromHeader(authorization?: string | string[]) {
  if (!authorization || Array.isArray(authorization)) return null;
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : authorization;
}

async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;
    const user = await authService.register(name, email, password);

    return sendResponse({
      res,
      status: true,
      statusCode: statusCodes.CREATED,
      message: 'Verification code sent to your email',
      data: { email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body;
    const user = await authService.verifyEmail(email, code);
    const session = await authService.createSession(
      user.id,
      req.ip,
      req.headers['user-agent'] as string | undefined
    );
    const authUser = await getAuthUserById(user.id);

    return sendResponse({
      res,
      status: true,
      message: 'Email verified successfully',
      data: { token: session.token, user: authUser },
    });
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.resendVerification(req.body.email);

    return sendResponse({
      res,
      status: true,
      message: 'If that account needs verification, a new code is on its way',
    });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.forgotPassword(req.body.email);

    return sendResponse({
      res,
      status: true,
      message: 'If an account exists for that email, a reset link is on its way',
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);

    return sendResponse({
      res,
      status: true,
      message: 'Password reset successfully. You can now sign in.',
    });
  } catch (err) {
    next(err);
  }
}

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    const session = await authService.createSession(
      user.id,
      req.ip,
      req.headers['user-agent'] as string | undefined
    );
    const authUser = await getAuthUserById(user.id);

    return sendResponse({
      res,
      status: true,
      message: 'Logged in successfully',
      data: { token: session.token, user: authUser },
    });
  } catch (err) {
    next(err);
  }
}

async function completeOnboarding(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.completeOnboarding(req.user.id, req.body);
    const authUser = await getAuthUserById(req.user.id);

    return sendResponse({
      res,
      status: true,
      message: 'Onboarding completed successfully',
      data: { user: authUser },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getTokenFromHeader(req.headers['authorization']);
    if (!token) throw new AppError('No token provided', statusCodes.UNAUTHORIZED);

    await authService.logout(token);

    return sendResponse({ res, status: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export const authController = {
  register,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  login,
  completeOnboarding,
  logout,
};
