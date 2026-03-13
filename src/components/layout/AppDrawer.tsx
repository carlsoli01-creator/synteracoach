import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { icon: "🎙", label: "Analysis", path: "/" },
  { icon: "🎯", label: "Practice", path: "/scenarios" },
  { icon: "📊", label: "Progress", path: "/progress" },
  { icon: "🏆", label: "Badges", path: "/badges" },
  { icon: "📋", label: "History", path: "/history" },
  { icon: "👤", label: "Profile", path: "/profile" },
];

interface Props {
  theme?: string;
  setTheme?: (t: string) => void;
  spacingMode?: string;
  setSpacingMode?: (s: string) => void;
  onOpenSetup?: () => void;
}

export default function AppDrawer({ theme: themeProp, setTheme: setThemeProp, spacingMode: spacingProp, setSpacingMode: setSpacingProp, onOpenSetup }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const theme = themeProp || "light";
  const isDark = theme === "dark";
  const textColor = isDark ? "#f0f0f0" : "#111";
  const borderColor = isDark ? "#1c1c1c" : "#e2e2e2";
  const bgColor = isDark ? "#080808" : "#fff";
  const inputBg = isDark ? "#111" : "#f8f8f8";

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "relative",
          zIndex: 100,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
        aria-label="Open menu"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 18, height: 2, background: isDark ? "#fff" : "#111", borderRadius: 0 }} />
        ))}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: bgColor,
          borderRight: `1px solid ${borderColor}`,
          zIndex: 300,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        <div style={{ padding: "28px 20px 20px", borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: textColor, letterSpacing: "0.08em", fontFamily: "'Syne', sans-serif" }}>SYNTERA</div>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.14em", marginTop: 2 }}>Voice Intelligence</div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  border: "none", borderRadius: 0,
                  background: active ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "none",
                  color: active ? textColor : "#888",
                  fontSize: 12, fontWeight: active ? 500 : 400,
                  cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s",
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "16px 14px", borderTop: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", marginBottom: 4 }}>Settings</div>

          {setThemeProp && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: textColor }}>Theme</span>
              <select value={theme} onChange={(e) => setThemeProp(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 0, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
              </select>
            </div>
          )}

          {setSpacingProp && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: textColor }}>Spacing</span>
              <select value={spacingProp || "airy"} onChange={(e) => setSpacingProp(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 0, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
                <option value="airy">Airy</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          )}

          {onOpenSetup && (
            <button onClick={() => { setOpen(false); onOpenSetup(); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: `1px solid ${borderColor}`, borderRadius: 0, background: "none", color: "#888", fontSize: 12, cursor: "pointer", width: "100%", fontFamily: "'DM Mono', monospace" }}>
              ⚙ Re-run Setup Quiz
            </button>
          )}

          <button onClick={() => { setOpen(false); signOut(); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: "none", borderRadius: 0, background: "none", color: "#888", fontSize: 12, cursor: "pointer", width: "100%", fontFamily: "'DM Mono', monospace" }}>
            🚪 Sign Out
          </button>
        </div>
      </div>
    </>
  );
}