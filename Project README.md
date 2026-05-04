# 🏆 Bolão Copa 2026

A full-stack office sweepstakes web app for the 2026 FIFA World Cup. Built with React, TypeScript, Node.js, and PostgreSQL.

Players make pre-tournament picks and daily match predictions, earning points based on accuracy. A live leaderboard tracks rankings throughout the tournament.

---

## Features

- **Pre-tournament picks** — choose the champion, the biggest disappointment (Vergonha), and the biggest surprise (Surpresa) before the cup starts
- **Match predictions** — predict the exact score for every game, locked automatically at kickoff
- **Smart scoring engine** — points scaled by phase multipliers (group stage through final)
- **Live leaderboard** — auto-refreshes every 30 seconds with podium display
- **Admin panel** — create matches manually, bulk import via JSON, enter real scores, finalize pre-cup results
- **API-Football integration** — sync all 104 fixtures and results automatically
- **CSV export** — one-click export for Power BI dashboards

---

## Scoring Rules

### Pre-Tournament (picked before cup starts)

| Pick | Points |
|---|---|
| Champion | 200 pts |
| Top 8 (per correct team) | 20 pts each |
| Vergonha (shame pick) | 100 pts |
| Surpresa (surprise pick) | 100 pts |

### Match Predictions (per game)

| Result | Base Points |
|---|---|
| Exact score | 5 pts |
| Correct winner + correct goal difference | 3 pts |
| Correct winner or draw | 1 pt |
| Wrong | 0 pts |

Base points are multiplied by the phase multiplier:

| Phase | Multiplier |
|---|---|
| Group Stage | ×1.0 |
| Round of 16 | ×1.25 |
| Quarter-finals | ×1.5 |
| Semi-finals | ×1.75 |
| Final | ×3.0 |

### Vergonha & Surpresa Index

Both are calculated as `FIFA Ranking × Phase Factor`:

| Eliminated in... | Phase Factor |
|---|---|
| Group Stage | 1.0 |
| Round of 16 | 2.0 |
| Quarter-finals | 3.0 |
| Semi-finals | 4.0 |
| 3rd/4th Place | 5.0 |
| Champion | 7.0 |

- **Vergonha** (top-14 FIFA teams only): lowest index wins — a #1 ranked team going out in the group stage scores 1×1.0 = 1.0, the maximum shame.
- **Surpresa** (outside top-14 only): highest index wins — a #90 ranked team reaching the quarters scores 90×3.0 = 270.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (bcrypt password hashing) |
| State Management | TanStack Query v5 |
| External API | API-Football (v3.football.api-sports.io) |

---

## Project Structure

```
WorldCupSweepstakes/
├── api/                        # Express backend
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── index.ts            # Entry point
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── seed.ts             # 48 teams + admin user seed
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.ts         # Register, login, /me
│   │   │   ├── matches.ts      # Match CRUD + finalize
│   │   │   ├── predictions.ts  # Submit & retrieve predictions
│   │   │   ├── preCup.ts       # Pre-tournament picks
│   │   │   ├── teams.ts        # Teams + eliminate endpoint
│   │   │   ├── leaderboard.ts  # Rankings + CSV export
│   │   │   └── sync.ts         # API-Football sync + bulk import
│   │   └── services/
│   │       ├── scoring.ts      # Points calculation logic
│   │       └── footballApi.ts  # API-Football client
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── web/                        # React frontend
│   ├── src/
│   │   ├── App.tsx             # Routes + auth guards
│   │   ├── main.tsx            # React entry point
│   │   ├── api/
│   │   │   └── client.ts       # Axios API client
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Auth state + JWT storage
│   │   ├── components/
│   │   │   └── Layout.tsx      # Nav + page wrapper
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── Dashboard.tsx   # Home with quick stats
│   │       ├── Jogos.tsx       # Match list + prediction inputs
│   │       ├── PreCopa.tsx     # Pre-tournament pick form
│   │       ├── Leaderboard.tsx # Rankings table + podium
│   │       └── Admin.tsx       # Admin panel
│   ├── package.json
│   └── vite.config.ts
│
└── package.json                # Root scripts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a cloud instance — Supabase, Railway, Neon)
- Git

### 1. Clone and install

```bash
git clone <your-repo-url>
cd WorldCupSweepstakes

# Install API dependencies
cd api && npm install

# Install web dependencies
cd ../web && npm install
```

### 2. Configure the API

```bash
cd api
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/bolao_copa"
JWT_SECRET="any-long-random-string-change-this"
PORT=3001
CORS_ORIGIN="http://localhost:5173"

# Optional — needed for automatic fixture/score sync
API_FOOTBALL_KEY="your_key_from_dashboard.api-football.com"
API_FOOTBALL_ENDPOINT="v3.football.api-sports.io"
```

### 3. Set up the database

```bash
# Create the database (in psql or pgAdmin)
psql -U postgres -c "CREATE DATABASE bolao_copa;"

