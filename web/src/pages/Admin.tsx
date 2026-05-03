import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Flag from "react-world-flags";
import { getMatches, getTeams, api } from "../api/client";

const FIFA_TO_ISO: Record<string, string> = {
  GER:"DE",SWE:"SE",HAI:"HT",URU:"UY",MEX:"MX",SUI:"CH",NED:"NL",
  DEN:"DK",POR:"PT",ESP:"ES",FRA:"FR",ENG:"GB-ENG",SCO:"GB-SCT",
  BRA:"BR",ARG:"AR",COL:"CO",ECU:"EC",CHI:"CL",PAR:"PY",BOL:"BO",
  VEN:"VE",PER:"PE",USA:"US",CAN:"CA",CRC:"CR",PAN:"PA",SEN:"SN",
  MAR:"MA",TUN:"TN",NGA:"NG",CMR:"CM",GHA:"GH",CIV:"CI",ALG:"DZ",
  EGY:"EG",RSA:"ZA",COD:"CD",CPV:"CV",QAT:"QA",KSA:"SA",IRN:"IR",
  IRQ:"IQ",JOR:"JO",KOR:"KR",JPN:"JP",AUS:"AU",NZL:"NZ",UZB:"UZ",
  CRO:"HR",POL:"PL",SRB:"RS",SVK:"SK",CZE:"CZ",HUN:"HU",AUT:"AT",
  BIH:"BA",UKR:"UA",TUR:"TR",BEL:"BE",ITA:"IT",NOR:"NO",CUR:"CW",
};
function getFlagCode(code: string) { return FIFA_TO_ISO[code] ?? code; }

interface Team {
  id: number; name: string; code: string; flagEmoji: string;
  fifaRanking: number; isTop14: boolean;
  eliminatedPhase: string | null; shameIndex: number | null; surpriseIndex: number | null;
}
interface Match {
  id: number; teamA: Team; teamB: Team; phase: string;
  phaseMultiplier: number; matchDate: string;
  scoreAReal: number | null; scoreBReal: number | null; isFinished: boolean;
}
interface BulkImportResult { created: number; skipped: number; errors: string[]; }
interface PreCupFinalizeResult {
  shameWinner: string; shameIndex: number;
  surpriseWinner: string; surpriseIndex: number;
}

const PHASES = [
  { key: "group", label: "Fase de Grupos", multiplier: 1.0 },
  { key: "r16", label: "Oitavas (1/16)", multiplier: 1.25 },
  { key: "qf", label: "Quartas (1/4)", multiplier: 1.5 },
  { key: "sf", label: "Semifinal (1/2)", multiplier: 1.75 },
  { key: "final", label: "Final", multiplier: 3.0 },
];

const ELIM_PHASES = [
  { key: "group", label: "Fase de Grupos" },
  { key: "r16", label: "Oitavas" },
  { key: "qf", label: "Quartas" },
  { key: "sf", label: "Semifinal" },
  { key: "3rd", label: "3º/4º lugar" },
  { key: "champion", label: "Campeão 🏆" },
];

type TabType = "matches" | "results" | "teams" | "import";
const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: "matches", label: "Criar Jogos", icon: "➕" },
  { key: "results", label: "Resultados", icon: "✅" },
  { key: "teams", label: "Times", icon: "🌍" },
  { key: "import", label: "Importar", icon: "📥" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4">
      <h2 className="font-black text-white text-base">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">{children}</label>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition" />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition appearance-none">
      {children}
    </select>
  );
}

