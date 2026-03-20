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
        .from("voice_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setHistory(data);
    };
    load();
  }, [user]);

  const c = {
    bg: isDark ? "#0a0a0a" : "#f8f8f8",
    panel: isDark ? "#141414" : "#fff",
    border: isDark ? "#222" : "#e2e2e2",
    text: isDark ? "#e8e8e8" : "#0a0a0a",
    muted: isDark ? "#666" : "#888",
    card: isDark ? "#141414" : "#fff",
  };

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "'DM Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <div style={{ padding: "40px 48px 24px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.text, fontFamily: "'Syne', sans-serif" }}>Progress</div>
          <div style={{ fontSize: 11, color: c.muted, marginTop: 6, fontFamily: "'DM Mono', monospace" }}>Track your improvement over time</div>
        </div>
        <div style={{ maxWidth: 900, padding: "0 48px", paddingBottom: 80 }}>
          <ProgressDashboard history={history} colors={c} />
        </div>
      </div>
    </div>
  );
}