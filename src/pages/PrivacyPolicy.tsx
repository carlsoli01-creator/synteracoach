import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      t: "1. Information We Collect",
      p: "We collect the following categories of information: Personal Information (name, email address, account details, payment information if applicable, and profile preferences); Speech & Media Data (audio and video recordings you voluntarily upload, transcripts generated from them, and AI-derived analytics such as fillers, pace, tone, body language insights, charisma markers, and confidence scores); Usage Data (device information, IP address, browser type, interaction patterns, session duration, and feature usage); Feedback & Communications (support inquiries, survey responses, and voluntary testimonials). Data Collection for Minors: Our Services are not intended for or directed toward individuals under the age of 18. We do not knowingly collect personal information or speech recordings from minors. If we discover that we have inadvertently collected data from a user under 18 years of age, we will promptly delete such data and terminate the associated account. Parents or guardians who believe their child has provided data should contact us immediately at privacy@synterica.com.",
    },
    {
      t: "2. How We Use Your Information",
      p: "We use the collected information to: provide, personalize, and improve the Services (including AI speech analysis and progress tracking); generate personalized feedback and performance insights; communicate with you about updates, support, and relevant offers; ensure platform security, prevent abuse, and conduct internal research (using aggregated and anonymized data).",
    },
    {
      t: "3. Sharing and Disclosure",
      p: "We do not sell personal data. Sharing is limited to service providers under strict confidentiality agreements, legal requirements, or business transfers. Speech recordings remain private and are never shared publicly without your explicit consent.",
    },
    {
      t: "4. Data Security",
      p: "We implement industry-standard security measures to protect your recordings and personal data, including encryption in transit and at rest. However, no system is 100% secure, and we cannot guarantee absolute security.",
    },
    {
      t: "5. Your Rights and Choices",
      p: "You may request access, correction, deletion, or export of your data by contacting privacy@synterica.com. We respond to verified requests within 30 days. Depending on your jurisdiction (including residents of the EEA, UK, and California), you may also have rights to restrict or object to processing, withdraw consent, and lodge a complaint with a supervisory authority.",
    },
    {
      t: "6. Cookies and Tracking",
      p: "We use cookies and similar technologies for functionality, analytics, and personalization. You can manage preferences through your browser settings. See our Cookie Policy for more details.",
    },
    {
      t: "7. Children's Privacy",
      p: "Our Services are not directed to children under 18. We do not knowingly collect data from children. If we discover such data, we will delete it promptly (see Section 1 for more details).",
    },
    {
      t: "8. International Transfers",
      p: "Your data may be transferred to and processed in the United States or other countries that may have different data protection laws than your jurisdiction. We use appropriate safeguards, including contractual protections, for international transfers.",
    },
    {
      t: "9. Retention",
      p: "We retain your data as long as necessary to provide the Services or as required by law. You may request deletion of your account and associated data (subject to legal obligations). Voice recordings and derived analytics are deleted within a reasonable period after account closure.",
    },
    {
      t: "10. AI Processing",
      p: "Voice recordings and transcripts are processed by AI models (which may include third-party model providers operating under data processing agreements) to generate feedback and analytics. Your content is used to deliver the Services and improve quality, and is not used to train public foundation models without your consent.",
    },
    {
      t: "11. Third-Party Services",
      p: "We rely on third-party providers for hosting, authentication, payments, analytics, and AI processing. These providers process data on our behalf under contractual safeguards. Their use of information is governed by their own privacy policies.",
    },
    {
      t: "12. Data Breach Notification",
      p: "In the event of a data breach that affects your personal information, we will notify you and the relevant authorities as required by applicable law, without undue delay.",
    },
    {
      t: "13. Changes to This Policy",
      p: "We may update this Privacy Policy. Significant changes will be notified via email or in-app notice prior to taking effect.",
    },
    {
      t: "14. Contact",
      p: "For privacy-related inquiries, contact us at privacy@synterica.com.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, sans-serif", padding: "0 20px 60px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} className="text-muted-foreground" style={{ background: "none", border: "none", fontSize: 13, cursor: "pointer", padding: "20px 0" }}>← Back</button>
        <h1 className="text-foreground" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p className="text-muted-foreground" style={{ fontSize: 11, marginBottom: 24 }}>Last Updated: May 26, 2026</p>

        <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 32 }}>
          Synterica respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Services.
        </p>

        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{s.t}</h2>
            <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.7 }}>{s.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
