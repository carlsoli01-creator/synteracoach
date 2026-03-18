import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Send, Lock, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/ui/footer";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback-coach`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
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
        // Bold
        let processed: React.ReactNode = line.replace(/\*\*(.*?)\*\*/g, "§BOLD§$1§/BOLD§");
        const parts = (processed as string).split(/(§BOLD§.*?§\/BOLD§)/g);
        const rendered = parts.map((p, j) => {
          if (p.startsWith("§BOLD§")) {
            return <strong key={j}>{p.replace("§BOLD§", "").replace("§/BOLD§", "")}</strong>;
          }
          return p;
        });

        // Bullet
        if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
          return <div key={i} style={{ paddingLeft: 16 }}>{rendered}</div>;
        }
        // Numbered
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
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

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

  // Gate: Elite only
  if (!isPremium) {
    return (
      <>
        <AppSidebar />
        <div style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          fontFamily: "'DM Mono', monospace",
          background: "#fff",
        }}>
          <Lock size={48} strokeWidth={1.5} color="#ccc" />
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 20, fontFamily: "'Syne', sans-serif", color: "#0a0a0a" }}>
            Elite Feature
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 8, textAlign: "center", maxWidth: 360, lineHeight: 1.7 }}>
            Your personal Feedback Coach is available on the Elite plan. Upgrade to get unlimited, personalized AI coaching.
          </div>
          <button
            onClick={() => navigate("/")}
            style={{
              marginTop: 24, padding: "12px 28px", background: "#0a0a0a", color: "#fff",
              border: "none", fontSize: 12, letterSpacing: "0.12em", cursor: "pointer",
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
            }}
          >
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
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        fontFamily: "'DM Mono', monospace",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 28px 16px",
          borderBottom: "1px solid #e2e2e2",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: "#0a0a0a" }}>
              Feedback Coach
            </div>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Your personal AI speaking coach
            </div>
          </div>
          <div style={{
            marginLeft: "auto",
            fontSize: 8,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            background: "#0a0a0a",
            color: "#fff",
            padding: "4px 10px",
            fontWeight: 500,
          }}>
            ELITE
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#aaa", marginTop: 60, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎤</div>
              <div style={{ fontWeight: 500, color: "#555", marginBottom: 6 }}>Ask me anything about speaking</div>
              <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                "How do I reduce filler words?"<br />
                "Give me a 2-minute warm-up routine"<br />
                "My pace score is 62 — what should I work on?"
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                padding: "12px 16px",
                background: msg.role === "user" ? "#0a0a0a" : "#f5f5f5",
                color: msg.role === "user" ? "#fff" : "#0a0a0a",
                fontSize: 13,
                lineHeight: 1.6,
                borderRadius: 0,
                border: msg.role === "user" ? "none" : "1px solid #e2e2e2",
              }}
            >
              {msg.role === "assistant" ? <SimpleMarkdown text={msg.content} /> : msg.content}
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div style={{
              alignSelf: "flex-start",
              padding: "12px 16px",
              background: "#f5f5f5",
              border: "1px solid #e2e2e2",
              fontSize: 13,
              color: "#888",
            }}>
              Thinking…
            </div>
          )}

          {error && (
            <div style={{ alignSelf: "center", color: "#c44", fontSize: 12, padding: "8px 16px", background: "#fff5f5", border: "1px solid #fdd" }}>
              {error}
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "16px 28px",
          borderTop: "1px solid #e2e2e2",
          display: "flex",
          gap: 10,
          background: "#fff",
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask your coach…"
            style={{
              flex: 1,
              padding: "12px 14px",
              border: "1px solid #e2e2e2",
              background: "#fafafa",
              fontSize: 13,
              fontFamily: "'DM Mono', monospace",
              outline: "none",
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 16px",
              background: loading || !input.trim() ? "#ccc" : "#0a0a0a",
              color: "#fff",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              transition: "background 0.2s",
            }}
          >
            <Send size={16} />
          </button>
        </div>

        <Footer />
      </div>
    </>
  );
}
