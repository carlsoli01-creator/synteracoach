import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronRight, ChevronLeft } from "lucide-react";

const NAV_ITEMS = [
  { label: "Analysis", path: "/", glyph: "◎" },
  { label: "Practice", path: "/scenarios", glyph: "◈" },
  { label: "Coach", path: "/coach", glyph: "◇" },
  { label: "Progress", path: "/progress", glyph: "△" },
  { label: "Badges", path: "/badges", glyph: "▣" },
  { label: "History", path: "/history", glyph: "▤" },
  { label: "Profile", path: "/profile", glyph: "○" },
];

interface Props {
  userSubtitle?: string;
  onOpenSetup?: () => void;
}

export default function AppSidebar({ userSubtitle, onOpenSetup }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { expanded, toggle } = useSidebarState();
  const isMobile = useIsMobile();

  return (
    <>
      <button
        onClick={toggle}
        style={{
          position: "fixed", top: 20, left: expanded ? 224 : 12,
          zIndex: 301, width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none", borderRadius: 0,
          cursor: "pointer", transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
          color: "#e6e6e0",
        }}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {expanded ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
      </button>

      {expanded && (
        <div onClick={toggle} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 199, transition: "opacity 0.25s" }} />
      )}

      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 220,
        background: "#0c0c0e", borderRight: "1px solid #1a1a1c", zIndex: 200,
        display: "flex", flexDirection: "column", fontFamily: "'IBM Plex Mono', monospace",
        transform: expanded ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ padding: "32px 28px 24px" }}>
          <div style={{ fontSize: 22, letterSpacing: "0.08em", color: "#c8ff00", fontFamily: "'Bebas Neue', sans-serif", whiteSpace: "nowrap" }}>
            SYNTERA
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 0", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); toggle(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "11px 24px",
                  border: "none", borderRadius: 0,
                  borderLeft: active ? "2px solid #c8ff00" : "2px solid transparent",
                  background: active ? "rgba(200,255,0,0.04)" : "transparent",
                  color: active ? "#c8ff00" : "#555",
                  fontSize: 11, fontWeight: 400,
                  letterSpacing: "0.12em", textTransform: "uppercase" as const,
                  textAlign: "left" as const, cursor: "pointer",
                  fontFamily: "'IBM Plex Mono', monospace",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap" as const,
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>{item.glyph}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", padding: "16px 0", borderTop: "1px solid #1a1a1c", display: "flex", flexDirection: "column", gap: 0 }}>
          {onOpenSetup && (
            <button
              onClick={() => { toggle(); onOpenSetup(); }}
              style={{
                display: "block", width: "100%", padding: "11px 24px",
                border: "none", borderRadius: 0, background: "transparent",
                color: "#444", fontSize: 10, letterSpacing: "0.12em",
                textTransform: "uppercase" as const, textAlign: "left" as const, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" as const,
              }}
            >
              Re-run Setup
            </button>
          )}
          <button
            onClick={() => signOut()}
            style={{
              display: "block", width: "100%", padding: "11px 24px",
              border: "none", borderRadius: 0, background: "transparent",
              color: "#444", fontSize: 10, letterSpacing: "0.12em",
              textAlign: "left" as const, cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" as const,
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
