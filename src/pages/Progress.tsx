import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import ProgressDashboard from "@/components/voice/ProgressDashboard";

export default function Progress() {
  const { user } = useAuth();
  const { sidebarWidth } = useSidebarState();
  const { isDark } = useTheme();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("voice_sessions").select("*")
        .order("created_at", { ascending: false }).limit(100);
      if (data) setHistory(data);
    };
    load();
  }, [user]);

  const bg = isDark ? "#0c0c0e" : "#f8f8f6";
  const text = isDark ? "#e6e6e0" : "#1a1a1c";
  const muted = isDark ? "#555" : "#888";

  const c = {
    bg, panel: isDark ? "#111113" : "#ffffff",
    border: isDark ? "#1a1a1c" : "#e2e2e0",
    text, muted,
    card: isDark ? "#111113" : "#ffffff",
    accent: isDark ? "#c8ff00" : "#6b9900",
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'IBM Plex Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ padding: "48px 48px 24px" }}>
          <h1 style={{ fontSize: 48, fontFamily: "'Bebas Neue', sans-serif", color: text, letterSpacing: "0.06em", lineHeight: 1, margin: 0 }}>
            PROGRESS
          </h1>
          <div style={{ fontSize: 10, color: muted, marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>Track your improvement over time</div>
        </div>
        <div style={{ maxWidth: 900, padding: "0 48px", paddingBottom: 80 }}>
          <ProgressDashboard history={history} colors={c} />
        </div>
      </div>
    </div>
  );
}
