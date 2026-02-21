import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
            ? ((req as AuthRequest).user as any).userId 
            : null;
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, isBlocked: true, nickname: true }
        });
        
        if (!user) {
            res.status(404).json({ error: "Nie znaleziono użytkownika" });
            return;
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: "Błąd serwera" });
    }
});

router.put('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
            ? ((req as AuthRequest).user as any).userId 
            : null;
        const { nickname } = req.body;

        if (!nickname || nickname.trim().length < 3) {
            res.status(400).json({ error: "Nick musi mieć co najmniej 3 znaki." });
            return;
        }

        const cleanNickname = nickname.trim();

        const existingUser = await prisma.user.findUnique({ where: { nickname: cleanNickname } });
        if (existingUser && existingUser.id !== userId) {
            res.status(409).json({ error: "Ten nick jest już zajęty. Wybierz inny." });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { nickname: cleanNickname },
            select: { id: true, email: true, role: true, isBlocked: true, nickname: true }
        });

        res.json({ message: "Profil zaktualizowany", user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Błąd aktualizacji profilu" });
    }
});

export default router;