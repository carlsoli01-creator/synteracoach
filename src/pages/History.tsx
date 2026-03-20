import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarState } from "@/contexts/SidebarContext";
import { toast } from "@/hooks/use-toast";

function HistoryRow({ entry, index, onDelete }: { entry: any; index: number; onDelete: (id: string) => void }) {
  const score = entry.overall_score ?? entry.overall;
  const pace = entry.pace_score ?? entry.pace;
  const conf = entry.confidence_score ?? entry.conf;
  const clar = entry.clarity_score ?? entry.clar;
  const time = entry.created_at ? new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const date = entry.created_at ? new Date(entry.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) : "";
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D";
  const [hoverDel, setHoverDel] = useState(false);

  return (
    <div style={{
      width: "100%", padding: "18px 0", borderBottom: "1px solid #1a1a1c",
      display: "flex", alignItems: "center", gap: 24,
    }}>
      <div style={{ fontSize: 28, minWidth: 32, fontFamily: "'Bebas Neue', sans-serif", color: "#e6e6e0", letterSpacing: "0.04em" }}>{grade}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#e6e6e0", marginBottom: 4 }}>
          Session #{index + 1} — <span style={{ fontWeight: 500 }}>{score}/100</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[{ k: "PACE", v: pace }, { k: "CONF", v: conf }, { k: "CLAR", v: clar }].map(({ k, v }) => (
            <div key={k} style={{ fontSize: 9, letterSpacing: "0.1em", color: "#555" }}>
              {k} <span style={{ color: "#888" }}>{v}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 9, color: "#555", textAlign: "right" }}>
          {date && <div>{date}</div>}
          <div>{time}</div>
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          onMouseEnter={() => setHoverDel(true)}
          onMouseLeave={() => setHoverDel(false)}
          style={{
            background: "none", border: `1px solid ${hoverDel ? "#c85040" : "#1a1a1c"}`,
            cursor: "pointer", padding: "4px 8px", fontSize: 9,
            color: hoverDel ? "#c85040" : "#555",
            letterSpacing: "0.1em", borderRadius: 0, transition: "all 0.15s",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function History() {
  const { user } = useAuth();
  const { sidebarWidth } = useSidebarState();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("voice_sessions").select("*")
        .order("created_at", { ascending: false }).limit(50);
      if (data) setHistory(data);
    };
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("voice_sessions").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete session", variant: "destructive" });
    } else {
      setHistory(prev => prev.filter(s => s.id !== id));
      toast({ title: "Deleted", description: "Session removed" });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c0e", fontFamily: "'IBM Plex Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: sidebarWidth, transition: "padding-left 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ padding: "48px 48px 32px" }}>
          <h1 style={{ fontSize: 48, fontFamily: "'Bebas Neue', sans-serif", color: "#e6e6e0", letterSpacing: "0.06em", lineHeight: 1, margin: 0 }}>
            HISTORY
          </h1>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#555", textTransform: "uppercase", marginTop: 10 }}>
            {history.length} sessions
          </div>
        </div>
        <div style={{ maxWidth: 900, padding: "0 48px", paddingBottom: 80 }}>
          {history.length === 0 ? (
            <div style={{ color: "#555", fontSize: 12, padding: "60px 0" }}>
              No sessions yet. Record your first session to see history.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {history.map((entry, i) => (
                  <HistoryRow key={entry.id || i} entry={entry} index={history.length - 1 - i} onDelete={handleDelete} />
                ))}
              </div>
              {history.length > 1 && (
                <div style={{ padding: "32px 0" }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#555", textTransform: "uppercase", marginBottom: 10 }}>
                    Score Trend
                  </div>
                  {(() => {
                    const points = [...history].reverse().map((h, i) => ({
                      score: h.overall_score ?? h.overall ?? 0, i,
                    }));
                    const w = 600, h = 80, pad = 20;
                    const xStep = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
                    const pathD = points.map((p, idx) => {
                      const x = pad + idx * xStep;
                      const y = h - pad - (p.score / 100) * (h - pad * 2);
                      return `${idx === 0 ? "M" : "L"}${x},${y}`;
                    }).join(" ");
                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 100 }}>
                        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#1a1a1c" strokeWidth={1} />
                        <path d={pathD} fill="none" stroke="#c8ff00" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" />
                        {points.map((p, idx) => {
                          const x = pad + idx * xStep;
                          const y = h - pad - (p.score / 100) * (h - pad * 2);
                          return <rect key={idx} x={x - 3} y={y - 3} width={6} height={6} fill="#c8ff00" />;
                        })}
                      </svg>
                    );
                  })()}
                  <div style={{ fontSize: 9, color: "#555", marginTop: 6 }}>
                    Session scores over time (oldest → newest)
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
