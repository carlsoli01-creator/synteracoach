import { useState, useEffect, useRef } from "react";

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

const QUESTIONS = [
  {
    id: "goal",
    q: "What do you most want to improve?",
    options: ["Confidence", "Pace & Rhythm", "Clarity", "Cut filler words", "Persuasion"],
  },
  {
    id: "context",
    q: "Where do you speak most?",
    options: ["Job interviews", "Sales calls", "Presentations", "Meetings", "Everyday convos"],
  },
  {
    id: "nerves",
    q: "How nervous do you get speaking?",
    options: ["Very nervous", "Somewhat nervous", "A little", "Rarely", "Never"],
  },
  {
    id: "filler",
    q: "How often do you use filler words?",
    options: ["Constantly", "Often", "Sometimes", "Rarely", "Never"],
  },
  {
    id: "goalType",
    q: "What result matters most to you?",
    options: ["Close deals", "Command respect", "Be concise", "Sound natural", "Inspire others"],
  },
];

interface Props {
  onFinish: (answers: Record<string, string>) => void;
}

export default function MobileQuizAndInstall({ onFinish }: Props) {
  const [step, setStep] = useState(0); // 0..QUESTIONS.length-1 = quiz, then "install" or "done"
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"quiz" | "install" | "done">("quiz");
  const [selected, setSelected] = useState<string | null>(null);
  const [animIn, setAnimIn] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const mobile = isMobileDevice();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
  const containerRef = useRef<HTMLDivElement>(null);

  // Capture the PWA install prompt
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const q = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  const goNext = () => {
    if (!selected) return;
    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);
    setAnimIn(false);
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
        setSelected(null);
        setAnimIn(true);
      } else {
        // quiz done
        if (mobile && !isStandalone) {
          setPhase("install");
          setAnimIn(true);
        } else {
          onFinish(newAnswers);
        }
      }
    }, 220);
  };

  const goBack = () => {
    if (step === 0) return;
    setAnimIn(false);
    setTimeout(() => {
      setStep(step - 1);
      setSelected(answers[QUESTIONS[step - 1].id] || null);
      setAnimIn(true);
    }, 220);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
    }
    setTimeout(() => onFinish(answers), 600);
  };

  const handleSkipInstall = () => onFinish(answers);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 80,
      background: "#050507",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'IBM Plex Mono', monospace",
      padding: "24px",
      overflow: "hidden",
    }}>

      {/* Animated background paths */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.07 }}
        viewBox="0 0 400 800" fill="none" preserveAspectRatio="xMidYMid slice"
        id="quiz-bg-svg"
      >
        {Array.from({ length: 18 }, (_, i) => (
          <path
            key={i}
            d={`M-${60 + i * 8} -${40 + i * 12}C-${60 + i * 8} -${40 + i * 12} -${20 + i * 6} ${200 - i * 8} ${160 + i * 10} ${420 - i * 10}C${340 + i * 10} ${640 - i * 10} ${380 + i * 8} ${900 - i * 8} ${380 + i * 8} ${900 - i * 8}`}
            stroke="white"
            strokeWidth={0.4 + i * 0.04}
            strokeOpacity={0.3 + i * 0.03}
          />
        ))}
      </svg>

      <div
        ref={containerRef}
        style={{
          width: "100%", maxWidth: 420,
          transition: "opacity 0.22s ease, transform 0.22s ease",
          opacity: animIn ? 1 : 0,
          transform: animIn ? "translateY(0)" : "translateY(16px)",
          position: "relative", zIndex: 1,
        }}
      >
        {phase === "quiz" && (
          <>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontSize: "1.1rem",
                fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.9)",
              }}>SYNTERICA</div>
              <div style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
                QUICK SETUP — {step + 1} of {QUESTIONS.length}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", borderRadius: 1, marginBottom: 40, position: "relative" }}>
              <div style={{
                height: "100%", background: "rgba(255,255,255,0.5)",
                borderRadius: 1, width: `${progress}%`,
                transition: "width 0.4s ease",
              }} />
            </div>

            {/* Question */}
            <div style={{
              fontSize: "1.15rem", fontWeight: 600,
              color: "#ffffff", lineHeight: 1.4,
              marginBottom: 32, letterSpacing: "-0.01em",
              fontFamily: "'Syne', sans-serif",
            }}>
              {q.q}
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 40 }}>
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelected(opt)}
                  style={{
                    textAlign: "left",
                    padding: "14px 18px",
                    border: `1px solid ${selected === opt ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 6,
                    background: selected === opt ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: selected === opt ? "#ffffff" : "rgba(255,255,255,0.45)",
                    fontFamily: "'IBM Plex Mono', monospace",
                    transition: "all 0.15s",
                    letterSpacing: "0.02em",
                  }}
                >
                  <span style={{ marginRight: 10, color: selected === opt ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>
                    {selected === opt ? "●" : "○"}
                  </span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              {step > 0 && (
                <button
                  onClick={goBack}
                  style={{
                    padding: "14px 20px", background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.35)", borderRadius: 6,
                    fontSize: "0.78rem", cursor: "pointer",
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: "0.05em",
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={goNext}
                disabled={!selected}
                style={{
                  flex: 1, padding: "14px",
                  background: selected ? "#ffffff" : "rgba(255,255,255,0.08)",
                  border: "none", borderRadius: 6,
                  color: selected ? "#050507" : "rgba(255,255,255,0.2)",
                  fontSize: "0.8rem", fontWeight: 600, cursor: selected ? "pointer" : "not-allowed",
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                {step < QUESTIONS.length - 1 ? "Continue →" : "Finish →"}
              </button>
            </div>
          </>
        )}

        {phase === "install" && (
          <div style={{ textAlign: "center" }}>
            {/* ST Logo mark */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 32px",
              fontSize: "1.4rem", fontWeight: 800,
              fontFamily: "'Syne', sans-serif",
              color: "rgba(255,255,255,0.8)",
              letterSpacing: "0.05em",
            }}>
              ST
            </div>

            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "1.6rem", fontWeight: 800,
              color: "#ffffff", letterSpacing: "-0.02em",
              marginBottom: 16, lineHeight: 1.15,
            }}>
              Add Synterica<br />to your home screen.
            </div>

            <div style={{
              fontSize: "0.85rem", color: "rgba(255,255,255,0.4)",
              lineHeight: 1.7, marginBottom: 48,
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              One tap. Full screen. No browser bar.<br />
              Feels like a real app — because it is.
            </div>

            {/* Big install button */}
            <button
              onClick={handleInstall}
              style={{
                width: "100%", padding: "18px",
                background: "#ffffff", color: "#050507",
                border: "none", borderRadius: 8,
                fontSize: "1rem", fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.04em", textTransform: "uppercase",
                cursor: "pointer",
                marginBottom: 14,
                boxShadow: "0 8px 32px rgba(255,255,255,0.12)",
                transition: "transform 0.15s, opacity 0.15s",
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.98)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {installed ? "✓ Installed!" : "Add to Home Screen"}
            </button>

            {/* iOS instructions if no prompt (Safari) */}
            {!deferredPrompt && !installed && (
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "16px",
                marginBottom: 14,
                fontSize: "0.75rem", color: "rgba(255,255,255,0.4)",
                fontFamily: "'IBM Plex Mono', monospace",
                lineHeight: 1.7, textAlign: "left",
              }}>
                On iPhone: tap the <strong style={{ color: "rgba(255,255,255,0.6)" }}>Share</strong> button at the bottom of Safari, then tap <strong style={{ color: "rgba(255,255,255,0.6)" }}>"Add to Home Screen"</strong>
              </div>
            )}

            <button
              onClick={handleSkipInstall}
              style={{
                width: "100%", padding: "14px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.25)",
                fontSize: "0.75rem", cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.05em",
              }}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
      `}</style>
    </div>
  );
}
