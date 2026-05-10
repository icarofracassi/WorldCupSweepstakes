import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Flag from "react-world-flags";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLeaderboard, getMatches, api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLeague } from "../context/LeagueContext";
import { Link } from "react-router-dom";

const FIFA_TO_ISO: Record<string, string> = {
  GER:"DE",SWE:"SE",HAI:"HT",URU:"UY",MEX:"MX",SUI:"CH",NED:"NL",DEN:"DK",POR:"PT",ESP:"ES",FRA:"FR",
  ENG:"GB-ENG",SCO:"GB-SCT",BRA:"BR",ARG:"AR",COL:"CO",ECU:"EC",CHI:"CL",PAR:"PY",BOL:"BO",VEN:"VE",
  PER:"PE",USA:"US",CAN:"CA",CRC:"CR",PAN:"PA",SEN:"SN",MAR:"MA",TUN:"TN",NGA:"NG",CMR:"CM",GHA:"GH",
  CIV:"CI",ALG:"DZ",EGY:"EG",RSA:"ZA",COD:"CD",CPV:"CV",QAT:"QA",KSA:"SA",IRN:"IR",IRQ:"IQ",JOR:"JO",
  KOR:"KR",JPN:"JP",AUS:"AU",NZL:"NZ",UZB:"UZ",CRO:"HR",POL:"PL",SRB:"RS",SVK:"SK",CZE:"CZ",HUN:"HU",
  AUT:"AT",BIH:"BA",UKR:"UA",TUR:"TR",BEL:"BE",ITA:"IT",NOR:"NO",CUR:"CW",
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
  group: "Grupos", r16: "Oitavas", qf: "Quartas", sf: "Semi", final: "Final",
};

