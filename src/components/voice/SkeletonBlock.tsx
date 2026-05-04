import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

/**
 * Theme-aware skeleton block. Matches the Synterica monochrome system —
 * no Tailwind colors, just a subtle pulse over panel/border tones.
 */
export default function SkeletonBlock({ width = "100%", height = 16, style }: Props) {
  const { isDark } = useTheme();
  const base = isDark ? "#1a1a1c" : "#e8e8e6";
  return (
    <div
      style={{
        width,
        height,
        background: base,
        animation: "syntSkel 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// Inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("synt-skel-kf")) {
  const s = document.createElement("style");
  s.id = "synt-skel-kf";
  s.textContent = `@keyframes syntSkel { 0%,100%{opacity:0.55} 50%{opacity:0.95} }`;
  document.head.appendChild(s);
}
