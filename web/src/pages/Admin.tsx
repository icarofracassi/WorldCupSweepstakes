import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMatches, getTeams, api } from "../api/client";

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

export default function Admin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"matches" | "results" | "teams">("matches");

  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: getTeams });
  const { data: matches = [] } = useQuery({ queryKey: ["matches-all"], queryFn: () => getMatches() });

  // Create match form
  const [newMatch, setNewMatch] = useState({ teamAId: "", teamBId: "", phase: "group", matchDate: "" });
  const createMatch = useMutation({
    mutationFn: () => api.post("/matches", newMatch).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches-all"] });
      setNewMatch({ teamAId: "", teamBId: "", phase: "group", matchDate: "" });
    },
  });

  // Finalize match
  const [scores, setScores] = useState<Record<number, { a: string; b: string }>>({});
  const finalizeMatch = useMutation({
    mutationFn: ({ id, a, b }: { id: number; a: number; b: number }) =>
      api.post(`/matches/${id}/finalize`, { scoreAReal: a, scoreBReal: b }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches-all"] }),
  });

  // Eliminate team
  const [elimPhase, setElimPhase] = useState<Record<number, string>>({});
  const eliminateTeam = useMutation({
    mutationFn: ({ id, phase }: { id: number; phase: string }) =>
      api.patch(`/teams/${id}/eliminate`, { eliminatedPhase: phase }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });

  // Finalize pre-cup
  const finalizePreCup = useMutation({
    mutationFn: () => api.post("/precup/finalize").then((r) => r.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">⚙️ Painel Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Gerenciar jogos, resultados e times</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["matches", "results", "teams"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm ${
              tab === t ? "bg-green-700 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {{ matches: "Criar Jogos", results: "Lançar Resultados", teams: "Times" }[t]}
          </button>
        ))}
      </div>

      {/* Create match */}
      {tab === "matches" && (
        <div className="bg-white rounded-2xl shadow p-6 max-w-lg">
          <h2 className="font-black text-lg mb-4">Novo Jogo</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">Time A</label>
                <select
                  value={newMatch.teamAId}
                  onChange={(e) => setNewMatch((p) => ({ ...p, teamAId: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.flagEmoji} {t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Time B</label>
                <select
                  value={newMatch.teamBId}
                  onChange={(e) => setNewMatch((p) => ({ ...p, teamBId: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.flagEmoji} {t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">Fase</label>
                <select
                  value={newMatch.phase}
                  onChange={(e) => setNewMatch((p) => ({ ...p, phase: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {PHASES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label} (×{p.multiplier})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Data/Hora</label>
                <input
                  type="datetime-local"
                  value={newMatch.matchDate}
                  onChange={(e) => setNewMatch((p) => ({ ...p, matchDate: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => createMatch.mutate()}
              disabled={!newMatch.teamAId || !newMatch.teamBId || !newMatch.matchDate}
              className="w-full bg-green-700 text-white py-2.5 rounded-lg font-bold hover:bg-green-800 disabled:opacity-50 transition"
            >
              {createMatch.isPending ? "Criando..." : "Criar Jogo"}
            </button>
            {createMatch.isSuccess && (
              <p className="text-green-600 text-sm text-center">✅ Jogo criado!</p>
            )}
          </div>
        </div>
      )}

      {/* Finalize results */}
      {tab === "results" && (
        <div className="space-y-3 max-w-2xl">
          <div className="flex justify-between items-center">
            <h2 className="font-black text-lg">Lançar Resultados</h2>
            <button
              onClick={() => finalizePreCup.mutate()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700"
            >
              Finalizar Pré-Copa
            </button>
          </div>
          {finalizePreCup.isSuccess && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm">
              <p className="font-bold">Pré-Copa finalizada!</p>
              <p>Vergonha: {(finalizePreCup.data as any)?.shameWinner} (índice: {(finalizePreCup.data as any)?.shameIndex})</p>
              <p>Surpresa: {(finalizePreCup.data as any)?.surpriseWinner} (índice: {(finalizePreCup.data as any)?.surpriseIndex})</p>
            </div>
          )}

          {matches.filter((m: any) => !m.isFinished).map((match: any) => (
            <div key={match.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
              <div className="flex-1 font-semibold text-gray-800 text-sm">
                {match.teamA.flagEmoji} {match.teamA.name} × {match.teamB.flagEmoji} {match.teamB.name}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={20}
                  value={scores[match.id]?.a ?? ""}
                  onChange={(e) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], a: e.target.value } }))}
                  className="w-12 border rounded px-2 py-1 text-center font-bold"
                />
                <span className="text-gray-400">×</span>
                <input
                  type="number" min={0} max={20}
                  value={scores[match.id]?.b ?? ""}
                  onChange={(e) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], b: e.target.value } }))}
                  className="w-12 border rounded px-2 py-1 text-center font-bold"
                />
                <button
                  onClick={() => {
                    const s = scores[match.id];
                    if (s?.a !== undefined && s?.b !== undefined) {
                      finalizeMatch.mutate({ id: match.id, a: Number(s.a), b: Number(s.b) });
                    }
                  }}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          ))}
          {matches.filter((m: any) => !m.isFinished).length === 0 && (
            <p className="text-center text-gray-400 py-10">Nenhum jogo pendente de resultado.</p>
          )}
        </div>
      )}

      {/* Teams tab */}
      {tab === "teams" && (
        <div className="space-y-2 max-w-2xl">
          <h2 className="font-black text-lg mb-4">Marcar Eliminações</h2>
          {teams.map((team: any) => (
            <div key={team.id} className="bg-white rounded-xl shadow px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{team.flagEmoji}</span>
              <div className="flex-1">
                <span className="font-semibold text-gray-800">{team.name}</span>
                <span className="ml-2 text-xs text-gray-400">#{team.fifaRanking} FIFA</span>
                {team.isTop14 && (
                  <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">Top14</span>
                )}
                {team.eliminatedPhase && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    Eliminado: {team.eliminatedPhase} · índice: {team.shameIndex ?? team.surpriseIndex}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={elimPhase[team.id] ?? ""}
                  onChange={(e) => setElimPhase((p) => ({ ...p, [team.id]: e.target.value }))}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="">Fase...</option>
                  {ELIM_PHASES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const phase = elimPhase[team.id];
                    if (phase) eliminateTeam.mutate({ id: team.id, phase });
                  }}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-orange-600"
                >
                  Marcar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}