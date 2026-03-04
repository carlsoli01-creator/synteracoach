import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const DURATION = 20;
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
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }}
        />
        <text
          x={36}
          y={40}
          textAnchor="middle"
          fill="#0b0b0b"
          fontSize={14}
          fontFamily="Inter, sans-serif"
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9aa0a6" }}>{label}</span>
    </div>
  );
}

function HistoryCard({ entry, index }) {
  const grade = entry.overall >= 80 ? "A" : entry.overall >= 65 ? "B" : entry.overall >= 50 ? "C" : "D";
  const gradeColor =
    entry.overall >= 80 ? "#4a8c5c" : entry.overall >= 65 ? "#6b7280" : entry.overall >= 50 ? "#c97a2a" : "#c04a2a";
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
        boxShadow: "0 6px 24px rgba(16,24,40,0.06)",
      }}
    >
      <div style={{ fontSize: 28, color: gradeColor, fontWeight: "bold", minWidth: 24 }}>{grade}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#0b0b0b", marginBottom: 4 }}>
          Session #{index + 1} — Score {entry.overall}/100
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["pace", "conf", "clar"].map((k) => (
            <div key={k} style={{ fontSize: 9, color: "#9aa0a6", letterSpacing: "0.1em" }}>
              {k.toUpperCase()} <span style={{ color: "#6b7280" }}>{entry[k]}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9, color: "#9aa0a6" }}>{entry.time}</div>
    </div>
  );
}

const NEGOTIATION_TIPS = [
  "Pause strategically after key offers to create leverage.",
  "Anchor your first offer confidently and without apology.",
  "Use downward inflection to signal finality and conviction.",
  "Break complex proposals into small, digestible chunks.",
  "Mirror the other party's tempo briefly to build rapport.",
  "Use silence as a tool — let the other side fill it.",
  "Start important sentences with an anchor word (e.g., 'Consider').",
  "Practice 'offer, pause, and hold' drills regularly.",
  "Label emotions neutrally to defuse tension (e.g., 'I hear concern').",
  "Slow your delivery on the concession — make it deliberate.",
  "Keep your pitch steady when presenting numbers.",
  "Use micro-pauses (250–400ms) to sound deliberate, not hesitant.",
  "Reframe the discussion with a single decisive sentence.",
  "Ask calibrated questions to extract information ('How would you...?').",
  "Summarize agreements before moving on to new points.",
  "Use consistent terminology to reduce ambiguity.",
  "Avoid filler words when making the ask — pause instead.",
  "Practice mock negotiations under a time constraint.",
  "Record and compare your delivery across sessions.",
  "End offers with a downward tone to close space for rebuttal.",
];

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
];

const QUIZ_QUESTIONS = [
  {
    id: "goal",
    q: "What do you most want to improve?",
    options: ["Pace", "Tone/Authority", "Clarity", "Confidence", "Conciseness"],
  },
  {
    id: "experience",
    q: "How often do you practice speaking exercises?",
    options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
  },
  {
    id: "audience",
    q: "Who is your most common audience?",
    options: ["One person", "Small team", "Large group", "Clients/Customers", "Remote calls"],
  },
  {
    id: "nerves",
    q: "Do you feel nervous when speaking in negotiations?",
    options: ["Always", "Often", "Sometimes", "Rarely", "Never"],
  },
  {
    id: "filler",
    q: "Do you use filler words (um/like) often?",
    options: ["Very often", "Sometimes", "Occasionally", "Rarely", "Never"],
  },
  {
    id: "goalType",
    q: "Which result matters most?",
    options: ["Close deals", "Appear confident", "Be concise", "Be persuasive", "Improve clarity"],
  },
];

