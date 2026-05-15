import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import rateLimit from 'express-rate-limit';
import { prisma } from "../prisma";

export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 password reset requests per window
  message: {
    message: "Too many password reset attempts. Please try again after 15 minutes."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export interface AuthRequest extends Request {
  userId?: number;
  isAdmin?: boolean;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      isAdmin: boolean;
      tokenVersion?: number;
    };

    prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true, isAdmin: true },
    }).then((user) => {
      if (!user) return res.status(401).json({ error: "Invalid token" });

      const payloadTokenVersion = payload.tokenVersion ?? 0;
      if (payloadTokenVersion !== user.tokenVersion) {
        return res.status(401).json({ error: "Session expired" });
      }

      req.userId = payload.userId;
      req.isAdmin = user.isAdmin;
      next();
    }).catch(() => {
      res.status(401).json({ error: "Invalid token" });
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.isAdmin) return res.status(403).json({ error: "Admin only" });
  next();
}
