import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mic, BarChart3, Search, CheckCircle, Lock, Zap } from "lucide-react";

const INTRO_STEPS = [
  {
    icon: "mic",
    title: "Welcome to Syntera",
    subtitle: "YOUR AI VOICE COACH",
    body: "Syntera listens to how you speak — not just what you say. We analyze pace, tone, confidence, clarity, and word choice to give you actionable coaching in real time.",
    cta: "How it works →",
  },
  {
    icon: "chart",
    title: "Speak. Get Scored.",
    subtitle: "REAL-TIME ANALYSIS",
    body: "Record yourself for 15–45 seconds on any topic. Our AI breaks down your delivery into 7 dimensions — from filler words to persuasion power — and gives you a comprehensive report.",
    cta: "Let's try it →",
  },
];

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef("");
  const recognitionRef = useRef<any>(null);
  const volumeRef = useRef<number[]>([]);
  const silenceRef = useRef(0);
  const framesRef = useRef(0);
  const recordingStartRef = useRef(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    try { (recognitionRef.current as any)?._stopAutoRestart?.(); } catch (_) {}
    try { recognitionRef.current?.stop(); } catch (_) {}
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
    try { audioCtxRef.current?.close(); } catch (_) {}
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const goNext = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setTransitioning(false);
    }, 400);
  }, []);

  const runAnalysis = useCallback(async () => {
    const transcript = transcriptRef.current.trim();
    const durationSeconds = Math.round((Date.now() - recordingStartRef.current) / 1000);
    const vols = volumeRef.current;
    const avgVol = vols.reduce((a, b) => a + b, 0) / (vols.length || 1);
    const silRatio = silenceRef.current / (framesRef.current || 1);
    const mean = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0;
    const volVar = vols.length ? vols.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vols.length : 0;

    if (!transcript || transcript.length < 3) {
      setAnalysisResult({
        scores: { overall: 10, pace: 8, confidence: 10, clarity: 12, delivery: 10 },
        analysis: {
          overall: "We detected almost no speech. In any real conversation, silence signals disengagement or lack of preparation. This needs serious work.",
          strength: "You attempted the exercise — but showing up alone doesn't count for much.",
          weakness: "Without audible, clear words, there is literally nothing to coach. This is a 10/100.",
          recommendation: "Speak clearly into the mic for at least 5 seconds. Even a single confident sentence would score dramatically higher than silence.",
        },
        fillerWords: { count: 0, words: [] },
        powerWords: [],
      });
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
          scores: { overall: 35, pace: 30, confidence: 32, clarity: 38, delivery: 34 },
          analysis: {
            overall: "Analysis hit a processing issue, but based on what we captured — there's work to do. Most first recordings are rough.",
            strength: "You completed the recording, which puts you ahead of people who never try.",
            weakness: "We couldn't fully process this, so we can't identify specific weaknesses yet.",
            recommendation: "Record again in the main app. The full analysis will give you specific, honest feedback.",
          },
        });
      } else {
        setAnalysisResult(data);
      }
    } catch {
      setAnalysisResult({
        scores: { overall: 30, pace: 28, confidence: 32, clarity: 30, delivery: 28 },
        analysis: {
          overall: "Something went wrong processing your speech. But honestly, most first attempts score low anyway — the real question is whether you'll come back and improve.",
          strength: "You tried. That's step one.",
          weakness: "We couldn't process this recording to give specific critique.",
          recommendation: "Try again in the main dashboard for a full, unsparing analysis.",
        },
      });
    }
  }, []);

  const finishRecording = useCallback(() => {
    cleanup();
    setTransitioning(true);
    setTimeout(() => {
      setWaveData(new Array(40).fill(0.5));
      setTransitioning(false);
      void runAnalysis();
    }, 400);
  }, [cleanup, runAnalysis]);

  const startTest = useCallback(async () => {
    setTransitioning(true);
    setTimeout(() => setTransitioning(false), 400);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      volumeRef.current = [];
      silenceRef.current = 0;
      framesRef.current = 0;
      recordingStartRef.current = Date.now();
      transcriptRef.current = "";

      // Start speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 3;
        let finalTranscript = "";
        let isActive = true;

        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              let best = event.results[i][0];
              for (let j = 1; j < event.results[i].length; j++) {
                if (event.results[i][j].confidence > best.confidence) best = event.results[i][j];
              }
              finalTranscript += best.transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          transcriptRef.current = finalTranscript + interim;
        };
        recognition.onerror = (e: any) => {
          if (isActive && ["network", "aborted", "no-speech"].includes(e.error)) {
            setTimeout(() => { if (isActive) try { recognition.start(); } catch (_) {} }, 300);
          }
        };
        recognition.onend = () => {
          if (isActive) setTimeout(() => { if (isActive) try { recognition.start(); } catch (_) {} }, 200);
        };
        recognition.start();
        recognitionRef.current = recognition;
        (recognitionRef.current as any)._stopAutoRestart = () => { isActive = false; };
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
        if (t <= 0) finishRecording();
      }, 1000);
    } catch (_) {
      // Mic denied — run analysis with empty transcript
      void runAnalysis();
    }
  }, [finishRecording, runAnalysis]);

  const stopEarly = useCallback(() => finishRecording(), [finishRecording]);

  // When analysis is done, set phase to done
  useEffect(() => {
    if (analysisResult && testPhase === "analyzing") {
      setTestPhase("done");
    }
  }, [analysisResult, testPhase]);

  // When done, trigger paywall after a brief moment
  useEffect(() => {
    if (testPhase === "done" && analysisResult) {
      const timer = setTimeout(() => onForcePaywall(), 4000);
      return () => clearTimeout(timer);
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
        background: "#000",
      }}>
        <div style={{
          width: "min(520px, 92vw)", padding: "60px 40px", textAlign: "center",
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(16px)" : "translateY(0)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}>
          <div style={{ marginBottom: 24 }}>{s.icon === "mic" ? <Mic size={48} color="#fff" /> : <BarChart3 size={48} color="#fff" />}</div>
          <div style={{ fontSize: 10, letterSpacing: "0.4em", color: "#666", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>{s.subtitle}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>{s.title}</div>
          <div style={{ fontSize: 14, color: "#999", lineHeight: 1.9, maxWidth: 380, margin: "0 auto 40px", letterSpacing: "0.01em" }}>{s.body}</div>
          <button onClick={goNext} style={{
            padding: "16px 48px", fontSize: 14, fontWeight: 800, letterSpacing: "0.06em",
            background: "#fff", color: "#000", border: "none", borderRadius: 10, cursor: "pointer",
            transition: "all 0.2s", boxShadow: "0 0 40px rgba(255,255,255,0.15)",
          }}>{s.cta}</button>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
            {INTRO_STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                background: i === step ? "#fff" : "#333", transition: "all 0.3s",
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
    }}>
      <div style={{
        width: "min(520px, 92vw)", padding: "60px 40px", textAlign: "center",
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? "translateY(16px)" : "translateY(0)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {testPhase === "idle" && (
          <>
            <div style={{ marginBottom: 24 }}><Mic size={48} color="#fff" /></div>
            <div style={{ fontSize: 10, letterSpacing: "0.4em", color: "#666", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>YOUR FIRST TEST</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>Say anything for 10 seconds.</div>
            <div style={{ fontSize: 13, color: "#666", lineHeight: 1.8, maxWidth: 340, margin: "0 auto 36px" }}>Introduce yourself, read something aloud, or just talk freely. We'll show you how the analysis works.</div>
            <button onClick={startTest} style={{
              padding: "16px 48px", fontSize: 14, fontWeight: 800, letterSpacing: "0.06em",
              background: "#fff", color: "#000", border: "none", borderRadius: 10, cursor: "pointer",
              boxShadow: "0 0 40px rgba(255,255,255,0.15)", transition: "all 0.2s",
            }}>🎙️ Start Recording</button>
          </>
        )}

        {testPhase === "recording" && (
          <>
            <div style={{ fontSize: 64, fontWeight: 900, color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", marginBottom: 8 }}>{timeLeft}</div>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#666", textTransform: "uppercase", marginBottom: 32 }}>SECONDS REMAINING</div>
            <div style={{ height: 60, display: "flex", alignItems: "center", gap: 3, justifyContent: "center", marginBottom: 32 }}>
              {waveData.map((v, i) => (
                <div key={i} style={{
                  width: 3, borderRadius: 2, background: "#fff",
                  height: `${Math.max(4, Math.abs(v - 0.5) * 120)}px`,
                  opacity: 0.4 + Math.abs(v - 0.5), transition: "height 0.05s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 11, letterSpacing: "0.2em", color: "#999", textTransform: "uppercase" }}>RECORDING</span>
            </div>
            <button onClick={stopEarly} style={{
              padding: "12px 32px", fontSize: 13, fontWeight: 700,
              background: "transparent", color: "#666", border: "1px solid #333", borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
            }}>Stop Early</button>
          </>
        )}

        {testPhase === "analyzing" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🔍</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 12, fontFamily: "'Inter', system-ui, sans-serif" }}>Analyzing your speech...</div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 28px" }}>Our AI is breaking down your delivery across multiple dimensions.</div>
            <div style={{ width: 24, height: 24, border: "2px solid #333", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          </>
        )}

        {testPhase === "done" && analysisResult && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 8, fontFamily: "'Inter', system-ui, sans-serif" }}>Your Real Analysis</div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 28px" }}>Premium unlocks the full 7-dimension breakdown with personalized coaching.</div>

            {/* Real score card */}
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 14, padding: "28px 24px", textAlign: "left", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  border: `3px solid ${scoreColor(analysisResult.scores.overall)}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Inter', system-ui, sans-serif",
                }}>{analysisResult.scores.overall}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Overall Score</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                    {analysisResult.scores.overall >= 80 ? "Strong delivery — rare for a first try" : analysisResult.scores.overall >= 60 ? "Decent — but decent doesn't win deals" : analysisResult.scores.overall >= 40 ? "Below average — significant room for improvement" : "Rough start — this is why you need coaching"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Pace", score: analysisResult.scores.pace },
                  { label: "Clarity", score: analysisResult.scores.clarity },
                  { label: "Confidence", score: analysisResult.scores.confidence },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#0a0a0a", borderRadius: 10, padding: "14px 12px", textAlign: "center", border: "1px solid #1a1a1a" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor(s.score) }}>{s.score}</div>
                    <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#555", marginTop: 4, textTransform: "uppercase" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Real AI insight */}
              <div style={{ background: "#0a0a0a", borderRadius: 10, padding: "16px", border: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#555", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>AI INSIGHT</div>
                <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>{analysisResult.analysis.overall}</div>
              </div>

              {/* Strength */}
              {analysisResult.analysis.strength && (
                <div style={{ background: "#0a0a0a", borderRadius: 10, padding: "16px", border: "1px solid #1a1a1a", marginTop: 12 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#4a8c5c", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>💪 STRENGTH</div>
                  <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>{analysisResult.analysis.strength}</div>
                </div>
              )}
            </div>

            {/* Blurred locked teaser */}
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
              <div style={{
                filter: "blur(6px)", opacity: 0.4, pointerEvents: "none",
                background: "#111", padding: "16px", borderRadius: 10,
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
              }}>
                {["Persuasion", "Word Choice", "Filler Words", "Techniques"].map((l, i) => (
                  <div key={i} style={{ background: "#0a0a0a", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{analysisResult.scores.delivery - 5 + i * 3}</div>
                    <div style={{ fontSize: 8, color: "#666", textTransform: "uppercase", letterSpacing: "0.15em" }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase" }}>🔒 UNLOCK WITH PREMIUM</span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#444", textAlign: "center" }}>Loading your upgrade options...</div>
            <div style={{ marginTop: 16, width: 24, height: 24, border: "2px solid #333", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "16px auto 0" }} />
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
