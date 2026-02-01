import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

const createCourseSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
});

const createLessonSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  position: z.number().int(),
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
        lessons: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!course) {
      res.status(404).json({ error: "Kurs nie został znaleziony" });
      return;
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
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

router.post('/:id/lessons', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string; 
    
    const { title, description, videoUrl, position } = createLessonSchema.parse(req.body);

    const courseExists = await prisma.course.findUnique({ where: { id } });
    if (!courseExists) {
      res.status(404).json({ error: "Kurs nie istnieje" });
      return;
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        videoUrl,
        position,
        courseId: id
      }
    });

    res.status(201).json({ message: "Lekcja dodana", lesson });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.log(error);
    res.status(500).json({ error: 'Błąd serwera przy dodawaniu lekcji' });
  }
});

export default router;