import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LeagueProvider } from "./context/LeagueContext";

const Layout = lazy(() => import("./components/Layout"));
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Jogos = lazy(() => import("./pages/Games"));
const PreCopa = lazy(() => import("./pages/PreCup"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Palpites = lazy(() => import("./pages/Palpites"));
const Liga = lazy(() => import("./pages/League"));
const Invite = lazy(() => import("./pages/Invite"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white/25 text-sm">
      Carregando...
    </div>
  );
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  return token ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function RootRoute() {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <LeagueProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/convite/:code" element={<Invite />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/jogos" element={<PrivateRoute><Jogos /></PrivateRoute>} />
            <Route path="/pre-copa" element={<PrivateRoute><PreCopa /></PrivateRoute>} />
            <Route path="/placar" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
            <Route path="/palpites" element={<PrivateRoute><Palpites /></PrivateRoute>} />
            <Route path="/liga" element={<PrivateRoute><Liga /></PrivateRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<PrivateRoute><AdminRoute><Admin /></AdminRoute></PrivateRoute>} />
          </Routes>
        </Suspense>
      </LeagueProvider>
    </AuthProvider>
  );
}
