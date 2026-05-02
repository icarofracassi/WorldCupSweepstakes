import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { PRE_CUP_POINTS } from "../services/scoring";

const router = Router();

router.get("/mine", authMiddleware, async (req: AuthRequest, res: Response) => {
  const pick = await prisma.preCupPick.findUnique({
    where: { userId: req.userId },
    include: { champion: true, shameTeam: true, surpriseTeam: true },
  });
  res.json(pick);
});

router.get("/", authMiddleware, adminMiddleware, async (_req, res: Response) => {
  const picks = await prisma.preCupPick.findMany({
    include: {
      user: { select: { id: true, name: true } },
      champion: true,
      shameTeam: true,
      surpriseTeam: true,
    },
  });
  res.json(picks);
});

router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { championId, shameTeamId, surpriseTeamId } = req.body;

  if (!championId || !shameTeamId || !surpriseTeamId) {
    return res.status(400).json({ error: "championId, shameTeamId, surpriseTeamId required" });
  }

  const [champion, shameTeam, surpriseTeam] = await Promise.all([
    prisma.team.findUnique({ where: { id: Number(championId) } }),
    prisma.team.findUnique({ where: { id: Number(shameTeamId) } }),
    prisma.team.findUnique({ where: { id: Number(surpriseTeamId) } }),
  ]);

  if (!champion || !shameTeam || !surpriseTeam) {
    return res.status(404).json({ error: "One or more teams not found" });
  }
  if (!shameTeam.isTop14) {
    return res.status(400).json({ error: "Shame team must be in FIFA top 14" });
  }
  if (surpriseTeam.isTop14) {
    return res.status(400).json({ error: "Surprise team must be outside FIFA top 14" });
  }

  const pick = await prisma.preCupPick.upsert({
    where: { userId: req.userId },
    update: { championId: Number(championId), shameTeamId: Number(shameTeamId), surpriseTeamId: Number(surpriseTeamId) },
    create: { userId: req.userId!, championId: Number(championId), shameTeamId: Number(shameTeamId), surpriseTeamId: Number(surpriseTeamId) },
    include: { champion: true, shameTeam: true, surpriseTeam: true },
  });

  res.json(pick);
});

router.post("/finalize", authMiddleware, adminMiddleware, async (_req, res: Response) => {
  const champion = await prisma.team.findFirst({ where: { eliminatedPhase: "champion" } });
  const shameWinner = await prisma.team.findFirst({
    where: { isTop14: true, shameIndex: { not: null } },
    orderBy: { shameIndex: "asc" },
  });
  const surpriseWinner = await prisma.team.findFirst({
    where: { isTop14: false, surpriseIndex: { not: null } },
    orderBy: { surpriseIndex: "desc" },
  });

  const allPicks = await prisma.preCupPick.findMany();
  let scored = 0;

  for (const pick of allPicks) {
    let pts = 0;
    if (champion && pick.championId === champion.id) pts += PRE_CUP_POINTS.champion;
    if (shameWinner && pick.shameTeamId === shameWinner.id) pts += PRE_CUP_POINTS.shame;
    if (surpriseWinner && pick.surpriseTeamId === surpriseWinner.id) pts += PRE_CUP_POINTS.surprise;
    await prisma.preCupPick.update({ where: { id: pick.id }, data: { pointsEarned: pts } });
    scored++;
  }

  res.json({
    ok: true,
    champion: champion?.name,
    shameWinner: shameWinner?.name,
    shameIndex: shameWinner?.shameIndex,
    surpriseWinner: surpriseWinner?.name,
    surpriseIndex: surpriseWinner?.surpriseIndex,
    picksScored: scored,
  });
});

export default router;