import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Mic, MicOff } from "lucide-react";
import { AILoader } from "@/components/ui/ai-loader";
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
import SpeakBetterInterstitial from "@/components/onboarding/SpeakBetterInterstitial";
import { Footer } from "@/components/ui/footer";
import MobileQuizAndInstall from "@/components/onboarding/MobileQuizAndInstall";

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
    <div className="score-ring">
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" strokeWidth={4} style={{ stroke: 'var(--pg-border-soft)' }} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="square" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }} />
        <text x={36} y={40} textAnchor="middle" fontSize={16}
          fontFamily="'Bebas Neue', sans-serif" fontWeight="400" letterSpacing="0.04em" style={{ fill: 'var(--pg-text)' }}>{score}</text>
      </svg>
      <span className="ring-label">{label}</span>
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
  "Record and compare your delivery across sessions.",
];

const QUIZ_QUESTIONS = [
  { id: "goal", q: "What do you most want to improve?", options: ["Pace", "Tone/Authority", "Clarity", "Confidence", "Conciseness"] },
  { id: "experience", q: "How often do you practice speaking exercises?", options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"] },
  { id: "audience", q: "Who is your most common audience?", options: ["One person", "Small team", "Large group", "Clients/Customers", "Remote calls"] },
  { id: "nerves", q: "Do you feel nervous when speaking publicly?", options: ["Always", "Often", "Sometimes", "Rarely", "Never"] },
  { id: "filler", q: "Do you use filler words (um/like) often?", options: ["Very often", "Sometimes", "Occasionally", "Rarely", "Never"] },
  { id: "goalType", q: "Which result matters most?", options: ["Close deals", "Appear confident", "Be concise", "Be persuasive", "Improve clarity"] },
];

function derivePersonalization(answers) {
  const picksComm = [];
  if (answers.goal?.includes("Pace")) picksComm.push(COMMUNICATION_TIPS[6], COMMUNICATION_TIPS[20]);
  if (answers.goal?.includes("Tone")) picksComm.push(COMMUNICATION_TIPS[0], COMMUNICATION_TIPS[21]);
  if (answers.goal?.includes("Clarity")) picksComm.push(COMMUNICATION_TIPS[2], COMMUNICATION_TIPS[22]);
  if (answers.goal?.includes("Confidence")) picksComm.push(COMMUNICATION_TIPS[5], COMMUNICATION_TIPS[28]);
  if (answers.goal?.includes("Conciseness")) picksComm.push(COMMUNICATION_TIPS[12], COMMUNICATION_TIPS[31]);
  if (answers.filler?.includes("Very") || answers.filler?.includes("Sometimes")) picksComm.push(COMMUNICATION_TIPS[16]);
  if (answers.nerves?.includes("Always") || answers.nerves?.includes("Often")) picksComm.push(COMMUNICATION_TIPS[10]);
  for (let i = 0; picksComm.length < 6; i++) picksComm.push(COMMUNICATION_TIPS[i % COMMUNICATION_TIPS.length]);
  const goalMap = {
    "Pace": "Optimized for pace & rhythm mastery",
    "Tone/Authority": "Tuned for tone & authority building",
    "Clarity": "Focused on crystal-clear delivery",
    "Confidence": "Designed to build vocal confidence",
    "Conciseness": "Streamlined for concise impact",
  };
  const subtitle = goalMap[answers.goal] || "Voice Intelligence Platform";
  const focusMap = {
    "Close deals": "Close Deals.",
    "Appear confident": "Command the Room.",
    "Be concise": "Say More with Less.",
    "Be persuasive": "Persuade with Precision.",
    "Improve clarity": "Speak with Clarity.",
  };
  const heroFocus = focusMap[answers.goalType] || "Be Analyzed.";
  return { neg: [], comm: picksComm.slice(0, 6), subtitle, heroFocus };
}

function OnboardingQuiz({ onFinish }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = QUIZ_QUESTIONS[step];
  const handleFinish = () => {
    const { neg, comm } = derivePersonalization(answers);
    onFinish({ neg, comm, answers });
    localStorage.setItem("syntera_quiz_completed_at", Date.now().toString());
  };
  return (
    <div className="quiz-overlay">
      <div className="quiz-modal">
        <div className="quiz-header">
          <div className="quiz-title">Welcome — Quick Setup</div>
          <div className="quiz-step">{step + 1}/{QUIZ_QUESTIONS.length}</div>
        </div>
        <div className="quiz-question">{q.q}</div>
        <div className="quiz-options">
          {q.options.map((opt) => (
            <button key={opt} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
              className={`quiz-option${answers[q.id] === opt ? " selected" : ""}`}>{opt}</button>
          ))}
        </div>
        <div className="quiz-actions">
          <button onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0} className="quiz-btn-secondary">Back</button>
          {step < QUIZ_QUESTIONS.length - 1
            ? <button onClick={() => answers[q.id] && setStep((s) => s + 1)} disabled={!answers[q.id]} className="quiz-btn-primary">Next</button>
            : <button onClick={() => answers[q.id] && handleFinish()} disabled={!answers[q.id]} className="quiz-btn-primary">Finish & Start</button>
          }
        </div>
      </div>
    </div>
  );
}

function VoiceMicControl({ onStart, onStop, onStopEarly, phase }) {
  const isRecording = phase === "recording";
  const isAnalyzing = phase === "analyzing";

  if (isAnalyzing) return null;

  return (
    <div className="mic-controls">
      {isRecording
        ? <button onClick={onStopEarly} className="btn-record-toggle recording" aria-label="Stop recording">
            <span className="stop-square" />
          </button>
        : <button onClick={onStart} className="btn-record-toggle" aria-label="Start recording">
            <Mic size={20} />
          </button>
      }
      <button onClick={onStop} className="btn-reset">Reset</button>
    </div>
  );
}

