import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "@/components/ui/Icon";

/**
 * Route guards (Phase 1.4, Task 8).
 *
 * ProtectedRoute: gates the in-app routes. While the stored session is being
 * checked it shows a full-screen loader; unauthenticated users are sent to
 * /login with their intended destination preserved so login can return them.
 *
 * PublicOnlyRoute: the inverse for the auth pages — an already-authenticated
 * user is bounced to the dashboard.
 */
function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-md text-on-surface-variant">
        <Icon name="progress_activity" size={40} className="animate-spin text-primary" />
        <p className="font-body text-body-md">Loading your account…</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();

  if (state.isLoading) return <FullScreenLoader />;
  if (!state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { state } = useAuth();

  if (state.isLoading) return <FullScreenLoader />;
  if (state.isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
