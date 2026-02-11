import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.body;
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
      ? ((req as AuthRequest).user as any).userId 
      : null;

    if (!userId) {
      res.status(401).json({ error: "Nieautoryzowany" });
      return;
    }

    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingPurchase) {
      res.status(400).json({ error: "Już posiadasz ten kurs" });
      return;
    }

    const purchase = await prisma.purchase.create({
      data: {
        userId,
        courseId
      }
    });

    res.status(201).json({ message: "Zakup udany", purchase });
  } catch (error) {
    res.status(500).json({ error: "Błąd zakupu" });
  }
});

router.get('/check/:courseId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
      ? ((req as AuthRequest).user as any).userId 
      : null;

    if (!userId) {
      res.json({ hasAccess: false });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'ADMIN') {
      res.json({ hasAccess: true });
      return;
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true }
    });

    if (course && course.price === 0) {
      res.json({ hasAccess: true });
      return;
    }

    const purchase = await prisma.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    res.json({ hasAccess: !!purchase });

  } catch (error) {
    console.error("Check access error:", error);
    res.status(500).json({ error: "Błąd sprawdzania dostępu" });
  }
});

router.get('/my-courses', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
      ? ((req as AuthRequest).user as any).userId 
      : null;

    const purchases = await prisma.purchase.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const myCourses = purchases.map(p => p.course);
    res.json(myCourses);

  } catch (error) {
    console.error("My courses error:", error);
    res.status(500).json({ error: "Błąd pobierania twoich kursów" });
  }
});

export default router;