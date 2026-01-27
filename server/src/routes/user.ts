import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', authenticateToken, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;

  res.json({ 
    message: "To są dane chronione, dostępne tylko dla zalogowanych.", 
    user: user 
  });
});

export default router;