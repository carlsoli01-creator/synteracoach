import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronRight, ChevronLeft } from "lucide-react";

const NAV_ITEMS = [
  { label: "Analysis", path: "/" },
  { label: "Practice", path: "/scenarios" },
  { label: "Coach", path: "/coach" },
  { label: "Progress", path: "/progress" },
  { label: "Badges", path: "/badges" },
  { label: "History", path: "/history" },
  { label: "Profile", path: "/profile" },
];

const NAV_ITEMS_MOBILE = [
  { label: "Analysis", path: "/" },
  { label: "Scenarios", path: "/scenarios" },
  { label: "Coach", path: "/coach" },
  { label: "Progress", path: "/progress" },
  { label: "Badges", path: "/badges" },
  { label: "History", path: "/history" },
  { label: "Profile", path: "/profile" },
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
  const { isDark } = useTheme();
  const navItems = isMobile ? NAV_ITEMS_MOBILE : NAV_ITEMS;
  return (
    <>
      {/* Floating arrow toggle — always visible */}
      <button
        onClick={toggle}
        style={{
          position: "fixed",
          top: 20,
          left: expanded ? 224 : 12,
          zIndex: 301,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          borderRadius: 0,
          cursor: "pointer",
          transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          color: isDark ? "#fff" : "#000",
        }}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {expanded ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
      </button>

      {/* Overlay when expanded on mobile */}
      {expanded && (
        <div
          onClick={toggle}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 199,
            transition: "opacity 0.25s",
          }}
        />
      )}

      {/* Sidebar panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 220,
          background: "#0a0a0a",
          borderRight: "1px solid #1a1a1a",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Mono', monospace",
          transform: expanded ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "32px 28px 24px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.14em", color: "#ffffff", fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap" }}>
            SYNTERA
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "#555", marginTop: 4, textTransform: "uppercase", fontFamily: "'Syne', sans-serif", fontWeight: 400, whiteSpace: "nowrap" }}>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); toggle(); }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "11px 16px",
                  border: "none",
                  borderRadius: 0,
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "#ffffff" : "#999",
                  fontSize: 11,
                  fontWeight: active ? 500 : 400,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ marginTop: "auto", padding: "16px 12px", borderTop: "1px solid #1a1a1a", display: "flex", flexDirection: "column", gap: 6 }}>
          {onOpenSetup && (
            <button
              onClick={() => { toggle(); onOpenSetup(); }}
              style={{
                display: "block", width: "100%", padding: "11px 16px",
                border: "none", borderRadius: 0, background: "transparent",
                color: "#555", fontSize: 11, letterSpacing: "0.14em",
                textTransform: "uppercase", textAlign: "left", cursor: "pointer",
                fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap",
              }}
            >
              Re-run Setup
            </button>
          )}
          <button
            onClick={() => signOut()}
            style={{
              display: "block", width: "100%", padding: "11px 16px",
              border: "none", borderRadius: 0, background: "transparent",
              color: "#444", fontSize: 11, letterSpacing: "0.14em",
              textAlign: "left", cursor: "pointer",
              fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
