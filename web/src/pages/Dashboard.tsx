import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getLeaderboard, getMyPredictions, getMyPreCup } from "../api/client";

const CUP_START = new Date("2026-06-11T19:00:00Z");

interface LeaderboardEntry {
  id: number;
  name: string;
  matchPoints: number;
  preCupPoints: number;
  total: number;
}

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const total = Math.max(0, diff);
  const days = Math.floor(total / 86400000);
  const hours = Math.floor((total % 86400000) / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  return { days, hours, minutes, seconds, started: diff <= 0 };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl md:text-5xl font-black text-white tabular-nums w-16 md:w-24 text-center"
      >
        {String(value).padStart(2, "0")}
      </motion.div>
      <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const countdown = useCountdown(CUP_START);

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
  });
  const { data: myPreds = [] } = useQuery({ queryKey: ["my-predictions"], queryFn: getMyPredictions });
  const { data: preCup } = useQuery({ queryKey: ["my-precup"], queryFn: getMyPreCup });

  const me = leaderboard.find((e) => e.id === user?.id);
  const myRank = (leaderboard.findIndex((e) => e.id === user?.id) + 1) || null;

  const MEDALS = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-8">
      {/* Hero countdown */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a0a] via-[#0f0f0a] to-[#0a0a0f] border border-[#f5c842]/20 p-8"
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#f5c842]/10 blur-[60px] rounded-full" />
        </div>

        <div className="relative text-center">
          {countdown.started ? (
            <div>
              <div className="text-[#f5c842] text-sm font-bold uppercase tracking-widest mb-2">🔴 Ao Vivo</div>
              <div className="text-2xl font-black text-white">Copa do Mundo 2026 em andamento!</div>
            </div>
          ) : (
            <>
              <div className="text-white/30 text-xs uppercase tracking-widest mb-4 font-semibold">
                México 🇲🇽 vs África do Sul 🇿🇦 · Abertura da Copa
              </div>
              <div className="flex items-center justify-center gap-3 md:gap-6">
                <CountdownUnit value={countdown.days} label="dias" />
                <div className="text-white/20 text-3xl font-black mb-4">:</div>
                <CountdownUnit value={countdown.hours} label="horas" />
                <div className="text-white/20 text-3xl font-black mb-4">:</div>
                <CountdownUnit value={countdown.minutes} label="min" />
                <div className="text-white/20 text-3xl font-black mb-4">:</div>
                <CountdownUnit value={countdown.seconds} label="seg" />
              </div>
              <div className="mt-4 text-[#f5c842] font-black text-lg tracking-tight">
                FIFA World Cup 2026
              </div>
              <div className="text-white/20 text-xs mt-1">11 Jun – 19 Jul · USA, Canada & Mexico</div>
            </>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Posição", value: myRank ? `#${myRank}` : "–", sub: `de ${leaderboard.length} participantes`, accent: "#f5c842" },
          { label: "Pontos", value: me?.total ?? 0, sub: `${me?.matchPoints ?? 0} jogos + ${me?.preCupPoints ?? 0} pré`, accent: "#22c55e" },
          { label: "Palpites", value: myPreds.length, sub: "jogos apostados", accent: "#3b82f6" },
          { label: "Pré-Copa", value: preCup ? "✓" : "⚠️", sub: preCup ? "Picks feitos" : "Faltando!", accent: preCup ? "#22c55e" : "#f97316" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={item}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:border-white/15 transition">
            <div className="text-3xl font-black text-white">{stat.value}</div>
            <div className="text-xs font-bold text-white/40 mt-1 uppercase tracking-wider">{stat.label}</div>
            <div className="text-[11px] text-white/20 mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Alerts */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest">Ações rápidas</h2>
          {!preCup && (
            <motion.div variants={item}>
              <Link to="/pre-copa" className="flex items-center gap-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 hover:bg-orange-500/15 transition group">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="font-bold text-orange-300 text-sm">Palpites pré-copa faltando!</div>
                  <div className="text-xs text-orange-300/50">Escolha campeão, vergonha e surpresa</div>
                </div>
                <div className="ml-auto text-orange-300/30 group-hover:text-orange-300 transition">→</div>
              </Link>
            </motion.div>
          )}
          <motion.div variants={item}>
            <Link to="/jogos" className="flex items-center gap-4 bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:border-white/20 transition group">
              <div className="text-2xl">⚽</div>
              <div>
                <div className="font-bold text-white text-sm">Ver jogos</div>
                <div className="text-xs text-white/30">Fazer e atualizar palpites</div>
              </div>
              <div className="ml-auto text-white/20 group-hover:text-white transition">→</div>
            </Link>
          </motion.div>
          <motion.div variants={item}>
            <Link to="/placar" className="flex items-center gap-4 bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:border-white/20 transition group">
              <div className="text-2xl">🏆</div>
              <div>
                <div className="font-bold text-white text-sm">Ver placar completo</div>
                <div className="text-xs text-white/30">Ranking de todos os participantes</div>
              </div>
              <div className="ml-auto text-white/20 group-hover:text-white transition">→</div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Mini leaderboard */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Top 5</h2>
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            {leaderboard.slice(0, 5).map((entry, i) => (
              <div key={entry.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${entry.id === user?.id ? "bg-[#f5c842]/5" : ""}`}>
                <span className="text-lg w-8 text-center">{i < 3 ? MEDALS[i] : <span className="text-white/20 text-sm">{i + 1}</span>}</span>
                <span className={`flex-1 text-sm font-semibold truncate ${entry.id === user?.id ? "text-[#f5c842]" : "text-white/70"}`}>{entry.name}</span>
                <span className="font-black text-white tabular-nums">{entry.total}</span>
                <span className="text-white/20 text-xs">pts</span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-center py-8 text-white/20 text-sm">Nenhum participante ainda</div>
            )}
          </div>
          <Link to="/placar" className="block text-center text-xs text-white/20 hover:text-[#f5c842] transition mt-3">Ver placar completo →</Link>
        </motion.div>
      </div>
    </div>
  );
}
