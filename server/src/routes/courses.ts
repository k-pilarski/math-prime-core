import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

const createCourseSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki"),
  description: z.string().optional(),
  price: z.number().min(0, "Cena nie może być ujemna").optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(courses);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: 'Nie udało się pobrać kursów.' });
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price } = createCourseSchema.parse(req.body);

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price,
        isPublished: false,
      },
    });

    res.status(201).json({
      message: 'Kurs został utworzony pomyślnie',
      course,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    
    console.error("Create course error:", error);
    res.status(500).json({ error: 'Wystąpił błąd serwera przy tworzeniu kursu.' });
  }
});

export default router;