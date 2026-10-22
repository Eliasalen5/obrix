import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser } from "@shared/api/authClient";
import {
  clearSession,
  loadSession,
  login as loginSession,
  type Session,
} from "./session";

type AuthState = {
  ready: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    loadSession().then((s) => {
      setSession(s);
      setReady(true);
    });
  }, []);

  async function login(email: string, password: string) {
    const res = await loginSession(email, password);
    if (res.ok) {
      setSession(await loadSession());
    }
    return res;
  }

  async function logout() {
    await clearSession();
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{ ready, user: session?.user ?? null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
