import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Flag from "react-world-flags";
import { getMatches, getMyPredictions, submitPrediction } from "../api/client";

interface Team {
  id: number;
  name: string;
  code: string;
  flagEmoji?: string;
}

interface Match {
  id: number;
  teamA: Team;
  teamB: Team;
  phase: string;
  phaseMultiplier: number;
  matchDate: string;
  scoreAReal: number | null;
  scoreBReal: number | null;
  isFinished: boolean;
  groupName: string | null;
}

interface Prediction {
  matchId: number;
  scoreA: number;
  scoreB: number;
  pointsEarned: number;
}

const PHASE_LABELS: Record<string, string> = {
  group: "Fase de Grupos",
  r16: "Oitavas (1/16)",
  qf: "Quartas de Final",
  sf: "Semifinal",
  final: "Final",
};

// Map football-data group key → display label
function groupLabel(g: string): string {
  return "Grupo " + g.replace("GROUP_", "");
}

export default function Jogos() {
  const qc = useQueryClient();
  const [selectedPhase, setSelectedPhase] = useState("group");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [inputs, setInputs] = useState<Record<number, [string, string]>>({});
  const [savedAll, setSavedAll] = useState(false);

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["matches", selectedPhase],
    queryFn: () => getMatches(selectedPhase),
  });

  const { data: myPreds = [] } = useQuery<Prediction[]>({
    queryKey: ["my-predictions"],
    queryFn: getMyPredictions,
  });

  const predMap = Object.fromEntries(myPreds.map((p) => [p.matchId, p]));

  // Build sorted list of unique groups
  const groups = useMemo(() => {
    if (selectedPhase !== "group") return [];
    const seen = new Set<string>();
    matches.forEach((m) => { if (m.groupName) seen.add(m.groupName); });
    return ["ALL", ...Array.from(seen).sort()];
  }, [matches, selectedPhase]);

  // Filter matches by selected group
  const visibleMatches = useMemo(() => {
    if (selectedPhase !== "group" || selectedGroup === "ALL") return matches;
    return matches.filter((m) => m.groupName === selectedGroup);
  }, [matches, selectedPhase, selectedGroup]);

  const mutation = useMutation({
    mutationFn: ({ matchId, a, b }: { matchId: number; a: number; b: number }) =>
      submitPrediction(matchId, a, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-predictions"] });
    },
  });

  const getInput = (matchId: number, side: 0 | 1): string => {
    if (inputs[matchId]) return inputs[matchId][side];
    const pred = predMap[matchId];
    if (pred) return side === 0 ? String(pred.scoreA) : String(pred.scoreB);
    return "";
  };

  const setInput = (matchId: number, side: 0 | 1, val: string) => {
    setInputs((prev) => {
      const cur: [string, string] = prev[matchId] ?? [getInput(matchId, 0), getInput(matchId, 1)];
      const next: [string, string] = [...cur] as [string, string];
      next[side] = val;
      return { ...prev, [matchId]: next };
    });
  };

  const isLocked = (match: Match) => new Date() >= new Date(match.matchDate);

  const saveAll = async () => {
    const pending = visibleMatches.filter((m) => !isLocked(m) && !m.isFinished);
    for (const match of pending) {
      const a = parseInt(getInput(match.id, 0));
      const b = parseInt(getInput(match.id, 1));
      if (!isNaN(a) && !isNaN(b) && a >= 0 && b >= 0) {
        await submitPrediction(match.id, a, b);
      }
    }
    qc.invalidateQueries({ queryKey: ["my-predictions"] });
    setSavedAll(true);
    setTimeout(() => setSavedAll(false), 3000);
  };

  const pendingCount = visibleMatches.filter(
    (m) => !isLocked(m) && !m.isFinished && (() => {
      const a = parseInt(getInput(m.id, 0));
      const b = parseInt(getInput(m.id, 1));
      return !isNaN(a) && !isNaN(b);
    })()
  ).length;

  if (isLoading) {
    return <div className="text-center py-20 text-gray-400 animate-pulse">Carregando jogos...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-black text-gray-900">⚽ Jogos & Palpites</h1>

        {/* Save all button */}
        {pendingCount > 0 && (
          <button
            onClick={saveAll}
            disabled={mutation.isPending}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow ${
              savedAll
                ? "bg-green-500 text-white"
                : "bg-green-700 hover:bg-green-800 text-white"
            }`}
          >
            {savedAll ? "✅ Todos salvos!" : `💾 Salvar todos os palpites (${pendingCount})`}
          </button>
        )}
      </div>

      {/* Phase pills */}
      <div className="flex gap-2 flex-wrap mb-3">
        {Object.entries(PHASE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setSelectedPhase(key); setSelectedGroup("ALL"); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              selectedPhase === key
                ? "bg-green-700 text-white"
                : "bg-white text-gray-600 border hover:border-green-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Group pills — only shown in group phase */}
      {selectedPhase === "group" && groups.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                selectedGroup === g
                  ? "bg-yellow-500 text-white"
                  : "bg-white text-gray-500 border hover:border-yellow-400"
              }`}
            >
              {g === "ALL" ? "Todos os Grupos" : groupLabel(g)}
            </button>
          ))}
        </div>
      )}

      {visibleMatches.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          Nenhum jogo cadastrado nesta fase ainda.
        </div>
      )}

      <div className="grid gap-3">
        {visibleMatches.map((match) => {
          const pred = predMap[match.id];
          const locked = isLocked(match);
          const matchDate = new Date(match.matchDate);

          return (
            <div
              key={match.id}
              className={`bg-white rounded-2xl shadow p-4 border-l-4 ${
                match.isFinished
                  ? "border-gray-300"
                  : locked
                  ? "border-orange-400"
                  : "border-green-500"
              }`}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {match.groupName && (
                    <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      {groupLabel(match.groupName)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {matchDate.toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-400">×{match.phaseMultiplier}</span>
              </div>

              {/* Teams + score row */}
              <div className="flex items-center gap-3">
                {/* Team A */}
                <div className="flex-1 flex items-center justify-end gap-2">
                  <span className="font-black text-gray-900 text-sm text-right leading-tight">
                    {match.teamA.name}
                  </span>
                  <div className="w-8 h-6 flex-shrink-0 overflow-hidden rounded shadow-sm">
                    <Flag code={match.teamA.code} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                </div>

                {/* Score inputs or result */}
                {match.isFinished ? (
                  <div className="flex items-center gap-2 text-2xl font-black min-w-[80px] justify-center">
                    <span className="text-gray-900">{match.scoreAReal}</span>
                    <span className="text-gray-300">–</span>
                    <span className="text-gray-900">{match.scoreBReal}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-[80px] justify-center">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      disabled={locked}
                      value={getInput(match.id, 0)}
                      onChange={(e) => setInput(match.id, 0, e.target.value)}
                      className="w-11 h-10 text-center border-2 rounded-lg font-bold text-lg disabled:bg-gray-100 focus:border-green-500 outline-none"
                    />
                    <span className="text-gray-300 font-black">–</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      disabled={locked}
                      value={getInput(match.id, 1)}
                      onChange={(e) => setInput(match.id, 1, e.target.value)}
                      className="w-11 h-10 text-center border-2 rounded-lg font-bold text-lg disabled:bg-gray-100 focus:border-green-500 outline-none"
                    />
                  </div>
                )}

                {/* Team B */}
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-8 h-6 flex-shrink-0 overflow-hidden rounded shadow-sm">
                    <Flag code={match.teamB.code} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span className="font-black text-gray-900 text-sm leading-tight">
                    {match.teamB.name}
                  </span>
                </div>
              </div>

              {/* Bottom status row */}
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs">
                  {match.isFinished && pred && (
                    <span className="text-green-700 font-bold">
                      ✅ {pred.scoreA}–{pred.scoreB} → {pred.pointsEarned} pts
                    </span>
                  )}
                  {!match.isFinished && pred && !locked && (
                    <span className="text-gray-400">
                      Palpite atual: {pred.scoreA}–{pred.scoreB}
                    </span>
                  )}
                  {locked && !match.isFinished && (
                    <span className="text-orange-500 font-semibold">🔒 Encerrado</span>
                  )}
                </div>
                {!locked && !match.isFinished && (
                  <button
                    onClick={async () => {
                      const a = parseInt(getInput(match.id, 0));
                      const b = parseInt(getInput(match.id, 1));
                      if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return;
                      await submitPrediction(match.id, a, b);
                      qc.invalidateQueries({ queryKey: ["my-predictions"] });
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-green-700 hover:bg-green-800 text-white transition"
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}