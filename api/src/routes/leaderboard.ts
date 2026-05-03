import { Router, Request, Response } from "express";
import { prisma } from "../prisma";

const router = Router();

// CSV export for Power BI — must be BEFORE "/" to avoid route conflicts
router.get("/export.csv", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    include: {
      predictions: { select: { pointsEarned: true } },
      preCupPick: { select: { pointsEarned: true } },
    },
  });

  const rows = users.map((u) => {
    const matchPoints = u.predictions.reduce((s: number, p: any) => s + p.pointsEarned, 0);
    const preCupPoints = u.preCupPick?.pointsEarned ?? 0;
    return `${u.id},"${u.name}",${matchPoints.toFixed(2)},${preCupPoints.toFixed(2)},${(matchPoints + preCupPoints).toFixed(2)}`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=leaderboard.csv");
  res.send(["id,name,matchPoints,preCupPoints,total", ...rows].join("\n"));
});

router.get("/", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    include: {
      predictions: { select: { pointsEarned: true, matchId: true } },
      preCupPick: {
        select: {
          pointsEarned: true,
          championId: true,
          shameTeamId: true,
          surpriseTeamId: true,
          champion: { select: { name: true, flagEmoji: true, code: true} },
          shameTeam: { select: { name: true, flagEmoji: true, code: true } },
          surpriseTeam: { select: { name: true, flagEmoji: true, code: true } },
        },
      },
    },
  });

  const board = users
    .map((u) => {
      const matchPoints = u.predictions.reduce((s: number, p: any) => s + p.pointsEarned, 0);
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
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  res.json(board);
});

export default router;