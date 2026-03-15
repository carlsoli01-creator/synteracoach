import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
{ label: "Analysis", path: "/" },
{ label: "Practice", path: "/scenarios" },
{ label: "Progress", path: "/progress" },
{ label: "Badges", path: "/badges" },
{ label: "History", path: "/history" },
{ label: "Profile", path: "/profile" }];


interface Props {
  userSubtitle?: string;
  onOpenSetup?: () => void;
}

export default function AppSidebar({ userSubtitle, onOpenSetup }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 220,
        background: "#0a0a0a",
        borderRight: "1px solid #1a1a1a",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Mono', monospace"
      }}>
      
      {/* Logo */}
      <div style={{ padding: "32px 28px 24px" }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: "#ffffff",
            fontFamily: "'Syne', sans-serif"
          }}>
          
          SYNTERA
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "#555",
            marginTop: 4,
            textTransform: "uppercase",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 400
          }}>
          
          {userSubtitle || "Voice Intelligence"}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "block",
                width: "100%",
                padding: "11px 16px",
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
                transition: "all 0.2s ease"
              }}>
              
              {item.label}
            </button>);

        })}
      </nav>

      {/* Bottom */}
      <div
        style={{
          marginTop: "auto",
          padding: "16px 12px",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          flexDirection: "column",
          gap: 6
        }}>
        
        {onOpenSetup &&
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
            fontFamily: "'DM Mono', monospace"
          }}>
          
            Re-run Setup
          </button>
        }
        <button
          onClick={() => signOut()}
          style={{
            display: "block",
            width: "100%",
            padding: "11px 16px",
            border: "none",
            borderRadius: 0,
            background: "transparent",
            color: "#444",
            fontSize: 11,
            letterSpacing: "0.14em",
            textAlign: "left",
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace"
          }}>
          
          Sign Out
        </button>
      </div>
    </div>);

}