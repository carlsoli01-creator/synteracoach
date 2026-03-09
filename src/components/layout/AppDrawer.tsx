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
  theme: string;
  setTheme: (t: string) => void;
  spacingMode: string;
  setSpacingMode: (s: string) => void;
  onOpenSetup: () => void;
}

export default function AppDrawer({ theme, setTheme, spacingMode, setSpacingMode, onOpenSetup }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: 18,
          left: 18,
          zIndex: 100,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
        aria-label="Open menu"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 22,
              height: 2,
              background: theme === "dark" ? "#e8e0d0" : "#0b0b0b",
              borderRadius: 1,
            }}
          />
        ))}
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 200,
            transition: "opacity 0.2s",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: theme === "dark" ? "#0b0b0b" : "#fff",
          borderRight: `1px solid ${theme === "dark" ? "#1e1e1e" : "#e6e6e6"}`,
          zIndex: 300,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 20px 20px",
          borderBottom: `1px solid ${theme === "dark" ? "#1e1e1e" : "#e6e6e6"}`,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: theme === "dark" ? "#e8e0d0" : "#0b0b0b", letterSpacing: "0.05em" }}>
            SYNTERA
          </div>
          <div style={{ fontSize: 10, color: "#9aa0a6", letterSpacing: "0.14em", marginTop: 2 }}>
            Voice Intelligence
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  border: "none",
                  borderRadius: 8,
                  background: active
                    ? theme === "dark" ? "rgba(107,114,128,0.15)" : "rgba(107,114,128,0.08)"
                    : "none",
                  color: active
                    ? theme === "dark" ? "#e8e0d0" : "#0b0b0b"
                    : "#9aa0a6",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Settings Section */}
        <div style={{
          padding: "16px 14px",
          borderTop: `1px solid ${theme === "dark" ? "#1e1e1e" : "#e6e6e6"}`,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#9aa0a6", textTransform: "uppercase", marginBottom: 4 }}>
            Settings
          </div>

          {/* Theme Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: theme === "dark" ? "#e8e0d0" : "#0b0b0b" }}>Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: `1px solid ${theme === "dark" ? "#1e1e1e" : "#e6e6e6"}`,
                background: theme === "dark" ? "#151515" : "#f7f7f8",
                color: theme === "dark" ? "#e8e0d0" : "#0b0b0b",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              <option value="light">☀️ Light</option>
              <option value="dark">🌙 Dark</option>
            </select>
          </div>

          {/* Spacing Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: theme === "dark" ? "#e8e0d0" : "#0b0b0b" }}>Spacing</span>
            <select
              value={spacingMode}
              onChange={(e) => setSpacingMode(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: `1px solid ${theme === "dark" ? "#1e1e1e" : "#e6e6e6"}`,
                background: theme === "dark" ? "#151515" : "#f7f7f8",
                color: theme === "dark" ? "#e8e0d0" : "#0b0b0b",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              <option value="airy">Airy</option>
              <option value="compact">Compact</option>
            </select>
          </div>

          {/* Setup Button */}
          <button
            onClick={() => { setOpen(false); onOpenSetup(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              border: `1px solid ${theme === "dark" ? "#1e1e1e" : "#e6e6e6"}`,
              borderRadius: 8,
              background: "none",
              color: "#9aa0a6",
              fontSize: 12,
              cursor: "pointer",
              width: "100%",
            }}
          >
            ⚙ Re-run Setup Quiz
          </button>

          {/* Sign Out */}
          <button
            onClick={() => { setOpen(false); signOut(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              border: "none",
              borderRadius: 8,
              background: "none",
              color: "#c04a2a",
              fontSize: 12,
              cursor: "pointer",
              width: "100%",
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
