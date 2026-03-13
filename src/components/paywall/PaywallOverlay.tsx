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
    <div style={{
      position: "absolute", inset: 0, zIndex: 20,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      background: "rgba(255,255,255,0.6)", borderRadius: 0,
    }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111", lineHeight: 1.3, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
          Your full report is ready.
        </div>
        <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 24, fontFamily: "'DM Mono', monospace" }}>
          Unlock detailed AI coaching, technique detection, filler tracking, and unlimited sessions.
        </div>
        <button onClick={onUpgrade} style={{
          padding: "16px 40px", fontSize: 14, fontWeight: 500, letterSpacing: "0.1em",
          background: "#000", color: "#fff", border: "none", borderRadius: 0,
          cursor: "pointer", transition: "all 0.2s", width: "100%",
          fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
        }}>
          Unlock Full Report — $7.99/mo
        </button>
        <div style={{ fontSize: 10, color: "#888", marginTop: 10, fontFamily: "'DM Mono', monospace" }}>
          Cancel anytime · Instant access · 7-day money back
        </div>
      </div>
    </div>
  );
}

export function PricingModal({ onClose, onSubscribe }: { onClose: () => void; onSubscribe: () => void }) {
  const [hoveredPlan, setHoveredPlan] = useState<"free" | "premium" | null>(null);
  const [showBetaPopup, setShowBetaPopup] = useState(false);
  const handlePlanClick = () => setShowBetaPopup(true);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "min(720px, 94vw)", background: "#fff", borderRadius: 0,
        padding: "40px 32px", position: "relative",
        animation: "fadeUp 0.3s ease", maxHeight: "90vh", overflowY: "auto",
        border: "1px solid #e2e2e2",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "none",
          border: "none", fontSize: 20, color: "#888", cursor: "pointer",
        }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
            CHOOSE YOUR PLAN
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#111", lineHeight: 1.2, fontFamily: "'Syne', sans-serif" }}>
            Stop guessing. Start improving.
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 8, lineHeight: 1.5, fontFamily: "'DM Mono', monospace" }}>
            Premium members improve their speaking scores <strong style={{ color: "#111" }}>3x faster</strong> with unlimited AI coaching.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div onMouseEnter={() => setHoveredPlan("free")} onMouseLeave={() => setHoveredPlan(null)}
            style={{ border: "1px solid #e2e2e2", borderRadius: 0, padding: "28px 24px", background: hoveredPlan === "free" ? "#fafafa" : "#fff", transition: "all 0.2s" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>FREE</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#111", fontFamily: "'Syne', sans-serif" }}>$0</span>
              <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono', monospace" }}>/forever</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 500, flexShrink: 0,
                    background: f.included ? "#f0f0f0" : "#f8f8f8", color: f.included ? "#111" : "#ddd",
                    border: `1px solid ${f.included ? "#ddd" : "#e2e2e2"}`,
                  }}>{f.included ? "✓" : "✕"}</span>
                  <span style={{ color: f.included ? "#111" : "#888", textDecoration: f.included ? "none" : "line-through" }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{
              marginTop: 20, width: "100%", padding: "12px", fontSize: 12, fontWeight: 500,
              background: "transparent", border: "1px solid #e2e2e2", borderRadius: 0,
              color: "#888", cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
            }}>Stay on Free</button>
          </div>

          <div onMouseEnter={() => setHoveredPlan("premium")} onMouseLeave={() => setHoveredPlan(null)}
            style={{ border: "2px solid #000", borderRadius: 0, padding: "28px 24px", background: hoveredPlan === "premium" ? "#fafafa" : "#fff", transition: "all 0.2s", position: "relative" }}>
            <div style={{
              position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
              background: "#000", color: "#fff", fontSize: 8, fontWeight: 500,
              letterSpacing: "0.2em", padding: "4px 14px", borderRadius: 0, textTransform: "uppercase",
              fontFamily: "'DM Mono', monospace",
            }}>MOST POPULAR</div>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#111", textTransform: "uppercase", marginBottom: 4, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>PREMIUM</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#111", fontFamily: "'Syne', sans-serif" }}>$7.99</span>
              <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono', monospace" }}>/month</span>
            </div>
            <div style={{ fontSize: 10, color: "#555", fontWeight: 400, marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
              That's just $0.27/day for unlimited coaching
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PREMIUM_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 500, flexShrink: 0, background: "#f0f0f0", color: "#111", border: "1px solid #ddd",
                  }}>✓</span>
                  <span style={{ color: "#111", fontWeight: 400 }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={handlePlanClick} style={{
              marginTop: 20, width: "100%", padding: "14px", fontSize: 13, fontWeight: 500,
              background: "#000", color: "#fff", border: "none", borderRadius: 0,
              cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>Upgrade to Premium</button>
            <div style={{ fontSize: 9, color: "#888", textAlign: "center", marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
              Cancel anytime · 7-day money-back guarantee
            </div>
          </div>
        </div>
      </div>

      {showBetaPopup && (
        <div onClick={() => { setShowBetaPopup(false); onSubscribe(); }} style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", border: "1px solid #e2e2e2", borderRadius: 0,
            padding: "44px 36px", textAlign: "center", maxWidth: 400, width: "90vw",
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 12, lineHeight: 1.3, fontFamily: "'Syne', sans-serif" }}>
              Welcome to the Beta!
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 28, fontFamily: "'DM Mono', monospace" }}>
              This is a beta test application — you will be receiving the <span style={{ color: "#111", fontWeight: 500 }}>Elite Tier</span> subscription for free.
            </div>
            <button onClick={() => { setShowBetaPopup(false); onSubscribe(); }} style={{
              padding: "14px 40px", fontSize: 13, fontWeight: 500,
              background: "#000", color: "#fff", border: "none", borderRadius: 0,
              cursor: "pointer", letterSpacing: "0.08em",
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
            }}>Continue →</button>
          </div>
        </div>
      )}
    </div>
  );
}