import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { RetroGrid } from "@/components/ui/retro-grid";
import { Footer } from "@/components/ui/footer";

const emailSchema = z.string().trim()
  .email("Please enter a valid email address")
  .max(255)
  .refine((email) => {
    const domainPart = email.split("@")[1];
    if (!domainPart) return false;
    const tld = domainPart.split(".").pop();
    return !!tld && tld.length >= 2;
  }, { message: "Please enter a valid email with a real domain (e.g. gmail.com)" });
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();

  const [tab, setTab] = useState<"login" | "signup" | "forgot">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<{
    name?: string; email?: string; password?: string; confirmPassword?: string;
  }>({});

  const isMobile = useIsMobile();

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
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials")) {
        toast.error("Account not found or incorrect password. Please check your email and password.");
      } else {
        toast.error(error.message);
      }
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
      localStorage.removeItem("syntera_intro_done_v2");
      localStorage.removeItem("negotium_quiz_v2");
      localStorage.removeItem("syntera_premium");
      localStorage.removeItem("syntera_quiz_completed_at");
      localStorage.removeItem("syntera_tip_shown_date");
      toast.success("Check your email to verify your account!");
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setIsSubmitting(true);
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error(`Failed to sign in with ${provider === "google" ? "Google" : "Apple"}.`);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(forgotEmail);
    if (!result.success) {
      setForgotError(result.error.errors[0].message);
      return;
    }
    setForgotError("");
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for a password reset link!");
      setTab("login");
      setForgotEmail("");
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
    fontSize: 13,
    border: `1px solid ${hasError ? "#888" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 0,
    background: "rgba(255,255,255,0.04)",
    color: "#f0f0f0",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "'DM Mono', monospace",
  });

  return (
    <div style={{ background: "#080808", minHeight: "100vh", overflowY: "auto" }}>
      {/* Hero Banner with RetroGrid */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: 220, overflow: "hidden", background: "#0a0a0a" }}
      >
        <RetroGrid angle={65} />
        <div className="relative z-10 text-center pointer-events-none">
          <h1
            className="font-heading"
            style={{
              fontSize: isMobile ? 36 : 52,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.1em",
              lineHeight: 1,
            }}
          >
            SYNTERA
          </h1>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginTop: 10,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Speak with clarity.
          </p>
        </div>
      </div>

      {/* Login Section */}
      <div
        className="flex items-center justify-center"
        style={{
          minHeight: "calc(100vh - 220px)",
          padding: isMobile ? "40px 24px 32px" : "60px 44px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420, fontFamily: "'DM Mono', monospace" }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#f0f0f0",
              marginBottom: 6,
              fontFamily: "'Syne', sans-serif",
            }}>
              {tab === "forgot" ? "Reset password" : tab === "login" ? "Welcome back" : "Get started"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              {tab === "forgot"
                ? "Enter your email and we'll send you a reset link"
                : tab === "login"
                ? "Sign in to continue your voice training"
                : "Create your account and start improving today"
              }
            </div>
          </div>

          {/* Tabs */}
          {tab !== "forgot" && <div style={{ display: "flex", marginBottom: 28, gap: 4, background: "rgba(255,255,255,0.03)", padding: 4 }}>
            {(["login", "signup"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
                  border: "none",
                  color: tab === t ? "#f0f0f0" : "rgba(255,255,255,0.3)",
                  fontSize: 11,
                  fontWeight: tab === t ? 500 : 400,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>}

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
                <button
                  type="button"
                  onClick={() => setTab("forgot")}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", marginTop: 4, padding: 0, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%", padding: 15, background: "#fff", color: "#000",
                  border: "none", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em",
                  textTransform: "uppercase", cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1, transition: "opacity 0.2s",
                  fontFamily: "'DM Mono', monospace", marginTop: 8,
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
                <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Full Name</label>
                <input type="text" placeholder="Jane Smith" value={signupName} onChange={e => setSignupName(e.target.value)} disabled={isSubmitting} style={inputStyle(!!signupErrors.name)} />
                {signupErrors.name && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.name}</p>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Email</label>
                <input type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} disabled={isSubmitting} style={inputStyle(!!signupErrors.email)} />
                {signupErrors.email && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.email}</p>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} disabled={isSubmitting} style={{ ...inputStyle(!!signupErrors.password), paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signupErrors.password && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.password}</p>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Confirm Password</label>
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={signupConfirmPassword} onChange={e => setSignupConfirmPassword(e.target.value)} disabled={isSubmitting} style={inputStyle(!!signupErrors.confirmPassword)} />
                {signupErrors.confirmPassword && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.confirmPassword}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} style={{
                width: "100%", padding: 15, background: "#fff", color: "#000", border: "none",
                fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.6 : 1,
                transition: "opacity 0.2s", fontFamily: "'DM Mono', monospace", marginTop: 8,
              }}>
                {isSubmitting ? "Creating account..." : "Create Account →"}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {tab === "forgot" && (
            <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Email</label>
                <input type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} disabled={isSubmitting} style={inputStyle(!!forgotError)} />
                {forgotError && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{forgotError}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} style={{
                width: "100%", padding: 15, background: "#fff", color: "#000", border: "none",
                fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.6 : 1,
                transition: "opacity 0.2s", fontFamily: "'DM Mono', monospace", marginTop: 8,
              }}>
                {isSubmitting ? "Sending..." : "Send Reset Link →"}
              </button>
              <button type="button" onClick={() => setTab("login")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", textAlign: "center", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
                ← Back to sign in
              </button>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Social Login Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => handleOAuth("google")}
              disabled={isSubmitting}
              style={{
                width: "100%", padding: 14, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0",
                fontSize: 12, fontWeight: 400, cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.2s", fontFamily: "'DM Mono', monospace",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth("apple")}
              disabled={isSubmitting}
              style={{
                width: "100%", padding: 14, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0",
                fontSize: 12, fontWeight: 400, cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.2s", fontFamily: "'DM Mono', monospace",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Continue with Apple
            </button>
          </div>

          <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            By continuing, you agree to Syntera's Terms of Service
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dark">
        <Footer />
      </div>
    </div>
  );
}
