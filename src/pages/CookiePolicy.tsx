import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

export default function CookiePolicy() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const bg = isDark ? "#000" : "#fff";
  const text = isDark ? "#e8e0d0" : "#0b0b0b";
  const muted = isDark ? "#666" : "#999";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, sans-serif", padding: "0 20px 60px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: muted, fontSize: 13, cursor: "pointer", padding: "20px 0" }}>← Back</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Cookie Policy</h1>
        <p style={{ fontSize: 11, color: muted, marginBottom: 32 }}>Last updated: March 12, 2026</p>

        {[
          { t: "1. What Are Cookies", p: "Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how you use it." },
          { t: "2. How We Use Cookies", p: "Synterica uses cookies to: keep you signed in, remember your theme and display preferences, analyze usage patterns, and improve performance." },
          { t: "3. Essential Cookies", p: "These are required for the Service to function. They handle authentication, session management, and security. You cannot opt out of essential cookies." },
          { t: "4. Analytics Cookies", p: "We use analytics cookies to understand how users interact with the Service, which features are most popular, and where users encounter issues." },
          { t: "5. Preference Cookies", p: "These remember your settings such as theme (light/dark mode), spacing preferences, and language to provide a personalized experience." },
          { t: "6. Third-Party Cookies", p: "Some cookies may be set by third-party services we use (e.g., analytics providers). These are governed by the respective third party's privacy policy." },
          { t: "7. Managing Cookies", p: "You can manage cookies through your browser settings. Disabling certain cookies may affect the functionality of the Service." },
          { t: "8. Changes", p: "We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date." },
          { t: "9. Contact", p: "For questions about our use of cookies, contact us at privacy@synterica.ai." },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{s.t}</h2>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: isDark ? "#aaa" : "#555" }}>{s.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}