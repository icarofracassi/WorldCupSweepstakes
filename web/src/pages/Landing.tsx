import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import Flag from "react-world-flags";

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
      className="absolute rounded-full pointer-events-none select-none flex items-center justify-center z-0"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, fontSize: size * 0.6 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.12, 0.06, 0.12, 0],
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
const TICKER_CODES = ["BRA", "ARG", "FRA", "GER", "ENG", "ESP", "POR", "USA", "MEX", "CAN", "JPN", "MAR", "URU", "CRO"];

const FIFA_TO_ISO: Record<string, string> = {
  GER:"DE", SWE:"SE", HAI:"HT", URU:"UY", MEX:"MX", SUI:"CH", NED:"NL",
  DEN:"DK", POR:"PT", ESP:"ES", FRA:"FR", ENG:"GB-ENG", SCO:"GB-SCT",
  BRA:"BR", ARG:"AR", COL:"CO", ECU:"EC", CHI:"CL", PAR:"PY", BOL:"BO",
  VEN:"VE", PER:"PE", USA:"US", CAN:"CA", CRC:"CR", PAN:"PA", SEN:"SN",
  MAR:"MA", TUN:"TN", NGA:"NG", CMR:"CM", GHA:"GH", CIV:"CI", ALG:"DZ",
  EGY:"EG", RSA:"ZA", COD:"CD", CPV:"CV", QAT:"QA", KSA:"SA", IRN:"IR",
  IRQ:"IQ", JOR:"JO", KOR:"KR", JPN:"JP", AUS:"AU", NZL:"NZ", UZB:"UZ",
  CRO:"HR", POL:"PL", SRB:"RS", SVK:"SK", CZE:"CZ", HUN:"HU", AUT:"AT",
  BIH:"BA", UKR:"UA", TUR:"TR", BEL:"BE", ITA:"IT", NOR:"NO", CUR:"CW"
};
function getFlagCode(code: string) { return FIFA_TO_ISO[code] ?? code; }

