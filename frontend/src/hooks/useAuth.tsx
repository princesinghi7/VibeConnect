import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, AccountType } from '../api/types';
import { getToken } from '../api/client';
import * as services from '../api/services';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, accountType: AccountType) => Promise<void>;
  loginWithGoogle: (idToken: string, accountType?: AccountType) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      services.getProfile('me').then(setUser).finally(() => setLoading(false));
    }
  }, []);

  const value: AuthState = {
    user,
    loading,
    login: async (email, password) => {
      const u = await services.login(email, password);
      setUser(u);
    },
    signup: async (name, email, password, accountType) => {
      const u = await services.signup(name, email, password, accountType);
      setUser(u);
    },
    loginWithGoogle: async (idToken, accountType) => {
      const u = await services.loginWithGoogle(idToken, accountType);
      setUser(u);
    },
    logout: () => {
      services.logout();
      setUser(null);
    },
    updateUser: (patch) => setUser((prev) => (prev ? { ...prev, ...patch } : prev)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
