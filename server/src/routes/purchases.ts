import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

const purchaseSchema = z.object({
  courseId: z.string().uuid("Nieprawidłowe ID kursu"),
});

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
      ? ((req as AuthRequest).user as any).userId 
      : null;

    if (!userId) {
      res.status(401).json({ error: "Nie rozpoznano użytkownika" });
      return;
    }

    const { courseId } = purchaseSchema.parse(req.body);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      res.status(404).json({ error: "Kurs nie istnieje" });
      return;
    }

    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingPurchase) {
      res.status(400).json({ error: "Już posiadasz ten kurs" });
      return;
    }

    const purchase = await prisma.purchase.create({
      data: {
        userId,
        courseId,
      },
    });

    res.status(201).json({ 
      message: "Zakup udany! Masz teraz dostęp do kursu.", 
      purchase 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error("Purchase error:", error);
    res.status(500).json({ error: "Błąd serwera przy zakupie" });
  }
});

router.get('/check/:courseId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
      ? ((req as AuthRequest).user as any).userId 
      : null;
    
    const { courseId } = req.params;

    const purchase = await prisma.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: courseId as string,
        },
      },
    });

    res.json({ hasAccess: !!purchase });

  } catch (error) {
    res.status(500).json({ error: "Błąd sprawdzania dostępu" });
  }
});

export default router;