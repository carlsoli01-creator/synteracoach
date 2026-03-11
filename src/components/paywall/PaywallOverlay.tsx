import { useState } from "react";

const FREE_FEATURES = [
  { text: "1 free analysis per day", included: true },
  { text: "Basic overall score only", included: true },
  { text: "Detailed AI feedback", included: false },
  { text: "Technique detection", included: false },
  { text: "Filler word tracking", included: false },
  { text: "Hedging language analysis", included: false },
  { text: "Power word detection", included: false },
  { text: "Word choice & persuasion scores", included: false },
  { text: "Personalized coaching tips", included: false },
  { text: "Unlimited sessions", included: false },
  { text: "Full session history", included: false },
];

const PREMIUM_FEATURES = [
  { text: "Unlimited analyses", included: true },
  { text: "Full score breakdown", included: true },
  { text: "Deep AI feedback on every section", included: true },
  { text: "Rhetorical technique detection", included: true },
  { text: "Filler word & hedging tracking", included: true },
  { text: "Power word detection", included: true },
  { text: "Word choice & persuasion scoring", included: true },
  { text: "Personalized coaching tips", included: true },
  { text: "Unlimited session history", included: true },
  { text: "Progress tracking & streaks", included: true },
  { text: "Priority AI analysis", included: true },
];

export function PaywallCTA({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(255,255,255,0.6)",
        borderRadius: 10,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0b0b0b",
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          Your full report is ready.
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#6b7280",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Unlock detailed AI coaching, technique detection, filler tracking, and
          unlimited sessions — everything you need to speak with confidence.
        </div>
        <button
          onClick={onUpgrade}
          style={{
            padding: "16px 40px",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.04em",
            background: "linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(16,24,40,0.25)",
            transition: "all 0.2s",
            width: "100%",
          }}
        >
          Unlock Full Report — $7.99/mo
        </button>
        <div
          style={{
            fontSize: 11,
            color: "#9aa0a6",
            marginTop: 10,
          }}
        >
          Cancel anytime · Instant access · 7-day money back
        </div>
      </div>
    </div>
  );
}

export function PricingModal({
  onClose,
  onSubscribe,
}: {
  onClose: () => void;
  onSubscribe: () => void;
}) {
  const [hoveredPlan, setHoveredPlan] = useState<"free" | "premium" | null>(null);
  const [showBetaPopup, setShowBetaPopup] = useState(false);
  const handlePlanClick = () => setShowBetaPopup(true);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2,6,23,0.6)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(720px, 94vw)",
          background: "#fff",
          borderRadius: 16,
          padding: "36px 28px",
          boxShadow: "0 32px 80px rgba(16,24,40,0.25)",
          position: "relative",
          animation: "fadeUp 0.3s ease",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 20,
            color: "#9aa0a6",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "#9aa0a6", textTransform: "uppercase", marginBottom: 8 }}>
            CHOOSE YOUR PLAN
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0b0b0b", lineHeight: 1.2 }}>
            Stop guessing. Start improving.
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8, lineHeight: 1.5 }}>
            Premium members improve their speaking scores <strong>3x faster</strong> with unlimited AI coaching.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Free Plan */}
          <div
            onMouseEnter={() => setHoveredPlan("free")}
            onMouseLeave={() => setHoveredPlan(null)}
            style={{
              border: "1px solid #e6e6e6",
              borderRadius: 12,
              padding: "24px 20px",
              background: hoveredPlan === "free" ? "#fafafa" : "#fff",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#9aa0a6", textTransform: "uppercase", marginBottom: 4 }}>
              FREE
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#0b0b0b" }}>$0</span>
              <span style={{ fontSize: 13, color: "#9aa0a6" }}>/forever</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      background: f.included ? "#e8f5e9" : "#fbe9e7",
                      color: f.included ? "#4a8c5c" : "#c04a2a",
                    }}
                  >
                    {f.included ? "✓" : "✕"}
                  </span>
                  <span style={{ color: f.included ? "#0b0b0b" : "#9aa0a6", textDecoration: f.included ? "none" : "line-through" }}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>
            <button
              style={{
                marginTop: 20,
                width: "100%",
                padding: "12px",
                fontSize: 13,
                fontWeight: 600,
                background: "transparent",
                border: "1px solid #e6e6e6",
                borderRadius: 8,
                color: "#9aa0a6",
                cursor: "pointer",
              }}
              onClick={onClose}
            >
              Stay on Free
            </button>
          </div>

          {/* Premium Plan */}
          <div
            onMouseEnter={() => setHoveredPlan("premium")}
            onMouseLeave={() => setHoveredPlan(null)}
            style={{
              border: "2px solid #111827",
              borderRadius: 12,
              padding: "24px 20px",
              background: hoveredPlan === "premium" ? "#f8f9fa" : "#fff",
              transition: "all 0.2s",
              position: "relative",
              boxShadow: "0 8px 32px rgba(16,24,40,0.12)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -12,
                left: "50%",
                transform: "translateX(-50%)",
                background: "linear-gradient(90deg, #111827, #1f2937)",
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                padding: "4px 14px",
                borderRadius: 20,
                textTransform: "uppercase",
              }}
            >
              MOST POPULAR
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#111827", textTransform: "uppercase", marginBottom: 4, fontWeight: 700 }}>
              PREMIUM
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#0b0b0b" }}>$7.99</span>
              <span style={{ fontSize: 13, color: "#9aa0a6" }}>/month</span>
            </div>
            <div style={{ fontSize: 11, color: "#4a8c5c", fontWeight: 600, marginBottom: 16 }}>
              That's just $0.27/day for unlimited coaching
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PREMIUM_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      background: "#e8f5e9",
                      color: "#4a8c5c",
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ color: "#0b0b0b", fontWeight: 500 }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onSubscribe}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "14px",
                fontSize: 14,
                fontWeight: 800,
                background: "linear-gradient(135deg, #111827, #1f2937)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(16,24,40,0.2)",
                transition: "all 0.2s",
              }}
            >
              Upgrade to Premium
            </button>
            <div style={{ fontSize: 10, color: "#9aa0a6", textAlign: "center", marginTop: 8 }}>
              Cancel anytime · 7-day money-back guarantee
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
