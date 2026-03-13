import { useMemo } from "react";

interface Session {
  created_at: string;
  overall_score: number;
  pace_score: number;
  confidence_score: number;
  clarity_score: number;
  duration_seconds?: number;
}

interface Props {
  history: Session[];
  colors: {
    bg: string;
    panel: string;
    border: string;
    text: string;
    muted: string;
    card: string;
  };
}

export default function ProgressDashboard({ history, colors: c }: Props) {
  const sessions = useMemo(() => [...history].reverse(), [history]);

  const stats = useMemo(() => {
    if (!sessions.length) return null;
    const avg = (key: keyof Session) => {
      const vals = sessions.map(s => Number(s[key]) || 0);
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    };
    const latest = sessions[sessions.length - 1];
    const first = sessions[0];
    const improvement = (latest.overall_score || 0) - (first.overall_score || 0);
    const totalMinutes = Math.round(sessions.reduce((a, s) => a + (s.duration_seconds || 0), 0) / 60);
    const bestScore = Math.max(...sessions.map(s => s.overall_score || 0));
    return {
      avgOverall: avg("overall_score"), avgPace: avg("pace_score"),
      avgConfidence: avg("confidence_score"), avgClarity: avg("clarity_score"),
      improvement, totalSessions: sessions.length, totalMinutes, bestScore,
    };
  }, [sessions]);

  if (!sessions.length) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: c.muted }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>No sessions yet</div>
        <div style={{ fontSize: 11, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>Complete your first recording to see progress charts</div>
      </div>
    );
  }

  const chartW = 600, chartH = 120, pad = 30;

  const renderLine = (data: number[], color: string) => {
    if (data.length < 2) return null;
    const xStep = (chartW - pad * 2) / (data.length - 1);
    const pathD = data.map((v, i) => {
      const x = pad + i * xStep;
      const y = chartH - pad - (v / 100) * (chartH - pad * 2);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
    return <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" opacity={0.85} />;
  };

  const metrics = [
    { key: "pace_score", color: "#888", label: "Pace" },
    { key: "confidence_score", color: "#555", label: "Confidence" },
    { key: "clarity_score", color: "#333", label: "Clarity" },
    { key: "overall_score", color: "#111", label: "Overall" },
  ];

  const statCards = stats ? [
    { label: "Sessions", value: stats.totalSessions, icon: "🎙" },
    { label: "Best Score", value: stats.bestScore, icon: "🏆" },
    { label: "Practice Time", value: `${stats.totalMinutes}m`, icon: "⏱" },
    { label: "Improvement", value: `${stats.improvement >= 0 ? "+" : ""}${stats.improvement}`, icon: stats.improvement >= 0 ? "📈" : "📉" },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {statCards.map(({ label, value, icon }) => (
          <div key={label} style={{
            background: c.card, border: `1px solid ${c.border}`,
            borderRadius: 0, padding: "20px 12px", textAlign: "center",
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.text, fontFamily: "'DM Mono', monospace" }}>{value}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase", marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 0, padding: 24 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
          Score Trends
        </div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: 140 }}>
          {[0, 25, 50, 75, 100].map(v => {
            const y = chartH - pad - (v / 100) * (chartH - pad * 2);
            return (
              <g key={v}>
                <line x1={pad} y1={y} x2={chartW - pad} y2={y} stroke={c.border} strokeWidth={0.5} />
                <text x={pad - 6} y={y + 3} textAnchor="end" fill={c.muted} fontSize={8} fontFamily="'DM Mono', monospace">{v}</text>
              </g>
            );
          })}
          {metrics.map(m => renderLine(sessions.map(s => Number(s[m.key as keyof Session]) || 0), m.color))}
        </svg>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
          {metrics.map(m => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: c.muted, fontFamily: "'DM Mono', monospace" }}>
              <div style={{ width: 10, height: 3, background: m.color, borderRadius: 0 }} />
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {stats && (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 0, padding: 24 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
            Average Scores
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Overall", value: stats.avgOverall, color: "#111" },
              { label: "Pace", value: stats.avgPace, color: "#555" },
              { label: "Confidence", value: stats.avgConfidence, color: "#555" },
              { label: "Clarity", value: stats.avgClarity, color: "#555" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: c.muted, fontFamily: "'DM Mono', monospace" }}>{label}</span>
                  <span style={{ color: c.text, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>{value}%</span>
                </div>
                <div style={{ height: 4, background: c.border, borderRadius: 0, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${value}%`,
                    background: color, borderRadius: 0, transition: "width 0.8s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}