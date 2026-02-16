import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/adminMiddleware';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    cb(null, safeName + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

router.post('/', authenticateToken, isAdmin, upload.single('file'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Nie przesłano pliku" });
      return;
    }

    const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    res.json({ 
      url: fileUrl, 
      name: req.file.originalname 
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Błąd zapisu pliku" });
  }
});

export default router;