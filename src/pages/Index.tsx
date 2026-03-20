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
import SpeakBetterInterstitial from "@/components/onboarding/SpeakBetterInterstitial";
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
  return (
    <div className="mic-controls">
      {isRecording
        ? <button onClick={onStopEarly} className="btn-primary btn-stop">Stop Recording</button>
        : <button onClick={!isAnalyzing ? onStart : undefined} disabled={isAnalyzing} className="btn-primary">
            {phase === "idle" ? "Start Recording" : phase === "analyzing" ? "Analyzing…" : "Record Again"}
          </button>
      }
      <button onClick={onStop} className="btn-ghost">Reset</button>
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
    if (!transcript || transcript.length < 5) {
      setMicError("Could not detect speech. Please speak clearly and try again.");
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
        let finalTranscript = ""; let isRecognitionActive = true;
        recognition.onresult = (event) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) { let bestAlt = event.results[i][0]; for (let j = 1; j < event.results[i].length; j++) { if (event.results[i][j].confidence > bestAlt.confidence) bestAlt = event.results[i][j]; } finalTranscript += bestAlt.transcript + " "; } else { interim += event.results[i][0].transcript; }
          }
          transcriptRef.current = finalTranscript + interim;
        };
        recognition.onerror = (e) => { if (isRecognitionActive && (e.error === "network" || e.error === "aborted" || e.error === "no-speech")) { try { setTimeout(() => { if (isRecognitionActive) recognition.start(); }, 300); } catch (_) {} } };
        recognition.onend = () => { if (isRecognitionActive) { try { setTimeout(() => { if (isRecognitionActive) recognition.start(); }, 200); } catch (_) {} } };
        recognition.start(); recognitionRef.current = recognition;
        recognitionRef.current._stopAutoRestart = () => { isRecognitionActive = false; };
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
        const currentWpm = elapsedSec > 1 ? wordCount / elapsedSec * 60 : 0;
        setLivePace(currentWpm < 100 ? 20 : currentWpm <= 119 ? 45 : currentWpm <= 139 ? 70 : currentWpm <= 160 ? 100 : currentWpm <= 180 ? 80 : currentWpm <= 200 ? 55 : 30);
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
        <OnboardingQuiz onFinish={({ neg, comm, answers }) => { localStorage.setItem("negotium_quiz_v2", JSON.stringify({ answers })); const p = derivePersonalization(answers); setRecCommTips([...new Set([...(neg || []), ...(comm || [])].slice(0, 6))]); setUserSubtitle(p.subtitle); setHeroFocus(p.heroFocus); setQuizVisible(false); }} />
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

            <main className={`main-grid${isMobile ? " mobile" : ""}`}>
              {/* LEFT: Recording */}
              <section className="record-panel">
                <div className="hero-heading">
                  <h1>Practice.</h1>
                  <h1 className="hero-sub">{heroFocus}</h1>
                </div>

                <div className={`waveform${phase === "recording" ? " active" : ""}`}>
                  {waveData.map((v, i) => (
                    <div key={i} className="wave-bar" style={{ height: `${Math.max(3, Math.abs(v - 0.5) * 120)}px`, opacity: phase === "recording" ? 0.45 + Math.abs(v - 0.5) : 0.3, background: phase === "recording" ? "var(--pg-text)" : "var(--pg-subtle)" }} />
                  ))}
                </div>

                <div className="timer-wrap">
                  <svg width={140} height={140} viewBox="0 0 160 160">
                    <circle cx={80} cy={80} r={70} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--pg-border-soft)' }} />
                    <circle cx={80} cy={80} r={70} fill="none" strokeWidth={1.5}
                      strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={ringOffset}
                      style={{ stroke: 'var(--pg-text)', transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.9s linear" }} />
                  </svg>
                  <div className="timer-inner">
                    <div className="timer-count">{timeLeft}</div>
                    <div className="timer-label">sec</div>
                    {phase === "recording" && <div className="rec-dot" />}
                  </div>
                </div>

                {phase === "idle" && (
                  <div className="duration-wrap">
                    <div className="duration-row">
                      <span className="duration-bound">5s</span>
                      <span className="duration-current">{selectedDuration}s</span>
                      <span className="duration-bound">45s</span>
                    </div>
                    <input type="range" min={5} max={45} step={1} value={selectedDuration}
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
                {phase === "analyzing" && <p className="analyzing-msg">Analyzing your speech patterns…</p>}
              </section>

              {/* RIGHT: Scenarios / Results */}
              <aside className="results-panel">
                {!isMobile && (phase === "idle" || phase === "recording") && (
                  <div className="scenarios-wrap">
                    <div className="section-label">Today's Practice</div>
                    <div className="scenarios-list">
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
                  </div>
                )}

                {phase === "done" && metrics && feedback && (
                  <div className="results-wrap">
                    {!isPremium && <PaywallCTA onUpgrade={() => setShowPricing(true)} />}
                    <div style={!isPremium ? { filter: "blur(8px)", pointerEvents: "none", userSelect: "none" } : {}}>
                      <div className="score-rings">
                        <ScoreRing score={metrics.overall} label="Overall" color={metrics.overall >= 80 ? "#111" : metrics.overall >= 60 ? "#555" : "#999"} />
                        <ScoreRing score={metrics.delivery} label="Delivery" color="#555" />
                        <ScoreRing score={metrics.pace} label="Pace" color="#555" />
                        <ScoreRing score={metrics.conf} label="Confidence" color="#555" />
                        <ScoreRing score={metrics.clar} label="Clarity" color="#555" />
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
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${metrics.measuredPace}%`, background: metrics.wpm >= 120 && metrics.wpm <= 160 ? "#111" : "#888" }} /></div>
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
                  </div>
                )}
              </aside>
            </main>

            {phase === "idle" && (
              <div className={`bottom-cards${isMobile ? " mobile" : ""}`}>
                <div className="quote-card">
                  <p className="quote-text">Great speakers aren't born. They're trained.</p>
                  <span className="quote-attr">— Unknown</span>
                </div>
                <button className="custom-card" onClick={() => navigate("/custom-practice")}>
                  <span className="custom-card-title">+ Custom Practice</span>
                  <span className="custom-card-sub">Choose your own scenario and goals</span>
                </button>
              </div>
            )}

            <div style={{ height: 80 }} />
          </div>
        </>
      )}

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} onSubscribe={() => { localStorage.setItem("syntera_premium", "true"); setIsPremium(true); setShowPricing(false); }} />}
      <Footer />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .app-root {
          --pg-bg: #0c0c0e; --pg-text: #e6e6e0; --pg-card: #111113; --pg-border: #1a1a1c;
          --pg-border-soft: #161618; --pg-muted: #555; --pg-dim: #666; --pg-subtle: #444;
          --pg-faint: #888; --pg-mid: #aaa; --pg-accent: #161618; --pg-surface: #131315;
          --pg-surface-alt: #0e0e10; --pg-overlay: rgba(0,0,0,0.6);
          --pg-green: #c8ff00;
          min-height: 100vh; background: var(--pg-bg); color: var(--pg-text); font-family: 'IBM Plex Mono', monospace;
        }
        .dark .app-root {
          --pg-bg: #0c0c0e; --pg-text: #e6e6e0; --pg-card: #111113; --pg-border: #1a1a1c;
          --pg-border-soft: #161618; --pg-muted: #555; --pg-dim: #666; --pg-subtle: #444;
          --pg-faint: #888; --pg-mid: #aaa; --pg-accent: #161618; --pg-surface: #131315;
          --pg-surface-alt: #0e0e10; --pg-overlay: rgba(0,0,0,0.6);
          --pg-green: #c8ff00;
        }

        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 18px 48px; border-bottom: 1px solid var(--pg-border); background: var(--pg-bg); }
        .topbar-avg { text-align: right; }
        .topbar-avg-label { display: block; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--pg-muted); margin-bottom: 2px; font-family: 'IBM Plex Mono', monospace; }
        .topbar-avg-value { font-size: 32px; color: var(--pg-text); line-height: 1; font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }

        .main-grid { display: grid; grid-template-columns: 1fr 380px; gap: 48px; padding: 40px 48px; }
        .main-grid.mobile { grid-template-columns: 1fr; padding: 24px 20px; gap: 32px; }

        .record-panel { display: flex; flex-direction: column; }

        .hero-heading { margin-bottom: 40px; }
        .hero-heading h1 { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2.4rem, 4vw, 3.6rem); font-weight: 400; letter-spacing: 0.04em; line-height: 1; color: var(--pg-text); }
        .hero-heading h1.hero-sub { color: var(--pg-green); }

        .waveform { height: 60px; background: var(--pg-accent); border: 1px solid var(--pg-border); border-radius: 0; display: flex; align-items: center; padding: 0 10px; gap: 2px; margin-bottom: 32px; transition: border-color 0.3s; }
        .waveform.active { border-color: var(--pg-green); }
        .wave-bar { flex: 1; border-radius: 1px; transition: height 0.05s, background 0.2s, opacity 0.2s; }

        .timer-wrap { position: relative; width: 140px; height: 140px; margin: 0 auto 28px; }
        .timer-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
        .timer-count { font-size: 52px; color: var(--pg-text); line-height: 1; font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .timer-label { font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--pg-dim); font-family: 'IBM Plex Mono', monospace; }
        .rec-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--pg-green); margin-top: 6px; animation: pulse 1s infinite; }

        .duration-wrap { max-width: 260px; margin: 0 auto 20px; }
        .duration-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; font-family: 'IBM Plex Mono', monospace; }
        .duration-bound { font-size: 10px; color: var(--pg-dim); }
        .duration-current { font-size: 13px; font-weight: 500; color: var(--pg-text); }
        .duration-slider { width: 100%; cursor: pointer; }

        .live-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 22px; }
        .live-metric-card { background: var(--pg-card); border: 1px solid var(--pg-border); border-radius: 0; padding: 12px 14px; }
        .live-metric-label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--pg-muted); margin-bottom: 8px; font-family: 'IBM Plex Mono', monospace; }
        .live-bar-track { height: 3px; background: var(--pg-border-soft); border-radius: 0; margin-bottom: 6px; }
        .live-bar-fill { height: 100%; background: var(--pg-green); border-radius: 0; transition: width 0.1s; }
        .live-metric-num { font-size: 11px; color: var(--pg-faint); font-family: 'IBM Plex Mono', monospace; }

        .mic-controls { display: flex; gap: 10px; justify-content: center; margin-bottom: 16px; }

        .btn-primary { padding: 13px 32px; background: var(--pg-green); color: var(--pg-bg); border: none; border-radius: 0; font-size: 12px; font-weight: 500; letter-spacing: 0.05em; cursor: pointer; font-family: 'IBM Plex Mono', monospace; transition: opacity 0.15s, transform 0.1s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:active { transform: scale(0.97); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-primary.btn-stop { opacity: 0.7; }
        .btn-primary.btn-stop:hover { opacity: 0.85; }
        .btn-ghost { padding: 13px 18px; background: transparent; border: 1px solid var(--pg-border); border-radius: 0; color: var(--pg-muted); font-size: 12px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; transition: border-color 0.15s, color 0.15s; }
        .btn-ghost:hover { border-color: var(--pg-dim); color: var(--pg-faint); }

        .mic-error { font-size: 11px; color: #c85040; text-align: center; margin-bottom: 12px; line-height: 1.6; font-family: 'IBM Plex Mono', monospace; }
        .analyzing-msg { font-size: 11px; color: var(--pg-muted); text-align: center; margin-bottom: 20px; letter-spacing: 0.05em; font-family: 'IBM Plex Mono', monospace; }

        .section-label { font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--pg-muted); margin-bottom: 10px; display: block; font-family: 'IBM Plex Mono', monospace; }
        .scenarios-list { display: flex; flex-direction: column; gap: 6px; }
        .scenario-card { width: 100%; background: var(--pg-card); border: 1px solid var(--pg-border); border-radius: 0; padding: 12px 14px; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-family: 'IBM Plex Mono', monospace; transition: border-color 0.15s; }
        .scenario-card:hover { border-color: var(--pg-dim); }
        .scenario-card.done { opacity: 0.5; background: var(--pg-surface-alt); }
        .scenario-cat { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--pg-dim); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .scenario-done-badge { font-size: 9px; color: var(--pg-green); }
        .scenario-title { font-size: 12px; font-weight: 500; color: var(--pg-text); }
        .scenario-diff { font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }

        .score-rings { display: flex; justify-content: space-around; padding-bottom: 20px; border-bottom: 1px solid var(--pg-border-soft); margin-bottom: 20px; }
        .score-ring { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .ring-label { font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--pg-dim); font-family: 'IBM Plex Mono', monospace; }

        .results-wrap { animation: fadeUp 0.4s ease; }
        .result-section { padding-bottom: 18px; border-bottom: 1px solid var(--pg-border-soft); margin-bottom: 18px; }

        .metric-bars { display: grid; gap: 12px; }
        .metric-bar-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
        .metric-bar-num { font-size: 20px; color: var(--pg-text); font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .bar-track { height: 3px; background: var(--pg-border-soft); border-radius: 0; }
        .bar-fill { height: 100%; background: var(--pg-green); border-radius: 0; transition: width 0.6s ease; }
        .bar-hint { font-size: 9px; color: var(--pg-dim); margin-top: 5px; font-family: 'IBM Plex Mono', monospace; }

        .tags-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 10px; border: 1px solid; border-radius: 0; font-family: 'IBM Plex Mono', monospace; }

        .transcript-text { font-size: 15px; line-height: 1.8; color: var(--pg-faint); font-family: 'Instrument Serif', serif; font-style: italic; }
        .feedback-text { font-size: 13px; line-height: 1.8; color: var(--pg-mid); font-family: 'IBM Plex Mono', monospace; }

        .techniques-list { display: grid; gap: 8px; }
        .technique-card { border: 1px solid var(--pg-border-soft); border-radius: 0; padding: 12px; }
        .technique-card.impact-pos { border-color: var(--pg-green); }
        .technique-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .technique-name { font-size: 12px; font-weight: 600; color: var(--pg-text); font-family: 'IBM Plex Mono', monospace; }
        .technique-badge { font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border-radius: 0; font-family: 'IBM Plex Mono', monospace; }
        .technique-badge.impact-pos { background: var(--pg-green); color: var(--pg-bg); }
        .technique-badge.impact-neg { background: var(--pg-accent); color: var(--pg-faint); }
        .technique-badge.impact-neutral { background: var(--pg-surface); color: var(--pg-muted); }
        .technique-quote { font-size: 13px; font-family: 'Instrument Serif', serif; font-style: italic; color: var(--pg-muted); margin-bottom: 5px; }
        .technique-explanation { font-size: 11px; line-height: 1.6; color: var(--pg-faint); font-family: 'IBM Plex Mono', monospace; }

        .word-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .word-stat-num { font-size: 32px; color: var(--pg-text); margin: 4px 0; font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .word-stat-sub { font-size: 10px; color: var(--pg-dim); font-family: 'IBM Plex Mono', monospace; }
        .word-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
        .chip { font-size: 9px; padding: 2px 7px; border-radius: 0; font-family: 'IBM Plex Mono', monospace; }
        .chip-neutral { background: var(--pg-accent); color: var(--pg-faint); }
        .chip-strong { background: var(--pg-green); color: var(--pg-bg); }

        .hedging-list { display: grid; gap: 8px; }
        .hedging-row { display: flex; align-items: center; gap: 8px; font-size: 12px; flex-wrap: wrap; font-family: 'IBM Plex Mono', monospace; }
        .hedge-weak { color: var(--pg-dim); text-decoration: line-through; }
        .hedge-arrow { color: var(--pg-subtle); }
        .hedge-strong { color: var(--pg-green); font-weight: 600; }

        .tips-list { display: grid; gap: 8px; }
        .tip-item { border: 1px solid var(--pg-border-soft); border-radius: 0; padding: 10px 12px; font-size: 12px; color: var(--pg-mid); line-height: 1.6; font-family: 'IBM Plex Mono', monospace; }

        .bottom-cards { display: flex; gap: 16px; padding: 0 48px; margin-top: 8px; }
        .bottom-cards.mobile { flex-direction: column; padding: 0 20px; }
        .quote-card { flex: 1; padding: 40px 28px; border: 1px solid var(--pg-border); border-radius: 0; background: var(--pg-card); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
        .quote-text { font-size: 15px; font-family: 'Instrument Serif', serif; font-style: italic; color: var(--pg-faint); line-height: 1.7; }
        .quote-attr { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--pg-subtle); font-family: 'IBM Plex Mono', monospace; }
        .custom-card { flex: 1; padding: 40px 28px; background: var(--pg-card); border: 1px solid var(--pg-border); border-radius: 0; cursor: pointer; font-family: 'IBM Plex Mono', monospace; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; transition: border-color 0.15s; }
        .custom-card:hover { border-color: var(--pg-green); }
        .custom-card-title { font-size: 14px; font-weight: 600; color: var(--pg-text); }
        .custom-card-sub { font-size: 10px; color: var(--pg-dim); letter-spacing: 0.08em; }

        .quiz-overlay { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: var(--pg-overlay); backdrop-filter: blur(4px); }
        .quiz-modal { width: min(520px, 92vw); background: var(--pg-card); border: 1px solid var(--pg-border); border-radius: 0; padding: 32px; }
        .quiz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .quiz-title { font-size: 24px; color: var(--pg-text); font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .quiz-step { font-size: 11px; color: var(--pg-dim); font-family: 'IBM Plex Mono', monospace; }
        .quiz-question { font-size: 14px; color: var(--pg-text); font-weight: 500; margin-bottom: 14px; line-height: 1.5; font-family: 'IBM Plex Mono', monospace; }
        .quiz-options { display: flex; flex-direction: column; gap: 7px; margin-bottom: 22px; }
        .quiz-option { text-align: left; padding: 10px 14px; border: 1px solid var(--pg-border); border-radius: 0; background: var(--pg-card); cursor: pointer; font-size: 13px; color: var(--pg-mid); font-family: 'IBM Plex Mono', monospace; transition: all 0.15s; }
        .quiz-option:hover { border-color: var(--pg-dim); }
        .quiz-option.selected { border-color: var(--pg-green); background: var(--pg-bg); color: var(--pg-green); font-weight: 500; }
        .quiz-actions { display: flex; justify-content: space-between; }
        .quiz-btn-secondary { padding: 10px 18px; border: 1px solid var(--pg-border); border-radius: 0; background: transparent; cursor: pointer; color: var(--pg-dim); font-size: 12px; font-family: 'IBM Plex Mono', monospace; }
        .quiz-btn-secondary:disabled { cursor: not-allowed; opacity: 0.4; }
        .quiz-btn-primary { padding: 10px 24px; border: none; border-radius: 0; background: var(--pg-green); color: var(--pg-bg); cursor: pointer; font-size: 12px; font-weight: 600; font-family: 'IBM Plex Mono', monospace; transition: opacity 0.15s; }
        .quiz-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

        .tip-overlay { position: fixed; inset: 0; z-index: 55; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 40px; background: rgba(0,0,0,0.3); backdrop-filter: blur(2px); }
        .tip-modal { width: min(400px, 90vw); background: var(--pg-card); border: 1px solid var(--pg-border); border-radius: 0; padding: 28px 24px; position: relative; }
        .tip-close { position: absolute; top: 12px; right: 14px; background: none; border: none; font-size: 16px; color: var(--pg-dim); cursor: pointer; }
        .tip-eyebrow { font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--pg-green); text-align: center; margin-bottom: 10px; font-weight: 600; font-family: 'IBM Plex Mono', monospace; }
        .tip-text { font-size: 14px; color: var(--pg-text); line-height: 1.7; text-align: center; font-weight: 400; font-family: 'Instrument Serif', serif; font-style: italic; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
