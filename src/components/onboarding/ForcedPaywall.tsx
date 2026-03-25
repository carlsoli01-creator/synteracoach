import { useState } from "react";

const FREE_FEATURES = [
  { text: "1 recording per day", included: true },
  { text: "Basic overall score", included: true },
  { text: "Daily tips", included: true },
  { text: "Detailed AI feedback", included: false },
  { text: "Technique detection", included: false },
  { text: "Filler word tracking", included: false },
  { text: "Power word detection", included: false },
  { text: "Word choice scoring", included: false },
  { text: "Personalized coaching", included: false },
  { text: "Unlimited sessions", included: false },
];

const PRO_FEATURES = [
  { text: "5 recordings per day", included: true },
  { text: "Overall + 3 core scores", included: true },
  { text: "Daily tips", included: true },
  { text: "Basic AI feedback", included: true },
  { text: "Filler word tracking", included: true },
  { text: "Power word detection", included: true },
  { text: "Technique detection", included: false },
  { text: "Full word choice analysis", included: false },
  { text: "Personalized coaching", included: false },
  { text: "Unlimited sessions", included: false },
];

const ELITE_FEATURES = [
  { text: "Unlimited recordings", included: true },
  { text: "Full 7-dimension scoring", included: true },
  { text: "Daily tips + coaching", included: true },
  { text: "Deep AI feedback", included: true },
  { text: "Rhetorical technique detection", included: true },
  { text: "Filler & hedging tracking", included: true },
  { text: "Power word detection", included: true },
  { text: "Word choice & persuasion scoring", included: true },
  { text: "Personalized coaching plans", included: true },
  { text: "Unlimited history & streaks", included: true },
];

interface ForcedPaywallProps {
  onSubscribe: () => void;
  onSkip: () => void;
}

