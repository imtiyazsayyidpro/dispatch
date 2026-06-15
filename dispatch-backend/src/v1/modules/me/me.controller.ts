import { Request, Response, NextFunction } from 'express';
import { meService } from './me.service.js';
import sendResponse from '@/src/lib/sendResponse.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await meService.getMe(req.user.id);
    return sendResponse({
      res,
      status: true,
      message: 'Fetched profile successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await meService.updateProfile(req.user.id, req.body);
    return sendResponse({
      res,
      status: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await meService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    return sendResponse({
      res,
      status: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    await meService.deleteAccount(req.user.id, req.body.password);
    return sendResponse({
      res,
      status: true,
      message: 'Account deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export const meController = {
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
};
