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

  // Always return 200 — never reveal if email exists (security)
  const genericResponse = res.json({
    message: 'Se este email estiver cadastrado, você receberá as instruções em breve.'
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericResponse;

  // Invalidate any existing tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  // Create new token (expires in 1 hour)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token: rawToken, expiresAt },
  });

  await sendPasswordResetEmail(user.email, user.name, rawToken);

  return genericResponse;
});

// POST /api/auth/reset-password
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.used || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Link inválido ou expirado.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  res.json({ message: 'Senha redefinida com sucesso!' });
});

export default router;