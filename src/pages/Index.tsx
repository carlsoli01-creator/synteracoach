import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PaywallCTA, PricingModal } from "@/components/paywall/PaywallOverlay";
import AppDrawer from "@/components/layout/AppDrawer";
import IntroExperience from "@/components/onboarding/IntroExperience";
import ForcedPaywall from "@/components/onboarding/ForcedPaywall";

const DEFAULT_DURATION = 15;
const CIRCUMFERENCE = 2 * Math.PI * 70;

function getVariance(arr) {
  if (!arr.length) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
}

function ScoreRing({ score, label, color }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke="#e6e6e6" strokeWidth={5} />
        <circle
          cx={36}
          cy={36}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }} />
        
        <text
          x={36}
          y={40}
          textAnchor="middle"
          fill="#0b0b0b"
          fontSize={14}
          fontFamily="Inter, sans-serif"
          fontWeight="bold">
          
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9aa0a6" }}>{label}</span>
    </div>);

}

function HistoryCard({ entry, index }) {
  const score = entry.overall_score ?? entry.overall;
  const pace = entry.pace_score ?? entry.pace;
  const conf = entry.confidence_score ?? entry.conf;
  const clar = entry.clarity_score ?? entry.clar;
  const time = entry.created_at ?
  new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) :
  entry.time;
  const date = entry.created_at ?
  new Date(entry.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) :
  "";
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D";
  const gradeColor =
  score >= 80 ? "#4a8c5c" : score >= 65 ? "#6b7280" : score >= 50 ? "#c97a2a" : "#c04a2a";
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e6e6e6",
        borderRadius: 10,
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 6px 24px rgba(16,24,40,0.06)"
      }}>
      
      <div style={{ fontSize: 28, color: gradeColor, fontWeight: "bold", minWidth: 24 }}>{grade}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#0b0b0b", marginBottom: 4 }}>
          Session #{index + 1} — Score {score}/100
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {[
          { k: "pace", v: pace },
          { k: "conf", v: conf },
          { k: "clar", v: clar }].
          map(({ k, v }) =>
          <div key={k} style={{ fontSize: 9, color: "#9aa0a6", letterSpacing: "0.1em" }}>
              {k.toUpperCase()} <span style={{ color: "#6b7280" }}>{v}%</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 9, color: "#9aa0a6", textAlign: "right" }}>
        {date && <div>{date}</div>}
        <div>{time}</div>
      </div>
    </div>);

}

const COMMUNICATION_TIPS = [
"Speak from your diaphragm for fuller resonance.",
"Warm up your voice with lip trills and humming.",
"Chunk long sentences into shorter, clearer phrases.",
"Place stress on the key word to change emphasis.",
"Breathe at punctuation to maintain phrasing.",
"Maintain a steady volume to project confidence.",
"Use deliberate pacing: aim for clarity over speed.",
"Reduce upward inflection to avoid sounding unsure.",
"Record yourself and note where volume drops occur.",
"Practice reading aloud with exaggerated stress patterns.",
"Use pauses to allow listeners to process key points.",
"Avoid trailing questions at the end of statements.",
"Keep sentences active and concise.",
"Use vocal variety to keep attention on important words.",
"Slow down slightly when delivering the main point.",
"Match the listener's speaking pace to build rapport.",
"Monitor and reduce filler words like 'um' and 'like'.",
"Practice sustaining consistent speaking energy for 60s stretches.",
"Use shorter opening sentences to establish clarity.",
"End with a clear, downward-inflected close to each idea.",
"Pause strategically after key points to create impact.",
"Use downward inflection to signal finality and conviction.",
"Break complex ideas into small, digestible chunks.",
"Mirror the other person's tempo briefly to build rapport.",
"Use silence as a tool — let the other person fill it.",
"Start important sentences with an anchor word (e.g., 'Consider').",
"Label emotions neutrally to defuse tension (e.g., 'I hear concern').",
"Keep your pitch steady when presenting key information.",
"Use micro-pauses (250–400ms) to sound deliberate, not hesitant.",
"Ask calibrated questions to engage listeners ('How would you...?').",
"Summarize key points before moving on to new ideas.",
"Use consistent terminology to reduce ambiguity.",
"Record and compare your delivery across sessions."];


const QUIZ_QUESTIONS = [
{
  id: "goal",
  q: "What do you most want to improve?",
  options: ["Pace", "Tone/Authority", "Clarity", "Confidence", "Conciseness"]
},
{
  id: "experience",
  q: "How often do you practice speaking exercises?",
  options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"]
},
{
  id: "audience",
  q: "Who is your most common audience?",
  options: ["One person", "Small team", "Large group", "Clients/Customers", "Remote calls"]
},
{
  id: "nerves",
  q: "Do you feel nervous when speaking publicly?",
  options: ["Always", "Often", "Sometimes", "Rarely", "Never"]
},
{
  id: "filler",
  q: "Do you use filler words (um/like) often?",
  options: ["Very often", "Sometimes", "Occasionally", "Rarely", "Never"]
},
{
  id: "goalType",
  q: "Which result matters most?",
  options: ["Close deals", "Appear confident", "Be concise", "Be persuasive", "Improve clarity"]
}];


