import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const POWER_WORDS = [
  "because", "imagine", "guaranteed", "proven", "exclusive", "immediately", "need", "must", "will", "important", "critical", "essential", "definitely", "absolutely", "clearly", "certainly", "specifically", "exactly", "directly", "effectively", "successfully", "opportunity", "value", "benefit", "result", "achieve", "ensure", "deliver", "commit",
];

const FILLER_WORDS = ["um", "uh", "like", "you", "know", "basically", "actually", "literally"];

const HEDGING_SUGGESTIONS = [
  { phrase: "i think", suggestion: "I believe" },
  { phrase: "maybe", suggestion: "Here is what I recommend" },
  { phrase: "sort of", suggestion: "precisely" },
  { phrase: "kind of", suggestion: "specifically" },
  { phrase: "i guess", suggestion: "I am confident" },
  { phrase: "probably", suggestion: "very likely" },
  { phrase: "hopefully", suggestion: "I will" },
  { phrase: "i feel like", suggestion: "I know" },
  { phrase: "just", suggestion: "" },
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractWords = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const extractQuote = (transcript: string, term: string) => {
  const pattern = new RegExp(`([^.!?]*\\b${escapeRegExp(term)}\\b[^.!?]*)`, "i");
  const match = transcript.match(pattern);
  return match?.[1]?.trim().slice(0, 180) || transcript.slice(0, 180).trim();
};

function buildFallbackAnalysis(
  transcript: string,
  audioMetrics: {
    averageVolume?: number;
    silenceRatio?: number;
    volumeVariance?: number;
    durationSeconds?: number;
  },
  reason: string,
) {
  const cleanTranscript = transcript.trim();
  const words = extractWords(cleanTranscript);
  const wordCount = words.length;
  const durationSeconds = Math.max(1, Number(audioMetrics.durationSeconds || 1));
  const wpm = Math.round((wordCount / durationSeconds) * 60);

  const fillerFound = FILLER_WORDS.filter((word) => words.includes(word));
  const fillerCount = words.filter((word) => FILLER_WORDS.includes(word)).length;

  const hedgingInstances = HEDGING_SUGGESTIONS
    .filter(({ phrase }) => cleanTranscript.toLowerCase().includes(phrase))
    .slice(0, 6)
    .map(({ phrase, suggestion }) => ({ phrase, suggestion: suggestion || "remove this softener for more authority" }));

  const powerWords = [...new Set(POWER_WORDS.filter((word) => words.includes(word)))].slice(0, 12);

  const paceScore = clamp(Math.round(100 - Math.abs(wpm - 145) * 1.15), 58, 96);
  const confidenceScore = clamp(
    Math.round(72 + Math.min(powerWords.length, 8) * 2 - Math.min(fillerCount, 8) - hedgingInstances.length * 2),
    60,
    96,
  );
  const clarityScore = clamp(
    Math.round(70 + Math.min(wordCount, 180) / 6 - Math.min(fillerCount, 10) - hedgingInstances.length),
    60,
    96,
  );
  const deliveryScore = clamp(
    Math.round((paceScore + confidenceScore + clarityScore) / 3 + (powerWords.includes("because") ? 4 : 0)),
    60,
    97,
  );
  const overallScore = clamp(
    Math.round(deliveryScore * 0.45 + clarityScore * 0.25 + confidenceScore * 0.2 + paceScore * 0.1),
    60,
    97,
  );

  const wordChoiceScore = clamp(
    Math.round(68 + Math.min(powerWords.length, 8) * 2 - hedgingInstances.length * 2),
    60,
    96,
  );
  const persuasionScore = clamp(
    Math.round(64 + (powerWords.includes("because") ? 8 : 0) + Math.min(powerWords.length, 6) * 2),
    60,
    95,
  );

  const techniques = [] as Array<{
    name: string;
    quote: string;
    impact: "pos" | "neutral" | "neg";
    explanation: string;
  }>;

  if (powerWords.includes("because")) {
    techniques.push({
      name: "Justification Trigger",
      quote: extractQuote(cleanTranscript, "because"),
      impact: "pos",
      explanation: "Using 'because' strengthens reasoning and improves listener buy-in.",
    });
  }

  if (hedgingInstances.length > 0) {
    techniques.push({
      name: "Hedging Language",
      quote: extractQuote(cleanTranscript, hedgingInstances[0].phrase),
      impact: "neutral",
      explanation: "Reducing hedging can make your delivery feel even more decisive.",
    });
  }

  if (fillerFound.length > 0) {
    techniques.push({
      name: "Filler Opportunity",
      quote: extractQuote(cleanTranscript, fillerFound[0]),
      impact: "neutral",
      explanation: "Replacing filler with short pauses boosts clarity and authority.",
    });
  }

  const fallbackModeLabel =
    reason === "credits_exhausted"
      ? "Fallback: Credits"
      : reason === "rate_limited"
      ? "Fallback: Rate Limit"
      : "Fallback: Auto";

  const fillerPercentage = Number(((fillerCount / Math.max(wordCount, 1)) * 100).toFixed(1));

  return {
    scores: {
      pace: paceScore,
      confidence: confidenceScore,
      clarity: clarityScore,
      delivery: deliveryScore,
      overall: overallScore,
    },
    analysis: {
      overall:
        "You communicated a clear point and showed real intent, which is the strongest foundation for persuasive speaking. Even in fallback mode, your transcript shows meaningful structure and commitment. With small refinements to pacing and certainty language, this can become even more compelling.",
      pace: `Your estimated pace is about ${wpm} WPM. The ideal persuasive range is usually 130–160 WPM, so keep key points deliberate and avoid rushing transitions. Strategic pauses can make your strongest lines land with more impact.`,
      tone:
        "Your tone reads as purposeful and engaged. You can make it even stronger by replacing softeners with direct statements. Command language and shorter declarations will increase authority.",
      clarity:
        "Your message is understandable and has a central point. To improve clarity further, tighten long phrases and remove repeated filler words. Keep one key idea per sentence whenever possible.",
      delivery:
        "Your word choices include persuasive signals that help drive intent. Continuing to use concrete language and direct framing will improve delivery consistency. The biggest gain now is reducing hedging and filler to sound more decisive.",
      strength:
        `A strong moment is: "${cleanTranscript.slice(0, 140)}${cleanTranscript.length > 140 ? "..." : ""}" — this gives your message direction and emotional weight.`,
      weakness:
        hedgingInstances.length > 0
          ? `You could make this even stronger by upgrading "${hedgingInstances[0].phrase}" to a direct statement like "${hedgingInstances[0].suggestion}".`
          : "You could make this even stronger by trimming filler words and ending key points with a decisive close.",
      recommendation:
        "Keep your central message, but lead with your strongest claim in the first sentence. Replace any hedging phrase with decisive wording, then pause after major points. That combination will make your delivery sound more confident and persuasive.",
    },
    techniques,
    fillerWords: {
      count: fillerCount,
      words: fillerFound,
      percentage: fillerPercentage,
    },
    hedgingInstances,
    powerWords,
    tags: [
      { label: "Encouraging Baseline", type: "pos" },
      { label: fillerCount > 0 ? "Filler Reduction" : "Clean Language", type: fillerCount > 0 ? "warn" : "pos" },
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
    wordChoiceScore,
    persuasionScore,
  };
}

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

  try {
    const body = await req.json();
    transcript = body?.transcript ?? "";
    audioMetrics = body?.audioMetrics ?? {};

    if (!transcript || transcript.trim().length < 5) {
      return new Response(
        JSON.stringify({
          error:
            "Could not detect enough speech. Please speak clearly into your microphone and try again.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify(buildFallbackAnalysis(transcript, audioMetrics, "missing_api_key")),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 1: AI-powered transcript cleanup for much higher accuracy
    console.log("Raw transcript:", transcript);
    try {
      const cleanupResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a speech transcript correction engine. Your ONLY job is to fix a raw speech-to-text transcript that may contain errors from browser-based speech recognition.

Rules:
- Fix misheard words, broken grammar, and nonsensical phrases caused by speech recognition errors
- Reconstruct what the speaker ACTUALLY said based on context clues
- Fix word boundaries (e.g. "I scream" vs "ice cream", "new direction" vs "nude erection")
- Fix homophones chosen incorrectly (e.g. "their/there/they're", "your/you're")
- Remove duplicate words/phrases caused by recognition restarts
- Preserve the speaker's actual vocabulary level and style — do NOT upgrade their language
- Do NOT add words or ideas the speaker didn't say
- Do NOT rephrase or restructure sentences — keep the original word order
- Do NOT fix intentional informal speech patterns (contractions, slang they clearly meant)
- If a section is genuinely unintelligible, keep the closest approximation
- Return ONLY the corrected transcript text, nothing else — no explanations, no quotes, no labels`
              },
              {
                role: "user",
                content: `Raw speech-to-text transcript to correct:\n\n${transcript}`
              },
            ],
          }),
        },
      );

      if (cleanupResponse.ok) {
        const cleanupResult = await cleanupResponse.json();
        const cleaned = cleanupResult.choices?.[0]?.message?.content?.trim();
        if (cleaned && cleaned.length >= 5) {
          console.log("Cleaned transcript:", cleaned);
          transcript = cleaned;
        }
      }
    } catch (cleanupErr) {
      console.warn("Transcript cleanup failed, using raw transcript:", cleanupErr);
    }

    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    const wpm = audioMetrics.durationSeconds && audioMetrics.durationSeconds > 0
      ? (wordCount / audioMetrics.durationSeconds) * 60
      : 0;

    const systemPrompt = `You are a confident, supportive speech & negotiation coach with expertise in rhetoric, persuasion psychology, and vocal delivery. You provide honest, specific feedback that leads with strengths before addressing areas for improvement. Your tone is warm but direct — like a skilled mentor who genuinely wants speakers to succeed and knows exactly how to help them get there. You balance genuine praise with constructive, actionable critique.

Your analysis must be PRIMARILY based on WHAT was said and HOW it was delivered — the actual words, sentence structures, rhetorical devices, persuasion techniques, and communication patterns. Audio volume metrics are secondary context only.

## Analysis Framework

### 1. DELIVERY ANALYSIS (Primary — 70% of scoring weight)
Examine the transcript deeply for:
- **Word choice quality**: Are words precise, powerful, and purposeful? Or vague, weak, hedging?
- **Sentence structure**: Short punchy sentences vs rambling? Active vs passive voice? Command language vs tentative?
- **Rhetorical devices used**: Anaphora, tricolon, antithesis, rhetorical questions, metaphor, contrast, framing
- **Persuasion techniques**: Anchoring, social proof, scarcity, authority framing, reciprocity, loss aversion
- **Hedging/weakening language**: "I think", "maybe", "sort of", "kind of", "just", "I guess", "probably", "hopefully"
- **Filler words**: "um", "uh", "like", "you know", "basically", "actually", "literally"
- **Power words**: "because", "imagine", "guaranteed", "proven", "exclusive", "immediately"
- **Opening strength**: Did they open with impact or meander?
- **Closing strength**: Did they end decisively or trail off?
- **Logical flow**: Are ideas connected coherently? Is there a clear argument structure?
- **Conciseness**: Word economy — could the same point be made in fewer words?

### 2. CONSISTENCY & RHYTHM (20% weight)
- **Pace consistency**: Estimated ${Math.round(wpm)} WPM. Ideal negotiation pace: 130-160 WPM. Did they likely rush through key points or drag?
- **Structural consistency**: Do they maintain the same quality throughout or deteriorate?
- **Message discipline**: Do they stay on point or go off on tangents?

### 3. AUDIO CONTEXT (10% weight — secondary only)
- Volume avg: ${(audioMetrics.averageVolume ?? 0).toFixed(1)}, silence ratio: ${((audioMetrics.silenceRatio ?? 0) * 100).toFixed(1)}%, variance: ${(audioMetrics.volumeVariance ?? 0).toFixed(1)}
- Use these only to supplement delivery analysis, never as primary scoring factors

## Key Techniques to Detect and Call Out
When the speaker uses any of these, explicitly identify them as a POSITIVE:
- Strategic pausing (silence ratio context)
- Power positioning ("We will" vs "We could")
- The rule of three (tricolon)
- Contrast/antithesis ("Not X, but Y")
- Anchoring (stating a number/position first)
- Mirroring/labeling emotions
- Calibrated questions ("How would you...?")
- Decisive closings
- Reframing negative to positive
- Using "because" to justify (compliance trigger)
- Name/pronoun inclusion for engagement
- Specific numbers/data for credibility

## Response Format
Return ONLY raw JSON (no markdown, no code blocks):
{
  "scores": {
    "pace": <0-100>,
    "confidence": <0-100>,
    "clarity": <0-100>,
    "delivery": <0-100>,
    "overall": <0-100>
  },
  "analysis": {
    "overall": "<3-4 sentence assessment focusing on the actual words used>",
    "pace": "<2-3 sentences about rhythm, WPM, and pacing of key points>",
    "tone": "<2-3 sentences about authority, command language, and vocal power>",
    "clarity": "<2-3 sentences about message clarity, structure, and conciseness>",
    "delivery": "<3-4 sentences about word choice quality, rhetorical techniques, and persuasion patterns>",
    "strength": "<2 sentences identifying the single strongest moment/technique in the transcript with a direct quote>",
    "weakness": "<2 sentences identifying the weakest moment with a direct quote and how to fix it>",
    "recommendation": "<3 sentences with specific, actionable advice referencing their actual words>"
  },
  "techniques": [
    {"name": "<technique name>", "quote": "<exact words from transcript>", "impact": "pos|neutral|neg", "explanation": "<1 sentence why this matters>"}
  ],
  "fillerWords": {
    "count": <number>,
    "words": ["<word1>", "<word2>"],
    "percentage": <percentage of total words>
  },
  "hedgingInstances": [
    {"phrase": "<hedging phrase found>", "suggestion": "<stronger alternative>"}
  ],
  "powerWords": ["<power word found in transcript>"],
  "tags": [
    {"label": "<short label>", "type": "pos|warn|neg"}
  ],
  "communicationTips": ["<tip 1>", "<tip 2>", "<tip 3>", "<tip 4>", "<tip 5>", "<tip 6>"],
  "wordChoiceScore": <0-100>,
  "persuasionScore": <0-100>
}

CRITICAL RULES:
- Quote the speaker's ACTUAL words when giving feedback. Never be generic.
- If they used a technique well, acknowledge it clearly with the exact quote — but don't overpraise.
- If they hedged or used filler, call it out directly: "This weakened your delivery because..." Be honest about the impact.
- Scores should reflect the WORDS and DELIVERY, not just volume.
- A quiet speaker with perfect word choice should score higher than a loud speaker with weak language.
- Be specific and direct. "Your phrase '...' worked because..." or "Your phrase '...' fell flat because..." — don't dance around problems.
- TONE: Lead with genuine strengths, then address areas for growth constructively. Frame weaknesses as specific opportunities with clear solutions — be honest but encouraging. Speakers improve fastest when they feel capable AND know exactly what to work on.
- SCORING GUIDELINES: Use the FULL 0-100 range. Be brutally honest. If someone mumbles 3 words quietly over 30 seconds, that's a 10-20. If someone rambles with tons of filler and no structure, that's 25-40. Casual unfocused speech with some effort scores 40-55. Average delivery with decent clarity scores 55-70. Good speakers with clear structure and intent score 70-82. Strong speakers with rhetorical skill score 82-90. Exceptional, polished delivery with powerful techniques scores 90-97. Don't be afraid to give very low scores for genuinely poor delivery, and don't hold back high scores for genuinely excellent speech. The score should MEAN something. For wordChoiceScore: vague/empty language 15-40, generic language 40-60, clear language 60-78, precise and powerful language 78-95. For persuasionScore: no argument at all 10-30, weak scattered argument 30-50, a basic point 50-68, well-structured persuasion 68-85, masterful persuasion 85-97.
- SHORT RECORDINGS (under 10 seconds): Do NOT penalize for incomplete thoughts, unfinished sentences, or lack of a full argument structure. Short recordings are practice snippets — judge them on the QUALITY of the words spoken, not on whether the speaker completed a full idea. Focus on word choice, confidence of delivery, and any techniques used in the brief window. A strong 5-second clip with decisive language should score well.
- Power words should include a BROAD list: "because", "imagine", "guaranteed", "proven", "exclusive", "immediately", "need", "must", "will", "important", "critical", "essential", "definitely", "absolutely", "clearly", "certainly", "actually", "specifically", "exactly", "directly", "effectively", "successfully", "opportunity", "value", "benefit", "result", "achieve", "ensure", "deliver", "commit".`;

    const userPrompt = `Analyze this speech transcript with extreme precision. Focus on the words themselves, the delivery patterns, and any rhetorical or persuasion techniques used.

Transcript (${wordCount} words, ~${Math.round(wpm)} WPM over ${audioMetrics.durationSeconds || 0}s):
"${transcript}"

Provide your detailed analysis as JSON.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify(buildFallbackAnalysis(transcript, audioMetrics, "rate_limited")),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify(buildFallbackAnalysis(transcript, audioMetrics, "credits_exhausted")),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify(buildFallbackAnalysis(transcript, audioMetrics, "gateway_error")),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (_e1) {
      try {
        const repaired = jsonStr
          .replace(/,\s*\n\s*[a-zA-Z]\s+"name"/g, ',\n    {"name"')
          .replace(/}\s*,\s*\n\s*[a-zA-Z]\s+\{/g, '},\n    {');
        parsed = JSON.parse(repaired);
      } catch (_e2) {
        try {
          const firstBrace = jsonStr.indexOf("{");
          const lastBrace = jsonStr.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1) {
            const subset = jsonStr.substring(firstBrace, lastBrace + 1);
            parsed = JSON.parse(subset);
          } else {
            throw new Error("No JSON object found in AI response");
          }
        } catch {
          console.error("Failed to parse AI response:", content);
          parsed = buildFallbackAnalysis(transcript, audioMetrics, "parse_failure");
        }
      }
    }

    if (!parsed?.scores || !parsed?.analysis) {
      parsed = buildFallbackAnalysis(transcript, audioMetrics, "invalid_shape");
    }

    return new Response(JSON.stringify(parsed), {
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
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
