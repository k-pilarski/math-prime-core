import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import PDFDocument from 'pdfkit';
import path from 'path';

const router = Router();

router.get('/:courseId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const userId = (req as AuthRequest).user && typeof (req as AuthRequest).user !== 'string' 
        ? ((req as AuthRequest).user as any).userId 
        : null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const course = await prisma.course.findUnique({ 
        where: { id: courseId },
        include: { lessons: true }
    });

    if (!user || !course) {
        res.status(404).json({ error: "Nie znaleziono użytkownika lub kursu." });
        return;
    }

    const progress = await prisma.userProgress.findMany({
        where: { userId, lesson: { courseId } }
    });

    const totalLessons = course.lessons.length;
    const completedLessons = progress.length;

    if (totalLessons === 0 || completedLessons < totalLessons) {
        res.status(403).json({ error: "Musisz ukończyć 100% lekcji, aby otrzymać certyfikat." });
        return;
    }

    const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 50
    });

    const fontPath = path.join(__dirname, '../../fonts/Roboto-Regular.ttf');
    doc.font(fontPath);

    const filename = `Certyfikat_${course.title.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#4f46e5');
    doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56).lineWidth(1).stroke('#4f46e5');

    doc.moveDown(2);

    doc.fontSize(45).fillColor('#1f2937').text('CERTYFIKAT UKOŃCZENIA', { align: 'center' });
    doc.moveDown(1.5);
    
    doc.fontSize(20).fillColor('#4b5563').text('Z dumą zaświadczamy, że', { align: 'center' });
    doc.moveDown(1);

    const studentName = user.nickname || user.email.split('@')[0];
    doc.fontSize(35).fillColor('#4f46e5').text(studentName, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(20).fillColor('#4b5563').text('pomyślnie ukończył(a) kurs:', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(25).fillColor('#111827').text(course.title, { align: 'center' });
    
    const date = new Date().toLocaleDateString('pl-PL');
    
    doc.fontSize(14).fillColor('#9ca3af').text(
        `Data wystawienia: ${date}`, 
        50,
        doc.page.height - 80,
        { 
            align: 'center', 
            width: doc.page.width - 100 
        }
    );

    doc.end();

  } catch (error) {
    console.error("Błąd PDF:", error);
    if (!res.headersSent) {
        res.status(500).json({ error: "Błąd generowania certyfikatu" });
    }
  }
});

export default router;