import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { SCENARIO_CATEGORIES, getTodayScenario, diffColor } from "@/data/scenarios";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppDrawer from "@/components/layout/AppDrawer";

export default function Scenarios() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    <div style={{
      minHeight: "100vh",
      background: "#f7f7f8",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        padding: "40px 28px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#0b0b0b", letterSpacing: "0.03em", marginBottom: 8 }}>
          Practice Scenarios
        </div>
        <div style={{ fontSize: 13, color: "#9aa0a6", maxWidth: 480, margin: "0 auto" }}>
          One scenario per category each day · New scenarios rotate daily
        </div>
      </div>

      {/* Category Grid */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "0 20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 16,
      }}>
        {SCENARIO_CATEGORIES.map((cat) => {
          const todayItem = getTodayScenario(cat);
          const done = completedCategoriesToday.includes(cat.category);

          return (
            <button
              key={cat.slug}
              onClick={() => navigate(`/scenarios/${cat.slug}`)}
              style={{
                background: done ? "#f0f0f0" : "#fff",
                border: "1px solid #e6e6e6",
                borderRadius: 14,
                padding: "24px 20px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: done ? 0.7 : 1,
                boxShadow: "0 4px 16px rgba(16,24,40,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0b0b0b" }}>
                    {cat.category}
                    {done && <span style={{ fontSize: 11, color: "#4a8c5c", marginLeft: 8 }}>✅</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#9aa0a6", marginTop: 2 }}>
                    {cat.items.length} scenarios
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 14 }}>
                {cat.description}
              </div>
              <div style={{
                background: "#f7f7f8",
                border: "1px solid #e6e6e6",
                borderRadius: 8,
                padding: "10px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#0b0b0b" }}>
                    {todayItem.title}
                  </div>
                  <div style={{ fontSize: 9, color: "#9aa0a6" }}>{todayItem.duration}</div>
                </div>
                <div style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: diffColor(todayItem.difficulty),
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                }}>
                  {todayItem.difficulty}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
