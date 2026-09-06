import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { subscribeUnauthorized } from "@/lib/_core/auth-events";

type AuthContextValue = {
  user: Auth.User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (Platform.OS !== "web" && !(await Auth.getSessionToken())) {
        await Auth.clearUserInfo();
        setUser(null);
        return;
      }

      const apiUser = await Api.getMe();
      if (!apiUser) {
        await Auth.removeSessionToken();
        await Auth.clearUserInfo();
        setUser(null);
        return;
      }

      const userInfo = Auth.normalizeUser(apiUser);
      setUser(userInfo);
      await Auth.setUserInfo(userInfo);
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error("Não foi possível validar a sessão.");
      setError(nextError);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (Platform.OS === "web" || (await Auth.getSessionToken())) {
        await Api.logout();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Não foi possível encerrar a sessão no servidor."));
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    return subscribeUnauthorized(() => {
      void Promise.all([Auth.removeSessionToken(), Auth.clearUserInfo()]).finally(() => {
        setUser(null);
        setError(new Error("A sessão expirou. Entre novamente para continuar."));
      });
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      refresh: fetchUser,
      logout,
    }),
    [error, fetchUser, loading, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
