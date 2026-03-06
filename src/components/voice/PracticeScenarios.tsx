import { useState, useMemo } from "react";

interface Props {
  onSelectScenario: (scenario: { title: string; prompt: string; category: string }) => void;
  completedCategoriesToday?: string[];
  colors: {
    bg: string;
    panel: string;
    border: string;
    text: string;
    muted: string;
    card: string;
  };
}

const SCENARIOS = [
  {
    category: "Professional",
    icon: "💼",
    items: [
      {
        title: "Salary Negotiation",
        prompt: "You're meeting with your manager to discuss a raise. You've been at the company for 2 years, consistently exceeded targets, and taken on additional responsibilities. Make your case for a 15% salary increase.",
        duration: "45s – 1m",
        difficulty: "Medium",
      },
      {
        title: "Client Pitch",
        prompt: "You're pitching your product to a potential client. They currently use a competitor's solution and are skeptical about switching. Convince them why your solution is worth their time and investment.",
        duration: "1m",
        difficulty: "Hard",
      },
      {
        title: "Project Update",
        prompt: "Your project is behind schedule by two weeks. Present a status update to stakeholders, acknowledge the delay, explain the cause, and propose a revised timeline with confidence.",
        duration: "45s – 1m",
        difficulty: "Medium",
      },
    ],
  },
  {
    category: "Leadership",
    icon: "👥",
    items: [
      {
        title: "Team Motivation",
        prompt: "Your team just lost a major deal after months of work. Morale is low. Deliver a brief motivational talk that acknowledges the setback while re-energizing the team for the next opportunity.",
        duration: "30s – 1m",
        difficulty: "Medium",
      },
      {
        title: "Difficult Feedback",
        prompt: "You need to give constructive feedback to a team member who has been missing deadlines. Be direct but empathetic — acknowledge their strengths while clearly addressing the performance issue.",
        duration: "45s – 1m",
        difficulty: "Hard",
      },
      {
        title: "Vision Statement",
        prompt: "You're the new team lead. Introduce yourself and share your vision for the team's direction over the next quarter. Inspire confidence and set clear expectations.",
        duration: "1m",
        difficulty: "Easy",
      },
    ],
  },
  {
    category: "Everyday",
    icon: "🗣",
    items: [
      {
        title: "Elevator Pitch",
        prompt: "You have 30 seconds in an elevator with someone who could change your career. Introduce yourself and what you do in a compelling, memorable way.",
        duration: "10s – 30s",
        difficulty: "Easy",
      },
      {
        title: "Handling Objections",
        prompt: "A customer says: 'Your price is too high — your competitor offers the same thing for 30% less.' Respond confidently, reframe the value, and keep the conversation moving forward.",
        duration: "30s – 45s",
        difficulty: "Hard",
      },
      {
        title: "Conflict Resolution",
        prompt: "Two colleagues are in a disagreement about how to approach a project. As the mediator, acknowledge both perspectives and propose a path forward that respects both viewpoints.",
        duration: "45s – 1m",
        difficulty: "Medium",
      },
    ],
  },
];

function getDayIndex() {
  const now = new Date();
  // Days since epoch — rotates scenarios daily
  return Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
}

const diffColor = (d: string) =>
  d === "Easy" ? "#4a8c5c" : d === "Medium" ? "#e8a838" : "#c04a2a";

export default function PracticeScenarios({ onSelectScenario, completedCategoriesToday = [], colors: c }: Props) {
  const [activeScenario, setActiveScenario] = useState<{ title: string; prompt: string; category: string } | null>(null);

  const todaysScenarios = useMemo(() => {
    const dayIdx = getDayIndex();
    return SCENARIOS.map(cat => {
      const item = cat.items[dayIdx % cat.items.length];
      return { ...cat, todayItem: item };
    });
  }, []);

  if (activeScenario) {
    const isCategoryDone = completedCategoriesToday.includes(activeScenario.category);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <button
          onClick={() => setActiveScenario(null)}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            color: c.muted,
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Back to scenarios
        </button>
        <div style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          padding: 28,
        }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: c.muted, textTransform: "uppercase", marginBottom: 8 }}>
            Today's Scenario
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 16 }}>
            {activeScenario.title}
          </div>
          <div style={{
            fontSize: 14,
            color: c.text,
            lineHeight: 1.8,
            padding: 20,
            background: c.bg,
            borderRadius: 8,
            border: `1px solid ${c.border}`,
            marginBottom: 24,
            fontStyle: "italic",
          }}>
            "{activeScenario.prompt}"
          </div>
          {isCategoryDone ? (
            <div style={{
              textAlign: "center",
              padding: "16px",
              background: c.bg,
              borderRadius: 8,
              border: `1px solid ${c.border}`,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Completed for today</div>
              <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>
                Come back tomorrow for a new {activeScenario.category} scenario
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: c.muted, marginBottom: 20 }}>
                Read the scenario above, then record your response. One attempt per category per day.
              </div>
              <button
                onClick={() => {
                  onSelectScenario(activeScenario);
                  setActiveScenario(null);
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: c.text,
                  color: c.bg,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  transition: "opacity 0.2s",
                }}
              >
                🎙 GO TO RECORDING
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Today's Practice Scenarios</div>
        <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>
          One scenario per category each day · New scenarios rotate daily
        </div>
      </div>

      {todaysScenarios.map(cat => {
        const item = cat.todayItem;
        const done = completedCategoriesToday.includes(cat.category);

        return (
          <div key={cat.category}>
            <div style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              color: c.muted,
              textTransform: "uppercase",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span>{cat.icon}</span> {cat.category}
              {done && <span style={{ color: "#4a8c5c", fontSize: 10, marginLeft: 4 }}>✅ Done</span>}
            </div>
            <button
              onClick={() => setActiveScenario({ title: item.title, prompt: item.prompt, category: cat.category })}
              style={{
                width: "100%",
                background: done ? c.bg : c.card,
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                padding: "14px 16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: done ? 0.6 : 1,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 3 }}>
                  {item.title}
                  {done && <span style={{ fontSize: 10, color: c.muted, fontWeight: 400, marginLeft: 8 }}>completed</span>}
                </div>
                <div style={{ fontSize: 10, color: c.muted }}>
                  {item.duration}
                </div>
              </div>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                color: diffColor(item.difficulty),
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {item.difficulty}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
