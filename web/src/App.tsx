import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Jogos from "./pages/Games";
import PreCopa from "./pages/PreCup";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import Palpites from "./pages/Palpites";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/jogos" element={<PrivateRoute><Jogos /></PrivateRoute>} />
        <Route path="/pre-copa" element={<PrivateRoute><PreCopa /></PrivateRoute>} />
        <Route path="/placar" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
        <Route path="/palpites" element={<PrivateRoute><Palpites /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminRoute><Admin /></AdminRoute></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  );
}