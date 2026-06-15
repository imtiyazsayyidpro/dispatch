import { Session } from '../../generated/prisma/client.js';
import { AuthUser } from '@/src/lib/authContext.js';

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
      session: Session;
      projectId: string;
    }
  }
}