export default function Palpites() {
  const { user } = useAuth();
  const { activeLeague, leagues } = useLeague();
  const [scope, setScope] = useState<number | "all">(activeLeague?.id ?? "all");
  const [hasChosenScope, setHasChosenScope] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState("group");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [matchPreds, setMatchPreds] = useState<UserPred[]>([]);
  const [loadingPreds, setLoadingPreds] = useState(false);
  const selectedLeague = scope === "all" ? null : leagues.find((l) => l.id === scope) ?? null;

  useEffect(() => {
    if (!hasChosenScope && activeLeague) {
      setScope(activeLeague.id);
      return;
    }
    if (scope !== "all" && !leagues.some((l) => l.id === scope)) {
      setScope(activeLeague?.id ?? "all");
    }
  }, [activeLeague, hasChosenScope, leagues, scope]);

  useEffect(() => {
    setSelectedMatchId(null);
    setMatchPreds([]);
  }, [scope]);

  const chooseScope = (nextScope: number | "all") => {
    setHasChosenScope(true);
    setScope(nextScope);
  };

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["matches", selectedPhase],
    queryFn: () => getMatches(selectedPhase),
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", scope],
    queryFn: () => getLeaderboard(selectedLeague?.id),
  });

  const userMap = Object.fromEntries(leaderboard.map((u) => [u.id, u.name]));

  async function loadPredictions(matchId: number) {
    if (selectedMatchId === matchId) { setSelectedMatchId(null); return; }
    setSelectedMatchId(matchId);
    setLoadingPreds(true);
    try {
      const params = selectedLeague ? { params: { leagueId: selectedLeague.id } } : {};
      const res = await api.get(`/predictions/match/${matchId}`, params);
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
    const myPred = matchPreds.find((p) => p.userId === user?.id);

    return (
      <div className={`rounded-2xl border overflow-hidden transition ${
        isOpen ? "border-white/20 bg-white/[0.04]" : "border-white/8 bg-white/[0.02] hover:border-white/15"
      }`}>
        <button className="w-full flex items-center gap-4 px-4 py-3.5 text-left" onClick={() => loadPredictions(match.id)}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
              <Flag code={getFlagCode(match.teamA.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
            <span className="text-sm font-bold text-white/80 hidden sm:block truncate">{match.teamA.name}</span>
            {match.isFinished ? (
              <span className="text-sm font-black text-white mx-1 flex-shrink-0">{match.scoreAReal}–{match.scoreBReal}</span>
            ) : (
              <span className="text-xs text-white/25 mx-1 flex-shrink-0">{format(kickoff, "HH:mm")}</span>
            )}
            <span className="text-sm font-bold text-white/80 hidden sm:block truncate">{match.teamB.name}</span>
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
              <Flag code={getFlagCode(match.teamB.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {match.groupName && (
              <span className="text-[10px] text-white/20 hidden sm:block">{match.groupName.replace("GROUP_", "Gr. ")}</span>
            )}
            <span className="text-[10px] text-white/20">{format(kickoff, "dd/MM", { locale: ptBR })}</span>
            <span className={`text-xs transition ${isOpen ? "text-white" : "text-white/20"}`}>{isOpen ? "▲" : "▼"}</span>
          </div>
        </button>

        {/* Expanded */}
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
            className="border-t border-white/8 px-4 py-4">

            {/* League scope notice */}
            {selectedLeague && (
              <div className="text-[10px] text-white/20 mb-3 flex items-center gap-1">
                <span>🏟️</span>
                <span>Mostrando apenas membros de <span className="text-white/40">{selectedLeague.name}</span></span>
              </div>
            )}

            {loadingPreds ? (
              <div className="text-center py-4 text-white/20 text-sm animate-pulse">Carregando palpites...</div>
            ) : matchPreds.length === 0 ? (
              <div className="text-center py-4 text-white/15 text-sm">
                {!match.isFinished && new Date() < new Date(match.matchDate)
                  ? "🔒 Palpites visíveis após o kickoff"
                  : "Nenhum palpite feito ainda."}
              </div>
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
                    const isExact = match.isFinished &&
                      pred.scoreA === match.scoreAReal && pred.scoreB === match.scoreBReal;
                    const isRightWinner = match.isFinished && !isExact &&
                      Math.sign(pred.scoreA - pred.scoreB) === Math.sign((match.scoreAReal ?? 0) - (match.scoreBReal ?? 0));

                    return (
                      <div key={pred.userId}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                          isMe ? "bg-[#f5c842]/8 border-[#f5c842]/25" : "bg-white/[0.02] border-white/6"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isMe ? "bg-[#f5c842] text-black" : "bg-white/10 text-white/50"
                        }`}>
                          {pred.userName[0].toUpperCase()}
                        </div>
                        <span className={`text-sm flex-1 truncate ${isMe ? "font-black text-[#f5c842]" : "font-semibold text-white/60"}`}>
                          {pred.userName}
                          {isMe && <span className="ml-1 text-[10px] opacity-50">você</span>}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-sm ${
                            isExact ? "text-green-400" : isRightWinner ? "text-yellow-400" : "text-white"
                          }`}>
                            {pred.scoreA}–{pred.scoreB}
                          </span>
                          {isExact && <span className="text-green-400 text-xs">✓</span>}
                          {isRightWinner && !isExact && <span className="text-yellow-400 text-xs">~</span>}
                        </div>
                        {match.isFinished && (
                          <span className={`text-xs font-bold ml-1 flex-shrink-0 ${
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

            {match.isFinished && matchPreds.length > 0 && (
              <div className="flex gap-4 mt-3 text-[10px] text-white/15">
                <span><span className="text-green-400">✓</span> Placar exato</span>
                <span><span className="text-yellow-400">~</span> Vencedor certo</span>
              </div>
            )}

            {/* My prediction summary */}
            {myPred && match.isFinished && (
              <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-bold text-center ${
                myPred.pointsEarned >= 5 ? "bg-green-500/10 text-green-400" :
                myPred.pointsEarned >= 3 ? "bg-yellow-500/10 text-yellow-400" :
                myPred.pointsEarned > 0 ? "bg-blue-500/10 text-blue-400" :
                "bg-white/5 text-white/20"
              }`}>
                Seu palpite: {myPred.scoreA}–{myPred.scoreB} → {myPred.pointsEarned} pontos
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
        <div className="flex items-center gap-2 mt-1">
          {selectedLeague ? (
            <span className="text-xs bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] px-2.5 py-1 rounded-full font-bold">
              🏟️ {selectedLeague.name}
            </span>
          ) : (
            <span className="text-xs text-white/25">Todos os participantes</span>
          )}
        </div>
      </div>

      {/* Scope filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => chooseScope("all")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition border whitespace-nowrap ${
            scope === "all"
              ? "bg-white text-black border-white"
              : "bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white"
          }`}>
          Todos
        </button>
        {leagues.map((league) => (
          <button key={league.id} onClick={() => chooseScope(league.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition border whitespace-nowrap ${
              scope === league.id
                ? "bg-[#f5c842] text-black border-[#f5c842]"
                : "bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white"
            }`}>
            {league.name}
          </button>
        ))}
      </div>

      {/* No league prompt */}
      {leagues.length === 0 && scope === "all" && (
        <div className="bg-white/[0.02] border border-white/8 border-dashed rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">🏟️</span>
          <div className="flex-1 text-xs text-white/30">
            Sem liga ativa — vendo palpites de todos os participantes.
          </div>
          <Link to="/liga" className="text-xs text-[#f5c842]/60 hover:text-[#f5c842] font-bold transition flex-shrink-0">
            Criar liga →
          </Link>
        </div>
      )}

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

      {/* Finished */}
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
          {upcomingMatches.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-white/6 rounded-2xl opacity-40">
              <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10">
                <Flag code={getFlagCode(m.teamA.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <span className="text-sm text-white/50 flex-1">{m.teamA.name}</span>
              <span className="text-white/20 text-xs">{format(new Date(m.matchDate), "dd/MM HH:mm")}</span>
              <span className="text-sm text-white/50 flex-1 text-right">{m.teamB.name}</span>
              <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10">
                <Flag code={getFlagCode(m.teamB.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <span className="text-white/15 text-xs flex-shrink-0">🔒</span>
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
