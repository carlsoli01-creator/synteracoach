import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { transcript, audioMetrics } = await req.json();

    if (!transcript || transcript.trim().length < 5) {
      return new Response(
        JSON.stringify({
          error:
            "Could not detect enough speech. Please speak clearly into your microphone and try again.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    const wpm = audioMetrics.durationSeconds > 0 ? (wordCount / audioMetrics.durationSeconds) * 60 : 0;

    const systemPrompt = `You are a world-class speech & negotiation coach with expertise in rhetoric, persuasion psychology, and vocal delivery. You provide brutally honest, hyper-specific feedback.

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
- Volume avg: ${audioMetrics.averageVolume.toFixed(1)}, silence ratio: ${(audioMetrics.silenceRatio * 100).toFixed(1)}%, variance: ${audioMetrics.volumeVariance.toFixed(1)}
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
  "negotiationTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "communicationTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "wordChoiceScore": <0-100>,
  "structureScore": <0-100>,
  "persuasionScore": <0-100>
}

CRITICAL RULES:
- Quote the speaker's ACTUAL words when giving feedback. Never be generic.
- If they used a technique well, celebrate it with the exact quote.
- If they hedged or used filler, show the exact instance and provide the stronger alternative.
- Scores should reflect the WORDS and DELIVERY, not just volume.
- A quiet speaker with perfect word choice should score higher than a loud speaker with weak language.
- Be specific. "Good job" is unacceptable. "Your use of tricolon in 'we build, we deliver, we succeed' creates memorable rhythm" is the standard.`;

    const userPrompt = `Analyze this speech transcript with extreme precision. Focus on the words themselves, the delivery patterns, and any rhetorical or persuasion techniques used.

Transcript (${wordCount} words, ~${Math.round(wpm)} WPM over ${audioMetrics.durationSeconds}s):
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
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI analysis failed");
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
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-voice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
