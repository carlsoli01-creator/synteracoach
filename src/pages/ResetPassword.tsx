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
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
      setChecking(false);
    });

    // Also check hash for recovery token
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const timeout = setTimeout(() => setChecking(false), 3000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/");
    }
  };

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

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0b0b" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#9aa0a6" }} />
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0b0b0b", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0", marginBottom: 12 }}>Invalid or expired link</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 28, lineHeight: 1.7 }}>
            This password reset link is no longer valid. Please request a new one.
          </div>
          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "14px 36px", background: "#fff", color: "#000",
              border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0b0b0b", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    }}>
      <div style={{ width: "min(420px, 90vw)", padding: "48px 36px" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>Set new password</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>Choose a strong password for your account</div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isSubmitting}
                style={{ ...inputStyle(!!errors.password), paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{errors.password}</p>}
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              style={inputStyle(!!errors.confirm)}
            />
            {errors.confirm && <p style={{ fontSize: 11, color: "#c04a2a", marginTop: 4 }}>{errors.confirm}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%", padding: 15,
              background: "linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%)",
              color: "#0b0b0b", border: "none", borderRadius: 10,
              fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1,
              transition: "opacity 0.2s, transform 0.1s",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", marginTop: 8,
            }}
          >
            {isSubmitting ? "Updating..." : "Update Password →"}
          </button>
        </form>
      </div>
    </div>
  );
}
