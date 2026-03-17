import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PaywallCTA, PricingModal } from "@/components/paywall/PaywallOverlay";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { SCENARIO_CATEGORIES, getTodayScenario, diffColor } from "@/data/scenarios";
import { useNavigate } from "react-router-dom";
import IntroExperience from "@/components/onboarding/IntroExperience";
import ForcedPaywall from "@/components/onboarding/ForcedPaywall";
import { Footer } from "@/components/ui/footer";

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

function HistoryRow({ entry, index }) {
  const score = entry.overall_score ?? entry.overall;
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D";
  const date = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString([], { month: "short", day: "numeric" })
    : "";
  return (
    <div style={{
      padding: "12px 0", borderBottom: "1px solid #e2e2e2",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{ fontSize: 22, fontWeight: 300, minWidth: 20, fontFamily: "'DM Mono', monospace", color: "#0a0a0a" }}>{grade}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>
          Session #{index + 1}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 300, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>{score}</div>
      <div style={{ fontSize: 9, color: "#888", fontFamily: "'DM Mono', monospace" }}>{date}</div>
    </div>
  );
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
{ id: "goal", q: "What do you most want to improve?", options: ["Pace", "Tone/Authority", "Clarity", "Confidence", "Conciseness"] },
{ id: "experience", q: "How often do you practice speaking exercises?", options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"] },
{ id: "audience", q: "Who is your most common audience?", options: ["One person", "Small team", "Large group", "Clients/Customers", "Remote calls"] },
{ id: "nerves", q: "Do you feel nervous when speaking publicly?", options: ["Always", "Often", "Sometimes", "Rarely", "Never"] },
{ id: "filler", q: "Do you use filler words (um/like) often?", options: ["Very often", "Sometimes", "Occasionally", "Rarely", "Never"] },
{ id: "goalType", q: "Which result matters most?", options: ["Close deals", "Appear confident", "Be concise", "Be persuasive", "Improve clarity"] }];

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
  const goalMap: Record<string, string> = {
    "Pace": "Optimized for pace & rhythm mastery",
    "Tone/Authority": "Tuned for tone & authority building",
    "Clarity": "Focused on crystal-clear delivery",
    "Confidence": "Designed to build vocal confidence",
    "Conciseness": "Streamlined for concise impact"
  };
  const subtitle = goalMap[answers.goal] || "Voice Intelligence Platform";
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
    localStorage.setItem("syntera_quiz_completed_at", Date.now().toString());
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,6,23,0.5)", zIndex: 60 }}>
      <div style={{ width: "min(540px, 92vw)", background: "#fff", border: "1px solid #e2e2e2", borderRadius: 0, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0a0a0a", fontFamily: "'Syne', sans-serif" }}>Welcome — Quick Setup</div>
          <div style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono', monospace" }}>{step + 1}/{QUIZ_QUESTIONS.length}</div>
        </div>
        <div style={{ fontSize: 14, color: "#0a0a0a", marginBottom: 12, fontWeight: 500 }}>{q.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {q.options.map((opt) =>
            <button key={opt} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
              style={{
                textAlign: "left", padding: "10px 14px", borderRadius: 0, cursor: "pointer",
                border: answers[q.id] === opt ? "2px solid #0a0a0a" : "1px solid #e2e2e2",
                background: answers[q.id] === opt ? "#f8f8f8" : "#fff",
                fontWeight: answers[q.id] === opt ? 600 : 400, fontSize: 13, color: "#0a0a0a",
                transition: "all .15s", fontFamily: "'DM Mono', monospace",
              }}>
              {opt}
            </button>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}
            style={{ padding: "10px 18px", borderRadius: 0, border: "1px solid #e2e2e2", background: "transparent", cursor: step === 0 ? "not-allowed" : "pointer", color: "#888", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
            Back
          </button>
          {step < QUIZ_QUESTIONS.length - 1 ?
            <button onClick={() => answers[q.id] && setStep((s) => s + 1)} disabled={!answers[q.id]}
              style={{ padding: "10px 22px", borderRadius: 0, border: "none", background: answers[q.id] ? "#0a0a0a" : "#bbb", color: "#fff", cursor: answers[q.id] ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600, opacity: answers[q.id] ? 1 : 0.6, transition: "all 0.2s", fontFamily: "'DM Mono', monospace" }}>
              Next
            </button> :
            <button onClick={() => answers[q.id] && handleFinish()} disabled={!answers[q.id]}
              style={{ padding: "10px 22px", borderRadius: 0, border: "none", background: answers[q.id] ? "#0a0a0a" : "#bbb", color: "#fff", cursor: answers[q.id] ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600, opacity: answers[q.id] ? 1 : 0.6, transition: "all 0.2s", fontFamily: "'DM Mono', monospace" }}>
              Finish & Start
            </button>
          }
        </div>
      </div>
    </div>
  );
}

function VoiceMicControl({ onStart, onStop, onStopEarly, phase }: {onStart: () => void;onStop: () => void;onStopEarly: () => void;phase: string;}) {
  const isRecording = phase === "recording";
  const isAnalyzing = phase === "analyzing";
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
      {isRecording ?
        <button onClick={onStopEarly}
          style={{ fontSize: 11, letterSpacing: "0.14em", padding: "14px 36px", border: "none", cursor: "pointer", background: "#0a0a0a", color: "#fff", fontWeight: 500, borderRadius: 0, transition: "all 0.2s", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
          STOP RECORDING
        </button> :
        <button onClick={!isAnalyzing ? onStart : undefined} disabled={isAnalyzing}
          style={{ fontSize: 11, letterSpacing: "0.14em", padding: "14px 36px", border: "none", cursor: isAnalyzing ? "not-allowed" : "pointer", background: "#0a0a0a", color: "#fff", fontWeight: 500, borderRadius: 0, opacity: isAnalyzing ? 0.6 : 1, transition: "all 0.2s", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
          {phase === "idle" ? "START RECORDING" : phase === "analyzing" ? "ANALYZING..." : "RECORD AGAIN"}
        </button>
      }
      <button onClick={onStop}
        style={{ fontSize: 11, padding: "14px 18px", background: "none", border: "1px solid #e2e2e2", color: "#888", cursor: "pointer", transition: "all 0.2s", borderRadius: 0, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
        Reset
      </button>
    </div>
  );
}

export default function Negotium() {
  const { user, signOut } = useAuth();
  const { sidebarWidth } = useSidebarState();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState("idle");
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [metrics, setMetrics] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      const { data } = await (supabase as any).from("voice_sessions").select("*").order("created_at", { ascending: false }).limit(20);
      if (data) setHistory(data);
    };
    loadHistory();
  }, [user]);

  const navigate = useNavigate();
  const [waveData, setWaveData] = useState(new Array(80).fill(0.5));
  const [micError, setMicError] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("syntera_theme") || "light");
  const [spacingMode, setSpacingMode] = useState("airy");
  const [recCommTips, setRecCommTips] = useState<string[]>([]);
  const [userSubtitle, setUserSubtitle] = useState("Voice Intelligence Platform");
  const [heroFocus, setHeroFocus] = useState("Be Analyzed.");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("syntera_premium") === "true");
  const [showPricing, setShowPricing] = useState(false);
  const [showTipPopup, setShowTipPopup] = useState(false);
  const [tipText, setTipText] = useState("");
  const [showIntro, setShowIntro] = useState(() => localStorage.getItem("syntera_premium") === "true" ? false : !localStorage.getItem("syntera_intro_done_v2"));
  const [showForcedPaywall, setShowForcedPaywall] = useState(false);

  const completedCategoriesToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString();
    const todaySessions = history.filter((s) => {
      if (!s.created_at) return false;
      return new Date(s.created_at).toLocaleDateString() === todayStr;
    });
    const cats: string[] = [];
    todaySessions.forEach((s) => {
      const fb = s.feedback as any;
      if (fb?.scenario_category && !cats.includes(fb.scenario_category)) {
        cats.push(fb.scenario_category);
      }
    });
    return cats;
  }, [history]);

  const [quizVisible, setQuizVisible] = useState(() => {
    if (localStorage.getItem("syntera_premium") === "true") return false;
    try {
      const saved = localStorage.getItem("negotium_quiz_v2");
      if (saved) return false;
    } catch (_) {}
    return false;
  });

  useEffect(() => {
    const quizDone = localStorage.getItem("negotium_quiz_v2");
    const tipShownToday = localStorage.getItem("syntera_tip_shown_date") === new Date().toDateString();
    if (!quizDone || tipShownToday || quizVisible) return;
    const delay = 5000 + Math.random() * 10000;
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
      const saved = localStorage.getItem("negotium_quiz_v2");
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
        body: { transcript, audioMetrics: { averageVolume: avgVol, silenceRatio: silRatio, volumeVariance: volVar, totalFrames: framesRef.current, durationSeconds } }
      });
      if (error) {
        let errorMessage = "AI analysis failed. Please try again.";
        const responseContext = (error as any)?.context;
        if (responseContext && typeof responseContext.text === "function") {
          const responseText = await responseContext.text();
          try { const parsed = JSON.parse(responseText); if (parsed?.error) errorMessage = parsed.error; } catch { if (responseText?.trim()) errorMessage = responseText; }
        }
        if ((error as any)?.message?.includes("402")) errorMessage = "AI credits are exhausted.";
        setMicError(errorMessage);
        setPhase("idle");
        return;
      }
      if (data?.error) { setMicError(data.error); setPhase("idle"); return; }
      const { scores, analysis, tags, communicationTips, techniques, fillerWords, hedgingInstances, powerWords, wordChoiceScore, persuasionScore } = data;
      const finalWpm = durationSeconds > 0 ? transcript.trim().split(/\s+/).filter(Boolean).length / durationSeconds * 60 : 0;
      const measuredPace = finalWpm < 100 ? 20 : finalWpm <= 119 ? 45 : finalWpm <= 139 ? 70 : finalWpm <= 160 ? 100 : finalWpm <= 180 ? 80 : finalWpm <= 200 ? 55 : 30;
      setMetrics({
        pace: scores.pace, conf: scores.confidence, clar: scores.clarity,
        delivery: scores.delivery || scores.overall, overall: scores.overall,
        measuredPace, wpm: Math.round(finalWpm),
        wordChoice: wordChoiceScore || 0, persuasion: persuasionScore || 0
      });
      setFeedback({
        overallTxt: analysis.overall, paceTxt: analysis.pace, toneTxt: analysis.tone,
        deliveryTxt: analysis.delivery || "", strengthTxt: analysis.strength,
        weaknessTxt: analysis.weakness || "", recTxt: analysis.recommendation,
        clarityTxt: analysis.clarity || "",
        tags: (tags || []).map((t: any) => ({ label: t.label, t: t.type })),
        transcript,
        techniques: techniques || [],
        fillerWords: fillerWords || { count: 0, words: [], percentage: 0 },
        hedgingInstances: hedgingInstances || [],
        powerWords: powerWords || []
      });
      setRecCommTips(communicationTips || []);
      const sessionRow = {
        user_id: user?.id, overall_score: scores.overall, pace_score: scores.pace,
        confidence_score: scores.confidence, clarity_score: scores.clarity, transcript,
        feedback: { analysis, tags, scenario_category: localStorage.getItem("syntera_active_scenario_category") || null },
        negotiation_tips: [], communication_tips: communicationTips || [], duration_seconds: durationSeconds
      };
      const { data: inserted } = await (supabase as any).from("voice_sessions").insert(sessionRow).select().single();
      if (inserted) setHistory((h: any) => [inserted, ...h.slice(0, 19)]);
      setPhase("done");
    } catch (err: any) {
      setMicError("Analysis failed. Please try again.");
      setPhase("idle");
    } finally {
      if (analysisTimeoutRef.current) { clearTimeout(analysisTimeoutRef.current); analysisTimeoutRef.current = null; }
      isAnalyzingRef.current = false;
    }
  }, [user?.id]);

  const scheduleAnalyze = useCallback(() => {
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    analysisTimeoutRef.current = setTimeout(() => { void analyzeVoice(); }, 1500);
  }, [analyzeVoice]);

  const todaySessionCount = useMemo(() => {
    const todayStr = new Date().toLocaleDateString();
    return history.filter((s) => s.created_at && new Date(s.created_at).toLocaleDateString() === todayStr).length;
  }, [history]);

  const startRecording = useCallback(async () => {
    if (!isPremium && todaySessionCount >= 1) { setShowPricing(true); return; }
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
        const recent = volumeRef.current.slice(-30);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        setLiveEnergy(Math.min(100, Math.round(recentAvg * 3.5)));
        const elapsedSec = (Date.now() - recordingStartRef.current) / 1000;
        const wordCount = transcriptRef.current.trim().split(/\s+/).filter(Boolean).length;
        const currentWpm = elapsedSec > 1 ? wordCount / elapsedSec * 60 : 0;
        const paceScore = currentWpm < 100 ? 20 : currentWpm <= 119 ? 45 : currentWpm <= 139 ? 70 : currentWpm <= 160 ? 100 : currentWpm <= 180 ? 80 : currentWpm <= 200 ? 55 : 30;
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
          try { stream.getTracks().forEach((tr) => tr.stop()); } catch (_) {}
          try { audioCtx.close(); } catch (_) {}
          try { (recognitionRef.current as any)?._stopAutoRestart?.(); } catch (_) {}
          try { recognitionRef.current?.stop(); } catch (_) {}
          setWaveData(new Array(80).fill(0.5));
          scheduleAnalyze();
        }
      }, 1000);
    } catch (e: any) {
      setMicError(e?.message || "Microphone access denied.");
    }
  }, [scheduleAnalyze, selectedDuration, isPremium, todaySessionCount]);

  const reset = useCallback(() => {
    stopAll();
    try { (recognitionRef.current as any)?._stopAutoRestart?.(); } catch (_) {}
    try { recognitionRef.current?.stop(); } catch (_) {}
    transcriptRef.current = "";
    setPhase("idle");
    setTimeLeft(selectedDuration);
    setMetrics(null);
    setFeedback(null);
    setWaveData(new Array(80).fill(0.5));
    setMicError("");
  }, [stopAll, selectedDuration]);

  const tagColor = (t) => t === "pos" ? "#0a0a0a" : t === "warn" ? "#555" : "#888";
  const avgHistory = history.length ? Math.round(history.reduce((a, b) => a + (b.overall_score ?? b.overall ?? 0), 0) / history.length) : null;

  const isOverlay = showIntro || showForcedPaywall || quizVisible;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>
      {/* Intro */}
      {showIntro && !isPremium &&
        <IntroExperience
          onComplete={() => { localStorage.setItem("syntera_intro_done_v2", "true"); setShowIntro(false); if (!localStorage.getItem("negotium_quiz_v2")) setQuizVisible(true); }}
          onForcePaywall={() => setShowForcedPaywall(true)} />
      }
      {showForcedPaywall && !isPremium &&
        <ForcedPaywall
          onSubscribe={() => { localStorage.setItem("syntera_premium", "true"); setIsPremium(true); setShowForcedPaywall(false); localStorage.setItem("syntera_intro_done_v2", "true"); setShowIntro(false); if (!localStorage.getItem("negotium_quiz_v2")) setQuizVisible(true); }}
          onSkip={() => { setShowForcedPaywall(false); localStorage.setItem("syntera_intro_done_v2", "true"); setShowIntro(false); if (!localStorage.getItem("negotium_quiz_v2")) setQuizVisible(true); }} />
      }
      {!showIntro && !showForcedPaywall && quizVisible &&
        <OnboardingQuiz onFinish={({ neg, comm, answers }) => { localStorage.setItem("negotium_quiz_v2", JSON.stringify({ answers })); const p = derivePersonalization(answers); setRecCommTips([...new Set([...(neg || []), ...(comm || [])].slice(0, 6))]); setUserSubtitle(p.subtitle); setHeroFocus(p.heroFocus); setQuizVisible(false); }} />
      }

      {/* Tip Popup */}
      {showTipPopup &&
        <div style={{ position: "fixed", inset: 0, zIndex: 55, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 40, background: "rgba(0,0,0,0.15)" }} onClick={() => setShowTipPopup(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(420px, 90vw)", background: "#fff", borderRadius: 0, padding: "28px 24px", border: "1px solid #e2e2e2", position: "relative" }}>
            <button onClick={() => setShowTipPopup(false)} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 18, color: "#888", cursor: "pointer" }}>✕</button>
            <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", textAlign: "center", marginBottom: 8, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>Tip of the Day</div>
            <div style={{ fontSize: 15, color: "#0a0a0a", lineHeight: 1.7, textAlign: "center", fontWeight: 500 }}>{tipText}</div>
            <button onClick={() => setShowTipPopup(false)} style={{ marginTop: 20, width: "100%", padding: "12px", fontSize: 13, fontWeight: 700, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 0, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
              Got it
            </button>
          </div>
        </div>
      }

      {!isOverlay && (
        <>
          <AppSidebar userSubtitle={userSubtitle} onOpenSetup={() => setQuizVisible(true)} />
          <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            {/* Top bar */}
            <div style={{ padding: "20px 48px", borderBottom: "1px solid #e2e2e2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ width: 1 }} />
              {avgHistory !== null && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#888", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Avg Score</div>
                  <div style={{ fontSize: 28, fontWeight: 300, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>{avgHistory}</div>
                </div>
              )}
            </div>

            {/* Two-column layout */}
            {(
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 400px", gap: 40, padding: isMobile ? "24px 16px" : "40px 48px" }}>
                {/* Left column — recording */}
                <div>
                  {/* Hero */}
                  <div style={{ marginBottom: 48 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#0a0a0a", lineHeight: 0.9, fontWeight: 400, letterSpacing: "-0.04em" }}>
                      Speak.
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#0a0a0a", lineHeight: 0.9, fontWeight: 400, letterSpacing: "-0.04em", opacity: 0.45 }}>
                     {heroFocus}
                    </div>
                  </div>

                  {/* Waveform */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ height: 64, background: "#f0f0f0", border: "1px solid #e2e2e2", borderRadius: 0, display: "flex", alignItems: "center", padding: "0 8px", gap: 2 }}>
                      {waveData.map((v, i) =>
                        <div key={i} style={{
                          flex: 1,
                          background: phase === "recording" ? "#0a0a0a" : "#d8d8d8",
                          height: `${Math.max(4, Math.abs(v - 0.5) * 128)}px`,
                          borderRadius: 0,
                          transition: "height 0.05s, background 0.2s",
                          opacity: phase === "recording" ? 0.5 + Math.abs(v - 0.5) : 0.5
                        }} />
                      )}
                    </div>
                  </div>

                  {/* Timer Ring */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
                    <div style={{ position: "relative", width: 140, height: 140 }}>
                      <svg width={140} height={140} viewBox="0 0 160 160">
                        <circle cx={80} cy={80} r={70} fill="none" stroke="#e2e2e2" strokeWidth={1} />
                        <circle cx={80} cy={80} r={70} fill="none" stroke="#0a0a0a" strokeWidth={1}
                          strokeLinecap="square" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={ringOffset}
                          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.9s linear" }} />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: 48, fontWeight: 300, color: "#0a0a0a", lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{timeLeft}</div>
                        <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#888", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>seconds</div>
                        {phase === "recording" && <div style={{ marginTop: 6, width: 8, height: 8, borderRadius: 0, background: "#0a0a0a", animation: "pulse 1s infinite" }} />}
                      </div>
                    </div>
                  </div>

                  {/* Duration slider */}
                  {phase === "idle" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 20, width: "100%", maxWidth: 280, margin: "0 auto 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 11, color: "#888", fontFamily: "'DM Mono', monospace" }}>
                        <span>5s</span>
                        <span style={{ fontWeight: 500, color: "#0a0a0a", fontSize: 13 }}>{selectedDuration}s</span>
                        <span>45s</span>
                      </div>
                      <input type="range" min={5} max={45} step={1} value={selectedDuration}
                        onChange={(e) => { const v = Number(e.target.value); setSelectedDuration(v); setTimeLeft(v); }}
                        style={{ width: "100%", cursor: "pointer" }} />
                    </div>
                  )}

                  {/* Live metrics */}
                  {phase === "recording" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 24 }}>
                      {["Pace", "Energy"].map((label, i) => {
                        const val = i === 0 ? livePace : liveEnergy;
                        return (
                          <div key={label} style={{ border: "1px solid #e2e2e2", padding: "10px 12px", borderRadius: 0, background: "#fff" }}>
                            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>{label}</div>
                            <div style={{ height: 1, background: "#e2e2e2" }}>
                              <div style={{ height: "100%", width: val + "%", background: "#0a0a0a", transition: "width 0.1s" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <VoiceMicControl onStart={startRecording} onStop={reset} onStopEarly={() => { if (phase !== "recording") return; stopAll(); setWaveData(new Array(80).fill(0.5)); setPhase("analyzing"); scheduleAnalyze(); }} phase={phase} />

                  {micError && <div style={{ textAlign: "center", fontSize: 11, color: "#0a0a0a", marginBottom: 16, lineHeight: 1.6 }}>{micError}</div>}
                  {phase === "analyzing" && <div style={{ textAlign: "center", fontSize: 11, color: "#888", marginBottom: 24, fontFamily: "'DM Mono', monospace" }}>Analyzing your speech patterns...</div>}
                </div>

                {/* Right column — results / history */}
                <div>
                  {!isMobile && (phase === "idle" || phase === "recording") && (
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>Today's Practice</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {SCENARIO_CATEGORIES.map((cat) => {
                          const todayItem = getTodayScenario(cat);
                          const done = completedCategoriesToday.includes(cat.category);
                          return (
                            <button
                              key={cat.slug}
                              onClick={() => navigate(`/scenarios/${cat.slug}`)}
                              style={{
                                width: "100%",
                                background: done ? "#f5f5f5" : "#fff",
                                border: "1px solid #e2e2e2",
                                borderRadius: 0,
                                padding: "12px 14px",
                                textAlign: "left",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                opacity: done ? 0.6 : 1,
                                fontFamily: "'DM Mono', monospace",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", marginBottom: 4 }}>
                                    {cat.category}
                                    {done && <span style={{ marginLeft: 6, color: "#555" }}>[DONE]</span>}
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0a0a0a", fontFamily: "'Syne', sans-serif" }}>
                                    {todayItem.title}
                                  </div>
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 500, color: diffColor(todayItem.difficulty), letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                  {todayItem.difficulty}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {/* Custom Practice Card */}
                      <button
                        onClick={() => navigate("/custom-practice")}
                        style={{
                          marginTop: 12, padding: "14px 20px", background: "#fff", border: "1px solid #e2e2e2",
                          cursor: "pointer", fontFamily: "'DM Mono', monospace", textAlign: "left",
                          transition: "all 0.2s", width: "100%",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget).style.borderColor = "#0a0a0a"; }}
                        onMouseLeave={(e) => { (e.currentTarget).style.borderColor = "#e2e2e2"; }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#0a0a0a", marginBottom: 2 }}>+ Add Custom Practice</div>
                        <div style={{ fontSize: 9, color: "#888", letterSpacing: "0.1em" }}>Choose your own goals</div>
                      </button>
                    </div>
                  )}

                  {phase === "done" && metrics && feedback && (
                    <div style={{ animation: "fadeUp 0.5s ease", position: "relative" }}>
                      {!isPremium && <PaywallCTA onUpgrade={() => setShowPricing(true)} />}
                      <div style={!isPremium ? { filter: "blur(8px)", pointerEvents: "none", userSelect: "none" } : {}}>
                        {/* Score rings */}
                        <div style={{ display: "flex", justifyContent: "space-around", paddingBottom: 20, borderBottom: "1px solid #e2e2e2", marginBottom: 20 }}>
                          <ScoreRing score={metrics.overall} label="Overall" color={metrics.overall >= 80 ? "#0a0a0a" : metrics.overall >= 60 ? "#555" : "#888"} />
                          <ScoreRing score={metrics.delivery} label="Delivery" color="#555" />
                          <ScoreRing score={metrics.pace} label="Pace" color="#555" />
                          <ScoreRing score={metrics.conf} label="Confidence" color="#555" />
                          <ScoreRing score={metrics.clar} label="Clarity" color="#555" />
                        </div>

                        {/* Delivery Breakdown */}
                        <div style={{ paddingBottom: 20, borderBottom: "1px solid #e2e2e2", marginBottom: 20 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                            {[
                              { label: "Word Choice", value: metrics.wordChoice, color: metrics.wordChoice >= 55 ? "#0a0a0a" : metrics.wordChoice >= 30 ? "#555" : "#888" },
                              { label: "Persuasion", value: metrics.persuasion, color: metrics.persuasion >= 55 ? "#0a0a0a" : metrics.persuasion >= 30 ? "#555" : "#888" }
                            ].map(({ label, value, color }) =>
                              <div key={label}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                                  <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</span>
                                  <span style={{ fontSize: 18, fontWeight: 300, color, fontFamily: "'DM Mono', monospace" }}>{value}</span>
                                </div>
                                <div style={{ height: 4, background: "#e2e2e2", borderRadius: 0 }}>
                                  <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 0, transition: "width 0.5s ease" }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Measured Pace */}
                        <div style={{ paddingBottom: 20, borderBottom: "1px solid #e2e2e2", marginBottom: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                            <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Measured Pace</span>
                            <span style={{ fontSize: 14, fontWeight: 500, color: "#0a0a0a", fontFamily: "'DM Mono', monospace" }}>{metrics.wpm} WPM</span>
                          </div>
                          <div style={{ height: 4, background: "#e2e2e2", borderRadius: 0, marginBottom: 6 }}>
                            <div style={{ height: "100%", width: `${metrics.measuredPace}%`, background: metrics.wpm >= 120 && metrics.wpm <= 160 ? "#0a0a0a" : "#555", borderRadius: 0, transition: "width 0.5s ease" }} />
                          </div>
                          <div style={{ fontSize: 10, color: "#888", fontFamily: "'DM Mono', monospace" }}>Ideal: 130–160 WPM</div>
                        </div>

                        {/* Tags */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 20, borderBottom: "1px solid #e2e2e2", marginBottom: 20 }}>
                          {feedback.tags.map((tag, i) =>
                            <span key={i} style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", padding: "4px 10px", border: `1px solid ${tagColor(tag.t)}`, color: tagColor(tag.t), borderRadius: 0, fontFamily: "'DM Mono', monospace" }}>
                              {tag.label}
                            </span>
                          )}
                        </div>

                        {/* Transcript */}
                        {feedback.transcript && (
                          <div style={{ paddingBottom: 20, borderBottom: "1px solid #e2e2e2", marginBottom: 20 }}>
                            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Your Speech</div>
                            <div style={{ fontSize: 13, lineHeight: 1.8, color: "#0a0a0a", fontStyle: "italic" }}>"{feedback.transcript}"</div>
                          </div>
                        )}

                        {/* Feedback sections */}
                        {[
                          { title: "Overall Assessment", text: feedback.overallTxt },
                          { title: "Delivery & Word Choice", text: feedback.deliveryTxt },
                          { title: "Pace & Rhythm", text: feedback.paceTxt },
                          { title: "Tone & Authority", text: feedback.toneTxt },
                          { title: "Clarity & Structure", text: feedback.clarityTxt },
                          { title: "Key Strength", text: feedback.strengthTxt },
                          { title: "Key Weakness", text: feedback.weaknessTxt },
                          { title: "Recommendation", text: feedback.recTxt }
                        ].filter(({ text }) => text).map(({ title, text }) =>
                          <div key={title} style={{ paddingBottom: 20, borderBottom: "1px solid #e2e2e2", marginBottom: 20 }}>
                            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>{title}</div>
                            <div style={{ fontSize: 13, lineHeight: 1.8, color: "#0a0a0a" }}>{text}</div>
                          </div>
                        )}

                        {/* Techniques */}
                        {feedback.techniques?.length > 0 && (
                          <div style={{ paddingBottom: 20, borderBottom: "1px solid #e2e2e2", marginBottom: 20 }}>
                            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                              Techniques Detected ({feedback.techniques.length})
                            </div>
                            <div style={{ display: "grid", gap: 8 }}>
                              {feedback.techniques.map((t: any, i: number) =>
                                <div key={i} style={{ border: `1px solid ${t.impact === "pos" ? "#0a0a0a" : t.impact === "neg" ? "#888" : "#e2e2e2"}`, borderRadius: 0, padding: "10px 12px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0a0a0a" }}>{t.name}</span>
                                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 0, background: t.impact === "pos" ? "#0a0a0a" : t.impact === "neg" ? "#f0f0f0" : "#f5f5f5", color: t.impact === "pos" ? "#fff" : t.impact === "neg" ? "#0a0a0a" : "#888", fontFamily: "'DM Mono', monospace" }}>
                                      {t.impact === "pos" ? "EFFECTIVE" : t.impact === "neg" ? "NEEDS WORK" : "NEUTRAL"}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 12, fontStyle: "italic", color: "#888", marginBottom: 4 }}>"{t.quote}"</div>
                                  <div style={{ fontSize: 11, color: "#0a0a0a", lineHeight: 1.5 }}>{t.explanation}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Filler & Power Words */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingBottom: 20, borderBottom: "1px solid #e2e2e2", marginBottom: 20 }}>
                          <div>
                            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Filler Words</div>
                            <div style={{ fontSize: 28, fontWeight: 300, color: "#0a0a0a", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{feedback.fillerWords?.count || 0}</div>
                            <div style={{ fontSize: 10, color: "#888", fontFamily: "'DM Mono', monospace" }}>{feedback.fillerWords?.percentage ? `${feedback.fillerWords.percentage.toFixed(1)}% of words` : "Clean speech"}</div>
                            {feedback.fillerWords?.words?.length > 0 && (
                              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {feedback.fillerWords.words.map((w: string, i: number) =>
                                  <span key={i} style={{ fontSize: 9, padding: "2px 6px", background: "#f0f0f0", color: "#0a0a0a", borderRadius: 0, fontFamily: "'DM Mono', monospace" }}>{w}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Power Words</div>
                            <div style={{ fontSize: 28, fontWeight: 300, color: "#0a0a0a", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{feedback.powerWords?.length || 0}</div>
                            {feedback.powerWords?.length > 0 && (
                              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {feedback.powerWords.map((w: string, i: number) =>
                                  <span key={i} style={{ fontSize: 9, padding: "2px 6px", background: "#0a0a0a", color: "#fff", borderRadius: 0, fontFamily: "'DM Mono', monospace" }}>{w}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hedging */}
                        {feedback.hedgingInstances?.length > 0 && (
                          <div style={{ paddingBottom: 20, borderBottom: "1px solid #e2e2e2", marginBottom: 20 }}>
                            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                              Hedging → Stronger Alternatives
                            </div>
                            <div style={{ display: "grid", gap: 6 }}>
                              {feedback.hedgingInstances.map((h: any, i: number) =>
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                                  <span style={{ color: "#888", textDecoration: "line-through" }}>"{h.phrase}"</span>
                                  <span style={{ color: "#bbb" }}>→</span>
                                  <span style={{ color: "#0a0a0a", fontWeight: 600 }}>"{h.suggestion}"</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Communication Tips */}
                        {recCommTips.length > 0 && (
                          <div>
                            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                              Recommended Tips
                            </div>
                            <div style={{ display: "grid", gap: 8 }}>
                              {recCommTips.map((t, i) =>
                                <div key={i} style={{ border: "1px solid #e2e2e2", borderRadius: 0, padding: "10px 12px", fontSize: 12, color: "#0a0a0a", lineHeight: 1.6 }}>
                                  {t}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} onSubscribe={() => { localStorage.setItem("syntera_premium", "true"); setIsPremium(true); setShowPricing(false); }} />}

      <Footer />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
