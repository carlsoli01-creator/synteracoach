import { useMemo } from "react";

interface Session {
  created_at: string;
  overall_score: number;
  pace_score: number;
  confidence_score: number;
  clarity_score: number;
  duration_seconds?: number;
  transcript?: string;
  feedback?: any;
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
    accent?: string;
  };
}

function ScoreRingSmall({ score, label, color, textColor, borderColor }: { score: number; label: string; color: string; textColor: string; borderColor: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={52} height={52} viewBox="0 0 52 52">
        <circle cx={26} cy={26} r={r} fill="none" stroke={borderColor} strokeWidth={3} />
        <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeLinecap="square" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }} />
        <text x={26} y={29} textAnchor="middle" fill={textColor} fontSize={13}
          fontFamily="'Bebas Neue', sans-serif" letterSpacing="0.04em">{score}</text>
      </svg>
      <span style={{ fontSize: 7, letterSpacing: "0.18em", textTransform: "uppercase", color: borderColor === textColor ? textColor : color, fontFamily: "'IBM Plex Mono', monospace", opacity: 0.5 }}>{label}</span>
    </div>
  );
}

export default function ProgressDashboard({ history, colors: c }: Props) {
  const sessions = useMemo(() => [...history].reverse(), [history]);
  const accent = c.accent || "#c8ff00";

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
    const totalWords = sessions.reduce((a, s) => a + (s.transcript?.trim().split(/\s+/).filter(Boolean).length || 0), 0);
    return {
      avgOverall: avg("overall_score"), avgPace: avg("pace_score"),
      avgConfidence: avg("confidence_score"), avgClarity: avg("clarity_score"),
      improvement, totalSessions: sessions.length, totalMinutes, bestScore, totalWords,
    };
  }, [sessions]);

  // Streak calculation
  const streak = useMemo(() => {
    if (!sessions.length) return { current: 0, longest: 0 };
    const daySet = new Set(sessions.map(s => new Date(s.created_at).toLocaleDateString()));
    const days = Array.from(daySet).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
    let current = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < days.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      expected.setHours(0, 0, 0, 0);
      const day = new Date(days[i]);
      day.setHours(0, 0, 0, 0);
      if (day.getTime() === expected.getTime()) current++;
      else break;
    }
    // longest streak
    const sortedDays = Array.from(daySet).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
    let longest = 0, run = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const diff = (sortedDays[i].getTime() - sortedDays[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      if (Math.abs(diff - 1) < 0.5) run++;
      else run = 1;
      if (run > longest) longest = run;
    }
    if (sortedDays.length === 1) longest = 1;
    return { current, longest: Math.max(longest, current) };
  }, [sessions]);

  // Weekly activity heatmap (last 12 weeks)
  const heatmap = useMemo(() => {
    const weeks: { date: Date; count: number }[][] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - dayOfWeek - 7 * 11); // 12 weeks back

    const countMap: Record<string, number> = {};
    sessions.forEach(s => {
      const d = new Date(s.created_at).toLocaleDateString();
      countMap[d] = (countMap[d] || 0) + 1;
    });

    for (let w = 0; w < 12; w++) {
      const week: { date: Date; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + w * 7 + d);
        const key = date.toLocaleDateString();
        week.push({ date, count: countMap[key] || 0 });
      }
      weeks.push(week);
    }
    return weeks;
  }, [sessions]);

  // Score distribution buckets
  const distribution = useMemo(() => {
    const buckets = [
      { label: "0–20", min: 0, max: 20, count: 0 },
      { label: "21–40", min: 21, max: 40, count: 0 },
      { label: "41–60", min: 41, max: 60, count: 0 },
      { label: "61–80", min: 61, max: 80, count: 0 },
      { label: "81–100", min: 81, max: 100, count: 0 },
    ];
    sessions.forEach(s => {
      const score = s.overall_score || 0;
      const bucket = buckets.find(b => score >= b.min && score <= b.max);
      if (bucket) bucket.count++;
    });
    const max = Math.max(...buckets.map(b => b.count), 1);
    return buckets.map(b => ({ ...b, pct: (b.count / max) * 100 }));
  }, [sessions]);

  // Personal bests
  const personalBests = useMemo(() => {
    if (!sessions.length) return null;
    const best = (key: keyof Session) => Math.max(...sessions.map(s => Number(s[key]) || 0));
    return {
      overall: best("overall_score"),
      pace: best("pace_score"),
      confidence: best("confidence_score"),
      clarity: best("clarity_score"),
    };
  }, [sessions]);

  // Recent sessions (last 5)
  const recentSessions = useMemo(() => history.slice(0, 8), [history]);

  if (!sessions.length) {
    return (
      <div style={{ padding: 60, color: c.muted }}>
        <div style={{ fontSize: 24, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", color: c.text }}>No sessions yet</div>
        <div style={{ fontSize: 11, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>Complete your first recording to see progress charts</div>
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
    { key: "pace_score", color: c.muted, label: "Pace" },
    { key: "confidence_score", color: c.muted, label: "Confidence" },
    { key: "clarity_score", color: c.muted, label: "Clarity" },
    { key: "overall_score", color: accent, label: "Overall" },
  ];

  const statCards = stats ? [
    { label: "Sessions", value: stats.totalSessions },
    { label: "Best Score", value: stats.bestScore },
    { label: "Practice Time", value: `${stats.totalMinutes}m` },
    { label: "Improvement", value: `${stats.improvement >= 0 ? "+" : ""}${stats.improvement}` },
    { label: "Words Spoken", value: stats.totalWords.toLocaleString() },
    { label: "Current Streak", value: `${streak.current}d` },
  ] : [];

  const heatColor = (count: number) => {
    if (count === 0) return c.border;
    if (count === 1) return c.muted;
    if (count === 2) return accent;
    return accent;
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, background: c.border }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
        {statCards.map(({ label, value }) => (
          <div key={label} style={{ background: c.card, padding: "20px 24px" }}>
            <div style={{ fontSize: 36, color: c.text, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>{value}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Streak Info */}
      <div style={{ background: c.card, padding: 28, display: "flex", gap: 32, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 64, color: c.text, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", lineHeight: 1 }}>{streak.current}</div>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>Day Streak</div>
        </div>
        <div style={{ height: 48, width: 1, background: c.border }} />
        <div>
          <div style={{ fontSize: 36, color: c.text, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", lineHeight: 1 }}>{streak.longest}</div>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>Longest Streak</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, color: c.muted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, maxWidth: 200 }}>
          {streak.current >= 7 ? "🔥 Incredible consistency! Keep it going." :
           streak.current >= 3 ? "💪 Building momentum. Don't break the chain!" :
           streak.current >= 1 ? "✓ You practiced today. Come back tomorrow!" :
           "Start a streak by practicing today."}
        </div>
      </div>

      {/* Score Trends Chart */}
      <div style={{ background: c.card, padding: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
          Score Trends
        </div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: 140 }}>
          {[0, 25, 50, 75, 100].map(v => {
            const y = chartH - pad - (v / 100) * (chartH - pad * 2);
            return (
              <g key={v}>
                <line x1={pad} y1={y} x2={chartW - pad} y2={y} stroke={c.border} strokeWidth={0.5} />
                <text x={pad - 6} y={y + 3} textAnchor="end" fill={c.muted} fontSize={8} fontFamily="'IBM Plex Mono', monospace">{v}</text>
              </g>
            );
          })}
          {metrics.map(m => renderLine(sessions.map(s => Number(s[m.key as keyof Session]) || 0), m.color))}
        </svg>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
          {metrics.map(m => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: c.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
              <div style={{ width: 10, height: 3, background: m.color }} />
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Average Scores */}
      {stats && (
        <div style={{ background: c.card, padding: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace" }}>
            Average Scores
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Overall", value: stats.avgOverall, color: accent },
              { label: "Pace", value: stats.avgPace, color: c.muted },
              { label: "Confidence", value: stats.avgConfidence, color: c.muted },
              { label: "Clarity", value: stats.avgClarity, color: c.muted },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: c.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
                  <span style={{ color: c.text, fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace" }}>{value}%</span>
                </div>
                <div style={{ height: 4, background: c.border, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${value}%`, background: color, transition: "width 0.8s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Bests */}
      {personalBests && (
        <div style={{ background: c.card, padding: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace" }}>
            Personal Bests
          </div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <ScoreRingSmall score={personalBests.overall} label="Overall" color={accent} textColor={c.text} borderColor={c.border} />
            <ScoreRingSmall score={personalBests.pace} label="Pace" color={c.muted} textColor={c.text} borderColor={c.border} />
            <ScoreRingSmall score={personalBests.confidence} label="Confidence" color={c.muted} textColor={c.text} borderColor={c.border} />
            <ScoreRingSmall score={personalBests.clarity} label="Clarity" color={c.muted} textColor={c.text} borderColor={c.border} />
          </div>
        </div>
      )}

      {/* Score Distribution */}
      <div style={{ background: c.card, padding: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace" }}>
          Score Distribution
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
          {distribution.map(b => (
            <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 9, color: c.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{b.count}</div>
              <div style={{ width: "100%", height: `${Math.max(4, b.pct * 0.6)}px`, background: b.count > 0 ? accent : c.border, transition: "height 0.5s ease" }} />
              <div style={{ fontSize: 7, color: c.muted, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Heatmap */}
      <div style={{ background: c.card, padding: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace" }}>
          Activity — Last 12 Weeks
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {heatmap.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              {week.map((day, di) => (
                <div key={di} style={{
                  width: "100%", aspectRatio: "1", background: heatColor(day.count),
                  opacity: day.count > 1 ? 1 : day.count === 1 ? 0.7 : 0.3,
                  transition: "background 0.2s",
                }} title={`${day.date.toLocaleDateString()}: ${day.count} session${day.count !== 1 ? 's' : ''}`} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 7, color: c.muted, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>12 WEEKS AGO</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 7, color: c.muted, fontFamily: "'IBM Plex Mono', monospace" }}>Less</span>
            {[0, 1, 2, 3].map(n => <div key={n} style={{ width: 8, height: 8, background: heatColor(n), opacity: n === 0 ? 0.3 : n === 1 ? 0.7 : 1 }} />)}
            <span style={{ fontSize: 7, color: c.muted, fontFamily: "'IBM Plex Mono', monospace" }}>More</span>
          </div>
          <span style={{ fontSize: 7, color: c.muted, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>NOW</span>
        </div>
      </div>

      {/* Recent Sessions */}
      <div style={{ background: c.card, padding: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace" }}>
          Recent Sessions
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recentSessions.map((s, i) => {
            const category = s.feedback?.scenario_category || "Free Practice";
            const title = s.feedback?.scenario_title || "General";
            const duration = s.duration_seconds ? `${Math.floor(s.duration_seconds / 60)}:${String(s.duration_seconds % 60).padStart(2, '0')}` : "—";
            return (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 0", borderBottom: i < recentSessions.length - 1 ? `1px solid ${c.border}` : "none",
              }}>
                <div>
                  <div style={{ fontSize: 11, color: c.text, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>{title}</div>
                  <div style={{ fontSize: 8, color: c.muted, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
                    {category} · {duration} · {formatDate(s.created_at)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, color: c.text, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em", lineHeight: 1 }}>{s.overall_score}</div>
                    <div style={{ fontSize: 7, color: c.muted, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>Score</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coaching Insight */}
      <div style={{ background: c.card, padding: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
          Insight
        </div>
        <div style={{ fontSize: 13, color: c.text, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8, fontStyle: "italic" }}>
          {stats && stats.avgOverall >= 75
            ? `"Your average score of ${stats.avgOverall} shows strong fundamentals. Focus on pushing your weakest metric — ${stats.avgPace <= stats.avgConfidence && stats.avgPace <= stats.avgClarity ? 'Pace' : stats.avgConfidence <= stats.avgClarity ? 'Confidence' : 'Clarity'} — to break through to the next level."`
            : stats && stats.avgOverall >= 50
            ? `"You're building solid habits with ${stats.totalSessions} sessions. Consistency is your biggest lever — aim for daily practice to accelerate improvement."`
            : `"Every expert was once a beginner. You've already taken the hardest step by starting. Keep going — progress compounds with each session."`}
        </div>
        <div style={{ fontSize: 8, color: c.muted, marginTop: 8, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>
          — Syntera Coach
        </div>
      </div>
    </div>
  );
}
