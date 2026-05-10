import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// Generate a random 6-char invite code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Get all leagues (for browsing)
router.get("/", authMiddleware, async (_req, res: Response) => {
  const leagues = await prisma.league.findMany({
    include: {
      _count: { select: { members: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(leagues);
});

// Get my leagues
router.get("/mine", authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      leagues: {
        include: {
          _count: { select: { members: true } },
          createdBy: { select: { name: true } },
        },
      },
    },
  });
  res.json(user?.leagues ?? []);
});

// Get league by invite code
router.get("/code/:code", authMiddleware, async (req: AuthRequest, res: Response) => {
  const league = await prisma.league.findUnique({
    where: { code: req.params.code.toUpperCase() },
    include: {
      _count: { select: { members: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!league) return res.status(404).json({ error: "Liga não encontrada com esse código" });
  res.json(league);
});

// Get single league with members + leaderboard
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      members: {
        select: {
          id: true,
          name: true,
          predictions: { select: { pointsEarned: true } },
          preCupPick: {
            select: {
              pointsEarned: true,
              champion: { select: { name: true, code: true, flagEmoji: true } },
              shameTeam: { select: { name: true, code: true, flagEmoji: true } },
              surpriseTeam: { select: { name: true, code: true, flagEmoji: true } },
            },
          },
        },
      },
    },
  });

  if (!league) return res.status(404).json({ error: "League not found" });

  // Build leaderboard for this league
  const leaderboard = league.members
    .map((u) => {
      const matchPoints = u.predictions.reduce((s, p) => s + p.pointsEarned, 0);
      const preCupPoints = u.preCupPick?.pointsEarned ?? 0;
      return {
        id: u.id,
        name: u.name,
        matchPoints: parseFloat(matchPoints.toFixed(2)),
        preCupPoints: parseFloat(preCupPoints.toFixed(2)),
        total: parseFloat((matchPoints + preCupPoints).toFixed(2)),
        hasPrecupPick: !!u.preCupPick,
        preCupPick: u.preCupPick ?? null,
      };
    })
    .sort((a, b) => b.total - a.total)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  res.json({ ...league, leaderboard });
});

// Create a league
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });

  // Generate unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const exists = await prisma.league.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCode();
    attempts++;
  }

  const league = await prisma.league.create({
    data: {
      name: name.trim(),
      code,
      createdById: req.userId!,
      members: { connect: { id: req.userId } },
    },
    include: {
      _count: { select: { members: true } },
      createdBy: { select: { name: true } },
    },
  });

  res.status(201).json(league);
});

// Join a league by code
router.post("/join", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  if (!code?.trim()) return res.status(400).json({ error: "code is required" });

  const league = await prisma.league.findUnique({
    where: { code: code.toUpperCase().trim() },
    include: { members: { select: { id: true } } },
  });

  if (!league) return res.status(404).json({ error: "Liga não encontrada com esse código" });

  const alreadyMember = league.members.some((m) => m.id === req.userId);
  if (alreadyMember) return res.status(400).json({ error: "Você já faz parte desta liga" });

  const updated = await prisma.league.update({
    where: { id: league.id },
    data: { members: { connect: { id: req.userId } } },
    include: {
      _count: { select: { members: true } },
      createdBy: { select: { name: true } },
    },
  });

  res.json(updated);
});

// Leave a league
router.post("/:id/leave", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return res.status(404).json({ error: "League not found" });
  if (league.createdById === req.userId) {
    return res.status(400).json({ error: "O criador não pode sair da liga" });
  }

  await prisma.league.update({
    where: { id },
    data: { members: { disconnect: { id: req.userId } } },
  });

  res.json({ ok: true });
});

// Delete a league (creator or app admin only)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return res.status(404).json({ error: "League not found" });
  if (league.createdById !== req.userId && !req.isAdmin) {
    return res.status(403).json({ error: "Apenas o criador pode excluir esta liga" });
  }

  await prisma.league.delete({ where: { id } });

  res.json({ ok: true });
});

export default router;
