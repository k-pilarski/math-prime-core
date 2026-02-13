import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/adminMiddleware';

const router = Router();

const createCourseSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
});

const createLessonSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  position: z.number().int(),
  type: z.enum(['VIDEO', 'TEXT']).default('VIDEO'),
  videoUrl: z.string().optional(),
  content: z.string().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania kursów' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { position: 'asc' } }
      }
    });

    if (!course) {
      res.status(404).json({ error: "Kurs nie został znaleziony" });
      return;
    }
    res.json(course);
  } catch (error) {
    console.error("Błąd pobierania kursu:", error); 
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.post('/', authenticateToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price } = createCourseSchema.parse(req.body);
    const course = await prisma.course.create({
      data: { title, description, price, isPublished: false },
    });
    res.status(201).json({ message: 'Kurs utworzony', course });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.post('/:id/lessons', authenticateToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, videoUrl, position, type, content } = createLessonSchema.parse(req.body);

    const courseExists = await prisma.course.findUnique({ where: { id } });
    if (!courseExists) {
      res.status(404).json({ error: "Kurs nie istnieje" });
      return;
    }

    const lesson = await prisma.lesson.create({
      data: {
        title, description, position, courseId: id,
        type, videoUrl, content
      }
    });

    res.status(201).json({ message: "Lekcja dodana", lesson });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Błąd dodawania lekcji' });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, price } = req.body; 

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { 
        title, 
        description, 
        price: Number(price) 
      }
    });

    res.json({ message: "Kurs zaktualizowany", course: updatedCourse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd edycji kursu" });
  }
});

router.put('/:courseId/lessons/:lessonId', authenticateToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.lessonId as string;
    const { title, description, videoUrl, content, type, position } = req.body;

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title,
        description,
        videoUrl,
        content,
        type,
        position: Number(position)
      }
    });

    res.json({ message: "Lekcja zaktualizowana", lesson: updatedLesson });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd edycji lekcji" });
  }
});

router.delete('/:courseId/lessons/:lessonId', authenticateToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.lessonId as string;
    
    await prisma.lesson.delete({ where: { id: lessonId } });
    res.json({ message: "Lekcja usunięta" });
  } catch (error) {
    res.status(500).json({ error: "Błąd usuwania lekcji" });
  }
});

export default router;