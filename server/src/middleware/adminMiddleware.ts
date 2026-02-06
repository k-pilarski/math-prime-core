import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user as any; 

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Odmowa dostępu. Wymagane uprawnienia Administratora." });
  }

  next();
};