# Push schema and seed data
cd api
npx prisma db push
npm run db:seed
```

Seeding creates all 48 Copa 2026 teams and an admin account:
- **Email:** `admin@bolao.com`
- **Password:** `admin123`

### 4. Run the app

Open two terminals:

```bash
# Terminal 1 — API
cd api
npm run dev
# → 🚀 Bolão API running on http://localhost:3001

# Terminal 2 — Web
cd web
npm run dev
# → Local: http://localhost:5174/
```

Open `http://localhost:5174` and log in with the admin account.

---

## API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Teams
| Method | Route | Description |
|---|---|---|
| GET | `/api/teams` | List all 48 teams |
| POST | `/api/teams` | Create team (admin) |
| PATCH | `/api/teams/:id/eliminate` | Mark team eliminated (admin) |

### Matches
| Method | Route | Description |
|---|---|---|
| GET | `/api/matches` | List matches (filter by `?phase=group`) |
| GET | `/api/matches/:id` | Single match with predictions |
| POST | `/api/matches` | Create match (admin) |
| POST | `/api/matches/:id/finalize` | Enter real score + score predictions (admin) |

### Predictions
| Method | Route | Description |
|---|---|---|
| GET | `/api/predictions/mine` | My predictions |
| POST | `/api/predictions/:matchId` | Submit/update prediction (locked at kickoff) |

### Pre-Cup Picks
| Method | Route | Description |
|---|---|---|
| GET | `/api/precup/mine` | My pre-cup picks |
| POST | `/api/precup` | Submit picks |
| POST | `/api/precup/finalize` | Score all picks (admin) |

### Leaderboard
| Method | Route | Description |
|---|---|---|
| GET | `/api/leaderboard` | Full rankings with pre-cup details |
| GET | `/api/leaderboard/export.csv` | CSV export for Power BI |

### Sync (Admin only)
| Method | Route | Description |
|---|---|---|
| POST | `/api/sync/bulk` | Bulk import matches from JSON |
| POST | `/api/sync/fixtures` | Import all fixtures from API-Football |
| POST | `/api/sync/results` | Auto-score today's finished matches |

---

## Importing Matches

### Option A — Bulk JSON (no API key needed)

In the Admin panel → **📥 Importar Jogos** tab, paste a JSON array:

```json
[
  { "teamACode": "BRA", "teamBCode": "MEX", "phase": "group", "matchDate": "2026-06-15T18:00:00Z" },
  { "teamACode": "ARG", "teamBCode": "CHI", "phase": "group", "matchDate": "2026-06-16T21:00:00Z" },
  { "teamACode": "ESP", "teamBCode": "MAR", "phase": "group", "matchDate": "2026-06-17T18:00:00Z" }
]
```

Valid phase values: `group`, `r16`, `qf`, `sf`, `final`

Use the team `code` field (e.g. `BRA`, `ARG`, `FRA`) — see the full list at `/api/teams`.

### Option B — API-Football sync (automatic)

Get a free API key at [dashboard.api-football.com](https://dashboard.api-football.com), add it to `.env`, then call:

```bash
# One-time: import all 104 Copa 2026 fixtures
curl -X POST http://localhost:3001/api/sync/fixtures \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Daily: auto-score finished matches (set up as a cron job)
curl -X POST http://localhost:3001/api/sync/results \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

The free tier allows 100 requests/day — more than enough for the entire tournament.

---

## Power BI Integration

The leaderboard CSV endpoint is designed for direct Power BI consumption:

1. In Power BI Desktop → **Get Data** → **Web**
2. URL: `http://your-deployed-api.com/api/leaderboard/export.csv`
3. The CSV includes: `id, name, matchPoints, preCupPoints, total`

---

## Deployment

The easiest free stack for sharing with your office:

| Service | Hosts | Free Tier |
|---|---|---|
| [Railway](https://railway.app) | API + PostgreSQL | $5 credit/month |
| [Render](https://render.com) | API + PostgreSQL | 750h/month |
| [Vercel](https://vercel.com) | React frontend | Unlimited |

For Railway:
```bash
npm install -g @railway/cli
railway login
railway init
railway add postgresql
# Add env vars in Railway dashboard
railway up
```

---

## Admin Workflow During the Tournament

1. **Before the cup starts** — share the app URL with your office, everyone registers and submits pre-cup picks
2. **Before each match** — players submit score predictions (locked automatically at kickoff time)
3. **After each match** — admin enters the real score in the **Lançar Resultados** tab (or use API-Football auto-sync)
4. **After group stage** — admin marks eliminated teams in the **Times** tab to calculate Vergonha/Surpresa indexes
5. **After the final** — admin clicks **Finalizar Pré-Copa** to score all pre-tournament picks and crown the winner

---

## License

MIT
