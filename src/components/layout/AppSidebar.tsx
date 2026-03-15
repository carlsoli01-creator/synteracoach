import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarState } from "@/contexts/SidebarContext";
import { ChevronRight, ChevronLeft } from "lucide-react";

const NAV_ITEMS = [
  { label: "Analysis", path: "/" },
  { label: "Practice", path: "/scenarios" },
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
  const { expanded, toggle, sidebarWidth } = useSidebarState();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: sidebarWidth,
        background: "#0a0a0a",
        borderRight: "1px solid #1a1a1a",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Mono', monospace",
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
      }}
    >
      {/* Logo + Toggle */}
      <div style={{ padding: expanded ? "32px 28px 24px" : "32px 0 24px", display: "flex", flexDirection: "column", alignItems: expanded ? "flex-start" : "center" }}>
        {expanded ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.14em", color: "#ffffff", fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap" }}>
              SYNTERA
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "#555", marginTop: 4, textTransform: "uppercase", fontFamily: "'Syne', sans-serif", fontWeight: 400, whiteSpace: "nowrap" }}>
              {userSubtitle || "Voice Intelligence"}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.08em", color: "#ffffff", fontFamily: "'Syne', sans-serif" }}>
            S
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "10px 0",
          border: "none",
          borderTop: "1px solid #1a1a1a",
          borderBottom: "1px solid #1a1a1a",
          background: "transparent",
          color: "#555",
          cursor: "pointer",
          transition: "color 0.2s",
        }}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", overflowX: "hidden" }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={!expanded ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: expanded ? "11px 16px" : "11px 0",
                justifyContent: expanded ? "flex-start" : "center",
                border: "none",
                borderRadius: 0,
                background: active ? "#ffffff" : "transparent",
                color: active ? "#0a0a0a" : "#555",
                fontSize: 11,
                fontWeight: active ? 500 : 400,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {expanded ? item.label : item.label.charAt(0)}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        style={{
          marginTop: "auto",
          padding: expanded ? "16px 12px" : "16px 0",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          overflow: "hidden",
        }}
      >
        {onOpenSetup && expanded && (
          <button
            onClick={onOpenSetup}
            style={{
              display: "block",
              width: "100%",
              padding: "11px 16px",
              border: "none",
              borderRadius: 0,
              background: "transparent",
              color: "#555",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              whiteSpace: "nowrap",
            }}
          >
            Re-run Setup
          </button>
        )}
        <button
          onClick={() => signOut()}
          title={!expanded ? "Sign Out" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: expanded ? "flex-start" : "center",
            width: "100%",
            padding: expanded ? "11px 16px" : "11px 0",
            border: "none",
            borderRadius: 0,
            background: "transparent",
            color: "#444",
            fontSize: 11,
            letterSpacing: "0.14em",
            textAlign: "left",
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {expanded ? "Sign Out" : "⏻"}
        </button>
      </div>
    </div>
  );
}
