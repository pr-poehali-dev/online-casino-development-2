import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const AUTH_URL = "https://functions.poehali.dev/a9697396-bac2-4b76-b612-b6474107f13f";
const TOKEN_KEY = "casino_session_token";

export interface CasinoUser {
  id: number;
  email: string;
  username: string;
  balance: number;
  loyalty_points: number;
  loyalty_level: string;
  freespins: number;
  welcome_bonus_claimed: boolean;
}

interface AuthContextType {
  user: CasinoUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CasinoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    fetch(`${AUTH_URL}/me`, { headers: { 'X-Session-Id': token } })
      .then(r => r.json())
      .then(data => { if (data.user) setUser(data.user); else localStorage.removeItem(TOKEN_KEY); })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });
    const data = await res.json();
    if (data.error) return data.error;
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return null;
  };

  const register = async (email: string, username: string, password: string): Promise<string | null> => {
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', email, username, password }),
    });
    const data = await res.json();
    if (data.error) return data.error;
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return null;
  };

  const updateBalance = (newBalance: number) => {
    setUser(prev => prev ? { ...prev, balance: newBalance } : null);
  };

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Id': token },
        body: JSON.stringify({ action: 'logout' }),
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}