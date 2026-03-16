import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── HARDCODED WORD LISTS ────────────────────────────────────────────

const FILLER_WORDS = ["um", "uh", "like", "you know", "sort of", "kind of", "basically", "literally", "right?", "so yeah"];

const HEDGING_PHRASES = [
  { phrase: "i think", suggestion: "I believe" },
  { phrase: "i feel like", suggestion: "I know" },
  { phrase: "maybe", suggestion: "Here is what I recommend" },
  { phrase: "probably", suggestion: "very likely" },
  { phrase: "i guess", suggestion: "I am confident" },
  { phrase: "sort of", suggestion: "precisely" },
  { phrase: "kind of", suggestion: "specifically" },
  { phrase: "might be", suggestion: "is" },
  { phrase: "could be", suggestion: "is" },
  { phrase: "i'm not sure but", suggestion: "What I know is" },
];

const POWER_WORDS = [
  "because", "imagine", "guaranteed", "proven", "exclusive", "immediately",
  "need", "must", "will", "important", "critical", "essential", "definitely",
  "absolutely", "clearly", "certainly", "specifically", "exactly", "directly",
  "effectively", "successfully", "opportunity", "value", "benefit", "result",
  "achieve", "ensure", "deliver", "commit",
];

const PASSIVE_CONSTRUCTIONS = [
  "was done", "were made", "has been", "it was decided",
  "there is", "there are", "you know what i mean",
];

const HEDGING_SUGGESTIONS_MAP: Record<string, string> = {};
HEDGING_PHRASES.forEach(h => { HEDGING_SUGGESTIONS_MAP[h.phrase] = h.suggestion; });

// ─── UTILITY ─────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const extractWords = (text: string) =>
  text.toLowerCase().replace(/[^\w\s']/g, " ").split(/\s+/).filter(Boolean);

const extractSentences = (text: string): string[] =>
  text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

const countSubstring = (haystack: string, needle: string): number => {
  const lower = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let count = 0, pos = 0;
  while ((pos = lower.indexOf(n, pos)) !== -1) { count++; pos += n.length; }
  return count;
};

const extractQuote = (transcript: string, term: string) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`([^.!?]*\\b${escaped}\\b[^.!?]*)`, "i");
  const match = transcript.match(pattern);
  return match?.[1]?.trim().slice(0, 180) || transcript.slice(0, 180).trim();
};

// ─── DETERMINISTIC SCORING ENGINE ────────────────────────────────────

function computePaceScore(wpm: number): number {
  if (wpm < 100) return 20;
  if (wpm <= 119) return 45;
  if (wpm <= 139) return 70;
  if (wpm <= 160) return 100;
  if (wpm <= 180) return 80;
  if (wpm <= 200) return 55;
  return 30;
}

function computeFillerAdjustment(fillerRate: number): number {
  if (fillerRate === 0) return 25;
  if (fillerRate <= 1) return 15;
  if (fillerRate <= 3) return 0;
  if (fillerRate <= 6) return -15;
  return -30;
}

function computeSilenceAdjustment(silenceRatio: number, wpm: number): { confidence: number; delivery: number } {
  let deliveryAdj = 0;
  if (silenceRatio < 0.10) deliveryAdj = 10;
  else if (silenceRatio <= 0.25) deliveryAdj = 0;
  else if (silenceRatio <= 0.40) deliveryAdj = -10;
  else deliveryAdj = -25;

  // Extra penalty when high silence + low word count
  let confidenceAdj = deliveryAdj;
  if (silenceRatio > 0.25 && wpm < 80) {
    confidenceAdj -= 10;
  }
  return { confidence: confidenceAdj, delivery: deliveryAdj };
}

