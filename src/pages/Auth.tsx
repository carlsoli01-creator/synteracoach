import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
      toast.success("Account created successfully!");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f8" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#6b7280" }} />
      </div>
    );
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "12px 14px",
    fontSize: 14,
    border: `1px solid ${hasError ? "#c04a2a" : "#e6e6e6"}`,
    borderRadius: 8,
    background: "#ffffff",
    color: "#0b0b0b",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  });

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f7f7f8",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      padding: 20,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#ffffff",
        borderRadius: 14,
        border: "1px solid #e6e6e6",
        padding: "40px 32px",
        boxShadow: "0 4px 24px rgba(16,24,40,0.06)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0b0b0b", letterSpacing: "0.05em", marginBottom: 4 }}>
            NEGOTIUM
          </div>
          <div style={{ fontSize: 12, color: "#9aa0a6", letterSpacing: "0.12em" }}>
            Voice Intelligence Platform
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: 28, borderBottom: "1px solid #e6e6e6" }}>
          {(["login", "signup"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "none",
                border: "none",
                borderBottom: tab === t ? "2px solid #0b0b0b" : "2px solid transparent",
                color: tab === t ? "#0b0b0b" : "#9aa0a6",
                fontSize: 11,
                fontWeight: tab === t ? 700 : 400,
                letterSpacing: "0.2em",
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
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
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
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ ...inputStyle(!!loginErrors.password), paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9aa0a6", cursor: "pointer" }}
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
                padding: 14,
                background: "#0b0b0b",
                color: "#f7f7f8",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
                transition: "opacity 0.2s",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                marginTop: 8,
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {tab === "signup" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={signupName}
                onChange={e => setSignupName(e.target.value)}
                disabled={isSubmitting}
                style={inputStyle(!!signupErrors.name)}
              />
              {signupErrors.name && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.name}</p>}
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
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
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ ...inputStyle(!!signupErrors.password), paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9aa0a6", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {signupErrors.password && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{signupErrors.password}</p>}
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
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
                padding: 14,
                background: "#0b0b0b",
                color: "#f7f7f8",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
                transition: "opacity 0.2s",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                marginTop: 8,
              }}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
