import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { fetchAllFixtures, fetchFinishedToday } from "../services/footballApi";
import { calcMatchPoints, PHASE_MULTIPLIERS } from "../services/scoring";

const router = Router();

// Bulk import matches manually (no API key needed)
// POST /api/sync/bulk
// Body: { matches: [{ teamACode, teamBCode, phase, matchDate }] }
router.post("/bulk", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { matches } = req.body;

  if (!Array.isArray(matches) || matches.length === 0) {
    return res.status(400).json({ error: "matches array required" });
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const m of matches) {
    const { teamACode, teamBCode, phase, matchDate } = m;

    const multiplier = PHASE_MULTIPLIERS[phase];
    if (!multiplier) {
      errors.push(`Invalid phase "${phase}" for ${teamACode} vs ${teamBCode}`);
      skipped++;
      continue;
    }

    const [teamA, teamB] = await Promise.all([
      prisma.team.findFirst({ where: { code: teamACode.toUpperCase() } }),
      prisma.team.findFirst({ where: { code: teamBCode.toUpperCase() } }),
    ]);

    if (!teamA) { errors.push(`Team not found: ${teamACode}`); skipped++; continue; }
    if (!teamB) { errors.push(`Team not found: ${teamBCode}`); skipped++; continue; }

    await prisma.match.create({
      data: {
        teamAId: teamA.id,
        teamBId: teamB.id,
        phase,
        phaseMultiplier: multiplier,
        matchDate: new Date(matchDate),
      },
    });
    created++;
  }

  res.json({ ok: true, created, skipped, errors });
});

// Import from API-Football
router.post("/fixtures", authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const fixtures = await fetchAllFixtures();
    let created = 0;
    let skipped = 0;

  for (const fix of fixtures) {
    // Safe lookup — handle null tla from API
    //console.log(`Processing: ${fix.teamAName} (${fix.teamACode}) vs ${fix.teamBName} (${fix.teamBCode})`);
    const teamAWhere = fix.teamACode
      ? { OR: [{ code: fix.teamACode }, { name: { contains: fix.teamAName, mode: "insensitive" as const } }] }
      : { name: { contains: fix.teamAName, mode: "insensitive" as const } };

    const teamBWhere = fix.teamBCode
      ? { OR: [{ code: fix.teamBCode }, { name: { contains: fix.teamBName, mode: "insensitive" as const } }] }
      : { name: { contains: fix.teamBName, mode: "insensitive" as const } };

    const teamA = await prisma.team.findFirst({ where: teamAWhere });
    const teamB = await prisma.team.findFirst({ where: teamBWhere });

    if (!teamA || !teamB) {
      console.warn(`Teams not found: ${fix.teamAName} (${fix.teamACode}) vs ${fix.teamBName} (${fix.teamBCode})`);
      skipped++;
      continue;
    }

    await prisma.match.upsert({
      where: { externalId: fix.externalId },
      update: { matchDate: fix.matchDate, groupName: fix.groupName },
      create: {
        externalId: fix.externalId,
        teamAId: teamA!.id,
        teamBId: teamB!.id,
        phase: fix.phase,
        groupName: fix.groupName,
        phaseMultiplier: PHASE_MULTIPLIERS[fix.phase] ?? 1.0,
        matchDate: fix.matchDate,
      },
    });
    created++;
  }

    res.json({ ok: true, created, skipped, total: fixtures.length });
  } catch (err: any) {
    res.status(500).json({ error: "API-Football request failed", detail: err.message });
  }
});

// Auto-score finished matches from API-Football
router.post("/results", authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ error: "API-Football request failed", detail: err.message });
  }
});

export default router;