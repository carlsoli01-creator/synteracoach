import { useEffect, useState } from "react";

interface ForcedPaywallProps {
  onSubscribe: () => void;
  onSkip: () => void;
}

type TierId = "free" | "pro" | "elite";

const TIERS: {
  id: TierId;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "/forever",
    tagline: "Try the basics.",
    features: [
      "1 analysis per day",
      "Overall score only",
      "Basic AI feedback",
      "Limited session history",
    ],
    cta: "Start Free",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$7.99",
    cadence: "/month",
    tagline: "For serious speakers.",
    features: [
      "Unlimited analyses",
      "Full 7-dimension breakdown",
      "Filler & hedging detection",
      "Power word tracking",
      "Personalized coaching tips",
      "Full session history",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "$29.99",
    cadence: "/month",
    tagline: "For professionals & teams.",
    features: [
      "Everything in Pro",
      "Priority AI analysis",
      "Advanced rhetorical detection",
      "Custom practice scenarios",
      "1-on-1 coach chat (unlimited)",
      "Export & share reports",
    ],
    cta: "Go Elite",
  },
];

export default function ForcedPaywall({ onSubscribe }: ForcedPaywallProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [showBeta, setShowBeta] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleContinue = () => {
    setFadingOut(true);
    setTimeout(() => onSubscribe(), 600);
  };

  const handleTierClick = (_tier: TierId) => {
    setShowBeta(true);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#050507",
        opacity: fadingOut ? 0 : visible ? 1 : 0,
        transition: "opacity 0.7s ease",
        overflowY: "auto", padding: "60px 20px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: "min(1040px, 100%)",
          transform: visible && !fadingOut ? "translateY(0)" : "translateY(12px)",
          opacity: visible && !fadingOut ? 1 : 0,
          transition: "transform 0.7s ease, opacity 0.7s ease",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.1)", padding: "6px 16px",
            borderRadius: 2, marginBottom: 28,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", opacity: 0.9 }} />
            Choose your plan
          </div>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
            fontSize: "clamp(2rem, 4vw, 3.4rem)", fontWeight: 400,
            color: "#fff", lineHeight: 1.05, letterSpacing: "-0.02em",
            margin: 0, maxWidth: 640, marginInline: "auto",
          }}>
            Stop guessing. Start improving.
          </h2>
          <p style={{
            marginTop: 18, color: "rgba(255,255,255,0.55)",
            fontFamily: "'DM Mono', monospace", fontSize: 13, lineHeight: 1.7,
            maxWidth: 480, marginInline: "auto",
          }}>
            Pick a tier to continue. You can change it anytime.
          </p>
        </div>

        {/* Tiers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}>
          {TIERS.map((t) => {
            const highlight = !!t.highlight;
            return (
              <div key={t.id} style={{
                background: highlight ? "#0f0f12" : "#0a0a0c",
                border: `1px solid ${highlight ? "rgba(255,255,255,0.22)" : "#1a1a20"}`,
                borderRadius: 6, padding: "32px 26px",
                display: "flex", flexDirection: "column", position: "relative",
                boxShadow: highlight ? "0 24px 60px rgba(0,0,0,0.5)" : "none",
              }}>
                {highlight && (
                  <div style={{
                    position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                    background: "#fff", color: "#050507",
                    fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500,
                    letterSpacing: "0.2em", padding: "4px 12px", textTransform: "uppercase",
                  }}>Most Popular</div>
                )}

                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)", marginBottom: 12,
                }}>{t.name}</div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
                    fontSize: "2.6rem", fontWeight: 400, color: "#fff", lineHeight: 1,
                  }}>{t.price}</span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 12,
                    color: "rgba(255,255,255,0.45)",
                  }}>{t.cadence}</span>
                </div>

                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11,
                  color: "rgba(255,255,255,0.55)", marginBottom: 22,
                }}>{t.tagline}</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {t.features.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      fontFamily: "'DM Mono', monospace", fontSize: 12,
                      color: "rgba(255,255,255,0.78)", lineHeight: 1.55,
                    }}>
                      <span style={{
                        width: 14, height: 14, flexShrink: 0, marginTop: 2,
                        border: "1px solid rgba(255,255,255,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, color: "#fff",
                      }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleTierClick(t.id)}
                  style={{
                    marginTop: "auto", padding: "13px 20px",
                    background: highlight ? "#fff" : "transparent",
                    color: highlight ? "#050507" : "#fff",
                    border: highlight ? "none" : "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 3, cursor: "pointer",
                    fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    transition: "opacity 0.2s, transform 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {t.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Beta popup */}
      {showBeta && (
        <div
          onClick={handleContinue}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
            animation: "fpFade 0.3s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0a0a0c", border: "1px solid #1a1a20", borderRadius: 6,
              padding: "44px 36px", textAlign: "center", maxWidth: 420, width: "90vw",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 18 }}>🎉</div>
            <div style={{
              fontFamily: "'Instrument Serif', serif", fontStyle: "italic",
              fontSize: 26, fontWeight: 400, color: "#fff",
              marginBottom: 14, lineHeight: 1.2, letterSpacing: "-0.01em",
            }}>
              Welcome to the Beta!
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 12,
              color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 28,
            }}>
              This is a beta test application — you'll receive the{" "}
              <span style={{ color: "#fff", fontWeight: 500 }}>Elite Tier</span> subscription for free.
            </div>
            <button
              onClick={handleContinue}
              style={{
                padding: "13px 32px", background: "#fff", color: "#050507",
                border: "none", borderRadius: 3, cursor: "pointer",
                fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes fpFade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
