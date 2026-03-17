export const GOAL_OPTIONS = [
  "Persuasion",
  "Confidence",
  "Clarity",
  "Pace",
  "Authority",
  "Empathy",
  "Assertiveness",
  "Storytelling",
  "Negotiation",
  "Conciseness",
] as const;

export const SUBGOAL_OPTIONS = [
  "Confidence",
  "Clarity",
  "Pace",
  "Authority",
  "Empathy",
  "Assertiveness",
  "Storytelling",
  "Negotiation",
  "Conciseness",
  "Tone Control",
  "Active Listening",
  "Emotional Intelligence",
  "Vocabulary Precision",
  "Audience Awareness",
  "Call to Action",
] as const;

export type GoalOption = typeof GOAL_OPTIONS[number];
export type SubgoalOption = typeof SUBGOAL_OPTIONS[number];

export interface Scenario {
  title: string;
  prompt: string;
  duration: string;
  durationSeconds: number;
  difficulty: "Easy" | "Medium" | "Hard";
  goal: GoalOption;
  subGoals: SubgoalOption[];
}

export interface ScenarioCategory {
  slug: string;
  category: string;
  icon: string;
  description: string;
  items: Scenario[];
}

export const SCENARIO_CATEGORIES: ScenarioCategory[] = [
  {
    slug: "negotiation",
    category: "Negotiation",
    icon: "💰",
    description: "Master the art of getting what you want through strategic communication.",
    items: [
      {
        title: "Salary Negotiation",
        prompt: "You're meeting with your manager to discuss a raise. You've been at the company for 2 years, consistently exceeded targets, and taken on additional responsibilities. Make your case for a 15% salary increase.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Medium",
        goal: "Persuasion",
        subGoals: ["Confidence", "Clarity", "Pace"],
      },
      {
        title: "Handling Objections",
        prompt: "A customer says: 'Your price is too high — your competitor offers the same thing for 30% less.' Respond confidently, reframe the value, and keep the conversation moving forward.",
        duration: "30s",
        durationSeconds: 30,
        difficulty: "Hard",
        goal: "Assertiveness",
        subGoals: ["Confidence", "Conciseness", "Authority"],
      },
      {
        title: "Contract Terms",
        prompt: "Your client wants to extend the project scope without increasing the budget. Negotiate new terms that protect your interests while keeping the relationship positive.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Hard",
        goal: "Negotiation",
        subGoals: ["Assertiveness", "Empathy", "Clarity"],
      },
    ],
  },
  {
    slug: "persuasion",
    category: "Persuasion",
    icon: "🎯",
    description: "Convince, inspire, and move people to action with compelling arguments.",
    items: [
      {
        title: "Client Pitch",
        prompt: "You're pitching your product to a potential client. They currently use a competitor's solution and are skeptical about switching. Convince them why your solution is worth their time and investment.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Hard",
        goal: "Persuasion",
        subGoals: ["Storytelling", "Call to Action", "Authority"],
      },
      {
        title: "Elevator Pitch",
        prompt: "You have 30 seconds in an elevator with someone who could change your career. Introduce yourself and what you do in a compelling, memorable way.",
        duration: "30s",
        durationSeconds: 30,
        difficulty: "Easy",
        goal: "Conciseness",
        subGoals: ["Confidence", "Pace", "Call to Action"],
      },
      {
        title: "Investor Ask",
        prompt: "You have 45 seconds to convince an angel investor your startup idea is worth funding. Lead with the problem, your unique solution, and a clear ask.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Hard",
        goal: "Persuasion",
        subGoals: ["Storytelling", "Confidence", "Call to Action"],
      },
    ],
  },
  {
    slug: "leadership",
    category: "Leadership",
    icon: "👥",
    description: "Lead with clarity, empathy, and vision to rally your team.",
    items: [
      {
        title: "Team Motivation",
        prompt: "Your team just lost a major deal after months of work. Morale is low. Deliver a brief motivational talk that acknowledges the setback while re-energizing the team for the next opportunity.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Medium",
        goal: "Empathy",
        subGoals: ["Authority", "Storytelling", "Tone Control"],
      },
      {
        title: "Vision Statement",
        prompt: "You're the new team lead. Introduce yourself and share your vision for the team's direction over the next quarter. Inspire confidence and set clear expectations.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Easy",
        goal: "Authority",
        subGoals: ["Clarity", "Confidence", "Audience Awareness"],
      },
      {
        title: "Change Management",
        prompt: "Your company is restructuring and your team is anxious. Address their concerns, explain the changes transparently, and outline how you'll support them through the transition.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Medium",
        goal: "Empathy",
        subGoals: ["Clarity", "Authority", "Emotional Intelligence"],
      },
    ],
  },
  {
    slug: "feedback",
    category: "Feedback",
    icon: "💬",
    description: "Deliver and receive feedback that builds trust and drives improvement.",
    items: [
      {
        title: "Difficult Feedback",
        prompt: "You need to give constructive feedback to a team member who has been missing deadlines. Be direct but empathetic — acknowledge their strengths while clearly addressing the performance issue.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Hard",
        goal: "Assertiveness",
        subGoals: ["Empathy", "Clarity", "Tone Control"],
      },
      {
        title: "Conflict Resolution",
        prompt: "Two colleagues are in a disagreement about how to approach a project. As the mediator, acknowledge both perspectives and propose a path forward that respects both viewpoints.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Medium",
        goal: "Empathy",
        subGoals: ["Active Listening", "Clarity", "Emotional Intelligence"],
      },
      {
        title: "Upward Feedback",
        prompt: "Your manager frequently interrupts you in meetings. You want to address this respectfully without damaging the relationship. Deliver the feedback clearly and constructively.",
        duration: "30s",
        durationSeconds: 30,
        difficulty: "Hard",
        goal: "Assertiveness",
        subGoals: ["Confidence", "Empathy", "Tone Control"],
      },
    ],
  },
  {
    slug: "reporting",
    category: "Reporting",
    icon: "📊",
    description: "Present updates, data, and decisions with confidence and structure.",
    items: [
      {
        title: "Project Update",
        prompt: "Your project is behind schedule by two weeks. Present a status update to stakeholders, acknowledge the delay, explain the cause, and propose a revised timeline with confidence.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Medium",
        goal: "Clarity",
        subGoals: ["Confidence", "Conciseness", "Authority"],
      },
      {
        title: "Quarterly Review",
        prompt: "Present your team's quarterly results to senior leadership. You hit 3 out of 5 OKRs. Highlight wins, own the misses, and outline your plan for next quarter.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Medium",
        goal: "Authority",
        subGoals: ["Clarity", "Conciseness", "Audience Awareness"],
      },
      {
        title: "Crisis Communication",
        prompt: "A product outage affected 500 customers. Brief your leadership team on what happened, what you're doing to fix it, and how you'll prevent it from recurring.",
        duration: "45s",
        durationSeconds: 45,
        difficulty: "Hard",
        goal: "Clarity",
        subGoals: ["Confidence", "Authority", "Conciseness"],
      },
    ],
  },
];

export function getDayIndex() {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
}

export function getTodayScenario(category: ScenarioCategory): Scenario {
  const dayIdx = getDayIndex();
  return category.items[dayIdx % category.items.length];
}

export const diffColor = (d: string) =>
  d === "Easy" ? "#888" : d === "Medium" ? "#555" : "#111";
