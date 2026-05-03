import { createContext, useContext, useState, type ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "../api/client";

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const s = localStorage.getItem("user");
    return s ? JSON.parse(s) : null;
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );

  const persist = (data: { token: string; user: User }) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    persist(data);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiRegister(name, email, password);
    persist(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isAdmin: !!user?.isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}