import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
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
    bg: "#f8f8f8", panel: "#fff", border: "#e2e2e2",
    text: "#0a0a0a", muted: "#888", card: "#fff",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "'DM Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: 220 }}>
        <div style={{ padding: "40px 48px 24px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0a0a0a", fontFamily: "'Syne', sans-serif" }}>Progress</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 6, fontFamily: "'DM Mono', monospace" }}>Track your improvement over time</div>
        </div>
        <div style={{ maxWidth: 900, padding: "0 48px", paddingBottom: 80 }}>
          <ProgressDashboard history={history} colors={c} />
        </div>
      </div>
    </div>
  );
}
