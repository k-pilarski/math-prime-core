import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import courseRoutes from './routes/courses';
import purchaseRoutes from './routes/purchases';
import uploadRoutes from './routes/upload';
import progressRoutes from './routes/progress';
import path from 'path';
import commentsRoutes from './routes/comments';
import certificatesRoutes from './routes/certificates';
import notesRoutes from './routes/notes';
import passwordResetRoutes from './routes/passwordReset';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/progress', progressRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/comments', commentsRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/password-reset', passwordResetRoutes);

app.listen(port, () => {
  console.log(`🚀 The server is running on http://localhost:${port}`);
});