function computeClarityScore(transcript: string, words: string[], sentences: string[]): number {
  if (words.length < 3) return 5;

  // 1. Sentence length variance (30%) — harsher brackets
  const sentenceWordCounts = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const avgSentLen = sentenceWordCounts.reduce((a, b) => a + b, 0) / (sentenceWordCounts.length || 1);
  let sentLenScore = 85; // cap baseline lower
  if (avgSentLen < 5) sentLenScore = 20;
  else if (avgSentLen > 25) sentLenScore = 15;
  else if (avgSentLen < 8) sentLenScore = 45;
  else if (avgSentLen > 18) sentLenScore = 40;
  else if (avgSentLen >= 12 && avgSentLen <= 16) sentLenScore = 85; // tight ideal window
  // Variance penalty — steeper
  if (sentenceWordCounts.length > 1) {
    const variance = sentenceWordCounts.reduce((a, b) => a + Math.pow(b - avgSentLen, 2), 0) / sentenceWordCounts.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev > 8) sentLenScore = Math.max(10, sentLenScore - 35);
    else if (stdDev > 5) sentLenScore = Math.max(15, sentLenScore - 25);
    else if (stdDev > 3) sentLenScore = Math.max(25, sentLenScore - 12);
  }

  // 2. Hedging language rate (40%) — much harsher penalty per hedge
  const lowerTranscript = transcript.toLowerCase();
  let hedgeCount = 0;
  HEDGING_PHRASES.forEach(h => { hedgeCount += countSubstring(lowerTranscript, h.phrase); });
  const sentenceCount = Math.max(sentences.length, 1);
  const hedgesPerFiveSentences = (hedgeCount / sentenceCount) * 5;
  const hedgingScore = clamp(Math.round(100 - hedgesPerFiveSentences * 20), 0, 100);

  // 3. Vocabulary repetition (30%) — tighter thresholds
  const uniqueWords = new Set(words);
  const uniqueRatio = uniqueWords.size / words.length;
  let vocabScore: number;
  if (uniqueRatio >= 0.80) vocabScore = 100;
  else if (uniqueRatio >= 0.72) vocabScore = 75;
  else if (uniqueRatio <= 0.50) vocabScore = 15;
  else if (uniqueRatio <= 0.60) vocabScore = 35;
  else vocabScore = Math.round(35 + ((uniqueRatio - 0.60) / (0.72 - 0.60)) * 40);

  // Fewer sentences = lower ceiling (short recordings shouldn't get high clarity)
  const sentencePenalty = sentences.length < 3 ? -15 : sentences.length < 5 ? -8 : 0;

  return clamp(Math.round(sentLenScore * 0.30 + hedgingScore * 0.40 + vocabScore * 0.30) + sentencePenalty, 0, 100);
}

function computeConfidenceScore(
  fillerRate: number,
  silenceRatio: number,
  wpm: number,
  volumeVariance: number,
  hedgeCount: number,
  sentenceCount: number,
): number {
  const fillerAdj = computeFillerAdjustment(fillerRate);
  const silenceAdj = computeSilenceAdjustment(silenceRatio, wpm).confidence;

  // Hedging adjustment: each hedge per 5 sentences = -6
  const hedgesPerFive = (hedgeCount / Math.max(sentenceCount, 1)) * 5;
  const hedgingAdj = clamp(Math.round(-hedgesPerFive * 6), -30, 0);

  // Volume variance: low = flat = -10, high = dynamic = +10
  let volVarAdj = 0;
  if (volumeVariance < 2) volVarAdj = -10;
  else if (volumeVariance > 8) volVarAdj = 10;
  else volVarAdj = Math.round(((volumeVariance - 2) / 6) * 20 - 10);

  return clamp(50 + fillerAdj + silenceAdj + hedgingAdj + volVarAdj, 10, 100);
}

function computeDeliveryScore(paceScore: number, clarityScore: number, silenceDeliveryAdj: number): number {
  // Normalize silence adjustment to 0-100 scale: -25 → 0, +10 → 100
  const silenceNormalized = clamp(Math.round(((silenceDeliveryAdj + 25) / 35) * 100), 0, 100);
  return clamp(Math.round(paceScore * 0.30 + clarityScore * 0.40 + silenceNormalized * 0.30), 0, 100);
}

function computeOverallScore(pace: number, confidence: number, clarity: number, delivery: number): number {
  return clamp(Math.round(pace * 0.20 + confidence * 0.25 + clarity * 0.25 + delivery * 0.30), 0, 100);
}

