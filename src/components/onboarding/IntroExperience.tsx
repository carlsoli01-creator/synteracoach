import { useState, useRef, useCallback, useEffect } from "react";
import { AILoader } from "@/components/ui/ai-loader";
import { supabase } from "@/integrations/supabase/client";
import { Power, BarChart3, Search, CheckCircle, Lock, Zap, Mic } from "lucide-react";

const INTRO_STEPS = [
  {
    icon: "mic",
    title: "Synterica",
    subtitle: "AI VOICE INTELLIGENCE",
    body: "We analyze how you speak — pace, tone, confidence, clarity, word choice — and deliver actionable coaching in real time.",
    cta: "Continue",
  },
  {
    icon: "chart",
    title: "Speak. Get Scored.",
    subtitle: "7-DIMENSION ANALYSIS",
    body: "Record 15 seconds to 5 minutes on any topic. Our AI scores your delivery across 7 dimensions and generates a comprehensive coaching report.",
    cta: "Try it now",
  },
];

function getVariance(arr: number[]) {
  if (!arr.length) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
}

function IntroAnalyzingWait() {
  const [elapsed, setElapsed] = useState(0);
  const estimatedTotal = Math.max(3, Math.round(10 * 0.12 + 4));
  const remaining = Math.max(0, estimatedTotal - elapsed);

  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(iv);
  }, []);

  return <AILoader text="Analyzing" estimatedSeconds={remaining} isDark={true} size={120} />;
}

interface IntroExperienceProps {
  onComplete: () => void;
  onForcePaywall: () => void;
}

type AnalysisResult = {
  scores: { overall: number; pace: number; confidence: number; clarity: number; delivery: number };
  analysis: { overall: string; strength: string; weakness: string; recommendation: string };
  fillerWords?: { count: number; words: string[] };
  powerWords?: string[];
} | null;

