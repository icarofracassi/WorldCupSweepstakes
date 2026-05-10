import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Invite() {
  const { token } = useAuth();
  const { code = "" } = useParams();
  const normalizedCode = code.toUpperCase();

  useEffect(() => {
    if (normalizedCode) {
      localStorage.setItem("pendingLeagueCode", normalizedCode);
    }
  }, [normalizedCode]);

  if (!normalizedCode) return <Navigate to="/" replace />;

  return token
    ? <Navigate to={`/liga?code=${normalizedCode}`} replace />
    : <Navigate to={`/register?league=${normalizedCode}`} replace />;
}
