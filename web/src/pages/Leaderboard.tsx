import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface TeamInfo {
  name: string;
  flagEmoji: string;
}

interface PreCupPickInfo {
  champion: TeamInfo;
  shameTeam: TeamInfo;
  surpriseTeam: TeamInfo;
}

interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  matchPoints: number;
  preCupPoints: number;
  total: number;
  predictionsCount: number;
  hasPrecupPick: boolean;
  preCupPick: PreCupPickInfo | null;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg animate-pulse">Carregando placar...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900">🏆 Placar Geral</h1>
          <p className="text-gray-500 mt-1">Atualizado a cada 30 segundos</p>
        </div>
        <a
          href="/api/leaderboard/export.csv"
          className="text-sm bg-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-800 transition"
        >
          📥 Exportar CSV
        </a>
      </div>

      {/* Top 3 podium */}
      {data.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {([data[1], data[0], data[2]] as LeaderboardEntry[]).map((entry, i) => {
            const podiumRank = [2, 1, 3][i];
            const heights = ["h-24", "h-32", "h-20"];
            const colors = [
              "bg-gray-300 text-gray-800",
              "bg-yellow-400 text-yellow-900",
              "bg-orange-400 text-white",
            ];
            return (
              <div key={entry.id} className="flex flex-col items-center">
                <div className="text-3xl mb-1">{MEDALS[podiumRank - 1]}</div>
                <div className="font-bold text-gray-800 text-sm text-center truncate w-full">
                  {entry.name}
                </div>
                <div
                  className={`${heights[i]} w-full mt-2 rounded-t-lg flex items-center justify-center font-black text-xl ${colors[i]}`}
                >
                  {entry.total}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-green-900 text-white text-sm">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Participante</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Pré-Copa</th>
              <th className="px-4 py-3 text-right">Jogos</th>
              <th className="px-4 py-3 text-right">Pré-Copa</th>
              <th className="px-4 py-3 text-right font-black">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, i) => {
              const isMe = entry.id === user?.id;
              return (
                <tr
                  key={entry.id}
                  className={`border-b transition ${
                    isMe
                      ? "bg-green-50 border-green-200"
                      : i % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3 text-center font-bold">
                    {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">{entry.name}</span>
                    {isMe && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                        você
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {entry.preCupPick ? (
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <div>🏆 {entry.preCupPick.champion.flagEmoji} {entry.preCupPick.champion.name}</div>
                        <div>😳 {entry.preCupPick.shameTeam.flagEmoji} {entry.preCupPick.shameTeam.name}</div>
                        <div>⭐ {entry.preCupPick.surpriseTeam.flagEmoji} {entry.preCupPick.surpriseTeam.name}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-orange-500 font-semibold">⚠️ sem pré-copa</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.matchPoints}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.preCupPoints}</td>
                  <td className="px-4 py-3 text-right font-black text-green-700 text-lg">
                    {entry.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}