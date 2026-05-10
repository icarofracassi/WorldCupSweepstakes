import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Flag from "react-world-flags";
import { getLeague, getLeagueByCode, createLeague, joinLeague, leaveLeague, deleteLeague } from "../api/client";
import { useLeague } from "../context/LeagueContext";
import { useAuth } from "../context/AuthContext";

const FIFA_TO_ISO: Record<string, string> = {
  GER:"DE",SWE:"SE",HAI:"HT",URU:"UY",MEX:"MX",SUI:"CH",NED:"NL",DEN:"DK",POR:"PT",ESP:"ES",FRA:"FR",
  ENG:"GB-ENG",SCO:"GB-SCT",BRA:"BR",ARG:"AR",COL:"CO",ECU:"EC",CHI:"CL",PAR:"PY",BOL:"BO",VEN:"VE",
  PER:"PE",USA:"US",CAN:"CA",CRC:"CR",PAN:"PA",SEN:"SN",MAR:"MA",TUN:"TN",NGA:"NG",CMR:"CM",GHA:"GH",
  CIV:"CI",ALG:"DZ",EGY:"EG",RSA:"ZA",COD:"CD",CPV:"CV",QAT:"QA",KSA:"SA",IRN:"IR",IRQ:"IQ",JOR:"JO",
  KOR:"KR",JPN:"JP",AUS:"AU",NZL:"NZ",UZB:"UZ",CRO:"HR",POL:"PL",SRB:"RS",SVK:"SK",CZE:"CZ",HUN:"HU",
  AUT:"AT",BIH:"BA",UKR:"UA",TUR:"TR",BEL:"BE",ITA:"IT",NOR:"NO",CUR:"CW",
};
function getFlagCode(code: string) { return FIFA_TO_ISO[code] ?? code; }

const MEDALS = ["🥇", "🥈", "🥉"];

interface LeagueSummary {
  id: number; name: string; code: string; createdById: number;
  _count: { members: number };
  createdBy?: { name: string };
}

interface LeaderboardEntry {
  id: number; rank: number; name: string;
  matchPoints: number; preCupPoints: number; total: number;
  hasPrecupPick: boolean;
  preCupPick: { champion: { name: string; code: string } } | null;
}

interface LeagueDetail extends LeagueSummary {
  leaderboard: LeaderboardEntry[];
}

function CodeBadge({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl px-4 py-2.5 transition group">
      <span className="font-mono font-black text-[#f5c842] tracking-widest text-lg">{code}</span>
      <span className="text-xs text-white/30 group-hover:text-white/60 transition ml-1">
        {status === "copied" ? "✓ copiado!" : status === "error" ? "erro" : "copiar"}
      </span>
    </button>
  );
}

