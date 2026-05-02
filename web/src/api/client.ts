import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);

export const register = (name: string, email: string, password: string) =>
  api.post("/auth/register", { name, email, password }).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);

// --- Teams ---
export const getTeams = () => api.get("/teams").then((r) => r.data);

// --- Matches ---
export const getMatches = (phase?: string) =>
  api.get("/matches", { params: phase ? { phase } : {} }).then((r) => r.data);

export const getMatch = (id: number) =>
  api.get(`/matches/${id}`).then((r) => r.data);

// --- Predictions ---
export const getMyPredictions = () =>
  api.get("/predictions/mine").then((r) => r.data);

export const submitPrediction = (matchId: number, scoreA: number, scoreB: number) =>
  api.post(`/predictions/${matchId}`, { scoreA, scoreB }).then((r) => r.data);

// --- Pre-cup ---
export const getMyPreCup = () =>
  api.get("/precup/mine").then((r) => r.data);

export const submitPreCup = (data: {
  championId: number;
  shameTeamId: number;
  surpriseTeamId: number;
}) => api.post("/precup", data).then((r) => r.data);

// --- Leaderboard ---
export const getLeaderboard = () =>
  api.get("/leaderboard").then((r) => r.data);