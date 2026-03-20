import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { GOAL_OPTIONS, SUBGOAL_OPTIONS, type GoalOption, type SubgoalOption, type Scenario } from "@/data/scenarios";
import { ScenarioRecordingInner } from "./ScenarioRecording";

export default function CustomPractice() {
  const navigate = useNavigate();
  const { sidebarWidth } = useSidebarState();
  const { isDark } = useTheme();
  const [step, setStep] = useState<"setup" | "recording">("setup");
  const [selectedGoal, setSelectedGoal] = useState<GoalOption | null>(null);
  const [selectedSubGoals, setSelectedSubGoals] = useState<SubgoalOption[]>([]);
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(45);

  const bg = isDark ? "#0a0a0a" : "#f8f8f8";
  const text = isDark ? "#e8e8e8" : "#0a0a0a";
  const muted = isDark ? "#666" : "#888";
  const border = isDark ? "#222" : "#e2e2e2";
  const card = isDark ? "#141414" : "#fff";
  const disabledText = isDark ? "#444" : "#ccc";

  const toggleSubGoal = (sg: SubgoalOption) => {
    if (selectedSubGoals.includes(sg)) {
      setSelectedSubGoals(selectedSubGoals.filter(s => s !== sg));
    } else if (selectedSubGoals.length < 3) {
      setSelectedSubGoals([...selectedSubGoals, sg]);
    }
  };

  const canStart = selectedGoal && selectedSubGoals.length > 0;

  if (step === "recording" && selectedGoal) {
    const customScenario: Scenario = {
      title: "Custom Practice",
      prompt: notes || `Practice focusing on ${selectedGoal} with sub-goals: ${selectedSubGoals.join(", ")}.`,
      duration: `${duration}s`,
      durationSeconds: duration,
      difficulty: "Medium",
      goal: selectedGoal,
      subGoals: selectedSubGoals,
    };

    return (
      <div style={{ minHeight: "100vh", background: bg, fontFamily: "'DM Mono', monospace" }}>
        <AppSidebar />
        <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          <div style={{ padding: "20px 48px 0" }}>
            <button onClick={() => setStep("setup")}
              style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'DM Mono', monospace" }}>
              ← Back to setup
            </button>
          </div>
          <div style={{ padding: "24px 0" }}>
            <ScenarioRecordingInner
              scenario={customScenario}
              categoryName="Custom"
              isCustom
              customGoal={selectedGoal}
              customSubGoals={selectedSubGoals}
              customNotes={notes}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'DM Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <div style={{ padding: "20px 48px 0" }}>
          <button onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'DM Mono', monospace" }}>
            ← Back to home
          </button>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 80px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: muted, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
            Custom Practice
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: text, fontFamily: "'Syne', sans-serif", marginBottom: 32 }}>
            Build Your Session
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: muted, textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
              Select Primary Goal
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {GOAL_OPTIONS.map((g) => (
                <button key={g} onClick={() => setSelectedGoal(g)}
                  style={{
                    padding: "8px 14px", border: selectedGoal === g ? `1px solid ${text}` : `1px solid ${border}`,
                    background: selectedGoal === g ? text : card, color: selectedGoal === g ? bg : text,
                    fontSize: 10, fontFamily: "'DM Mono', monospace", cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: muted, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
              Select Sub-Goals (up to 3)
            </div>
            <div style={{ fontSize: 10, color: muted, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
              {selectedSubGoals.length}/3 selected
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUBGOAL_OPTIONS.filter(sg => sg !== selectedGoal).map((sg) => {
                const isSelected = selectedSubGoals.includes(sg);
                const isDisabled = !isSelected && selectedSubGoals.length >= 3;
                return (
                  <button key={sg} onClick={() => !isDisabled && toggleSubGoal(sg)}
                    style={{
                      padding: "6px 12px", border: isSelected ? `1px solid ${text}` : `1px solid ${border}`,
                      background: isSelected ? text : card, color: isSelected ? bg : isDisabled ? disabledText : text,
                      fontSize: 10, fontFamily: "'DM Mono', monospace", cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.4 : 1, transition: "all 0.15s",
                    }}>
                    {sg}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: muted, textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
              Duration — {duration}s
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, color: muted, fontFamily: "'DM Mono', monospace" }}>5s</span>
              <input type="range" min={5} max={45} step={1} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ flex: 1, cursor: "pointer" }} />
              <span style={{ fontSize: 10, color: muted, fontFamily: "'DM Mono', monospace" }}>45s</span>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: muted, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
              Extra Notes (optional)
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for your practice session..."
              style={{
                width: "100%", minHeight: 80, padding: 12, border: `1px solid ${border}`, background: card,
                fontSize: 12, fontFamily: "'DM Mono', monospace", color: text, resize: "vertical",
                outline: "none",
              }}
            />
          </div>

          <button
            onClick={() => canStart && setStep("recording")}
            disabled={!canStart}
            style={{
              width: "100%", padding: "16px", background: canStart ? text : disabledText, color: bg,
              border: "none", fontSize: 11, fontWeight: 500, cursor: canStart ? "pointer" : "not-allowed",
              letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
              opacity: canStart ? 1 : 0.5, transition: "all 0.2s",
            }}>
            START RECORDING
          </button>
        </div>
      </div>
    </div>
  );
}