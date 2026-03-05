import { useMemo } from "react";

interface Session {
  created_at: string;
  overall_score: number;
  pace_score: number;
  confidence_score: number;
  clarity_score: number;
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

interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
}

function getStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map(s => new Date(s.created_at).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (days[0] !== today && days[0] !== yesterday) return 0;
  
  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    const diff = new Date(days[i]).getTime() - new Date(days[i + 1]).getTime();
    if (diff <= 86400000 * 1.5) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function StreakBadges({ history, colors: c }: Props) {
  const sessions = useMemo(() => [...history], [history]);
  const streak = useMemo(() => getStreak(sessions), [sessions]);

  const badges: Badge[] = useMemo(() => {
    const best = Math.max(0, ...sessions.map(s => s.overall_score || 0));
    const count = sessions.length;
    const has90 = sessions.some(s => (s.overall_score || 0) >= 90);
    const has80Pace = sessions.some(s => (s.pace_score || 0) >= 80);
    const has80Conf = sessions.some(s => (s.confidence_score || 0) >= 80);
    const has80Clar = sessions.some(s => (s.clarity_score || 0) >= 80);
    const allAbove70 = sessions.some(s => 
      (s.pace_score || 0) >= 70 && (s.confidence_score || 0) >= 70 && (s.clarity_score || 0) >= 70
    );

    return [
      { id: "first", icon: "🎤", title: "First Steps", description: "Complete your first session", earned: count >= 1 },
      { id: "five", icon: "✋", title: "High Five", description: "Complete 5 sessions", earned: count >= 5 },
      { id: "ten", icon: "🔟", title: "Dedicated", description: "Complete 10 sessions", earned: count >= 10 },
      { id: "twenty", icon: "💪", title: "Powerhouse", description: "Complete 20 sessions", earned: count >= 20 },
      { id: "streak3", icon: "🔥", title: "On Fire", description: "3-day practice streak", earned: streak >= 3 },
      { id: "streak7", icon: "⚡", title: "Unstoppable", description: "7-day practice streak", earned: streak >= 7 },
      { id: "score90", icon: "🏆", title: "Elite Speaker", description: "Score 90+ overall", earned: has90 },
      { id: "pace80", icon: "🎯", title: "Pace Master", description: "Score 80+ in pace", earned: has80Pace },
      { id: "conf80", icon: "👑", title: "Confident Voice", description: "Score 80+ in confidence", earned: has80Conf },
      { id: "clar80", icon: "💎", title: "Crystal Clear", description: "Score 80+ in clarity", earned: has80Clar },
      { id: "balanced", icon: "⚖️", title: "Well Rounded", description: "All scores above 70 in one session", earned: allAbove70 },
      { id: "fifty", icon: "🌟", title: "Veteran", description: "Complete 50 sessions", earned: count >= 50 },
    ];
  }, [sessions, streak]);

  const earned = badges.filter(b => b.earned).length;

  // Streak flame display
  const streakDots = Array.from({ length: 7 }, (_, i) => i < streak);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Streak Card */}
      <div style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{streak >= 3 ? "🔥" : streak >= 1 ? "✨" : "💤"}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: c.text }}>{streak}</div>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase", marginTop: 2 }}>
          Day Streak
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {streakDots.map((active, i) => (
            <div key={i} style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: active ? "#e8a838" : c.border,
              transition: "background 0.3s",
              boxShadow: active ? "0 0 8px rgba(232,168,56,0.4)" : "none",
            }} />
          ))}
        </div>
        <div style={{ fontSize: 10, color: c.muted, marginTop: 8 }}>
          {streak === 0 ? "Start practicing to build your streak!" : 
           streak < 3 ? "Keep going — 3 days unlocks a badge!" :
           streak < 7 ? `${7 - streak} more days for the Unstoppable badge!` :
           "You're unstoppable! Keep the momentum going!"}
        </div>
      </div>

      {/* Badges Grid */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase" }}>
            Badges
          </div>
          <div style={{ fontSize: 11, color: c.muted }}>
            {earned}/{badges.length} earned
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {badges.map(badge => (
            <div key={badge.id} style={{
              background: c.card,
              border: `1px solid ${badge.earned ? "#e8a838" : c.border}`,
              borderRadius: 10,
              padding: "14px 10px",
              textAlign: "center",
              opacity: badge.earned ? 1 : 0.4,
              transition: "all 0.3s",
              position: "relative",
            }}>
              <div style={{ fontSize: 28, marginBottom: 4, filter: badge.earned ? "none" : "grayscale(1)" }}>
                {badge.icon}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 2 }}>
                {badge.title}
              </div>
              <div style={{ fontSize: 9, color: c.muted, lineHeight: 1.4 }}>
                {badge.description}
              </div>
              {badge.earned && (
                <div style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  fontSize: 10,
                  color: "#4a8c5c",
                }}>✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
