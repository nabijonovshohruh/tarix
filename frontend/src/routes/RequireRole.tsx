import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/common/Spinner";
import { Role } from "../api/types";

export function RequireRole({ role, children }: { role: Role | Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const allowed = Array.isArray(role) ? role : [role];

  if (loading) return <Spinner />;
  if (!user || !allowed.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
