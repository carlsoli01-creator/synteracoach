import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const nameSchema = z.string().trim().max(100, "Name must be less than 100 characters");

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        toast.error("Failed to load profile");
      } else if (data) {
        setFullName(data.full_name || "");
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = nameSchema.safeParse(fullName);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 24, height: 24, border: "2px solid #333",
          borderTop: "2px solid #fff", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#000",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#fff",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 28px", borderBottom: "1px solid #151515",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", color: "#666",
            fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#444", fontWeight: 700, textTransform: "uppercase" }}>
          SYNTERA
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 440, margin: "0 auto", padding: "60px 24px",
        animation: "profileFadeIn 0.5s ease",
      }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          border: "2px solid #222", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 28, margin: "0 auto 24px", background: "#0a0a0a",
        }}>
          👤
        </div>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em",
            marginBottom: 6,
          }}>
            Profile
          </div>
          <div style={{ fontSize: 12, color: "#555", letterSpacing: "0.02em" }}>
            Manage your Syntera account
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontSize: 10, letterSpacing: "0.2em", color: "#555",
              textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 8,
            }}>
              EMAIL
            </label>
            <div style={{
              padding: "14px 16px", borderRadius: 10,
              background: "#0a0a0a", border: "1px solid #1a1a1a",
              fontSize: 13, color: "#555",
            }}>
              {user?.email}
            </div>
            <div style={{ fontSize: 10, color: "#333", marginTop: 6 }}>
              Email cannot be changed
            </div>
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: 32 }}>
            <label style={{
              fontSize: 10, letterSpacing: "0.2em", color: "#555",
              textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 8,
            }}>
              FULL NAME
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              disabled={saving}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 10,
                background: "#0a0a0a", border: `1px solid ${error ? "#c04a2a" : "#1a1a1a"}`,
                fontSize: 13, color: "#fff", outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "#333"; }}
              onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "#1a1a1a"; }}
            />
            {error && (
              <div style={{ fontSize: 11, color: "#c04a2a", marginTop: 6 }}>{error}</div>
            )}
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%", padding: "15px",
              fontSize: 13, fontWeight: 800, letterSpacing: "0.06em",
              background: "#fff", color: "#000",
              border: "none", borderRadius: 10, cursor: "pointer",
              opacity: saving ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Sign out */}
        <button
          onClick={() => signOut()}
          style={{
            width: "100%", padding: "14px", marginTop: 12,
            fontSize: 12, fontWeight: 600,
            background: "transparent", color: "#444",
            border: "1px solid #1a1a1a", borderRadius: 10,
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          Sign Out
        </button>
      </div>

      <style>{`
        @keyframes profileFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
