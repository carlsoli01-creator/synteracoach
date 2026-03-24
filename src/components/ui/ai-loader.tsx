import * as React from "react";
import { useEffect, useState } from "react";

interface AILoaderProps {
  size?: number;
  text?: string;
  /** Volume level 0-1 to make loader reactive */
  volume?: number;
  /** Estimated seconds remaining */
  estimatedSeconds?: number;
  /** Dark mode */
  isDark?: boolean;
}

export function AILoader({
  size = 160,
  text = "Analyzing",
  volume = 0,
  estimatedSeconds,
  isDark = false,
}: AILoaderProps) {
  const letters = text.split("");
  const circleSize = size * 0.55;
  // Volume drives speed and scale
  const speedMultiplier = 1 + volume * 2; // 1x to 3x
  const scaleBoost = 1 + volume * 0.15;
  const duration = Math.max(1.5, 5 / speedMultiplier);

  const fg = isDark ? "#e8e8e8" : "#1a1a1a";
  const fgSoft = isDark ? "#888" : "#666";
  const shadowLight = isDark
    ? `0 6px 12px 0 rgba(200,200,200,0.15) inset,
       0 12px 18px 0 rgba(160,160,160,0.12) inset,
       0 36px 36px 0 rgba(120,120,120,0.1) inset,
       0 0 3px 1.2px rgba(200,200,200,0.1),
       0 0 6px 1.8px rgba(180,180,180,0.08)`
    : `0 6px 12px 0 rgba(60,60,60,0.2) inset,
       0 12px 18px 0 rgba(40,40,40,0.15) inset,
       0 36px 36px 0 rgba(20,20,20,0.1) inset,
       0 0 3px 1.2px rgba(60,60,60,0.12),
       0 0 6px 1.8px rgba(40,40,40,0.08)`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "24px 0",
      }}
    >
      {/* Spinning orb */}
      <div
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: "50%",
          boxShadow: shadowLight,
          transform: `scale(${scaleBoost})`,
          transition: "transform 0.15s ease-out",
          animation: `aiLoaderSpin ${duration}s linear infinite`,
        }}
      />

      {/* Animated text */}
      <div
        style={{
          display: "flex",
          gap: 1,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {letters.map((letter, i) => (
          <span
            key={i}
            style={{
              color: fg,
              display: "inline-block",
              animation: `aiLoaderLetter ${Math.max(1.5, 3 / speedMultiplier)}s infinite`,
              animationDelay: `${i * 0.12}s`,
            }}
          >
            {letter}
          </span>
        ))}
        <span style={{ color: fgSoft, animation: `aiLoaderLetter 2s infinite` }}>…</span>
      </div>

      {/* Estimated time */}
      {estimatedSeconds != null && estimatedSeconds > 0 && (
        <div
          style={{
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            fontWeight: 500,
            color: fgSoft,
            animation: "aiLoaderPulse 2s ease-in-out infinite",
          }}
        >
          ~{estimatedSeconds}s remaining
        </div>
      )}

      <style>{`
        @keyframes aiLoaderSpin {
          0% { transform: rotate(90deg) scale(${scaleBoost}); }
          50% { transform: rotate(270deg) scale(${scaleBoost * 1.05}); }
          100% { transform: rotate(450deg) scale(${scaleBoost}); }
        }
        @keyframes aiLoaderLetter {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          20% { opacity: 1; transform: scale(1.18); }
          40% { opacity: 0.6; transform: translateY(0); }
        }
        @keyframes aiLoaderPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
