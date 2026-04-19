import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

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
      // Sign-in: skip intro, go straight to app
      localStorage.setItem("syntera_intro_done_v2", "true");
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
    try {
      // Try Lovable managed OAuth first (works in Lovable preview)
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.redirected) {
        return; // Browser is redirecting
      }
      if (result.error) {
        throw result.error;
      }
      // Success - session already set by lovable auth
      localStorage.setItem("syntera_intro_done_v2", "true");
      toast.success("Welcome back!");
      navigate("/");
    } catch {
      // Fallback to native Supabase OAuth (works on published domains with own credentials)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(`Failed to sign in with ${provider === "google" ? "Google" : "Apple"}.`);
      }
    } finally {
      setIsSubmitting(false);
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
      {/* Login Section */}
      <div
        className="flex items-center justify-center"
        style={{
          minHeight: "100vh",
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

        </div>
      </div>
    </div>
  );
}
