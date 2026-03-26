import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import AuthModal from "@/components/auth/AuthModal";
import GDPRConsentModal from "@/components/auth/GDPRConsentModal";
import LandingPage from "./pages/LandingPage";
import AutoValuePage from "./pages/AutoValuePage";
import ResultPage from "./pages/ResultPage";
import PortalPage from "./pages/PortalPage";
import AccountPage from "./pages/AccountPage";
import DashboardPage from "./pages/DashboardPage";
import EVDatabasePage from "./pages/EVDatabasePage";
import NotFound from "./pages/NotFound";
import ChatWidget from "./components/ChatWidget";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, gdprRequired, onGdprAccepted } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setAuthOpen(true);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Navigate to="/" replace />
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  if (gdprRequired) {
    return (
      <>
        {children}
        <GDPRConsentModal open={true} onAccept={onGdprAccepted} />
      </>
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/valuation" element={<AutoValuePage />} />
              <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
              <Route path="/portal" element={<ProtectedRoute><PortalPage /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/ev-database" element={<EVDatabasePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <ChatWidget />
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
