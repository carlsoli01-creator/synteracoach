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
      avgOverall: avg("overall_score"),
      avgPace: avg("pace_score"),
      avgConfidence: avg("confidence_score"),
      avgClarity: avg("clarity_score"),
      improvement,
      totalSessions: sessions.length,
      totalMinutes,
      bestScore,
    };
  }, [sessions]);

  if (!sessions.length) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: c.muted }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>No sessions yet</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Complete your first recording to see progress charts</div>
      </div>
    );
  }

  const chartW = 600, chartH = 120, pad = 30;

  const renderLine = (data: number[], color: string, label: string) => {
    if (data.length < 2) return null;
    const xStep = (chartW - pad * 2) / (data.length - 1);
    const pathD = data.map((v, i) => {
      const x = pad + i * xStep;
      const y = chartH - pad - (v / 100) * (chartH - pad * 2);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
    return <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />;
  };

  const metrics = [
    { key: "pace_score", color: "#5b8def", label: "Pace" },
    { key: "confidence_score", color: "#e8a838", label: "Confidence" },
    { key: "clarity_score", color: "#4a8c5c", label: "Clarity" },
    { key: "overall_score", color: "#6b7280", label: "Overall" },
  ];

  const statCards = stats ? [
    { label: "Sessions", value: stats.totalSessions, icon: "🎙" },
    { label: "Best Score", value: stats.bestScore, icon: "🏆" },
    { label: "Practice Time", value: `${stats.totalMinutes}m`, icon: "⏱" },
    { label: "Improvement", value: `${stats.improvement >= 0 ? "+" : ""}${stats.improvement}`, icon: stats.improvement >= 0 ? "📈" : "📉" },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {statCards.map(({ label, value, icon }) => (
          <div key={label} style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            padding: "16px 12px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.text }}>{value}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Score Trends Chart */}
      <div style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: 20,
      }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 12 }}>
          Score Trends
        </div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: 140 }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(v => {
            const y = chartH - pad - (v / 100) * (chartH - pad * 2);
            return (
              <g key={v}>
                <line x1={pad} y1={y} x2={chartW - pad} y2={y} stroke={c.border} strokeWidth={0.5} />
                <text x={pad - 6} y={y + 3} textAnchor="end" fill={c.muted} fontSize={8} fontFamily="Inter, sans-serif">{v}</text>
              </g>
            );
          })}
          {metrics.map(m => renderLine(sessions.map(s => Number(s[m.key as keyof Session]) || 0), m.color, m.label))}
        </svg>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
          {metrics.map(m => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: c.muted }}>
              <div style={{ width: 10, height: 3, background: m.color, borderRadius: 2 }} />
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Average Breakdown */}
      {stats && (
        <div style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          padding: 20,
        }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 16 }}>
            Average Scores
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Overall", value: stats.avgOverall, color: "#6b7280" },
              { label: "Pace", value: stats.avgPace, color: "#5b8def" },
              { label: "Confidence", value: stats.avgConfidence, color: "#e8a838" },
              { label: "Clarity", value: stats.avgClarity, color: "#4a8c5c" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: c.muted }}>{label}</span>
                  <span style={{ color: c.text, fontWeight: 700 }}>{value}%</span>
                </div>
                <div style={{ height: 6, background: c.border, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${value}%`,
                    background: color,
                    borderRadius: 3,
                    transition: "width 0.8s ease",
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