export default function IntroExperience({ onComplete, onForcePaywall }: IntroExperienceProps) {
  const [step, setStep] = useState(0);
  const [testPhase, setTestPhase] = useState<"idle" | "recording" | "analyzing" | "done">("idle");
  const [transitioning, setTransitioning] = useState(false);
  const [waveData, setWaveData] = useState(new Array(40).fill(0.5));
  const [timeLeft, setTimeLeft] = useState(10);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
  const [micError, setMicError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");
  const recognitionRef = useRef<any>(null);
  const volumeRef = useRef<number[]>([]);
  const silenceRef = useRef(0);
  const framesRef = useRef(0);
  const recordingStartRef = useRef(0);
  const isAnalyzingRef = useRef(false);

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

  useEffect(() => () => stopAll(), [stopAll]);

  const goNext = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setTransitioning(false);
    }, 400);
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
      setAnalysisResult({
        scores: { overall: 12, pace: 10, confidence: 12, clarity: 10, delivery: 12 },
        analysis: {
          overall: "We didn't pick up enough speech to analyze. This could be a mic issue or low volume — try speaking a bit louder next time.",
          strength: "You showed up and pressed record — that's the first step. Most people never get this far.",
          weakness: "We need more audio to give you meaningful feedback. Make sure your mic is working and speak at a normal volume.",
          recommendation: "Try again — speak naturally for the full 10 seconds. Even a simple self-introduction will give us enough to score you properly.",
        },
        fillerWords: { count: 0, words: [] },
        powerWords: [],
      });
      setTestPhase("done");
      isAnalyzingRef.current = false;
      return;
    }

    setTestPhase("analyzing");

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

      if (error || data?.error) {
        setAnalysisResult({
          scores: { overall: 30, pace: 28, confidence: 30, clarity: 32, delivery: 28 },
          analysis: {
            overall: "We ran into a processing issue. This sometimes happens with shorter recordings or background noise — don't worry, the full app handles this much better.",
            strength: "You completed a recording, which is a great start. That takes more courage than most people realize.",
            weakness: "The audio quality may have been low, or there was too much background noise for accurate analysis.",
            recommendation: "Head into the full app for a better experience — longer recordings with clearer audio give dramatically better results.",
          },
        });
      } else {
        setAnalysisResult(data);
      }
      setTestPhase("done");
    } catch {
      setAnalysisResult({
        scores: { overall: 25, pace: 22, confidence: 25, clarity: 24, delivery: 22 },
        analysis: {
          overall: "Something went wrong on our end — this wasn't your fault. First recordings are always a learning experience, and the full app will give you much more detailed coaching.",
          strength: "You took the first step and recorded yourself. That alone puts you ahead of most people.",
          weakness: "We hit a technical issue processing this recording. The full app is much more reliable.",
          recommendation: "Jump into the main dashboard and try a full session — you'll get detailed scoring across all 7 dimensions.",
        },
      });
      setTestPhase("done");
    } finally {
      if (analysisTimeoutRef.current) { clearTimeout(analysisTimeoutRef.current); analysisTimeoutRef.current = null; }
      isAnalyzingRef.current = false;
    }
  }, []);

  const scheduleAnalyze = useCallback(() => {
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    analysisTimeoutRef.current = setTimeout(() => { void analyzeVoice(); }, 1500);
  }, [analyzeVoice]);

  const startTest = useCallback(async () => {
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

      // Start speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 3;
        let finalTranscript = "";
        let isRecognitionActive = true;
        let isRecognitionRunning = false;

        const safeRestart = () => {
          if (!isRecognitionActive || isRecognitionRunning) return;
          try { recognition.start(); } catch (_) {}
        };

        recognition.onstart = () => { isRecognitionRunning = true; };
        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              let bestAlt = event.results[i][0];
              for (let j = 1; j < event.results[i].length; j++) {
                if (event.results[i][j].confidence > bestAlt.confidence) bestAlt = event.results[i][j];
              }
              finalTranscript += bestAlt.transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          transcriptRef.current = finalTranscript + interim;
        };
        recognition.onerror = (e: any) => {
          isRecognitionRunning = false;
          if (e.error === "network" || e.error === "aborted" || e.error === "no-speech") {
            setTimeout(safeRestart, 300);
          }
        };
        recognition.onend = () => {
          isRecognitionRunning = false;
          setTimeout(safeRestart, 200);
        };
        recognition.start();
        recognitionRef.current = recognition;
        (recognitionRef.current as any)._stopAutoRestart = () => { isRecognitionActive = false; };
      }

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.start();
      setTestPhase("recording");
      setTimeLeft(10);

      const animate = () => {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        setWaveData(Array.from({ length: 40 }, (_, i) => data[Math.floor(i / 40 * data.length)] / 255));
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        const avg = sum / data.length;
        volumeRef.current.push(avg);
        if (avg < 3) silenceRef.current++;
        framesRef.current++;
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      let t = 10;
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
          setWaveData(new Array(40).fill(0.5));
          scheduleAnalyze();
        }
      }, 1000);
    } catch (e: any) {
      setMicError(e?.message || "Microphone access denied.");
    }
  }, [scheduleAnalyze]);

  const stopEarly = useCallback(() => {
    if (testPhase !== "recording") return;
    stopAll();
    setWaveData(new Array(40).fill(0.5));
    setTestPhase("analyzing");
    scheduleAnalyze();
  }, [testPhase, stopAll, scheduleAnalyze]);

  // When done, fade out cleanly then trigger paywall
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    if (testPhase === "done" && analysisResult) {
      const fadeTimer = setTimeout(() => setExiting(true), 3500);
      const doneTimer = setTimeout(() => onForcePaywall(), 4200);
      return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
    }
  }, [testPhase, analysisResult, onForcePaywall]);

  const scoreColor = (s: number) => s >= 75 ? "#4a8c5c" : s >= 50 ? "#c97a2a" : "#c04a2a";

  // Intro message steps
  if (step < INTRO_STEPS.length) {
    const s = INTRO_STEPS[step];
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 70,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#050505",
      }}>
        {/* Subtle grid texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div style={{
          position: "relative", width: "min(480px, 88vw)", padding: "72px 40px", textAlign: "center",
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(12px) scale(0.98)" : "translateY(0) scale(1)",
          transition: "opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1)",
        }}>
          <div style={{ marginBottom: 32 }}>
            {s.icon === "mic"
              ? <Mic size={28} color="#fff" strokeWidth={1.5} />
              : <BarChart3 size={28} color="#fff" strokeWidth={1.5} />
            }
          </div>
          <div style={{
            fontSize: 9, letterSpacing: "0.5em", color: "#555", textTransform: "uppercase",
            marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500,
          }}>{s.subtitle}</div>
          <div style={{
            fontSize: 48, fontWeight: 400, color: "#fff", lineHeight: 1.05,
            letterSpacing: "0.04em", marginBottom: 24,
            fontFamily: "'Bebas Neue', sans-serif",
          }}>{s.title}</div>
          <div style={{
            fontSize: 13, color: "#777", lineHeight: 1.9, maxWidth: 360, margin: "0 auto 48px",
            fontFamily: "'IBM Plex Mono', monospace", fontWeight: 400,
          }}>{s.body}</div>
          <button onClick={goNext} style={{
            padding: "14px 44px", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
            background: "#fff", color: "#000", border: "none", borderRadius: 0, cursor: "pointer",
            transition: "all 0.25s", fontFamily: "'IBM Plex Mono', monospace",
          }}>{s.cta}</button>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 40 }}>
            {INTRO_STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 28 : 6, height: 2,
                background: i === step ? "#fff" : "#333", transition: "all 0.4s",
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Test recording step
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#000",
      opacity: exiting ? 0 : 1,
      transition: "opacity 0.7s ease",
    }}>
      <div style={{
        width: "min(520px, 92vw)", padding: "60px 40px", textAlign: "center",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {testPhase === "idle" && (
          <>
            <div style={{ marginBottom: 32 }}><Mic size={28} color="#fff" strokeWidth={1.5} /></div>
            <div style={{ fontSize: 9, letterSpacing: "0.5em", color: "#555", textTransform: "uppercase", marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>VOICE TEST</div>
            <div style={{ fontSize: 44, fontWeight: 400, color: "#fff", lineHeight: 1.05, letterSpacing: "0.04em", marginBottom: 20, fontFamily: "'Bebas Neue', sans-serif" }}>Say Anything.</div>
            <div style={{ fontSize: 13, color: "#666", lineHeight: 1.8, maxWidth: 340, margin: "0 auto 40px", fontFamily: "'IBM Plex Mono', monospace" }}>10 seconds. Any topic. We'll show you what our analysis looks like.</div>
            <button onClick={startTest} style={{
              padding: "14px 44px", fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
              background: "#fff", color: "#000", border: "none", borderRadius: 0, cursor: "pointer",
              transition: "all 0.25s", fontFamily: "'IBM Plex Mono', monospace",
            }}>Begin Recording</button>
            {micError && <div style={{ marginTop: 16, fontSize: 11, color: "#c04a2a", fontFamily: "'IBM Plex Mono', monospace" }}>{micError}</div>}
          </>
        )}

        {testPhase === "recording" && (
          <>
            <div style={{ fontSize: 72, fontWeight: 400, color: "#fff", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", marginBottom: 4 }}>{timeLeft}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.5em", color: "#555", textTransform: "uppercase", marginBottom: 36, fontFamily: "'IBM Plex Mono', monospace" }}>SECONDS</div>
            <div style={{ height: 48, display: "flex", alignItems: "center", gap: 2, justifyContent: "center", marginBottom: 36 }}>
              {waveData.map((v, i) => (
                <div key={i} style={{
                  width: 2, background: "#fff",
                  height: `${Math.max(3, Math.abs(v - 0.5) * 100)}px`,
                  opacity: 0.3 + Math.abs(v - 0.5) * 0.7, transition: "height 0.05s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 }}>
              <div style={{ width: 6, height: 6, background: "#fff", animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 9, letterSpacing: "0.3em", color: "#666", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>RECORDING</span>
            </div>
            <button onClick={stopEarly} style={{
              padding: "10px 28px", fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase",
              background: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: 0, cursor: "pointer",
              transition: "all 0.25s", fontFamily: "'IBM Plex Mono', monospace",
            }}>Stop</button>
          </>
        )}

        {testPhase === "analyzing" && (
          <IntroAnalyzingWait />
        )}

        {testPhase === "done" && analysisResult && (
          <>
            <div style={{ marginBottom: 24 }}><CheckCircle size={24} color="#fff" strokeWidth={1.5} /></div>
            <div style={{ fontSize: 36, fontWeight: 400, color: "#fff", lineHeight: 1.05, letterSpacing: "0.04em", marginBottom: 12, fontFamily: "'Bebas Neue', sans-serif" }}>Your Analysis</div>
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 28px", fontFamily: "'IBM Plex Mono', monospace" }}>Premium unlocks the full 7-dimension breakdown.</div>

            {/* Score card */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 0, padding: "28px 24px", textAlign: "left", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56,
                  border: `2px solid ${scoreColor(analysisResult.scores.overall)}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, fontWeight: 400, color: "#fff", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em",
                }}>{analysisResult.scores.overall}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#fff", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>Overall</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {analysisResult.scores.overall >= 80 ? "Strong start" : analysisResult.scores.overall >= 60 ? "Decent foundation" : analysisResult.scores.overall >= 40 ? "Room to grow" : "Building from here"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Pace", score: analysisResult.scores.pace },
                  { label: "Clarity", score: analysisResult.scores.clarity },
                  { label: "Confidence", score: analysisResult.scores.confidence },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#111", padding: "14px 10px", textAlign: "center", border: "1px solid #1a1a1a" }}>
                    <div style={{ fontSize: 22, fontWeight: 400, color: scoreColor(s.score), fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>{s.score}</div>
                    <div style={{ fontSize: 8, letterSpacing: "0.3em", color: "#444", marginTop: 4, textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#111", padding: "16px", border: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 8, letterSpacing: "0.4em", color: "#444", textTransform: "uppercase", marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>AI INSIGHT</div>
                <div style={{ fontSize: 12, color: "#999", lineHeight: 1.8, fontFamily: "'IBM Plex Mono', monospace" }}>{analysisResult.analysis.overall}</div>
              </div>

              {analysisResult.analysis.strength && (
                <div style={{ background: "#111", padding: "16px", border: "1px solid #1a1a1a", marginTop: 10 }}>
                  <div style={{ fontSize: 8, letterSpacing: "0.4em", color: "#4a8c5c", textTransform: "uppercase", marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>STRENGTH</div>
                  <div style={{ fontSize: 12, color: "#999", lineHeight: 1.8, fontFamily: "'IBM Plex Mono', monospace" }}>{analysisResult.analysis.strength}</div>
                </div>
              )}
            </div>

            {/* Blurred locked teaser */}
            <div style={{ position: "relative", overflow: "hidden", marginBottom: 16 }}>
              <div style={{
                filter: "blur(6px)", opacity: 0.4, pointerEvents: "none",
                background: "#0a0a0a", padding: "16px",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
              }}>
                {["Persuasion", "Word Choice", "Filler Words", "Techniques"].map((l, i) => (
                  <div key={i} style={{ background: "#111", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 400, color: "#fff", fontFamily: "'Bebas Neue', sans-serif" }}>{analysisResult.scores.delivery - 5 + i * 3}</div>
                    <div style={{ fontSize: 7, color: "#555", textTransform: "uppercase", letterSpacing: "0.3em", fontFamily: "'IBM Plex Mono', monospace" }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 500, color: "#fff", letterSpacing: "0.3em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace" }}><Lock size={10} /> PREMIUM</span>
              </div>
            </div>

            <div style={{ fontSize: 10, color: "#333", textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>Loading upgrade options…</div>
            <div style={{ marginTop: 16, width: 20, height: 20, border: "1px solid #333", borderTop: "1px solid #fff", animation: "spin 0.8s linear infinite", margin: "16px auto 0" }} />
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
