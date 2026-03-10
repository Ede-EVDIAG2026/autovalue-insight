import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserInfo, RegisterInput } from '../services/authService';
import { getMe, login, register, logout, getGdprStatus, acceptGdpr } from '../services/authService';
import { getToken, clearTokens } from '../lib/apiClient';

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  gdprRequired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  onGdprAccepted: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [gdprRequired, setGdprRequired] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!getToken()) { setLoading(false); return; }
      const me = await getMe();
      if (me) {
        setUser(me);
        const gdpr = await getGdprStatus();
        setGdprRequired(!gdpr);
      } else {
        clearTokens();
      }
      setLoading(false);
    };
    init();
  }, []);

  const signIn = async (email: string, password: string) => {
    const me = await login(email, password);
    setUser(me);
    const gdpr = await getGdprStatus();
    setGdprRequired(!gdpr);
  };

  const signUp = async (input: RegisterInput) => {
    const me = await register(input);
    setUser(me);
    setGdprRequired(false);
  };

  const signOut = async () => {
    await logout();
    setUser(null);
    setGdprRequired(false);
  };

  const onGdprAccepted = async () => {
    await acceptGdpr();
    setGdprRequired(false);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, gdprRequired,
      signIn, signUp, signOut, onGdprAccepted
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
