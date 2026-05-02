import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

const SECRET = process.env.JWT_SECRET!;

router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash: hash },
    });
    const token = jwt.sign(
      { userId: user.id, isAdmin: user.isAdmin },
      SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    });
  } catch {
    res.status(400).json({ error: "Email already in use" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign(
    { userId: user.id, isAdmin: user.isAdmin },
    SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
  });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
  });
  res.json(user);
});

export default router;