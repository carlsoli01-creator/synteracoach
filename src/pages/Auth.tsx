import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff, Mic } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<{
    name?: string; email?: string; password?: string; confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [user, loading, navigate]);

  const validateLoginForm = () => {
    const errors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(loginEmail);
    if (!emailResult.success) errors.email = emailResult.error.errors[0].message;
    if (!loginPassword) errors.password = "Password is required";
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignupForm = () => {
    const errors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    const nameResult = nameSchema.safeParse(signupName);
    if (!nameResult.success) errors.name = nameResult.error.errors[0].message;
    const emailResult = emailSchema.safeParse(signupEmail);
    if (!emailResult.success) errors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(signupPassword);
    if (!passwordResult.success) errors.password = passwordResult.error.errors[0].message;
    if (signupPassword !== signupConfirmPassword) errors.confirmPassword = "Passwords do not match";
    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    setIsSubmitting(true);
    const { error } = await signIn(loginEmail.trim(), loginPassword);
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message.includes("Invalid login credentials") ? "Invalid email or password." : error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;
    setIsSubmitting(true);
    const { error } = await signUp(signupEmail.trim(), signupPassword, signupName.trim());
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message.includes("User already registered") ? "An account with this email already exists." : error.message);
    } else {
      toast.success("Check your email to verify your account!");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0b0b" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#9aa0a6" }} />
      </div>
    );
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "13px 16px",
    fontSize: 14,
    border: `1px solid ${hasError ? "#c04a2a" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    color: "#f0f0f0",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  });

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    }}>
      {/* Left panel — branding (hidden on mobile) */}
      {!isMobile && <div style={{
        flex: 1,
        background: "linear-gradient(160deg, #0b0b0b 0%, #1a1a2e 50%, #0b0b0b 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle grid overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 380 }}>
          {/* Logo mark */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
          }}>
            <Mic size={28} style={{ color: "rgba(255,255,255,0.7)" }} />
          </div>

          <div style={{
            fontSize: 36,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "0.08em",
            marginBottom: 12,
          }}>
            SYNTERA
          </div>

          <div style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.7,
            marginBottom: 40,
          }}>
            AI-powered voice coaching that tells you the truth about how you speak — and shows you how to improve.
          </div>

          {/* Feature bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
            {[
              { icon: "🎯", text: "Honest scoring — no inflated grades" },
              { icon: "🧠", text: "Deep analysis of pace, clarity & confidence" },
              { icon: "📈", text: "Track your progress over time" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Right panel — form */}
      <div style={{
        width: isMobile ? "100%" : 460,
        minWidth: isMobile ? undefined : 400,
        flex: isMobile ? 1 : undefined,
        background: "#111114",
        display: "flex",
        flexDirection: "column",
        justifyContent: isMobile ? "flex-start" : "center",
        padding: isMobile ? "60px 24px 32px" : "48px 44px",
        borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#f0f0f0",
            marginBottom: 6,
          }}>
            {tab === "login" ? "Welcome back" : "Get started"}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            {tab === "login"
              ? "Sign in to continue your voice training"
              : "Create your account and start improving today"
            }
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: 28, gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
          {(["login", "signup"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "10px 0",
                background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none",
                borderRadius: 8,
                color: tab === t ? "#f0f0f0" : "rgba(255,255,255,0.3)",
                fontSize: 12,
                fontWeight: tab === t ? 600 : 400,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                disabled={isSubmitting}
                style={inputStyle(!!loginErrors.email)}
              />
              {loginErrors.email && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{loginErrors.email}</p>}
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ ...inputStyle(!!loginErrors.password), paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {loginErrors.password && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{loginErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: 15,
                background: "linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%)",
                color: "#0b0b0b",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
                transition: "opacity 0.2s, transform 0.1s",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                marginTop: 8,
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign In →"}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {tab === "signup" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={signupName}
                onChange={e => setSignupName(e.target.value)}
                disabled={isSubmitting}
                style={inputStyle(!!signupErrors.name)}
              />
              {signupErrors.name && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.name}</p>}
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                disabled={isSubmitting}
                style={inputStyle(!!signupErrors.email)}
              />
              {signupErrors.email && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.email}</p>}
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ ...inputStyle(!!signupErrors.password), paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {signupErrors.password && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.password}</p>}
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={signupConfirmPassword}
                onChange={e => setSignupConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                style={inputStyle(!!signupErrors.confirmPassword)}
              />
              {signupErrors.confirmPassword && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: 15,
                background: "linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%)",
                color: "#0b0b0b",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
                transition: "opacity 0.2s, transform 0.1s",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                marginTop: 8,
              }}
            >
              {isSubmitting ? "Creating account..." : "Create Account →"}
            </button>
          </form>
        )}

        {/* Footer */}
        {!isMobile && <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          By continuing, you agree to Syntera's Terms of Service
        </div>}
      </div>
    </div>
  );
}
