import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import PageTransition from "@/components/layout/PageTransition";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

// Lazy-load secondary routes
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Scenarios = lazy(() => import("./pages/Scenarios"));
const ScenarioCategory = lazy(() => import("./pages/ScenarioCategory"));
const ScenarioRecording = lazy(() => import("./pages/ScenarioRecording"));
const CustomPractice = lazy(() => import("./pages/CustomPractice"));
const Progress = lazy(() => import("./pages/Progress"));
const Badges = lazy(() => import("./pages/Badges"));
const History = lazy(() => import("./pages/History"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Coach = lazy(() => import("./pages/Coach"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));

const queryClient = new QueryClient();

function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(var(--background))",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "2px solid hsl(var(--border))",
          borderTopColor: "hsl(var(--foreground))",
          borderRadius: "50%",
          animation: "syntSpin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes syntSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
          <SidebarProvider>
          <PageTransition>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/landing" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/scenarios" element={<ProtectedRoute><Scenarios /></ProtectedRoute>} />
                <Route path="/scenarios/:slug" element={<ProtectedRoute><ScenarioCategory /></ProtectedRoute>} />
                <Route path="/scenarios/:slug/record" element={<ProtectedRoute><ScenarioRecording /></ProtectedRoute>} />
                <Route path="/custom-practice" element={<ProtectedRoute><CustomPractice /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/coach" element={<ProtectedRoute><Coach /></ProtectedRoute>} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </PageTransition>
          </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
