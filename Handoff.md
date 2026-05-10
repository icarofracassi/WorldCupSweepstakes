# Bolão Copa 2026 — Project Handoff

**Date:** May 2026  
**Status:** MVP complete, leagues implemented, ready for deployment  
**Cup starts:** June 11, 2026 (Mexico vs South Africa, 19:00 UTC)

---

## What this project is

A full-stack office sweepstakes web app for the 2026 FIFA World Cup. Users register, make pre-tournament picks (champion, shame team, surprise team), predict scores for individual matches, and compete on a live leaderboard. Users are isolated into **leagues** — groups of friends/coworkers who only see each other's predictions and rankings.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| State | TanStack Query v5 |
| Flags | react-world-flags |
| Dates | date-fns v4 |
| External API | football-data.org (free tier, 100 req/day) |

---

## Project structure

```
WorldCupSweepstakes/
├── api/                          ← Express backend
│   ├── prisma/schema.prisma      ← DB schema
│   ├── src/
│   │   ├── index.ts              ← Entry point, all routes registered
│   │   ├── prisma.ts             ← PrismaClient singleton
│   │   ├── seed.ts               ← 48 teams + admin user
│   │   ├── middleware/auth.ts    ← JWT middleware (authMiddleware, adminMiddleware)
│   │   ├── routes/
│   │   │   ├── auth.ts           ← POST /login, /register, GET /me
│   │   │   ├── matches.ts        ← GET/POST /matches, POST /matches/:id/finalize
│   │   │   ├── predictions.ts    ← GET /mine, GET /match/:id, POST /:matchId
│   │   │   ├── preCup.ts         ← GET/POST /precup, POST /precup/finalize
│   │   │   ├── teams.ts          ← GET /teams, PATCH /teams/:id/eliminate
│   │   │   ├── leaderboard.ts    ← GET /leaderboard?leagueId=, GET /export.csv
│   │   │   ├── leagues.ts        ← Full leagues CRUD
│   │   │   └── sync.ts           ← POST /sync/fixtures, /sync/results, /sync/bulk
│   │   └── services/
│   │       ├── scoring.ts        ← calcMatchPoints, calcShameIndex, calcSurpriseIndex
│   │       └── footballApi.ts    ← football-data.org client (fetchAllFixtures, fetchFinishedToday)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── web/                          ← React frontend
    ├── src/
    │   ├── App.tsx               ← Routes + auth/league providers
    │   ├── main.tsx              ← React entry
    │   ├── index.css             ← Tailwind + Syne/Inter fonts + rdp dark overrides
    │   ├── api/client.ts         ← All axios API calls
    │   ├── context/
    │   │   ├── AuthContext.tsx   ← JWT auth state (token, user, login, register, logout)
    │   │   └── LeagueContext.tsx ← Active league state, league switcher, localStorage persist
    │   ├── components/
    │   │   ├── Layout.tsx        ← Dark sidebar nav + league switcher dropdown + mobile menu
    │   │   ├── TeamPicker.tsx    ← Searchable team dropdown with flags (used in PreCopa)
    │   │   └── ui/
    │   │       ├── button.tsx    ← shadcn-style Button (Radix Slot + CVA)
    │   │       ├── calendar.tsx  ← react-day-picker v9 dark-themed calendar
    │   │       └── popover.tsx   ← Custom zero-dependency Popover (Context + div)
    │   ├── lib/utils.ts          ← cn() utility (clsx + tailwind-merge)
    │   └── pages/
    │       ├── Landing.tsx       ← Public marketing page (hero+countdown+features+scoring)
    │       ├── Login.tsx         ← Dark glassmorphism login
    │       ├── Register.tsx      ← 2-step: account → league create/join
    │       ├── Dashboard.tsx     ← Live countdown + stat cards + mini leaderboard
    │       ├── Jogos.tsx         ← Match predictions grouped by day + group pills + flags
    │       ├── PreCopa.tsx       ← Champion/Shame/Surprise picks with TeamPicker
    │       ├── Leaderboard.tsx   ← Podium + table, filtered by active league
    │       ├── Palpites.tsx      ← View everyone's predictions, filtered by active league
    │       ├── Liga.tsx          ← League management: create, join, invite code, leaderboard
    │       └── Admin.tsx         ← 5-tab admin panel (matches, results, teams, import, sync)
    ├── package.json
    ├── vite.config.ts            ← proxy /api → localhost:3001, @ alias
    └── tailwind.config.js
```

---

## Database schema

