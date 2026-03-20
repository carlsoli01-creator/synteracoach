import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { Send, Lock, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/ui/footer";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback-coach`;

async function streamChat({
  messages, onDelta, onDone, onError,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (resp.status === 429) { onError("Rate limited — please wait a moment."); return; }
  if (resp.status === 402) { onError("AI credits exhausted."); return; }
  if (!resp.ok || !resp.body) { onError("Failed to reach coach."); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { /* partial */ }
    }
  }
  onDone();
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
      {lines.map((line, i) => {
        let processed: React.ReactNode = line.replace(/\*\*(.*?)\*\*/g, "§BOLD§$1§/BOLD§");
        const parts = (processed as string).split(/(§BOLD§.*?§\/BOLD§)/g);
        const rendered = parts.map((p, j) => {
          if (p.startsWith("§BOLD§")) {
            return <strong key={j}>{p.replace("§BOLD§", "").replace("§/BOLD§", "")}</strong>;
          }
          return p;
        });
        if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
          return <div key={i} style={{ paddingLeft: 16 }}>{rendered}</div>;
        }
        if (/^\d+\.\s/.test(line.trim())) {
          return <div key={i} style={{ paddingLeft: 16 }}>{rendered}</div>;
        }
        return <div key={i}>{rendered}</div>;
      })}
    </div>
  );
}

export default function Coach() {
  const isPremium = localStorage.getItem("syntera_premium") === "true";
  const navigate = useNavigate();
  const { sidebarWidth } = useSidebarState();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const bg = isDark ? "#0a0a0a" : "#fff";
  const text = isDark ? "#e8e8e8" : "#0a0a0a";
  const muted = isDark ? "#666" : "#888";
  const border = isDark ? "#222" : "#e2e2e2";
  const card = isDark ? "#141414" : "#f5f5f5";
  const inputBg = isDark ? "#111" : "#fafafa";
  const userBubble = isDark ? "#e8e8e8" : "#0a0a0a";
  const userBubbleText = isDark ? "#0a0a0a" : "#fff";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    setError("");
    let assistantSoFar = "";
    await streamChat({
      messages: newMsgs,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      },
      onDone: () => setLoading(false),
      onError: (msg) => { setError(msg); setLoading(false); },
    });
  };

  if (!isPremium) {
    return (
      <>
        <AppSidebar />
        <div style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 32,
          fontFamily: "'DM Mono', monospace", background: bg,
        }}>
          <Lock size={48} strokeWidth={1.5} color={isDark ? "#444" : "#ccc"} />
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 20, fontFamily: "'Syne', sans-serif", color: text }}>
            Elite Feature
          </div>
          <div style={{ fontSize: 13, color: muted, marginTop: 8, textAlign: "center", maxWidth: 360, lineHeight: 1.7 }}>
            Your personal Feedback Coach is available on the Elite plan. Upgrade to get unlimited, personalized AI coaching.
          </div>
          <button onClick={() => navigate("/")} style={{
            marginTop: 24, padding: "12px 28px", background: text, color: bg,
            border: "none", fontSize: 12, letterSpacing: "0.12em", cursor: "pointer",
            fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
          }}>
            Go Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <AppSidebar />
      <div style={{
        marginLeft: isMobile ? 0 : sidebarWidth,
        transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
        minHeight: "100vh", display: "flex", flexDirection: "column",
        background: bg, fontFamily: "'DM Mono', monospace",
      }}>
        <div style={{
          padding: "24px 28px 16px", borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: text }}>
              Feedback Coach
            </div>
            <div style={{ fontSize: 10, color: muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Your personal AI speaking coach
            </div>
          </div>
          <div style={{
            marginLeft: "auto", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase",
            background: text, color: bg, padding: "4px 10px", fontWeight: 500,
          }}>
            ELITE
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: muted, marginTop: 60, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎤</div>
              <div style={{ fontWeight: 500, color: isDark ? "#999" : "#555", marginBottom: 6 }}>Ask me anything about speaking</div>
              <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                "How do I reduce filler words?"<br />
                "Give me a 2-minute warm-up routine"<br />
                "My pace score is 62 — what should I work on?"
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%", padding: "12px 16px",
              background: msg.role === "user" ? userBubble : card,
              color: msg.role === "user" ? userBubbleText : text,
              fontSize: 13, lineHeight: 1.6, borderRadius: 0,
              border: msg.role === "user" ? "none" : `1px solid ${border}`,
            }}>
              {msg.role === "assistant" ? <SimpleMarkdown text={msg.content} /> : msg.content}
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div style={{
              alignSelf: "flex-start", padding: "12px 16px",
              background: card, border: `1px solid ${border}`,
              fontSize: 13, color: muted,
            }}>
              Thinking…
            </div>
          )}

          {error && (
            <div style={{ alignSelf: "center", color: "#c44", fontSize: 12, padding: "8px 16px", background: isDark ? "#1a0505" : "#fff5f5", border: `1px solid ${isDark ? "#3a1111" : "#fdd"}` }}>
              {error}
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div style={{
          padding: "16px 28px", borderTop: `1px solid ${border}`,
          display: "flex", gap: 10, background: bg,
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask your coach…"
            style={{
              flex: 1, padding: "12px 14px",
              border: `1px solid ${border}`, background: inputBg,
              fontSize: 13, fontFamily: "'DM Mono', monospace",
              outline: "none", color: text,
            }}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            padding: "12px 16px",
            background: loading || !input.trim() ? (isDark ? "#333" : "#ccc") : text,
            color: bg, border: "none",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", transition: "background 0.2s",
          }}>
            <Send size={16} />
          </button>
        </div>

        <Footer />
      </div>
    </>
  );
}