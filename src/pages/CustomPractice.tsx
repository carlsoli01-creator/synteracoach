import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { GOAL_OPTIONS, SUBGOAL_OPTIONS, type GoalOption, type SubgoalOption, type Scenario } from "@/data/scenarios";
import { ScenarioRecordingInner } from "./ScenarioRecording";

export default function CustomPractice() {
  const navigate = useNavigate();
  const { sidebarWidth } = useSidebarState();
  const [step, setStep] = useState<"setup" | "recording">("setup");
  const [selectedGoal, setSelectedGoal] = useState<GoalOption | null>(null);
  const [selectedSubGoals, setSelectedSubGoals] = useState<SubgoalOption[]>([]);
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(45);

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
      <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "'DM Mono', monospace" }}>
        <AppSidebar />
        <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          <div style={{ padding: "20px 48px 0" }}>
            <button onClick={() => setStep("setup")}
              style={{ background: "none", border: "none", color: "#888", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'DM Mono', monospace" }}>
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
    <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "'DM Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <div style={{ padding: "20px 48px 0" }}>
          <button onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: "#888", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'DM Mono', monospace" }}>
            ← Back to home
          </button>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 80px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
            Custom Practice
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0a0a0a", fontFamily: "'Syne', sans-serif", marginBottom: 32 }}>
            Build Your Session
          </div>

          {/* Goal selection */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
              Select Primary Goal
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {GOAL_OPTIONS.map((g) => (
                <button key={g} onClick={() => setSelectedGoal(g)}
                  style={{
                    padding: "8px 14px", border: selectedGoal === g ? "1px solid #0a0a0a" : "1px solid #e2e2e2",
                    background: selectedGoal === g ? "#0a0a0a" : "#fff", color: selectedGoal === g ? "#fff" : "#0a0a0a",
                    fontSize: 10, fontFamily: "'DM Mono', monospace", cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-goal selection */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
              Select Sub-Goals (up to 3)
            </div>
            <div style={{ fontSize: 10, color: "#888", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
              {selectedSubGoals.length}/3 selected
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUBGOAL_OPTIONS.filter(sg => sg !== selectedGoal).map((sg) => {
                const isSelected = selectedSubGoals.includes(sg);
                const isDisabled = !isSelected && selectedSubGoals.length >= 3;
                return (
                  <button key={sg} onClick={() => !isDisabled && toggleSubGoal(sg)}
                    style={{
                      padding: "6px 12px", border: isSelected ? "1px solid #0a0a0a" : "1px solid #e2e2e2",
                      background: isSelected ? "#0a0a0a" : "#fff", color: isSelected ? "#fff" : isDisabled ? "#ccc" : "#0a0a0a",
                      fontSize: 10, fontFamily: "'DM Mono', monospace", cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.4 : 1, transition: "all 0.15s",
                    }}>
                    {sg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
              Extra Notes (optional)
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for your practice session..."
              style={{
                width: "100%", minHeight: 80, padding: 12, border: "1px solid #e2e2e2", background: "#fff",
                fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#0a0a0a", resize: "vertical",
                outline: "none",
              }}
            />
          </div>

          {/* Start button */}
          <button
            onClick={() => canStart && setStep("recording")}
            disabled={!canStart}
            style={{
              width: "100%", padding: "16px", background: canStart ? "#0a0a0a" : "#ccc", color: "#fff",
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
