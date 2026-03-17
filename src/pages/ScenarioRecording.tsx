import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { SCENARIO_CATEGORIES, getTodayScenario, type Scenario, type GoalOption, type SubgoalOption } from "@/data/scenarios";

const CIRCUMFERENCE = 2 * Math.PI * 70;

function getVariance(arr: number[]) {
  if (!arr.length) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke="#e2e2e2" strokeWidth={5} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="square" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }} />
        <text x={36} y={40} textAnchor="middle" fill="#0a0a0a" fontSize={14}
          fontFamily="'DM Mono', monospace" fontWeight="300">{score}</text>
      </svg>
      <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", fontFamily: "'DM Mono', monospace" }}>{label}</span>
    </div>
  );
}

interface ScenarioRecordingProps {
  scenario: Scenario;
  categoryName: string;
  isCustom?: boolean;
  customGoal?: GoalOption;
  customSubGoals?: SubgoalOption[];
  customNotes?: string;
}

function ScenarioRecordingInner({ scenario, categoryName, isCustom, customGoal, customSubGoals, customNotes }: ScenarioRecordingProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const goal = customGoal || scenario.goal;
  const subGoals = customSubGoals || scenario.subGoals;
  const duration = scenario.durationSeconds;

  const [phase, setPhase] = useState<"idle" | "recording" | "analyzing" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [waveData, setWaveData] = useState(new Array(60).fill(0.5));
  const [micError, setMicError] = useState("");
  const [metrics, setMetrics] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnalyzingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef<number[]>([]);
  const silenceRef = useRef(0);
  const framesRef = useRef(0);
  const transcriptRef = useRef("");
  const recognitionRef = useRef<any>(null);
  const recordingStartRef = useRef<number>(0);

  const ringOffset = CIRCUMFERENCE * (timeLeft / duration);

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (analysisTimeoutRef.current) { clearTimeout(analysisTimeoutRef.current); analysisTimeoutRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
    try { audioCtxRef.current?.close(); } catch (_) {}
  }, []);

  const analyzeVoice = useCallback(async () => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    const vols = volumeRef.current;
    const avgVol = vols.reduce((a, b) => a + b, 0) / (vols.length || 1);
    const silRatio = silenceRef.current / (framesRef.current || 1);
    const volVar = getVariance(vols);
    const durationSeconds = Math.round((Date.now() - recordingStartRef.current) / 1000);
    const transcript = transcriptRef.current.trim();
    try { (recognitionRef.current as any)?._stopAutoRestart?.(); } catch (_) {}
    try { recognitionRef.current?.stop(); } catch (_) {}
    if (!transcript || transcript.length < 5) {
      setMicError("Could not detect speech. Please speak clearly and try again.");
      setPhase("idle");
      isAnalyzingRef.current = false;
      return;
    }
    setPhase("analyzing");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-voice", {
        body: {
          transcript,
          audioMetrics: { averageVolume: avgVol, silenceRatio: silRatio, volumeVariance: volVar, totalFrames: framesRef.current, durationSeconds },
          scenarioMode: true,
          scenarioTitle: scenario.title,
          scenarioGoal: goal,
          scenarioSubGoals: subGoals,
          scenarioCategory: categoryName,
          customNotes: customNotes || "",
        }
      });
      if (error) {
        setMicError("Analysis failed. Please try again.");
        setPhase("idle");
        return;
      }
      if (data?.error) { setMicError(data.error); setPhase("idle"); return; }

      const { scores, goalAnalysis } = data;
      setMetrics(scores);
      setFeedback({ ...data, goalAnalysis });

      // Save session
      const sessionRow = {
        user_id: user?.id,
        overall_score: scores.overall,
        pace_score: scores.pace,
        confidence_score: scores.confidence,
        clarity_score: scores.clarity,
        transcript,
        feedback: {
          scenario_category: categoryName,
          scenario_title: scenario.title,
          scenario_goal: goal,
          scenario_sub_goals: subGoals,
          goal_analysis: data.goalAnalysis,
          analysis: data.analysis,
          tags: data.tags,
        },
        negotiation_tips: [],
        communication_tips: data.communicationTips || [],
        duration_seconds: durationSeconds,
      };
      await (supabase as any).from("voice_sessions").insert(sessionRow);
      setPhase("done");
    } catch {
      setMicError("Analysis failed. Please try again.");
      setPhase("idle");
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [user?.id, scenario.title, goal, subGoals, categoryName, customNotes]);

  const scheduleAnalyze = useCallback(() => {
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    analysisTimeoutRef.current = setTimeout(() => { void analyzeVoice(); }, 1500);
  }, [analyzeVoice]);

  const startRecording = useCallback(async () => {
    setMicError("");
    transcriptRef.current = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      volumeRef.current = [];
      silenceRef.current = 0;
      framesRef.current = 0;
      recordingStartRef.current = Date.now();
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 3;
        let finalTranscript = "";
        let isRecognitionActive = true;
        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              let bestAlt = event.results[i][0];
              for (let j = 1; j < event.results[i].length; j++) {
                if (event.results[i][j].confidence > bestAlt.confidence) bestAlt = event.results[i][j];
              }
              finalTranscript += bestAlt.transcript + " ";
            } else { interim += event.results[i][0].transcript; }
          }
          transcriptRef.current = finalTranscript + interim;
        };
        recognition.onerror = (e: any) => {
          if (isRecognitionActive && (e.error === "network" || e.error === "aborted" || e.error === "no-speech")) {
            try { setTimeout(() => { if (isRecognitionActive) recognition.start(); }, 300); } catch (_) {}
          }
        };
        recognition.onend = () => {
          if (isRecognitionActive) {
            try { setTimeout(() => { if (isRecognitionActive) recognition.start(); }, 200); } catch (_) {}
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
        (recognitionRef.current as any)._stopAutoRestart = () => { isRecognitionActive = false; };
      }
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.start();
      setPhase("recording");
      setTimeLeft(duration);
      setMetrics(null);
      setFeedback(null);
      const animate = () => {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        setWaveData(Array.from({ length: 60 }, (_, i) => data[Math.floor(i / 60 * data.length)] / 255));
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        const avg = sum / data.length;
        volumeRef.current.push(avg);
        if (avg < 3) silenceRef.current++;
        framesRef.current++;
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
      let t = duration;
      timerRef.current = setInterval(() => {
        t--;
        setTimeLeft(t);
        if (t <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          mr.stop();
          try { stream.getTracks().forEach((tr) => tr.stop()); } catch (_) {}
          try { audioCtx.close(); } catch (_) {}
          try { (recognitionRef.current as any)?._stopAutoRestart?.(); } catch (_) {}
          try { recognitionRef.current?.stop(); } catch (_) {}
          setWaveData(new Array(60).fill(0.5));
          scheduleAnalyze();
        }
      }, 1000);
    } catch (e: any) {
      setMicError(e?.message || "Microphone access denied.");
    }
  }, [scheduleAnalyze, duration]);

  const reset = useCallback(() => {
    stopAll();
    try { (recognitionRef.current as any)?._stopAutoRestart?.(); } catch (_) {}
    try { recognitionRef.current?.stop(); } catch (_) {}
    transcriptRef.current = "";
    setPhase("idle");
    setTimeLeft(duration);
    setMetrics(null);
    setFeedback(null);
    setWaveData(new Array(60).fill(0.5));
    setMicError("");
  }, [stopAll, duration]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
          {isCustom ? "Custom Practice" : categoryName}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#0a0a0a", fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
          {scenario.title}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 32 }}>
        {/* Left — Recording */}
        <div>
          {/* Scenario prompt */}
          {phase === "idle" && (
            <div style={{
              fontSize: 13, color: "#0a0a0a", lineHeight: 1.8, padding: 20,
              background: "#f0f0f0", border: "1px solid #e2e2e2", marginBottom: 24, fontStyle: "italic",
            }}>
              "{scenario.prompt}"
            </div>
          )}

          {/* Waveform */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ height: 56, background: "#f0f0f0", border: "1px solid #e2e2e2", display: "flex", alignItems: "center", padding: "0 6px", gap: 2 }}>
              {waveData.map((v, i) =>
                <div key={i} style={{
                  flex: 1,
                  background: phase === "recording" ? "#0a0a0a" : "#d8d8d8",
                  height: `${Math.max(4, Math.abs(v - 0.5) * 128)}px`,
                  transition: "height 0.05s, background 0.2s",
                  opacity: phase === "recording" ? 0.5 + Math.abs(v - 0.5) : 0.5
                }} />
              )}
            </div>
          </div>

          {/* Timer Ring */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <svg width={120} height={120} viewBox="0 0 160 160">
                <circle cx={80} cy={80} r={70} fill="none" stroke="#e2e2e2" strokeWidth={1} />
                <circle cx={80} cy={80} r={70} fill="none" stroke="#0a0a0a" strokeWidth={1}
                  strokeLinecap="square" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={ringOffset}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.9s linear" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 300, color: "#0a0a0a", lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{timeLeft}</div>
                <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#888", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>seconds</div>
                {phase === "recording" && <div style={{ marginTop: 4, width: 8, height: 8, background: "#0a0a0a", animation: "pulse 1s infinite" }} />}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
            {phase === "recording" ? (
              <button onClick={() => { stopAll(); setWaveData(new Array(60).fill(0.5)); setPhase("analyzing"); scheduleAnalyze(); }}
                style={{ fontSize: 11, letterSpacing: "0.14em", padding: "14px 36px", border: "none", cursor: "pointer", background: "#0a0a0a", color: "#fff", fontWeight: 500, fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
                STOP RECORDING
              </button>
            ) : (
              <button onClick={phase !== "analyzing" ? startRecording : undefined} disabled={phase === "analyzing"}
                style={{ fontSize: 11, letterSpacing: "0.14em", padding: "14px 36px", border: "none", cursor: phase === "analyzing" ? "not-allowed" : "pointer", background: "#0a0a0a", color: "#fff", fontWeight: 500, opacity: phase === "analyzing" ? 0.6 : 1, fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
                {phase === "idle" ? "START RECORDING" : phase === "analyzing" ? "ANALYZING..." : "RECORD AGAIN"}
              </button>
            )}
            <button onClick={reset}
              style={{ fontSize: 11, padding: "14px 18px", background: "none", border: "1px solid #e2e2e2", color: "#888", cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
              Reset
            </button>
          </div>

          {micError && <div style={{ textAlign: "center", fontSize: 11, color: "#0a0a0a", marginBottom: 16, lineHeight: 1.6 }}>{micError}</div>}
          {phase === "analyzing" && <div style={{ textAlign: "center", fontSize: 11, color: "#888", marginBottom: 24, fontFamily: "'DM Mono', monospace" }}>Analyzing goal performance...</div>}
        </div>

        {/* Right — Goals sidebar */}
        <div>
          <div style={{ border: "1px solid #e2e2e2", background: "#fff", padding: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
              Goals
            </div>

            {/* Main goal */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#888", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Primary</div>
              <div style={{ padding: "8px 12px", border: "1px solid #0a0a0a", background: "#0a0a0a", color: "#fff", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                {goal}
              </div>
            </div>

            {/* Sub-goals */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#888", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Sub-Goals</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {subGoals.map((sg) => (
                  <div key={sg} style={{ padding: "6px 12px", border: "1px solid #e2e2e2", fontSize: 10, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>
                    {sg}
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e2e2" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#888", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>Duration</div>
              <div style={{ fontSize: 18, fontWeight: 300, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>{duration}s</div>
            </div>

            {customNotes && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e2e2" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#888", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>Notes</div>
                <div style={{ fontSize: 11, color: "#0a0a0a", lineHeight: 1.6 }}>{customNotes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {phase === "done" && feedback && metrics && (
        <div style={{ marginTop: 32, animation: "fadeUp 0.5s ease" }}>
          {/* Goal Achievement */}
          {feedback.goalAnalysis && (
            <div style={{ border: "1px solid #e2e2e2", background: "#fff", padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
                Goal Achievement
              </div>

              {/* Primary goal score */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>{goal}</span>
                  <span style={{ fontSize: 24, fontWeight: 300, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>{feedback.goalAnalysis.goalScore ?? 0}</span>
                </div>
                <div style={{ height: 4, background: "#e2e2e2" }}>
                  <div style={{ height: "100%", width: `${feedback.goalAnalysis.goalScore ?? 0}%`, background: "#0a0a0a", transition: "width 0.5s ease" }} />
                </div>
                {feedback.goalAnalysis.goalFeedback && (
                  <div style={{ fontSize: 12, color: "#0a0a0a", lineHeight: 1.7, marginTop: 8 }}>{feedback.goalAnalysis.goalFeedback}</div>
                )}
              </div>

              {/* Sub-goal scores */}
              {feedback.goalAnalysis.subGoalScores && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {feedback.goalAnalysis.subGoalScores.map((sg: any) => (
                    <div key={sg.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace" }}>{sg.name}</span>
                        <span style={{ fontSize: 14, fontWeight: 300, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>{sg.score}</span>
                      </div>
                      <div style={{ height: 2, background: "#e2e2e2" }}>
                        <div style={{ height: "100%", width: `${sg.score}%`, background: "#555", transition: "width 0.5s ease" }} />
                      </div>
                      {sg.feedback && <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5, marginTop: 4 }}>{sg.feedback}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Standard scores */}
          <div style={{ border: "1px solid #e2e2e2", background: "#fff", padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
              Performance Overview
            </div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <ScoreRing score={metrics.overall} label="Overall" color="#0a0a0a" />
              <ScoreRing score={metrics.pace} label="Pace" color="#555" />
              <ScoreRing score={metrics.confidence} label="Confidence" color="#555" />
              <ScoreRing score={metrics.clarity} label="Clarity" color="#555" />
            </div>
          </div>

          {/* Analysis text */}
          {feedback.analysis && (
            <div style={{ border: "1px solid #e2e2e2", background: "#fff", padding: 24, marginBottom: 24 }}>
              {[
                { title: "Overall", text: feedback.analysis.overall },
                { title: "Strength", text: feedback.analysis.strength },
                { title: "Weakness", text: feedback.analysis.weakness },
                { title: "Recommendation", text: feedback.analysis.recommendation },
              ].filter(s => s.text).map(s => (
                <div key={s.title} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{s.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.8, color: "#0a0a0a" }}>{s.text}</div>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => navigate(-1)}
            style={{ width: "100%", padding: "14px", background: "#0a0a0a", color: "#fff", border: "none", fontSize: 11, fontWeight: 500, cursor: "pointer", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
            BACK TO SCENARIOS
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

export default function ScenarioRecording() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { sidebarWidth } = useSidebarState();

  const category = SCENARIO_CATEGORIES.find((c) => c.slug === slug);

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

  const todayScenario = getTodayScenario(category);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "'DM Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <div style={{ padding: "20px 48px 0" }}>
          <button onClick={() => navigate(`/scenarios/${slug}`)}
            style={{ background: "none", border: "none", color: "#888", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'DM Mono', monospace" }}>
            ← Back to {category.category}
          </button>
        </div>
        <div style={{ padding: "24px 0" }}>
          <ScenarioRecordingInner scenario={todayScenario} categoryName={category.category} />
        </div>
      </div>
    </div>
  );
}

// Exported for custom practice use
export { ScenarioRecordingInner };
