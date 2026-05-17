import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Flag from "react-world-flags";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { getMatches, getMyPredictions, submitPrediction } from "../api/client";
import { useTranslation } from "react-i18next";

interface Team { id: number; name: string; code: string; }
interface Match {
  id: number; teamA: Team; teamB: Team; phase: string;
  phaseMultiplier: number; matchDate: string;
  scoreAReal: number | null; scoreBReal: number | null;
  isFinished: boolean; groupName: string | null;
}
interface Prediction { matchId: number; scoreA: number; scoreB: number; pointsEarned: number; }

const PHASE_LABELS: Record<string, string> = {
  group: "games.phases.group", r16: "games.phases.r16",
  qf: "games.phases.qf", sf: "games.phases.sf", final: "games.phases.final",
};

const FIFA_TO_ISO: Record<string, string> = {
  GER:"DE", SWE:"SE", HAI:"HT", URU:"UY", MEX:"MX", SUI:"CH",
  NED:"NL", DEN:"DK", POR:"PT", ESP:"ES", FRA:"FR", ENG:"GB-ENG",
  SCO:"GB-SCT", BRA:"BR", ARG:"AR", COL:"CO", ECU:"EC", CHI:"CL",
  PAR:"PY", BOL:"BO", VEN:"VE", PER:"PE", USA:"US", CAN:"CA",
  CRC:"CR", PAN:"PA", SEN:"SN", MAR:"MA", TUN:"TN", NGA:"NG",
  CMR:"CM", GHA:"GH", CIV:"CI", ALG:"DZ", EGY:"EG", RSA:"ZA",
  COD:"CD", CPV:"CV", QAT:"QA", KSA:"SA", IRN:"IR", IRQ:"IQ",
  JOR:"JO", KOR:"KR", JPN:"JP", AUS:"AU", NZL:"NZ", UZB:"UZ",
  CRO:"HR", POL:"PL", SRB:"RS", SVK:"SK", CZE:"CZ", HUN:"HU",
  AUT:"AT", BIH:"BA", UKR:"UA", TUR:"TR", BEL:"BE", ITA:"IT",
  NOR:"NO", CUR:"CW", ENG2:"GB",
};

function getFlagCode(code: string): string { return FIFA_TO_ISO[code] ?? code; }

function groupLabel(g: string): string { return "Grupo " + g.replace("GROUP_", ""); }

function dayLabel(
  dateStr: string,
  labels: { today: string; tomorrow: string; yesterday: string },
  locale: typeof ptBR | typeof enUS,
  isPortuguese: boolean,
): string {
  const d = new Date(dateStr);
  if (isToday(d)) return labels.today;
  if (isTomorrow(d)) return labels.tomorrow;
  if (isYesterday(d)) return labels.yesterday;
  const pattern = isPortuguese ? "EEEE, dd 'de' MMM" : "EEEE, dd MMM";
  return format(d, pattern, { locale });
}

