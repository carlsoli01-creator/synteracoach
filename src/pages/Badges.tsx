import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import StreakBadges from "@/components/voice/StreakBadges";

export default function Badges() {
  const { user } = useAuth();
  const { sidebarWidth } = useSidebarState();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("voice_sessions").select("*")
        .order("created_at", { ascending: false }).limit(20);
      if (data) setHistory(data);
    };
    load();
  }, [user]);

  const c = {
    bg: "#0c0c0e", panel: "#111113", border: "#1a1a1c",
    text: "#e6e6e0", muted: "#555", card: "#111113",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c0e", fontFamily: "'IBM Plex Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ padding: "48px 48px 24px" }}>
          <h1 style={{ fontSize: 48, fontFamily: "'Bebas Neue', sans-serif", color: "#e6e6e0", letterSpacing: "0.06em", lineHeight: 1, margin: 0 }}>
            BADGES
          </h1>
          <div style={{ fontSize: 10, color: "#555", marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>Earn badges by building streaks and hitting milestones</div>
        </div>
        <div style={{ padding: "0 48px", paddingBottom: 80 }}>
          <StreakBadges history={history} colors={c} />
        </div>
      </div>
    </div>
  );
}
