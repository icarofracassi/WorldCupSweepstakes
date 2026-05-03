import axios from "axios";

const client = axios.create({
  baseURL: "https://api.football-data.org/v4",
  headers: {
    "X-Auth-Token": process.env.FOOTBALL_DATA_KEY!,
  },
});

const WC_ID = "WC";
const SEASON = 2026;

// Map football-data.org stage names → your internal phase keys
function mapPhase(stage: string): string {
  if (stage === "GROUP_STAGE") return "group";
  if (stage === "LAST_16" || stage === "ROUND_OF_16") return "r16";
  if (stage === "QUARTER_FINALS") return "qf";
  if (stage === "SEMI_FINALS") return "sf";
  if (stage === "FINAL") return "final";
  if (stage === "THIRD_PLACE") return "sf"; // treat 3rd place as sf phase
  return "group";
}

const TEAM_NAME_MAP: Record<string, string> = {
  "Brazil": "Brasil",
  "France": "França",
  "Netherlands": "Países Baixos",
  "Morocco": "Marrocos",
  "Uruguay": "Uruguai",
  "Belgium": "Bélgica",
  "Germany": "Alemanha",
  "Colombia": "Colômbia",
  "Croatia": "Croácia",
  "Switzerland": "Suíça",
  "Ecuador": "Equador",
  "South Korea": "Coreia do Sul",
  "Japan": "Japão",
  "Iran": "Irã",
  "Poland": "Polônia",
  "Serbia": "Sérvia",
  "Canada": "Canadá",
  "Chile": "Chile",
  "Cameroon": "Camarões",
  "Saudi Arabia": "Arábia Saudita",
  "Algeria": "Argélia",
  "Paraguay": "Paraguai",
  "New Zealand": "Nova Zelândia",
  "Egypt": "Egito",
  "Norway": "Noruega",
  "South Africa": "África do Sul",
  "Bolivia": "Bolívia",
  "Nigeria": "Nigéria",
  "Panama": "Panamá",
  "United States": "Estados Unidos",
  "Mexico": "México",
  "Denmark": "Dinamarca",
  "Australia": "Austrália",
  "Turkey": "Turquia",
  "Ukraine": "Ucrânia",
  "Albania": "Albânia",
  "Ghana": "Gana",
  "Venezuela": "Venezuela",
  "Czech Republic": "República Checa",
  "Hungary": "Hungria",
  "Costa Rica": "Costa Rica",
  "Peru": "Peru",
  "Senegal": "Senegal",
  "Portugal": "Portugal",
  "Spain": "Espanha",
  "England": "Inglaterra",
  "Italy": "Itália",
};

function translateTeamName(englishName: string): string {
  return TEAM_NAME_MAP[englishName] ?? englishName;
}
export async function fetchAllFixtures() {
  const res = await client.get(`/competitions/${WC_ID}/matches`, {
    params: { season: SEASON },
  });

  return res.data.matches
    .filter((m: any) => m.homeTeam?.name !== null && m.awayTeam?.name !== null)  // ← skip TBD matches
    .map((m: any) => ({
      externalId: m.id,
      matchDate: new Date(m.utcDate),
      phase: mapPhase(m.stage),
      groupName: m.group ?? null,    
      teamAName: m.homeTeam.name,
      teamBName: m.awayTeam.name,
      teamACode: m.homeTeam.tla,
      teamBCode: m.awayTeam.tla,
      status: m.status,
      scoreA: m.score?.fullTime?.home ?? null,
      scoreB: m.score?.fullTime?.away ?? null,
    }));
}

export async function fetchFinishedToday() {
  const today = new Date().toISOString().split("T")[0];

  const res = await client.get(`/competitions/${WC_ID}/matches`, {
    params: {
      season: SEASON,
      dateFrom: today,
      dateTo: today,
      status: "FINISHED",
    },
  });

  return res.data.matches.map((m: any) => ({
    externalId: m.id,
    scoreA: m.score?.fullTime?.home ?? null,
    scoreB: m.score?.fullTime?.away ?? null,
  }));
}

export async function fetchLiveScores() {
  const res = await client.get(`/competitions/${WC_ID}/matches`, {
    params: {
      season: SEASON,
      status: "IN_PLAY",
    },
  });

  return res.data.matches.map((m: any) => ({
    externalId: m.id,
    scoreA: m.score?.fullTime?.home ?? null,
    scoreB: m.score?.fullTime?.away ?? null,
    status: m.status,
    minute: m.minute ?? null,
  }));
}