function computeWordChoiceScore(words: string[], transcript: string): { score: number; powerWordsFound: string[]; passiveCount: number } {
  const wordSet = new Set(words);
  const powerWordsFound = [...new Set(POWER_WORDS.filter(w => wordSet.has(w)))];
  const lowerTranscript = transcript.toLowerCase();
  let passiveCount = 0;
  PASSIVE_CONSTRUCTIONS.forEach(p => { passiveCount += countSubstring(lowerTranscript, p); });

  const score = clamp(40 + (powerWordsFound.length * 8) - (passiveCount * 12), 0, 100);
  return { score, powerWordsFound, passiveCount };
}

function computeAllScores(
  transcript: string,
  audioMetrics: { silenceRatio?: number; volumeVariance?: number; durationSeconds?: number },
) {
  const cleanTranscript = transcript.trim();
  const words = extractWords(cleanTranscript);
  const wordCount = words.length;
  const sentences = extractSentences(cleanTranscript);
  const durationSeconds = Math.max(1, Number(audioMetrics.durationSeconds || 1));
  const wpm = Math.round((wordCount / durationSeconds) * 60);

  // Filler counting (multi-word fillers first)
  const lowerTranscript = cleanTranscript.toLowerCase();
  let fillerCount = 0;
  const fillerWordsFound: string[] = [];
  FILLER_WORDS.forEach(fw => {
    const c = countSubstring(lowerTranscript, fw);
    if (c > 0) { fillerCount += c; fillerWordsFound.push(fw); }
  });
  const fillerRate = (fillerCount / Math.max(wordCount, 1)) * 100;

  // Hedging count
  let hedgeCount = 0;
  const hedgingInstances: Array<{ phrase: string; suggestion: string }> = [];
  HEDGING_PHRASES.forEach(h => {
    const c = countSubstring(lowerTranscript, h.phrase);
    if (c > 0) {
      hedgeCount += c;
      hedgingInstances.push({ phrase: h.phrase, suggestion: h.suggestion });
    }
  });

  const silenceRatio = audioMetrics.silenceRatio ?? 0;
  const volumeVariance = audioMetrics.volumeVariance ?? 5;

  const paceScore = computePaceScore(wpm);
  const clarityScore = computeClarityScore(cleanTranscript, words, sentences);
  const silenceAdj = computeSilenceAdjustment(silenceRatio, wpm);
  const confidenceScore = computeConfidenceScore(fillerRate, silenceRatio, wpm, volumeVariance, hedgeCount, sentences.length);
  const deliveryScore = computeDeliveryScore(paceScore, clarityScore, silenceAdj.delivery);
  const overallScore = computeOverallScore(paceScore, confidenceScore, clarityScore, deliveryScore);
  const { score: wordChoiceScore, powerWordsFound, passiveCount } = computeWordChoiceScore(words, cleanTranscript);

  const fillerPercentage = Number(fillerRate.toFixed(1));

  return {
    wpm, wordCount, paceScore, clarityScore, confidenceScore, deliveryScore, overallScore,
    wordChoiceScore, powerWordsFound, passiveCount,
    fillerCount, fillerWordsFound, fillerPercentage,
    hedgeCount, hedgingInstances,
    sentences, silenceRatio,
  };
}

// ─── GRADE ───────────────────────────────────────────────────────────

function getGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

// ─── FALLBACK (no AI) ────────────────────────────────────────────────