function derivePersonalization(answers: Record<string, string>) {
  const picksComm: string[] = [];
  if (answers.goal?.includes("Pace")) picksComm.push(COMMUNICATION_TIPS[6], COMMUNICATION_TIPS[20]);
  if (answers.goal?.includes("Tone")) picksComm.push(COMMUNICATION_TIPS[0], COMMUNICATION_TIPS[21]);
  if (answers.goal?.includes("Clarity")) picksComm.push(COMMUNICATION_TIPS[2], COMMUNICATION_TIPS[22]);
  if (answers.goal?.includes("Confidence")) picksComm.push(COMMUNICATION_TIPS[5], COMMUNICATION_TIPS[28]);
  if (answers.goal?.includes("Conciseness")) picksComm.push(COMMUNICATION_TIPS[12], COMMUNICATION_TIPS[31]);
  if (answers.filler?.includes("Very") || answers.filler?.includes("Sometimes")) picksComm.push(COMMUNICATION_TIPS[16]);
  if (answers.nerves?.includes("Always") || answers.nerves?.includes("Often")) picksComm.push(COMMUNICATION_TIPS[10]);
  for (let i = 0; picksComm.length < 6; i++) picksComm.push(COMMUNICATION_TIPS[i % COMMUNICATION_TIPS.length]);

  // Personalized subtitle based on goal
  const goalMap: Record<string, string> = {
    "Pace": "Optimized for pace & rhythm mastery",
    "Tone/Authority": "Tuned for tone & authority building",
    "Clarity": "Focused on crystal-clear delivery",
    "Confidence": "Designed to build vocal confidence",
    "Conciseness": "Streamlined for concise impact"
  };
  const subtitle = goalMap[answers.goal] || "Voice Intelligence Platform";

  // Focus area for hero text
  const focusMap: Record<string, string> = {
    "Close deals": "Close Deals.",
    "Appear confident": "Command the Room.",
    "Be concise": "Say More with Less.",
    "Be persuasive": "Persuade with Precision.",
    "Improve clarity": "Speak with Clarity."
  };
  const heroFocus = focusMap[answers.goalType] || "Be Analyzed.";

  return { neg: [], comm: picksComm.slice(0, 6), subtitle, heroFocus };
}

function OnboardingQuiz({ onFinish }: {onFinish: (result: {neg: string[];comm: string[];answers: Record<string, string>;}) => void;}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const q = QUIZ_QUESTIONS[step];

  const handleFinish = () => {
    const { neg, comm } = derivePersonalization(answers);
    onFinish({ neg, comm, answers });
    // Mark quiz completion time for tip popup delay
    localStorage.setItem("syntera_quiz_completed_at", Date.now().toString());
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2,6,23,0.5)",
        zIndex: 60
      }}>
      
      <div
        style={{
          width: "min(540px, 92vw)",
          background: "#fff",
          border: "1px solid #e6e6e6",
          borderRadius: 14,
          padding: 28,
          boxShadow: "0 24px 64px rgba(16,24,40,0.18)"
        }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0b0b0b" }}>Welcome — Quick Setup</div>
          <div style={{ fontSize: 12, color: "#9aa0a6" }}>
            {step + 1}/{QUIZ_QUESTIONS.length}
          </div>
        </div>
        <div style={{ fontSize: 14, color: "#0b0b0b", marginBottom: 12, fontWeight: 500 }}>{q.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {q.options.map((opt) =>
          <button
            key={opt}
            onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
            style={{
              textAlign: "left",
              padding: "10px 14px",
              borderRadius: 8,
              cursor: "pointer",
              border: answers[q.id] === opt ? "2px solid #6b7280" : "1px solid #e6e6e6",
              background: answers[q.id] === opt ? "#f4f4f5" : "#fff",
              fontWeight: answers[q.id] === opt ? 600 : 400,
              fontSize: 13,
              color: "#0b0b0b",
              transition: "all .15s"
            }}>
            
              {opt}
            </button>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px dashed #e6e6e6",
              background: "transparent",
              cursor: step === 0 ? "not-allowed" : "pointer",
              color: "#9aa0a6",
              fontSize: 13
            }}>
            
            Back
          </button>
          {step < QUIZ_QUESTIONS.length - 1 ?
          <button
            onClick={() => answers[q.id] && setStep((s) => s + 1)}
            disabled={!answers[q.id]}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              background: answers[q.id] ? "linear-gradient(90deg,#111827,#1f2937)" : "#d1d5db",
              color: "#fff",
              cursor: answers[q.id] ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 600,
              opacity: answers[q.id] ? 1 : 0.6,
              transition: "all 0.2s"
            }}>
            
              Next
            </button> :

          <button
            onClick={() => answers[q.id] && handleFinish()}
            disabled={!answers[q.id]}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              background: answers[q.id] ? "linear-gradient(90deg,#111827,#1f2937)" : "#d1d5db",
              color: "#fff",
              cursor: answers[q.id] ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 600,
              opacity: answers[q.id] ? 1 : 0.6,
              transition: "all 0.2s"
            }}>
            
              Finish & Start
            </button>
          }
        </div>
      </div>
    </div>);

}

