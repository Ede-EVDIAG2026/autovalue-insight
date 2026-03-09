import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import AuthModal from "@/components/auth/AuthModal";
import LandingPage from "./pages/LandingPage";
import AutoValuePage from "./pages/AutoValuePage";
import ResultPage from "./pages/ResultPage";
import PortalPage from "./pages/PortalPage";
import AccountPage from "./pages/AccountPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      setAuthOpen(true);
    }
  }, [loading, session]);

  if (loading) return null;

  if (!session) {
    return (
      <>
        <Navigate to="/" replace />
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/valuation" element={<ProtectedRoute><AutoValuePage /></ProtectedRoute>} />
            <Route path="/portal" element={<ProtectedRoute><PortalPage /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
