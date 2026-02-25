import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const router = Router();

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Podaj adres e-mail.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.json({ message: 'Jeśli e-mail istnieje w naszej bazie, wysłaliśmy na niego link do resetu hasła.' });
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = new Date(Date.now() + 3600000); 

        await prisma.user.update({
            where: { id: user.id },
            data: { resetPasswordToken: resetToken, resetPasswordExpires }
        });

        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        console.log('\n--- 📧 WIRTUALNY E-MAIL ---');
        console.log(`Do: ${user.email}`);
        console.log(`Temat: Reset hasła`);
        console.log(`Kliknij w link, aby zresetować hasło: \n${resetLink}`);
        console.log('---------------------------\n');

        res.json({ message: 'Jeśli e-mail istnieje w naszej bazie, wysłaliśmy na niego link do resetu hasła.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera przy zgłoszeniu hasła' });
    }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword || newPassword.length < 6) {
            res.status(400).json({ error: 'Brak tokenu lub hasło jest za krótkie (min. 6 znaków).' });
            return;
        }

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) {
            res.status(400).json({ error: 'Link do resetu hasła jest nieprawidłowy lub wygasł.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        res.json({ message: 'Hasło zostało pomyślnie zmienione! Możesz się teraz zalogować.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd serwera przy zmianie hasła' });
    }
});

export default router;