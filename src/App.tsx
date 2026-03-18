import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import PageTransition from "@/components/layout/PageTransition";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Scenarios from "./pages/Scenarios";
import ScenarioCategory from "./pages/ScenarioCategory";
import ScenarioRecording from "./pages/ScenarioRecording";
import CustomPractice from "./pages/CustomPractice";
import Progress from "./pages/Progress";
import Badges from "./pages/Badges";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import Coach from "./pages/Coach";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
          <PageTransition>
            <Routes>
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
          </PageTransition>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