```prisma
League      id, name, code(unique 6-char), createdAt, createdById
            members []User  ← many-to-many
            
User        id, name, email(unique), passwordHash, isAdmin
            leagues []League, predictions [], preCupPick?

Team        id, name(unique), code(unique), fifaRanking, flagEmoji
            isTop14, eliminatedPhase, shameIndex, surpriseIndex

Match       id, externalId(unique), groupName, teamAId, teamBId
            phase, phaseMultiplier, matchDate
            scoreAReal, scoreBReal, isFinished

Prediction  id, userId, matchId (unique together), scoreA, scoreB, pointsEarned

PreCupPick  id, userId(unique), championId, shameTeamId, surpriseTeamId, pointsEarned
```

---

## Environment variables

**`api/.env`** (copy from `.env.example`):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bolao_copa"
JWT_SECRET="your-long-random-secret"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
FOOTBALL_DATA_KEY="your_key_from_football-data.org"
```

---

## Running locally

```powershell
# Terminal 1 — API
cd api
npm install
npx prisma db push
npm run db:seed
npm run dev
# → 🚀 Bolão API running on http://localhost:3001

# Terminal 2 — Web
cd web
npm install
npm run dev
# → http://localhost:5173
```

**Admin credentials (from seed):**
- Email: `admin@bolao.com`
- Password: `admin123`

---

## API routes reference

### Auth
```
POST   /api/auth/register        { name, email, password }
POST   /api/auth/login           { email, password } → { token, user }
GET    /api/auth/me              → current user
```

### Matches
```
GET    /api/matches              ?phase=group|r16|qf|sf|final
POST   /api/matches              (admin) { teamAId, teamBId, phase, matchDate }
POST   /api/matches/:id/finalize (admin) { scoreAReal, scoreBReal } → scores all predictions
```

### Predictions
```
GET    /api/predictions/mine
GET    /api/predictions/match/:id  ?leagueId=   (returns [] if match not started)
POST   /api/predictions/:matchId   { scoreA, scoreB } (locked at kickoff)
```

### Pre-Cup
```
GET    /api/precup/mine
POST   /api/precup               { championId, shameTeamId, surpriseTeamId }
POST   /api/precup/finalize      (admin) → calculates shame/surprise winners
```

### Teams
```
GET    /api/teams
PATCH  /api/teams/:id/eliminate  (admin) { eliminatedPhase } → recalculates indexes
```

### Leaderboard
```
GET    /api/leaderboard          ?leagueId=  → ranked list with pre-cup details
GET    /api/leaderboard/export.csv  ?leagueId=
```

### Leagues
```
GET    /api/leagues              → all leagues
GET    /api/leagues/mine         → user's leagues
GET    /api/leagues/:id          → league detail + member leaderboard
GET    /api/leagues/code/:code   → lookup by invite code
POST   /api/leagues              { name } → create + auto-join
POST   /api/leagues/join         { code } → join by invite code
POST   /api/leagues/:id/leave    → leave (creator cannot leave)
```

### Sync (admin only)
```
POST   /api/sync/fixtures    → import all fixtures from football-data.org
POST   /api/sync/results     → score today's finished matches from football-data.org
POST   /api/sync/bulk        { matches: [{teamACode, teamBCode, phase, matchDate}] }
```

---

## Scoring rules

### Match points (multiplied by phase multiplier)
| Result | Base |
|---|---|
| Exact score | 5 pts |
| Right winner + same goal diff | 3 pts |
| Right winner only | 1 pt |
| Wrong | 0 pts |

### Phase multipliers
| Phase | ×Mult |
|---|---|
| Group | 1.0 |
| Round of 16 | 1.25 |
| Quarter-finals | 1.5 |
| Semi-finals | 1.75 |
| Final | 3.0 |

### Pre-cup picks
| Pick | Points |
|---|---|
| Champion | 200 |
| Vergonha (top-14, lowest shame index) | 100 |
| Surpresa (outside top-14, highest surprise index) | 100 |

### Shame/Surprise index formula
`index = fifaRanking × phaseFactor`

Phase factors: Group 1.0 · R16 2.0 · QF 3.0 · SF 4.0 · 3rd 5.0 · Champion 7.0

- **Vergonha winner** = top-14 team with LOWEST index (best team, earliest exit)
- **Surpresa winner** = outside top-14 team with HIGHEST index (lowest-ranked, deepest run)

---

## Key implementation details

### FIFA code → ISO flag mapping
All flag components use a `FIFA_TO_ISO` record to convert FIFA 3-letter codes (BRA, GER, ENG) to ISO 2-letter codes for `react-world-flags`. The mapping is duplicated in each page that uses flags. **TODO: extract to shared utility.**

### League scoping
- `LeagueContext` stores `activeLeague` (persisted in localStorage)
- `Leaderboard` and `Palpites` pass `?leagueId=activeLeague.id` to API
- API filters by league members via Prisma `id: { in: memberIds }`
- Predictions for upcoming matches return `[]` regardless of league (privacy)

### football-data.org sync
- Base URL: `https://api.football-data.org/v4`
- Header: `X-Auth-Token: your_key`
- World Cup 2026 = `competition/WC`, season 2026
- Matches with null homeTeam/awayTeam (TBD bracket) are filtered out
- `externalId` = football-data `fixture.id`, stored for upsert idempotency
- Team matching: first tries `code` (TLA), falls back to name contains search
- **72 group stage matches** already imported as of session end

