import { useEffect, useState } from "react";

interface ForcedPaywallProps {
  onSubscribe: () => void;
  onSkip: () => void;
}

export default function ForcedPaywall({ onSubscribe }: ForcedPaywallProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleContinue = () => {
    setFadingOut(true);
    setTimeout(() => onSubscribe(), 600);
  };

  return (
    <div
      onClick={handleContinue}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#000",
        opacity: fadingOut ? 0 : visible ? 1 : 0,
        transition: "opacity 0.7s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111", border: "1px solid #1c1c1c", borderRadius: 0,
          padding: "48px 36px", textAlign: "center", maxWidth: 420, width: "90vw",
          transform: visible && !fadingOut ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
          opacity: visible && !fadingOut ? 1 : 0,
          transition: "transform 0.7s ease, opacity 0.7s ease",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 20 }}>🎉</div>
        <div style={{
          fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 14,
          lineHeight: 1.3, fontFamily: "'Syne', sans-serif",
        }}>
          Welcome to the Beta!
        </div>
        <div style={{
          fontSize: 13, color: "#aaa", lineHeight: 1.7, marginBottom: 32,
          fontFamily: "'DM Mono', monospace",
        }}>
          This is a beta test application — you will be receiving the{" "}
          <span style={{ color: "#fff", fontWeight: 500 }}>Elite Tier</span> subscription for free.
        </div>
        <button
          onClick={handleContinue}
          style={{
            padding: "14px 40px", fontSize: 13, fontWeight: 500,
            background: "#fff", color: "#000", border: "none", borderRadius: 0,
            cursor: "pointer", letterSpacing: "0.08em",
            fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
