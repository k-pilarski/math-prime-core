import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.post('/:lessonId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.lessonId as string;
    
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
      ? ((req as AuthRequest).user as any).userId 
      : null;

    if (!userId) {
       res.status(401).json({ error: "Brak autoryzacji" });
       return;
    }

    const progress = await prisma.userProgress.create({
      data: {
        userId,
        lessonId
      }
    });

    res.json(progress);
  } catch (error) {
    res.status(200).json({ message: "Już ukończono" });
  }
});

router.delete('/:lessonId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.lessonId as string;
    
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
      ? ((req as AuthRequest).user as any).userId 
      : null;

    await prisma.userProgress.deleteMany({
      where: {
        userId,
        lessonId
      }
    });

    res.json({ message: "Cofnięto ukończenie" });
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera" });
  }
});

router.get('/course/:courseId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
      ? ((req as AuthRequest).user as any).userId 
      : null;

    if (!userId) {
        res.json([]);
        return;
    }

    const completedLessons = await prisma.userProgress.findMany({
      where: {
        userId,
        lesson: {
          courseId: courseId
        }
      },
      select: {
        lessonId: true
      }
    });

    res.json(completedLessons.map(p => p.lessonId));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd pobierania postępu" });
  }
});

export default router;