import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLeaderboard, getMyPredictions, getMyPreCup, getMatches } from "../api/client";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });

  const { data: myPreds = [] } = useQuery({
    queryKey: ["my-predictions"],
    queryFn: getMyPredictions,
  });

  const { data: preCup } = useQuery({
    queryKey: ["my-precup"],
    queryFn: getMyPreCup,
  });

  const { data: upcomingMatches = [] } = useQuery({
    queryKey: ["matches", "group"],
    queryFn: () => getMatches("group"),
  });

  const me = leaderboard.find((e: any) => e.id === user?.id);
  const myRank = leaderboard.findIndex((e: any) => e.id === user?.id) + 1;

  const pending = upcomingMatches.filter(
    (m: any) => !m.isFinished && new Date() < new Date(m.matchDate) && !myPreds.find((p: any) => p.matchId === m.id)
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">
          Olá, {user?.name}! 👋
        </h1>
        <p className="text-gray-500">Copa do Mundo 2026 · Bolão do Escritório</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Sua posição"
          value={myRank ? `#${myRank}` : "-"}
          sub={`de ${leaderboard.length} participantes`}
          color="bg-yellow-50 border-yellow-300"
        />
        <StatCard
          label="Total de pontos"
          value={me?.total ?? 0}
          sub={`${me?.matchPoints ?? 0} jogos + ${me?.preCupPoints ?? 0} pré-copa`}
          color="bg-green-50 border-green-300"
        />
        <StatCard
          label="Palpites feitos"
          value={myPreds.length}
          sub="jogos apostados"
          color="bg-blue-50 border-blue-300"
        />
        <StatCard
          label="Palpites pendentes"
          value={pending.length}
          sub="jogos sem palpite"
          color={pending.length > 0 ? "bg-orange-50 border-orange-300" : "bg-gray-50 border-gray-200"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick links */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-black text-gray-900 text-lg mb-4">Ações rápidas</h2>
          <div className="space-y-3">
            {!preCup && (
              <Link
                to="/pre-copa"
                className="flex items-center gap-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 hover:bg-yellow-100 transition"
              >
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-bold text-yellow-900">Palpites pré-copa faltando!</div>
                  <div className="text-sm text-yellow-700">Escolha campeão, vergonha e surpresa</div>
                </div>
              </Link>
            )}
            {pending.length > 0 && (
              <Link
                to="/jogos"
                className="flex items-center gap-3 bg-orange-50 border-2 border-orange-300 rounded-xl p-4 hover:bg-orange-100 transition"
              >
                <span className="text-2xl">⚽</span>
                <div>
                  <div className="font-bold text-orange-900">{pending.length} jogos sem palpite</div>
                  <div className="text-sm text-orange-700">Faça seus palpites antes de fechar</div>
                </div>
              </Link>
            )}
            <Link
              to="/placar"
              className="flex items-center gap-3 bg-green-50 border-2 border-green-300 rounded-xl p-4 hover:bg-green-100 transition"
            >
              <span className="text-2xl">🏆</span>
              <div>
                <div className="font-bold text-green-900">Ver placar completo</div>
                <div className="text-sm text-green-700">Ranking de todos os participantes</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Mini leaderboard */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-black text-gray-900 text-lg mb-4">Top 5 📊</h2>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry: any, i: number) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  entry.id === user?.id ? "bg-green-50 font-bold" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg w-8">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <span className="text-gray-800">{entry.name}</span>
                  {entry.id === user?.id && (
                    <span className="text-xs text-green-600 font-bold">você</span>
                  )}
                </div>
                <span className="font-black text-green-700">{entry.total} pts</span>
              </div>
            ))}
          </div>
          <Link to="/placar" className="block text-center text-sm text-green-700 font-semibold mt-4 hover:underline">
            Ver todos →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${color}`}>
      <div className="text-3xl font-black text-gray-900">{value}</div>
      <div className="font-semibold text-gray-700 text-sm mt-1">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}