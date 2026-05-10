import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/export.csv", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { leagueId } = req.query;

  let userIds: number[] | undefined;
  if (leagueId) {
    const league = await prisma.league.findUnique({
      where: { id: Number(leagueId) },
      include: { members: { select: { id: true } } },
    });
    userIds = league?.members.map((m) => m.id);
  }

  const users = await prisma.user.findMany({
    where: {
      isAdmin: false,
      ...(userIds ? { id: { in: userIds } } : {}),
    },
    include: {
      predictions: { select: { pointsEarned: true } },
      preCupPick: { select: { pointsEarned: true } },
    },
  });

  const rows = users.map((u) => {
    const matchPoints = u.predictions.reduce((s, p) => s + p.pointsEarned, 0);
    const preCupPoints = u.preCupPick?.pointsEarned ?? 0;
    return `${u.id},"${u.name}",${matchPoints.toFixed(2)},${preCupPoints.toFixed(2)},${(matchPoints + preCupPoints).toFixed(2)}`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=leaderboard.csv");
  res.send(["id,name,matchPoints,preCupPoints,total", ...rows].join("\n"));
});

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { leagueId } = req.query;

  let userIds: number[] | undefined;
  if (leagueId) {
    const league = await prisma.league.findUnique({
      where: { id: Number(leagueId) },
      include: { members: { select: { id: true } } },
    });
    userIds = league?.members.map((m) => m.id);
  }

  const users = await prisma.user.findMany({
    where: {
      isAdmin: false,
      ...(userIds ? { id: { in: userIds } } : {}),
    },
    include: {
      predictions: { select: { pointsEarned: true, matchId: true } },
      preCupPick: {
        select: {
          pointsEarned: true,
          champion: { select: { name: true, flagEmoji: true, code: true } },
          shameTeam: { select: { name: true, flagEmoji: true, code: true } },
          surpriseTeam: { select: { name: true, flagEmoji: true, code: true } },
        },
      },
    },
  });

  const board = users
    .map((u) => {
      const matchPoints = u.predictions.reduce((s, p) => s + p.pointsEarned, 0);
      const preCupPoints = u.preCupPick?.pointsEarned ?? 0;
      return {
        id: u.id,
        name: u.name,
        matchPoints: parseFloat(matchPoints.toFixed(2)),
        preCupPoints: parseFloat(preCupPoints.toFixed(2)),
        total: parseFloat((matchPoints + preCupPoints).toFixed(2)),
        predictionsCount: u.predictions.length,
        hasPrecupPick: u.preCupPick !== null,
        preCupPick: u.preCupPick ?? null,
      };
    })
    .sort((a, b) => b.total - a.total)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  res.json(board);
});

export default router;