function VoiceMicControl({ onStart, onStop, onStopEarly, phase }: {onStart: () => void;onStop: () => void;onStopEarly: () => void;phase: string;}) {
  const isRecording = phase === "recording";
  const isAnalyzing = phase === "analyzing";
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
      {isRecording ?
      <button
        onClick={onStopEarly}
        style={{
          fontSize: 14,
          letterSpacing: "0.1em",
          padding: "14px 36px",
          border: "none",
          cursor: "pointer",
          background: "#c04a2a",
          color: "#fff",
          fontWeight: 700,
          borderRadius: 8,
          transition: "all 0.2s",
          boxShadow: "0 0 0 4px rgba(192,74,42,0.2)"
        }}>
        
          ⏹ STOP RECORDING
        </button> :

      <button
        onClick={!isAnalyzing ? onStart : undefined}
        disabled={isAnalyzing}
        style={{
          fontSize: 14,
          letterSpacing: "0.1em",
          padding: "14px 36px",
          border: "none",
          cursor: isAnalyzing ? "not-allowed" : "pointer",
          background: "linear-gradient(90deg,#111827,#1f2937)",
          color: "#fff",
          fontWeight: 700,
          borderRadius: 8,
          opacity: isAnalyzing ? 0.6 : 1,
          transition: "all 0.2s",
          boxShadow: "0 4px 14px rgba(16,24,40,0.18)"
        }}>
        
          {phase === "idle" ?
        "🎙 START RECORDING" :
        phase === "analyzing" ?
        "⏳ ANALYZING..." :
        "🎙 RECORD AGAIN"}
        </button>
      }
      <button
        onClick={onStop}
        style={{
          fontSize: 13,
          padding: "14px 18px",
          background: "none",
          border: "1px solid #e6e6e6",
          color: "#9aa0a6",
          cursor: "pointer",
          transition: "all 0.2s",
          borderRadius: 8
        }}>
        
        Reset
      </button>
    </div>);

}

