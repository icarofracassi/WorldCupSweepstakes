import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getMyLeagues } from "../api/client";
import { useAuth } from "./AuthContext";

interface League {
  id: number;
  name: string;
  code: string;
  createdById: number;
  _count: { members: number };
}

interface LeagueCtx {
  leagues: League[];
  activeLeague: League | null;
  setActiveLeague: (l: League | null) => void;
  refetch: () => void;
  loading: boolean;
}

const LeagueContext = createContext<LeagueCtx>({
  leagues: [],
  activeLeague: null,
  setActiveLeague: () => {},
  refetch: () => {},
  loading: false,
});

export function LeagueProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeague, setActiveLeagueState] = useState<League | null>(() => {
    const saved = localStorage.getItem("activeLeagueId");
    return saved ? null : null; // resolved after fetch
  });
  const [loading, setLoading] = useState(false);

  const fetchLeagues = async () => {
    if (!token) {
      setLeagues([]);
      setActiveLeagueState(null);
      localStorage.removeItem("activeLeagueId");
      return;
    }
    setLoading(true);
    try {
      const data = await getMyLeagues();
      setLeagues(data);

      // Restore active league from localStorage
      const savedId = localStorage.getItem("activeLeagueId");
      if (savedId) {
        const found = data.find((l: League) => l.id === Number(savedId));
        if (found) {
          setActiveLeagueState(found);
        } else if (data[0]) {
          setActiveLeagueState(data[0]);
          localStorage.setItem("activeLeagueId", String(data[0].id));
        } else {
          setActiveLeagueState(null);
          localStorage.removeItem("activeLeagueId");
        }
      } else if (data.length > 0) {
        setActiveLeagueState(data[0]);
        localStorage.setItem("activeLeagueId", String(data[0].id));
      } else {
        setActiveLeagueState(null);
        localStorage.removeItem("activeLeagueId");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, [token]);

  const setActiveLeague = (l: League | null) => {
    setActiveLeagueState(l);
    if (l) localStorage.setItem("activeLeagueId", String(l.id));
    else localStorage.removeItem("activeLeagueId");
  };

  return (
    <LeagueContext.Provider value={{ leagues, activeLeague, setActiveLeague, refetch: fetchLeagues, loading }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  return useContext(LeagueContext);
}
