import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SCENARIO_CATEGORIES, getTodayScenario, diffColor } from "@/data/scenarios";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppDrawer from "@/components/layout/AppDrawer";

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤷</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0b0b0b", marginBottom: 8 }}>Category not found</div>
          <button onClick={() => navigate("/scenarios")} style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
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
    <div style={{
      minHeight: "100vh",
      background: "#f7f7f8",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      paddingBottom: 80,
    }}>
      {/* Back nav */}
      <div style={{ padding: "20px 28px 0" }}>
        <button
          onClick={() => navigate("/scenarios")}
          style={{
            background: "none",
            border: "none",
            color: "#9aa0a6",
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Back to all scenarios
        </button>
      </div>

      {/* Category Header */}
      <div style={{ padding: "24px 28px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>{category.icon}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#0b0b0b", marginBottom: 8 }}>
          {category.category}
        </div>
        <div style={{ fontSize: 13, color: "#9aa0a6", maxWidth: 440, margin: "0 auto" }}>
          {category.description}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px" }}>
        {/* Today's Scenario - Featured */}
        <div style={{
          background: "#fff",
          border: "1px solid #e6e6e6",
          borderRadius: 14,
          padding: 28,
          marginBottom: 24,
          boxShadow: "0 8px 32px rgba(16,24,40,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#9aa0a6", textTransform: "uppercase" as const }}>
              Today's Scenario
            </div>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              color: diffColor(todayItem.difficulty),
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
            }}>
              {todayItem.difficulty} · {todayItem.duration}
            </div>
          </div>

          <div style={{ fontSize: 20, fontWeight: 700, color: "#0b0b0b", marginBottom: 16 }}>
            {todayItem.title}
          </div>

          <div style={{
            fontSize: 14,
            color: "#0b0b0b",
            lineHeight: 1.8,
            padding: 20,
            background: "#f7f7f8",
            borderRadius: 8,
            border: "1px solid #e6e6e6",
            marginBottom: 24,
            fontStyle: "italic",
          }}>
            "{todayItem.prompt}"
          </div>

          {isCategoryDone ? (
            <div style={{
              textAlign: "center",
              padding: 20,
              background: "#f7f7f8",
              borderRadius: 8,
              border: "1px solid #e6e6e6",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0b0b0b" }}>Completed for today</div>
              <div style={{ fontSize: 12, color: "#9aa0a6", marginTop: 4 }}>
                Come back tomorrow for a new {category.category} scenario
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#9aa0a6", marginBottom: 16 }}>
                Read the scenario above, then record your response. One attempt per category per day.
              </div>
              <button
                onClick={handleStart}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "linear-gradient(90deg, #111827, #1f2937)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  transition: "opacity 0.2s",
                  boxShadow: "0 4px 14px rgba(16,24,40,0.18)",
                }}
              >
                🎙 GO TO RECORDING
              </button>
            </>
          )}
        </div>

        {/* All Scenarios in this category */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 9,
            letterSpacing: "0.25em",
            color: "#9aa0a6",
            textTransform: "uppercase" as const,
            marginBottom: 12,
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
                    border: `1px solid ${isToday ? "#6b7280" : "#e6e6e6"}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0b0b0b", display: "flex", alignItems: "center", gap: 8 }}>
                      {item.title}
                      {isToday && (
                        <span style={{
                          fontSize: 8,
                          padding: "2px 6px",
                          background: "#111827",
                          color: "#fff",
                          borderRadius: 4,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase" as const,
                        }}>
                          TODAY
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "#9aa0a6", marginTop: 2 }}>{item.duration}</div>
                  </div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: diffColor(item.difficulty),
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
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
  );
}
