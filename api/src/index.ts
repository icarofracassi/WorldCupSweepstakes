import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import teamsRoutes from "./routes/teams";
import matchesRoutes from "./routes/matches";
import predictionsRoutes from "./routes/predictions";
import preCupRoutes from "./routes/preCup";
import leaderboardRoutes from "./routes/leaderboard";
import syncRoutes from "./routes/sync";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/predictions", predictionsRoutes);
app.use("/api/precup", preCupRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/sync", syncRoutes);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`🚀 Bolão API running on http://localhost:${PORT}`);
});