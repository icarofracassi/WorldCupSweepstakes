import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { calcMatchPoints, PHASE_MULTIPLIERS } from "../services/scoring";

const router = Router();

// Get all matches (with teams), optionally filtered by phase
router.get("/", async (req, res: Response) => {
  const { phase } = req.query;
  const matches = await prisma.match.findMany({
    where: phase ? { phase: String(phase) } : undefined,
    include: {
      teamA: true,
      teamB: true,
    },
    orderBy: { matchDate: "asc" },
  });
  res.json(matches);
});

// Get single match
router.get("/:id", async (req, res: Response) => {
  const match = await prisma.match.findUnique({
    where: { id: Number(req.params.id) },
    include: { teamA: true, teamB: true, predictions: { include: { user: { select: { id: true, name: true } } } } },
  });
  if (!match) return res.status(404).json({ error: "Not found" });
  res.json(match);
});

// Admin: create match
router.post("/", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { teamAId, teamBId, phase, matchDate } = req.body;

  const multiplier = PHASE_MULTIPLIERS[phase];
  if (!multiplier) return res.status(400).json({ error: "Invalid phase" });

  const match = await prisma.match.create({
    data: {
      teamAId: Number(teamAId),
      teamBId: Number(teamBId),
      phase,
      phaseMultiplier: multiplier,
      matchDate: new Date(matchDate),
    },
    include: { teamA: true, teamB: true },
  });
  res.status(201).json(match);
});

// Admin: finalize match — enter real scores and compute all points
router.post(
  "/:id/finalize",
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const { scoreAReal, scoreBReal } = req.body;

    if (scoreAReal === undefined || scoreBReal === undefined) {
      return res.status(400).json({ error: "scoreAReal and scoreBReal required" });
    }

    const match = await prisma.match.update({
      where: { id },
      data: {
        scoreAReal: Number(scoreAReal),
        scoreBReal: Number(scoreBReal),
        isFinished: true,
      },
      include: { predictions: true },
    });

    // Score all predictions for this match
    let updated = 0;
    for (const pred of match.predictions) {
      const pts = calcMatchPoints(
        pred.scoreA,
        pred.scoreB,
        match.scoreAReal!,
        match.scoreBReal!,
        match.phaseMultiplier
      );
      await prisma.prediction.update({
        where: { id: pred.id },
        data: { pointsEarned: pts },
      });
      updated++;
    }

    res.json({ ok: true, matchId: id, predictionsScored: updated });
  }
);

export default router;