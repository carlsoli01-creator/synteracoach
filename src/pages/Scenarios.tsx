import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { SCENARIO_CATEGORIES, getTodayScenario, diffColor } from "@/data/scenarios";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";

export default function Scenarios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sidebarWidth } = useSidebarState();
  const [completedCategoriesToday, setCompletedCategoriesToday] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data } = await (supabase as any)
        .from("voice_sessions")
        .select("feedback")
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
    <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "'DM Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: 220 }}>
        <div style={{ padding: "40px 48px 24px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0a0a0a", fontFamily: "'Syne', sans-serif" }}>
            Practice
          </div>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#888", textTransform: "uppercase", marginTop: 6, fontFamily: "'DM Mono', monospace" }}>
            One scenario per category each day · New scenarios rotate daily
          </div>
        </div>

        <div style={{
          padding: "0 48px",
          paddingBottom: 80,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}>
          {SCENARIO_CATEGORIES.map((cat) => {
            const todayItem = getTodayScenario(cat);
            const done = completedCategoriesToday.includes(cat.category);

            return (
              <button
                key={cat.slug}
                onClick={() => navigate(`/scenarios/${cat.slug}`)}
                style={{
                  background: done ? "#f5f5f5" : "#fff",
                  border: "1px solid #e2e2e2",
                  borderRadius: 0,
                  padding: 24,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  opacity: done ? 0.6 : 1,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                <div style={{ fontSize: 9, letterSpacing: "0.28em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                  {cat.category}
                  {done && <span style={{ marginLeft: 8, color: "#555" }}>[DONE]</span>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
                  {cat.category}
                </div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 14 }}>
                  {cat.description}
                </div>
                <div style={{
                  borderTop: "1px solid #e2e2e2",
                  paddingTop: 12,
                  marginTop: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0a0a0a", fontFamily: "'Syne', sans-serif" }}>
                    {todayItem.title}
                  </div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 500,
                    color: diffColor(todayItem.difficulty),
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {todayItem.difficulty}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
