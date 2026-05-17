import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useLeague } from "../context/LeagueContext";
import { createLeague, joinLeague, api } from "../api/client";
import { useTranslation } from "react-i18next";

type Step = "account" | "league";

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { refetch, setActiveLeague } = useLeague();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = (searchParams.get("league") ?? localStorage.getItem("pendingLeagueCode") ?? "").toUpperCase();

  const [step, setStep] = useState<Step>("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // League step
  const [leagueTab, setLeagueTab] = useState<"create" | "join">(inviteCode ? "join" : "create");
  const [leagueName, setLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState(inviteCode);
  const [joinPreview, setJoinPreview] = useState<any>(null);
  const [joinError, setJoinError] = useState("");
  const [leagueLoading, setLeagueLoading] = useState(false);

  const handleAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(name, email, password);
      setStep("league");
    } catch {
      setError(t("register.createAccountError"));
    } finally {
      setLoading(false);
    }
  };

  const previewJoinCode = async () => {
    setJoinError("");
    setJoinPreview(null);
    if (joinCode.length < 6) return;
    try {
      const res = await api.get(`/leagues/code/${joinCode.toUpperCase().trim()}`);
      setJoinPreview(res.data);
    } catch {
      setJoinError(t("register.leagueCodeNotFound"));
    }
  };

  const handleLeague = async () => {
    setLeagueLoading(true);
    setJoinError("");
    try {
      let league;
      if (leagueTab === "create") {
        if (!leagueName.trim()) { setJoinError(t("register.enterLeagueName")); return; }
        league = await createLeague(leagueName);
      } else {
        if (joinCode.length < 6) { setJoinError(t("register.enterLeagueCode")); return; }
        league = await joinLeague(joinCode.toUpperCase().trim());
      }
      await refetch();
      setActiveLeague(league);
      localStorage.removeItem("pendingLeagueCode");
      navigate("/dashboard");
    } catch (err: any) {
      setJoinError(err.response?.data?.error ?? t("register.joinLeagueError"));
    } finally {
      setLeagueLoading(false);
    }
  };

  const skipLeague = () => {
    localStorage.removeItem("pendingLeagueCode");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#f5c842]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {(["account", "league"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition ${
                step === s ? "bg-[#f5c842] text-black" :
                (i === 0 && step === "league") ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                "bg-white/5 text-white/25 border border-white/10"
              }`}>
                {i === 0 && step === "league" ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${step === s ? "text-white/60" : "text-white/20"}`}>
                 {s === "account" ? t("register.accountStep") : t("register.leagueStep")}
              </span>
              {i === 0 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Account */}
          {step === "account" && (
            <motion.div key="account" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5c842] to-[#e8a020] text-3xl mb-4 shadow-2xl shadow-yellow-500/30">⚽</div>
                <h1 className="text-3xl font-black text-white tracking-tight">{t("register.title")}</h1>
                <p className="text-white/30 mt-1 text-sm">{t("register.brand")}</p>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <form onSubmit={handleAccount} className="space-y-5">
                  {error && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                      {error}
                    </motion.div>
                  )}
                  {[
                    { label: t("auth.name"), value: name, onChange: setName, type: "text", placeholder: t("register.namePlaceholder") },
                    { label: t("auth.email"), value: email, onChange: setEmail, type: "email", placeholder: "seu@email.com" },
                    { label: t("auth.password"), value: password, onChange: setPassword, type: "password", placeholder: t("register.passwordPlaceholder") },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">{f.label}</label>
                      <input type={f.type} value={f.value} onChange={(e) => f.onChange(e.target.value)} required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#f5c842]/50 transition text-sm"
                        placeholder={f.placeholder} />
                    </div>
                  ))}
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full bg-gradient-to-r from-[#f5c842] to-[#e8a020] text-black font-black py-3.5 rounded-xl disabled:opacity-50 shadow-lg shadow-yellow-500/20 text-sm">
                    {loading ? t("register.creatingAccount") : t("register.continue")}
                  </motion.button>
                </form>
                <p className="text-center text-sm text-white/20 mt-6">
                  {t("register.haveAccount")}{" "}
                  <Link to="/login" className="text-[#f5c842] font-semibold hover:text-yellow-300 transition">{t("auth.login")}</Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: League */}
          {step === "league" && (
            <motion.div key="league" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl mb-4 shadow-2xl shadow-blue-500/30">🏟️</div>
                <h1 className="text-3xl font-black text-white tracking-tight">{t("register.yourLeagueTitle")}</h1>
                <p className="text-white/30 mt-1 text-sm">{t("register.yourLeagueSubtitle")}</p>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 space-y-6">
                {/* Tab switcher */}
                <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                  <button onClick={() => setLeagueTab("create")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                      leagueTab === "create" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                    }`}>
                    {t("register.createLeagueTab")}
                  </button>
                  <button onClick={() => setLeagueTab("join")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                      leagueTab === "join" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                    }`}>
                    {t("register.joinWithCodeTab")}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {leagueTab === "create" ? (
                    <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                       <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">{t("register.leagueNameLabel")}</label>
                      <input value={leagueName} onChange={(e) => setLeagueName(e.target.value)}
                         placeholder={t("register.leagueNamePlaceholder")}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition text-sm" />
                       <p className="text-white/20 text-xs">{t("register.inviteCodeHint")}</p>
                    </motion.div>
                  ) : (
                    <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                       <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">{t("register.inviteCodeLabel")}</label>
                      <div className="flex gap-2">
                        <input value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinPreview(null); }}
                          maxLength={6} placeholder="ABCD12"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-black text-lg tracking-widest placeholder-white/15 focus:outline-none focus:border-white/30 transition uppercase" />
                        <button onClick={previewJoinCode} disabled={joinCode.length < 6} type="button"
                          className="px-4 bg-white/5 border border-white/10 text-white/40 hover:text-white rounded-xl text-sm font-semibold transition disabled:opacity-30">
                           {t("register.search")}
                        </button>
                      </div>
                      {joinPreview && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                          <div className="font-black text-white text-sm">{joinPreview.name}</div>
                           <div className="text-xs text-white/35 mt-0.5">{t("register.participantsCount", { count: joinPreview._count?.members ?? 0 })}</div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {joinError && <p className="text-red-400 text-xs">{joinError}</p>}

                <motion.button onClick={handleLeague} disabled={leagueLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black py-3.5 rounded-xl disabled:opacity-50 shadow-lg shadow-blue-500/20 text-sm">
                  {leagueLoading ? t("register.pleaseWait") : leagueTab === "create" ? t("register.createLeagueAndJoin") : t("register.joinLeague")}
                </motion.button>

                <button onClick={skipLeague} className="w-full text-center text-xs text-white/20 hover:text-white/40 transition py-1">
                  {t("register.skipLeague")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
