import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Flag from "react-world-flags";
import { getLeaderboard } from "../api/client";
import { useAuth } from "../context/AuthContext";

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

interface TeamInfo { name: string; flagEmoji: string; code: string; }
interface PreCupPickInfo {
  champion: TeamInfo; shameTeam: TeamInfo; surpriseTeam: TeamInfo;
}
interface LeaderboardEntry {
  id: number; rank: number; name: string;
  matchPoints: number; preCupPoints: number; total: number;
  predictionsCount: number; hasPrecupPick: boolean;
  preCupPick: PreCupPickInfo | null;
}

const MEDALS = ["🥇", "🥈", "🥉"];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const row = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

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
        <div className="text-white/20 animate-pulse">Carregando placar...</div>
      </div>
    );
  }

  const top3 = data.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">🏆 Placar Geral</h1>
          <p className="text-white/20 text-sm mt-0.5">{data.length} participantes · atualiza a cada 30s</p>
        </div>
        <a href="/api/leaderboard/export.csv"
          className="text-xs bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/30 px-4 py-2 rounded-xl font-semibold transition">
          📥 CSV
        </a>
      </div>

      {/* Podium */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-4 h-40">
          {[top3[1], top3[0], top3[2]].map((entry, i) => {
            const podiumRank = [2, 1, 3][i];
            const heights = ["h-24", "h-36", "h-20"];
            const glows = ["shadow-gray-500/20", "shadow-yellow-500/30", "shadow-orange-500/20"];
            const bgs = [
              "bg-gradient-to-b from-gray-500/20 to-gray-600/10 border-gray-500/30",
              "bg-gradient-to-b from-[#f5c842]/20 to-[#f5c842]/5 border-[#f5c842]/40",
              "bg-gradient-to-b from-orange-500/20 to-orange-600/10 border-orange-500/30",
            ];
            return (
              <motion.div key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-1 flex-1 max-w-[120px]"
              >
                <div className="text-2xl">{MEDALS[podiumRank - 1]}</div>
                <div className="text-xs font-bold text-white/60 text-center truncate w-full px-1">{entry.name}</div>
                <div className={`w-full ${heights[i]} rounded-t-xl border ${bgs[i]} shadow-lg ${glows[i]} flex flex-col items-center justify-center gap-1`}>
                  <span className="font-black text-white text-xl">{entry.total}</span>
                  <span className="text-white/30 text-[10px]">pts</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
        {data.map((entry) => {
          const isMe = entry.id === user?.id;
          return (
            <motion.div key={entry.id} variants={row}
              className={`flex items-center gap-4 px-4 py-3.5 border-b border-white/5 last:border-0 transition ${
                isMe ? "bg-[#f5c842]/5 border-[#f5c842]/10" : "hover:bg-white/[0.02]"
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center text-lg flex-shrink-0">
                {entry.rank <= 3 ? MEDALS[entry.rank - 1] : (
                  <span className="text-white/20 text-sm font-bold">{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black ${
                isMe ? "bg-[#f5c842] text-black" : "bg-white/10 text-white/50"
              }`}>
                {entry.name[0].toUpperCase()}
              </div>

              {/* Name + picks */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold truncate ${isMe ? "text-[#f5c842]" : "text-white/80"}`}>
                    {entry.name}
                  </span>
                  {isMe && <span className="text-[10px] text-[#f5c842]/60 font-bold">você</span>}
                </div>
                {/* Pre-cup picks */}
                {entry.preCupPick ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full overflow-hidden">
                        <Flag code={getFlagCode(entry.preCupPick.champion.code ?? "XX")}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span className="text-[10px] text-white/25">{entry.preCupPick.champion.name}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-orange-400/60">sem pré-copa</span>
                )}
              </div>

              {/* Points breakdown */}
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-white/20">{entry.matchPoints} + {entry.preCupPoints}</div>
              </div>

              {/* Total */}
              <div className="text-right flex-shrink-0">
                <span className={`text-lg font-black tabular-nums ${isMe ? "text-[#f5c842]" : "text-white"}`}>
                  {entry.total}
                </span>
                <span className="text-white/20 text-xs ml-0.5">pts</span>
              </div>
            </motion.div>
          );
        })}
        {data.length === 0 && (
          <div className="text-center py-16 text-white/15">Nenhum participante ainda.</div>
        )}
      </motion.div>
    </div>
  );
}