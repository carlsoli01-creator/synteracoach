import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SCENARIO_CATEGORIES, getTodayScenario, diffColor } from "@/data/scenarios";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";

export default function ScenarioCategory() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completedCategoriesToday, setCompletedCategoriesToday] = useState<string[]>([]);

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0a0a0a", marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Category not found</div>
          <button onClick={() => navigate("/scenarios")} style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Mono', monospace" }}>
            Back to scenarios
          </button>
        </div>
      </div>
    );
  }

  const todayItem = getTodayScenario(category);
  const isCategoryDone = completedCategoriesToday.includes(category.category);

  const handleStart = () => {
    localStorage.setItem("syntera_active_scenario_category", category.category);
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "'DM Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: 220 }}>
        <div style={{ padding: "20px 48px 0" }}>
          <button
            onClick={() => navigate("/scenarios")}
            style={{ background: "none", border: "none", color: "#888", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'DM Mono', monospace" }}
          >
            ← Back to all scenarios
          </button>
        </div>

        <div style={{ padding: "24px 48px 32px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.28em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
            {category.category}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#0a0a0a", marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
            {category.category}
          </div>
          <div style={{ fontSize: 12, color: "#888", maxWidth: 440 }}>
            {category.description}
          </div>
        </div>

        <div style={{ maxWidth: 640, padding: "0 48px", paddingBottom: 80 }}>
          <div style={{
            background: "#fff",
            border: "1px solid #e2e2e2",
            borderRadius: 0,
            padding: 32,
            marginBottom: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                Today's Scenario
              </div>
              <div style={{
                fontSize: 9, fontWeight: 500,
                color: diffColor(todayItem.difficulty),
                letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace",
              }}>
                {todayItem.difficulty} · {todayItem.duration}
              </div>
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: "#0a0a0a", marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>
              {todayItem.title}
            </div>

            <div style={{
              fontSize: 13, color: "#0a0a0a", lineHeight: 1.8, padding: 24,
              background: "#f8f8f8", borderRadius: 0,
              border: "1px solid #e2e2e2", marginBottom: 24, fontStyle: "italic",
            }}>
              "{todayItem.prompt}"
            </div>

            {isCategoryDone ? (
              <div style={{
                textAlign: "center", padding: 20, background: "#f8f8f8",
                borderRadius: 0, border: "1px solid #e2e2e2",
              }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>[DONE]</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                  Come back tomorrow for a new {category.category} scenario
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 16 }}>
                  Read the scenario above, then record your response. One attempt per category per day.
                </div>
                <button
                  onClick={handleStart}
                  style={{
                    width: "100%", padding: "16px",
                    background: "#0a0a0a", color: "#fff",
                    border: "none", borderRadius: 0,
                    fontSize: 11, fontWeight: 500,
                    cursor: "pointer", letterSpacing: "0.15em",
                    transition: "opacity 0.2s",
                    fontFamily: "'DM Mono', monospace",
                    textTransform: "uppercase",
                  }}
                >
                  GO TO RECORDING
                </button>
              </>
            )}
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: 9, letterSpacing: "0.25em", color: "#888",
              textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Mono', monospace",
            }}>
              All {category.category} Scenarios ({category.items.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {category.items.map((item, i) => {
                const isToday = item.title === todayItem.title;
                return (
                  <div
                    key={i}
                    style={{
                      background: isToday ? "#fff" : "#fafafa",
                      border: `1px solid ${isToday ? "#0a0a0a" : "#e2e2e2"}`,
                      borderRadius: 0,
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#0a0a0a", display: "flex", alignItems: "center", gap: 8 }}>
                        {item.title}
                        {isToday && (
                          <span style={{
                            fontSize: 8, padding: "2px 6px",
                            background: "#0a0a0a", color: "#fff",
                            borderRadius: 0, letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            fontFamily: "'DM Mono', monospace",
                          }}>
                            TODAY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "#888", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{item.duration}</div>
                    </div>
                    <div style={{
                      fontSize: 9, fontWeight: 500,
                      color: diffColor(item.difficulty),
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      fontFamily: "'DM Mono', monospace",
                    }}>
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