function Btn({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-[#f5c842] text-black hover:bg-yellow-400",
    secondary: "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white",
    danger: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20",
  };
  return (
    <button {...props}
      className={`px-4 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40 ${styles[variant]} ${props.className ?? ""}`}>
      {children}
    </button>
  );
}

export default function Admin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabType>("matches");
  const [newMatch, setNewMatch] = useState({ teamAId: "", teamBId: "", phase: "group", matchDate: "" });
  const [scores, setScores] = useState<Record<number, { a: string; b: string }>>({});
  const [elimPhase, setElimPhase] = useState<Record<number, string>>({});
  const [bulkJson, setBulkJson] = useState("");

  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["teams"], queryFn: getTeams });
  const { data: matches = [] } = useQuery<Match[]>({ queryKey: ["matches-all"], queryFn: () => getMatches() });

  const createMatch = useMutation({
    mutationFn: () => api.post("/matches", newMatch).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matches-all"] }); setNewMatch({ teamAId: "", teamBId: "", phase: "group", matchDate: "" }); },
  });

  const finalizeMatch = useMutation({
    mutationFn: ({ id, a, b }: { id: number; a: number; b: number }) =>
      api.post(`/matches/${id}/finalize`, { scoreAReal: a, scoreBReal: b }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches-all"] }),
  });

  const eliminateTeam = useMutation({
    mutationFn: ({ id, phase }: { id: number; phase: string }) =>
      api.patch(`/teams/${id}/eliminate`, { eliminatedPhase: phase }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });

  const finalizePreCup = useMutation({
    mutationFn: () => api.post("/precup/finalize").then((r) => r.data as PreCupFinalizeResult),
  });

  const bulkImport = useMutation({
    mutationFn: () => {
      const matchList = JSON.parse(bulkJson);
      return api.post("/sync/bulk", { matches: matchList }).then((r) => r.data as BulkImportResult);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches-all"] }),
  });

  const pendingMatches = matches.filter((m) => !m.isFinished);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">⚙️ Painel Admin</h1>
        <p className="text-white/30 text-sm mt-0.5">Gerenciar jogos, resultados e times</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition border ${
              tab === t.key
                ? "bg-[#f5c842]/10 border-[#f5c842]/30 text-[#f5c842]"
                : "bg-white/[0.03] border-white/8 text-white/40 hover:text-white hover:border-white/20"
            }`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

          {/* CREATE MATCH */}
          {tab === "matches" && (
            <Section title="Novo Jogo">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time A (Casa)</Label>
                  <Select value={newMatch.teamAId} onChange={(e) => setNewMatch((p) => ({ ...p, teamAId: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Time B (Fora)</Label>
                  <Select value={newMatch.teamBId} onChange={(e) => setNewMatch((p) => ({ ...p, teamBId: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Fase</Label>
                  <Select value={newMatch.phase} onChange={(e) => setNewMatch((p) => ({ ...p, phase: e.target.value }))}>
                    {PHASES.map((p) => <option key={p.key} value={p.key}>{p.label} (×{p.multiplier})</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Data e Hora</Label>
                  <Input type="datetime-local" value={newMatch.matchDate} onChange={(e) => setNewMatch((p) => ({ ...p, matchDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Btn onClick={() => createMatch.mutate()} disabled={!newMatch.teamAId || !newMatch.teamBId || !newMatch.matchDate || createMatch.isPending}>
                  {createMatch.isPending ? "Criando..." : "Criar Jogo"}
                </Btn>
                {createMatch.isSuccess && <span className="text-green-400 text-sm font-bold">✅ Jogo criado!</span>}
              </div>
            </Section>
          )}

          {/* RESULTS */}
          {tab === "results" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-white font-black">Lançar Resultados</h2>
                <div className="flex items-center gap-3">
                  <Btn variant="secondary" onClick={() => finalizePreCup.mutate()} disabled={finalizePreCup.isPending}>
                    🎯 Finalizar Pré-Copa
                  </Btn>
                </div>
              </div>

              {finalizePreCup.isSuccess && finalizePreCup.data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-sm space-y-1">
                  <p className="font-bold text-purple-300">🎯 Pré-Copa finalizada!</p>
                  <p className="text-white/50">Vergonha: <span className="text-white">{finalizePreCup.data.shameWinner}</span> (índice: {finalizePreCup.data.shameIndex})</p>
                  <p className="text-white/50">Surpresa: <span className="text-white">{finalizePreCup.data.surpriseWinner}</span> (índice: {finalizePreCup.data.surpriseIndex})</p>
                </motion.div>
              )}

              <div className="space-y-2">
                {pendingMatches.map((match) => (
                  <div key={match.id} className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <Flag code={getFlagCode(match.teamA.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                      <span className="text-sm font-semibold text-white truncate">{match.teamA.name}</span>
                      <span className="text-white/20 font-black">×</span>
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <Flag code={getFlagCode(match.teamB.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                      <span className="text-sm font-semibold text-white truncate">{match.teamB.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={20}
                        value={scores[match.id]?.a ?? ""}
                        onChange={(e) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], a: e.target.value } }))}
                        className="w-12 h-9 text-center bg-white/5 border border-white/10 rounded-lg font-bold text-white text-sm focus:outline-none focus:border-white/30" />
                      <span className="text-white/20 font-black">–</span>
                      <input type="number" min={0} max={20}
                        value={scores[match.id]?.b ?? ""}
                        onChange={(e) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], b: e.target.value } }))}
                        className="w-12 h-9 text-center bg-white/5 border border-white/10 rounded-lg font-bold text-white text-sm focus:outline-none focus:border-white/30" />
                      <Btn onClick={() => {
                        const s = scores[match.id];
                        if (s?.a !== undefined && s?.b !== undefined)
                          finalizeMatch.mutate({ id: match.id, a: Number(s.a), b: Number(s.b) });
                      }}>Salvar</Btn>
                    </div>
                  </div>
                ))}
                {pendingMatches.length === 0 && (
                  <div className="text-center py-10 text-white/20 text-sm">Nenhum jogo pendente de resultado.</div>
                )}
              </div>
            </div>
          )}

          {/* TEAMS */}
          {tab === "teams" && (
            <div className="space-y-3">
              <h2 className="text-white font-black">Marcar Eliminações</h2>
              {teams.map((team) => (
                <div key={team.id} className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10">
                    <Flag code={getFlagCode(team.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white text-sm">{team.name}</span>
                    <span className="ml-2 text-white/25 text-xs">#{team.fifaRanking}</span>
                    {team.isTop14 && <span className="ml-2 text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-bold">Top14</span>}
                    {team.eliminatedPhase && (
                      <span className="ml-2 text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded">
                        {team.eliminatedPhase} · {team.shameIndex ?? team.surpriseIndex}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={elimPhase[team.id] ?? ""} onChange={(e) => setElimPhase((p) => ({ ...p, [team.id]: e.target.value }))}
                      style={{ width: "160px" }}>
                      <option value="">Fase eliminada...</option>
                      {ELIM_PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </Select>
                    <Btn variant="danger" onClick={() => { const phase = elimPhase[team.id]; if (phase) eliminateTeam.mutate({ id: team.id, phase }); }}>
                      Marcar
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* IMPORT */}
          {tab === "import" && (
            <div className="space-y-4">
              <Section title="Importar Jogos em Massa">
                <p className="text-white/30 text-xs">Cole um JSON com os jogos. Use os códigos FIFA (BRA, ARG...) e fases: group, r16, qf, sf, final.</p>
                <div className="bg-black/30 rounded-xl p-3 text-xs font-mono text-white/30 border border-white/5">
                  {`[\n  { "teamACode": "BRA", "teamBCode": "MEX", "phase": "group", "matchDate": "2026-06-15T18:00:00Z" }\n]`}
                </div>
                <textarea rows={10} value={bulkJson} onChange={(e) => setBulkJson(e.target.value)}
                  placeholder="Cole o JSON aqui..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/30 transition resize-none" />
                <div className="flex items-center gap-3">
                  <Btn onClick={() => bulkImport.mutate()} disabled={bulkImport.isPending || !bulkJson.trim()}>
                    {bulkImport.isPending ? "Importando..." : "Importar Jogos"}
                  </Btn>
                  {bulkImport.isSuccess && (
                    <span className="text-green-400 text-sm font-bold">
                      ✅ {(bulkImport.data as BulkImportResult).created} criados · {(bulkImport.data as BulkImportResult).skipped} ignorados
                    </span>
                  )}
                </div>
                {bulkImport.isSuccess && (bulkImport.data as BulkImportResult).errors?.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    {(bulkImport.data as BulkImportResult).errors.map((e, i) => (
                      <div key={i} className="text-red-400 text-xs">{e}</div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}