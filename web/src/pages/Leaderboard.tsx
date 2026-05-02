import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  matchPoints: number;
  preCupPoints: number;
  total: number;
  predictionsCount: number;
  hasPrecupPick: boolean;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
    refetchInterval: 30_000,
  });

  const medals = ["🥇", "🥈", "🥉"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg animate-pulse">Carregando placar...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">🏆 Placar Geral</h1>
        <p className="text-gray-500 mt-1">Atualizado automaticamente a cada 30 segundos</p>
      </div>

      {/* Top 3 podium */}
      {data && data.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[data[1], data[0], data[2]].map((entry, i) => {
            const podiumRank = [2, 1, 3][i];
            const heights = ["h-24", "h-32", "h-20"];
            return (
              <div key={entry.id} className="flex flex-col items-center">
                <div className="text-3xl mb-1">{medals[podiumRank - 1]}</div>
                <div className="font-bold text-gray-800 text-sm text-center">{entry.name}</div>
                <div
                  className={`${heights[i]} w-full mt-2 rounded-t-lg flex items-center justify-center font-black text-white text-lg ${
                    podiumRank === 1
                      ? "bg-yellow-400 text-yellow-900"
                      : podiumRank === 2
                      ? "bg-gray-400"
                      : "bg-orange-400"
                  }`}
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
              <th className="px-4 py-3 text-right">Jogos</th>
              <th className="px-4 py-3 text-right">Pré-Copa</th>
              <th className="px-4 py-3 text-right font-black">Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((entry, i) => {
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
                  <td className="px-4 py-3 text-center">
                    {entry.rank <= 3 ? medals[entry.rank - 1] : entry.rank}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">{entry.name}</span>
                    {isMe && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                        você
                      </span>
                    )}
                    {!entry.hasPrecupPick && (
                      <span className="ml-2 text-xs text-orange-500">⚠️ sem pré-copa</span>
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

      <p className="text-center text-xs text-gray-400 mt-4">
        <a href="/api/leaderboard/export.csv" className="hover:underline">
          📥 Exportar CSV (Power BI)
        </a>
      </p>
    </div>
  );
}