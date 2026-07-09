import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { fetchMe } from "../api/auth";
import { ApiError } from "../api/client";
import { AuthUser } from "../api/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isStudent: boolean;
  isGuest: boolean;
  reload: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMe()
      .then(({ user }) => {
        if (!cancelled) setUser(user);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Autentifikatsiya xatosi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAdmin: user?.role === "admin",
        isStudent: user?.role === "student",
        isGuest: user?.role === "guest",
        reload: () => setNonce((n) => n + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
