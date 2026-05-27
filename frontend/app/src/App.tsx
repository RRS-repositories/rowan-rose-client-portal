import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RegistrationProvider } from "@/context/RegistrationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Splash from "@/routes/Splash";
import Dashboard from "@/routes/Dashboard";
import Claims from "@/routes/Claims";
import ClaimDetail from "@/routes/ClaimDetail";
import Documents from "@/routes/Documents";
import Chat from "@/routes/Chat";
import Profile from "@/routes/Profile";
import Faq from "@/routes/Faq";
import Login from "@/routes/Login";
import Register from "@/routes/Register";
import VerifyOtp from "@/routes/VerifyOtp";
import CreatePassword from "@/routes/CreatePassword";
import RegistrationSuccess from "@/routes/RegistrationSuccess";
import ForgotPassword from "@/routes/ForgotPassword";
import ResetPassword from "@/routes/ResetPassword";
import NotFound from "@/routes/NotFound";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Splash />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/claims/:id" element={<ClaimDetail />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/faq" element={<Faq />} />
        {/* Auth flow — full-screen, rendered bare by AppShell */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/create-password" element={<CreatePassword />} />
        <Route path="/registration-success" element={<RegistrationSuccess />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <RegistrationProvider>
      <AppShell>
        <AnimatedRoutes />
      </AppShell>
    </RegistrationProvider>
  );
}
