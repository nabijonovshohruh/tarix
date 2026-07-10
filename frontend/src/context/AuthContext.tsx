import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { fetchMe, recheckSubscription } from "../api/auth";
import { ApiError } from "../api/client";
import { AuthUser } from "../api/types";

interface AuthContextValue {
  user: AuthUser | null;
  channelUrl: string | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isStudent: boolean;
  isGuest: boolean;
  reload: () => void;
  recheckChannelSubscription: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [channelUrl, setChannelUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMe()
      .then(({ user, channelUrl }) => {
        if (!cancelled) {
          setUser(user);
          setChannelUrl(channelUrl);
        }
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

  const reload = () => setNonce((n) => n + 1);

  const recheckChannelSubscription = async () => {
    const { channelSubscribed } = await recheckSubscription();
    reload();
    return channelSubscribed;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        channelUrl,
        loading,
        error,
        isAdmin: user?.role === "admin",
        isStudent: user?.role === "student",
        isGuest: user?.role === "guest",
        reload,
        recheckChannelSubscription,
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
