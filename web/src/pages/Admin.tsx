import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Flag from "react-world-flags";
import { getMatches, getTeams, api } from "../api/client";
import { TeamPicker } from '../components/TeamPicker';
import { PhasePicker } from '../components/PhasePicker';
import { DatePicker } from '../components/DatePicker';

const FIFA_TO_ISO: Record<string, string> = {
  GER:"DE",SWE:"SE",HAI:"HT",URU:"UY",MEX:"MX",SUI:"CH",NED:"NL",DEN:"DK",POR:"PT",ESP:"ES",FRA:"FR",
  ENG:"GB-ENG",SCO:"GB-SCT",BRA:"BR",ARG:"AR",COL:"CO",ECU:"EC",CHI:"CL",PAR:"PY",BOL:"BO",VEN:"VE",
  PER:"PE",USA:"US",CAN:"CA",CRC:"CR",PAN:"PA",SEN:"SN",MAR:"MA",TUN:"TN",NGA:"NG",CMR:"CM",GHA:"GH",
  CIV:"CI",ALG:"DZ",EGY:"EG",RSA:"ZA",COD:"CD",CPV:"CV",QAT:"QA",KSA:"SA",IRN:"IR",IRQ:"IQ",JOR:"JO",
  KOR:"KR",JPN:"JP",AUS:"AU",NZL:"NZ",UZB:"UZ",CRO:"HR",POL:"PL",SRB:"RS",SVK:"SK",CZE:"CZ",HUN:"HU",
  AUT:"AT",BIH:"BA",UKR:"UA",TUR:"TR",BEL:"BE",ITA:"IT",NOR:"NO",CUR:"CW",
};
function getFlagCode(code: string) { return FIFA_TO_ISO[code] ?? code; }

interface Team { id: number; name: string; code: string; flagEmoji: string; fifaRanking: number; isTop14: boolean; eliminatedPhase: string | null; shameIndex: number | null; surpriseIndex: number | null; }
interface Match { id: number; teamA: Team; teamB: Team; phase: string; phaseMultiplier: number; matchDate: string; scoreAReal: number | null; scoreBReal: number | null; isFinished: boolean; }
interface BulkImportResult { created: number; skipped: number; errors: string[]; }
interface PreCupFinalizeResult { shameWinner: string; shameIndex: number; surpriseWinner: string; surpriseIndex: number; }
interface SyncResult { ok: boolean; created?: number; skipped?: number; matchesScored?: number; total?: number; errors?: string[]; }

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

type TabType = "matches" | "results" | "teams" | "import" | "sync";
const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: "matches", label: "Criar Jogos", icon: "➕" },
  { key: "results", label: "Resultados", icon: "✅" },
  { key: "teams", label: "Times", icon: "🌍" },
  { key: "import", label: "Importar JSON", icon: "📥" },
  { key: "sync", label: "Sincronizar API", icon: "🔄" },
];

