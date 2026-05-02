import axios from "axios";

const client = axios.create({
  baseURL: `https://${process.env.API_FOOTBALL_ENDPOINT}`,
  headers: {
    "x-apisports-key": process.env.API_FOOTBALL_KEY!,
  },
});

const WORLD_CUP_LEAGUE = 1;
const SEASON = 2026;

function mapPhase(round: string): string {
  if (round.includes("Group")) return "group";
  if (round.includes("32") || round.includes("Round of 32")) return "r16";
  if (round.includes("16") || round.includes("Round of 16")) return "r16";
  if (round.includes("Quarter")) return "qf";
  if (round.includes("Semi")) return "sf";
  if (round.includes("Final")) return "final";
  return "group";
}

export async function fetchAllFixtures() {
  const res = await client.get("/fixtures", {
    params: { league: WORLD_CUP_LEAGUE, season: SEASON },
  });
  return res.data.response.map((f: any) => ({
    externalId: f.fixture.id,
    matchDate: new Date(f.fixture.date),
    phase: mapPhase(f.league.round),
    teamAName: f.teams.home.name,
    teamBName: f.teams.away.name,
    status: f.fixture.status.short,
    scoreA: f.goals.home,
    scoreB: f.goals.away,
  }));
}

export async function fetchLiveScores() {
  const res = await client.get("/fixtures", {
    params: { league: WORLD_CUP_LEAGUE, season: SEASON, live: "all" },
  });
  return res.data.response.map((f: any) => ({
    externalId: f.fixture.id,
    scoreA: f.goals.home,
    scoreB: f.goals.away,
    status: f.fixture.status.short,
    elapsed: f.fixture.status.elapsed,
  }));
}

export async function fetchFinishedToday() {
  const today = new Date().toISOString().split("T")[0];
  const res = await client.get("/fixtures", {
    params: { league: WORLD_CUP_LEAGUE, season: SEASON, date: today, status: "FT" },
  });
  return res.data.response.map((f: any) => ({
    externalId: f.fixture.id,
    scoreA: f.goals.home,
    scoreB: f.goals.away,
  }));
}