export default function ForcedPaywall({ onSubscribe, onSkip }: ForcedPaywallProps) {
  const [hoveredPlan, setHoveredPlan] = useState<"free" | "pro" | "elite" | null>(null);
  const [visible, setVisible] = useState(false);
  const [showBetaPopup, setShowBetaPopup] = useState(false);

  const [fadingOut, setFadingOut] = useState(false);

  const handlePlanClick = () => setShowBetaPopup(true);

  const handleBetaContinue = () => {
    setFadingOut(true);
    setTimeout(() => {
      setShowBetaPopup(false);
      onSubscribe();
    }, 600);
  };

  useState(() => {
    requestAnimationFrame(() => setVisible(true));
  });

  const FeatureList = ({ features }: { features: { text: string; included: boolean }[] }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {features.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
          <div style={{
            width: 18, height: 18, borderRadius: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 500, flexShrink: 0,
            background: f.included ? "#1a1a1a" : "#0a0a0a",
            color: f.included ? "#fff" : "#333",
            border: `1px solid ${f.included ? "#333" : "#1a1a1a"}`,
          }}>{f.included ? "✓" : "✕"}</div>
          <span style={{ color: f.included ? "#bbb" : "#444", textDecoration: f.included ? "none" : "line-through" }}>{f.text}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 80,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#000",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.6s ease, transform 0.6s ease",
    }}>
      <div style={{ width: "min(1080px, 96vw)", maxHeight: "94vh", overflowY: "auto", padding: "44px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.4em", color: "#555", textTransform: "uppercase", marginBottom: 12, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>
            YOUR ANALYSIS IS READY
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", fontFamily: "'Syne', sans-serif", marginBottom: 10 }}>
            Choose your path to mastery.
          </div>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7, maxWidth: 440, margin: "0 auto", fontFamily: "'DM Mono', monospace" }}>
            Premium members improve <span style={{ color: "#fff", fontWeight: 500 }}>3x faster</span> with unlimited AI coaching, detailed breakdowns, and personalized tips.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
          {/* Free Plan */}
          <div onMouseEnter={() => setHoveredPlan("free")} onMouseLeave={() => setHoveredPlan(null)}
            style={{ border: "1px solid #1c1c1c", borderRadius: 0, padding: "28px 20px", background: hoveredPlan === "free" ? "#0a0a0a" : "#050505", transition: "all 0.25s" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#555", textTransform: "uppercase", marginBottom: 8, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>FREE</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif" }}>$0</span>
              <span style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono', monospace" }}>/forever</span>
            </div>
            <FeatureList features={FREE_FEATURES} />
            <button onClick={handlePlanClick} style={{
              marginTop: 20, width: "100%", padding: "13px", fontSize: 11, fontWeight: 500,
              background: "transparent", border: "1px solid #1c1c1c", borderRadius: 0,
              color: "#555", cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em",
            }}>Continue with Free</button>
          </div>

          {/* Pro Plan */}
          <div onMouseEnter={() => setHoveredPlan("pro")} onMouseLeave={() => setHoveredPlan(null)}
            style={{ border: "2px solid #fff", borderRadius: 0, padding: "28px 20px", background: hoveredPlan === "pro" ? "#0f0f0f" : "#0a0a0a", transition: "all 0.25s", position: "relative", transform: "scale(1.02)" }}>
            <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
              background: "#fff", color: "#000", fontSize: 8, fontWeight: 500,
              letterSpacing: "0.25em", padding: "5px 16px", borderRadius: 0, textTransform: "uppercase",
              whiteSpace: "nowrap", fontFamily: "'DM Mono', monospace" }}>MOST POPULAR</div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#fff", textTransform: "uppercase", marginBottom: 8, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>PRO</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif" }}>$8.99</span>
              <span style={{ fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace" }}>/month</span>
            </div>
            <div style={{ fontSize: 10, color: "#999", marginBottom: 20, fontWeight: 400, fontFamily: "'DM Mono', monospace" }}>Just $0.30/day — less than a coffee</div>
            <FeatureList features={PRO_FEATURES} />
            <button onClick={handlePlanClick} style={{
              marginTop: 20, width: "100%", padding: "14px", fontSize: 13, fontWeight: 500,
              letterSpacing: "0.1em", background: "#fff", color: "#000",
              border: "none", borderRadius: 0, cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
            }}>Get Pro</button>
            <div style={{ fontSize: 9, color: "#555", textAlign: "center", marginTop: 8, letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace" }}>
              Cancel anytime · 7-day money-back guarantee
            </div>
          </div>

          {/* Elite Plan */}
          <div onMouseEnter={() => setHoveredPlan("elite")} onMouseLeave={() => setHoveredPlan(null)}
            style={{ border: "1px solid #333", borderRadius: 0, padding: "28px 20px", background: hoveredPlan === "elite" ? "#0d0d0d" : "#080808", transition: "all 0.25s", position: "relative" }}>
            <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
              background: "#333", color: "#fff", fontSize: 8, fontWeight: 500,
              letterSpacing: "0.25em", padding: "5px 16px", borderRadius: 0, textTransform: "uppercase",
              whiteSpace: "nowrap", fontFamily: "'DM Mono', monospace" }}>UNLIMITED</div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#999", textTransform: "uppercase", marginBottom: 8, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>ELITE</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif" }}>$18.99</span>
              <span style={{ fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace" }}>/month</span>
            </div>
            <div style={{ fontSize: 10, color: "#999", marginBottom: 20, fontWeight: 400, fontFamily: "'DM Mono', monospace" }}>Full AI coaching — everything unlocked</div>
            <FeatureList features={ELITE_FEATURES} />
            <button onClick={handlePlanClick} style={{
              marginTop: 20, width: "100%", padding: "14px", fontSize: 12, fontWeight: 500,
              letterSpacing: "0.1em", background: "transparent", color: "#fff",
              border: "1px solid #555", borderRadius: 0, cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
            }}>Go Elite</button>
            <div style={{ fontSize: 9, color: "#555", textAlign: "center", marginTop: 8, letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace" }}>
              Cancel anytime · 7-day money-back guarantee
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: "#444", letterSpacing: "0.1em", lineHeight: 1.8, fontFamily: "'DM Mono', monospace" }}>
          ★★★★★ Trusted by 2,000+ speakers improving daily
        </div>
      </div>

      {showBetaPopup && (
        <div onClick={handleBetaContinue} style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          opacity: fadingOut ? 0 : 1,
          transition: "opacity 0.6s ease",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#111", border: "1px solid #1c1c1c", borderRadius: 0,
            padding: "44px 36px", textAlign: "center", maxWidth: 400, width: "90vw",
            transform: fadingOut ? "scale(0.96)" : "scale(1)",
            transition: "transform 0.6s ease, opacity 0.6s ease",
            opacity: fadingOut ? 0 : 1,
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 12, lineHeight: 1.3, fontFamily: "'Syne', sans-serif" }}>
              Welcome to the Beta!
            </div>
            <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.7, marginBottom: 28, fontFamily: "'DM Mono', monospace" }}>
              This is a beta test application — you will be receiving the <span style={{ color: "#fff", fontWeight: 500 }}>Elite Tier</span> subscription for free.
            </div>
            <button onClick={handleBetaContinue} style={{
              padding: "14px 40px", fontSize: 13, fontWeight: 500,
              background: "#fff", color: "#000", border: "none", borderRadius: 0,
              cursor: "pointer", letterSpacing: "0.08em",
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
            }}>Continue →</button>
          </div>
        </div>
      )}
    </div>
  );
}