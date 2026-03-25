import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

export default function TermsOfService() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const bg = isDark ? "#000" : "#fff";
  const text = isDark ? "#e8e0d0" : "#0b0b0b";
  const muted = isDark ? "#666" : "#999";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, sans-serif", padding: "0 20px 60px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} className="text-muted-foreground" style={{ background: "none", border: "none", fontSize: 13, cursor: "pointer", padding: "20px 0" }}>← Back</button>
        <h1 className="text-foreground" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
        <p className="text-muted-foreground" style={{ fontSize: 11, marginBottom: 32 }}>Last updated: March 12, 2026</p>

        {[
          { t: "1. Acceptance of Terms", p: "By accessing or using Synterica, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service." },
          { t: "2. Description of Service", p: "Synterica is a voice intelligence and coaching platform that provides AI-powered analysis of your speech patterns, negotiation skills, and communication effectiveness." },
          { t: "3. User Accounts", p: "You must create an account to use the Service. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account." },
          { t: "4. Acceptable Use", p: "You agree not to misuse the Service, including but not limited to: reverse engineering, unauthorized access, transmitting harmful content, or using the Service for illegal purposes." },
          { t: "5. Intellectual Property", p: "All content, features, and functionality of the Service are owned by Synterica and protected by copyright, trademark, and other intellectual property laws." },
          { t: "6. Privacy", p: "Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference." },
          { t: "7. Disclaimer of Warranties", p: "The Service is provided as-is without warranties of any kind, express or implied. Synterica does not guarantee that the Service will be uninterrupted or error-free." },
          { t: "8. Limitation of Liability", p: "To the maximum extent permitted by law, Synterica shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service." },
          { t: "9. Termination", p: "We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice." },
          { t: "10. Changes to Terms", p: "We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms." },
          { t: "11. Contact", p: "For questions about these Terms, contact us at legal@synterica.ai." },
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