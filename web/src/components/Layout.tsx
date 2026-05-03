import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const NAV = [
  { to: "/", icon: "⚡", label: "Início" },
  { to: "/jogos", icon: "⚽", label: "Jogos" },
  { to: "/pre-copa", icon: "🎯", label: "Pré-Copa" },
  { to: "/placar", icon: "🏆", label: "Placar" },
];

const ADMIN_NAV = { to: "/admin", icon: "⚙️", label: "Admin" };

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNav = isAdmin ? [...NAV, ADMIN_NAV] : NAV;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <aside className="hidden lg:flex flex-col w-64 bg-[#0d0d14] border-r border-white/5 fixed h-full z-20">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5c842] to-[#e8a020] flex items-center justify-center text-lg shadow-lg shadow-yellow-500/20">
              🏆
            </div>
            <div>
              <div className="font-black text-sm tracking-tight text-white">Bolão</div>
              <div className="text-[10px] text-white/30 font-medium tracking-widest uppercase">Copa 2026</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {allNav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    active
                      ? "bg-[#f5c842]/10 text-[#f5c842] border border-[#f5c842]/20"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#f5c842]" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f5c842] to-[#e8a020] flex items-center justify-center text-xs font-black text-black">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-white/30 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-white/20 hover:text-red-400 transition text-xs" title="Sair">✕</button>
          </div>
        </div>
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0d0d14]/90 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <span className="font-black text-sm">Bolão Copa 2026</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/60 hover:text-white transition p-1">
          {mobileOpen ? "✕" : "☰"}
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed top-14 left-0 right-0 z-20 bg-[#0d0d14] border-b border-white/5 p-4 space-y-1"
          >
            {allNav.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                  location.pathname === item.to ? "bg-[#f5c842]/10 text-[#f5c842]" : "text-white/50 hover:text-white"
                }`}>
                <span>{item.icon}</span>
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            ))}
            <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-3 text-red-400/70 hover:text-red-400 text-sm">
              <span>🚪</span> Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="max-w-5xl mx-auto px-4 lg:px-8 py-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}