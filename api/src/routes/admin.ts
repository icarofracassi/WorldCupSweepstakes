import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const parseUserIdParam = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Get all users with stats
router.get("/users", authMiddleware, adminMiddleware, async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      preCupPick: { select: { pointsEarned: true } },
      leagues: { select: { id: true, name: true } },
      _count: { select: { predictions: true } },
    },
  });
  const predictionTotals = await prisma.prediction.groupBy({
    by: ["userId"],
    _sum: { pointsEarned: true },
  });
  const predictionTotalByUser = new Map(
    predictionTotals.map((item) => [item.userId, item._sum.pointsEarned ?? 0])
  );

  const result = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
    predictionsCount: u._count.predictions,
    totalPoints: parseFloat(
      (
        (predictionTotalByUser.get(u.id) ?? 0) +
        (u.preCupPick?.pointsEarned ?? 0)
      ).toFixed(2)
    ),
    hasPrecupPick: !!u.preCupPick,
    leagues: u.leagues,
  }));

  res.json(result);
});

// Delete a user (cascades predictions + preCupPick + password reset tokens)
router.delete("/users/:id", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseUserIdParam(req.params.id);
  if (!id) return res.status(400).json({ error: "ID de usuário inválido" });

  if (id === req.userId) {
    return res.status(400).json({ error: "Você não pode deletar sua própria conta" });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  // Delete in correct order to respect FK constraints
  await prisma.prediction.deleteMany({ where: { userId: id } });
  await prisma.preCupPick.deleteMany({ where: { userId: id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: id } });

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
  const id = parseUserIdParam(req.params.id);
  if (!id) return res.status(400).json({ error: "ID de usuário inválido" });

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

// Reset all predictions from a user (useful for data corrections)
router.delete("/users/:id/predictions", authMiddleware, adminMiddleware, async (req, res: Response) => {
  const id = parseUserIdParam(req.params.id);
  if (!id) return res.status(400).json({ error: "ID de usuário inválido" });

  const deleted = await prisma.prediction.deleteMany({ where: { userId: id } });
  res.json({ ok: true, deleted: deleted.count });
});

export default router;
