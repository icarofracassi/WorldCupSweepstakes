import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { fetchAllFixtures, fetchFinishedToday } from "../services/footballApi";
import { calcMatchPoints, PHASE_MULTIPLIERS } from "../services/scoring";

const router = Router();

router.post("/fixtures", authMiddleware, adminMiddleware, async (_req, res: Response) => {
  const fixtures = await fetchAllFixtures();
  let created = 0;
  let skipped = 0;

  for (const fix of fixtures) {
    const teamA = await prisma.team.findFirst({
      where: { name: { contains: fix.teamAName, mode: "insensitive" } },
    });
    const teamB = await prisma.team.findFirst({
      where: { name: { contains: fix.teamBName, mode: "insensitive" } },
    });

    if (!teamA || !teamB) {
      console.warn(`Teams not found: ${fix.teamAName} vs ${fix.teamBName}`);
      skipped++;
      continue;
    }

    await prisma.match.upsert({
      where: { externalId: fix.externalId },
      update: { matchDate: fix.matchDate },
      create: {
        externalId: fix.externalId,
        teamAId: teamA.id,
        teamBId: teamB.id,
        phase: fix.phase,
        phaseMultiplier: PHASE_MULTIPLIERS[fix.phase] ?? 1.0,
        matchDate: fix.matchDate,
      },
    });
    created++;
  }

  res.json({ ok: true, created, skipped, total: fixtures.length });
});

router.post("/results", authMiddleware, adminMiddleware, async (_req, res: Response) => {
  const finished = await fetchFinishedToday();
  let scored = 0;

  for (const result of finished) {
    if (result.scoreA === null || result.scoreB === null) continue;

    const match = await prisma.match.findUnique({
      where: { externalId: result.externalId },
      include: { predictions: true },
    });

    if (!match || match.isFinished) continue;

    await prisma.match.update({
      where: { id: match.id },
      data: { scoreAReal: result.scoreA, scoreBReal: result.scoreB, isFinished: true },
    });

    for (const pred of match.predictions) {
      const pts = calcMatchPoints(
        pred.scoreA, pred.scoreB,
        result.scoreA, result.scoreB,
        match.phaseMultiplier
      );
      await prisma.prediction.update({ where: { id: pred.id }, data: { pointsEarned: pts } });
    }
    scored++;
  }

  res.json({ ok: true, matchesScored: scored });
});

export default router;