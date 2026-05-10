import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// Get my predictions
router.get("/mine", authMiddleware, async (req: AuthRequest, res: Response) => {
  const predictions = await prisma.prediction.findMany({
    where: { userId: req.userId },
    include: {
      match: { include: { teamA: true, teamB: true } },
    },
    orderBy: { match: { matchDate: "asc" } },
  });
  res.json(predictions);
});

// Get predictions for a specific match
router.get("/match/:matchId", authMiddleware, async (req: AuthRequest, res: Response) => {
  const matchId = Number(req.params.matchId);
  const where = req.isAdmin ? { matchId } : { matchId, userId: req.userId };
  const predictions = await prisma.prediction.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
  });
  res.json(predictions);
});

// Submit or update prediction — locked after match starts
router.post("/:matchId", authMiddleware, async (req: AuthRequest, res: Response) => {
  const matchId = Number(req.params.matchId);
  const { scoreA, scoreB } = req.body;

  if (scoreA === undefined || scoreB === undefined || scoreA < 0 || scoreB < 0) {
    return res.status(400).json({ error: "Valid scoreA and scoreB required" });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return res.status(404).json({ error: "Match not found" });

  if (new Date() >= match.matchDate) {
    return res.status(403).json({ error: "Predictions are locked — match already started" });
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: req.userId!, matchId } },
    update: { scoreA: Number(scoreA), scoreB: Number(scoreB) },
    create: { userId: req.userId!, matchId, scoreA: Number(scoreA), scoreB: Number(scoreB) },
  });

  res.json(prediction);
});

export default router;