import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
            ? ((req as AuthRequest).user as any).userId 
            : null;
        
        if (!userId) {
            res.status(401).json({ error: "Brak autoryzacji" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        if (user?.role !== 'ADMIN') {
            res.status(403).json({ error: "Brak uprawnień administratora. Dostęp zabroniony." });
            return;
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: "Błąd autoryzacji" });
    }
};

router.get('/stats', authenticateToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
        const totalCourses = await prisma.course.count();
        const totalPurchases = await prisma.purchase.count();

        const recentUsers = await prisma.user.findMany({
            where: { role: 'USER' },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, email: true, nickname: true, createdAt: true }
        });

        res.json({
            totalUsers,
            totalCourses,
            totalPurchases,
            recentUsers
        });
    } catch (error) {
        console.error("Błąd statystyk:", error);
        res.status(500).json({ error: "Błąd pobierania statystyk" });
    }
});

export default router;