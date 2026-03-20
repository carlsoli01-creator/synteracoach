import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const bg = isDark ? "#000" : "#fff";
  const text = isDark ? "#e8e0d0" : "#0b0b0b";
  const muted = isDark ? "#666" : "#999";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "Inter, sans-serif", padding: "0 20px 60px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: muted, fontSize: 13, cursor: "pointer", padding: "20px 0" }}>← Back</button>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 11, color: muted, marginBottom: 32 }}>Last updated: March 12, 2026</p>

        {[
          { t: "1. Information We Collect", p: "We collect information you provide directly (name, email, voice recordings during sessions) and information collected automatically (device info, usage data, IP address)." },
          { t: "2. How We Use Your Information", p: "We use your data to: provide and improve the Service, analyze your voice patterns, generate personalized coaching feedback, send notifications, and maintain account security." },
          { t: "3. Voice Data", p: "Voice recordings are processed by AI to generate feedback scores and tips. Recordings may be stored temporarily for analysis but are not shared with third parties. You can request deletion at any time." },
          { t: "4. Data Sharing", p: "We do not sell your personal information. We may share data with: service providers who assist in operating the platform, law enforcement when required by law, or in connection with a business transfer." },
          { t: "5. Data Security", p: "We implement industry-standard security measures to protect your data, including encryption in transit and at rest. However, no method of transmission is 100% secure." },
          { t: "6. Data Retention", p: "We retain your data for as long as your account is active or as needed to provide the Service. You may request account deletion, after which data will be removed within 30 days." },
          { t: "7. Your Rights", p: "Depending on your jurisdiction, you may have the right to: access, correct, or delete your data; object to processing; data portability; and withdraw consent." },
          { t: "8. Cookies", p: "We use cookies and similar technologies as described in our Cookie Policy to enhance your experience and analyze usage patterns." },
          { t: "9. Children's Privacy", p: "The Service is not intended for users under 16. We do not knowingly collect data from children." },
          { t: "10. Changes", p: "We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification." },
          { t: "11. Contact", p: "For privacy-related inquiries, contact us at privacy@syntera.ai." },
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