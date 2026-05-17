import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// Get all users with stats
router.get("/users", authMiddleware, adminMiddleware, async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      predictions: { select: { id: true, pointsEarned: true } },
      preCupPick: { select: { pointsEarned: true } },
      leagues: { select: { id: true, name: true } },
      _count: { select: { predictions: true } },
    },
  });

  const result = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
    predictionsCount: u._count.predictions,
    totalPoints: parseFloat(
      (
        u.predictions.reduce((s, p) => s + p.pointsEarned, 0) +
        (u.preCupPick?.pointsEarned ?? 0)
      ).toFixed(2)
    ),
    hasPrecupPick: !!u.preCupPick,
    leagues: u.leagues,
  }));

  res.json(result);
});

// Delete a user (cascades predictions + preCupPick)
router.delete("/users/:id", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);

  if (id === req.userId) {
    return res.status(400).json({ error: "Você não pode deletar sua própria conta" });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  // Delete in correct order to respect FK constraints
  await prisma.prediction.deleteMany({ where: { userId: id } });
  await prisma.preCupPick.deleteMany({ where: { userId: id } });

  // Disconnect from leagues (don't delete the leagues themselves)
  await prisma.user.update({
    where: { id },
    data: { leagues: { set: [] } },
  });

  // Transfer created leagues to admin before deleting
  await prisma.league.updateMany({
    where: { createdById: id },
    data: { createdById: req.userId! },
  });

  await prisma.user.delete({ where: { id } });

  res.json({ ok: true, deletedId: id });
});

// Toggle admin status
router.patch("/users/:id/admin", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);

  if (id === req.userId) {
    return res.status(400).json({ error: "Você não pode alterar seu próprio status de admin" });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const updated = await prisma.user.update({
    where: { id },
    data: { isAdmin: !user.isAdmin },
    select: { id: true, name: true, isAdmin: true },
  });

  res.json(updated);
});

// Reset a user's predictions for a specific match (useful for data corrections)
router.delete("/users/:id/predictions", authMiddleware, adminMiddleware, async (_req, res: Response) => {
  const id = Number(_req.params.id);
  const deleted = await prisma.prediction.deleteMany({ where: { userId: id } });
  res.json({ ok: true, deleted: deleted.count });
});

export default router;