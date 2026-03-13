import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppDrawer from "@/components/layout/AppDrawer";
import StreakBadges from "@/components/voice/StreakBadges";

export default function Badges() {
  const { user } = useAuth();
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
    bg: "#f8f8f8", panel: "#fff", border: "#e2e2e2",
    text: "#111", muted: "#888", card: "#fff",
  };

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "'DM Mono', monospace", paddingBottom: 80 }}>
      <AppDrawer />
      <div style={{ padding: "40px 28px 24px 60px", textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: c.text, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Badges</div>
        <div style={{ fontSize: 12, color: c.muted }}>Earn badges by building streaks and hitting milestones</div>
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
        <StreakBadges history={history} colors={c} />
      </div>
    </div>
  );
}