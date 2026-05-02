import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nav = [
    { to: "/", label: "🏠 Início" },
    { to: "/jogos", label: "⚽ Jogos" },
    { to: "/pre-copa", label: "🎯 Pré-Copa" },
    { to: "/placar", label: "🏆 Placar" },
    ...(isAdmin ? [{ to: "/admin", label: "⚙️ Admin" }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-green-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="font-black text-xl tracking-tight">
              🏆 Bolão Copa 2026
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    location.pathname === n.to
                      ? "bg-green-700 text-white"
                      : "text-green-100 hover:bg-green-800"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-300 text-sm hidden sm:block">
                Olá, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                location.pathname === n.to
                  ? "bg-green-700 text-white"
                  : "text-green-100 hover:bg-green-800"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}