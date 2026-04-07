import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PAYLOAD_BYTES = 20_000; // 20KB max
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;
const ENDPOINT_NAME = "feedback-coach";

async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401, userId: null };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return { error: "Invalid token", status: 401, userId: null };
  }

  return { error: null, status: 200, userId: data.claims.sub as string };
}

async function checkQuotaAndLog(userId: string, ip: string) {
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: quota } = await serviceClient.rpc("check_user_quota", {
    _user_id: userId,
    _endpoint: ENDPOINT_NAME,
  });

  if (quota && !quota.allowed) {
    return { allowed: false, reason: quota.reason };
  }

  await serviceClient.from("api_usage_log").insert({
    user_id: userId,
    endpoint: ENDPOINT_NAME,
    ip_address: ip,
    status_code: 200,
  });

  return { allowed: true, reason: null };
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── AUTHENTICATION ──
    const { error: authError, status: authStatus, userId } = await authenticateRequest(req);
    if (authError || !userId) {
      return new Response(JSON.stringify({ error: authError || "Unauthorized" }), {
        status: authStatus, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIp = getClientIp(req);

    // ── PAYLOAD SIZE CHECK ──
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return new Response(JSON.stringify({ error: "Payload too large." }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // ── INPUT VALIDATION ──
    if (!body?.messages || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: messages required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userName = typeof body.userName === "string" ? body.userName.slice(0, 100).trim() : "";

    const messages = body.messages
      .slice(0, MAX_MESSAGES)
      .filter((m: any) => m && typeof m.role === "string" && typeof m.content === "string" && ["user", "assistant"].includes(m.role))
      .map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content.slice(0, MAX_MESSAGE_LENGTH),
      }));

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages provided." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── QUOTA CHECK ──
    const quotaResult = await checkQuotaAndLog(userId, clientIp);
    if (!quotaResult.allowed) {
      const msg = quotaResult.reason === "circuit_breaker_tripped"
        ? "Service temporarily disabled. Please try again later."
        : "Daily usage limit reached. Try again tomorrow.";
      return new Response(JSON.stringify({ error: msg }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are **Synterica Coach** — a world-class personal speech & communication coach embedded inside the Synterica voice-analysis platform.
${userName ? `\nThe user's name is "${userName}". Use their first name naturally in conversation to build rapport.\n` : ""}
Personality: warm but direct, encouraging yet honest, concise (never preachy). Use short paragraphs, bullet points, and actionable micro-drills when applicable.

Your expertise covers:
• Vocal delivery (pace, pitch, volume, intonation)
• Confidence & presence
• Filler-word reduction
• Persuasion & negotiation techniques
• Clarity & conciseness
• Public speaking & presentation skills
• Meeting & interview performance

Rules:
1. Keep answers under 200 words unless the user asks for depth.
2. When giving exercises, number them and keep them ≤ 3 steps.
3. Reference the user's Synterica practice data when they share scores.
4. Never reveal you are an AI / LLM. You are "Synterica Coach".
5. If a question is outside communication/speaking, politely redirect.
6. Use markdown formatting for readability.`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("feedback-coach error:", e);
    return new Response(JSON.stringify({ error: "An error occurred processing your request." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