function groupByDay(matches: Match[]): Record<string, Match[]> {
  return matches.reduce((acc, m) => {
    const key = new Date(m.matchDate).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, Match[]>);
}

function TeamFlag({ code, name }: { code: string; name: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10 shadow-lg bg-white/5 flex-shrink-0">
        <Flag code={getFlagCode(code)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <span className="text-xs font-bold text-white/70 text-center leading-tight max-w-[70px] truncate">
        {t(`teams.${code}`, { defaultValue: name })}
      </span>
    </div>
  );
}
export default function Jogos() {
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language.startsWith("pt");
  const dateLocale = isPortuguese ? ptBR : enUS;
  const qc = useQueryClient();
  const [selectedPhase, setSelectedPhase] = useState("group");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [inputs, setInputs] = useState<Record<number, [string, string]>>({});
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  const [allSaved, setAllSaved] = useState(false);

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["matches", selectedPhase],
    queryFn: () => getMatches(selectedPhase),
  });

  const { data: myPreds = [] } = useQuery<Prediction[]>({
    queryKey: ["my-predictions"],
    queryFn: getMyPredictions,
  });

  const predMap = Object.fromEntries(myPreds.map((p) => [p.matchId, p]));

  const groups = useMemo(() => {
    if (selectedPhase !== "group") return [];
    const seen = new Set<string>();
    matches.forEach((m) => { if (m.groupName) seen.add(m.groupName); });
    return ["ALL", ...Array.from(seen).sort()];
  }, [matches, selectedPhase]);

  const visibleMatches = useMemo(() => {
    if (selectedPhase !== "group" || selectedGroup === "ALL") return matches;
    return matches.filter((m) => m.groupName === selectedGroup);
  }, [matches, selectedPhase, selectedGroup]);

  const byDay = useMemo(() => groupByDay(visibleMatches), [visibleMatches]);
  const dayKeys = Object.keys(byDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const mutation = useMutation({
    mutationFn: ({ matchId, a, b }: { matchId: number; a: number; b: number }) =>
      submitPrediction(matchId, a, b),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["my-predictions"] });
      setSavedIds((s) => new Set([...s, vars.matchId]));
      setTimeout(() => setSavedIds((s) => { const n = new Set(s); n.delete(vars.matchId); return n; }), 2500);
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

  const isLocked = (m: Match) => new Date() >= new Date(m.matchDate);

  const saveMatch = async (match: Match) => {
    const a = parseInt(getInput(match.id, 0));
    const b = parseInt(getInput(match.id, 1));
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return;
    mutation.mutate({ matchId: match.id, a, b });
  };

  const saveAll = async () => {
    setSavingAll(true);
    const pending = visibleMatches.filter((m) => !isLocked(m) && !m.isFinished);
    for (const match of pending) {
      const a = parseInt(getInput(match.id, 0));
      const b = parseInt(getInput(match.id, 1));
      if (!isNaN(a) && !isNaN(b) && a >= 0 && b >= 0) {
        await submitPrediction(match.id, a, b);
      }
    }
    qc.invalidateQueries({ queryKey: ["my-predictions"] });
    setSavingAll(false);
    setAllSaved(true);
    setTimeout(() => setAllSaved(false), 3000);
  };

  const pendingWithInput = visibleMatches.filter((m) => {
    if (isLocked(m) || m.isFinished) return false;
    const a = parseInt(getInput(m.id, 0));
    const b = parseInt(getInput(m.id, 1));
    return !isNaN(a) && !isNaN(b);
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{t("games.title")}</h1>
          <p className="text-white/30 text-sm mt-0.5">{t("games.predictionsDone", { count: myPreds.length })}</p>
        </div>
        <AnimatePresence>
          {pendingWithInput > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={saveAll}
              disabled={savingAll}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-lg ${
                allSaved
                  ? "bg-green-500/20 border border-green-500/40 text-green-400"
                  : "bg-[#f5c842] text-black hover:bg-yellow-400 shadow-yellow-500/20"
              }`}
            >
               {savingAll ? t("games.saving") : allSaved ? t("games.allSaved") : t("games.saveAllWithCount", { count: pendingWithInput })}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Phase pills */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(PHASE_LABELS).map(([key, label]) => (
          <button key={key}
            onClick={() => { setSelectedPhase(key); setSelectedGroup("ALL"); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${
              selectedPhase === key
                ? "bg-[#f5c842] text-black border-[#f5c842]"
                : "bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white"
            }`}
           >{t(label)}</button>
        ))}
      </div>

      {/* Group pills */}
      {selectedPhase === "group" && groups.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {groups.map((g) => (
            <button key={g}
              onClick={() => setSelectedGroup(g)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                selectedGroup === g
                  ? "bg-white/15 text-white border-white/30"
                  : "bg-white/[0.03] text-white/30 border-white/8 hover:border-white/20 hover:text-white/60"
              }`}
             >{g === "ALL" ? t("common.all") : groupLabel(g)}</button>
          ))}
        </div>
      )}

      {isLoading && (
         <div className="text-center py-20 text-white/20 animate-pulse">{t("games.loadingMatches")}</div>
      )}

      {/* Days */}
      {dayKeys.map((dayKey) => {
        const dayMatches = byDay[dayKey];
         const label = dayLabel(dayMatches[0].matchDate, {
           today: t("games.today"),
           tomorrow: t("games.tomorrow"),
           yesterday: t("games.yesterday"),
         }, dateLocale, isPortuguese);
        return (
          <div key={dayKey}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">{label}</span>
              <div className="flex-1 h-px bg-white/5" />
               <span className="text-xs text-white/15">{t("games.matchesCount", { count: dayMatches.length })}</span>
            </div>

            {/* Match cards grid */}
            <div className="grid gap-3 md:grid-cols-2">
              {dayMatches.map((match, idx) => {
                const pred = predMap[match.id];
                const locked = isLocked(match);
                const isSaved = savedIds.has(match.id);
                const kickoff = new Date(match.matchDate);

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`relative rounded-2xl border transition overflow-hidden ${
                      match.isFinished
                        ? "bg-white/[0.02] border-white/5"
                        : locked
                        ? "bg-orange-500/5 border-orange-500/15"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Top meta row */}
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                      <div className="flex items-center gap-2">
                        {match.groupName && (
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                            {groupLabel(match.groupName)}
                          </span>
                        )}
                        {!match.groupName && (
                          <span className="text-[10px] font-black text-[#f5c842]/60 uppercase tracking-widest">
                            {PHASE_LABELS[match.phase]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/20">
                          {format(kickoff, "HH:mm")}
                        </span>
                        <span className="text-[10px] text-white/15">×{match.phaseMultiplier}</span>
                        {locked && !match.isFinished && (
                          <span className="text-[10px] text-orange-400 font-bold">🔒</span>
                        )}
                      </div>
                    </div>

                    {/* Main content: team A | score | team B */}
                    <div className="flex items-center justify-between px-4 py-4 gap-2">
                      {/* Team A */}
                      <TeamFlag code={match.teamA.code} name={match.teamA.name} />

                      {/* Center: score or inputs */}
                      <div className="flex flex-col items-center gap-2 flex-1">
                        {match.isFinished ? (
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-white">{match.scoreAReal}</span>
                            <span className="text-white/20 font-black">–</span>
                            <span className="text-3xl font-black text-white">{match.scoreBReal}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min={0} max={20} disabled={locked}
                              value={getInput(match.id, 0)}
                              onChange={(e) => setInput(match.id, 0, e.target.value)}
                              className="w-12 h-12 text-center bg-white/8 border border-white/15 rounded-xl font-black text-xl text-white disabled:opacity-30 focus:border-[#f5c842]/60 focus:bg-white/12 outline-none transition"
                            />
                            <span className="text-white/20 font-black text-lg">–</span>
                            <input
                              type="number" min={0} max={20} disabled={locked}
                              value={getInput(match.id, 1)}
                              onChange={(e) => setInput(match.id, 1, e.target.value)}
                              className="w-12 h-12 text-center bg-white/8 border border-white/15 rounded-xl font-black text-xl text-white disabled:opacity-30 focus:border-[#f5c842]/60 focus:bg-white/12 outline-none transition"
                            />
                          </div>
                        )}

                        {/* Points / status */}
                        <div className="text-center">
                          {match.isFinished && pred && (
                            <span className="text-[11px] text-green-400 font-bold">
                              {pred.scoreA}–{pred.scoreB} · {pred.pointsEarned}pts
                            </span>
                          )}
                          {match.isFinished && !pred && (
                             <span className="text-[11px] text-white/15">{t("games.noPrediction")}</span>
                          )}
                          {!match.isFinished && pred && !locked && (
                             <span className="text-[11px] text-white/25">{t("games.currentPrediction", { a: pred.scoreA, b: pred.scoreB })}</span>
                          )}
                        </div>
                      </div>

                      {/* Team B */}
                      <TeamFlag code={match.teamB.code} name={match.teamB.name} />
                    </div>

                    {/* Save button */}
                    {!locked && !match.isFinished && (
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => saveMatch(match)}
                          disabled={mutation.isPending}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                            isSaved
                              ? "bg-green-500/15 border border-green-500/30 text-green-400"
                              : "bg-white/5 border border-white/10 text-white/50 hover:bg-[#f5c842]/10 hover:border-[#f5c842]/30 hover:text-[#f5c842]"
                          }`}
                        >
                           {isSaved ? t("games.saved") : t("games.savePrediction")}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!isLoading && dayKeys.length === 0 && (
         <div className="text-center py-20 text-white/20">{t("games.noMatchesInPhase")}</div>
      )}
    </div>
  );
}