function buildFallbackAnalysis(
  transcript: string,
  audioMetrics: { averageVolume?: number; silenceRatio?: number; volumeVariance?: number; durationSeconds?: number },
  reason: string,
) {
  const s = computeAllScores(transcript, audioMetrics);

  const techniques: Array<{ name: string; quote: string; impact: "pos" | "neutral" | "neg"; explanation: string }> = [];
  if (s.powerWordsFound.includes("because")) {
    techniques.push({ name: "Justification Trigger", quote: extractQuote(transcript, "because"), impact: "pos", explanation: "Using 'because' strengthens reasoning and improves listener buy-in." });
  }
  if (s.hedgingInstances.length > 0) {
    techniques.push({ name: "Hedging Language", quote: extractQuote(transcript, s.hedgingInstances[0].phrase), impact: "neutral", explanation: "Reducing hedging can make your delivery feel more decisive." });
  }
  if (s.fillerWordsFound.length > 0) {
    techniques.push({ name: "Filler Opportunity", quote: extractQuote(transcript, s.fillerWordsFound[0]), impact: "neutral", explanation: "Replacing filler with short pauses boosts clarity and authority." });
  }

  const fallbackModeLabel =
    reason === "credits_exhausted" ? "Fallback: Credits"
    : reason === "rate_limited" ? "Fallback: Rate Limit"
    : "Fallback: Auto";

  return {
    scores: {
      pace: s.paceScore, confidence: s.confidenceScore, clarity: s.clarityScore,
      delivery: s.deliveryScore, overall: s.overallScore,
    },
    analysis: {
      overall: `Your speech was ${s.wpm} WPM across ${s.wordCount} words. Grade: ${getGrade(s.overallScore)}. Filler rate: ${s.fillerPercentage}%. Hedging phrases detected: ${s.hedgeCount}.`,
      pace: `Estimated pace: ${s.wpm} WPM. ${s.wpm < 100 ? "Too slow — aim for 140-160 WPM." : s.wpm > 200 ? "Too fast — slow down for clarity." : s.wpm >= 140 && s.wpm <= 160 ? "Ideal pace range." : "Adjust toward 140-160 WPM for optimal delivery."}`,
      tone: "Tone analysis requires AI processing. Focus on replacing hedging language with direct statements for stronger authority.",
      clarity: `Clarity score is based on sentence length consistency, hedging rate, and vocabulary diversity. ${s.hedgeCount > 0 ? `Found ${s.hedgeCount} hedging phrase(s) — reduce these for sharper delivery.` : "No hedging detected — clean language."}`,
      delivery: `Delivery combines pace (${s.paceScore}), clarity (${s.clarityScore}), and silence patterns. ${s.passiveCount > 0 ? `Found ${s.passiveCount} passive construction(s) — use active voice.` : ""}`,
      strength: `"${transcript.slice(0, 140)}${transcript.length > 140 ? "..." : ""}" — this gives your message direction.`,
      weakness: s.hedgingInstances.length > 0
        ? `Upgrade "${s.hedgingInstances[0].phrase}" to "${s.hedgingInstances[0].suggestion}" for more authority.`
        : s.fillerWordsFound.length > 0
        ? `Reduce filler words like "${s.fillerWordsFound[0]}" — replace with short pauses.`
        : "Focus on varying your sentence structure for stronger impact.",
      recommendation: "Lead with your strongest claim. Replace hedging with decisive language. Pause after major points.",
    },
    techniques,
    fillerWords: { count: s.fillerCount, words: s.fillerWordsFound, percentage: s.fillerPercentage },
    hedgingInstances: s.hedgingInstances,
    powerWords: s.powerWordsFound,
    tags: [
      { label: `Grade ${getGrade(s.overallScore)}`, type: s.overallScore >= 65 ? "pos" : s.overallScore >= 50 ? "warn" : "neg" },
      { label: s.fillerCount > 0 ? "Filler Reduction" : "Clean Language", type: s.fillerCount > 0 ? "warn" : "pos" },
      { label: fallbackModeLabel, type: "warn" },
    ],
    communicationTips: [
      "Start with your strongest point in your first sentence.",
      "Use one idea per sentence for cleaner structure.",
      "Replace hedging phrases with direct statements.",
      "Swap filler words for short strategic pauses.",
      "Use 'because' to support key claims with clear reasons.",
      "End each point with a firm, downward close.",
    ],
    wordChoiceScore: s.wordChoiceScore,
    persuasionScore: clamp(30 + s.powerWordsFound.length * 5 + Math.min(s.wordCount, 80) * 0.3, 10, 70),
  };
}