### Admin workflow during tournament
1. Before June 11: users register, make pre-cup picks
2. Daily: run `POST /sync/results` to auto-score finished matches
3. As teams are eliminated: Admin → Teams tab → mark eliminated phase
4. After final: Admin → Results tab → "Finalizar Pré-Copa" button
5. Sync `/sync/fixtures` again periodically as knockout brackets fill in

---

## What's working ✅

- Full auth (register/login/JWT)
- 48 Copa 2026 teams seeded with FIFA codes and flags
- 72 group stage matches imported from football-data.org
- Match predictions with lockout at kickoff
- Pre-cup picks (champion, shame, surprise) with searchable TeamPicker
- Automatic scoring engine on match finalization
- Shame/Surprise index calculation on team elimination
- Pre-cup finalization (calculates winners, scores picks)
- Live leaderboard with podium, auto-refresh every 30s
- Palpites page showing all predictions after match starts
- Leagues: create, join by code, leave, invite code copy, league leaderboard
- League scoping on leaderboard and palpites
- League switcher in sidebar
- 2-step register flow (account → league create/join)
- Dark sidebar layout with mobile hamburger menu
- Landing page with live countdown, features, interactive score demo
- Admin panel: 5 tabs (create match, finalize results, eliminate teams, bulk JSON import, API sync)
- CSV export for Power BI
- Country flags using react-world-flags with FIFA→ISO mapping
- Match cards grouped by day with group pills (Grupo A–L)
- Bulk save all predictions button
- Dark theme throughout (bg #0a0a0f, accent #f5c842)
- Syne + Inter fonts via Google Fonts

---

## Known issues / TODOs

### High priority
- [ ] **`footballApi.ts` is missing from container** — the file was written in conversation but may not exist on disk. Recreate it (see API route reference above). It uses `FOOTBALL_DATA_KEY` env var and football-data.org v4 API.
- [ ] **sync.ts route** — same issue, may need to be recreated. Check `api/src/routes/sync.ts` exists.
- [ ] **`api/src/routes/sync.ts` missing** in container file list — check and recreate if needed.

### Medium priority
- [ ] Extract `FIFA_TO_ISO` map to `web/src/lib/flags.ts` — currently duplicated in 5+ files
- [ ] Add `groupName` to sync upsert — currently not stored on re-sync (add to both `update` and `create` in sync route)
- [ ] Dashboard internal links still use `/` in some places — should be `/dashboard`
- [ ] `Register.tsx` league step doesn't handle the case where `createLeague` is called before auth token is set in axios (the token is set in localStorage immediately after register but context may not have refreshed — test this flow)

### Nice to have (next session)
- [ ] **Multi-language** (PT/EN) using i18next
- [ ] **Styled dropdowns in Admin** — replace native `<select>` with `SearchableSelect` component (extend TeamPicker)
- [ ] **Top 8 picks** — add to pre-cup (20pts per correct top-8 team, max 160pts)
- [ ] **Notifications** — email or browser push when predictions lock soon
- [ ] **Double Down toggle** — inspired by reference app, lets users double points on one match per phase
- [ ] **Bracket view** — visual knockout bracket instead of flat match list for r16+

---

## Deployment (when ready)

### Railway (API + DB)
```bash
npm install -g @railway/cli
railway login
cd api
railway init
railway add postgresql
# Set env vars in Railway dashboard (DATABASE_URL auto-set, add JWT_SECRET + FOOTBALL_DATA_KEY)
railway up
```

### Vercel (frontend)
```bash
cd web
npm install -g vercel
vercel
# Set VITE_API_URL env var to Railway API URL
# Update vite.config.ts proxy for production build
```

### Update CORS
Set `CORS_ORIGIN` in Railway to your Vercel domain once deployed.

---

## Next session quick start

1. Open `WorldCupSweepstakes/` in VS Code
2. Check `api/src/routes/sync.ts` and `api/src/services/footballApi.ts` exist — recreate from handoff if missing
3. Start both servers (`npm run dev` in `api/` and `web/`)
4. Verify `http://localhost:5173` shows the landing page
5. Login as `admin@bolao.com` / `admin123`
6. Go to Admin → Sync tab → run "Importar Fixtures" to refresh match data
7. Pick up from the TODO list above