function OnboardingQuiz({ onFinish }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const q = QUIZ_QUESTIONS[step];

  const handleFinish = () => {
    const picksNeg = [];
    const picksComm = [];
    if (answers.goal?.includes("Pace")) {
      picksComm.push(COMMUNICATION_TIPS[6]);
      picksNeg.push(NEGOTIATION_TIPS[0]);
    }
    if (answers.goal?.includes("Tone")) {
      picksComm.push(COMMUNICATION_TIPS[0]);
      picksNeg.push(NEGOTIATION_TIPS[1]);
    }
    if (answers.filler?.includes("Very") || answers.filler?.includes("Sometimes"))
      picksComm.push(COMMUNICATION_TIPS[16]);
    for (let i = 0; picksNeg.length < 4; i++) picksNeg.push(NEGOTIATION_TIPS[i % NEGOTIATION_TIPS.length]);
    for (let i = 0; picksComm.length < 4; i++) picksComm.push(COMMUNICATION_TIPS[i % COMMUNICATION_TIPS.length]);
    onFinish({ neg: picksNeg.slice(0, 6), comm: picksComm.slice(0, 6) });
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
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: "min(540px, 92vw)",
          background: "#fff",
          border: "1px solid #e6e6e6",
          borderRadius: 14,
          padding: 28,
          boxShadow: "0 24px 64px rgba(16,24,40,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0b0b0b" }}>Welcome — Quick Setup</div>
          <div style={{ fontSize: 12, color: "#9aa0a6" }}>
            {step + 1}/{QUIZ_QUESTIONS.length}
          </div>
        </div>
        <div style={{ fontSize: 14, color: "#0b0b0b", marginBottom: 12, fontWeight: 500 }}>{q.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {q.options.map((opt) => (
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
                transition: "all .15s",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
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
              fontSize: 13,
            }}
          >
            Back
          </button>
          {step < QUIZ_QUESTIONS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(90deg,#111827,#1f2937)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(90deg,#111827,#1f2937)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Finish & Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function VoiceMicControl({ onStart, onStop, onStopEarly, phase }: { onStart: () => void; onStop: () => void; onStopEarly: () => void; phase: string }) {
  const isRecording = phase === "recording";
  const isAnalyzing = phase === "analyzing";
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
      {isRecording ? (
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
            boxShadow: "0 0 0 4px rgba(192,74,42,0.2)",
          }}
        >
          ⏹ STOP RECORDING
        </button>
      ) : (
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
            boxShadow: "0 4px 14px rgba(16,24,40,0.18)",
          }}
        >
          {phase === "idle"
            ? "🎙 START RECORDING"
            : phase === "analyzing"
              ? "⏳ ANALYZING..."
              : "🎙 RECORD AGAIN"}
        </button>
      )}
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
          borderRadius: 8,
        }}
      >
        Reset
      </button>
    </div>
  );
}