function Btn({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "purple" }) {
  const styles = {
    primary: "bg-[#f5c842] text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/10",
    secondary: "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white",
    danger: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20",
    purple: "bg-purple-500/15 border border-purple-500/25 text-purple-300 hover:bg-purple-500/25",
  };
  return (
    <button {...props} className={`px-4 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40 flex items-center gap-2 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4">
      <h2 className="font-black text-white text-base">{title}</h2>
      {children}
    </div>
  );
}

function SyncCard({ icon, title, description, onRun, isPending, result, color }: {
  icon: string; title: string; description: string;
  onRun: () => void; isPending: boolean;
  result: SyncResult | null | undefined;
  color: string;
}) {
  return (
    <div className={`bg-white/[0.03] border rounded-2xl p-5 space-y-4 ${color}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="font-black text-white text-sm">{title}</div>
          <div className="text-white/30 text-xs mt-0.5">{description}</div>
        </div>
      </div>
      <button onClick={onRun} disabled={isPending}
        className={`w-full py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40 border ${
          isPending
            ? "bg-white/5 border-white/10 text-white/40 cursor-wait"
            : "bg-white/8 border-white/15 text-white hover:bg-white/12 hover:border-white/25"
        }`}>
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sincronizando...
          </span>
        ) : "Executar"}
      </button>
      {result && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-400 space-y-1">
          <p className="font-bold">✅ Concluído</p>
          {result.created !== undefined && <p>Criados: {result.created} · Ignorados: {result.skipped}</p>}
          {result.matchesScored !== undefined && <p>Jogos pontuados: {result.matchesScored}</p>}
          {result.total !== undefined && <p>Total da API: {result.total}</p>}
          {result.errors && result.errors.length > 0 && (
            <div className="text-orange-400 mt-1 space-y-0.5">
              {result.errors.slice(0, 5).map((e, i) => <p key={i}>⚠ {e}</p>)}
              {result.errors.length > 5 && <p>+{result.errors.length - 5} outros erros...</p>}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function Admin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabType>("matches");
  const [newMatch, setNewMatch] = useState({ teamAId: 0, teamBId: 0, phase: "group", matchDate: "" });
  const [scores, setScores] = useState<Record<number, { a: string; b: string }>>({});
  const [elimPhase, setElimPhase] = useState<Record<number, string>>({});
  const [bulkJson, setBulkJson] = useState("");

  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["teams"], queryFn: getTeams });
  const { data: matches = [] } = useQuery<Match[]>({ queryKey: ["matches-all"], queryFn: () => getMatches() });

  const createMatch = useMutation({
    mutationFn: () => api.post("/matches", newMatch).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["matches-all"] }); setNewMatch({ teamAId: 0, teamBId: 0, phase: "group", matchDate: "" }); },
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
    mutationFn: () => api.post("/sync/bulk", { matches: JSON.parse(bulkJson) }).then((r) => r.data as BulkImportResult),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches-all"] }),
  });

  // Sync mutations
  const syncFixtures = useMutation({
    mutationFn: () => api.post("/sync/fixtures").then((r) => r.data as SyncResult),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches-all"] }),
  });
  const syncResults = useMutation({
    mutationFn: () => api.post("/sync/results").then((r) => r.data as SyncResult),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches-all"] }),
  });

  const pendingMatches = matches.filter((m) => !m.isFinished);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">⚙️ Painel Admin</h1>
        <p className="text-white/30 text-sm mt-0.5">Gerenciar jogos, resultados, times e sincronização</p>
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

          {/* CREATE MATCH TAB */}
          {tab === "matches" && (
            <Section title="Novo Jogo">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                
                {/* Team A Picker */}
                <TeamPicker
                  label="Time A (Casa)"
                  emoji="🏠"
                  description="Seleção mandante da partida"
                  accent="group-hover:border-blue-500/30"
                  options={teams}
                  value={newMatch.teamAId}
                  onChange={(id) => setNewMatch((p) => ({ ...p, teamAId: id }))}
                />

                {/* Team B Picker */}
                <TeamPicker
                  label="Time B (Fora)"
                  emoji="🚌"
                  description="Seleção visitante da partida"
                  accent="group-hover:border-red-500/30"
                  options={teams}
                  value={newMatch.teamBId}
                  onChange={(id) => setNewMatch((p) => ({ ...p, teamBId: id }))}
                />

                {/* Phase Picker */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 transition hover:border-white/20">
                  <div className="font-black text-white text-sm mb-3 uppercase tracking-wider opacity-50">Fase do Torneio</div>
                  <PhasePicker 
                    options={PHASES} // Uses the PHASES array with multipliers
                    value={newMatch.phase}
                    onChange={(val) => setNewMatch((p) => ({ ...p, phase: val }))}
                    placeholder="Selecione a fase..."
                  />
                  <div className="text-white/20 text-[10px] mt-2">
                    O multiplicador de pontos será aplicado automaticamente.
                  </div>
                </div>

                {/* Date Input */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 transition hover:border-white/20">
                  <div>
                    <DatePicker
                      date={newMatch.matchDate ? new Date(newMatch.matchDate) : undefined}
                      setDate={(d) => setNewMatch((p) => ({ ...p, matchDate: d ? d.toISOString() : "" }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Btn 
                  onClick={() => createMatch.mutate()} 
                  disabled={!newMatch.teamAId || !newMatch.teamBId || !newMatch.matchDate || createMatch.isPending}
                  className="px-8 py-3 rounded-xl font-bold"
                >
                  {createMatch.isPending ? "Criando..." : "Criar Jogo"}
                </Btn>
                
                {createMatch.isSuccess && (
                  <span className="text-green-400 text-sm font-bold animate-pulse">
                    ✅ Jogo criado com sucesso!
                  </span>
                )}
              </div>
            </Section>
          )}

          {/* RESULTS */}
          {tab === "results" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-white font-black">Lançar Resultados</h2>
                <Btn variant="purple" onClick={() => finalizePreCup.mutate()} disabled={finalizePreCup.isPending}>
                  🎯 {finalizePreCup.isPending ? "Finalizando..." : "Finalizar Pré-Copa"}
                </Btn>
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
                      <div className="w-6 h-6 rounded-full overflow-hidden"><Flag code={getFlagCode(match.teamA.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>
                      <span className="text-sm font-semibold text-white/80 truncate">{match.teamA.name}</span>
                      <span className="text-white/20">×</span>
                      <div className="w-6 h-6 rounded-full overflow-hidden"><Flag code={getFlagCode(match.teamB.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>
                      <span className="text-sm font-semibold text-white/80 truncate">{match.teamB.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={20} value={scores[match.id]?.a ?? ""}
                        onChange={(e) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], a: e.target.value } }))}
                        className="w-12 h-9 text-center bg-white/5 border border-white/10 rounded-lg font-bold text-white text-sm focus:outline-none focus:border-white/30" />
                      <span className="text-white/20 font-black">–</span>
                      <input type="number" min={0} max={20} value={scores[match.id]?.b ?? ""}
                        onChange={(e) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], b: e.target.value } }))}
                        className="w-12 h-9 text-center bg-white/5 border border-white/10 rounded-lg font-bold text-white text-sm focus:outline-none focus:border-white/30" />
                      <Btn onClick={() => { const s = scores[match.id]; if (s?.a !== undefined && s?.b !== undefined) finalizeMatch.mutate({ id: match.id, a: Number(s.a), b: Number(s.b) }); }}>
                        Salvar
                      </Btn>
                    </div>
                  </div>
                ))}
                {pendingMatches.length === 0 && <div className="text-center py-10 text-white/20 text-sm">Nenhum jogo pendente.</div>}
              </div>
            </div>
          )}

          {/* TEAMS TAB */}
          {tab === "teams" && (
            <div className="space-y-3">
              <h2 className="text-white font-black text-lg mb-4">Marcar Eliminações</h2>
              
              {teams.map((team) => (
                <div key={team.id} className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
                  
                  {/* Team Flag & Info */}
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                    <Flag code={getFlagCode(team.code)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white/80 text-sm truncate">{team.name}</span>
                      <span className="text-white/20 text-xs">#{team.fifaRanking}</span>
                      {team.isTop14 && (
                        <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-bold">Top14</span>
                      )}
                    </div>
                    {team.eliminatedPhase && (
                      <div className="text-[10px] text-white/30 mt-0.5">
                        {team.eliminatedPhase} · idx: {team.shameIndex ?? team.surpriseIndex}
                      </div>
                    )}
                  </div>

                  {/* New Phase Picker & Action Button */}
                  <div className="flex items-center gap-2">
                    <PhasePicker 
                      options={ELIM_PHASES}
                      value={elimPhase[team.id] ?? ""}
                      onChange={(val) => setElimPhase((p) => ({ ...p, [team.id]: val }))}
                      placeholder="Fase eliminada..."
                    />
                    
                    <Btn 
                      variant="danger" 
                      className="h-[38px] px-4"
                      onClick={() => { 
                        const phase = elimPhase[team.id]; 
                        if (phase) eliminateTeam.mutate({ id: team.id, phase }); 
                      }}
                    >
                      Marcar
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* IMPORT JSON */}
          {tab === "import" && (
            <Section title="Importar Jogos via JSON">
              <p className="text-white/30 text-xs">Use códigos FIFA (BRA, ARG...) e fases: group, r16, qf, sf, final.</p>
              <div className="bg-black/30 rounded-xl p-3 text-xs font-mono text-white/25 border border-white/5">
                {'[\n  { "teamACode": "BRA", "teamBCode": "MEX", "phase": "group", "matchDate": "2026-06-15T18:00:00Z" }\n]'}
              </div>
              <textarea rows={10} value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} placeholder="Cole o JSON aqui..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/30 transition resize-none" />
              <div className="flex items-center gap-3">
                <Btn onClick={() => bulkImport.mutate()} disabled={bulkImport.isPending || !bulkJson.trim()}>
                  {bulkImport.isPending ? "Importando..." : "📥 Importar Jogos"}
                </Btn>
                {bulkImport.isSuccess && (
                  <span className="text-green-400 text-sm font-bold">
                    ✅ {(bulkImport.data as BulkImportResult).created} criados · {(bulkImport.data as BulkImportResult).skipped} ignorados
                  </span>
                )}
              </div>
              {bulkImport.isSuccess && (bulkImport.data as BulkImportResult).errors?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-1">
                  {(bulkImport.data as BulkImportResult).errors.map((e, i) => <div key={i} className="text-red-400 text-xs">{e}</div>)}
                </div>
              )}
            </Section>
          )}

          {/* SYNC */}
          {tab === "sync" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-black">Sincronização com football-data.org</h2>
                <p className="text-white/30 text-xs mt-1">Conecta com a API externa para importar jogos e resultados automaticamente.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SyncCard
                  icon="📅"
                  title="Importar Fixtures"
                  description="Importa todos os jogos da Copa 2026 da API. Safe de re-executar — usa upsert por externalId."
                  onRun={() => syncFixtures.mutate()}
                  isPending={syncFixtures.isPending}
                  result={syncFixtures.data}
                  color="border-blue-500/20"
                />
                <SyncCard
                  icon="⚽"
                  title="Sincronizar Resultados"
                  description="Busca jogos finalizados hoje e calcula automaticamente os pontos de cada palpite."
                  onRun={() => syncResults.mutate()}
                  isPending={syncResults.isPending}
                  result={syncResults.data}
                  color="border-green-500/20"
                />
                <div className="bg-white/[0.02] border border-white/6 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <div className="font-black text-white text-sm">Status da API</div>
                      <div className="text-white/25 text-xs mt-0.5">Informações sobre o uso da API externa</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Total de jogos", value: matches.length },
                      { label: "Pendentes", value: matches.filter((m) => !m.isFinished).length },
                      { label: "Finalizados", value: matches.filter((m) => m.isFinished).length },
                      { label: "Times", value: teams.length },
                    ].map((s) => (
                      <div key={s.label} className="flex justify-between">
                        <span className="text-white/30">{s.label}</span>
                        <span className="font-bold text-white">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-500/8 border border-yellow-500/15 rounded-xl p-3 text-[10px] text-yellow-400/70">
                    💡 Free tier: 100 req/dia. Execute sync/results 1x por dia após os jogos.
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}