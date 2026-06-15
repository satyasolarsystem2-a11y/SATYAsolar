import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// This edge function is meant to be called by pg_cron or Supabase Scheduled Functions
// every day to find cases that were completed exactly 90 days ago.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Allow only POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Authenticate the request: Ensure this is called by Supabase or has the service role key
    const authHeader = req.headers.get("Authorization") || req.headers.get("apikey");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!authHeader || !authHeader.includes(serviceRoleKey!)) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey!
    );

    // Calculate the date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // We only care about the date part (YYYY-MM-DD)
    const targetDateStr = ninetyDaysAgo.toISOString().split('T')[0];

    console.log(`Looking for cases completed on: ${targetDateStr}`);

    // Query cases completed 90 days ago
    // `stage_start_time` contains the timestamp when the case entered the 'Completed' stage
    const { data: cases, error } = await supabase
      .from("cases")
      .select("id, system_specs, customer_name, phone, stage_start_time")
      .eq("current_stage", "Completed")
      .gte("stage_start_time", `${targetDateStr}T00:00:00Z`)
      .lt("stage_start_time", `${targetDateStr}T23:59:59.999Z`);

    if (error) throw error;

    console.log(`Found ${cases?.length || 0} cases eligible for 90-day follow-up.`);

    // Add them to a follow-up table or task list (e.g., alert on CRE dashboard)
    // For this implementation, we will log a comment/history and trigger an alert.
    
    if (cases && cases.length > 0) {
      for (const caseObj of cases) {
        
        // 1. Add to Case History
        await supabase.from("case_history").insert({
          case_id: caseObj.id,
          stage: "Completed",
          department: "CRE",
          updated_by: "System Scheduler",
          action_type: "90_day_follow_up",
          remarks: `System completed 90 days ago. Scheduled for Post-Sales Follow-Up.`
        });

        // 2. Add an alert/comment for CRE team
        await supabase.from("case_comments").insert({
          case_id: caseObj.id,
          user_id: "system", // Requires UUID of a system user, or modify column to accept 'system' text if string
          user_name: "System",
          text: "🚨 90-Day Post-Sales Checkup Due! Please contact the customer to verify plant performance."
        }).catch(err => {
          // Ignore foreign key violation if 'system' user_id doesn't exist
          console.warn("Could not insert comment (user_id 'system' may not exist):", err.message);
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed_count: cases?.length || 0 
    }), { headers: corsHeaders });

  } catch (err: any) {
    console.error("Error running scheduler:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
