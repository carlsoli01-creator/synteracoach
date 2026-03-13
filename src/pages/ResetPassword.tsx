import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
      setChecking(false);
    });
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setIsRecovery(true);
    const timeout = setTimeout(() => setChecking(false), 3000);
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { password?: string; confirm?: string } = {};
    const result = passwordSchema.safeParse(password);
    if (!result.success) errs.password = result.error.errors[0].message;
    if (password !== confirmPassword) errs.confirm = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated successfully!"); navigate("/"); }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%", padding: "13px 16px", fontSize: 13,
    border: `1px solid ${hasError ? "#888" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 0, background: "rgba(255,255,255,0.04)",
    color: "#f0f0f0", outline: "none", transition: "border-color 0.2s",
    fontFamily: "'DM Mono', monospace",
  });

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080808" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#888" }} />
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080808", fontFamily: "'DM Mono', monospace" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>Invalid or expired link</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 28, lineHeight: 1.7 }}>
            This password reset link is no longer valid. Please request a new one.
          </div>
          <button onClick={() => navigate("/auth")} style={{
            padding: "14px 36px", background: "#fff", color: "#000",
            border: "none", borderRadius: 0, fontSize: 12, fontWeight: 500,
            cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Back to Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080808", fontFamily: "'DM Mono', monospace" }}>
      <div style={{ width: "min(420px, 90vw)", padding: "48px 36px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", marginBottom: 6, fontFamily: "'Syne', sans-serif" }}>Set new password</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>Choose a strong password for your account</div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, display: "block", fontFamily: "'DM Mono', monospace" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} disabled={isSubmitting}
                style={{ ...inputStyle(!!errors.password), paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{errors.password}</p>}
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, display: "block", fontFamily: "'DM Mono', monospace" }}>
              Confirm Password
            </label>
            <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} disabled={isSubmitting}
              style={inputStyle(!!errors.confirm)} />
            {errors.confirm && <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} style={{
            width: "100%", padding: 15, background: "#fff", color: "#000",
            border: "none", borderRadius: 0, fontSize: 12, fontWeight: 500,
            letterSpacing: "0.12em", textTransform: "uppercase",
            cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.6 : 1,
            transition: "opacity 0.2s", fontFamily: "'DM Mono', monospace", marginTop: 8,
          }}>
            {isSubmitting ? "Updating..." : "Update Password →"}
          </button>
        </form>
      </div>
    </div>
  );
}