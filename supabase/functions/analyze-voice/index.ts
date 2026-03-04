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

    const systemPrompt = `You are an expert voice and negotiation coach. You analyze speech transcripts along with audio metrics to provide genuine, actionable feedback.

You will receive:
- A transcript of what the user said
- Audio metrics: averageVolume (0-50 scale), silenceRatio (0-1, fraction of time silent), volumeVariance, totalFrames, durationSeconds

Based on these, provide a JSON response with EXACTLY this structure (no markdown, just raw JSON):
{
  "scores": {
    "pace": <0-100>,
    "confidence": <0-100>,
    "clarity": <0-100>,
    "overall": <0-100>
  },
  "analysis": {
    "overall": "<2-3 sentence overall assessment>",
    "pace": "<2-3 sentence pace analysis>",
    "tone": "<2-3 sentence tone/authority analysis>",
    "clarity": "<2-3 sentence clarity analysis>",
    "strength": "<1-2 sentence key strength>",
    "recommendation": "<2-3 sentence specific actionable recommendation>"
  },
  "tags": [
    {"label": "<short label>", "type": "pos|warn|neg"}
  ],
  "negotiationTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "communicationTips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}

Scoring guidelines:
- pace: Consider words per minute (estimate from transcript length / duration). 120-160 wpm = good. Too fast or too slow = lower score. Also factor in silenceRatio.
- confidence: Factor in averageVolume (higher = more confident), volumeVariance (lower = more consistent = better), and word choice (hedging language like "maybe", "I think", "kind of" = less confident).
- clarity: Consider sentence structure, filler words (um, uh, like, you know), and volume consistency.
- overall: Weighted average leaning toward what matters most for negotiation.

Be honest and specific. Reference actual words/phrases from the transcript. Don't be generic.`;

    const userPrompt = `Transcript: "${transcript}"

Audio Metrics:
- Average Volume: ${audioMetrics.averageVolume.toFixed(1)}
- Silence Ratio: ${(audioMetrics.silenceRatio * 100).toFixed(1)}%
- Volume Variance: ${audioMetrics.volumeVariance.toFixed(1)}
- Duration: ${audioMetrics.durationSeconds}s
- Total Frames Analyzed: ${audioMetrics.totalFrames}

Analyze this speech and provide your assessment as JSON.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
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
