import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/mine", authMiddleware, async (req: AuthRequest, res: Response) => {
  const predictions = await prisma.prediction.findMany({
    where: { userId: req.userId },
    include: { match: { include: { teamA: true, teamB: true } } },
    orderBy: { match: { matchDate: "asc" } },
  });
  res.json(predictions);
});

// Get predictions for a match — scoped to league if leagueId provided
router.get("/match/:matchId", authMiddleware, async (req: AuthRequest, res: Response) => {
  const matchId = Number(req.params.matchId);
  const { leagueId } = req.query;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return res.status(404).json({ error: "Match not found" });

  // Only show predictions for started matches (unless admin)
  const isStarted = new Date() >= match.matchDate;
  if (!isStarted && !req.isAdmin) {
    return res.json([]);
  }

  let userIds: number[] | undefined;
  if (leagueId) {
    const parsedLeagueId = Number(leagueId);
    if (!Number.isInteger(parsedLeagueId)) return res.status(400).json({ error: "leagueId must be an integer" });

    const league = await prisma.league.findUnique({
      where: { id: parsedLeagueId },
      include: { members: { select: { id: true } } },
    });
    if (!league) return res.status(404).json({ error: "League not found" });
    const isMember = league.members.some((m) => m.id === req.userId);
    if (!isMember && !req.isAdmin) return res.status(403).json({ error: "Forbidden" });
    userIds = league.members.map((m) => m.id);
  }

  const predictions = await prisma.prediction.findMany({
    where: {
      matchId,
      ...(userIds ? { userId: { in: userIds } } : {}),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  res.json(predictions);
});

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
