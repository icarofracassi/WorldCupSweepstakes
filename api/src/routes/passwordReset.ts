import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { sendPasswordResetEmail } from '../services/emailService';
import { passwordResetLimiter } from '../middleware/auth';

const router = Router();

// POST /api/auth/forgot-password
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  const { email } = req.body;
  const genericResponse = {
    message: 'Se este email estiver cadastrado, você receberá as instruções em breve.'
  };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { userId: user.id, token: tokenHash, expiresAt },
      });

      await sendPasswordResetEmail(user.email, user.name, rawToken);
    }
  } catch (error) {
    console.error('Password reset request failed:', error);
  }

  return res.json(genericResponse);
});

// POST /api/auth/reset-password
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date();

  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      token: tokenHash,
      used: false,
      expiresAt: { gt: now },
    },
    select: { id: true, userId: true },
  });

  if (!tokenRecord) {
    return res.status(400).json({ error: 'Link inválido ou expirado.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const resetApplied = await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: {
        id: tokenRecord.id,
        token: tokenHash,
        used: false,
        expiresAt: { gt: now },
      },
      data: { used: true },
    });

    if (consumed.count !== 1) return false;

    await tx.user.update({
      where: { id: tokenRecord.userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    return true;
  });

  if (!resetApplied) {
    return res.status(400).json({ error: 'Link inválido ou expirado.' });
  }

  res.json({ message: 'Senha redefinida com sucesso!' });
});

export default router;
