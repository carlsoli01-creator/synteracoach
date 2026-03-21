import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SCENARIO_CATEGORIES, getTodayScenario, diffColor as _dc } from "@/data/scenarios";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";

const diffColor = (d: string) =>
  d === "Easy" ? "#6b8f4e" : d === "Medium" ? "#c8a030" : "#c85040";

export default function Scenarios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sidebarWidth } = useSidebarState();
  const { isDark } = useTheme();
  const [completedCategoriesToday, setCompletedCategoriesToday] = useState<string[]>([]);

  const bg = isDark ? "#0c0c0e" : "#f8f8f6";
  const text = isDark ? "#e6e6e0" : "#1a1a1c";
  const muted = isDark ? "#555" : "#888";
  const border = isDark ? "#1a1a1c" : "#e2e2e0";
  const card = isDark ? "#111113" : "#ffffff";
  const cardHover = isDark ? "#161618" : "#f4f4f2";
  const cardDone = isDark ? "#0a0a0c" : "#f0f0ee";
  const numColor = isDark ? "#333" : "#ccc";
  const descColor = isDark ? "#888" : "#666";
  const accent = isDark ? "#c8ff00" : "#6b9900";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data } = await (supabase as any)
        .from("voice_sessions").select("feedback")
        .gte("created_at", todayStart.toISOString());
      if (data) {
        const cats: string[] = [];
        data.forEach((s: any) => {
          const cat = s.feedback?.scenario_category;
          if (cat && !cats.includes(cat)) cats.push(cat);
        });
        setCompletedCategoriesToday(cats);
      }
    };
    load();
  }, [user]);

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'IBM Plex Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ padding: "48px 48px 24px" }}>
          <h1 style={{ fontSize: 48, fontFamily: "'Bebas Neue', sans-serif", color: text, letterSpacing: "0.06em", lineHeight: 1, margin: 0 }}>
            PRACTICE
          </h1>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: muted, textTransform: "uppercase", marginTop: 8 }}>
            One scenario per category each day · New scenarios rotate daily
          </div>
        </div>

        <div style={{
          margin: "0 48px 80px", background: border,
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1,
        }}>
          {SCENARIO_CATEGORIES.map((cat, idx) => {
            const todayItem = getTodayScenario(cat);
            const done = completedCategoriesToday.includes(cat.category);
            const num = String(idx + 1).padStart(2, "0");
            return (
              <button
                key={cat.slug}
                onClick={() => navigate(`/scenarios/${cat.slug}`)}
                style={{
                  background: done ? cardDone : card,
                  border: "none", borderRadius: 0, padding: 28,
                  textAlign: "left", cursor: "pointer",
                  transition: "background 0.15s ease",
                  opacity: done ? 0.5 : 1,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
                onMouseEnter={e => !done && (e.currentTarget.style.background = cardHover)}
                onMouseLeave={e => !done && (e.currentTarget.style.background = card)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <span style={{ fontSize: 28, fontFamily: "'Bebas Neue', sans-serif", color: numColor, letterSpacing: "0.04em" }}>
                    {num}
                  </span>
                  {done && <span style={{ fontSize: 9, letterSpacing: "0.12em", color: accent, textTransform: "uppercase" }}>DONE</span>}
                </div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: muted, textTransform: "uppercase", marginBottom: 6 }}>
                  {cat.category}
                </div>
                <div style={{ fontSize: 13, color: descColor, lineHeight: 1.6, marginBottom: 16 }}>
                  {cat.description}
                </div>
                <div style={{
                  borderTop: `1px solid ${border}`, paddingTop: 14,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: text }}>
                    {todayItem.title}
                  </div>
                  <span style={{
                    fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: diffColor(todayItem.difficulty),
                    border: `1px solid ${diffColor(todayItem.difficulty)}`,
                    padding: "2px 8px",
                  }}>
                    {todayItem.difficulty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