export default function Negotium() {
  const { user } = useAuth();
  const { sidebarWidth } = useSidebarState();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState("idle");
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [metrics, setMetrics] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase).from("voice_sessions").select("*").order("created_at", { ascending: false }).limit(20);
      if (data) setHistory(data);
    })();
  }, [user]);

  const navigate = useNavigate();
  const [waveData, setWaveData] = useState(new Array(80).fill(0.5));
  const [micError, setMicError] = useState("");
  const [recCommTips, setRecCommTips] = useState([]);
  const [userSubtitle, setUserSubtitle] = useState("Voice Intelligence Platform");
  const [heroFocus, setHeroFocus] = useState("Be Analyzed.");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("syntera_premium") === "true");
  const [showPricing, setShowPricing] = useState(false);
  const [showTipPopup, setShowTipPopup] = useState(false);
  const [tipText, setTipText] = useState("");
  const [showIntro, setShowIntro] = useState(() => localStorage.getItem("syntera_premium") === "true" ? false : !localStorage.getItem("syntera_intro_done_v2"));
  const [showForcedPaywall, setShowForcedPaywall] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [quizVisible, setQuizVisible] = useState(() => {
    if (localStorage.getItem("syntera_premium") === "true") return false;
    try { if (localStorage.getItem("negotium_quiz_v2")) return false; } catch (_) {}
    return false;
  });
  const [livePace, setLivePace] = useState(0);
  const [liveEnergy, setLiveEnergy] = useState(0);

  const completedCategoriesToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString();
    const cats = [];
    history.filter((s) => s.created_at && new Date(s.created_at).toLocaleDateString() === todayStr)
      .forEach((s) => { const fb = s.feedback; if (fb?.scenario_category && !cats.includes(fb.scenario_category)) cats.push(fb.scenario_category); });
    return cats;
  }, [history]);

  useEffect(() => {
    const quizDone = localStorage.getItem("negotium_quiz_v2");
    const tipShownToday = localStorage.getItem("syntera_tip_shown_date") === new Date().toDateString();
    if (!quizDone || tipShownToday || quizVisible) return;
    const delay = 5000 + Math.random() * 10000;
    const timer = setTimeout(() => {
      setTipText(COMMUNICATION_TIPS[Math.floor(Math.random() * COMMUNICATION_TIPS.length)]);
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

  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const analysisTimeoutRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioCtxRef = useRef(null);
  const volumeRef = useRef([]);
  const silenceRef = useRef(0);
  const framesRef = useRef(0);
  const transcriptRef = useRef("");
  const recognitionRef = useRef(null);
  const recordingStartRef = useRef(0);
  const orbCanvasRef = useRef<HTMLCanvasElement>(null);
  const orbTimeRef = useRef(0);
  const orbAnimRef = useRef<number>(0);
  const [practiceTab, setPracticeTab] = useState<"today" | "custom">("today");

  // Canvas orb drawing effect driven by liveEnergy
  useEffect(() => {
    const canvas = orbCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    const isDark = document.documentElement.classList.contains("dark");
    const orbColor = isDark ? "255, 255, 255" : "0, 0, 0";

    const draw = () => {
      if (!ctx || !canvas) return;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 60;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (phase === "recording") {
        orbTimeRef.current += 0.05;
        const vol = liveEnergy / 100; // 0-1

        const numBars = 32;
        const angleStep = (Math.PI * 2) / numBars;

        for (let i = 0; i < numBars; i++) {
          const angle = i * angleStep - Math.PI / 2;
          const wave1 = Math.sin(orbTimeRef.current * (2 + vol * 3) + i * 0.5) * 0.5 + 0.5;
          const wave2 = Math.cos(orbTimeRef.current * (1.5 + vol * 2) + i * 0.3) * 0.5 + 0.5;
          const amplitude = (wave1 * 0.6 + wave2 * 0.4) * (15 + vol * 35);

          const innerRadius = baseRadius;
          const outerRadius = baseRadius + amplitude;

          const x1 = centerX + Math.cos(angle) * innerRadius;
          const y1 = centerY + Math.sin(angle) * innerRadius;
          const x2 = centerX + Math.cos(angle) * outerRadius;
          const y2 = centerY + Math.sin(angle) * outerRadius;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(${orbColor}, ${0.3 + amplitude / 50})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
        gradient.addColorStop(0, `rgba(${orbColor}, ${0.5 + vol * 0.4})`);
        gradient.addColorStop(0.5, `rgba(${orbColor}, ${0.2 + vol * 0.3})`);
        gradient.addColorStop(1, `rgba(${orbColor}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Idle / done state - gentle static orb
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
        gradient.addColorStop(0, `rgba(${orbColor}, 0.6)`);
        gradient.addColorStop(0.5, `rgba(${orbColor}, 0.3)`);
        gradient.addColorStop(1, `rgba(${orbColor}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(${orbColor}, 0.4)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      orbAnimRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (orbAnimRef.current) cancelAnimationFrame(orbAnimRef.current); };
  }, [phase, liveEnergy]);

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
    try { recognitionRef.current?._stopAutoRestart?.(); } catch (_) {}
    try { recognitionRef.current?.stop(); } catch (_) {}
    if (!transcript || transcript.trim().split(/\s+/).filter(Boolean).length < 2) {
      setMicError("We didn't pick up enough speech. Make sure your mic is working and speak clearly.");
      setPhase("idle"); isAnalyzingRef.current = false; return;
    }
    setPhase("analyzing");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-voice", {
        body: { transcript, audioMetrics: { averageVolume: avgVol, silenceRatio: silRatio, volumeVariance: volVar, totalFrames: framesRef.current, durationSeconds } },
      });
      if (error) {
        let errorMessage = "AI analysis failed. Please try again.";
        const responseContext = error?.context;
        if (responseContext && typeof responseContext.text === "function") {
          const responseText = await responseContext.text();
          try { const parsed = JSON.parse(responseText); if (parsed?.error) errorMessage = parsed.error; } catch { if (responseText?.trim()) errorMessage = responseText; }
        }
        if (error?.message?.includes("402")) errorMessage = "AI credits are exhausted.";
        setMicError(errorMessage); setPhase("idle"); return;
      }
      if (data?.error) { setMicError(data.error); setPhase("idle"); return; }
      const { scores, analysis, tags, communicationTips, techniques, fillerWords, hedgingInstances, powerWords, wordChoiceScore, persuasionScore } = data;
      const finalWpm = durationSeconds > 0 ? transcript.trim().split(/\s+/).filter(Boolean).length / durationSeconds * 60 : 0;
      const measuredPace = finalWpm < 100 ? 20 : finalWpm <= 119 ? 45 : finalWpm <= 139 ? 70 : finalWpm <= 160 ? 100 : finalWpm <= 180 ? 80 : finalWpm <= 200 ? 55 : 30;
      setMetrics({ pace: scores.pace, conf: scores.confidence, clar: scores.clarity, delivery: scores.delivery || scores.overall, overall: scores.overall, measuredPace, wpm: Math.round(finalWpm), wordChoice: wordChoiceScore || 0, persuasion: persuasionScore || 0 });
      setFeedback({ overallTxt: analysis.overall, paceTxt: analysis.pace, toneTxt: analysis.tone, deliveryTxt: analysis.delivery || "", strengthTxt: analysis.strength, weaknessTxt: analysis.weakness || "", recTxt: analysis.recommendation, clarityTxt: analysis.clarity || "", tags: (tags || []).map((t) => ({ label: t.label, t: t.type })), transcript, techniques: techniques || [], fillerWords: fillerWords || { count: 0, words: [], percentage: 0 }, hedgingInstances: hedgingInstances || [], powerWords: powerWords || [] });
      setRecCommTips(communicationTips || []);
      const sessionRow = { user_id: user?.id, overall_score: scores.overall, pace_score: scores.pace, confidence_score: scores.confidence, clarity_score: scores.clarity, transcript, feedback: { analysis, tags, scenario_category: localStorage.getItem("syntera_active_scenario_category") || null }, negotiation_tips: [], communication_tips: communicationTips || [], duration_seconds: durationSeconds };
      const { data: inserted } = await (supabase).from("voice_sessions").insert(sessionRow).select().single();
      if (inserted) setHistory((h) => [inserted, ...h.slice(0, 19)]);
      setPhase("done");
    } catch {
      setMicError("Analysis failed. Please try again."); setPhase("idle");
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
    setMicError(""); transcriptRef.current = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = audioCtx; analyserRef.current = analyser;
      volumeRef.current = []; silenceRef.current = 0; framesRef.current = 0; recordingStartRef.current = Date.now();
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US"; recognition.maxAlternatives = 3;
        let finalTranscript = ""; let isRecognitionActive = true; let isRecognitionRunning = false;
        recognition.onresult = (event) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) { let bestAlt = event.results[i][0]; for (let j = 1; j < event.results[i].length; j++) { if (event.results[i][j].confidence > bestAlt.confidence) bestAlt = event.results[i][j]; } finalTranscript += bestAlt.transcript + " "; } else { interim += event.results[i][0].transcript; }
          }
          transcriptRef.current = finalTranscript + interim;
        };
        const safeStart = () => { if (isRecognitionActive && !isRecognitionRunning) { try { isRecognitionRunning = true; recognition.start(); } catch (_) { isRecognitionRunning = false; } } };
        recognition.onerror = (e) => { isRecognitionRunning = false; if (isRecognitionActive && (e.error === "network" || e.error === "aborted" || e.error === "no-speech")) { setTimeout(safeStart, 300); } };
        recognition.onend = () => { isRecognitionRunning = false; if (isRecognitionActive) { setTimeout(safeStart, 200); } };
        safeStart(); recognitionRef.current = recognition;
        recognitionRef.current._stopAutoRestart = () => { isRecognitionActive = false; isRecognitionRunning = false; };
      }
      const mr = new MediaRecorder(stream); mediaRecorderRef.current = mr; mr.start();
      setPhase("recording"); setTimeLeft(selectedDuration); setMetrics(null); setFeedback(null);
      const animate = () => {
        const data = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(data);
        setWaveData(Array.from({ length: 80 }, (_, i) => data[Math.floor(i / 80 * data.length)] / 255));
        let sum = 0; for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128); const avg = sum / data.length;
        volumeRef.current.push(avg); if (avg < 3) silenceRef.current++; framesRef.current++;
        const recent = volumeRef.current.slice(-30); const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        setLiveEnergy(Math.min(100, Math.round(recentAvg * 3.5)));
        const elapsedSec = (Date.now() - recordingStartRef.current) / 1000;
        const wordCount = transcriptRef.current.trim().split(/\s+/).filter(Boolean).length;
        const currentWpm = elapsedSec > 2 ? wordCount / elapsedSec * 60 : 0;
        setLivePace(currentWpm === 0 ? 0 : Math.min(100, Math.round(currentWpm / 1.8)));
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
      let t = selectedDuration;
      timerRef.current = setInterval(() => {
        t--; setTimeLeft(t);
        if (t <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          mr.stop(); try { stream.getTracks().forEach((tr) => tr.stop()); } catch (_) {}
          try { audioCtx.close(); } catch (_) {}
          try { recognitionRef.current?._stopAutoRestart?.(); } catch (_) {}
          try { recognitionRef.current?.stop(); } catch (_) {}
          setWaveData(new Array(80).fill(0.5)); scheduleAnalyze();
        }
      }, 1000);
    } catch (e) { setMicError(e?.message || "Microphone access denied."); }
  }, [scheduleAnalyze, selectedDuration, isPremium, todaySessionCount]);

  const reset = useCallback(() => {
    stopAll();
    try { recognitionRef.current?._stopAutoRestart?.(); } catch (_) {}
    try { recognitionRef.current?.stop(); } catch (_) {}
    transcriptRef.current = ""; setPhase("idle"); setTimeLeft(selectedDuration);
    setMetrics(null); setFeedback(null); setWaveData(new Array(80).fill(0.5)); setMicError("");
  }, [stopAll, selectedDuration]);

  const tagColor = (t) => t === "pos" ? "var(--pg-text)" : t === "warn" ? "var(--pg-faint)" : "var(--pg-muted)";
  const tagBg = (t) => t === "pos" ? "var(--pg-accent)" : t === "warn" ? "var(--pg-surface-alt)" : "var(--pg-bg)";
  const avgHistory = history.length ? Math.round(history.reduce((a, b) => a + (b.overall_score ?? b.overall ?? 0), 0) / history.length) : null;
  const isOverlay = showIntro || showForcedPaywall || showInterstitial || quizVisible;

  const handlePaywallDone = () => { setShowForcedPaywall(false); localStorage.setItem("syntera_intro_done_v2", "true"); setShowIntro(false); setShowInterstitial(true); };
  const handleInterstitialComplete = () => { setShowInterstitial(false); if (!localStorage.getItem("negotium_quiz_v2")) setQuizVisible(true); };

  return (
    <div className="app-root">
      {showIntro && !isPremium && <IntroExperience onComplete={() => { localStorage.setItem("syntera_intro_done_v2", "true"); setShowIntro(false); if (!localStorage.getItem("negotium_quiz_v2")) setQuizVisible(true); }} onForcePaywall={() => setShowForcedPaywall(true)} />}
      {showForcedPaywall && !isPremium && <ForcedPaywall onSubscribe={() => { localStorage.setItem("syntera_premium", "true"); setIsPremium(true); handlePaywallDone(); }} onSkip={handlePaywallDone} />}
      {showInterstitial && <SpeakBetterInterstitial onComplete={handleInterstitialComplete} />}
      {!showIntro && !showForcedPaywall && !showInterstitial && quizVisible && (
        <MobileQuizAndInstall onFinish={(answers) => {
          localStorage.setItem("negotium_quiz_v2", JSON.stringify({ answers }));
          const p = derivePersonalization(answers);
          setRecCommTips([...new Set([...(p.comm || [])].slice(0, 6))]);
          setUserSubtitle(p.subtitle);
          setHeroFocus(p.heroFocus);
          setQuizVisible(false);
        }} />
      )}

      {showTipPopup && (
        <div className="tip-overlay" onClick={() => setShowTipPopup(false)}>
          <div className="tip-modal" onClick={(e) => e.stopPropagation()}>
            <button className="tip-close" onClick={() => setShowTipPopup(false)}>✕</button>
            <div className="tip-eyebrow">Tip of the Day</div>
            <div className="tip-text">{tipText}</div>
            <button className="btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={() => setShowTipPopup(false)}>Got it</button>
          </div>
        </div>
      )}

      {!isOverlay && (
        <>
          <AppSidebar userSubtitle={userSubtitle} onOpenSetup={() => setQuizVisible(true)} />
          <div className="page-shell" style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4,0,0.2,1)" }}>

            <header className="topbar">
              <div />
              {avgHistory !== null && (
                <div className="topbar-avg">
                  <span className="topbar-avg-label">Avg Score</span>
                  <span className="topbar-avg-value">{avgHistory}</span>
                </div>
              )}
            </header>

            <main className="main-single">
              {/* Recording Area */}
              <section className="record-panel">
                <div className="hero-heading">
                  <h1 className="text-3xl font-serif">Practice.</h1>
                  <h1 className="hero-sub font-serif font-normal">{heroFocus}</h1>
                </div>

                {/* Canvas Orb */}
                <div className="orb-container">
                  <canvas ref={orbCanvasRef} className="orb-canvas" />
                  <div className="orb-overlay">
                    <div className="timer-count font-serif">{timeLeft >= 60 ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : timeLeft}</div>
                    <div className="timer-label font-serif">{timeLeft >= 60 ? '' : 'sec'}</div>
                    {phase === "recording" && <div className="rec-dot" />}
                  </div>
                </div>

                {phase === "idle" && (
                  <div className="duration-wrap">
                    <div className="duration-row">
                      <span className="duration-bound">15s</span>
                      <span className="duration-current">{selectedDuration >= 60 ? `${Math.floor(selectedDuration / 60)}:${String(selectedDuration % 60).padStart(2, '0')}` : `${selectedDuration}s`}</span>
                      <span className="duration-bound">5:00</span>
                    </div>
                    <input type="range" min={15} max={300} step={15} value={selectedDuration}
                      onChange={(e) => { const v = Number(e.target.value); setSelectedDuration(v); setTimeLeft(v); }}
                      className="duration-slider" />
                  </div>
                )}

                {phase === "recording" && (
                  <div className="live-metrics">
                    {[{ label: "Pace", val: livePace }, { label: "Energy", val: liveEnergy }].map(({ label, val }) => (
                      <div key={label} className="live-metric-card">
                        <div className="live-metric-label">{label}</div>
                        <div className="live-bar-track"><div className="live-bar-fill" style={{ width: val + "%" }} /></div>
                        <div className="live-metric-num">{val}</div>
                      </div>
                    ))}
                  </div>
                )}

                <VoiceMicControl onStart={startRecording} onStop={reset}
                  onStopEarly={() => { if (phase !== "recording") return; stopAll(); setWaveData(new Array(80).fill(0.5)); setPhase("analyzing"); scheduleAnalyze(); }}
                  phase={phase} />

                {micError && <p className="mic-error">{micError}</p>}
                {phase === "analyzing" && (() => {
                  const recDuration = selectedDuration - timeLeft;
                  const est = Math.max(3, Math.round(recDuration * 0.12 + 4));
                  const dark = document.documentElement.classList.contains("dark");
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 8 }}>
                      <AILoader text="Analyzing" volume={liveEnergy / 100} estimatedSeconds={est} isDark={dark} size={140} />
                      <button onClick={reset} className="btn-reset" style={{ marginTop: 8 }}>Cancel</button>
                    </div>
                  );
                })()}

                {phase === "recording" && (
                  <div className="recording-indicator">
                    <span className="rec-dot-inline" />
                    <span className="recording-label">Recording</span>
                  </div>
                )}
              </section>

              {/* Results below recording when done */}
              {phase === "done" && metrics && feedback && (
                <section className="results-section">
                  {!isPremium && <PaywallCTA onUpgrade={() => setShowPricing(true)} />}
                  <div style={!isPremium ? { filter: "blur(8px)", pointerEvents: "none", userSelect: "none" } : {}}>
                    <div className="score-rings">
                      <ScoreRing score={metrics.overall} label="Overall" color="var(--pg-text)" />
                      <ScoreRing score={metrics.delivery} label="Delivery" color="var(--pg-subtle)" />
                      <ScoreRing score={metrics.pace} label="Pace" color="var(--pg-subtle)" />
                      <ScoreRing score={metrics.conf} label="Confidence" color="var(--pg-subtle)" />
                      <ScoreRing score={metrics.clar} label="Clarity" color="var(--pg-subtle)" />
                    </div>

                    <div className="result-section">
                      <div className="metric-bars">
                        {[{ label: "Word Choice", value: metrics.wordChoice }, { label: "Persuasion", value: metrics.persuasion }].map(({ label, value }) => (
                          <div key={label} className="metric-bar-item">
                            <div className="metric-bar-header"><span className="section-label">{label}</span><span className="metric-bar-num">{value}</span></div>
                            <div className="bar-track"><div className="bar-fill" style={{ width: `${value}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="result-section">
                      <div className="metric-bar-header"><span className="section-label">Measured Pace</span><span className="metric-bar-num">{metrics.wpm} WPM</span></div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${metrics.measuredPace}%`, background: metrics.wpm >= 120 && metrics.wpm <= 160 ? "var(--pg-text)" : "var(--pg-subtle)" }} /></div>
                      <div className="bar-hint">Ideal: 130–160 WPM</div>
                    </div>

                    <div className="result-section tags-row">
                      {feedback.tags.map((tag, i) => (
                        <span key={i} className="tag" style={{ color: tagColor(tag.t), background: tagBg(tag.t), borderColor: tagColor(tag.t) }}>{tag.label}</span>
                      ))}
                    </div>

                    {feedback.transcript && (
                      <div className="result-section">
                        <div className="section-label">Your Speech</div>
                        <p className="transcript-text">"{feedback.transcript}"</p>
                      </div>
                    )}

                    {[
                      { title: "Overall Assessment", text: feedback.overallTxt },
                      { title: "Delivery & Word Choice", text: feedback.deliveryTxt },
                      { title: "Pace & Rhythm", text: feedback.paceTxt },
                      { title: "Tone & Authority", text: feedback.toneTxt },
                      { title: "Clarity & Structure", text: feedback.clarityTxt },
                      { title: "Key Strength", text: feedback.strengthTxt },
                      { title: "Key Weakness", text: feedback.weaknessTxt },
                      { title: "Recommendation", text: feedback.recTxt },
                    ].filter(({ text }) => text).map(({ title, text }) => (
                      <div key={title} className="result-section">
                        <div className="section-label">{title}</div>
                        <p className="feedback-text">{text}</p>
                      </div>
                    ))}

                    {feedback.techniques?.length > 0 && (
                      <div className="result-section">
                        <div className="section-label">Techniques Detected ({feedback.techniques.length})</div>
                        <div className="techniques-list">
                          {feedback.techniques.map((t, i) => (
                            <div key={i} className={`technique-card impact-${t.impact}`}>
                              <div className="technique-header">
                                <span className="technique-name">{t.name}</span>
                                <span className={`technique-badge impact-${t.impact}`}>{t.impact === "pos" ? "Effective" : t.impact === "neg" ? "Needs Work" : "Neutral"}</span>
                              </div>
                              <p className="technique-quote">"{t.quote}"</p>
                              <p className="technique-explanation">{t.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="result-section word-stats">
                      <div>
                        <div className="section-label">Filler Words</div>
                        <div className="word-stat-num">{feedback.fillerWords?.count || 0}</div>
                        <div className="word-stat-sub">{feedback.fillerWords?.percentage ? `${feedback.fillerWords.percentage.toFixed(1)}% of words` : "Clean speech"}</div>
                        {feedback.fillerWords?.words?.length > 0 && <div className="word-chips">{feedback.fillerWords.words.map((w, i) => <span key={i} className="chip chip-neutral">{w}</span>)}</div>}
                      </div>
                      <div>
                        <div className="section-label">Power Words</div>
                        <div className="word-stat-num">{feedback.powerWords?.length || 0}</div>
                        {feedback.powerWords?.length > 0 && <div className="word-chips">{feedback.powerWords.map((w, i) => <span key={i} className="chip chip-strong">{w}</span>)}</div>}
                      </div>
                    </div>

                    {feedback.hedgingInstances?.length > 0 && (
                      <div className="result-section">
                        <div className="section-label">Hedging → Stronger Alternatives</div>
                        <div className="hedging-list">
                          {feedback.hedgingInstances.map((h, i) => (
                            <div key={i} className="hedging-row"><span className="hedge-weak">"{h.phrase}"</span><span className="hedge-arrow">→</span><span className="hedge-strong">"{h.suggestion}"</span></div>
                          ))}
                        </div>
                      </div>
                    )}

                    {recCommTips.length > 0 && (
                      <div className="result-section">
                        <div className="section-label">Recommended Tips</div>
                        <div className="tips-list">{recCommTips.map((t, i) => <div key={i} className="tip-item">{t}</div>)}</div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </main>

            {/* Tabbed Practice + Quote section below */}
            {phase !== "done" && (
              <div className="below-sections">
                {/* Tabbed Practice Box */}
                <div className="practice-box">
                  <div className="practice-tabs-row">
                    <button className={`practice-tab${practiceTab === "today" ? " active" : ""}`} onClick={() => setPracticeTab("today")}>Today's Practice</button>
                    <button className={`practice-tab${practiceTab === "custom" ? " active" : ""}`} onClick={() => setPracticeTab("custom")}>Custom Practice</button>
                  </div>
                  <div className="practice-content">
                    {practiceTab === "today" ? (
                      <div className="scenarios-list-inner">
                        {SCENARIO_CATEGORIES.map((cat) => {
                          const todayItem = getTodayScenario(cat);
                          const done = completedCategoriesToday.includes(cat.category);
                          return (
                            <button key={cat.slug} onClick={() => navigate(`/scenarios/${cat.slug}`)} className={`scenario-card${done ? " done" : ""}`}>
                              <div>
                                <div className="scenario-cat">{cat.category}{done && <span className="scenario-done-badge">✓</span>}</div>
                                <div className="scenario-title">{todayItem.title}</div>
                              </div>
                              <div className="scenario-diff" style={{ color: diffColor(todayItem.difficulty) }}>{todayItem.difficulty}</div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button className="custom-practice-inner" onClick={() => navigate("/custom-practice")}>
                        <span className="custom-card-title">+ Create Custom Practice</span>
                        <span className="custom-card-sub">Choose your own scenario, topic, and goals</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Nav Buttons */}
                <div className="quick-nav">
                  <button className="quick-nav-btn" onClick={() => navigate("/progress")}>View Progress</button>
                  <button className="quick-nav-btn" onClick={() => navigate("/coach")}>AI Coach</button>
                </div>

                {/* Quote */}
                <div className="quote-section">
                  <p className="quote-text">Great speakers aren't born. They're trained.</p>
                  <span className="quote-attr">— Unknown</span>
                </div>
              </div>
            )}

            <div style={{ height: 40 }} />
          </div>
        </>
      )}

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} onSubscribe={() => { localStorage.setItem("syntera_premium", "true"); setIsPremium(true); setShowPricing(false); }} />}
      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .app-root {
          --pg-bg: #f8f8f6; --pg-text: #1a1a1c; --pg-card: #ffffff; --pg-border: #e2e2e0;
          --pg-border-soft: #ebebea; --pg-muted: #888890; --pg-dim: #aaaaae; --pg-subtle: #ccccce;
          --pg-faint: #666670; --pg-mid: #555; --pg-accent: #f0f0ee; --pg-surface: #f4f4f2;
          --pg-surface-alt: #eaeae8; --pg-overlay: rgba(0,0,0,0.25);
          --pg-green: #1a1a1c;
          --pg-btn-bg: #1a1a1c; --pg-btn-text: #f8f8f6;
          --pg-btn-stop-bg: rgba(0,0,0,0.06); --pg-btn-stop-text: rgba(0,0,0,0.5); --pg-btn-stop-border: var(--pg-border);
          --pg-hero-sub: rgba(0,0,0,0.28);
          --pg-wave-active-border: rgba(0,0,0,0.2);
          --pg-bar-fill: rgba(0,0,0,0.4);
          --pg-chip-strong-bg: rgba(0,0,0,0.08); --pg-chip-strong-text: rgba(0,0,0,0.7); --pg-chip-strong-border: rgba(0,0,0,0.15);
          --pg-technique-pos-border: rgba(0,0,0,0.15); --pg-technique-pos-bg: rgba(0,0,0,0.06); --pg-technique-pos-text: rgba(0,0,0,0.7);
          --pg-hedge-strong: rgba(0,0,0,0.75);
          --pg-scenario-done: rgba(0,0,0,0.5);
          --pg-selected-bg: rgba(0,0,0,0.05); --pg-selected-border: rgba(0,0,0,0.3);
          --pg-hover-border: rgba(0,0,0,0.15); --pg-hover-text: var(--pg-faint);
          min-height: 100vh; background: var(--pg-bg); color: var(--pg-text); font-family: 'DM Mono', monospace;
        }
        .dark .app-root {
          --pg-bg: #060608; --pg-text: #f0eeea; --pg-card: #0e0e12; --pg-border: #1c1c22;
          --pg-border-soft: #161619; --pg-muted: #555560; --pg-dim: #44444e; --pg-subtle: #333338;
          --pg-faint: #888896; --pg-mid: #999; --pg-accent: #111116; --pg-surface: #0c0c10;
          --pg-surface-alt: #0a0a0e; --pg-overlay: rgba(0,0,0,0.75);
          --pg-green: #ffffff;
          --pg-btn-bg: #fff; --pg-btn-text: #060608;
          --pg-btn-stop-bg: rgba(255,255,255,0.08); --pg-btn-stop-text: rgba(255,255,255,0.5); --pg-btn-stop-border: var(--pg-border);
          --pg-hero-sub: rgba(255,255,255,0.28);
          --pg-wave-active-border: rgba(255,255,255,0.2);
          --pg-bar-fill: rgba(255,255,255,0.5);
          --pg-chip-strong-bg: rgba(255,255,255,0.08); --pg-chip-strong-text: rgba(255,255,255,0.7); --pg-chip-strong-border: rgba(255,255,255,0.15);
          --pg-technique-pos-border: rgba(255,255,255,0.15); --pg-technique-pos-bg: rgba(255,255,255,0.1); --pg-technique-pos-text: rgba(255,255,255,0.7);
          --pg-hedge-strong: rgba(255,255,255,0.75);
          --pg-scenario-done: rgba(255,255,255,0.5);
          --pg-selected-bg: rgba(255,255,255,0.05); --pg-selected-border: rgba(255,255,255,0.3);
          --pg-hover-border: rgba(255,255,255,0.15); --pg-hover-text: var(--pg-faint);
        }

        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 48px; border-bottom: 1px solid var(--pg-border); background: color-mix(in srgb, var(--pg-bg) 90%, transparent); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 20; }
        .topbar-avg { text-align: right; }
        .topbar-avg-label { display: block; font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--pg-muted); margin-bottom: 2px; font-family: 'DM Mono', monospace; }
        .topbar-avg-value { font-size: 28px; color: var(--pg-text); line-height: 1; font-family: 'Syne', sans-serif; font-weight: 700; letter-spacing: -0.02em; }

        .main-single { display: flex; flex-direction: column; padding: 0; background: var(--pg-bg); min-height: calc(100vh - 53px); }

        .record-panel { display: flex; flex-direction: column; align-items: center; padding: 48px 48px 40px; background: var(--pg-bg); }

        .hero-heading { margin-bottom: 32px; text-align: center; }
        .hero-heading h1 { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 3.5vw, 3rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1.0; color: var(--pg-text); }
        .hero-heading h1.hero-sub { color: var(--pg-hero-sub); font-weight: 400; }

        .orb-container { position: relative; width: 200px; height: 200px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; }
        .orb-canvas { width: 200px; height: 200px; }
        .orb-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; pointer-events: none; }

        .timer-count { font-size: 48px; color: var(--pg-text); line-height: 1; font-family: 'Syne', sans-serif; font-weight: 700; letter-spacing: -0.03em; }
        .timer-label { font-size: 8px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--pg-dim); font-family: 'DM Mono', monospace; }
        .rec-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pg-text); margin-top: 6px; animation: pulse 1s infinite; }

        .recording-indicator { display: flex; align-items: center; gap: 8px; justify-content: center; margin-top: 16px; }
        .rec-dot-inline { width: 6px; height: 6px; border-radius: 50%; background: var(--pg-text); animation: pulse 1s infinite; }
        .recording-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--pg-muted); font-family: 'DM Mono', monospace; }

        .duration-wrap { max-width: 240px; margin: 0 auto 24px; }
        .duration-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; font-family: 'DM Mono', monospace; }
        .duration-bound { font-size: 9px; color: var(--pg-dim); letter-spacing: 0.08em; }
        .duration-current { font-size: 12px; font-weight: 500; color: var(--pg-text); }
        .duration-slider { width: 100%; cursor: pointer; }

        .live-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; }
        .live-metric-card { background: var(--pg-card); border: 1px solid var(--pg-border); padding: 12px 14px; }
        .live-metric-label { font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--pg-muted); margin-bottom: 8px; font-family: 'DM Mono', monospace; }
        .live-bar-track { height: 2px; background: var(--pg-border); margin-bottom: 6px; }
        .live-bar-fill { height: 100%; background: var(--pg-bar-fill); transition: width 0.1s; }
        .live-metric-num { font-size: 10px; color: var(--pg-faint); font-family: 'DM Mono', monospace; }

        .mic-controls { display: flex; gap: 10px; justify-content: center; margin-bottom: 16px; }

        .btn-record-toggle { width: 56px; height: 56px; border-radius: 50%; background: var(--pg-btn-bg); color: var(--pg-btn-text); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.15s, transform 0.1s; }
        .btn-record-toggle:hover { opacity: 0.85; }
        .btn-record-toggle:active { transform: scale(0.93); }
        .btn-record-toggle:disabled { opacity: 0.25; cursor: not-allowed; }
        .btn-record-toggle.recording { background: var(--pg-btn-bg); }
        .stop-square { width: 16px; height: 16px; background: var(--pg-btn-text); animation: rotateSq 3s linear infinite; }
        .toggle-label { font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; font-family: 'DM Mono', monospace; }
        @keyframes rotateSq { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .btn-reset { padding: 13px 18px; background: var(--pg-btn-bg); color: var(--pg-btn-text); border: none; font-size: 11px; letter-spacing: 0.08em; cursor: pointer; font-family: 'DM Mono', monospace; transition: opacity 0.15s; }
        .btn-reset:hover { opacity: 0.75; }

        .btn-primary { padding: 13px 32px; background: var(--pg-btn-bg); color: var(--pg-btn-text); border: none; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; font-family: 'DM Mono', monospace; transition: opacity 0.15s, transform 0.1s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:active { transform: scale(0.97); }
        .btn-primary:disabled { opacity: 0.25; cursor: not-allowed; }

        .mic-error { font-size: 11px; color: rgba(255,80,60,0.7); text-align: center; margin-bottom: 12px; line-height: 1.6; font-family: 'DM Mono', monospace; }
        .analyzing-msg { font-size: 10px; color: var(--pg-muted); text-align: center; margin-bottom: 20px; letter-spacing: 0.1em; text-transform: uppercase; font-family: 'DM Mono', monospace; animation: blink 1.4s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .results-section { padding: 32px 48px; background: var(--pg-bg); animation: fadeUp 0.5s ease; }
        .section-label { font-size: 8px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--pg-muted); margin-bottom: 12px; display: block; font-family: 'DM Mono', monospace; }

        .scenario-card { width: 100%; background: var(--pg-bg); border: none; border-bottom: 1px solid var(--pg-border); padding: 14px 16px; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-family: 'DM Mono', monospace; transition: background 0.15s; }
        .scenario-card:last-child { border-bottom: none; }
        .scenario-card:hover { background: var(--pg-accent); }
        .scenario-card.done { opacity: 0.4; }
        .scenario-cat { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--pg-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .scenario-done-badge { font-size: 9px; color: var(--pg-scenario-done); }
        .scenario-title { font-size: 12px; font-weight: 500; color: var(--pg-text); }
        .scenario-diff { font-size: 8px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--pg-muted); }

        .score-rings { display: flex; justify-content: space-around; padding-bottom: 24px; border-bottom: 1px solid var(--pg-border); margin-bottom: 24px; }
        .score-ring { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .ring-label { font-size: 7px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--pg-muted); font-family: 'DM Mono', monospace; }

        .result-section { padding-bottom: 20px; border-bottom: 1px solid var(--pg-border); margin-bottom: 20px; }

        .metric-bars { display: grid; gap: 14px; }
        .metric-bar-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .metric-bar-num { font-size: 22px; color: var(--pg-text); font-family: 'Syne', sans-serif; font-weight: 700; letter-spacing: -0.02em; }
        .bar-track { height: 2px; background: var(--pg-border); }
        .bar-fill { height: 100%; background: var(--pg-bar-fill); transition: width 0.8s ease; }
        .bar-hint { font-size: 8px; color: var(--pg-dim); margin-top: 6px; font-family: 'DM Mono', monospace; letter-spacing: 0.06em; }

        .tags-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag { font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; padding: 4px 10px; border: 1px solid; font-family: 'DM Mono', monospace; }

        .transcript-text { font-size: 14px; line-height: 1.85; color: var(--pg-faint); font-family: 'DM Mono', monospace; font-style: italic; }
        .feedback-text { font-size: 12px; line-height: 1.8; color: var(--pg-faint); font-family: 'DM Mono', monospace; }

        .techniques-list { display: grid; gap: 8px; }
        .technique-card { border: 1px solid var(--pg-border); padding: 14px; }
        .technique-card.impact-pos { border-color: var(--pg-technique-pos-border); }
        .technique-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .technique-name { font-size: 11px; font-weight: 600; color: var(--pg-text); font-family: 'DM Mono', monospace; letter-spacing: 0.04em; }
        .technique-badge { font-size: 7px; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 8px; font-family: 'DM Mono', monospace; }
        .technique-badge.impact-pos { background: var(--pg-technique-pos-bg); color: var(--pg-technique-pos-text); border: 1px solid var(--pg-technique-pos-border); }
        .technique-badge.impact-neg { background: var(--pg-btn-stop-bg); color: var(--pg-muted); border: 1px solid var(--pg-border); }
        .technique-badge.impact-neutral { background: transparent; color: var(--pg-dim); border: 1px solid var(--pg-border); }
        .technique-quote { font-size: 12px; font-family: 'DM Mono', monospace; font-style: italic; color: var(--pg-muted); margin-bottom: 6px; }
        .technique-explanation { font-size: 10px; line-height: 1.7; color: var(--pg-dim); font-family: 'DM Mono', monospace; }

        .word-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .word-stat-num { font-size: 36px; color: var(--pg-text); margin: 4px 0; font-family: 'Syne', sans-serif; font-weight: 700; letter-spacing: -0.03em; }
        .word-stat-sub { font-size: 9px; color: var(--pg-dim); font-family: 'DM Mono', monospace; letter-spacing: 0.06em; }
        .word-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
        .chip { font-size: 8px; padding: 3px 8px; font-family: 'DM Mono', monospace; letter-spacing: 0.08em; }
        .chip-neutral { background: var(--pg-accent); color: var(--pg-faint); border: 1px solid var(--pg-border); }
        .chip-strong { background: var(--pg-chip-strong-bg); color: var(--pg-chip-strong-text); border: 1px solid var(--pg-chip-strong-border); }

        .hedging-list { display: grid; gap: 8px; }
        .hedging-row { display: flex; align-items: center; gap: 8px; font-size: 11px; flex-wrap: wrap; font-family: 'DM Mono', monospace; }
        .hedge-weak { color: var(--pg-dim); text-decoration: line-through; }
        .hedge-arrow { color: var(--pg-subtle); }
        .hedge-strong { color: var(--pg-hedge-strong); font-weight: 600; }

        .tips-list { display: grid; gap: 6px; }
        .tip-item { border: 1px solid var(--pg-border); padding: 10px 12px; font-size: 11px; color: var(--pg-muted); line-height: 1.7; font-family: 'DM Mono', monospace; }

        /* Below sections: tabbed practice, quick nav, quote */
        .below-sections { display: flex; flex-direction: column; gap: 48px; padding: 48px 48px 60px; }

        .practice-box { border: 1px solid var(--pg-border); background: var(--pg-card); }
        .practice-tabs-row { display: flex; border-bottom: 1px solid var(--pg-border); }
        .practice-tab { flex: 1; padding: 12px 16px; background: transparent; border: none; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--pg-muted); cursor: pointer; font-family: 'DM Mono', monospace; transition: all 0.15s; border-bottom: 2px solid transparent; }
        .practice-tab.active { color: var(--pg-text); border-bottom-color: var(--pg-text); }
        .practice-tab:hover { color: var(--pg-faint); }
        .practice-content { }
        .scenarios-list-inner { display: flex; flex-direction: column; }

        .custom-practice-inner { width: 100%; padding: 40px 32px; background: transparent; border: none; cursor: pointer; font-family: 'DM Mono', monospace; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; transition: background 0.15s; }
        .custom-practice-inner:hover { background: var(--pg-accent); }
        .custom-card-title { font-size: 13px; font-weight: 600; color: var(--pg-text); letter-spacing: 0.02em; }
        .custom-card-sub { font-size: 9px; color: var(--pg-dim); letter-spacing: 0.1em; }

        .quick-nav { display: flex; gap: 12px; }
        .quick-nav-btn { flex: 1; padding: 16px; background: var(--pg-card); border: 1px solid var(--pg-border); color: var(--pg-text); font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; font-family: 'DM Mono', monospace; transition: background 0.15s, border-color 0.15s; }
        .quick-nav-btn:hover { background: var(--pg-accent); border-color: var(--pg-dim); }

        .quote-section { padding: 40px 32px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .quote-text { font-size: 14px; font-family: 'DM Mono', monospace; font-style: italic; color: var(--pg-muted); line-height: 1.8; }
        .quote-attr { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--pg-dim); font-family: 'DM Mono', monospace; }

        .quiz-overlay { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: var(--pg-overlay); backdrop-filter: blur(8px); }
        .quiz-modal { width: min(480px, 92vw); background: var(--pg-card); border: 1px solid var(--pg-border); padding: 36px; }
        .quiz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .quiz-title { font-size: 20px; color: var(--pg-text); font-family: 'Syne', sans-serif; font-weight: 700; letter-spacing: -0.02em; }
        .quiz-step { font-size: 10px; color: var(--pg-dim); font-family: 'DM Mono', monospace; letter-spacing: 0.1em; }
        .quiz-question { font-size: 13px; color: var(--pg-text); font-weight: 500; margin-bottom: 16px; line-height: 1.6; font-family: 'DM Mono', monospace; }
        .quiz-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 24px; }
        .quiz-option { text-align: left; padding: 11px 14px; border: 1px solid var(--pg-border); background: var(--pg-bg); cursor: pointer; font-size: 12px; color: var(--pg-muted); font-family: 'DM Mono', monospace; transition: all 0.15s; }
        .quiz-option:hover { border-color: var(--pg-hover-border); color: var(--pg-hover-text); }
        .quiz-option.selected { border-color: var(--pg-selected-border); background: var(--pg-selected-bg); color: var(--pg-text); }
        .quiz-actions { display: flex; justify-content: space-between; }
        .quiz-btn-secondary { padding: 10px 18px; border: 1px solid var(--pg-border); background: transparent; cursor: pointer; color: var(--pg-dim); font-size: 11px; font-family: 'DM Mono', monospace; letter-spacing: 0.06em; }
        .quiz-btn-secondary:disabled { cursor: not-allowed; opacity: 0.3; }
        .quiz-btn-primary { padding: 11px 24px; border: none; background: var(--pg-btn-bg); color: var(--pg-btn-text); cursor: pointer; font-size: 11px; font-weight: 600; font-family: 'DM Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase; transition: opacity 0.15s; }
        .quiz-btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }

        .tip-overlay { position: fixed; inset: 0; z-index: 55; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 40px; background: var(--pg-overlay); backdrop-filter: blur(6px); }
        .tip-modal { width: min(400px, 90vw); background: var(--pg-card); border: 1px solid var(--pg-border); padding: 28px 24px; position: relative; }
        .tip-close { position: absolute; top: 12px; right: 14px; background: none; border: none; font-size: 14px; color: var(--pg-dim); cursor: pointer; }
        .tip-eyebrow { font-size: 8px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--pg-muted); text-align: center; margin-bottom: 12px; font-weight: 500; font-family: 'DM Mono', monospace; }
        .tip-text { font-size: 13px; color: var(--pg-text); line-height: 1.75; text-align: center; font-family: 'DM Mono', monospace; font-style: italic; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
