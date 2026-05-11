import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

// ── Countdown ──────────────────────────────────────────────
const CUP_START = new Date("2026-06-11T19:00:00Z");

function useCountdown() {
  const [diff, setDiff] = useState(CUP_START.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(CUP_START.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = Math.max(0, diff);
  return {
    days: Math.floor(t / 86400000),
    hours: Math.floor((t % 86400000) / 3600000),
    minutes: Math.floor((t % 3600000) / 60000),
    seconds: Math.floor((t % 60000) / 1000),
  };
}

// ── Floating ball particle ─────────────────────────────────
function FloatingBall({ delay, x, y, size, duration }: { delay: number; x: number; y: number; size: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none select-none flex items-center justify-center"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, fontSize: size * 0.6 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.15, 0.08, 0.15, 0],
        scale: [0, 1, 1.1, 0.9, 0],
        y: [0, -30, -60, -40, -80],
        rotate: [0, 15, -10, 20, -5],
      }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: duration * 0.3, ease: "easeInOut" }}
    >
      ⚽
    </motion.div>
  );
}

// ── Ticker tape ────────────────────────────────────────────
const TICKER_ITEMS = ["🇧🇷 Brasil", "🇦🇷 Argentina", "🇫🇷 França", "🇩🇪 Alemanha", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra", "🇪🇸 Espanha", "🇵🇹 Portugal", "🇺🇸 USA", "🇲🇽 México", "🇨🇦 Canadá", "🇯🇵 Japão", "🇲🇦 Marrocos", "🇺🇾 Uruguai", "🇭🇷 Croácia"];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden border-y border-white/5 py-3 bg-white/[0.01]">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: [0, -1400] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {items.map((item, i) => (
          <span key={i} className="text-sm font-bold text-white/20 tracking-widest uppercase flex-shrink-0">{item}</span>
        ))}
      </motion.div>
    </div>
  );
}

type TFunction = ReturnType<typeof useTranslation>["t"];

// ── Countdown digit ────────────────────────────────────────
function Digit({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 md:w-28 md:h-28">
        {/* Card background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-white/3 border border-white/10 rounded-2xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={str}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-black text-white tabular-nums"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {str}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* Shine */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-2xl" />
      </div>
      <span className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-bold">{label}</span>
    </div>
  );
}

// ── Score demo card ────────────────────────────────────────
function ScoreDemo({ t }: { t: TFunction }) {
  const [scoreA, setScoreA] = useState(2);
  const [scoreB, setScoreB] = useState(1);
  const [realA] = useState(2);
  const [realB] = useState(1);

  const exact = scoreA === realA && scoreB === realB;
  const diff = scoreA - scoreB === realA - realB;
  const winner = Math.sign(scoreA - scoreB) === Math.sign(realA - realB);
  const pts = exact ? 5 : diff ? 3 : winner ? 1 : 0;
  const label = exact ? t("landing.demo.exact") : diff ? t("landing.demo.diff") : winner ? t("landing.demo.winner") : t("landing.demo.wrong");
  const color = exact ? "text-green-400" : diff ? "text-[#f5c842]" : winner ? "text-blue-400" : "text-red-400";

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="text-xs font-bold text-white/30 uppercase tracking-widest">{t("landing.demo.title")}</div>
      <div className="text-center text-white/40 text-xs mb-2">{t("landing.demo.realResult")}</div>

      {/* Real score */}
      <div className="flex items-center justify-center gap-4 py-2 bg-green-500/5 border border-green-500/15 rounded-xl">
        <span className="text-sm font-bold text-white/50">🇧🇷</span>
        <span className="text-2xl font-black text-green-400">{realA} – {realB}</span>
        <span className="text-sm font-bold text-white/50">🇦🇷</span>
      </div>

      {/* Your guess inputs */}
      <div>
        <div className="text-xs text-white/30 mb-2 text-center">{t("landing.demo.yourGuess")}</div>
        <div className="flex items-center justify-center gap-3">
          <input type="number" min={0} max={9} value={scoreA}
            onChange={(e) => setScoreA(Math.max(0, Math.min(9, Number(e.target.value))))}
            className="w-14 h-14 text-center bg-white/8 border-2 border-white/15 rounded-xl font-black text-2xl text-white focus:border-[#f5c842]/60 outline-none" />
          <span className="text-white/20 font-black text-xl">–</span>
          <input type="number" min={0} max={9} value={scoreB}
            onChange={(e) => setScoreB(Math.max(0, Math.min(9, Number(e.target.value))))}
            className="w-14 h-14 text-center bg-white/8 border-2 border-white/15 rounded-xl font-black text-2xl text-white focus:border-[#f5c842]/60 outline-none" />
        </div>
      </div>

      {/* Result */}
      <motion.div key={pts} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="flex items-center justify-between px-4 py-3 bg-white/4 border border-white/8 rounded-xl">
        <span className={`text-sm font-bold ${color}`}>{label}</span>
        <span className="text-2xl font-black text-white">+{pts} <span className="text-sm text-white/30">{t("landing.pointsAbbr")}</span></span>
      </motion.div>
    </div>
  );
}

