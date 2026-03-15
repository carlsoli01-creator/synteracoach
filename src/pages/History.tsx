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
  const time = entry.created_at
    ? new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const date = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString([], { month: "short", day: "numeric" })
    : "";
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D";

  return (
    <div style={{
      width: "100%", padding: "16px 0", borderBottom: "1px solid #e2e2e2",
      display: "flex", alignItems: "center", gap: 24,
    }}>
      <div style={{ fontSize: 24, fontWeight: 300, minWidth: 20, fontFamily: "'DM Mono', monospace", color: "#0a0a0a" }}>{grade}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#0a0a0a", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
          Session #{index + 1} — <span style={{ fontWeight: 500 }}>{score}/100</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[{ k: "PACE", v: pace }, { k: "CONF", v: conf }, { k: "CLAR", v: clar }].map(({ k, v }) => (
            <div key={k} style={{ fontSize: 9, letterSpacing: "0.1em", color: "#888", fontFamily: "'DM Mono', monospace" }}>
              {k} <span style={{ color: "#0a0a0a" }}>{v}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 9, color: "#888", textAlign: "right", fontFamily: "'DM Mono', monospace" }}>
          {date && <div>{date}</div>}
          <div>{time}</div>
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          style={{
            background: "none", border: "1px solid #e2e2e2", cursor: "pointer",
            padding: "4px 8px", fontSize: 9, color: "#888", fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.1em", borderRadius: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#0a0a0a"; e.currentTarget.style.color = "#0a0a0a"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e2e2"; e.currentTarget.style.color = "#888"; }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("voice_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setHistory(data);
    };
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any)
      .from("voice_sessions")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete session", variant: "destructive" });
    } else {
      setHistory(prev => prev.filter(s => s.id !== id));
      toast({ title: "Deleted", description: "Session removed" });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "'DM Mono', monospace" }}>
      <AppSidebar />
      <div style={{ paddingLeft: 220 }}>
        <div style={{ padding: "40px 48px 32px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0a0a0a", fontFamily: "'Syne', sans-serif" }}>History</div>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
            {history.length} sessions
          </div>
        </div>
        <div style={{ maxWidth: 900, padding: "0 48px", paddingBottom: 80 }}>
          {history.length === 0 ? (
            <div style={{ color: "#888", fontSize: 12, padding: "60px 0" }}>
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
                  <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>
                    Progress Chart
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
                        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e2e2e2" strokeWidth={1} />
                        <path d={pathD} fill="none" stroke="#0a0a0a" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" />
                        {points.map((p, idx) => {
                          const x = pad + idx * xStep;
                          const y = h - pad - (p.score / 100) * (h - pad * 2);
                          return <rect key={idx} x={x - 3} y={y - 3} width={6} height={6} fill="#0a0a0a" />;
                        })}
                      </svg>
                    );
                  })()}
                  <div style={{ fontSize: 9, color: "#888", marginTop: 6, fontFamily: "'DM Mono', monospace" }}>
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
