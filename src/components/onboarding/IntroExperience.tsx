import { useState, useRef, useCallback, useEffect } from "react";

const INTRO_STEPS = [
  {
    emoji: "🎙️",
    title: "Welcome to Syntera",
    subtitle: "YOUR AI VOICE COACH",
    body: "Syntera listens to how you speak — not just what you say. We analyze pace, tone, confidence, clarity, and word choice to give you actionable coaching in real time.",
    cta: "How it works →",
  },
  {
    emoji: "📊",
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

export default function IntroExperience({ onComplete, onForcePaywall }: IntroExperienceProps) {
  const [step, setStep] = useState(0);
  const [testPhase, setTestPhase] = useState<"idle" | "recording" | "done">("idle");
  const [transitioning, setTransitioning] = useState(false);
  const [waveData, setWaveData] = useState(new Array(40).fill(0.5));
  const [timeLeft, setTimeLeft] = useState(10);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.start();
      setTestPhase("recording");
      setTimeLeft(10);

      const animate = () => {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        setWaveData(Array.from({ length: 40 }, (_, i) => data[Math.floor(i / 40 * data.length)] / 255));
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      let t = 10;
      timerRef.current = setInterval(() => {
        t--;
        setTimeLeft(t);
        if (t <= 0) {
          cleanup();
          setTransitioning(true);
          setTimeout(() => {
            setWaveData(new Array(40).fill(0.5));
            setTestPhase("done");
            setTransitioning(false);
          }, 400);
        }
      }, 1000);
    } catch (_) {
      // If mic denied, skip to done
      setTestPhase("done");
    }
  }, [cleanup]);

  const stopEarly = useCallback(() => {
    cleanup();
    setTransitioning(true);
    setTimeout(() => {
      setWaveData(new Array(40).fill(0.5));
      setTestPhase("done");
      setTransitioning(false);
    }, 400);
  }, [cleanup]);

  // When test is done, show paywall after a brief moment
  useEffect(() => {
    if (testPhase === "done") {
      const timer = setTimeout(() => {
        onForcePaywall();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [testPhase, onForcePaywall]);

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
          width: "min(520px, 92vw)",
          padding: "60px 40px",
          textAlign: "center",
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(16px)" : "translateY(0)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>{s.emoji}</div>
          <div style={{
            fontSize: 10, letterSpacing: "0.4em", color: "#666",
            textTransform: "uppercase", marginBottom: 16, fontWeight: 700,
          }}>
            {s.subtitle}
          </div>
          <div style={{
            fontSize: 32, fontWeight: 900, color: "#fff",
            lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 20,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            {s.title}
          </div>
          <div style={{
            fontSize: 14, color: "#999", lineHeight: 1.9,
            maxWidth: 380, margin: "0 auto 40px",
            letterSpacing: "0.01em",
          }}>
            {s.body}
          </div>
          <button
            onClick={goNext}
            style={{
              padding: "16px 48px", fontSize: 14, fontWeight: 800,
              letterSpacing: "0.06em",
              background: "#fff", color: "#000",
              border: "none", borderRadius: 10, cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 0 40px rgba(255,255,255,0.15)",
            }}
          >
            {s.cta}
          </button>
          <div style={{
            display: "flex", justifyContent: "center", gap: 8, marginTop: 32,
          }}>
            {INTRO_STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 24 : 8, height: 8,
                borderRadius: 4,
                background: i === step ? "#fff" : "#333",
                transition: "all 0.3s",
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
        width: "min(520px, 92vw)",
        padding: "60px 40px",
        textAlign: "center",
        animation: "fadeUp 0.5s ease",
      }}>
        {testPhase === "idle" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 24 }}>🎤</div>
            <div style={{
              fontSize: 10, letterSpacing: "0.4em", color: "#666",
              textTransform: "uppercase", marginBottom: 16, fontWeight: 700,
            }}>
              YOUR FIRST TEST
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: "#fff",
              lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              Say anything for 10 seconds.
            </div>
            <div style={{
              fontSize: 13, color: "#666", lineHeight: 1.8,
              maxWidth: 340, margin: "0 auto 36px",
            }}>
              Introduce yourself, read something aloud, or just talk freely. We'll show you how the analysis works.
            </div>
            <button
              onClick={startTest}
              style={{
                padding: "16px 48px", fontSize: 14, fontWeight: 800,
                letterSpacing: "0.06em",
                background: "#fff", color: "#000",
                border: "none", borderRadius: 10, cursor: "pointer",
                boxShadow: "0 0 40px rgba(255,255,255,0.15)",
                transition: "all 0.2s",
              }}
            >
              🎙️ Start Recording
            </button>
          </>
        )}

        {testPhase === "recording" && (
          <>
            <div style={{
              fontSize: 64, fontWeight: 900, color: "#fff",
              fontFamily: "'Inter', system-ui, sans-serif",
              marginBottom: 8,
            }}>
              {timeLeft}
            </div>
            <div style={{
              fontSize: 10, letterSpacing: "0.3em", color: "#666",
              textTransform: "uppercase", marginBottom: 32,
            }}>
              SECONDS REMAINING
            </div>

            {/* Mini waveform */}
            <div style={{
              height: 60, display: "flex", alignItems: "center",
              gap: 3, justifyContent: "center", marginBottom: 32,
            }}>
              {waveData.map((v, i) => (
                <div
                  key={i}
                  style={{
                    width: 3, borderRadius: 2,
                    background: "#fff",
                    height: `${Math.max(4, Math.abs(v - 0.5) * 120)}px`,
                    opacity: 0.4 + Math.abs(v - 0.5),
                    transition: "height 0.05s",
                  }}
                />
              ))}
            </div>

            {/* Recording indicator */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, marginBottom: 28,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#fff",
                animation: "pulse 1s infinite",
              }} />
              <span style={{
                fontSize: 11, letterSpacing: "0.2em", color: "#999",
                textTransform: "uppercase",
              }}>
                RECORDING
              </span>
            </div>

            <button
              onClick={stopEarly}
              style={{
                padding: "12px 32px", fontSize: 13, fontWeight: 700,
                background: "transparent", color: "#666",
                border: "1px solid #333", borderRadius: 8, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Stop Early
            </button>
          </>
        )}

        {testPhase === "done" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <div style={{
              fontSize: 24, fontWeight: 900, color: "#fff",
              lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 8,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              Here's a taste of your analysis.
            </div>
            <div style={{
              fontSize: 12, color: "#666", lineHeight: 1.7,
              maxWidth: 340, margin: "0 auto 28px",
            }}>
              Premium unlocks the full 7-dimension breakdown with personalized coaching.
            </div>

            {/* Preview score card */}
            <div style={{
              background: "#111", border: "1px solid #222", borderRadius: 14,
              padding: "28px 24px", textAlign: "left", marginBottom: 24,
            }}>
              {/* Overall score */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  border: "3px solid #fff", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "#fff",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  72
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Overall Score</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Good foundation — room to sharpen</div>
                </div>
              </div>

              {/* Mini scores row */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20,
              }}>
                {[
                  { label: "Pace", score: 68 },
                  { label: "Clarity", score: 74 },
                  { label: "Confidence", score: 71 },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: "#0a0a0a", borderRadius: 10, padding: "14px 12px",
                    textAlign: "center", border: "1px solid #1a1a1a",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{s.score}</div>
                    <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#555", marginTop: 4, textTransform: "uppercase" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Insight */}
              <div style={{
                background: "#0a0a0a", borderRadius: 10, padding: "16px",
                border: "1px solid #1a1a1a",
              }}>
                <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#555", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>
                  AI INSIGHT
                </div>
                <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>
                  Your delivery has a natural confidence to it. Focus on reducing filler words and varying your pace to keep listeners engaged throughout.
                </div>
              </div>
            </div>

            {/* Blurred locked teaser */}
            <div style={{
              position: "relative", borderRadius: 10, overflow: "hidden",
              marginBottom: 16,
            }}>
              <div style={{
                filter: "blur(6px)", opacity: 0.4, pointerEvents: "none",
                background: "#111", padding: "16px", borderRadius: 10,
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
              }}>
                {["Persuasion", "Word Choice", "Filler Words", "Techniques"].map((l, i) => (
                  <div key={i} style={{ background: "#0a0a0a", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{60 + i * 5}</div>
                    <div style={{ fontSize: 8, color: "#666", textTransform: "uppercase", letterSpacing: "0.15em" }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  🔒 UNLOCK WITH PREMIUM
                </span>
              </div>
            </div>

            <div style={{
              fontSize: 11, color: "#444", textAlign: "center",
            }}>
              Loading your upgrade options...
            </div>
            <div style={{
              marginTop: 16,
              width: 24, height: 24,
              border: "2px solid #333",
              borderTop: "2px solid #fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "16px auto 0",
            }} />
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
