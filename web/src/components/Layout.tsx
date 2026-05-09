import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useLeague } from "../context/LeagueContext";
import { useState } from "react";

const NAV = [
  { to: "/dashboard", icon: "⚡", label: "Início" },
  { to: "/jogos", icon: "⚽", label: "Jogos" },
  { to: "/palpites", icon: "👁", label: "Palpites" },
  { to: "/pre-copa", icon: "🎯", label: "Pré-Copa" },
  { to: "/placar", icon: "🏆", label: "Placar" },
  { to: "/liga", icon: "🏟️", label: "Liga" },
];
const ADMIN_NAV = { to: "/admin", icon: "⚙️", label: "Admin" };

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const { leagues, activeLeague, setActiveLeague } = useLeague();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leagueSwitcherOpen, setLeagueSwitcherOpen] = useState(false);

  const allNav = isAdmin ? [...NAV, ADMIN_NAV] : NAV;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0d0d14] border-r border-white/5 fixed h-full z-20">
        {/* Logo */}
        <div className="px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5c842] to-[#e8a020] flex items-center justify-center text-lg shadow-lg shadow-yellow-500/20">🏆</div>
            <div>
              <div className="font-black text-sm tracking-tight">Bolão</div>
              <div className="text-[10px] text-white/25 tracking-widest uppercase">Copa 2026</div>
            </div>
          </div>
        </div>

        {/* League switcher */}
        {leagues.length > 0 && (
          <div className="px-3 mb-2">
            <div className="relative">
              <button
                onClick={() => setLeagueSwitcherOpen(!leagueSwitcherOpen)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl hover:border-white/15 transition"
              >
                <span className="text-base">🏟️</span>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-bold text-white/60 truncate">
                    {activeLeague?.name ?? "Selecionar liga"}
                  </div>
                  {activeLeague && (
                    <div className="text-[10px] text-white/25">{activeLeague._count.members} membros</div>
                  )}
                </div>
                <span className="text-white/20 text-xs">{leagueSwitcherOpen ? "▲" : "▼"}</span>
              </button>

              <AnimatePresence>
                {leagueSwitcherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    {leagues.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => { setActiveLeague(l); setLeagueSwitcherOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition text-left ${
                          activeLeague?.id === l.id ? "bg-[#f5c842]/5" : ""
                        }`}
                      >
                        <span className={`text-xs font-bold flex-1 truncate ${activeLeague?.id === l.id ? "text-[#f5c842]" : "text-white/60"}`}>
                          {l.name}
                        </span>
                        {activeLeague?.id === l.id && <span className="text-[#f5c842] text-xs">✓</span>}
                      </button>
                    ))}
                    <Link to="/liga" onClick={() => setLeagueSwitcherOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 border-t border-white/5 text-xs text-white/30 hover:text-white transition">
                      <span>+</span> Gerenciar ligas
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {allNav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}>
                <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400 }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                    active
                      ? "bg-[#f5c842]/10 text-[#f5c842] border border-[#f5c842]/15"
                      : "text-white/35 hover:text-white/80 hover:bg-white/4"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#f5c842]" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-4 mx-3 mb-4 bg-white/[0.02] border border-white/6 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f5c842] to-[#e8a020] flex items-center justify-center text-xs font-black text-black flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white/70 truncate">{user?.name}</div>
              {activeLeague && (
                <div className="text-[10px] text-white/25 truncate">🏟️ {activeLeague.name}</div>
              )}
            </div>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="text-white/15 hover:text-red-400 transition text-sm p-1"
              title="Sair"
            >✕</button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0d0d14]/95 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🏆</span>
          <span className="font-black text-sm">Bolão Copa 2026</span>
          {activeLeague && (
            <span className="text-[10px] text-white/25 bg-white/5 px-2 py-0.5 rounded-full">{activeLeague.name}</span>
          )}
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/50 hover:text-white p-1 transition">
          <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
        </button>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden fixed top-14 left-0 right-0 z-20 bg-[#0d0d14] border-b border-white/5 p-3 space-y-1 max-h-[80vh] overflow-y-auto"
          >
            {/* League switcher mobile */}
            {leagues.length > 0 && (
              <div className="pb-2 mb-2 border-b border-white/5">
                <div className="text-[10px] text-white/25 uppercase tracking-widest px-3 mb-1">Liga ativa</div>
                {leagues.map((l) => (
                  <button key={l.id} onClick={() => setActiveLeague(l)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${
                      activeLeague?.id === l.id ? "bg-[#f5c842]/8 text-[#f5c842]" : "text-white/40 hover:text-white"
                    }`}
                  >
                    <span>🏟️</span>
                    <span className="font-semibold">{l.name}</span>
                    {activeLeague?.id === l.id && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}

            {allNav.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  location.pathname === item.to ? "bg-[#f5c842]/10 text-[#f5c842]" : "text-white/40 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
            <button onClick={() => { logout(); navigate("/"); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400/60 hover:text-red-400 text-sm">
              🚪 Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="max-w-5xl mx-auto px-4 lg:px-8 py-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
