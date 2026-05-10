import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Flag from "react-world-flags";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLeaderboard, getMatches, api } from "../api/client";
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

interface Team { id: number; name: string; code: string; }
interface Match {
  id: number; teamA: Team; teamB: Team; phase: string;
  matchDate: string; scoreAReal: number | null; scoreBReal: number | null;
  isFinished: boolean; groupName: string | null;
}
interface UserPred { userId: number; userName: string; scoreA: number; scoreB: number; pointsEarned: number; }
interface LeaderboardEntry { id: number; name: string; total: number; }

const PHASE_LABELS: Record<string, string> = {
  group:"Grupos", r16:"Oitavas", qf:"Quartas", sf:"Semi", final:"Final",
};

export default function Palpites() {
  const { user } = useAuth();
  const [selectedPhase, setSelectedPhase] = useState("group");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [matchPreds, setMatchPreds] = useState<UserPred[]>([]);
  const [loadingPreds, setLoadingPreds] = useState(false);

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["matches", selectedPhase],
    queryFn: () => getMatches(selectedPhase),
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });

  const userMap = Object.fromEntries(leaderboard.map((u) => [u.id, u.name]));

  async function loadPredictions(matchId: number) {
    if (selectedMatchId === matchId) { setSelectedMatchId(null); return; }
    setSelectedMatchId(matchId);
    setLoadingPreds(true);
    try {
      const res = await api.get(`/predictions/match/${matchId}`);
      const preds = res.data.map((p: any) => ({
        userId: p.userId,
        userName: p.user?.name ?? userMap[p.userId] ?? "Participante",
        scoreA: p.scoreA,
        scoreB: p.scoreB,
        pointsEarned: p.pointsEarned,
      }));
      setMatchPreds(preds);
    } finally {
      setLoadingPreds(false);
    }
  }

  const finishedMatches = matches.filter((m) => m.isFinished);
  const upcomingMatches = matches.filter((m) => !m.isFinished && new Date() < new Date(m.matchDate));

  function MatchRow({ match }: { match: Match }) {
    const isOpen = selectedMatchId === match.id;
    const kickoff = new Date(match.matchDate);

    return (
      <div className={`rounded-2xl border overflow-hidden transition ${
        isOpen ? "border-white/20 bg-white/[0.04]" : "border-white/8 bg-white/[0.02] hover:border-white/15"
      }`}>
        <button className="w-full flex items-center gap-4 px-4 py-3.5 text-left" onClick={() => loadPredictions(match.id)}>
          {/* Teams */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10">
              <Flag code={getFlagCode(match.teamA.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
            <span className="text-sm font-bold text-white/80 truncate">{match.teamA.name}</span>
            {match.isFinished ? (
              <span className="text-sm font-black text-white mx-1">{match.scoreAReal}–{match.scoreBReal}</span>
            ) : (
              <span className="text-xs text-white/25 mx-1">{format(kickoff, "HH:mm")}</span>
            )}
            <span className="text-sm font-bold text-white/80 truncate">{match.teamB.name}</span>
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10">
              <Flag code={getFlagCode(match.teamB.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {match.groupName && (
              <span className="text-[10px] text-white/20 hidden sm:block">
                {match.groupName.replace("GROUP_", "Gr. ")}
              </span>
            )}
            <span className="text-[10px] text-white/20">
              {format(kickoff, "dd MMM", { locale: ptBR })}
            </span>
            <span className={`text-xs transition ${isOpen ? "text-white" : "text-white/20"}`}>
              {isOpen ? "▲" : "▼"}
            </span>
          </div>
        </button>

        {/* Expanded predictions */}
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }}
            className="border-t border-white/8 px-4 py-4">
            {loadingPreds ? (
              <div className="text-center py-4 text-white/20 text-sm animate-pulse">Carregando palpites...</div>
            ) : matchPreds.length === 0 ? (
              <div className="text-center py-4 text-white/15 text-sm">Nenhum palpite feito ainda.</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {matchPreds
                  .sort((a, b) => {
                    if (a.userId === user?.id) return -1;
                    if (b.userId === user?.id) return 1;
                    return b.pointsEarned - a.pointsEarned;
                  })
                  .map((pred) => {
                    const isMe = pred.userId === user?.id;
                    const isCorrect = match.isFinished &&
                      pred.scoreA === match.scoreAReal && pred.scoreB === match.scoreBReal;
                    const isRightWinner = match.isFinished && !isCorrect &&
                      Math.sign(pred.scoreA - pred.scoreB) === Math.sign((match.scoreAReal ?? 0) - (match.scoreBReal ?? 0));

                    return (
                      <div key={pred.userId}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                          isMe
                            ? "bg-[#f5c842]/8 border-[#f5c842]/25"
                            : "bg-white/[0.02] border-white/6"
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isMe ? "bg-[#f5c842] text-black" : "bg-white/10 text-white/50"
                        }`}>
                          {pred.userName[0].toUpperCase()}
                        </div>

                        {/* Name */}
                        <span className={`text-sm flex-1 truncate ${isMe ? "font-black text-[#f5c842]" : "font-semibold text-white/60"}`}>
                          {pred.userName} {isMe && <span className="text-[10px] opacity-60">você</span>}
                        </span>

                        {/* Score */}
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-sm ${
                            isCorrect ? "text-green-400" : isRightWinner ? "text-yellow-400" : "text-white"
                          }`}>
                            {pred.scoreA}–{pred.scoreB}
                          </span>
                          {isCorrect && <span className="text-green-400 text-xs">✓</span>}
                          {isRightWinner && !isCorrect && <span className="text-yellow-400 text-xs">~</span>}
                        </div>

                        {/* Points */}
                        {match.isFinished && (
                          <span className={`text-xs font-bold ml-1 ${
                            pred.pointsEarned > 0 ? "text-green-400" : "text-white/20"
                          }`}>
                            +{pred.pointsEarned}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Legend */}
            {match.isFinished && matchPreds.length > 0 && (
              <div className="flex gap-4 mt-3 text-[10px] text-white/20">
                <span><span className="text-green-400">✓</span> Placar exato</span>
                <span><span className="text-yellow-400">~</span> Vencedor certo</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">👁 Palpites de Todos</h1>
        <p className="text-white/30 text-sm mt-0.5">Clique em um jogo para ver os palpites de cada participante</p>
      </div>

      {/* Phase filter */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(PHASE_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => { setSelectedPhase(key); setSelectedMatchId(null); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${
              selectedPhase === key
                ? "bg-[#f5c842] text-black border-[#f5c842]"
                : "bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white"
            }`}>{label}</button>
        ))}
      </div>

      {isLoading && <div className="text-center py-20 text-white/20 animate-pulse">Carregando jogos...</div>}

      {/* Finished matches */}
      {finishedMatches.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-white/25 uppercase tracking-widest">Jogos Encerrados</h2>
          {finishedMatches.map((m) => <MatchRow key={m.id} match={m} />)}
        </div>
      )}

      {/* Upcoming */}
      {upcomingMatches.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-white/25 uppercase tracking-widest">Próximos Jogos</h2>
          <p className="text-white/15 text-xs">Palpites só visíveis após o início do jogo.</p>
          {upcomingMatches.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-white/6 rounded-2xl opacity-50">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10">
                  <Flag code={getFlagCode(m.teamA.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
                <span className="text-sm text-white/50">{m.teamA.name}</span>
                <span className="text-white/20 text-xs">{format(new Date(m.matchDate), "dd/MM HH:mm")}</span>
                <span className="text-sm text-white/50">{m.teamB.name}</span>
                <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10">
                  <Flag code={getFlagCode(m.teamB.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
              </div>
              <span className="text-white/15 text-xs">🔒 Em breve</span>
            </div>
          ))}
        </div>
      )}

      {!isLoading && matches.length === 0 && (
        <div className="text-center py-20 text-white/15">Nenhum jogo nesta fase ainda.</div>
      )}
    </div>
  );
}