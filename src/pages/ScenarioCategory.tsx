import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SCENARIO_CATEGORIES, getTodayScenario, diffColor } from "@/data/scenarios";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function ScenarioCategory() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sidebarWidth } = useSidebarState();
  const { isDark } = useTheme();
  const [completedCategoriesToday, setCompletedCategoriesToday] = useState<string[]>([]);

  const bg = isDark ? "#0a0a0a" : "#f8f8f8";
  const text = isDark ? "#e8e8e8" : "#0a0a0a";
  const muted = isDark ? "#666" : "#888";
  const border = isDark ? "#222" : "#e2e2e2";
  const card = isDark ? "#141414" : "#fff";
  const surface = isDark ? "#111" : "#f8f8f8";

  const category = SCENARIO_CATEGORIES.find((c) => c.slug === slug);

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

  if (!category) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", background: bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: text, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Category not found</div>
          <button onClick={() => navigate("/scenarios")} style={{ fontSize: 12, color: muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Mono', monospace" }}>
            Back to scenarios
          </button>
        </div>
      </div>
    );
  }

  const todayItem = getTodayScenario(category);
  const isCategoryDone = completedCategoriesToday.includes(category.category);

  const handleStart = () => {
    navigate(`/scenarios/${slug}/record`);
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'DM Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <div style={{ padding: "20px 48px 0" }}>
          <button onClick={() => navigate("/scenarios")} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'DM Mono', monospace" }}>
            ← Back to all scenarios
          </button>
        </div>

        <div style={{ padding: "24px 48px 32px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.28em", color: muted, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
            {category.category}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: text, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
            {category.category}
          </div>
          <div style={{ fontSize: 12, color: muted, maxWidth: 440 }}>
            {category.description}
          </div>
        </div>

        <div style={{ maxWidth: 640, padding: "0 48px", paddingBottom: 80 }}>
          <div style={{
            background: card, border: `1px solid ${border}`,
            borderRadius: 0, padding: 32, marginBottom: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.25em", color: muted, textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                Today's Scenario
              </div>
              <div style={{ fontSize: 9, fontWeight: 500, color: diffColor(todayItem.difficulty), letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                {todayItem.difficulty} · {todayItem.duration}
              </div>
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>
              {todayItem.title}
            </div>

            <div style={{
              fontSize: 13, color: text, lineHeight: 1.8, padding: 24,
              background: surface, borderRadius: 0,
              border: `1px solid ${border}`, marginBottom: 24, fontStyle: "italic",
            }}>
              "{todayItem.prompt}"
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: muted, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Goals</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                <span style={{ padding: "6px 12px", background: text, color: bg, fontSize: 10, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                  {todayItem.goal}
                </span>
                {todayItem.subGoals.map((sg) => (
                  <span key={sg} style={{ padding: "5px 10px", border: `1px solid ${border}`, fontSize: 10, color: text, fontFamily: "'DM Mono', monospace" }}>
                    {sg}
                  </span>
                ))}
              </div>
            </div>

            {isCategoryDone ? (
              <div style={{
                textAlign: "center", padding: 20, background: surface,
                borderRadius: 0, border: `1px solid ${border}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: text, fontFamily: "'DM Mono', monospace" }}>[DONE]</div>
                <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
                  Come back tomorrow for a new {category.category} scenario
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: muted, marginBottom: 16 }}>
                  Read the scenario above, then record your response. One attempt per category per day.
                </div>
                <button onClick={handleStart} style={{
                  width: "100%", padding: "16px", background: text, color: bg,
                  border: "none", borderRadius: 0, fontSize: 11, fontWeight: 500,
                  cursor: "pointer", letterSpacing: "0.15em", transition: "opacity 0.2s",
                  fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
                }}>
                  GO TO RECORDING
                </button>
              </>
            )}
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: muted, textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
              All {category.category} Scenarios ({category.items.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {category.items.map((item, i) => {
                const isToday = item.title === todayItem.title;
                return (
                  <div key={i} style={{
                    background: isToday ? card : (isDark ? "#0e0e0e" : "#fafafa"),
                    border: `1px solid ${isToday ? text : border}`,
                    borderRadius: 0, padding: "14px 16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: text, display: "flex", alignItems: "center", gap: 8 }}>
                        {item.title}
                        {isToday && (
                          <span style={{
                            fontSize: 8, padding: "2px 6px",
                            background: text, color: bg,
                            borderRadius: 0, letterSpacing: "0.1em",
                            textTransform: "uppercase", fontFamily: "'DM Mono', monospace",
                          }}>
                            TODAY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: muted, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{item.duration}</div>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 500, color: diffColor(item.difficulty), letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                      {item.difficulty}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}