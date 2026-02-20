import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/lesson/:lessonId', async (req: Request, res: Response) => {
  try {
    const lessonId = req.params.lessonId as string;
    const comments = await prisma.comment.findMany({
      where: { 
          lessonId,
          parentId: null
      },
      include: {
        user: {
          select: { id: true, email: true, role: true, isBlocked: true }
        },
        replies: {
          include: { user: { select: { id: true, email: true, role: true, isBlocked: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Błąd pobierania komentarzy" });
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, lessonId, parentId } = req.body;
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
      ? ((req as AuthRequest).user as any).userId 
      : null;

    if (!text || !lessonId) {
       res.status(400).json({ error: "Brak treści lub ID lekcji" });
       return;
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (currentUser?.isBlocked) {
        res.status(403).json({ error: "Twoje konto zostało zablokowane." });
        return;
    }

    const comment = await prisma.comment.create({
      data: { 
          text, 
          lessonId, 
          userId,
          parentId: parentId || null
      },
      include: {
        user: { select: { id: true, email: true, role: true, isBlocked: true } }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Błąd dodawania komentarza" });
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' ? ((req as AuthRequest).user as any).userId : null;
    
    const comment = await prisma.comment.findUnique({ where: { id }, include: { user: true } });
    if (!comment) {
        res.status(404).json({ error: "Nie znaleziono komentarza" });
        return;
    }

    const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = requestingUser?.role === 'ADMIN';
    const isAuthor = comment.userId === userId;

    if (!isAuthor && !isAdmin) {
        res.status(403).json({ error: "Brak uprawnień" });
        return;
    }

    await prisma.comment.delete({ where: { id } });
    res.json({ message: "Usunięto komentarz" });
  } catch (error) {
    res.status(500).json({ error: "Błąd usuwania" });
  }
});

router.put('/user/:targetUserId/block', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUserId = req.params.targetUserId as string;
      const adminId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' ? ((req as AuthRequest).user as any).userId : null;
  
      const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
      if (adminUser?.role !== 'ADMIN') {
          res.status(403).json({ error: "Tylko administrator może blokować" }); return;
      }
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) { res.status(404).json({ error: "Nie znaleziono użytkownika" }); return; }
  
      await prisma.user.update({ where: { id: targetUserId }, data: { isBlocked: !targetUser.isBlocked } });
      res.json({ message: "Status blokady zmieniony!" });
    } catch (error) { res.status(500).json({ error: "Błąd zmiany blokady" }); }
});

export default router;