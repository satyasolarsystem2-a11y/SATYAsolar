import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Replace with actual WhatsApp API implementation (e.g. Meta Graph API, Twilio, Gupshup, Interakt)
// For this scaffolding, we use a generic placeholder function
async function sendWhatsAppMessage(phone: string, templateName: string, parameters: string[]) {
  const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_API_KEY");
  const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID");
  
  if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_ID) {
    console.warn("WhatsApp API credentials missing. Skipping message send.");
    return false;
  }

  // Example implementation using Meta Graph API
  /*
  const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: parameters.map(p => ({ type: "text", text: p }))
          }
        ]
      }
    }),
  });
  return response.ok;
  */
  
  console.log(`[WHATSAPP MOCK] Sent template '${templateName}' to ${phone} with args:`, parameters);
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Webhook received:", payload);

    // Supabase Webhook payload format
    // { type: 'INSERT' | 'UPDATE' | 'DELETE', table: 'cases', record: { ... }, old_record: { ... } }
    
    if (payload.table !== "cases") {
      return new Response(JSON.stringify({ message: "Ignored" }), { headers: corsHeaders });
    }

    const record = payload.record;
    const oldRecord = payload.old_record || {};
    
    const phone = record.phone;
    if (!phone) {
      return new Response(JSON.stringify({ message: "No phone number" }), { headers: corsHeaders });
    }

    const customerName = record.customer_name || "Customer";
    const trackingId = record.tracking_id || record.id;
    const currentStage = record.current_stage;

    // Check if stage changed
    const stageChanged = payload.type === "UPDATE" && record.current_stage !== oldRecord.current_stage;

    // Trigger WhatsApp notifications based on specific events
    
    if (payload.type === "INSERT" || (stageChanged && currentStage === "Registration")) {
      // 1. Registration Confirmation — Tracking ID ke saath
      await sendWhatsAppMessage(phone, "registration_confirmation", [
        customerName,
        String(trackingId),
        "Your solar installation case has been registered with Satya Solar."
      ]);
    } 
    else if (stageChanged && (currentStage === "Structure Dispatch" || currentStage === "Kit Dispatched")) {
      // 2. Material Dispatch — Out for delivery
      await sendWhatsAppMessage(phone, "material_dispatched", [
        customerName,
        String(trackingId),
        currentStage === "Structure Dispatch" ? "Solar structure" : "Solar kit, panels & inverter"
      ]);
    }
    else if (stageChanged && currentStage === "Net Metering Filed") {
      // 3. Net Metering Success
      await sendWhatsAppMessage(phone, "net_metering_filed", [
        customerName,
        String(trackingId)
      ]);
    }
    else if (stageChanged && currentStage === "Subsidy Filed") {
      // 4. Subsidy Filed
      await sendWhatsAppMessage(phone, "subsidy_filed", [
        customerName,
        String(trackingId)
      ]);
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });

  } catch (err: any) {
    console.error("Error processing webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
