import axios from "axios";
import { history } from '../utils/history';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      history.push("/login");
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);

export const register = (name: string, email: string, password: string) =>
  api.post("/auth/register", { name, email, password }).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });
// Teams
export const getTeams = () => api.get("/teams").then((r) => r.data);

// Matches
export const getMatches = (phase?: string) =>
  api.get("/matches", { params: phase ? { phase } : {} }).then((r) => r.data);

// Predictions
export const getMyPredictions = () => api.get("/predictions/mine").then((r) => r.data);
export const submitPrediction = (matchId: number, scoreA: number, scoreB: number) =>
  api.post(`/predictions/${matchId}`, { scoreA, scoreB }).then((r) => r.data);

// Pre-cup
export const getMyPreCup = () => api.get("/precup/mine").then((r) => r.data);
export const submitPreCup = (data: { championId: number; shameTeamId: number; surpriseTeamId: number }) =>
  api.post("/precup", data).then((r) => r.data);

// Leaderboard
export const getLeaderboard = (leagueId?: number) =>
  api.get("/leaderboard", { params: leagueId ? { leagueId } : {} }).then((r) => r.data);
export const exportLeaderboardCsv = (leagueId?: number) =>
  api.get("/leaderboard/export.csv", { params: leagueId ? { leagueId } : {}, responseType: "blob" }).then((r) => r.data);

// Leagues
export const getMyLeagues = () => api.get("/leagues/mine").then((r) => r.data);
export const getAllLeagues = () => api.get("/leagues").then((r) => r.data);
export const getLeague = (id: number) => api.get(`/leagues/${id}`).then((r) => r.data);
export const getLeagueByCode = (code: string) => api.get(`/leagues/code/${code}`).then((r) => r.data);
export const createLeague = (name: string) => api.post("/leagues", { name }).then((r) => r.data);
export const joinLeague = (code: string) => api.post("/leagues/join", { code }).then((r) => r.data);
export const leaveLeague = (id: number) => api.post(`/leagues/${id}/leave`).then((r) => r.data);
export const deleteLeague = (id: number) => api.delete(`/leagues/${id}`).then((r) => r.data);
