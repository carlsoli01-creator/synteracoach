import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { Lock, ArrowLeft } from "lucide-react";
import { AIInput } from "@/components/ui/ai-input";

type Msg = {role: "user" | "assistant";content: string;};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback-coach`;

async function streamChat({
  messages, onDelta, onDone, onError





}: {messages: Msg[];onDelta: (t: string) => void;onDone: () => void;onError: (msg: string) => void;}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
    },
    body: JSON.stringify({ messages })
  });

  if (resp.status === 429) {onError("Rate limited — please wait a moment.");return;}
  if (resp.status === 402) {onError("AI credits exhausted.");return;}
  if (!resp.ok || !resp.body) {onError("Failed to reach coach.");return;}

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
      if (json === "[DONE]") {onDone();return;}
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {/* partial */}
    }
  }
  onDone();
}

function SimpleMarkdown({ text }: {text: string;}) {
  const lines = text.split("\n");
  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {lines.map((line, i) => {
        const processed: string = line.replace(/\*\*(.*?)\*\*/g, "§BOLD§$1§/BOLD§");
        const parts = processed.split(/(§BOLD§.*?§\/BOLD§)/g);
        const rendered = parts.map((p, j) => {
          if (p.startsWith("§BOLD§")) {
            return <strong key={j}>{p.replace("§BOLD§", "").replace("§/BOLD§", "")}</strong>;
          }
          return p;
        });
        if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
          return <div key={i} className="pl-4">{rendered}</div>;
        }
        if (/^\d+\.\s/.test(line.trim())) {
          return <div key={i} className="pl-4">{rendered}</div>;
        }
        return <div key={i}>{rendered}</div>;
      })}
    </div>);

}

export default function Coach() {
  const isPremium = localStorage.getItem("syntera_premium") === "true";
  const navigate = useNavigate();
  const { sidebarWidth } = useSidebarState();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (value: string) => {
    if (!value.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: value.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
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
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      },
      onDone: () => setLoading(false),
      onError: (msg) => {setError(msg);setLoading(false);}
    });
  };

  if (!isPremium) {
    return (
      <>
        <AppSidebar />
        <div
          className="min-h-screen flex flex-col items-center justify-center p-8 font-sans bg-background text-foreground transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
          
          <Lock size={48} strokeWidth={1.5} className="text-muted-foreground/40" />
          <h2 className="text-xl font-heading font-extrabold mt-5">Elite Feature</h2>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-[360px] leading-relaxed">
            Your personal Feedback Coach is available on the Elite plan. Upgrade to get unlimited, personalized AI coaching.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-7 py-3 bg-foreground text-background text-xs tracking-widest uppercase font-mono hover:opacity-90 active:scale-[0.97] transition-all">
            
            Go Back
          </button>
        </div>
      </>);

  }

  return (
    <>
      <AppSidebar />
      <div
        className="min-h-screen flex flex-col bg-background font-sans transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        
        {/* Header */}
        <div className="px-7 pt-6 pb-4 border-b border-border flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="bg-transparent border-none cursor-pointer text-muted-foreground flex hover:text-foreground transition-colors">
            
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-heading font-extrabold text-foreground">
              Feedback Coach
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
              Your personal AI speaking coach
            </p>
          </div>
          <span className="ml-auto text-[8px] tracking-[0.2em] uppercase bg-foreground text-background px-2.5 py-1 font-medium">
            ELITE
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-4">
          {messages.length === 0 &&
          <div className="text-center text-muted-foreground mt-16 text-sm">
              <div className="text-3xl mb-3">​</div>
              <div className="font-medium text-muted-foreground/80 mb-1.5">
                Ask me anything about speaking
              </div>
              <div className="text-xs leading-relaxed text-muted-foreground/60">
                "How do I reduce filler words?"<br />
                "Give me a 2-minute warm-up routine"<br />
                "My pace score is 62 — what should I work on?"
              </div>
            </div>
          }

          {messages.map((msg, i) =>
          <div
            key={i}
            className={
            msg.role === "user" ?
            "self-end max-w-[80%] px-4 py-3 bg-foreground text-background text-sm leading-relaxed rounded-2xl rounded-br-sm" :
            "self-start max-w-[80%] px-4 py-3 bg-muted text-foreground text-sm leading-relaxed rounded-2xl rounded-bl-sm border border-border"
            }>
            
              {msg.role === "assistant" ? <SimpleMarkdown text={msg.content} /> : msg.content}
            </div>
          )}

          {loading && messages[messages.length - 1]?.role !== "assistant" &&
          <div className="self-start px-4 py-3 bg-muted border border-border text-sm text-muted-foreground rounded-2xl rounded-bl-sm">
              <span className="animate-pulse">Thinking…</span>
            </div>
          }

          {error &&
          <div className="self-center text-xs px-4 py-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          }

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-7 py-4 border-t border-border bg-background">
          <AIInput
            placeholder="Ask your coach…"
            onSubmit={send}
            disabled={loading} />
          
        </div>
      </div>
    </>);

}