function ShareButton({ league }: { league: LeagueSummary }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const inviteUrl = `${window.location.origin}/convite/${league.code}`;

  const share = async () => {
    try {
      const text = `Entre na liga ${league.name} no Bolão Copa 2026: ${inviteUrl}`;
      if (navigator.share) {
        await navigator.share({ title: league.name, text, url: inviteUrl });
        return;
      }
      await navigator.clipboard.writeText(inviteUrl);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <button onClick={share}
      className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-blue-500/15 text-xs font-bold transition">
      {status === "copied" ? "Link copiado!" : status === "error" ? "Falha ao compartilhar" : "Compartilhar link"}
    </button>
  );
}

function LeagueCard({ league, isActive, onClick }: {
  league: LeagueSummary; isActive: boolean; onClick: () => void;
}) {
  return (
    <motion.button whileHover={{ y: -2 }} onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition ${
        isActive
          ? "bg-[#f5c842]/8 border-[#f5c842]/30"
          : "bg-white/[0.03] border-white/8 hover:border-white/20"
      }`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`font-black text-sm ${isActive ? "text-[#f5c842]" : "text-white"}`}>{league.name}</div>
          <div className="text-xs text-white/30 mt-0.5">{league._count.members} participante{league._count.members !== 1 ? "s" : ""}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-white/25">{league.code}</div>
          {isActive && <div className="text-[10px] text-[#f5c842]/60 mt-0.5">ativa</div>}
        </div>
      </div>
    </motion.button>
  );
}

export default function Liga() {
  const { user } = useAuth();
  const { leagues, activeLeague, setActiveLeague, refetch } = useLeague();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<"overview" | "create" | "join">("overview");
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPreview, setJoinPreview] = useState<LeagueSummary | null>(null);
  const [joinError, setJoinError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: leagueDetail } = useQuery<LeagueDetail>({
    queryKey: ["league", activeLeague?.id],
    queryFn: () => getLeague(activeLeague!.id),
    enabled: !!activeLeague,
  });

  const createMutation = useMutation({
    mutationFn: () => createLeague(newName),
    onSuccess: async (data) => {
      await refetch();
      setActiveLeague(data);
      setNewName("");
      setTab("overview");
      qc.invalidateQueries({ queryKey: ["league"] });
    },
  });

  const joinMutation = useMutation({
    mutationFn: () => joinLeague(joinCode.toUpperCase().trim()),
    onSuccess: async (data) => {
      await refetch();
      setActiveLeague(data);
      setJoinCode("");
      setJoinPreview(null);
      setTab("overview");
      qc.invalidateQueries({ queryKey: ["league"] });
    },
    onError: (err: any) => setJoinError(err.response?.data?.error ?? "Erro ao entrar"),
  });

  const leaveMutation = useMutation({
    mutationFn: (id: number) => leaveLeague(id),
    onSuccess: async () => {
      await refetch();
      setActiveLeague(null);
      qc.invalidateQueries({ queryKey: ["league"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLeague(id),
    onSuccess: async () => {
      await refetch();
      setActiveLeague(null);
      setDeleteConfirm(false);
      qc.invalidateQueries({ queryKey: ["league"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (err: any) => setJoinError(err.response?.data?.error ?? "Erro ao excluir liga"),
  });

  const previewCode = async () => {
    setJoinError("");
    if (joinCode.length < 6) return;
    try {
      const data = await getLeagueByCode(joinCode.toUpperCase().trim());
      setJoinPreview(data);
    } catch {
      setJoinError("Liga não encontrada");
      setJoinPreview(null);
    }
  };

  useEffect(() => {
    const pendingCode = (searchParams.get("code") ?? localStorage.getItem("pendingLeagueCode") ?? "").toUpperCase();
    if (!pendingCode) return;
    setTab("join");
    setJoinCode(pendingCode);
    setJoinError("");
    setJoinPreview(null);
    localStorage.removeItem("pendingLeagueCode");
  }, [searchParams]);

  useEffect(() => {
    if (tab !== "join" || joinCode.length !== 6 || joinPreview || joinError) return;
    previewCode();
  }, [joinCode, tab, joinPreview, joinError]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white">🏟️ Ligas</h1>
        <p className="text-white/30 text-sm mt-0.5">Crie ou entre em uma liga com seus amigos do escritório</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: my leagues */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest">Minhas Ligas</h2>
            <span className="text-xs text-white/20">{leagues.length}/5</span>
          </div>

          {leagues.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/6 border-dashed rounded-2xl p-6 text-center text-white/20 text-sm">
              Nenhuma liga ainda.<br />Crie ou entre em uma!
            </div>
          ) : (
            leagues.map((l) => (
              <LeagueCard key={l.id} league={l} isActive={activeLeague?.id === l.id}
                onClick={() => setActiveLeague(l)} />
            ))
          )}

          <div className="flex gap-2">
            <button onClick={() => setTab("create")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                tab === "create" ? "bg-[#f5c842]/10 border-[#f5c842]/30 text-[#f5c842]" : "bg-white/[0.03] border-white/8 text-white/40 hover:text-white"
              }`}>
              + Criar
            </button>
            <button onClick={() => setTab("join")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                tab === "join" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/[0.03] border-white/8 text-white/40 hover:text-white"
              }`}>
              → Entrar
            </button>
          </div>
        </div>

        {/* Right: detail / create / join */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">

            {/* Create */}
            {tab === "create" && (
              <motion.div key="create" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
                <div>
                  <h2 className="font-black text-white">Criar Nova Liga</h2>
                  <p className="text-white/30 text-xs mt-0.5">Um código de convite será gerado automaticamente</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Nome da Liga</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Bolão do RH, Turma da TI..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => createMutation.mutate()}
                    disabled={!newName.trim() || createMutation.isPending}
                    className="flex-1 py-3 bg-gradient-to-r from-[#f5c842] to-[#e8a020] text-black font-black text-sm rounded-xl disabled:opacity-40 transition">
                    {createMutation.isPending ? "Criando..." : "Criar Liga"}
                  </button>
                  <button onClick={() => setTab("overview")}
                    className="px-4 py-3 bg-white/5 border border-white/10 text-white/40 hover:text-white rounded-xl text-sm font-semibold transition">
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Join */}
            {tab === "join" && (
              <motion.div key="join" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
                <div>
                  <h2 className="font-black text-white">Entrar em uma Liga</h2>
                  <p className="text-white/30 text-xs mt-0.5">Digite o código de 6 letras compartilhado pelo criador da liga</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Código de Convite</label>
                  <div className="flex gap-2">
                    <input value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinPreview(null); setJoinError(""); }}
                      maxLength={6} placeholder="ABCD12"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold text-lg placeholder-white/15 tracking-widest focus:outline-none focus:border-white/30 transition uppercase" />
                    <button onClick={previewCode} disabled={joinCode.length < 6}
                      className="px-4 py-3 bg-white/5 border border-white/10 text-white/50 hover:text-white rounded-xl text-sm font-semibold transition disabled:opacity-30">
                      Buscar
                    </button>
                  </div>
                  {joinError && <p className="text-red-400 text-xs mt-2">{joinError}</p>}
                </div>

                {joinPreview && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
                    <div className="font-black text-white">{joinPreview.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">{joinPreview._count.members} participante{joinPreview._count.members !== 1 ? "s" : ""} · criada por {joinPreview.createdBy?.name}</div>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => joinMutation.mutate()}
                    disabled={joinCode.length < 6 || joinMutation.isPending}
                    className="flex-1 py-3 bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 font-black text-sm rounded-xl disabled:opacity-40 transition">
                    {joinMutation.isPending ? "Entrando..." : "Entrar na Liga"}
                  </button>
                  <button onClick={() => setTab("overview")}
                    className="px-4 py-3 bg-white/5 border border-white/10 text-white/40 hover:text-white rounded-xl text-sm font-semibold transition">
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Overview */}
            {tab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {!activeLeague ? (
                  <div className="bg-white/[0.02] border border-white/6 border-dashed rounded-2xl p-12 text-center space-y-3">
                    <div className="text-4xl">🏟️</div>
                    <div className="text-white/40 font-semibold">Selecione uma liga ou crie uma nova</div>
                    <div className="text-white/20 text-xs">As ligas isolam o placar e os palpites entre grupos de amigos</div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* League header */}
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <h2 className="font-black text-xl text-white">{activeLeague.name}</h2>
                          <div className="text-white/30 text-xs mt-1">{activeLeague._count.members} participantes</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] text-white/30 uppercase tracking-widest">Código de convite</div>
                          <CodeBadge code={activeLeague.code} />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3 flex-wrap">
                        <ShareButton league={activeLeague} />
                        {activeLeague.createdById !== user?.id && (
                          <button onClick={() => leaveMutation.mutate(activeLeague.id)}
                            disabled={leaveMutation.isPending}
                            className="text-xs text-red-400/50 hover:text-red-400 transition font-semibold">
                            {leaveMutation.isPending ? "Saindo..." : "Sair desta liga"}
                          </button>
                        )}
                        {activeLeague.createdById === user?.id && (
                          deleteConfirm ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => deleteMutation.mutate(activeLeague.id)}
                                disabled={deleteMutation.isPending}
                                className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 text-xs font-bold transition disabled:opacity-40">
                                {deleteMutation.isPending ? "Excluindo..." : "Confirmar exclusão"}
                              </button>
                              <button onClick={() => setDeleteConfirm(false)}
                                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white text-xs font-bold transition">
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(true)}
                              className="text-xs text-red-400/50 hover:text-red-400 transition font-semibold">
                              Excluir liga
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Leaderboard */}
                    <div>
                      <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Placar da Liga</h3>
                      {!leagueDetail ? (
                        <div className="text-white/20 text-sm text-center py-8 animate-pulse">Carregando...</div>
                      ) : leagueDetail.leaderboard.length === 0 ? (
                        <div className="text-white/15 text-sm text-center py-8">Nenhum participante com pontos ainda</div>
                      ) : (
                        <div className="bg-white/[0.02] border border-white/6 rounded-2xl overflow-hidden">
                          {leagueDetail.leaderboard.map((entry) => {
                            const isMe = entry.id === user?.id;
                            return (
                              <div key={entry.id}
                                className={`flex items-center gap-3 px-4 py-3.5 border-b border-white/5 last:border-0 ${isMe ? "bg-[#f5c842]/5" : ""}`}>
                                <div className="w-7 text-center text-base flex-shrink-0">
                                  {entry.rank <= 3 ? MEDALS[entry.rank - 1] : <span className="text-white/20 text-sm font-bold">{entry.rank}</span>}
                                </div>
                                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black ${isMe ? "bg-[#f5c842] text-black" : "bg-white/10 text-white/50"}`}>
                                  {entry.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-bold truncate ${isMe ? "text-[#f5c842]" : "text-white/70"}`}>
                                    {entry.name} {isMe && <span className="text-[10px] opacity-50">você</span>}
                                  </div>
                                  {entry.preCupPick ? (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <div className="w-3 h-3 rounded-full overflow-hidden">
                                        <Flag code={getFlagCode(entry.preCupPick.champion.code ?? "")}
                                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                      </div>
                                      <span className="text-[10px] text-white/20">{entry.preCupPick.champion.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-orange-400/50">sem pré-copa</span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] text-white/20 hidden sm:block">{entry.matchPoints} + {entry.preCupPoints}</div>
                                  <span className={`font-black tabular-nums ${isMe ? "text-[#f5c842]" : "text-white"}`}>{entry.total}</span>
                                  <span className="text-white/20 text-xs ml-0.5">pts</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
