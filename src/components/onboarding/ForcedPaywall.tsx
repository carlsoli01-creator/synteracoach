import { useState } from "react";

const FREE_FEATURES = [
  { text: "1 analysis per day", included: true },
  { text: "Basic overall score", included: true },
  { text: "Detailed AI feedback", included: false },
  { text: "Technique detection", included: false },
  { text: "Filler word tracking", included: false },
  { text: "Power word detection", included: false },
  { text: "Word choice scoring", included: false },
  { text: "Coaching tips", included: false },
  { text: "Unlimited sessions", included: false },
  { text: "Progress tracking", included: false },
];

const PREMIUM_FEATURES = [
  { text: "Unlimited analyses", included: true },
  { text: "Full 7-dimension scoring", included: true },
  { text: "Deep AI feedback", included: true },
  { text: "Rhetorical technique detection", included: true },
  { text: "Filler & hedging tracking", included: true },
  { text: "Power word detection", included: true },
  { text: "Word choice & persuasion scoring", included: true },
  { text: "Personalized coaching", included: true },
  { text: "Unlimited history", included: true },
  { text: "Streaks & badges", included: true },
];

interface ForcedPaywallProps {
  onSubscribe: () => void;
  onSkip: () => void;
}

export default function ForcedPaywall({ onSubscribe, onSkip }: ForcedPaywallProps) {
  const [hoveredPlan, setHoveredPlan] = useState<"free" | "premium" | null>(null);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 80,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#000",
      animation: "fadeUp 0.4s ease",
    }}>
      <div style={{
        width: "min(760px, 94vw)",
        maxHeight: "92vh",
        overflowY: "auto",
        padding: "48px 32px",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.4em", color: "#555",
            textTransform: "uppercase", marginBottom: 12, fontWeight: 700,
          }}>
            YOUR ANALYSIS IS READY
          </div>
          <div style={{
            fontSize: 30, fontWeight: 900, color: "#fff",
            lineHeight: 1.15, letterSpacing: "-0.02em",
            fontFamily: "'Inter', system-ui, sans-serif",
            marginBottom: 12,
          }}>
            Unlock your full potential.
          </div>
          <div style={{
            fontSize: 14, color: "#666", lineHeight: 1.7,
            maxWidth: 420, margin: "0 auto",
          }}>
            Premium members improve <span style={{ color: "#fff", fontWeight: 700 }}>3x faster</span> with 
            unlimited AI coaching, detailed breakdowns, and personalized tips.
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          {/* Free Plan */}
          <div
            onMouseEnter={() => setHoveredPlan("free")}
            onMouseLeave={() => setHoveredPlan(null)}
            style={{
              border: "1px solid #222",
              borderRadius: 14,
              padding: "28px 22px",
              background: hoveredPlan === "free" ? "#0a0a0a" : "#050505",
              transition: "all 0.25s",
            }}
          >
            <div style={{
              fontSize: 10, letterSpacing: "0.3em", color: "#555",
              textTransform: "uppercase", marginBottom: 8, fontWeight: 700,
            }}>
              FREE
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 24 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: "#fff" }}>$0</span>
              <span style={{ fontSize: 13, color: "#555" }}>/forever</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    background: f.included ? "#1a1a1a" : "#0a0a0a",
                    color: f.included ? "#fff" : "#333",
                    border: `1px solid ${f.included ? "#333" : "#1a1a1a"}`,
                  }}>
                    {f.included ? "✓" : "✕"}
                  </div>
                  <span style={{
                    color: f.included ? "#ccc" : "#444",
                    textDecoration: f.included ? "none" : "line-through",
                  }}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={onSkip}
              style={{
                marginTop: 24, width: "100%", padding: "14px",
                fontSize: 13, fontWeight: 600,
                background: "transparent",
                border: "1px solid #222",
                borderRadius: 10, color: "#555", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Continue with Free
            </button>
          </div>

          {/* Premium Plan */}
          <div
            onMouseEnter={() => setHoveredPlan("premium")}
            onMouseLeave={() => setHoveredPlan(null)}
            style={{
              border: "2px solid #fff",
              borderRadius: 14,
              padding: "28px 22px",
              background: hoveredPlan === "premium" ? "#0f0f0f" : "#0a0a0a",
              transition: "all 0.25s",
              position: "relative",
              boxShadow: "0 0 60px rgba(255,255,255,0.06)",
            }}
          >
            <div style={{
              position: "absolute", top: -13, left: "50%",
              transform: "translateX(-50%)",
              background: "#fff", color: "#000",
              fontSize: 9, fontWeight: 800,
              letterSpacing: "0.25em", padding: "5px 18px",
              borderRadius: 20, textTransform: "uppercase",
            }}>
              RECOMMENDED
            </div>
            <div style={{
              fontSize: 10, letterSpacing: "0.3em", color: "#fff",
              textTransform: "uppercase", marginBottom: 8, fontWeight: 800,
            }}>
              PREMIUM
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: "#fff" }}>$7.99</span>
              <span style={{ fontSize: 13, color: "#666" }}>/month</span>
            </div>
            <div style={{
              fontSize: 11, color: "#999", marginBottom: 24,
              fontWeight: 500,
            }}>
              Just $0.27/day — less than a coffee
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {PREMIUM_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    background: "#fff", color: "#000",
                  }}>
                    ✓
                  </div>
                  <span style={{ color: "#fff", fontWeight: 500 }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onSubscribe}
              style={{
                marginTop: 24, width: "100%", padding: "16px",
                fontSize: 15, fontWeight: 900,
                letterSpacing: "0.04em",
                background: "#fff", color: "#000",
                border: "none", borderRadius: 10, cursor: "pointer",
                boxShadow: "0 0 40px rgba(255,255,255,0.12)",
                transition: "all 0.2s",
              }}
            >
              Upgrade to Premium
            </button>
            <div style={{
              fontSize: 10, color: "#555", textAlign: "center", marginTop: 10,
              letterSpacing: "0.05em",
            }}>
              Cancel anytime · 7-day money-back guarantee
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div style={{
          textAlign: "center", fontSize: 11, color: "#444",
          letterSpacing: "0.1em", lineHeight: 1.8,
        }}>
          ★★★★★ Trusted by 2,000+ speakers improving daily
        </div>
      </div>
    </div>
  );
}