export default function Negotium() {
  const { user, signOut } = useAuth();
  const [phase, setPhase] = useState("idle");
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [metrics, setMetrics] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState<any[]>([]);

  // Load session history from database
  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      const { data } = await (supabase as any).
      from("voice_sessions").
      select("*").
      order("created_at", { ascending: false }).
      limit(20);
      if (data) setHistory(data);
    };
    loadHistory();
  }, [user]);
  const [tab] = useState("analysis");
  const [waveData, setWaveData] = useState(new Array(80).fill(0.5));
  const [micError, setMicError] = useState("");
  const [theme, setTheme] = useState("light");
  const [spacingMode, setSpacingMode] = useState("airy");
  const [recCommTips, setRecCommTips] = useState<string[]>([]);
  const [userSubtitle, setUserSubtitle] = useState("Voice Intelligence Platform");
  const [heroFocus, setHeroFocus] = useState("Be Analyzed.");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("syntera_premium") === "true");
  const [showPricing, setShowPricing] = useState(false);
  const [showTipPopup, setShowTipPopup] = useState(false);
  const [tipText, setTipText] = useState("");
  const [showIntro, setShowIntro] = useState(() => localStorage.getItem("syntera_premium") === "true" ? false : !localStorage.getItem("syntera_intro_done"));
  const [showForcedPaywall, setShowForcedPaywall] = useState(false);

  // Compute which categories have been completed today from history
  const completedCategoriesToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString();
    const todaySessions = history.filter((s) => {
      if (!s.created_at) return false;
      return new Date(s.created_at).toLocaleDateString() === todayStr;
    });
    // Check category from feedback JSON
    const cats: string[] = [];
    todaySessions.forEach((s) => {
      const fb = s.feedback as any;
      if (fb?.scenario_category && !cats.includes(fb.scenario_category)) {
        cats.push(fb.scenario_category);
      }
    });
    return cats;
  }, [history]);

  // Check if quiz was already completed
  const [quizVisible, setQuizVisible] = useState(() => {
    if (localStorage.getItem("syntera_premium") === "true") return false;
    try {
      const saved = localStorage.getItem("negotium_quiz");
      if (saved) {
        const { answers } = JSON.parse(saved);
        const p = derivePersonalization(answers);
        return false;
      }
    } catch (_) {}
    return true;
  });

  // Show tip popup randomly after quiz completion (5-15s delay)
  useEffect(() => {
    const quizDone = localStorage.getItem("negotium_quiz");
    const tipShownToday = localStorage.getItem("syntera_tip_shown_date") === new Date().toDateString();
    if (!quizDone || tipShownToday || quizVisible) return;

    const delay = 5000 + Math.random() * 10000; // 5-15 seconds
    const timer = setTimeout(() => {
      const randomTip = COMMUNICATION_TIPS[Math.floor(Math.random() * COMMUNICATION_TIPS.length)];
      setTipText(randomTip);
      setShowTipPopup(true);
      localStorage.setItem("syntera_tip_shown_date", new Date().toDateString());
    }, delay);
    return () => clearTimeout(timer);
  }, [quizVisible]);


  useEffect(() => {
    try {
      const saved = localStorage.getItem("negotium_quiz");
      if (saved) {
        const { answers } = JSON.parse(saved);
        const p = derivePersonalization(answers);
        setRecCommTips([...new Set([...(p.comm || [])].slice(0, 6))]);
        setUserSubtitle(p.subtitle);
        setHeroFocus(p.heroFocus);
      }
    } catch (_) {}
  }, []);

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
  const [livePace, setLivePace] = useState(0);
  const [liveEnergy, setLiveEnergy] = useState(0);

  const ringOffset = CIRCUMFERENCE * (timeLeft / selectedDuration);
  const isDark = theme === "dark";
  const c = {
    bg: isDark ? "#070707" : "#ffffff",
    panel: isDark ? "#0b0b0b" : "#f5f5f5",
    border: isDark ? "#1e1e1e" : "#e0e0e0",
    text: isDark ? "#e8e0d0" : "#1a1a1a",
    muted: isDark ? "#9aa0a6" : "#6b7280",
    card: isDark ? "#0f0f0f" : "#ffffff",
    waveBg: isDark ? "#0d0d0b" : "#f0f0f0",
    waveEmpty: isDark ? "#2a2a26" : "#d0d0d0"
  };

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
    try {
      audioCtxRef.current?.close();
    } catch (_) {}
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

    console.log("[DEBUG] Recording finished", { durationSeconds, transcriptLength: transcript.length, transcript: transcript.slice(0, 100) });

    // Stop speech recognition and auto-restart
    try {(recognitionRef.current as any)?._stopAutoRestart?.();} catch (_) {}
    try {recognitionRef.current?.stop();} catch (_) {}

    if (!transcript || transcript.length < 5) {
      console.warn("[DEBUG] Transcript too short, aborting analysis");
      setMicError("Could not detect speech. Please speak clearly and try again. Make sure your browser supports speech recognition.");
      setPhase("idle");
      isAnalyzingRef.current = false;
      return;
    }

    setPhase("analyzing");
    console.log("[DEBUG] Sending transcript to edge function for analysis...", { wordCount: transcript.split(/\s+/).length });

    try {
      const { data, error } = await supabase.functions.invoke("analyze-voice", {
        body: {
          transcript,
          audioMetrics: {
            averageVolume: avgVol,
            silenceRatio: silRatio,
            volumeVariance: volVar,
            totalFrames: framesRef.current,
            durationSeconds
          }
        }
      });

      console.log("[DEBUG] Edge function response received", { hasError: !!error, hasData: !!data });

      if (error) {
        console.error("[DEBUG] AI analysis error:", error);

        let errorMessage = "AI analysis failed. Please try again.";
        const responseContext = (error as any)?.context;
        if (responseContext && typeof responseContext.text === "function") {
          const responseText = await responseContext.text();
          try {
            const parsed = JSON.parse(responseText);
            if (parsed?.error) errorMessage = parsed.error;
          } catch {
            if (responseText?.trim()) errorMessage = responseText;
          }
        }

        if ((error as any)?.message?.includes("402")) {
          errorMessage = "AI credits are exhausted. Please add credits in workspace settings.";
        }

        setMicError(errorMessage);
        setPhase("idle");
        return;
      }

      if (data?.error) {
        console.warn("[DEBUG] Analysis returned error in data:", data.error);
        setMicError(data.error);
        setPhase("idle");
        return;
      }

      console.log("[DEBUG] Analysis successful, scores:", data?.scores);
      const { scores, analysis, tags, communicationTips, techniques, fillerWords, hedgingInstances, powerWords, wordChoiceScore, persuasionScore } = data;

      // Compute final measured pace from raw audio data
      const finalWpm = durationSeconds > 0 ? transcript.trim().split(/\s+/).filter(Boolean).length / durationSeconds * 60 : 0;
      const measuredPace = Math.min(100, Math.round(finalWpm / 160 * 100));

      setMetrics({
        pace: scores.pace, conf: scores.confidence, clar: scores.clarity,
        delivery: scores.delivery || scores.overall, overall: scores.overall,
        measuredPace, wpm: Math.round(finalWpm),
        wordChoice: wordChoiceScore || 0, persuasion: persuasionScore || 0
      });
      setFeedback({
        overallTxt: analysis.overall,
        paceTxt: analysis.pace,
        toneTxt: analysis.tone,
        deliveryTxt: analysis.delivery || "",
        strengthTxt: analysis.strength,
        weaknessTxt: analysis.weakness || "",
        recTxt: analysis.recommendation,
        clarityTxt: analysis.clarity || "",
        tags: (tags || []).map((t: any) => ({ label: t.label, t: t.type })),
        transcript,
        techniques: techniques || [],
        fillerWords: fillerWords || { count: 0, words: [], percentage: 0 },
        hedgingInstances: hedgingInstances || [],
        powerWords: powerWords || []
      });
      setRecCommTips(communicationTips || []);

      // Save session to database
      const sessionRow = {
        user_id: user?.id,
        overall_score: scores.overall,
        pace_score: scores.pace,
        confidence_score: scores.confidence,
        clarity_score: scores.clarity,
        transcript,
        feedback: { analysis, tags, scenario_category: localStorage.getItem("syntera_active_scenario_category") || null },
        negotiation_tips: [],
        communication_tips: communicationTips || [],
        duration_seconds: durationSeconds
      };
      const { data: inserted } = await (supabase as any).
      from("voice_sessions").
      insert(sessionRow).
      select().
      single();

      if (inserted) {
        setHistory((h: any) => [inserted, ...h.slice(0, 19)]);
      }
      setPhase("done");
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setMicError("Analysis failed. Please try again.");
      setPhase("idle");
    } finally {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      isAnalyzingRef.current = false;
    }
  }, [user?.id]);

  const scheduleAnalyze = useCallback(() => {
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    analysisTimeoutRef.current = setTimeout(() => {
      void analyzeVoice();
    }, 1500);
  }, [analyzeVoice]);

  const todaySessionCount = useMemo(() => {
    const todayStr = new Date().toLocaleDateString();
    return history.filter((s) => s.created_at && new Date(s.created_at).toLocaleDateString() === todayStr).length;
  }, [history]);

  const startRecording = useCallback(async () => {
    // Free tier: 1 recording per day
    if (!isPremium && todaySessionCount >= 1) {
      setShowPricing(true);
      return;
    }
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

      // Start Web Speech API recognition with enhanced settings
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
              // Pick the highest confidence alternative
              let bestAlt = event.results[i][0];
              for (let j = 1; j < event.results[i].length; j++) {
                if (event.results[i][j].confidence > bestAlt.confidence) {
                  bestAlt = event.results[i][j];
                }
              }
              finalTranscript += bestAlt.transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          transcriptRef.current = finalTranscript + interim;
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e.error);
          // Auto-restart on recoverable errors
          if (isRecognitionActive && (e.error === "network" || e.error === "aborted" || e.error === "no-speech")) {
            try {
              setTimeout(() => {
                if (isRecognitionActive) recognition.start();
              }, 300);
            } catch (_) {}
          }
        };

        // Auto-restart when recognition ends unexpectedly during recording
        recognition.onend = () => {
          if (isRecognitionActive) {
            try {
              setTimeout(() => {
                if (isRecognitionActive) recognition.start();
              }, 200);
            } catch (_) {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        // Attach a cleanup flag so we can stop auto-restart
        (recognitionRef.current as any)._stopAutoRestart = () => {isRecognitionActive = false;};
      }

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.start();
      setPhase("recording");
      setTimeLeft(selectedDuration);
      setMetrics(null);
      setFeedback(null);

      const animate = () => {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        setWaveData(Array.from({ length: 80 }, (_, i) => data[Math.floor(i / 80 * data.length)] / 255));
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        const avg = sum / data.length;
        volumeRef.current.push(avg);
        if (avg < 3) silenceRef.current++;
        framesRef.current++;

        // Real-time energy: rolling average of last 30 frames, normalized to 0-100
        const recent = volumeRef.current.slice(-30);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        setLiveEnergy(Math.min(100, Math.round(recentAvg * 3.5)));

        // Real-time pace: words per minute from transcript / elapsed time
        const elapsedSec = (Date.now() - recordingStartRef.current) / 1000;
        const wordCount = transcriptRef.current.trim().split(/\s+/).filter(Boolean).length;
        const wpm = elapsedSec > 1 ? wordCount / elapsedSec * 60 : 0;
        // Map WPM to 0-100: 0wpm=0, 130wpm=75 (ideal ~130-160), 200+=100, <80=low
        const paceScore = Math.min(100, Math.round(wpm / 160 * 100));
        setLivePace(paceScore);

        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      let t = selectedDuration;
      timerRef.current = setInterval(() => {
        t--;
        setTimeLeft(t);
        if (t <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          mr.stop();
          try {stream.getTracks().forEach((tr) => tr.stop());} catch (_) {}
          try {audioCtx.close();} catch (_) {}
          try {(recognitionRef.current as any)?._stopAutoRestart?.();} catch (_) {}
          try {recognitionRef.current?.stop();} catch (_) {}
          setWaveData(new Array(80).fill(0.5));
          // Small delay for final speech recognition results
          scheduleAnalyze();
        }
      }, 1000);
    } catch (e: any) {
      setMicError(e?.message || "Microphone access denied. Please allow mic access in your browser and try again.");
    }
  }, [scheduleAnalyze, selectedDuration, isPremium, todaySessionCount]);

  const reset = useCallback(() => {
    stopAll();
    try {(recognitionRef.current as any)?._stopAutoRestart?.();} catch (_) {}
    try {recognitionRef.current?.stop();} catch (_) {}
    transcriptRef.current = "";
    setPhase("idle");
    setTimeLeft(selectedDuration);
    setMetrics(null);
    setFeedback(null);
    setWaveData(new Array(80).fill(0.5));
    setMicError("");
  }, [stopAll, selectedDuration]);

  const tagColor = (t) => t === "pos" ? "#4a8c5c" : t === "warn" ? "#c97a2a" : "#c04a2a";
  const avgHistory = history.length ? Math.round(history.reduce((a, b) => a + (b.overall_score ?? b.overall ?? 0), 0) / history.length) : null;
  const gap = spacingMode === "compact" ? 28 : 48;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        paddingBottom: 80
      }}>
      
      {quizVisible &&
      <OnboardingQuiz
        onFinish={({ neg, comm, answers }) => {
          localStorage.setItem("negotium_quiz", JSON.stringify({ answers }));
          const p = derivePersonalization(answers);
          setRecCommTips([...new Set([...(neg || []), ...(comm || [])].slice(0, 6))]);
          setUserSubtitle(p.subtitle);
          setHeroFocus(p.heroFocus);
          setQuizVisible(false);
          // Show intro if not seen yet
          if (!localStorage.getItem("syntera_intro_done")) {
            setShowIntro(true);
          }
        }} />
      }

      {!quizVisible && showIntro && !isPremium &&
        <IntroExperience
          onComplete={() => {
            localStorage.setItem("syntera_intro_done", "true");
            setShowIntro(false);
          }}
          onForcePaywall={() => {
            setShowForcedPaywall(true);
          }}
        />
      }

      {showForcedPaywall && !isPremium &&
        <ForcedPaywall
          onSubscribe={() => {
            localStorage.setItem("syntera_premium", "true");
            setIsPremium(true);
            setShowForcedPaywall(false);
            localStorage.setItem("syntera_intro_done", "true");
            setShowIntro(false);
          }}
          onSkip={() => {
            setShowForcedPaywall(false);
            localStorage.setItem("syntera_intro_done", "true");
            setShowIntro(false);
          }}
        />
      }

      <AppDrawer
        theme={theme}
        setTheme={setTheme}
        spacingMode={spacingMode}
        setSpacingMode={setSpacingMode}
        onOpenSetup={() => setQuizVisible(true)} />
      

      {/* Header */}
      <div
        style={{
          padding: "24px 28px 24px 60px",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: c.panel
        }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: c.text, letterSpacing: "0.05em" }}>SYNTERA</div>
          <div style={{ fontSize: 11, color: c.muted, letterSpacing: "0.14em" }}>{userSubtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {avgHistory !== null &&
          <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: c.muted, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Avg Score
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.text }}>{avgHistory}</div>
            </div>
          }
        </div>
      </div>

      {/* Tip of the Day Popup */}
      {showTipPopup &&
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 55,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 40,
          background: "rgba(0,0,0,0.15)",
          backdropFilter: "blur(2px)",
          animation: "fadeUp 0.35s ease"
        }}
        onClick={() => setShowTipPopup(false)}>
        
          <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(420px, 90vw)",
            background: "#fff",
            borderRadius: 16,
            padding: "28px 24px",
            boxShadow: "0 24px 64px rgba(16,24,40,0.22)",
            animation: "fadeUp 0.4s ease",
            position: "relative"
          }}>
          
            <button
            onClick={() => setShowTipPopup(false)}
            style={{
              position: "absolute", top: 12, right: 14,
              background: "none", border: "none", fontSize: 18,
              color: "#9aa0a6", cursor: "pointer"
            }}>
            ✕</button>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>💡</div>
            <div style={{
            fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase",
            color: "#9aa0a6", textAlign: "center", marginBottom: 8, fontWeight: 700
          }}>
              Tip of the Day
            </div>
            <div style={{
            fontSize: 15, color: "#0b0b0b", lineHeight: 1.7,
            textAlign: "center", fontWeight: 500
          }}>
              {tipText}
            </div>
            <button
            onClick={() => setShowTipPopup(false)}
            style={{
              marginTop: 20, width: "100%", padding: "12px",
              fontSize: 13, fontWeight: 700,
              background: "linear-gradient(90deg, #111827, #1f2937)",
              color: "#fff", border: "none", borderRadius: 10,
              cursor: "pointer"
            }}>
            
              Got it 👍
            </button>
          </div>
        </div>
      }

      <div style={{ maxWidth: 860, margin: "0 auto", padding: `${gap}px 20px` }}>
        {/* ── ANALYSIS TAB ── */}
        {tab === "analysis" &&
        <>

            <div style={{ textAlign: "center", marginBottom: gap + 16, paddingTop: 12 }}>
              <div
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "clamp(1.6rem,5vw,3rem)",
                color: c.text,
                lineHeight: 1.1,
                marginBottom: 0,
                fontWeight: 900,
                letterSpacing: "-0.03em"
              }}>
              
                Speak. <span style={{ color: c.text, opacity: 0.35 }} className="text-black">{heroFocus}</span>
              </div>
              <div style={{ fontSize: 10, letterSpacing: "0.5em", color: c.muted, textTransform: "uppercase", marginTop: 20 }}>PACE · TONE · CONFIDENCE · CLARITY</div>
              <div style={{ fontSize: 11, color: c.muted, marginTop: 14, fontStyle: "italic", letterSpacing: "0.04em", opacity: 0.7 }}>🎙️ Use a microphone for best results</div>
            </div>

            {/* Waveform */}
            <div style={{ marginBottom: gap }}>
              <div
              style={{
                fontSize: 9,
                letterSpacing: "0.25em",
                color: c.muted,
                textTransform: "uppercase",
                marginBottom: 8
              }}>
              
                Live Waveform
              </div>
              <div
              style={{
                height: 80,
                background: c.waveBg,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                gap: 2
              }}>
              
                {waveData.map((v, i) =>
              <div
                key={i}
                style={{
                  flex: 1,
                  background: phase === "recording" ? isDark ? "#ffffff" : "#1a1a1a" : c.waveEmpty,
                  height: `${Math.max(4, Math.abs(v - 0.5) * 160)}px`,
                  borderRadius: 2,
                  transition: "height 0.05s, background 0.3s",
                  opacity: phase === "recording" ? 0.5 + Math.abs(v - 0.5) : 0.5
                }} />

              )}
              </div>
            </div>

            {/* Timer Ring */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: gap }}>
              <div style={{ position: "relative", width: 160, height: 160 }}>
                <svg width={160} height={160} viewBox="0 0 160 160">
                  <circle cx={80} cy={80} r={70} fill="none" stroke={c.border} strokeWidth={6} />
                  <circle
                  cx={80}
                  cy={80}
                  r={70}
                  fill="none"
                  stroke={timeLeft <= 5 ? "#c04a2a" : "#6b7280"}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                    transition: "stroke-dashoffset 0.9s linear, stroke 0.3s"
                  }} />
                
                </svg>
                <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                
                  <div style={{ fontSize: 48, fontWeight: 800, color: c.text, lineHeight: 1 }}>{timeLeft}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.3em", color: c.muted, textTransform: "uppercase" }}>
                    seconds
                  </div>
                  {phase === "recording" &&
                <div
                  style={{
                    marginTop: 6,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#c04a2a",
                    animation: "pulse 1s infinite"
                  }} />

                }
                </div>
              </div>
            </div>

            {phase === "recording" &&
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 24 }}>
              {["Pace", "Energy"].map((label, i) => {
              const val = i === 0 ? livePace : liveEnergy;
              return (
                <div
                  key={label}
                  style={{
                    background: c.card,
                    border: `1px solid ${c.border}`,
                    padding: "10px 12px",
                    borderRadius: 8
                  }}>
                  
                      <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      color: c.muted,
                      textTransform: "uppercase",
                      marginBottom: 6
                    }}>
                    
                        {label}
                      </div>
                      <div style={{ height: 3, background: c.border, borderRadius: 2 }}>
                        <div
                      style={{
                        height: "100%",
                        width: val + "%",
                        background: "#6b7280",
                        borderRadius: 2,
                        transition: "width 0.1s"
                      }} />
                    
                      </div>
                    </div>);

            })}
              </div>
          }

            {phase === "idle" &&
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 20, width: "100%", maxWidth: 280, margin: "0 auto 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 11, color: c.muted }}>
                  <span>5s</span>
                  <span style={{ fontWeight: 700, color: c.text, fontSize: 13 }}>{selectedDuration}s</span>
                  <span>45s</span>
                </div>
                <input
              type="range"
              min={5}
              max={45}
              step={1}
              value={selectedDuration}
              onChange={(e) => {const v = Number(e.target.value);setSelectedDuration(v);setTimeLeft(v);}}
              style={{ width: "100%", accentColor: c.text, cursor: "pointer" }} />
            
              </div>
          }

            <VoiceMicControl onStart={startRecording} onStop={reset} onStopEarly={() => {if (phase !== "recording") return;stopAll();setWaveData(new Array(80).fill(0.5));setPhase("analyzing");scheduleAnalyze();}} phase={phase} />
            {micError &&
          <div style={{ textAlign: "center", fontSize: 11, color: "#c04a2a", marginBottom: 16, lineHeight: 1.6 }}>
                {micError}
              </div>
          }
            {phase === "analyzing" &&
          <div style={{ textAlign: "center", fontSize: 11, color: c.muted, marginBottom: 24 }}>
                ⏳ AI is analyzing your speech patterns and transcript...
              </div>
          }

            {phase === "done" && metrics && feedback &&
          <div style={{ animation: "fadeUp 0.5s ease", marginTop: 16, position: "relative" }}>
                {!isPremium &&
            <PaywallCTA onUpgrade={() => setShowPricing(true)} />
            }
                <div style={!isPremium ? { filter: "blur(8px)", pointerEvents: "none", userSelect: "none" as const } : {}}>
                <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginBottom: 24,
                  background: c.card,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  padding: "20px 10px",
                  boxShadow: "0 6px 24px rgba(16,24,40,0.06)"
                }}>
              
                  <ScoreRing
                  score={metrics.overall}
                  label="Overall"
                  color={metrics.overall >= 80 ? "#4a8c5c" : metrics.overall >= 60 ? "#6b7280" : "#c04a2a"} />
              
                  <ScoreRing score={metrics.delivery} label="Delivery" color="#6b7280" />
                  <ScoreRing score={metrics.pace} label="Pace" color="#6b7280" />
                  <ScoreRing score={metrics.conf} label="Confidence" color="#6b7280" />
                  <ScoreRing score={metrics.clar} label="Clarity" color="#6b7280" />
                </div>

                {/* Delivery Breakdown Scores */}
                <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                  marginBottom: 20,
                  background: c.card,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  padding: "16px",
                  boxShadow: "0 4px 12px rgba(16,24,40,0.04)"
                }}>
              
                  {[
                { label: "Word Choice", value: metrics.wordChoice, color: metrics.wordChoice >= 55 ? "#4a8c5c" : metrics.wordChoice >= 30 ? "#c97a2a" : "#c04a2a" },
                { label: "Persuasion", value: metrics.persuasion, color: metrics.persuasion >= 55 ? "#4a8c5c" : metrics.persuasion >= 30 ? "#c97a2a" : "#c04a2a" }].
                map(({ label, value, color }) =>
                <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 9, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase" }}>{label}</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color }}>{value}</span>
                      </div>
                      <div style={{ height: 6, background: c.border, borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                )}
                </div>

                {/* Measured Pace */}
                <div
                style={{
                  marginBottom: 20,
                  background: c.card,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  padding: "16px",
                  boxShadow: "0 4px 12px rgba(16,24,40,0.04)"
                }}>
              
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase" }}>Measured Pace</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{metrics.wpm} WPM</span>
                  </div>
                  <div style={{ height: 6, background: c.border, borderRadius: 3, marginBottom: 6 }}>
                    <div style={{ height: "100%", width: `${metrics.measuredPace}%`, background: metrics.wpm >= 120 && metrics.wpm <= 160 ? "#4a8c5c" : "#c97a2a", borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: 10, color: c.muted }}>Ideal speaking pace: 130–160 WPM</div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                  {feedback.tags.map((tag, i) =>
                <span
                  key={i}
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    border: `1px solid ${tagColor(tag.t)}`,
                    color: tagColor(tag.t),
                    borderRadius: 4
                  }}>
                
                      {tag.label}
                    </span>
                )}
                </div>

                {feedback.transcript &&
              <div
                style={{
                  marginBottom: 10,
                  background: c.card,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  boxShadow: "0 4px 12px rgba(16,24,40,0.04)"
                }}>
              
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 6 }}>
                      Your Speech (Transcript)
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: c.text, fontStyle: "italic" }}>"{feedback.transcript}"</div>
                  </div>
              }

                {[
              { title: "Overall Assessment", text: feedback.overallTxt },
              { title: "Delivery & Word Choice", text: feedback.deliveryTxt },
              { title: "Pace & Rhythm", text: feedback.paceTxt },
              { title: "Tone & Authority", text: feedback.toneTxt },
              { title: "Clarity & Structure", text: feedback.clarityTxt },
              { title: "💪 Key Strength", text: feedback.strengthTxt },
              { title: "⚠️ Key Weakness", text: feedback.weaknessTxt },
              { title: "🎯 Recommendation", text: feedback.recTxt }].
              filter(({ text }) => text).map(({ title, text }) =>
              <div
                key={title}
                style={{
                  marginBottom: 10,
                  background: c.card,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  boxShadow: "0 4px 12px rgba(16,24,40,0.04)"
                }}>
              
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: c.text }}>{text}</div>
                  </div>
              )}

                {/* Techniques Detected */}
                {feedback.techniques?.length > 0 &&
              <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 8 }}>
                      Techniques Detected ({feedback.techniques.length})
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {feedback.techniques.map((t: any, i: number) =>
                  <div
                    key={i}
                    style={{
                      background: c.card,
                      border: `1px solid ${t.impact === "pos" ? "#4a8c5c" : t.impact === "neg" ? "#c04a2a" : c.border}`,
                      borderRadius: 8,
                      padding: "10px 12px"
                    }}>
                  
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{t.name}</span>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: t.impact === "pos" ? "#e8f5e9" : t.impact === "neg" ? "#fbe9e7" : "#f5f5f5", color: t.impact === "pos" ? "#4a8c5c" : t.impact === "neg" ? "#c04a2a" : "#6b7280" }}>
                              {t.impact === "pos" ? "EFFECTIVE" : t.impact === "neg" ? "NEEDS WORK" : "NEUTRAL"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, fontStyle: "italic", color: "#6b7280", marginBottom: 4 }}>"{t.quote}"</div>
                          <div style={{ fontSize: 11, color: c.text, lineHeight: 1.5 }}>{t.explanation}</div>
                        </div>
                  )}
                    </div>
                  </div>
              }

                {/* Filler Words & Hedging */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {/* Filler Words */}
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 6 }}>Filler Words</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: feedback.fillerWords?.count === 0 ? "#4a8c5c" : feedback.fillerWords?.count <= 3 ? "#c97a2a" : "#c04a2a", marginBottom: 4 }}>
                      {feedback.fillerWords?.count || 0}
                    </div>
                    <div style={{ fontSize: 10, color: c.muted }}>
                      {feedback.fillerWords?.percentage ? `${feedback.fillerWords.percentage.toFixed(1)}% of words` : "Clean speech"}
                    </div>
                    {feedback.fillerWords?.words?.length > 0 &&
                  <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {feedback.fillerWords.words.map((w: string, i: number) =>
                    <span key={i} style={{ fontSize: 9, padding: "2px 6px", background: "#fbe9e7", color: "#c04a2a", borderRadius: 3 }}>{w}</span>
                    )}
                      </div>
                  }
                  </div>

                  {/* Power Words */}
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 6 }}>Power Words Used</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: (feedback.powerWords?.length || 0) >= 1 ? "#4a8c5c" : "#c97a2a", marginBottom: 4 }}>
                      {feedback.powerWords?.length || 0}
                    </div>
                    {feedback.powerWords?.length > 0 &&
                  <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {feedback.powerWords.map((w: string, i: number) =>
                    <span key={i} style={{ fontSize: 9, padding: "2px 6px", background: "#e8f5e9", color: "#4a8c5c", borderRadius: 3 }}>{w}</span>
                    )}
                      </div>
                  }
                  </div>
                </div>

                {/* Hedging Instances */}
                {feedback.hedgingInstances?.length > 0 &&
              <div style={{ marginBottom: 16, background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 8 }}>
                      Hedging Language → Stronger Alternatives
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {feedback.hedgingInstances.map((h: any, i: number) =>
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <span style={{ color: "#c04a2a", textDecoration: "line-through" }}>"{h.phrase}"</span>
                          <span style={{ color: c.muted }}>→</span>
                          <span style={{ color: "#4a8c5c", fontWeight: 600 }}>"{h.suggestion}"</span>
                        </div>
                  )}
                    </div>
                  </div>
              }

                {[
              { label: "Recommended Communication Tips", tips: recCommTips }].
              map(({ label, tips }) =>
              <div key={label} style={{ marginTop: 16 }}>
                    <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.25em",
                    color: c.muted,
                    textTransform: "uppercase",
                    marginBottom: 8
                  }}>
                
                      {label}
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {tips.map((t, i) =>
                  <div
                    key={i}
                    style={{
                      background: c.card,
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 12,
                      color: c.text,
                      lineHeight: 1.6
                    }}>
                  
                          💬 {t}
                        </div>
                  )}
                    </div>
                  </div>
              )}
              </div>{/* end blur wrapper */}
              </div>
          }
          {showPricing &&
          <PricingModal
            onClose={() => setShowPricing(false)}
            onSubscribe={() => {
              localStorage.setItem("syntera_premium", "true");
              setIsPremium(true);
              setShowPricing(false);
            }} />

          }
          </>
        }


      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
      `}</style>
    </div>);

}