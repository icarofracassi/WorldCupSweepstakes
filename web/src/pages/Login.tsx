import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordResetSuccess = searchParams.get("passwordReset") === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError(t("login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#f5c842]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-900/10 rounded-full blur-[80px]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-900/10 rounded-full blur-[80px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative"
      >
        {/* Return to Landing Button */}
        <div className="mb-6">
          <Link to="/">
            <motion.button
              whileHover={{ x: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="inline-flex items-center gap-2 text-xs font-bold text-white/40 hover:text-[#f5c842] uppercase tracking-widest transition group"
            >
              <span className="text-sm transition-transform group-hover:translate-x-[-2px]">←</span>
              {t("common.backToLanding", "Voltar ao início")}
            </motion.button>
          </Link>
        </div>
        
        
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5c842] to-[#e8a020] text-3xl mb-4 shadow-2xl shadow-yellow-500/30"
          >
            🏆
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">{t("login.title")}</h1>
          <p className="text-white/30 mt-1 text-sm">{t("login.subtitle")}</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm"
              >
                {error}
              </motion.div>
            )}
            {passwordResetSuccess && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-sm"
              >
                {t("login.passwordResetSuccess")}
              </motion.div>
            )}
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#f5c842]/50 focus:bg-white/8 transition text-sm"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{t("auth.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#f5c842]/50 transition text-sm"
                placeholder="••••••••"
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-[#f5c842] to-[#e8a020] text-black font-black py-3.5 rounded-xl transition disabled:opacity-50 shadow-lg shadow-yellow-500/20 text-sm tracking-wide"
            >
              {loading ? t("login.loading") : t("auth.login")}
            </motion.button>
          </form>

          <p className="text-center text-sm text-white/20 mt-6">
            {t("login.noAccount")}{" "}
            <Link to="/register" className="text-[#f5c842] font-semibold hover:text-yellow-300 transition">
              {t("auth.register")}
            </Link>
          </p>
          <p className="text-center text-sm text-white/20 mt-6">
            <Link to="/forgot-password" className="text-[#f5c842] font-semibold hover:text-yellow-300 transition">
                {t("login.forgotPassword")}
            </Link>
          </p>
        </div>

        <p className="text-center text-white/10 text-xs mt-8">
          FIFA World Cup 2026 · USA · Canada · Mexico
        </p>
      </motion.div>
    </div>
  );
}
