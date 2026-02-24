import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/:lessonId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const lessonId = req.params.lessonId as string;
        const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
            ? ((req as AuthRequest).user as any).userId 
            : null;

        const note = await prisma.note.findUnique({
            where: { 
                userId_lessonId: { userId, lessonId } 
            }
        });

        res.json({ text: note?.text || "" });
    } catch (error) {
        res.status(500).json({ error: "Błąd pobierania notatki" });
    }
});

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
            ? ((req as AuthRequest).user as any).userId 
            : null;
        const { lessonId, text } = req.body;

        if (!lessonId) {
            res.status(400).json({ error: "Brak ID lekcji" });
            return;
        }

        const note = await prisma.note.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            update: { text },
            create: { userId, lessonId, text }
        });

        res.json({ message: "Notatka zapisana", text: note.text });
    } catch (error) {
        console.error("Błąd zapisu:", error);
        res.status(500).json({ error: "Błąd zapisywania notatki" });
    }
});

export default router;