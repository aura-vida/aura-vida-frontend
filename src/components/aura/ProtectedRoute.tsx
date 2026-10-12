import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/auth",
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="size-8 animate-spin text-accent mb-4" />
        <p className="font-display text-lg text-foreground font-medium">Connecting to sanctuary…</p>
        <p className="text-xs text-muted-foreground mt-1">Verifying your secure session</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (profile?.role || "client").toLowerCase();
    const hasRole = allowedRoles.some((r) => r.toLowerCase() === userRole);
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
