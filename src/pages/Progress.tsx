import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProgressDashboard from "@/components/voice/ProgressDashboard";

export default function Progress() {
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
      <div style={{ padding: "40px 28px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: c.text, marginBottom: 8 }}>📊 Progress</div>
        <div style={{ fontSize: 13, color: c.muted }}>Track your improvement over time</div>
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
        <ProgressDashboard history={history} colors={c} />
      </div>
    </div>
  );
}
