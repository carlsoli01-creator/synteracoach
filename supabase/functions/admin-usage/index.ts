import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Check admin role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "summary";
    const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get("days") || "7")));

    if (action === "summary") {
      // Per-user usage summary
      const { data: usage } = await serviceClient
        .from("api_usage_log")
        .select("user_id, endpoint, created_at")
        .gte("created_at", new Date(Date.now() - days * 86400000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      // Aggregate per user
      const perUser: Record<string, { total: number; endpoints: Record<string, number>; last_active: string }> = {};
      for (const row of usage || []) {
        if (!perUser[row.user_id]) {
          perUser[row.user_id] = { total: 0, endpoints: {}, last_active: row.created_at };
        }
        perUser[row.user_id].total++;
        perUser[row.user_id].endpoints[row.endpoint] = (perUser[row.user_id].endpoints[row.endpoint] || 0) + 1;
        if (row.created_at > perUser[row.user_id].last_active) {
          perUser[row.user_id].last_active = row.created_at;
        }
      }

      // Get circuit breaker state
      const { data: cbState } = await serviceClient
        .from("circuit_breaker_state")
        .select("*")
        .eq("id", 1)
        .single();

      return new Response(JSON.stringify({
        period_days: days,
        total_requests: usage?.length || 0,
        unique_users: Object.keys(perUser).length,
        per_user: perUser,
        circuit_breaker: cbState,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_circuit_breaker") {
      await serviceClient
        .from("circuit_breaker_state")
        .update({ is_tripped: false, tripped_at: null, reason: null, updated_at: new Date().toISOString() })
        .eq("id", 1);

      return new Response(JSON.stringify({ success: true, message: "Circuit breaker reset." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_limits") {
      if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "POST required" }), {
          status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await req.json();
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof body.per_user_daily_limit === "number") {
        updates.per_user_daily_limit = Math.max(1, Math.min(10000, body.per_user_daily_limit));
      }
      if (typeof body.daily_global_limit === "number") {
        updates.daily_global_limit = Math.max(1, Math.min(1000000, body.daily_global_limit));
      }

      await serviceClient
        .from("circuit_breaker_state")
        .update(updates)
        .eq("id", 1);

      return new Response(JSON.stringify({ success: true, updates }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: summary, reset_circuit_breaker, update_limits" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-usage error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
