import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import StreakBadges from "@/components/voice/StreakBadges";
import SkeletonBlock from "@/components/voice/SkeletonBlock";

export default function Badges() {
  const { user } = useAuth();
  const { sidebarWidth } = useSidebarState();
  const { isDark } = useTheme();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("voice_sessions").select("*")
        .order("created_at", { ascending: false }).limit(20);
      if (data) setHistory(data);
      setLoading(false);
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
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'IBM Plex Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ padding: "48px 48px 24px" }}>
          <h1 style={{ fontSize: 48, fontFamily: "'Bebas Neue', sans-serif", color: text, letterSpacing: "0.06em", lineHeight: 1, margin: 0 }}>
            BADGES
          </h1>
          <div style={{ fontSize: 10, color: muted, marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>Earn badges by building streaks and hitting milestones</div>
        </div>
        <div style={{ padding: "0 48px", paddingBottom: 80 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16, marginTop: 24 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ background: c.card, border: `1px solid ${c.border}`, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <SkeletonBlock width={48} height={48} style={{ borderRadius: "50%" }} />
                  <SkeletonBlock width="80%" height={10} />
                  <SkeletonBlock width="60%" height={8} />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div style={{
              border: `1px solid ${c.border}`, padding: "56px 32px", marginTop: 24,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center",
            }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={muted} strokeWidth="1.5">
                <polygon points="24,6 30,18 42,20 33,29 36,42 24,36 12,42 15,29 6,20 18,18" />
              </svg>
              <div>
                <div style={{ fontSize: 24, fontFamily: "'Bebas Neue', sans-serif", color: text, letterSpacing: "0.04em" }}>
                  NO BADGES YET
                </div>
                <div style={{ fontSize: 11, color: muted, marginTop: 8, lineHeight: 1.6, maxWidth: 380 }}>
                  Keep practicing to unlock badges. Complete your first session to earn the First Steps badge.
                </div>
              </div>
              <a href="/scenarios" style={{
                display: "inline-block", padding: "12px 28px",
                background: isDark ? "#ffffff" : "#0c0c0e", color: bg, fontSize: 10,
                letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none",
                fontFamily: "'IBM Plex Mono', monospace", marginTop: 6,
              }}>
                Start Practicing →
              </a>
            </div>
          ) : (
            <StreakBadges history={history} colors={c} isDark={isDark} />
          )}
        </div>
      </div>
    </div>
  );
}