function Ticker() {
  const { t } = useTranslation();
  const items = [...TICKER_CODES, ...TICKER_CODES, ...TICKER_CODES];

  return (
    <div className="overflow-hidden border-y border-white/5 py-3.5 bg-white/[0.01] relative z-10">
      <motion.div
        className="flex gap-8 md:gap-10 whitespace-nowrap items-center"
        animate={{ x: [0, -1400] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {items.map((code, i) => {
          const fallbackName = code === "USA" ? "USA" : code === "MEX" ? "México" : code;
          const localizedName = t(`teams.${code}`, { defaultValue: fallbackName });

          return (
            <div 
              key={i} 
              className="flex items-center gap-2 text-xs md:text-sm font-bold text-white/20 tracking-widest uppercase flex-shrink-0"
            >
              <motion.div 
                className="w-5 h-3.5 md:w-6 md:h-4 overflow-hidden shadow-md opacity-40 flex-shrink-0"
                style={{ clipPath: "polygon(0% 6%, 100% 0%, 96% 94%, 4% 100%)" }}
                animate={{ rotate: [0, 3, -2, 0], skewY: [0, 2, -2, 0], y: [0, -1, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
              >
                <Flag code={getFlagCode(code)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </motion.div>
              <span>{localizedName}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

type TFunction = ReturnType<typeof useTranslation>["t"];

// ── Countdown digit ────────────────────────────────────────
function Digit({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1.5 md:gap-2 flex-1 max-w-[72px] md:max-w-[112px]">
      <div className="relative w-full aspect-square bg-gradient-to-b from-white/8 to-white/3 border border-white/10 rounded-xl md:rounded-2xl flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={str}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-2xl sm:text-3xl md:text-5xl font-black text-white tabular-nums"
          >
            {str}
          </motion.span>
        </AnimatePresence>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-2xl" />
      </div>
      <span className="text-[9px] md:text-[10px] text-white/25 uppercase tracking-wider md:tracking-[0.2em] font-bold text-center">
        {label}
      </span>
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
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
      <div className="text-xs font-bold text-white/30 uppercase tracking-widest">{t("landing.demo.title")}</div>
      <div className="text-center text-white/40 text-xs mb-1">{t("landing.demo.realResult")}</div>

      <div className="flex items-center justify-center gap-4 py-2.5 bg-green-500/5 border border-green-500/10 rounded-xl">
        <span className="text-base">🇧🇷</span>
        <span className="text-xl md:text-2xl font-black text-green-400">{realA} – {realB}</span>
        <span className="text-base">🇦🇷</span>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-white/30 text-center">{t("landing.demo.yourGuess")}</div>
        <div className="flex items-center justify-center gap-3">
          <input type="number" min={0} max={9} value={scoreA}
            onChange={(e) => setScoreA(Math.max(0, Math.min(9, Number(e.target.value))))}
            className="w-12 h-12 md:w-14 md:h-14 text-center bg-white/5 border border-white/15 rounded-xl font-black text-xl md:text-2xl text-white focus:border-[#f5c842]/60 outline-none transition" />
          <span className="text-white/20 font-black text-lg">–</span>
          <input type="number" min={0} max={9} value={scoreB}
            onChange={(e) => setScoreB(Math.max(0, Math.min(9, Number(e.target.value))))}
            className="w-12 h-12 md:w-14 md:h-14 text-center bg-white/5 border border-white/15 rounded-xl font-black text-xl md:text-2xl text-white focus:border-[#f5c842]/60 outline-none transition" />
        </div>
      </div>

      <motion.div key={pts} initial={{ scale: 0.96 }} animate={{ scale: 1 }}
        className="flex items-center justify-between px-4 py-3 bg-white/4 border border-white/8 rounded-xl">
        <span className={`text-xs md:text-sm font-bold ${color}`}>{label}</span>
        <span className="text-lg md:text-2xl font-black text-white">+{pts} <span className="text-xs md:text-sm text-white/30">{t("landing.pointsAbbr")}</span></span>
      </motion.div>
    </div>
  );
}

// ── Feature card ───────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-white/[0.02] border border-white/6 hover:border-white/15 rounded-2xl p-5 md:p-6 transition-colors shadow-sm"
    >
      <div className="text-2xl md:text-3xl mb-3 md:mb-4">{icon}</div>
      <h3 className="font-black text-white text-base md:text-lg mb-1.5 md:mb-2">{title}</h3>
      <p className="text-white/40 text-xs md:text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ── Step card ──────────────────────────────────────────────
function Step({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="flex gap-4 md:gap-5"
    >
      <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f5c842]/10 border border-[#f5c842]/25 flex items-center justify-center font-black text-[#f5c842] text-xs md:text-sm">
        {num}
      </div>
      <div className="pt-0.5 flex-1">
        <div className="font-black text-white text-sm md:text-base">{title}</div>
        <div className="text-white/35 text-xs md:text-sm mt-1 leading-relaxed">{desc}</div>
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
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -40]);

  const balls = [
    { x: 5,  y: 15, size: 24, delay: 0,   duration: 8  },
    { x: 88, y: 12, size: 36, delay: 1.5, duration: 10 },
    { x: 12, y: 75, size: 18, delay: 2,   duration: 7  },
    { x: 82, y: 65, size: 32, delay: 0.5, duration: 12 },
  ];

  const features = [
    { delay: 0, icon: "⚽", title: t("landing.features.matchPredictions.title"), desc: t("landing.features.matchPredictions.desc") },
    { delay: 0.05, icon: "🎯", title: t("landing.features.preCup.title"), desc: t("landing.features.preCup.desc") },
    { delay: 0.1, icon: "🏆", title: t("landing.features.liveLeaderboard.title"), desc: t("landing.features.liveLeaderboard.desc") },
    { delay: 0.15, icon: "👁", title: t("landing.features.everyonePredictions.title"), desc: t("landing.features.everyonePredictions.desc") },
    { delay: 0.2, icon: "📊", title: t("landing.features.phaseMultipliers.title"), desc: t("landing.features.phaseMultipliers.desc") },
    { delay: 0.25, icon: "📥", title: t("landing.features.export.title"), desc: t("landing.features.export.desc") },
  ];

  const steps = [
    { num: "1", delay: 0.05, title: t("landing.steps.createAccount.title"), desc: t("landing.steps.createAccount.desc") },
    { num: "2", delay: 0.1, title: t("landing.steps.makePredictions.title"), desc: t("landing.steps.makePredictions.desc") },
    { num: "3", delay: 0.15, title: t("landing.steps.followLeaderboard.title"), desc: t("landing.steps.followLeaderboard.desc") },
  ];

  const matchPoints = [
    { id: "exact", label: t("landing.scoring.match.exact.label"), pts: t("landing.scoring.match.exact.pts"), color: "text-green-400", sub: t("landing.scoring.match.exact.sub") },
    { id: "diff", label: t("landing.scoring.match.diff.label"), pts: t("landing.scoring.match.diff.pts"), color: "text-[#f5c842]", sub: t("landing.scoring.match.diff.sub") },
    { id: "winner", label: t("landing.scoring.match.winner.label"), pts: t("landing.scoring.match.winner.pts"), color: "text-blue-400", sub: t("landing.scoring.match.winner.sub") },
    { id: "wrong", label: t("landing.scoring.match.wrong.label"), pts: t("landing.scoring.match.wrong.pts"), color: "text-white/20", sub: t("landing.scoring.match.wrong.sub") },
  ];

  const preCupPoints = [
    { id: "champion", icon: "🏆", label: t("landing.scoring.preCup.champion.label"), pts: t("landing.scoring.preCup.champion.pts"), color: "text-[#f5c842]", sub: t("landing.scoring.preCup.champion.sub") },
    { id: "shame", icon: "😳", label: t("landing.scoring.preCup.shame.label"), pts: t("landing.scoring.preCup.shame.pts"), color: "text-red-400", sub: t("landing.scoring.preCup.shame.sub") },
    { id: "surprise", icon: "⭐", label: t("landing.scoring.preCup.surprise.label"), pts: t("landing.scoring.preCup.surprise.pts"), color: "text-blue-400", sub: t("landing.scoring.preCup.surprise.sub") },
  ];

  return (
    <div className="min-h-screen bg-[#08080e] text-white overflow-x-hidden antialiased">

      {/* ── Nav ──────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 h-16 bg-[#08080e]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#f5c842] to-[#e8a020] flex items-center justify-center text-xs sm:text-base shadow-lg shadow-yellow-500/25">🏆</div>
          <span className="font-black text-xs sm:text-sm tracking-tight">{t("landing.siteTitle", "Bolão Copa 2026")}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageSwitcher className="hidden sm:inline-flex px-3 py-2 text-xs" />
          <Link to="/login" className="text-xs sm:text-sm font-semibold text-white/50 hover:text-white transition px-2.5 sm:px-4 py-2">
            {t("auth.login")}
          </Link>
          <Link to="/register" className="text-[11px] sm:text-sm font-bold bg-[#f5c842] text-black px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/10">
            {t("landing.nav.createAccount")}
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative min-h-[calc(100vh+40px)] sm:min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-12 overflow-hidden z-10"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[800px] h-72 sm:h-[800px] rounded-full opacity-60 sm:opacity-100"
            style={{ background: "radial-gradient(circle, rgba(245,200,66,0.05) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        {balls.map((b, i) => <FloatingBall key={i} {...b} />)}

        <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#f5c842]/80 border border-[#f5c842]/20 bg-[#f5c842]/5 px-3 py-1.5 rounded-full tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c842] animate-pulse" />
              {t("landing.hero.badge")}
            </span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tighter px-1">
              <span className="block text-white mb-1">{t("landing.hero.titleTop")}</span>
              <span className="block bg-gradient-to-r from-[#f5c842] via-[#fcd34d] to-[#f59e0b] bg-clip-text text-transparent pb-1">
                {t("landing.hero.subTitleTop")}
              </span>
              <span className="block text-white/30 text-xl sm:text-3xl md:text-4xl mt-3 font-bold tracking-tight">{t("landing.hero.titleBottom")}</span>
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="text-sm sm:text-lg text-white/35 max-w-md sm:max-w-xl mx-auto leading-relaxed px-4">
            {t("landing.hero.subtitle")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-3 px-4 flex-wrap">
            <Link to="/register" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full text-center px-7 py-3.5 bg-gradient-to-r from-[#f5c842] to-[#e8a020] text-black font-black text-sm md:text-base rounded-xl shadow-xl shadow-yellow-500/10 cursor-pointer">
                {t("landing.cta.createFree")}
              </motion.div>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="w-full text-center px-7 py-3.5 bg-white/5 border border-white/10 text-white/70 font-bold text-sm md:text-base rounded-xl hover:bg-white/8 transition cursor-pointer">
                {t("landing.cta.haveAccount")}
              </motion.div>
            </Link>
          </motion.div>

          {/* Fixed row container width setup */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-4 max-w-[340px] sm:max-w-lg mx-auto w-full px-2">
            <div className="text-[10px] md:text-xs text-white/20 uppercase tracking-widest mb-4 font-semibold">{t("landing.countdown.title")}</div>
            <div className="flex items-stretch justify-center gap-2 sm:gap-4">
              <Digit value={days} label={t("landing.countdown.days")} />
              <div className="text-white/10 text-xl md:text-3xl font-black self-center pt-1 md:pb-6">:</div>
              <Digit value={hours} label={t("landing.countdown.hours")} />
              <div className="text-white/10 text-xl md:text-3xl font-black self-center pt-1 md:pb-6">:</div>
              <Digit value={minutes} label={t("landing.countdown.minutes")} />
              <div className="text-white/10 text-xl md:text-3xl font-black self-center pt-1 md:pb-6">:</div>
              <Digit value={seconds} label={t("landing.countdown.seconds")} />
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 hidden sm:flex">
          <span className="text-white/15 text-[10px] uppercase tracking-widest">{t("landing.scroll")}</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-6 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </motion.section>

      {/* ── Ticker ───────────────────────── */}
      <Ticker />

      {/* ── Features ─────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
          className="text-center mb-12 md:mb-16">
          <div className="text-[10px] md:text-xs font-bold text-[#f5c842]/50 uppercase tracking-widest mb-2 md:mb-3">{t("landing.features.eyebrow")}</div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {t("landing.features.title")}<br />
            <span className="text-white/30">{t("landing.features.titleMuted")}</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 border-y border-white/5 bg-white/[0.005] relative z-10">
        {/* Added items-center here to force perfect mobile stacking alignment 👇 */}
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 w-full">
          
          {/* Left Column: Copy & Steps */}
          <div className="space-y-6 md:space-y-8 flex-1 w-full max-w-xl">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="text-[10px] md:text-xs font-bold text-[#f5c842]/50 uppercase tracking-widest mb-2">
                {t("landing.howItWorks.eyebrow")}
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                {t("landing.howItWorks.title")}<br />
                <span className="text-white/30">{t("landing.howItWorks.titleMuted")}</span>
              </h2>
            </motion.div>

            <div className="space-y-5 md:space-y-6">
              {steps.map((step) => (
                <Step key={step.num} {...step} />
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Demo Card */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.4 }}
            className="flex-1 w-full max-w-md mx-auto" /* mx-auto ensures fallback center alignment */
          >
            <ScoreDemo t={t} />
          </motion.div>
          
        </div>
      </section>

      {/* ── Scoring table ─────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-10 md:mb-12">
          <div className="text-[10px] md:text-xs font-bold text-[#f5c842]/50 uppercase tracking-widest mb-2">{t("landing.scoring.eyebrow")}</div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">{t("landing.scoring.title")}<br /><span className="text-white/30">{t("landing.scoring.titleMuted")}</span></h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Match points */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white/[0.02] border border-white/6 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
            <div className="text-xs md:text-sm font-black text-white/60 uppercase tracking-wider">{t("landing.scoring.matchTitle")}</div>
            <div className="space-y-1">
              {matchPoints.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 gap-2">
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm font-semibold text-white/70 truncate">{r.label}</div>
                    <div className="text-[10px] md:text-xs text-white/25 truncate">{r.sub}</div>
                  </div>
                  <span className={`text-base md:text-lg font-black flex-shrink-0 ${r.color}`}>{r.pts}</span>
                </div>
              ))}
            </div>
            <div className="bg-white/3 border border-white/6 rounded-xl p-3 text-[11px] md:text-xs text-white/25 leading-relaxed">
              {t("landing.scoring.phaseMultiplier")}
            </div>
          </motion.div>

          {/* Pre-cup points */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
            className="bg-white/[0.02] border border-white/6 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
            <div className="text-xs md:text-sm font-black text-white/60 uppercase tracking-wider">{t("landing.scoring.preCupTitle")}</div>
            <div className="space-y-1">
              {preCupPoints.map((r) => (
                <div key={r.id} className="flex items-center gap-3 md:gap-4 py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-xl md:text-2xl flex-shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-semibold text-white/70 truncate">{r.label}</div>
                    <div className="text-[10px] md:text-xs text-white/25 truncate">{r.sub}</div>
                  </div>
                  <span className={`text-base md:text-lg font-black flex-shrink-0 ${r.color}`}>{r.pts}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#f5c842]/5 border border-[#f5c842]/10 rounded-xl p-3 text-[11px] md:text-xs text-[#f5c842]/60 leading-relaxed">
              💡 {t("landing.scoring.preCupNote")}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────── */}
      <section className="py-12 md:py-20 px-4 sm:px-6 md:px-12 relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl border border-[#f5c842]/15 bg-gradient-to-br from-[#120f03] via-[#090906] to-[#08080e] p-8 md:p-12 text-center shadow-2xl">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 blur-[50px]"
              style={{ background: "radial-gradient(ellipse, rgba(245,200,66,0.12), transparent)" }} />
          </div>
          <div className="relative space-y-5 md:space-y-6">
            <div className="text-4xl md:text-5xl">🏆</div>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
              {t("landing.finalCta.title")}<br />
              <span className="bg-gradient-to-r from-[#f5c842] to-[#f59e0b] bg-clip-text text-transparent">{t("landing.finalCta.titleHighlight")}</span>
            </h2>
            <p className="text-white/35 text-xs md:text-sm max-w-xs mx-auto leading-relaxed">{t("landing.finalCta.subtitle")}</p>
            <div className="flex items-center justify-center pt-2">
              <Link to="/register" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full text-center px-8 py-4 bg-gradient-to-r from-[#f5c842] to-[#e8a020] text-black font-black text-sm rounded-xl shadow-xl shadow-yellow-500/10 cursor-pointer">
                  {t("landing.cta.createFree")}
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────── */}
      <footer className="border-t border-white/5 px-4 sm:px-6 md:px-12 py-8 relative z-10 bg-[#08080e]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5c842] to-[#e8a020] flex items-center justify-center text-xs">🏆</div>
            <span className="font-black text-xs sm:text-sm text-white/50 tracking-tight">{t("landing.siteTitle", "Bolão Copa 2026")}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-[10px] md:text-xs text-white/20 font-medium">
            <span>FIFA World Cup™ 2026</span>
            <span className="hidden sm:inline">·</span>
            <span>USA · Canada · Mexico</span>
            <span className="hidden sm:inline">·</span>
            <span>11 Jun – 19 Jul</span>
          </div>
        </div>
      </footer>
    </div>
  );
}