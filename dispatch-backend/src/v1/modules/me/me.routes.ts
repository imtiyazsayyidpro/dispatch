import { Router } from 'express';
import { meController } from './me.controller.js';
import { validateBody } from '@/src/middlewares/validate.js';
import { updateProfileSchema, changePasswordSchema } from './me.validation.js';
import { z } from 'zod';

const meRouter = Router();

meRouter.get('/', meController.getMe);
meRouter.put('/profile', validateBody(updateProfileSchema), meController.updateProfile);
meRouter.put('/password', validateBody(changePasswordSchema), meController.changePassword);
meRouter.delete('/account', validateBody(z.object({
  password: z.string().min(1, 'Password is required'),
})), meController.deleteAccount);

export default meRouter;
