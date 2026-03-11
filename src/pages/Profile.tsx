import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const nameSchema = z.string().trim().max(100, "Name must be less than 100 characters");

type Tab = "profile" | "preferences" | "subscription" | "data" | "about";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "preferences", label: "Preferences", icon: "⚙️" },
  { id: "subscription", label: "Subscription", icon: "💎" },
  { id: "data", label: "Data & Privacy", icon: "🔒" },
  { id: "about", label: "About", icon: "ℹ️" },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 9, letterSpacing: "0.25em", color: "#444",
      textTransform: "uppercase", fontWeight: 700, marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function SettingRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 0", borderBottom: "1px solid #111",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: "#444", marginTop: 3, lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
      <div style={{ marginLeft: 16, flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none",
        background: checked ? "#fff" : "#222",
        cursor: "pointer", position: "relative",
        transition: "background 0.25s",
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        background: checked ? "#000" : "#555",
        position: "absolute", top: 3,
        left: checked ? 23 : 3,
        transition: "left 0.25s, background 0.25s",
      }} />
    </button>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  // Preferences state
  const [notificationsEnabled, setNotificationsEnabled] = useState(() =>
    localStorage.getItem("syntera_notif") !== "false"
  );
  const [dailyReminder, setDailyReminder] = useState(() =>
    localStorage.getItem("syntera_reminder") !== "false"
  );
  const [autoPlay, setAutoPlay] = useState(() =>
    localStorage.getItem("syntera_autoplay") === "true"
  );
  const [recordingQuality, setRecordingQuality] = useState(() =>
    localStorage.getItem("syntera_rec_quality") || "high"
  );
  const [defaultDuration, setDefaultDuration] = useState(() =>
    localStorage.getItem("syntera_default_duration") || "15"
  );
  const [feedbackDetail, setFeedbackDetail] = useState(() =>
    localStorage.getItem("syntera_feedback_detail") || "detailed"
  );
  const [hapticFeedback, setHapticFeedback] = useState(() =>
    localStorage.getItem("syntera_haptic") !== "false"
  );

  const isPremium = localStorage.getItem("syntera_premium") === "true";

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const [profileRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("voice_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (profileRes.data) setFullName(profileRes.data.full_name || "");
      setSessionCount(sessionsRes.count || 0);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  const savePref = useCallback((key: string, value: string) => {
    localStorage.setItem(key, value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = nameSchema.safeParse(fullName);
    if (!result.success) { setError(result.error.errors[0].message); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated");
  };

  const handleDeleteHistory = async () => {
    if (!user) return;
    if (!confirm("Delete all your voice session history? This cannot be undone.")) return;
    const { error } = await supabase.from("voice_sessions").delete().eq("user_id", user.id);
    if (error) toast.error("Failed to delete history");
    else { setSessionCount(0); toast.success("All session data deleted"); }
  };

  const handleResetPreferences = () => {
    const keys = [
      "syntera_notif", "syntera_reminder", "syntera_autoplay",
      "syntera_rec_quality", "syntera_default_duration", "syntera_feedback_detail",
      "syntera_haptic",
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    setNotificationsEnabled(true);
    setDailyReminder(true);
    setAutoPlay(false);
    setRecordingQuality("high");
    setDefaultDuration("15");
    setFeedbackDetail("detailed");
    setHapticFeedback(true);
    toast.success("Preferences reset to defaults");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #333", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "'Inter', system-ui, sans-serif", color: "#fff" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px", borderBottom: "1px solid #111",
      }}>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ← Back
        </button>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#333", fontWeight: 700 }}>SYNTERA</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* Profile header card */}
        <div style={{
          display: "flex", alignItems: "center", gap: 20, padding: "28px 24px",
          background: "#0a0a0a", border: "1px solid #151515", borderRadius: 16,
          marginBottom: 32, animation: "pfadeIn 0.5s ease",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "#111",
            border: "2px solid #222", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 26, flexShrink: 0,
          }}>
            {fullName ? fullName.charAt(0).toUpperCase() : "👤"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 2 }}>
              {fullName || "Syntera User"}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>{user?.email}</div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ fontSize: 10, color: "#444" }}>
                <span style={{ color: "#888", fontWeight: 700 }}>{sessionCount}</span> sessions
              </div>
              <div style={{ fontSize: 10, color: "#444" }}>
                Member since <span style={{ color: "#888", fontWeight: 700 }}>{memberSince}</span>
              </div>
            </div>
          </div>
          <div style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 9,
            fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase",
            background: isPremium ? "#fff" : "#1a1a1a",
            color: isPremium ? "#000" : "#555",
            border: `1px solid ${isPremium ? "#fff" : "#222"}`,
          }}>
            {isPremium ? "PRO" : "FREE"}
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 28, overflowX: "auto",
          borderBottom: "1px solid #111", paddingBottom: 0,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px", fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? "#fff" : "#555",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: activeTab === tab.id ? "2px solid #fff" : "2px solid transparent",
                transition: "all 0.2s", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 14 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ animation: "pfadeIn 0.3s ease" }} key={activeTab}>

          {/* ===== PROFILE TAB ===== */}
          {activeTab === "profile" && (
            <form onSubmit={handleSubmit}>
              <SectionLabel>Personal Information</SectionLabel>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, letterSpacing: "0.15em", color: "#444", fontWeight: 700, display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                  EMAIL
                </label>
                <div style={{ padding: "13px 16px", borderRadius: 10, background: "#0a0a0a", border: "1px solid #151515", fontSize: 13, color: "#444" }}>
                  {user?.email}
                </div>
                <div style={{ fontSize: 10, color: "#2a2a2a", marginTop: 5 }}>Managed by your auth provider</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, letterSpacing: "0.15em", color: "#444", fontWeight: 700, display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                  FULL NAME
                </label>
                <input
                  type="text" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name" disabled={saving}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 10,
                    background: "#0a0a0a", border: `1px solid ${error ? "#c04a2a" : "#151515"}`,
                    fontSize: 13, color: "#fff", outline: "none", transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "#333"; }}
                  onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "#151515"; }}
                />
                {error && <div style={{ fontSize: 11, color: "#c04a2a", marginTop: 5 }}>{error}</div>}
              </div>

              <button type="submit" disabled={saving} style={{
                width: "100%", padding: "14px", fontSize: 13, fontWeight: 800,
                letterSpacing: "0.06em", background: "#fff", color: "#000",
                border: "none", borderRadius: 10, cursor: "pointer",
                opacity: saving ? 0.5 : 1, transition: "opacity 0.2s",
              }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <div style={{ marginTop: 32 }}>
                <SectionLabel>Account Actions</SectionLabel>
                <button onClick={() => signOut()} type="button" style={{
                  width: "100%", padding: "13px", fontSize: 12, fontWeight: 600,
                  background: "transparent", color: "#555", border: "1px solid #1a1a1a",
                  borderRadius: 10, cursor: "pointer", transition: "all 0.2s", marginBottom: 8,
                }}>
                  Sign Out
                </button>
              </div>
            </form>
          )}

          {/* ===== PREFERENCES TAB ===== */}
          {activeTab === "preferences" && (
            <div>
              <SectionLabel>Notifications</SectionLabel>
              <SettingRow label="Push Notifications" description="Get notified about daily tips and streaks">
                <Toggle checked={notificationsEnabled} onChange={(v) => { setNotificationsEnabled(v); savePref("syntera_notif", String(v)); }} />
              </SettingRow>
              <SettingRow label="Daily Practice Reminder" description="Receive a daily nudge to practice">
                <Toggle checked={dailyReminder} onChange={(v) => { setDailyReminder(v); savePref("syntera_reminder", String(v)); }} />
              </SettingRow>

              <div style={{ marginTop: 28 }} />
              <SectionLabel>Recording</SectionLabel>
              <SettingRow label="Recording Quality" description="Higher quality uses more bandwidth">
                <select
                  value={recordingQuality}
                  onChange={(e) => { setRecordingQuality(e.target.value); savePref("syntera_rec_quality", e.target.value); }}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "1px solid #222",
                    background: "#0a0a0a", color: "#ccc", fontSize: 12, cursor: "pointer", outline: "none",
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </SettingRow>
              <SettingRow label="Default Duration" description="Default recording timer length">
                <select
                  value={defaultDuration}
                  onChange={(e) => { setDefaultDuration(e.target.value); savePref("syntera_default_duration", e.target.value); }}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "1px solid #222",
                    background: "#0a0a0a", color: "#ccc", fontSize: 12, cursor: "pointer", outline: "none",
                  }}
                >
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="45">45 seconds</option>
                  <option value="60">60 seconds</option>
                </select>
              </SettingRow>
              <SettingRow label="Auto-play Feedback" description="Automatically read AI feedback aloud">
                <Toggle checked={autoPlay} onChange={(v) => { setAutoPlay(v); savePref("syntera_autoplay", String(v)); }} />
              </SettingRow>

              <div style={{ marginTop: 28 }} />
              <SectionLabel>Analysis</SectionLabel>
              <SettingRow label="Feedback Detail Level" description="How much detail to include in reports">
                <select
                  value={feedbackDetail}
                  onChange={(e) => { setFeedbackDetail(e.target.value); savePref("syntera_feedback_detail", e.target.value); }}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "1px solid #222",
                    background: "#0a0a0a", color: "#ccc", fontSize: 12, cursor: "pointer", outline: "none",
                  }}
                >
                  <option value="brief">Brief</option>
                  <option value="detailed">Detailed</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </SettingRow>
              <SettingRow label="Haptic Feedback" description="Vibrate on recording start/stop">
                <Toggle checked={hapticFeedback} onChange={(v) => { setHapticFeedback(v); savePref("syntera_haptic", String(v)); }} />
              </SettingRow>

              <button onClick={handleResetPreferences} style={{
                width: "100%", padding: "13px", marginTop: 24, fontSize: 12, fontWeight: 600,
                background: "transparent", color: "#444", border: "1px solid #1a1a1a",
                borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
              }}>
                Reset All Preferences
              </button>
            </div>
          )}

          {/* ===== SUBSCRIPTION TAB ===== */}
          {activeTab === "subscription" && (
            <div>
              <SectionLabel>Current Plan</SectionLabel>
              <div style={{
                padding: "24px", borderRadius: 14, background: "#0a0a0a",
                border: isPremium ? "1px solid #333" : "1px solid #151515", marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.01em" }}>
                      {isPremium ? "Pro Plan" : "Free Plan"}
                    </div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                      {isPremium ? "$8.99/month · Billed monthly" : "$0 · Limited features"}
                    </div>
                  </div>
                  <div style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 10,
                    fontWeight: 800, letterSpacing: "0.15em",
                    background: isPremium ? "#fff" : "#151515",
                    color: isPremium ? "#000" : "#555",
                  }}>
                    {isPremium ? "ACTIVE" : "FREE TIER"}
                  </div>
                </div>

                {!isPremium && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
                    {[
                      { label: "Recordings", free: "5/day", pro: "Unlimited" },
                      { label: "Analysis", free: "Basic", pro: "Full 7D" },
                      { label: "Coaching", free: "—", pro: "Personalized" },
                      { label: "History", free: "7 days", pro: "Unlimited" },
                    ].map((f, i) => (
                      <div key={i} style={{
                        background: "#060606", borderRadius: 10, padding: "12px",
                        border: "1px solid #111",
                      }}>
                        <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
                          {f.label}
                        </div>
                        <div style={{ fontSize: 11, color: "#888" }}>
                          <span style={{ color: "#555" }}>{f.free}</span>
                          <span style={{ color: "#333", margin: "0 6px" }}>→</span>
                          <span style={{ color: "#fff", fontWeight: 700 }}>{f.pro}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isPremium && (
                <button onClick={() => {
                  localStorage.setItem("syntera_premium", "true");
                  window.location.reload();
                }} style={{
                  width: "100%", padding: "15px", fontSize: 14, fontWeight: 900,
                  letterSpacing: "0.04em", background: "#fff", color: "#000",
                  border: "none", borderRadius: 10, cursor: "pointer",
                  boxShadow: "0 0 40px rgba(255,255,255,0.08)",
                  transition: "all 0.2s", marginBottom: 8,
                }}>
                  Upgrade to Pro — $8.99/mo
                </button>
              )}

              {isPremium && (
                <button onClick={() => {
                  localStorage.removeItem("syntera_premium");
                  toast.success("Subscription cancelled");
                  window.location.reload();
                }} style={{
                  width: "100%", padding: "13px", fontSize: 12, fontWeight: 600,
                  background: "transparent", color: "#444", border: "1px solid #1a1a1a",
                  borderRadius: 10, cursor: "pointer",
                }}>
                  Cancel Subscription
                </button>
              )}

              <div style={{ fontSize: 10, color: "#333", textAlign: "center", marginTop: 12 }}>
                Payments will be handled via Stripe when connected
              </div>
            </div>
          )}

          {/* ===== DATA & PRIVACY TAB ===== */}
          {activeTab === "data" && (
            <div>
              <SectionLabel>Your Data</SectionLabel>
              <div style={{
                padding: "20px", borderRadius: 14, background: "#0a0a0a",
                border: "1px solid #151515", marginBottom: 20,
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Sessions", value: sessionCount },
                    { label: "Storage", value: `${(sessionCount * 0.02).toFixed(1)} MB` },
                    { label: "Account Age", value: memberSince || "—" },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <SectionLabel>Privacy Controls</SectionLabel>
              <SettingRow label="Save Transcripts" description="Store transcriptions of your recordings">
                <Toggle checked={true} onChange={() => toast.info("Coming soon")} />
              </SettingRow>
              <SettingRow label="Analytics" description="Help us improve with anonymous usage data">
                <Toggle checked={true} onChange={() => toast.info("Coming soon")} />
              </SettingRow>

              <div style={{ marginTop: 28 }} />
              <SectionLabel>Danger Zone</SectionLabel>
              <div style={{
                padding: "20px", borderRadius: 14, border: "1px solid #1a1010",
                background: "rgba(192,74,42,0.03)",
              }}>
                <div style={{ fontSize: 13, color: "#c04a2a", fontWeight: 600, marginBottom: 6 }}>
                  Delete All Session Data
                </div>
                <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6, marginBottom: 14 }}>
                  Permanently delete all your voice session recordings, scores, and history. This action cannot be undone.
                </div>
                <button onClick={handleDeleteHistory} style={{
                  padding: "10px 20px", fontSize: 12, fontWeight: 700,
                  background: "transparent", color: "#c04a2a",
                  border: "1px solid rgba(192,74,42,0.3)", borderRadius: 8,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  Delete All Data
                </button>
              </div>

              <button onClick={() => {
                localStorage.clear();
                signOut();
              }} style={{
                width: "100%", padding: "13px", marginTop: 16, fontSize: 12, fontWeight: 600,
                background: "transparent", color: "#c04a2a",
                border: "1px solid rgba(192,74,42,0.2)", borderRadius: 10,
                cursor: "pointer",
              }}>
                Delete Account & Sign Out
              </button>
            </div>
          )}

          {/* ===== ABOUT TAB ===== */}
          {activeTab === "about" && (
            <div>
              <SectionLabel>About Syntera</SectionLabel>
              <div style={{
                padding: "28px 24px", borderRadius: 14, background: "#0a0a0a",
                border: "1px solid #151515", marginBottom: 24, textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎙️</div>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.01em", marginBottom: 6 }}>
                  Syntera
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#444", textTransform: "uppercase", marginBottom: 16 }}>
                  AI Voice Coach
                </div>
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8, maxWidth: 360, margin: "0 auto" }}>
                  Syntera analyzes your speech across 7 dimensions — pace, tone, confidence, clarity,
                  word choice, filler words, and persuasion — to help you become a more powerful communicator.
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Version", value: "1.0.0" },
                  { label: "Platform", value: "Web" },
                  { label: "AI Engine", value: "Gemini Pro" },
                  { label: "License", value: "Proprietary" },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: 10, background: "#0a0a0a",
                    border: "1px solid #151515",
                  }}>
                    <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <SectionLabel>Legal</SectionLabel>
              {["Terms of Service", "Privacy Policy", "Cookie Policy"].map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 0", borderBottom: "1px solid #111", cursor: "pointer",
                }}>
                  <span style={{ fontSize: 13, color: "#888" }}>{item}</span>
                  <span style={{ fontSize: 12, color: "#333" }}>→</span>
                </div>
              ))}

              <div style={{ textAlign: "center", marginTop: 32, fontSize: 10, color: "#333", letterSpacing: "0.1em" }}>
                © 2026 Syntera. All rights reserved.
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pfadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
