import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMatches, getMyPredictions, submitPrediction } from "../api/client";

interface Team {
  id: number;
  name: string;
  flagEmoji?: string;
  code: string;
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
}

interface Prediction {
  matchId: number;
  scoreA: number;
  scoreB: number;
  pointsEarned: number;
}

const PHASE_LABELS: Record<string, string> = {
  group: "Fase de Grupos",
  r16: "Oitavas de Final (1/16)",
  qf: "Quartas de Final",
  sf: "Semifinal",
  final: "Final",
};

export default function Jogos() {
  const qc = useQueryClient();
  const [selectedPhase, setSelectedPhase] = useState("group");
  const [inputs, setInputs] = useState<Record<number, [string, string]>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["matches", selectedPhase],
    queryFn: () => getMatches(selectedPhase),
  });

  const { data: myPreds = [] } = useQuery<Prediction[]>({
    queryKey: ["my-predictions"],
    queryFn: getMyPredictions,
  });

  const predMap = Object.fromEntries(myPreds.map((p) => [p.matchId, p]));

  const mutation = useMutation({
    mutationFn: ({ matchId, a, b }: { matchId: number; a: number; b: number }) =>
      submitPrediction(matchId, a, b),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["my-predictions"] });
      setSaved((s) => ({ ...s, [vars.matchId]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [vars.matchId]: false })), 2000);
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
      const cur = prev[matchId] ?? [getInput(matchId, 0), getInput(matchId, 1)];
      const next: [string, string] = [...cur] as [string, string];
      next[side] = val;
      return { ...prev, [matchId]: next };
    });
  };

  const save = (match: Match) => {
    const a = parseInt(getInput(match.id, 0));
    const b = parseInt(getInput(match.id, 1));
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return;
    mutation.mutate({ matchId: match.id, a, b });
  };

  const isLocked = (match: Match) => new Date() >= new Date(match.matchDate);

  if (isLoading) {
    return <div className="text-center py-20 text-gray-400 animate-pulse">Carregando jogos...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-black text-gray-900">⚽ Jogos & Palpites</h1>
      </div>

      {/* Phase filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {Object.entries(PHASE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedPhase(key)}
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

      {matches.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          Nenhum jogo cadastrado nesta fase ainda.
        </div>
      )}

      <div className="grid gap-4">
        {matches.map((match) => {
          const pred = predMap[match.id];
          const locked = isLocked(match);
          const matchDate = new Date(match.matchDate);

          return (
            <div
              key={match.id}
              className={`bg-white rounded-2xl shadow p-5 border-l-4 ${
                match.isFinished
                  ? "border-gray-300"
                  : locked
                  ? "border-orange-400"
                  : "border-green-500"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">
                  {matchDate.toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-xs font-bold text-gray-500">
                  {PHASE_LABELS[match.phase]} · ×{match.phaseMultiplier}
                </span>
              </div>

              <div className="flex items-center gap-4 my-3">
                {/* Team A */}
                <div className="flex-1 text-right">
                  <span className="font-black text-gray-900">
                    {match.teamA.flagEmoji} {match.teamA.name}
                  </span>
                </div>

                {/* Score inputs or result */}
                {match.isFinished ? (
                  <div className="flex items-center gap-2 text-2xl font-black">
                    <span className="text-gray-900">{match.scoreAReal}</span>
                    <span className="text-gray-400">×</span>
                    <span className="text-gray-900">{match.scoreBReal}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      disabled={locked}
                      value={getInput(match.id, 0)}
                      onChange={(e) => setInput(match.id, 0, e.target.value)}
                      className="w-12 h-10 text-center border-2 rounded-lg font-bold text-lg disabled:bg-gray-100 focus:border-green-500 outline-none"
                    />
                    <span className="text-gray-400 font-black">×</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      disabled={locked}
                      value={getInput(match.id, 1)}
                      onChange={(e) => setInput(match.id, 1, e.target.value)}
                      className="w-12 h-10 text-center border-2 rounded-lg font-bold text-lg disabled:bg-gray-100 focus:border-green-500 outline-none"
                    />
                  </div>
                )}

                {/* Team B */}
                <div className="flex-1">
                  <span className="font-black text-gray-900">
                    {match.teamB.flagEmoji} {match.teamB.name}
                  </span>
                </div>
              </div>

              {/* Bottom row: status + save */}
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs">
                  {match.isFinished && pred && (
                    <span className="text-green-700 font-bold">
                      ✅ Você fez {pred.scoreA}×{pred.scoreB} → {pred.pointsEarned} pts
                    </span>
                  )}
                  {!match.isFinished && pred && !locked && (
                    <span className="text-gray-400">
                      Palpite atual: {pred.scoreA}×{pred.scoreB}
                    </span>
                  )}
                  {locked && !match.isFinished && (
                    <span className="text-orange-500 font-semibold">🔒 Palpites encerrados</span>
                  )}
                </div>

                {!locked && !match.isFinished && (
                  <button
                    onClick={() => save(match)}
                    disabled={mutation.isPending}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
                      saved[match.id]
                        ? "bg-green-500 text-white"
                        : "bg-green-700 hover:bg-green-800 text-white"
                    }`}
                  >
                    {saved[match.id] ? "✓ Salvo!" : "Salvar palpite"}
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