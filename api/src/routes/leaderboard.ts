import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    include: {
      predictions: { select: { pointsEarned: true } },
      preCupPick: { select: { pointsEarned: true } },
    },
  });

  const board = users.map((u) => ({
    id: u.id,
    name: u.name,
    matchPoints: u.predictions.reduce((s, p) => s + p.pointsEarned, 0),
    preCupPoints: u.preCupPick?.pointsEarned ?? 0,
    total: u.predictions.reduce((s, p) => s + p.pointsEarned, 0) + (u.preCupPick?.pointsEarned ?? 0),
  })).sort((a, b) => b.total - a.total);

  res.json(board);
});

export default router;