import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LeagueProvider } from "./context/LeagueContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Jogos from "./pages/Games";
import PreCopa from "./pages/PreCup";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import Palpites from "./pages/Palpites";
import Liga from "./pages/League";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
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
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/jogos" element={<PrivateRoute><Jogos /></PrivateRoute>} />
          <Route path="/pre-copa" element={<PrivateRoute><PreCopa /></PrivateRoute>} />
          <Route path="/placar" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
          <Route path="/palpites" element={<PrivateRoute><Palpites /></PrivateRoute>} />
          <Route path="/liga" element={<PrivateRoute><Liga /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminRoute><Admin /></AdminRoute></PrivateRoute>} />
        </Routes>
      </LeagueProvider>
    </AuthProvider>
  );
}