export default function Negotium() {
  const [phase, setPhase] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [metrics, setMetrics] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("analysis");
  const [waveData, setWaveData] = useState(new Array(80).fill(0.5));
  const [micError, setMicError] = useState("");
  const [theme, setTheme] = useState("light");
  const [spacingMode, setSpacingMode] = useState("airy");
  const [quizVisible, setQuizVisible] = useState(true);
  const [recNegTips, setRecNegTips] = useState([]);
  const [recCommTips, setRecCommTips] = useState([]);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef<number[]>([]);
  const silenceRef = useRef(0);
  const framesRef = useRef(0);
  const transcriptRef = useRef("");
  const recognitionRef = useRef<any>(null);
  const recordingStartRef = useRef<number>(0);

  const ringOffset = CIRCUMFERENCE * (timeLeft / DURATION);
  const isDark = theme === "dark";
  const c = {
    bg: isDark ? "#070707" : "#f7f7f8",
    panel: isDark ? "#0b0b0b" : "#ffffff",
    border: isDark ? "#1e1e1e" : "#e6e6e6",
    text: isDark ? "#e8e0d0" : "#0b0b0b",
    muted: "#9aa0a6",
    card: isDark ? "#0f0f0f" : "#ffffff",
    waveBg: isDark ? "#0d0d0b" : "#f4f4f5",
    waveEmpty: isDark ? "#2a2a26" : "#e0e0e0",
  };

  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
    try {
      audioCtxRef.current?.close();
    } catch (_) {}
  }, []);

  const analyzeVoice = useCallback(async () => {
    const vols = volumeRef.current;
    const avgVol = vols.reduce((a, b) => a + b, 0) / (vols.length || 1);
    const silRatio = silenceRef.current / (framesRef.current || 1);
    const volVar = getVariance(vols);
    const durationSeconds = Math.round((Date.now() - recordingStartRef.current) / 1000);
    const transcript = transcriptRef.current.trim();

    // Stop speech recognition
    try { recognitionRef.current?.stop(); } catch (_) {}

    if (!transcript || transcript.length < 5) {
      // Fallback: no transcript detected
      setMicError("Could not detect speech. Please speak clearly and try again. Make sure your browser supports speech recognition.");
      setPhase("idle");
      return;
    }

    setPhase("analyzing");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-voice", {
        body: {
          transcript,
          audioMetrics: {
            averageVolume: avgVol,
            silenceRatio: silRatio,
            volumeVariance: volVar,
            totalFrames: framesRef.current,
            durationSeconds,
          },
        },
      });

      if (error) {
        console.error("AI analysis error:", error);
        setMicError("AI analysis failed. Please try again.");
        setPhase("idle");
        return;
      }

      if (data?.error) {
        setMicError(data.error);
        setPhase("idle");
        return;
      }

      const { scores, analysis, tags, negotiationTips, communicationTips } = data;

      setMetrics({ pace: scores.pace, conf: scores.confidence, clar: scores.clarity, overall: scores.overall });
      setFeedback({
        overallTxt: analysis.overall,
        paceTxt: analysis.pace,
        toneTxt: analysis.tone,
        strengthTxt: analysis.strength,
        recTxt: analysis.recommendation,
        tags: tags.map((t: any) => ({ label: t.label, t: t.type })),
        transcript,
      });
      setRecNegTips(negotiationTips || []);
      setRecCommTips(communicationTips || []);
      setHistory((h: any) => [
        { overall: scores.overall, pace: scores.pace, conf: scores.confidence, clar: scores.clarity, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ...h.slice(0, 9),
      ]);
      setPhase("done");
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setMicError("Analysis failed. Please try again.");
      setPhase("idle");
    }
  }, []);

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

      // Start Web Speech API recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        let finalTranscript = "";
        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          transcriptRef.current = finalTranscript + interim;
        };
        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e.error);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.start();
      setPhase("recording");
      setTimeLeft(DURATION);
      setMetrics(null);
      setFeedback(null);

      const animate = () => {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        setWaveData(Array.from({ length: 80 }, (_, i) => data[Math.floor((i / 80) * data.length)] / 255));
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        const avg = sum / data.length;
        volumeRef.current.push(avg);
        if (avg < 3) silenceRef.current++;
        framesRef.current++;
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      let t = DURATION;
      timerRef.current = setInterval(() => {
        t--;
        setTimeLeft(t);
        if (t <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          mr.stop();
          try { stream.getTracks().forEach((tr) => tr.stop()); } catch (_) {}
          try { audioCtx.close(); } catch (_) {}
          try { recognitionRef.current?.stop(); } catch (_) {}
          setWaveData(new Array(80).fill(0.5));
          // Small delay for final speech recognition results
          setTimeout(() => analyzeVoice(), 1500);
        }
      }, 1000);
    } catch (e: any) {
      setMicError(e?.message || "Microphone access denied. Please allow mic access in your browser and try again.");
    }
  }, [analyzeVoice]);

  const reset = useCallback(() => {
    stopAll();
    try { recognitionRef.current?.stop(); } catch (_) {}
    transcriptRef.current = "";
    setPhase("idle");
    setTimeLeft(DURATION);
    setMetrics(null);
    setFeedback(null);
    setWaveData(new Array(80).fill(0.5));
    setMicError("");
  }, [stopAll]);

  const tagColor = (t) => (t === "pos" ? "#4a8c5c" : t === "warn" ? "#c97a2a" : "#c04a2a");
  const avgHistory = history.length ? Math.round(history.reduce((a, b) => a + b.overall, 0) / history.length) : null;
  const gap = spacingMode === "compact" ? 20 : 36;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        paddingBottom: 80,
      }}
    >
      {quizVisible && (
        <OnboardingQuiz
          onFinish={({ neg, comm }) => {
            setRecNegTips(neg);
            setRecCommTips(comm);
            setQuizVisible(false);
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          padding: "24px 28px",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: c.panel,
        }}
      >
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: c.text, letterSpacing: "0.05em" }}>NEGOTIUM</div>
          <div style={{ fontSize: 11, color: c.muted, letterSpacing: "0.14em" }}>Voice Intelligence Platform</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {avgHistory !== null && (
            <div style={{ textAlign: "right", marginRight: 4 }}>
              <div style={{ fontSize: 9, color: c.muted, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Avg Score
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.text }}>{avgHistory}</div>
            </div>
          )}
          {[
            [
              "theme",
              theme,
              setTheme,
              [
                ["light", "☀️ Light"],
                ["dark", "🌙 Dark"],
              ],
            ],
            [
              "spacing",
              spacingMode,
              setSpacingMode,
              [
                ["airy", "Airy"],
                ["compact", "Compact"],
              ],
            ],
          ].map(([label, val, setter, opts]: any) => (
            <select
              key={label}
              value={val}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: `1px solid ${c.border}`,
                background: c.panel,
                color: c.text,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {opts.map(([v, optLabel]: [string, string]) => (
                <option key={v} value={v}>
                  {optLabel}
                </option>
              ))}
            </select>
          ))}
          <button
            onClick={() => setQuizVisible(true)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${c.border}`,
              background: "none",
              color: c.muted,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            ⚙ Setup
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${c.border}`, background: c.panel }}>
        {["analysis", "history", "tips"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "14px",
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid #6b7280" : "2px solid transparent",
              color: tab === t ? c.text : c.muted,
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: tab === t ? 700 : 400,
              transition: "all 0.2s",
            }}
          >
            {t === "analysis" ? "🎙 Analysis" : t === "history" ? "📊 History" : "💡 Tips"}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: `${gap}px 20px` }}>
        {/* ── ANALYSIS TAB ── */}
        {tab === "analysis" && (
          <>
            <div style={{ textAlign: "center", marginBottom: gap }}>
              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(1.4rem,4vw,2.4rem)",
                  color: c.text,
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                Speak. <em style={{ color: "#6b7280" }}>Be Analyzed.</em>
              </div>
              <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase" }}>
                20 seconds · pace · tone · confidence · clarity
              </div>
            </div>

            {/* Waveform */}
            <div style={{ marginBottom: gap }}>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.25em",
                  color: c.muted,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
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
                  gap: 2,
                }}
              >
                {waveData.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: phase === "recording" ? "#6b7280" : c.waveEmpty,
                      height: `${Math.max(4, Math.abs(v - 0.5) * 160)}px`,
                      borderRadius: 2,
                      transition: "height 0.05s, background 0.3s",
                      opacity: phase === "recording" ? 0.5 + Math.abs(v - 0.5) : 0.5,
                    }}
                  />
                ))}
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
                      transition: "stroke-dashoffset 0.9s linear, stroke 0.3s",
                    }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: 48, fontWeight: 800, color: c.text, lineHeight: 1 }}>{timeLeft}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.3em", color: c.muted, textTransform: "uppercase" }}>
                    seconds
                  </div>
                  {phase === "recording" && (
                    <div
                      style={{
                        marginTop: 6,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#c04a2a",
                        animation: "pulse 1s infinite",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {phase === "recording" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 24 }}>
                {["Volume", "Pace", "Energy"].map((label, i) => {
                  const val = i === 0 ? Math.min(100, (volumeRef.current.slice(-1)[0] || 0) * 4) : i === 1 ? 70 : 60;
                  return (
                    <div
                      key={label}
                      style={{
                        background: c.card,
                        border: `1px solid ${c.border}`,
                        padding: "10px 12px",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          color: c.muted,
                          textTransform: "uppercase",
                          marginBottom: 6,
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ height: 3, background: c.border, borderRadius: 2 }}>
                        <div
                          style={{
                            height: "100%",
                            width: val + "%",
                            background: "#6b7280",
                            borderRadius: 2,
                            transition: "width 0.1s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <VoiceMicControl onStart={startRecording} onStop={reset} onStopEarly={() => { stopAll(); setWaveData(new Array(80).fill(0.5)); setTimeout(() => analyzeVoice(), 1500); }} phase={phase} />
            {micError && (
              <div style={{ textAlign: "center", fontSize: 11, color: "#c04a2a", marginBottom: 16, lineHeight: 1.6 }}>
                {micError}
              </div>
            )}
            {phase === "analyzing" && (
              <div style={{ textAlign: "center", fontSize: 11, color: c.muted, marginBottom: 24 }}>
                ⏳ AI is analyzing your speech patterns and transcript...
              </div>
            )}

            {phase === "done" && metrics && feedback && (
              <div style={{ animation: "fadeUp 0.5s ease", marginTop: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    marginBottom: 24,
                    background: c.card,
                    border: `1px solid ${c.border}`,
                    borderRadius: 10,
                    padding: "20px 10px",
                    boxShadow: "0 6px 24px rgba(16,24,40,0.06)",
                  }}
                >
                  <ScoreRing
                    score={metrics.overall}
                    label="Overall"
                    color={metrics.overall >= 80 ? "#4a8c5c" : metrics.overall >= 60 ? "#6b7280" : "#c04a2a"}
                  />
                  <ScoreRing score={metrics.pace} label="Pace" color="#6b7280" />
                  <ScoreRing score={metrics.conf} label="Confidence" color="#6b7280" />
                  <ScoreRing score={metrics.clar} label="Clarity" color="#6b7280" />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                  {feedback.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        border: `1px solid ${tagColor(tag.t)}`,
                        color: tagColor(tag.t),
                        borderRadius: 4,
                      }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>

                {feedback.transcript && (
                  <div
                    style={{
                      marginBottom: 10,
                      background: c.card,
                      border: `1px solid ${c.border}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      boxShadow: "0 4px 12px rgba(16,24,40,0.04)",
                    }}
                  >
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 6 }}>
                      Your Speech (Transcript)
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: c.text, fontStyle: "italic" }}>"{feedback.transcript}"</div>
                  </div>
                )}

                {[
                  { title: "Overall", text: feedback.overallTxt },
                  { title: "Pace & Rhythm", text: feedback.paceTxt },
                  { title: "Tone & Authority", text: feedback.toneTxt },
                  { title: "Vocal Consistency", text: feedback.strengthTxt },
                  { title: "Recommendation", text: feedback.recTxt },
                ].map(({ title, text }) => (
                  <div
                    key={title}
                    style={{
                      marginBottom: 10,
                      background: c.card,
                      border: `1px solid ${c.border}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      boxShadow: "0 4px 12px rgba(16,24,40,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.25em",
                        color: c.muted,
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      {title}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: c.text }}>{text}</div>
                  </div>
                ))}

                {[
                  { label: "Recommended Negotiation Tips", tips: recNegTips },
                  { label: "Recommended Communication Tips", tips: recCommTips },
                ].map(({ label, tips }) => (
                  <div key={label} style={{ marginTop: 16 }}>
                    <div
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.25em",
                        color: c.muted,
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {tips.map((t, i) => (
                        <div
                          key={i}
                          style={{
                            background: c.card,
                            border: `1px solid ${c.border}`,
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 12,
                            color: c.text,
                            lineHeight: 1.6,
                          }}
                        >
                          💬 {t}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.25em",
                color: c.muted,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Session History ({history.length} sessions)
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", color: c.muted, fontSize: 13, padding: "60px 0" }}>
                No sessions yet. Record your first session to see history.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map((entry, i) => (
                  <HistoryCard key={i} entry={entry} index={history.length - 1 - i} />
                ))}
              </div>
            )}
            {history.length > 1 && (
              <div
                style={{
                  marginTop: 20,
                  background: c.card,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.25em",
                    color: c.muted,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Progress Chart
                </div>
                <div style={{ display: "flex", gap: 2, height: 60, alignItems: "flex-end" }}>
                  {[...history].reverse().map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background: h.overall >= 80 ? "#4a8c5c" : h.overall >= 60 ? "#6b7280" : "#c04a2a",
                        height: `${h.overall}%`,
                        borderRadius: "2px 2px 0 0",
                        minWidth: 8,
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 9, color: c.muted, marginTop: 6 }}>
                  Each bar = one session (oldest → newest)
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TIPS TAB ── */}
        {tab === "tips" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              { label: "Negotiation Tips", tips: NEGOTIATION_TIPS },
              { label: "Communication Tips", tips: COMMUNICATION_TIPS },
            ].map(({ label, tips }) => (
              <div key={label}>
                <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 700, marginBottom: 10 }}>
                  {label} ({tips.length})
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {tips.map((tip, i) => (
                    <div
                      key={i}
                      style={{
                        background: c.card,
                        border: `1px solid ${c.border}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 13,
                        color: c.text,
                        lineHeight: 1.6,
                        boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
                      }}
                    >
                      <span style={{ color: "#6b7280", marginRight: 8, fontWeight: 700 }}>{i + 1}.</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
