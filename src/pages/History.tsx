import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppDrawer from "@/components/layout/AppDrawer";

function HistoryCard({ entry, index }: { entry: any; index: number }) {
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
  const gradeColor = score >= 80 ? "#111" : score >= 65 ? "#555" : score >= 50 ? "#888" : "#888";

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e2e2", borderRadius: 0,
      padding: 20, display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{ fontSize: 28, color: gradeColor, fontWeight: "bold", minWidth: 24, fontFamily: "'DM Mono', monospace" }}>{grade}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#111", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
          Session #{index + 1} — Score {score}/100
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {[{ k: "pace", v: pace }, { k: "conf", v: conf }, { k: "clar", v: clar }].map(({ k, v }) => (
            <div key={k} style={{ fontSize: 9, color: "#888", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace" }}>
              {k.toUpperCase()} <span style={{ color: "#555" }}>{v}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9, color: "#888", textAlign: "right", fontFamily: "'DM Mono', monospace" }}>
        {date && <div>{date}</div>}
        <div>{time}</div>
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

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "'DM Mono', monospace", paddingBottom: 80 }}>
      <AppDrawer />
      <div style={{ padding: "40px 28px 24px 60px", textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#111", marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>History</div>
        <div style={{ fontSize: 12, color: "#888" }}>Your recent practice sessions</div>
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888", fontSize: 12, padding: "60px 0" }}>
            No sessions yet. Record your first session to see history.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 16 }}>
              {history.length} sessions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((entry, i) => (
                <HistoryCard key={i} entry={entry} index={history.length - 1 - i} />
              ))}
            </div>
            {history.length > 1 && (
              <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e2e2e2", borderRadius: 0, padding: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>
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
                      <path d={pathD} fill="none" stroke="#111" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" />
                      {points.map((p, idx) => {
                        const x = pad + idx * xStep;
                        const y = h - pad - (p.score / 100) * (h - pad * 2);
                        return <rect key={idx} x={x - 3} y={y - 3} width={6} height={6} fill="#111" />;
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
  );
}