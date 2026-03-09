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
    bg: "#f7f7f8", panel: "#ffffff", border: "#e6e6e6",
    text: "#0b0b0b", muted: "#9aa0a6", card: "#ffffff",
  };

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "Inter, sans-serif", paddingBottom: 80 }}>
      <AppDrawer />
      <div style={{ padding: "40px 28px 24px 60px", textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: c.text, marginBottom: 8 }}>🏆 Badges</div>
        <div style={{ fontSize: 13, color: c.muted }}>Earn badges by building streaks and hitting milestones</div>
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
        <StreakBadges history={history} colors={c} />
      </div>
    </div>
  );
}
