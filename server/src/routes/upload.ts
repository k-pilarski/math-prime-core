import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/adminMiddleware';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', authenticateToken, isAdmin, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Nie przesłano pliku" });
      return;
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "mathprime_courses", 
    });

    res.json({ url: result.secure_url });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Błąd przesyłania zdjęcia" });
  }
});

export default router;