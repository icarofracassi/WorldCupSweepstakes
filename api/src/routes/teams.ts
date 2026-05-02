import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { calcShameIndex, calcSurpriseIndex, PHASE_FACTORS } from "../services/scoring";

const router = Router();

router.get("/", async (_req, res: Response) => {
  const teams = await prisma.team.findMany({ orderBy: { fifaRanking: "asc" } });
  res.json(teams);
});

router.post("/", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, code, fifaRanking, flagEmoji } = req.body;
  const isTop14 = Number(fifaRanking) <= 14;
  const team = await prisma.team.create({
    data: { name, code: code.toUpperCase(), fifaRanking: Number(fifaRanking), flagEmoji, isTop14 },
  });
  res.status(201).json(team);
});

router.patch("/:id/eliminate", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { eliminatedPhase } = req.body;

  if (!PHASE_FACTORS[eliminatedPhase]) {
    return res.status(400).json({ error: "Invalid phase" });
  }

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return res.status(404).json({ error: "Team not found" });

  const shameIndex = team.isTop14 ? calcShameIndex(team.fifaRanking, eliminatedPhase) : null;
  const surpriseIndex = !team.isTop14 ? calcSurpriseIndex(team.fifaRanking, eliminatedPhase) : null;

  const updated = await prisma.team.update({
    where: { id },
    data: { eliminatedPhase, shameIndex, surpriseIndex },
  });

  res.json(updated);
});

export default router;