// ── Feature card ───────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-white/[0.03] border border-white/8 hover:border-white/20 rounded-2xl p-6 transition-colors"
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-black text-white text-lg mb-2">{title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ── Step card ──────────────────────────────────────────────
function Step({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex gap-5"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#f5c842]/10 border border-[#f5c842]/25 flex items-center justify-center font-black text-[#f5c842] text-sm">
        {num}
      </div>
      <div className="pt-1">
        <div className="font-black text-white text-base">{title}</div>
        <div className="text-white/35 text-sm mt-1 leading-relaxed">{desc}</div>
      </div>
    </motion.div>
  );
}

// ── Main ───────────────────────────────────────────────────
export default function Landing() {
  const { t } = useTranslation();
  const { days, hours, minutes, seconds } = useCountdown();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);

  const balls = [
    { x: 5,  y: 15, size: 32, delay: 0,   duration: 8  },
    { x: 90, y: 10, size: 48, delay: 1.5, duration: 10 },
    { x: 15, y: 70, size: 24, delay: 2,   duration: 7  },
    { x: 80, y: 60, size: 40, delay: 0.5, duration: 12 },
    { x: 50, y: 5,  size: 28, delay: 3,   duration: 9  },
    { x: 65, y: 80, size: 36, delay: 1,   duration: 11 },
    { x: 30, y: 40, size: 20, delay: 4,   duration: 8  },
    { x: 95, y: 45, size: 32, delay: 2.5, duration: 13 },
  ];

  const features = [
    { delay: 0, icon: "⚽", title: t("landing.features.matchPredictions.title"), desc: t("landing.features.matchPredictions.desc") },
    { delay: 0.1, icon: "🎯", title: t("landing.features.preCup.title"), desc: t("landing.features.preCup.desc") },
    { delay: 0.2, icon: "🏆", title: t("landing.features.liveLeaderboard.title"), desc: t("landing.features.liveLeaderboard.desc") },
    { delay: 0.3, icon: "👁", title: t("landing.features.everyonePredictions.title"), desc: t("landing.features.everyonePredictions.desc") },
    { delay: 0.4, icon: "📊", title: t("landing.features.phaseMultipliers.title"), desc: t("landing.features.phaseMultipliers.desc") },
    { delay: 0.5, icon: "📥", title: t("landing.features.export.title"), desc: t("landing.features.export.desc") },
  ];

  const steps = [
    { num: "1", delay: 0.1, title: t("landing.steps.createAccount.title"), desc: t("landing.steps.createAccount.desc") },
    { num: "2", delay: 0.2, title: t("landing.steps.makePredictions.title"), desc: t("landing.steps.makePredictions.desc") },
    { num: "3", delay: 0.3, title: t("landing.steps.followLeaderboard.title"), desc: t("landing.steps.followLeaderboard.desc") },
  ];

  const matchPoints = [
    { label: t("landing.scoring.match.exact.label"), pts: t("landing.scoring.match.exact.pts"), color: "text-green-400", sub: t("landing.scoring.match.exact.sub") },
    { label: t("landing.scoring.match.diff.label"), pts: t("landing.scoring.match.diff.pts"), color: "text-[#f5c842]", sub: t("landing.scoring.match.diff.sub") },
    { label: t("landing.scoring.match.winner.label"), pts: t("landing.scoring.match.winner.pts"), color: "text-blue-400", sub: t("landing.scoring.match.winner.sub") },
    { label: t("landing.scoring.match.wrong.label"), pts: t("landing.scoring.match.wrong.pts"), color: "text-white/20", sub: t("landing.scoring.match.wrong.sub") },
  ];

  const preCupPoints = [
    { icon: "🏆", label: t("landing.scoring.preCup.champion.label"), pts: t("landing.scoring.preCup.champion.pts"), color: "text-[#f5c842]", sub: t("landing.scoring.preCup.champion.sub") },
    { icon: "😳", label: t("landing.scoring.preCup.shame.label"), pts: t("landing.scoring.preCup.shame.pts"), color: "text-red-400", sub: t("landing.scoring.preCup.shame.sub") },
    { icon: "⭐", label: t("landing.scoring.preCup.surprise.label"), pts: t("landing.scoring.preCup.surprise.pts"), color: "text-blue-400", sub: t("landing.scoring.preCup.surprise.sub") },
  ];

  return (
    <div className="min-h-screen bg-[#08080e] text-white overflow-x-hidden">

      {/* ── Nav ──────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[#08080e]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5c842] to-[#e8a020] flex items-center justify-center text-base shadow-lg shadow-yellow-500/25">🏆</div>
          <span className="font-black text-sm tracking-tight">Bolão Copa 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden sm:inline-flex px-3 py-2 text-xs" />
          <Link to="/login"
            className="text-sm font-semibold text-white/50 hover:text-white transition px-4 py-2">
            {t("auth.login")}
          </Link>
          <Link to="/register"
            className="text-sm font-bold bg-[#f5c842] text-black px-5 py-2 rounded-xl hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/20">
            {t("landing.nav.createAccount")}
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 overflow-hidden"
      >
        {/* Deep background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(245,200,66,0.06) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(34,197,94,0.04) 0%, transparent 70%)" }} />
          <div className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 70%)" }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        </div>

        {/* Floating balls */}
        {balls.map((b, i) => <FloatingBall key={i} {...b} />)}

        {/* Content */}
        <div className="relative text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-[#f5c842]/70 border border-[#f5c842]/20 bg-[#f5c842]/5 px-4 py-2 rounded-full tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c842] animate-pulse" />
              {t("landing.hero.badge")}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none tracking-tighter">
              <span className="block text-white">{t("landing.hero.titleTop")}</span>
              <span className="block bg-gradient-to-r from-[#f5c842] via-[#fcd34d] to-[#f59e0b] bg-clip-text text-transparent">
                {t("landing.hero.subTitleTop")}
              </span>
              <span className="block text-white/20 text-3xl md:text-4xl mt-2 font-bold tracking-tight">{t("landing.hero.titleBottom")}</span>
            </h1>
          </motion.div>

          {/* Sub */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg text-white/35 max-w-xl mx-auto leading-relaxed">
            {t("landing.hero.subtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-gradient-to-r from-[#f5c842] to-[#e8a020] text-black font-black text-base rounded-2xl shadow-2xl shadow-yellow-500/25 cursor-pointer">
                {t("landing.cta.createFree")}
              </motion.div>
            </Link>
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-white/5 border border-white/15 text-white/70 font-bold text-base rounded-2xl hover:bg-white/8 hover:text-white transition cursor-pointer">
                {t("landing.cta.haveAccount")}
              </motion.div>
            </Link>
          </motion.div>

          {/* Countdown */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="pt-4">
            <div className="text-xs text-white/20 uppercase tracking-widest mb-6 font-semibold">{t("landing.countdown.title")}</div>
            <div className="flex items-end justify-center gap-3 md:gap-5">
              <Digit value={days} label={t("landing.countdown.days")} />
              <div className="text-white/15 text-3xl font-black pb-8">:</div>
              <Digit value={hours} label={t("landing.countdown.hours")} />
              <div className="text-white/15 text-3xl font-black pb-8">:</div>
              <Digit value={minutes} label={t("landing.countdown.minutes")} />
              <div className="text-white/15 text-3xl font-black pb-8">:</div>
              <Digit value={seconds} label={t("landing.countdown.seconds")} />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-white/15 text-xs uppercase tracking-widest">{t("landing.scroll")}</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </motion.section>

      {/* ── Ticker ───────────────────────── */}
      <Ticker />

      {/* ── Features ─────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16">
          <div className="text-xs font-bold text-[#f5c842]/50 uppercase tracking-widest mb-4">{t("landing.features.eyebrow")}</div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            {t("landing.features.title")}<br />
            <span className="text-white/30">{t("landing.features.titleMuted")}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────── */}
      <section className="py-24 px-6 md:px-12 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="text-xs font-bold text-[#f5c842]/50 uppercase tracking-widest mb-4">{t("landing.howItWorks.eyebrow")}</div>
              <h2 className="text-4xl font-black text-white tracking-tight">
                {t("landing.howItWorks.title")}<br />
                <span className="text-white/30">{t("landing.howItWorks.titleMuted")}</span>
              </h2>
            </motion.div>

            <div className="space-y-6">
              {steps.map((step) => (
                <Step key={step.num} {...step} />
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <ScoreDemo t={t} />
          </motion.div>
        </div>
      </section>

      {/* ── Scoring table ─────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-12">
          <div className="text-xs font-bold text-[#f5c842]/50 uppercase tracking-widest mb-4">{t("landing.scoring.eyebrow")}</div>
          <h2 className="text-4xl font-black text-white tracking-tight">{t("landing.scoring.title")}<br /><span className="text-white/30">{t("landing.scoring.titleMuted")}</span></h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Match points */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4">
            <div className="text-sm font-black text-white/60 uppercase tracking-wider">{t("landing.scoring.matchTitle")}</div>
            {matchPoints.map((r) => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-white/70">{r.label}</div>
                  <div className="text-xs text-white/25">{r.sub}</div>
                </div>
                <span className={`text-lg font-black ${r.color}`}>{r.pts}</span>
              </div>
            ))}
            <div className="bg-white/3 border border-white/6 rounded-xl p-3 text-xs text-white/25">
              {t("landing.scoring.phaseMultiplier")}
            </div>
          </motion.div>

          {/* Pre-cup points */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4">
            <div className="text-sm font-black text-white/60 uppercase tracking-wider">{t("landing.scoring.preCupTitle")}</div>
            {preCupPoints.map((r) => (
              <div key={r.label} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                <span className="text-2xl">{r.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white/70">{r.label}</div>
                  <div className="text-xs text-white/25">{r.sub}</div>
                </div>
                <span className={`text-lg font-black ${r.color}`}>{r.pts}</span>
              </div>
            ))}
            <div className="bg-[#f5c842]/5 border border-[#f5c842]/15 rounded-xl p-3 text-xs text-[#f5c842]/50">
              💡 {t("landing.scoring.preCupNote")}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────── */}
      <section className="py-20 px-6 md:px-12">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl border border-[#f5c842]/20 bg-gradient-to-br from-[#1a1500] via-[#0f0f08] to-[#08080e] p-12 text-center">
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-24 blur-[60px]"
              style={{ background: "radial-gradient(ellipse, rgba(245,200,66,0.15), transparent)" }} />
          </div>
          <div className="relative space-y-6">
            <div className="text-5xl">🏆</div>
            <h2 className="text-4xl font-black text-white tracking-tight">
              {t("landing.finalCta.title")}<br />
              <span className="bg-gradient-to-r from-[#f5c842] to-[#f59e0b] bg-clip-text text-transparent">{t("landing.finalCta.titleHighlight")}</span>
            </h2>
            <p className="text-white/35 max-w-sm mx-auto">{t("landing.finalCta.subtitle")}</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/register">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 bg-gradient-to-r from-[#f5c842] to-[#e8a020] text-black font-black text-sm rounded-2xl shadow-xl shadow-yellow-500/20 cursor-pointer">
                  {t("landing.cta.createFree")}
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────── */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5c842] to-[#e8a020] flex items-center justify-center text-sm">🏆</div>
            <span className="font-black text-sm text-white/50">Bolão Copa 2026</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/20">
            <span>FIFA World Cup™ 2026</span>
            <span>·</span>
            <span>USA · Canada · Mexico</span>
            <span>·</span>
            <span>11 Jun – 19 Jul</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
