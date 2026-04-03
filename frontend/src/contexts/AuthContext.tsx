/**
 * Auth Context — global auth state for the application
 *
 * Stores JWT token in localStorage and sends it as Bearer header.
 * On mount, checks for existing token and validates with GET /api/auth/me.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import type { AuthUser, AuthOrganization } from '../api/auth';
import { setAuthToken, clearAuthToken, getAuthToken } from '../api/client';

interface AuthContextType {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; full_name: string; organization_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<AuthOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // Only check if we have a stored token
      if (!getAuthToken()) {
        setUser(null);
        setOrganization(null);
        setIsLoading(false);
        return;
      }
      const data = await authApi.getMe();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setOrganization(data.organization || null);
      } else {
        clearAuthToken();
        setUser(null);
        setOrganization(null);
      }
    } catch {
      clearAuthToken();
      setUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setAuthToken(data.token);
    setUser(data.user);
    setOrganization(data.organization);
  }, []);

  const signup = useCallback(async (data: { email: string; password: string; full_name: string; organization_name: string }) => {
    const res = await authApi.signup(data);
    setAuthToken(res.token);
    setUser(res.user);
    setOrganization(res.organization);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuthToken();
    setUser(null);
    setOrganization(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      organization,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
