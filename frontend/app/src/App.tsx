import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { RegistrationProvider } from "@/context/RegistrationContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Splash from "@/routes/Splash";
import Dashboard from "@/routes/Dashboard";
import Claims from "@/routes/Claims";
import ClaimDetail from "@/routes/ClaimDetail";
import OfferAcceptance from "@/routes/OfferAcceptance";
import OfferAccepted from "@/routes/OfferAccepted";
import Documents from "@/routes/Documents";
import Chat from "@/routes/Chat";
import Profile from "@/routes/Profile";
import Faq from "@/routes/Faq";
import Login from "@/routes/Login";
import Register from "@/routes/Register";
import VerifyOtp from "@/routes/VerifyOtp";
import CreatePassword from "@/routes/CreatePassword";
import CompleteProfile from "@/routes/CompleteProfile";
import ForgotPassword from "@/routes/ForgotPassword";
import CheckEmail from "@/routes/CheckEmail";
import ResetPassword from "@/routes/ResetPassword";
import PasswordResetSuccess from "@/routes/PasswordResetSuccess";
import NotFound from "@/routes/NotFound";

/** Requires a session; redirects to /login (preserving intended destination). */
const protectedRoute = (element: ReactNode) => <ProtectedRoute>{element}</ProtectedRoute>;
/** Auth pages; an already-authenticated user is bounced to /dashboard. */
const publicRoute = (element: ReactNode) => <PublicOnlyRoute>{element}</PublicOnlyRoute>;

function AnimatedRoutes() {
  const location = useLocation();
  // Collapse parameterised sub-paths to their parent so navigating within the
  // same screen (e.g. /chat ↔ /chat/:claimId) doesn't trigger a full page
  // transition — the screen keeps its mount, and the in-page AnimatePresence
  // owns the mobile slide between thread list and chat. Without this, every
  // claim selection refetches the thread list and replays the load delay.
  const sectionKey =
    location.pathname.startsWith("/chat") ? "/chat" : location.pathname;
  return (
    <ErrorBoundary resetKey={location.pathname}>
      {/* Only one page is mounted at a time (mode="wait"): the outgoing page
          finishes its exit before the incoming one enters, so the two never
          coexist in normal flow — which was making the page stack/jump and show
          two slides at once. `initial={false}` skips the enter on first load. */}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={sectionKey}>
          {/* Splash decides where to send the user based on session state. */}
          <Route path="/" element={<Splash />} />

          {/* In-app routes — require authentication. */}
          <Route path="/dashboard" element={protectedRoute(<Dashboard />)} />
          <Route path="/claims" element={protectedRoute(<Claims />)} />
          <Route path="/claims/:id" element={protectedRoute(<ClaimDetail />)} />
          <Route path="/claims/:id/accept-offer" element={protectedRoute(<OfferAcceptance />)} />
          <Route path="/claims/:id/offer-accepted" element={protectedRoute(<OfferAccepted />)} />
          <Route path="/documents" element={protectedRoute(<Documents />)} />
          <Route path="/chat" element={protectedRoute(<Chat />)} />
          <Route path="/chat/:claimId" element={protectedRoute(<Chat />)} />
          <Route path="/profile" element={protectedRoute(<Profile />)} />
          <Route path="/faq" element={protectedRoute(<Faq />)} />

          {/* Auth flow — full-screen, rendered bare by AppShell; redirect away if logged in. */}
          <Route path="/login" element={publicRoute(<Login />)} />
          <Route path="/register" element={publicRoute(<Register />)} />
          <Route path="/verify-otp" element={publicRoute(<VerifyOtp />)} />
          <Route path="/create-password" element={publicRoute(<CreatePassword />)} />
          <Route path="/complete-profile" element={publicRoute(<CompleteProfile />)} />
          <Route path="/forgot-password" element={publicRoute(<ForgotPassword />)} />
          <Route path="/check-email" element={publicRoute(<CheckEmail />)} />
          <Route path="/reset-password" element={publicRoute(<ResetPassword />)} />
          <Route path="/password-reset-success" element={publicRoute(<PasswordResetSuccess />)} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RegistrationProvider>
        <NotificationProvider>
          {/* Colourful ambient wash behind everything (light + dark variants). */}
          <div className="ambient-bg" aria-hidden />
          <AppShell>
            <AnimatedRoutes />
          </AppShell>
        </NotificationProvider>
      </RegistrationProvider>
    </AuthProvider>
  );
}