// ─── MAIN ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let transcript = "";
  let audioMetrics: {
    averageVolume?: number;
    silenceRatio?: number;
    volumeVariance?: number;
    totalFrames?: number;
    durationSeconds?: number;
  } = {};
  let sessionGoal = "";
  let sessionType = "";
  let eventContext = "";

  try {
    const body = await req.json();
    transcript = body?.transcript ?? "";
    audioMetrics = body?.audioMetrics ?? {};
    sessionGoal = body?.sessionGoal ?? "";
    sessionType = body?.sessionType ?? "";
    eventContext = body?.eventContext ?? "";

    if (!transcript || transcript.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Could not detect enough speech. Please speak clearly into your microphone and try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify(buildFallbackAnalysis(transcript, audioMetrics, "missing_api_key")),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 1: AI-powered transcript cleanup
    console.log("Raw transcript:", transcript);
    try {
      const cleanupResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a speech transcript correction engine. Your ONLY job is to fix a raw speech-to-text transcript.

Rules:
- Fix misheard words, broken grammar, and nonsensical phrases caused by speech recognition errors
- Reconstruct what the speaker ACTUALLY said based on context clues
- Fix word boundaries and homophones chosen incorrectly
- Remove duplicate words/phrases caused by recognition restarts
- Preserve the speaker's actual vocabulary level and style — do NOT upgrade their language
- Do NOT add words or ideas the speaker didn't say
- Do NOT rephrase or restructure sentences
- Return ONLY the corrected transcript text, nothing else`
            },
            { role: "user", content: `Raw speech-to-text transcript to correct:\n\n${transcript}` },
          ],
        }),
      });

      if (cleanupResponse.ok) {
        const cleanupResult = await cleanupResponse.json();
        const cleaned = cleanupResult.choices?.[0]?.message?.content?.trim();
        if (cleaned && cleaned.length >= 5) {
          console.log("Cleaned transcript:", cleaned);
          transcript = cleaned;
        }
      }
    } catch (cleanupErr) {
      console.warn("Transcript cleanup failed, using raw:", cleanupErr);
    }

    // Step 2: Compute ALL scores deterministically
    const scores = computeAllScores(transcript, audioMetrics);

    // Step 3: AI provides ONLY qualitative analysis text + persuasion score
    const goalContext = sessionGoal ? `\nSession Goal: ${sessionGoal}` : "";
    const typeContext = sessionType ? `\nSession Type: ${sessionType}` : "";
    const eventInfo = eventContext ? `\nEvent Context: ${eventContext}` : "";

    const systemPrompt = `You are a speech & communication coach. You provide honest, specific feedback.
Your job is to analyze the transcript and provide QUALITATIVE feedback only. All numeric scores are pre-computed — do NOT generate scores for pace, confidence, clarity, delivery, overall, or word choice. You ONLY provide:
1. Written analysis paragraphs
2. Technique detection
3. A persuasion score (0-100) with strict rubric

## Pre-computed metrics (reference these in your feedback):
- WPM: ${scores.wpm}
- Pace Score: ${scores.paceScore}/100
- Clarity Score: ${scores.clarityScore}/100
- Confidence Score: ${scores.confidenceScore}/100
- Delivery Score: ${scores.deliveryScore}/100
- Overall Score: ${scores.overallScore}/100 (Grade: ${getGrade(scores.overallScore)})
- Word Choice Score: ${scores.wordChoiceScore}/100
- Filler count: ${scores.fillerCount} (${scores.fillerPercentage}%)
- Fillers found: ${scores.fillerWordsFound.join(", ") || "none"}
- Hedging phrases: ${scores.hedgeCount} (${scores.hedgingInstances.map(h => h.phrase).join(", ") || "none"})
- Power words: ${scores.powerWordsFound.join(", ") || "none"}
- Passive constructions: ${scores.passiveCount}
${goalContext}${typeContext}${eventInfo}

## Persuasion Score Rubric (0-100) — the ONLY score you generate:
- 0-20: No discernible argument or claim. Random words, no structure.
- 21-40: A vague point exists but no supporting evidence, no clear ask.
- 41-60: A basic claim is present with some reasoning, but weak structure or missing call-to-action.
- 61-80: Clear claim + supporting evidence/reasoning + some form of conclusion or call-to-action.
- 81-100: Strong claim, compelling evidence, emotional or logical appeal, decisive call-to-action.

Example calibration:
- "Um I think we should maybe do something about this" → persuasion: 15
- "We need to act now because our competitors are moving fast" → persuasion: 55
- "Our data shows a 40% improvement. I recommend we commit to this approach by Friday." → persuasion: 78

Return ONLY raw JSON:
{
  "analysis": {
    "overall": "<3-4 sentences referencing the pre-computed scores>",
    "pace": "<2-3 sentences about rhythm and pacing, reference ${scores.wpm} WPM>",
    "tone": "<2-3 sentences about authority and vocal power>",
    "clarity": "<2-3 sentences about message clarity and structure>",
    "delivery": "<3-4 sentences about word choice and rhetorical techniques>",
    "strength": "<2 sentences with a direct quote of the strongest moment>",
    "weakness": "<2 sentences with a direct quote of the weakest moment and fix>",
    "recommendation": "<3 sentences with specific actionable advice>"
  },
  "techniques": [
    {"name": "<technique>", "quote": "<exact words>", "impact": "pos|neutral|neg", "explanation": "<1 sentence>"}
  ],
  "persuasionScore": <0-100>,
  "persuasionReasoning": "<1 sentence explaining the persuasion score>",
  "communicationTips": ["<tip 1>", "<tip 2>", "<tip 3>", "<tip 4>", "<tip 5>", "<tip 6>"],
  "tags": [{"label": "<short label>", "type": "pos|warn|neg"}]
}

CRITICAL: Quote the speaker's ACTUAL words. Be honest — reference the pre-computed scores in your feedback. If the grade is D, say so directly.`;

    const userPrompt = `Analyze this speech transcript. All scores are pre-computed. Provide qualitative feedback and a persuasion score only.

Transcript (${scores.wordCount} words, ${scores.wpm} WPM over ${audioMetrics.durationSeconds || 0}s):
"${transcript}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      const reason = response.status === 429 ? "rate_limited" : response.status === 402 ? "credits_exhausted" : "gateway_error";
      return new Response(
        JSON.stringify(buildFallbackAnalysis(transcript, audioMetrics, reason)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse AI response
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      try {
        const firstBrace = jsonStr.indexOf("{");
        const lastBrace = jsonStr.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          parsed = JSON.parse(jsonStr.substring(firstBrace, lastBrace + 1));
        } else {
          throw new Error("No JSON found");
        }
      } catch {
        console.error("Failed to parse AI response:", content);
        return new Response(
          JSON.stringify(buildFallbackAnalysis(transcript, audioMetrics, "parse_failure")),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Persuasion score is the ONLY AI-generated score — clamp it
    const persuasionScore = clamp(Number(parsed.persuasionScore) || 30, 0, 100);

    // Build final response with deterministic scores + AI qualitative text
    const result = {
      scores: {
        pace: scores.paceScore,
        confidence: scores.confidenceScore,
        clarity: scores.clarityScore,
        delivery: scores.deliveryScore,
        overall: scores.overallScore,
      },
      analysis: parsed.analysis || buildFallbackAnalysis(transcript, audioMetrics, "missing_analysis").analysis,
      techniques: parsed.techniques || [],
      fillerWords: {
        count: scores.fillerCount,
        words: scores.fillerWordsFound,
        percentage: scores.fillerPercentage,
      },
      hedgingInstances: scores.hedgingInstances,
      powerWords: scores.powerWordsFound,
      tags: [
        { label: `Grade ${getGrade(scores.overallScore)}`, type: scores.overallScore >= 65 ? "pos" : scores.overallScore >= 50 ? "warn" : "neg" },
        { label: `${scores.wpm} WPM`, type: scores.wpm >= 140 && scores.wpm <= 160 ? "pos" : scores.wpm >= 120 && scores.wpm <= 180 ? "warn" : "neg" },
        { label: scores.fillerCount > 0 ? `${scores.fillerCount} Fillers` : "Clean Language", type: scores.fillerCount > 0 ? "warn" : "pos" },
        ...(parsed.tags || []),
      ],
      communicationTips: parsed.communicationTips || [
        "Start with your strongest point.",
        "Replace hedging with direct statements.",
        "Use strategic pauses instead of filler words.",
        "Keep sentences between 8-18 words.",
        "End points with decisive, downward closes.",
        "Use 'because' to justify key claims.",
      ],
      wordChoiceScore: scores.wordChoiceScore,
      persuasionScore,
      persuasionReasoning: parsed.persuasionReasoning || "",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-voice error:", e);

    if (transcript && transcript.trim().length >= 5) {
      return new Response(
        JSON.stringify(buildFallbackAnalysis(transcript, audioMetrics, "unexpected_error")),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
