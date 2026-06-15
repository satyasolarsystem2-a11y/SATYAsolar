// supabase/functions/workflow/index.ts
// Handles ALL case operations — replaces Express caseController.js + caseRoutes.js
// Deploy: supabase functions deploy workflow

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logoBase64 } from "../quotation/logoBase64.ts";

// ─── Workflow configuration ───────────────────────────────────────────────────

const workflowStages = [
  "Case Confirmed",
  "Registration: Document Verification",
  "Registration: Government Portal",
  "Registration: Payment Verification",
  "Bank & Finance",
  "Project: Survey & Design",
  "Warehouse: Material Dispatch",
  "Project: Installation",
  "Electrical: Net Metering",
  "Accounts: Payment Clearance",
  "Subsidy Registration",
  "Customer Service Update",
  "Project Completed"
];

const stageToTeam: Record<string, string> = {
  "Case Confirmed": "Sales",
  "Registration: Document Verification": "Registration",
  "Registration: Government Portal": "Registration",
  "Registration: Payment Verification": "Registration",
  "Bank & Finance": "Banking",
  "Project: Survey & Design": "Project",
  "Warehouse: Material Dispatch": "Warehouse",
  "Project: Installation": "Project",
  "Electrical: Net Metering": "Electrical",
  "Accounts: Payment Clearance": "Accounts",
  "Subsidy Registration": "Subsidy",
  "Customer Service Update": "Customer Service",
  "Project Completed": "Admin",
};

const stageToAllowedRole: Record<string, string[]> = {
  "Case Confirmed": ["sales", "admin"],
  "Registration: Document Verification": ["registration", "admin"],
  "Registration: Government Portal": ["registration", "admin"],
  "Registration: Payment Verification": ["registration", "admin"],
  "Bank & Finance": ["banking", "finance", "admin"],
  "Project: Survey & Design": ["project", "admin", "operations"],
  "Warehouse: Material Dispatch": ["warehouse", "inventory", "admin"],
  "Project: Installation": ["project", "field", "admin", "operations"],
  "Electrical: Net Metering": ["electrical", "net_metering", "admin"],
  "Accounts: Payment Clearance": ["accounts", "finance", "banking", "admin"],
  "Subsidy Registration": ["subsidy", "admin"],
  "Customer Service Update": ["customer_service", "admin"],
  "Project Completed": ["admin"],
};

// Build role → allowed stages map
const roleStageMap: Record<string, string[]> = {};
for (const [stage, roles] of Object.entries(stageToAllowedRole)) {
  for (const role of roles) {
    if (!roleStageMap[role]) roleStageMap[role] = [];
    roleStageMap[role].push(stage);
  }
}

// ─── CORS headers ─────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ─── Helper: verify JWT and get user profile ──────────────────────────────────
async function getUser(
  req: Request,
  supabase: ReturnType<typeof createClient>,
) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header");

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");

  // Get role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, status")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");
  if (profile.status === "inactive") throw new Error("Account is inactive");

  return { ...user, name: profile.name, role: profile.role?.toLowerCase() };
}

// ─── Document Masking Helper ────────────────────────────────────────────────────
function maskDocumentsForRole(role: string, docsObj: any) {
  if (!docsObj || typeof docsObj !== "object") return {};
  const restrictedRoles = [
    "warehouse",        // new role
    "project",          // new role
    // Legacy
    "inventory",
    "field_installation",
    "electrical",
    "store",
    "field",
  ];
  if (!restrictedRoles.includes(role)) return docsObj;

  const sensitiveKeywords = [
    "aadhar",
    "pan",
    "itr",
    "salary",
    "bank",
    "form 16",
    "gst",
    "kyc",
  ];
  const maskedDocs: any = {};

  for (const [key, value] of Object.entries(docsObj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeywords.some((kw) => keyLower.includes(kw));
    if (!isSensitive) {
      maskedDocs[key] = value;
    }
  }
  return maskedDocs;
}

// ─── Case-Level Data Masking ─────────────────────────────────────────────────
// Strips fields from the case row that the given role is not authorized to see.
// Approved rules (2026-05-24):
//   inventory        → Customer Name ✓, Tracking ID, Load Required, Dispatch; NO phone, address, financials
//   field_installation → Customer Name ✓, Tracking ID, Address, Phone; NO financials, NO KYC docs
//   subsidy          → Customer Name, Subsidy fields, Aadhar/Bank Passbook/Electricity Bill; NO loan financials
//   registration     → Full access EXCEPT payment_mode (Data Privacy Rule 2026-06)
//   banking / admin / sales → full access
function maskCaseDataForRole(role: string, caseRow: any): any {
  if (!caseRow || typeof caseRow !== "object") return caseRow;
  // Full access roles — return as-is
  if (["admin", "finance", "banking", "sales", "qa", "quality", "net_metering", "customer_service"].includes(role)) return caseRow;

  // ── Registration: full access EXCEPT payment_mode (hide completely) ──────
  // Even Network Tab inspection will show payment_mode: null for this role.
  if (role === "registration") {
    return { ...caseRow, payment_mode: null };
  }

  // Fields that are ALWAYS redacted for restricted roles
  const alwaysHidden: string[] = [];

  if (role === "warehouse") {
    // Warehouse sees: customer_name, tracking_id, id, current_stage, assigned_team,
    //                 load_required, status, created_at, stage_start_time,
    //                 dispatch_items, handoff_note, documents (already masked by maskDocumentsForRole)
    // Hidden: phone, alternate_phone, address, pin_code, reference, consumer_id,
    //         all finance fields, subsidy fields
    alwaysHidden.push(
      "phone",
      "alternate_phone",
      "address",
      "pin_code",
      "reference",
      "consumer_id",
      "payment_type",
      "payment_mode",
      "cash_amount",
      "down_payment",
      "loan_amount",
      "emi_amount",
      "bank_name",
      "lender_name",
      "marked_delayed_by",
      "marked_delayed_at",
      "delay_reason",
      "loan_account_number",
      "loan_tenure",
      "subsidy_ref_number",
      "subsidy_phase1_amount",
      "subsidy_phase2_amount",
      "subsidy_note",
      "installation_note",
      "site_visit_date",
    );
  } else if (role === "field" || role === "project" || role === "field_installation" || role === "technical" || role === "electrical") {
    // Field sees: customer_name, tracking_id, id, current_stage, assigned_team,
    //                    load_required, status, address, phone, geo_location,
    //                    site_visit_date, installation_note, documents (masked)
    // Hidden: financials, subsidy, alternate_phone, pin_code, reference, consumer_id
    alwaysHidden.push(
      "alternate_phone",
      "pin_code",
      "reference",
      "consumer_id",
      "payment_type",
      "payment_mode",
      "cash_amount",
      "down_payment",
      "loan_amount",
      "emi_amount",
      "bank_name",
      "lender_name",
      "loan_account_number",
      "loan_tenure",
      "marked_delayed_by",
      "marked_delayed_at",
      "delay_reason",
      "subsidy_ref_number",
      "subsidy_phase1_amount",
      "subsidy_phase2_amount",
      "subsidy_note",
    );
  } else if (role === "subsidy") {
    // Subsidy sees: customer_name, tracking_id, id, current_stage, status,
    //              consumer_id, load_required, subsidy_ref_number, subsidy amounts,
    //              documents (subsidy team needs Aadhar, Bank Passbook, Electricity Bill)
    // Hidden: internal loan financials, phone, address
    alwaysHidden.push(
      "phone",
      "alternate_phone",
      "address",
      "pin_code",
      "reference",
      "payment_type",
      "payment_mode",
      "cash_amount",
      "down_payment",
      "loan_amount",
      "emi_amount",
      "bank_name",
      "lender_name",
      "loan_account_number",
      "loan_tenure",
      "marked_delayed_by",
      "marked_delayed_at",
      "delay_reason",
      "installation_note",
      "site_visit_date",
      "dispatch_items",
      "handoff_note",
    );
  }

  const masked: any = { ...caseRow };
  for (const field of alwaysHidden) {
    if (field in masked) masked[field] = null;
  }
  return masked;
}

// ─── Main server ──────────────────────────────────────────────────────────────
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Create Supabase admin client (bypasses RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── PUBLIC: debug_schema ─────────────────────────────────────────────────
  const rawBody = await req.json().catch(() => ({}));
  if (rawBody.action === "debug_schema") {
    const { data, error } = await supabase
      .from("case_history")
      .select("*")
      .limit(2);
    // Let's just fix the bug! Remove updated_by_id!
    return new Response(JSON.stringify({ rows: data }), {
      headers: corsHeaders,
    });
  }

  // ── PUBLIC: track_status ─────────────────────────────────────────────────
  if (rawBody.action === "track_status") {
    const trackingId = (rawBody.trackingId || rawBody.caseId || "")
      .trim()
      .toUpperCase();
    if (!trackingId) {
      return new Response(
        JSON.stringify({ message: "Tracking ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Try tracking_id column first (RBSC-RAME-94721 format), fallback to case_id (CASE-0001)
    let data: any = null;
    let error: any = null;

    if (trackingId.startsWith("RBSC-")) {
      const res = await supabase
        .from("cases")
        .select("id, system_specs, current_stage, status, is_tracking_visible")
        .eq("system_specs->>tracking_id", trackingId)
        .maybeSingle();
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase
        .from("cases")
        .select("id, system_specs, current_stage, status, is_tracking_visible")
        .eq("id", trackingId)
        .maybeSingle();
      data = res.data;
      error = res.error;
    }

    if (!data || data.is_tracking_visible === false) {
      return new Response(
        JSON.stringify({
          message:
            "Tracking ID not found. Please check the ID from your email and try again.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    return new Response(
      JSON.stringify({
        case_id: data.id,
        tracking_id: data.system_specs?.tracking_id || data.id,
        current_stage: data.current_stage,
        status: data.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const user = await getUser(req, supabase);
    const body = rawBody;
    const action = body.action || "";

    // ── GET ALL CASES ──────────────────────────────────────────────────────
    if (action === "get_all") {
      let query = supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      // Admin simulating an employee role — filter by that role's stages
      let effectiveRole =
        user.role === "admin" && body.viewAsRole
          ? body.viewAsRole.toLowerCase()
          : user.role;

      if (effectiveRole !== "admin") {
        if (
          effectiveRole === "registration" ||
          effectiveRole === "finance" ||
          effectiveRole === "warehouse" ||
          effectiveRole === "field" ||
          effectiveRole === "qa" ||
          effectiveRole === "subsidy" ||
          effectiveRole === "sales"
        ) {
          // These departments need full pipeline visibility:
          //   • Registration  — creates all cases, needs to track the whole journey
          //   • Banking       — tracks loan/cash approvals even after hand-off
          //   • Inventory     — dispatches goods; needs to see dispatched+completed cases too
          //   • Field Install — installs plants; needs to see installed+completed cases
          //   • Subsidy       — registers subsidies; needs to see subsidy+completed cases
          //   • Sales         — creates quotations; needs to see their customers progress
          // Sensitive docs are still masked per-role via maskDocumentsForRole.
          // No stage restriction here — all cases are visible.
        } else {
          // All other depts: strict stage-based — see only cases at their active stage
          const allowedStages = roleStageMap[effectiveRole] || [];
          if (allowedStages.length === 0) return jsonResponse([]);
          query = query.in("current_stage", allowedStages);
        }
      } else {
        // Admin user: sees all cases
      }


      if (body.stage) query = query.eq("current_stage", body.stage);
      if (body.team) query = query.eq("assigned_team", body.team);
      if (body.search) {
        query = query.or(
          `customer_name.ilike.%${body.search}%,id.ilike.%${body.search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const maskedData = data.map((caseObj: any) => {
        // Deterministic fallback if IDs are missing
        let tId = caseObj.system_specs?.tracking_id;
        if (!tId) {
          const cName = caseObj.customer_name || "CUST";
          const tSlug = cName.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z]/g, "").substring(0, 5).padEnd(5, "X");
          const rDigits = String(caseObj.id || "").replace(/\D/g, '').substring(0, 5).padEnd(5, "0");
          tId = `${tSlug}${rDigits}`;
        }
        
        let cId = caseObj.system_specs?.customer_id;
        if (!cId) {
          const cName = caseObj.customer_name || "CUST";
          const cSlug = cName.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z]/g, "").substring(0, 2).padEnd(2, "X");
          const cAt = new Date(caseObj.created_at || Date.now());
          const dd = String(cAt.getDate()).padStart(2, "0");
          const mm = String(cAt.getMonth() + 1).padStart(2, "0");
          const yyyy = String(cAt.getFullYear());
          cId = `${cSlug}${dd}${mm}${yyyy}`;
        }

        const withMaskedDocs = {
          ...caseObj,
          tracking_id: tId,
          customer_id: cId,
          documents: maskDocumentsForRole(effectiveRole, caseObj.documents),
        };
        return maskCaseDataForRole(effectiveRole, withMaskedDocs);
      });

      return jsonResponse(maskedData);
    }

    // ── GET DEPT EMPLOYEES (for assign dropdown) ──────────────────────────────
    if (action === "get_dept_employees") {
      if (user.role !== "admin")
        return jsonResponse({ message: "Unauthorized" }, 403);

      const { data: caseRow } = await supabase
        .from("cases")
        .select("current_stage")
        .eq("id", body.caseId)
        .single();

      if (!caseRow) return jsonResponse({ message: "Case not found" }, 404);

      const stageToDeptRole: Record<string, string> = {
        "Quotation": "sales",
        "Registration": "registration",
        "Finance Clearance": "finance",
        "Structure Dispatch": "warehouse",
        "Structure Installed": "field",
        "Kit Dispatched": "warehouse",
        "Kit Installed": "field",
        "Net Metering Filed": "registration",
        "QA Inspected": "qa",
        "Subsidy Filed": "subsidy",
        "Completed": "admin",
      };

      const deptRole = stageToDeptRole[caseRow.current_stage];
      if (!deptRole) return jsonResponse([]);

      const { data: employees, error: empErr } = await supabase
        .from("profiles")
        .select("id, name, role")
        .eq("role", deptRole)
        .eq("status", "active")
        .order("name");

      if (empErr) throw empErr;
      return jsonResponse(employees || []);
    }

    // ── GET ONE CASE ───────────────────────────────────────────────────────
    if (action === "get_one") {
      const { data: caseData, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();
      if (error) return jsonResponse({ message: "Case not found" }, 404);

      // RBAC check:
      // - Admin: unrestricted
      // - Registration: can READ any case (full pipeline visibility); write enforced in update_stage
      // - Others: can read cases AT their stage OR that have already PASSED their last stage
      //   (so departments can open the drawer for cases in their "Completed" tab)
      if (user.role !== "admin" && user.role !== "registration") {
        const myStages = roleStageMap[user.role] || [];
        const myLastStageIdx = Math.max(
          ...myStages.map((s: string) => workflowStages.indexOf(s)),
        );
        const caseStageIdx = workflowStages.indexOf(caseData.current_stage);
        // Allow access if:
        //   a) case is currently at one of my stages, OR
        //   b) case has passed my last stage (I've already handed it off — read-only)
        const canRead =
          myStages.includes(caseData.current_stage) ||
          (myLastStageIdx >= 0 && caseStageIdx > myLastStageIdx);
        if (!canRead) {
          return jsonResponse(
            { message: "Access restricted to your department's cases." },
            403,
          );
        }
      }

      const { data: history } = await supabase
        .from("case_history")
        .select("*")
        .eq("case_id", body.caseId)
        .order("timestamp", { ascending: true }); // chronological order

      const { data: comments } = await supabase
        .from("case_comments")
        .select("*")
        .eq("case_id", body.caseId)
        .order("created_at", { ascending: false });

      caseData.documents = maskDocumentsForRole(user.role, caseData.documents);
      const maskedCase = maskCaseDataForRole(user.role, caseData);

      return jsonResponse({
        case: maskedCase,
        history: history || [],
        comments: comments || [],
      });
    }

    // ── CREATE CASE ────────────────────────────────────────────────────────
    if (action === "create_case") {
      if (user.role !== "registration" && user.role !== "admin" && user.role !== "sales") {
        return jsonResponse(
          { message: "Only Sales or Registration department can create cases" },
          403,
        );
      }

      // ── Generate & save branded tracking_id & customer_id ────────────────
      const customerName = body.customerName || "CUST";
      
      const trackingSlug = customerName
        .replace(/\s+/g, "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .substring(0, 5)
        .padEnd(5, "X");
      const randomDigits5 = String(Math.floor(10000 + Math.random() * 90000));
      const trackingIdVal = `${trackingSlug}${randomDigits5}`;

      const custSlug = customerName
        .replace(/\s+/g, "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .substring(0, 2)
        .padEnd(2, "X");
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = String(now.getFullYear());
      const customerIdVal = `${custSlug}${dd}${mm}${yyyy}`;
      // ─────────────────────────────────────────────────────────────────────

      const { data: newCase, error } = await supabase
        .from("cases")
        .insert({
          customer_name: body.customerName,
          email: body.email || "",
          phone: body.phone,
          alternate_phone: body.alternatePhone || "",
          address: body.address,
          reference: body.reference || "",
          consumer_id: body.consumerId || "",
          pin_code: body.pinCode || "",
          load_required: body.loadRequired,
          payment_type: body.paymentType || "cash",
          current_stage: "Case Confirmed",
          assigned_team: "Sales",
          status: "In Progress",
          stage_start_time: new Date().toISOString(),
          created_by: user.id,
          sales_person: body.salesPerson || user.name,
          system_specs: { ...(body.systemSpecs || {}), tracking_id: trackingIdVal, customer_id: customerIdVal },
          documents: body.documents || {},
        })
        .select()
        .single();

      if (error) throw error;

      // Create history entry with department
      await supabase.from("case_history").insert({
        case_id: newCase.id,
        stage: "Case Confirmed",
        department: "Sales",
        updated_by: user.name,
        action_type: "case_created",
        remarks: "Customer Registered",
      });

      // ── EMAIL MOVED TO WORKFLOW UPDATE_STAGE ──
      // Email is no longer sent automatically on case creation.
      // ─────────────────────────────────────────────────────────────────────

      return jsonResponse(newCase, 201);
    }

    // NOTE: update_details with proper field mapping is handled further below

    // ── RESEND TRACKING ID ────────────────────────────────────────────────
    if (action === "resend_tracking_id") {
      const { data: caseObj, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();

      if (error || !caseObj)
        return jsonResponse({ message: "Case not found" }, 404);
      if (!caseObj.customer_email)
        return jsonResponse({ message: "Customer email missing" }, 400);

      const trackingId = caseObj.system_specs?.tracking_id || caseObj.id;
      const customerName = caseObj.customer_name || "Customer";
      const trackingUrl = `https://rbscsolarcrm.probfixora.co.in/track?id=${encodeURIComponent(trackingId)}`;

      const companyName = Deno.env.get("COMPANY_NAME") || "RBSC Associates";
      const companyEmail =
        Deno.env.get("COMPANY_EMAIL") || "info@rbscsolar.com";
      const senderEmail = Deno.env.get("GMAIL_EMAIL") || companyEmail;
      const brevoApiKey = Deno.env.get("BREVO_API_KEY");

      if (!brevoApiKey || !senderEmail) {
        return jsonResponse({ message: "Email configuration missing." }, 500);
      }

      const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<title>Your Tracking ID — ${companyName}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;background:#f0f4f8;color:#1a202c}.wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)}.header{background:linear-gradient(135deg,#1a1a5e 0%,#16a34a 100%);padding:28px 40px;text-align:center}.header h1{color:#fff;font-size:20px;font-weight:700}.body{padding:32px 40px}.tracking-card{background:linear-gradient(135deg,#eef2ff,#ecfdf5);border:1.5px solid #c7d2fe;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center}.tracking-label{font-size:12px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}.tracking-id{font-size:28px;font-weight:700;color:#1a1a5e;letter-spacing:2px;font-family:monospace}.cta-wrap{text-align:center;margin:20px 0}.cta-btn{display:inline-block;background:linear-gradient(135deg,#1a1a5e,#16a34a);color:#fff!important;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:8px}.footer{background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}</style>
</head><body><div class="wrapper">
<div class="header"><h1>📋 Your Tracking ID</h1></div>
<div class="body">
<p style="font-size:16px;font-weight:700;color:#1a1a5e;margin-bottom:10px">Hello ${customerName},</p>
<p style="font-size:14px;color:#4a5568;line-height:1.7;margin-bottom:16px">As requested, here is your Tracking ID to monitor your solar installation status.</p>
<div class="tracking-card"><div class="tracking-label">Your Tracking ID</div><div class="tracking-id">${trackingId}</div><p style="font-size:12px;color:#64748b;margin-top:6px">Keep this safe for future reference</p></div>
<div class="cta-wrap"><a href="${trackingUrl}" class="cta-btn">Track Installation Live</a></div>
<p style="font-size:13px;color:#4a5568;line-height:1.7">If you have questions, contact us at <strong>${companyEmail}</strong> and quote your Tracking ID.</p>
<p style="font-size:13px;color:#4a5568;margin-top:12px">Warm regards,<br/><strong style="color:#1a1a5e">${companyName} Team</strong></p>
</div>
<div class="footer">© ${new Date().getFullYear()} ${companyName}. This is an automated message.</div>
</div></body></html>`;

      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: companyName, email: senderEmail },
            to: [{ email: caseObj.customer_email, name: customerName }],
            subject: `Your Tracking ID: ${trackingId} — ${companyName}`,
            htmlContent,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          await supabase.from("email_logs").insert({
            recipient_email: caseObj.customer_email,
            email_type: "tracking_id_resend",
            status: "failed",
            error_message: errText,
            reference_id: trackingId,
          });
          return jsonResponse({ message: "Failed to send email." }, 500);
        }

        const result = await res.json();
        await supabase.from("email_logs").insert({
          recipient_email: caseObj.customer_email,
          email_type: "tracking_id_resend",
          status: "sent",
          message_id: result.messageId,
          reference_id: trackingId,
        });

        // Audit Trail
        await supabase.from("case_history").insert({
          case_id: caseObj.id,
          stage: caseObj.current_stage,
          updated_by: user.name,
          action_type: "tracking_id_resent",
          remarks: `Tracking ID manually resent to ${caseObj.customer_email}`,
        });

        return jsonResponse({ message: "Tracking ID resent successfully!" });
      } catch (err: any) {
        return jsonResponse({ message: err.message }, 500);
      }
    }

    // ── UPDATE STAGE ───────────────────────────────────────────────────────
    if (action === "update_stage") {
      const { data: caseObj, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();
      if (error) return jsonResponse({ message: "Case not found" }, 404);

      const currentStageRaw = caseObj.current_stage?.trim();
      const normalizedStage = workflowStages.find(
        (s) => s.toLowerCase() === currentStageRaw.toLowerCase(),
      );
      if (!normalizedStage)
        return jsonResponse(
          { message: `Invalid workflow state: "${currentStageRaw}"` },
          400,
        );

      const currentIndex = workflowStages.indexOf(normalizedStage);

      // ── DOCUMENT GATE: Sales and Registration require Docs Verified ──
      if (
        normalizedStage === "Case Confirmed" ||
        normalizedStage === "Registration: Document Verification"
      ) {
        const docStatuses = caseObj.document_statuses || {};
        const docs = caseObj.documents || {};
        const unverified = Object.keys(docs).filter(
          (docName) => (docStatuses[docName] || "Yellow") !== "Green",
        );
        if (unverified.length > 0) {
          return jsonResponse(
            {
              message: `Documents not fully verified. Please verify all documents before proceeding.`,
              unverifiedDocs: unverified,
            },
            400,
          );
        }

      }
      // ──────────────────────────────────────────────────────────────────────

      // RBAC check: sales can move case FROM "Case Confirmed" to registration
      const isSalesHandoff =
        user.role === "sales" &&
        normalizedStage === "Case Confirmed" &&
        body.newStage?.trim() === "Registration: Document Verification";

      const allowedRoles = stageToAllowedRole[normalizedStage] || [];
      if (!isSalesHandoff && user.role !== "admin" && !allowedRoles.includes(user.role)) {
        return jsonResponse(
          {
            message: `Unauthorized: Your role (${user.role}) cannot update cases at "${normalizedStage}"`,
          },
          403,
        );
      }

      if (currentIndex === workflowStages.length - 1) {
        return jsonResponse({ message: "Case is already at final stage" }, 400);
      }

      // ── BRANCHING & SPECIFIC JUMPS ──
      const isPaymentVerStage = normalizedStage === "Registration: Payment Verification";
      let expectedNextStage: string;

      if (isPaymentVerStage) {
        const payType = (body.paymentType || caseObj.payment_type || "").toLowerCase();
        if (payType === "loan") {
          expectedNextStage = "Bank & Finance";
        } else {
          expectedNextStage = "Project: Survey & Design";
        }
      } else {
        expectedNextStage = workflowStages[currentIndex + 1];
        if (
          expectedNextStage.toLowerCase() !== body.newStage?.trim().toLowerCase()
        ) {
          return jsonResponse(
            {
              message: `Invalid transition. From ${normalizedStage}, you can only move to ${expectedNextStage}`,
            },
            400,
          );
        }
      }

      // ── SPECIAL: Customer Service auto-completes the case ──
      const isProjectComplete = expectedNextStage === "Project Completed";

      const newStatus =
        isProjectComplete
          ? "Completed"
          : caseObj.status === "Delayed" && caseObj.marked_delayed_at
            ? "Delayed"
            : "In Progress";

      const finalStage = expectedNextStage;
      const finalTeam = stageToTeam[finalStage] || "Admin";

      const { data: updated, error: updateError } = await supabase
        .from("cases")
        .update({
          current_stage: finalStage,
          assigned_team: finalTeam,
          stage_start_time: new Date().toISOString(),
          status: newStatus,
          // ── Escalation timer reset ───────────────────────────────────────────
          // Reset stage_entered_at so the pg_cron escalation job calculates
          // staleness from when the case arrived at this new stage, not creation.
          // Also reset escalation_level to 0 (clean slate for new department).
          stage_entered_at: new Date().toISOString(),
          escalation_level: 0,
          // ────────────────────────────────────────────────────────────────────
          ...(finalStage === "Registration Approved"
            ? { is_tracking_visible: true }
            : {}),
        })
        .eq("id", body.caseId)
        .select()
        .single();

      if (updateError) throw updateError;

      // History: log the stage transition with department info
      const historyStage = isProjectComplete
        ? "Customer Service Update"
        : caseObj.current_stage;
      const historyDept = stageToTeam[historyStage] || "Unknown";
      await supabase.from("case_history").insert({
        case_id: caseObj.id,
        stage: historyStage,
        department: historyDept,
        updated_by: user.name,
        action_type: "stage_update",
        remarks: isProjectComplete
          ? body.remarks ||
          "Customer Service Follow-up Completed — Customer marked as Completed"
          : body.remarks,
      });

      // If subsidy complete, add a second history entry marking as Completed
      if (isProjectComplete) {
        await supabase.from("case_history").insert({
          case_id: caseObj.id,
          stage: "Project Completed",
          department: "Admin",
          updated_by: "System (Auto)",
          action_type: "system_auto",
          remarks:
            "Customer automatically marked Completed after Subsidy Registration",
        });
      }

      // ── AUTO-INVENTORY DEDUCTION FOR "Sent to Store" ────────────────────
      if (finalStage === "Sent to Store") {
        try {
          let specs = caseObj.system_specs;
          if (!specs || Object.keys(specs).length === 0) {
            const { data: quot } = await supabase
              .from("quotations")
              .select("*")
              .ilike("customer_name", caseObj.customer_name)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (quot) {
              specs = {
                productCategory: quot.product_category,
                panelCount: quot.panel_count,
                inverterBrand: quot.inverter_brand,
                inverterKw: quot.inverter_kw,
                batteryBrand: quot.battery_brand,
                batteryCount: quot.battery_count,
                structure: quot.structure,
                bos: quot.bos,
              };
            }
          }

          if (specs) {
            // Find inventory items roughly matching the specs
            const { data: invItems } = await supabase
              .from("inventory")
              .select("*")
              .eq("is_active", true);
            const itemsToDeduct = [];

            if (invItems) {
              // 1. Panels
              if (specs.panelCount) {
                const panel = invItems.find(
                  (i) => i.category?.toLowerCase() === "solar panel",
                );
                if (panel)
                  itemsToDeduct.push({
                    item: panel,
                    qty: Number(specs.panelCount),
                  });
              }
              // 2. Inverter
              if (specs.inverterBrand) {
                const inv =
                  invItems.find(
                    (i) =>
                      i.category?.toLowerCase() === "inverter" &&
                      i.brand?.toLowerCase() ===
                      specs.inverterBrand?.toLowerCase(),
                  ) ||
                  invItems.find(
                    (i) => i.category?.toLowerCase() === "inverter",
                  );
                if (inv) itemsToDeduct.push({ item: inv, qty: 1 }); // usually 1 inverter
              }
              // 3. Battery
              if (specs.batteryBrand && specs.batteryCount) {
                const bat =
                  invItems.find(
                    (i) =>
                      i.category?.toLowerCase() === "battery" &&
                      i.brand?.toLowerCase() ===
                      specs.batteryBrand?.toLowerCase(),
                  ) ||
                  invItems.find((i) => i.category?.toLowerCase() === "battery");
                if (bat)
                  itemsToDeduct.push({
                    item: bat,
                    qty: Number(specs.batteryCount),
                  });
              }

              // Deduct and log
              for (const { item, qty } of itemsToDeduct) {
                if (qty > 0) {
                  const newStock = Math.max(0, (item.stock || 0) - qty);
                  const newRes = (item.reserved_quantity || 0) + qty;
                  await supabase
                    .from("inventory")
                    .update({ stock: newStock, reserved_quantity: newRes })
                    .eq("id", item.id);

                  // Transaction log
                  await supabase.from("inventory_transactions").insert({
                    inventory_id: item.id,
                    inventory_name: item.name,
                    case_id: caseObj.id,
                    transaction_type: "reservation",
                    quantity: -qty,
                    stock_before: item.stock,
                    stock_after: newStock,
                    notes: `Auto-reserved for case ${caseObj.id}`,
                    created_by: "System (Auto)",
                    created_by_role: "system",
                  });
                }
              }

              // Log auto-deduction in case history
              if (itemsToDeduct.length > 0) {
                await supabase.from("case_history").insert({
                  case_id: caseObj.id,
                  stage: "Sent to Store",
                  department: "Inventory",
                  updated_by: "System (Auto)",
                  action_type: "system_auto",
                  remarks:
                    "Inventory automatically calculated and reserved based on system specs.",
                });
              }
            }
          }
        } catch (e) {
          console.error("Auto inventory deduction failed:", e);
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      // ── PHONE VERIFICATION DONE: Send Tracking ID email (with duplicate guard) ──
      if (finalStage === "Phone Verification Done") {
        const sendTrackingIdEmail = async (): Promise<void> => {
          try {
            // Duplicate prevention: check if tracking_id_sent was already fired
            const { data: existingTrigger } = await supabase
              .from("case_history")
              .select("id")
              .eq("case_id", caseObj.id)
              .eq("action_type", "tracking_id_sent")
              .maybeSingle();

            if (existingTrigger) {
              console.log(
                `[phone_verification] Tracking ID email already sent for case ${caseObj.id} — skipping duplicate.`,
              );
              return;
            }

            const brevoApiKey = Deno.env.get("BREVO_API_KEY");
            const senderEmail = Deno.env.get("GMAIL_EMAIL");
            const customerEmail = caseObj.email || "";
            const companyName = Deno.env.get("COMPANY_NAME") || "RBSC Solar";
            const companyEmail =
              Deno.env.get("COMPANY_EMAIL") || "info@rbscsolar.com";
            const companyWebsite =
              Deno.env.get("COMPANY_WEBSITE") || "www.rbscsolar.com";

            const trackingId = caseObj.system_specs?.tracking_id || caseObj.id;
            const customerName = caseObj.customer_name || "Customer";
            const trackingUrl = `https://rbscsolarcrm.probfixora.co.in/track?id=${encodeURIComponent(trackingId)}`;

            // Log the trigger to case_history FIRST (so duplicate guard works even if email fails)
            await supabase.from("case_history").insert({
              case_id: caseObj.id,
              stage: "Phone Verification Done",
              department: "Registration",
              updated_by: "System (Auto)",
              action_type: "tracking_id_sent",
              remarks: `Tracking ID ${trackingId} sent to customer via email.`,
            });

            if (!brevoApiKey || !senderEmail || !customerEmail) {
              console.warn(
                `[phone_verification] Email config missing or no customer email for case ${caseObj.id} — logged trigger but skipped email.`,
              );
              return;
            }

            const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<title>Your Tracking ID — ${companyName}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;background:#f0f4f8;color:#1a202c}.wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)}.header{background:linear-gradient(135deg,#1a1a5e 0%,#16a34a 100%);padding:28px 40px;text-align:center}.header h1{color:#fff;font-size:20px;font-weight:700}.body{padding:32px 40px}.tracking-card{background:linear-gradient(135deg,#eef2ff,#ecfdf5);border:1.5px solid #c7d2fe;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center}.tracking-label{font-size:12px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}.tracking-id{font-size:28px;font-weight:700;color:#1a1a5e;letter-spacing:2px;font-family:monospace}.cta-wrap{text-align:center;margin:20px 0}.cta-btn{display:inline-block;background:linear-gradient(135deg,#1a1a5e,#16a34a);color:#fff!important;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:8px}.footer{background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}</style>
</head><body><div class="wrapper">
<div class="header"><h1>📋 Your Tracking ID is Ready!</h1></div>
<div class="body">
<p style="font-size:16px;font-weight:700;color:#1a1a5e;margin-bottom:10px">Hello ${customerName},</p>
<p style="font-size:14px;color:#4a5568;line-height:1.7;margin-bottom:16px">Your registration has been verified and your case is now progressing. Use the Tracking ID below to monitor your solar installation status.</p>
<div class="tracking-card"><div class="tracking-label">Your Tracking ID</div><div class="tracking-id">${trackingId}</div><p style="font-size:12px;color:#64748b;margin-top:6px">Keep this safe for future reference</p></div>
<div class="cta-wrap"><a href="${trackingUrl}" class="cta-btn">Track Installation Live</a></div>
<p style="font-size:13px;color:#4a5568;line-height:1.7">If you have questions, contact us at <strong>${companyEmail}</strong> and quote your Tracking ID.</p>
<p style="font-size:13px;color:#4a5568;margin-top:12px">Warm regards,<br/><strong style="color:#1a1a5e">${companyName} Team</strong></p>
</div>
<div class="footer">© ${new Date().getFullYear()} ${companyName}. This is an automated message.</div>
</div></body></html>`;

            const res = await fetch("https://api.brevo.com/v3/smtp/email", {
              method: "POST",
              headers: {
                "api-key": brevoApiKey,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                sender: { name: companyName, email: senderEmail },
                to: [{ email: customerEmail, name: customerName }],
                subject: `Your Tracking ID: ${trackingId} — ${companyName}`,
                htmlContent,
              }),
            });

            if (!res.ok) {
              const errText = await res.text();
              console.error(
                `[phone_verification] Brevo error for case ${caseObj.id}: ${errText}`,
              );
              await supabase.from("email_logs").insert({
                recipient_email: customerEmail,
                email_type: "tracking_id",
                status: "failed",
                error_message: errText,
                reference_id: trackingId,
              });
            } else {
              const result = await res.json();
              console.log(
                `[phone_verification] ✅ Tracking ID email sent for case ${caseObj.id}`,
              );
              await supabase.from("email_logs").insert({
                recipient_email: customerEmail,
                email_type: "tracking_id",
                status: "sent",
                message_id: result.messageId,
                reference_id: trackingId,
              });
            }
          } catch (emailErr: any) {
            console.error(
              `[phone_verification] Failed to send tracking ID email for case ${caseObj.id}:`,
              emailErr,
            );
            await supabase.from("email_logs").insert({
              recipient_email: customerEmail,
              email_type: "tracking_id",
              status: "failed",
              error_message: emailErr.message,
              reference_id: trackingId,
            });
          }
        };

        // Fire in background — non-blocking
        // @ts-ignore
        if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
          // @ts-ignore
          EdgeRuntime.waitUntil(sendTrackingIdEmail());
        } else {
          sendTrackingIdEmail();
        }
      }
      // ── END PHONE VERIFICATION TRIGGER ────────────────────────────────────

      return jsonResponse(updated);
    }

    // ── MARK / UNMARK DELAYED ─────────────────────────────────────────────
    if (action === "mark_delayed") {
      const { data: caseObj, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();
      if (error) return jsonResponse({ message: "Case not found" }, 404);

      let updatePayload: Record<string, unknown>;
      if (body.unmark) {
        updatePayload = {
          status: "In Progress",
          delay_reason: "",
          marked_delayed_by: "",
          marked_delayed_at: null,
        };
      } else {
        if (!body.reason?.trim())
          return jsonResponse({ message: "A delay reason is required." }, 400);
        updatePayload = {
          status: "Delayed",
          delay_reason: body.reason.trim(),
          marked_delayed_by: user.name,
          marked_delayed_at: new Date().toISOString(),
        };
      }

      const { data: updated, error: updateError } = await supabase
        .from("cases")
        .update(updatePayload)
        .eq("id", body.caseId)
        .select()
        .single();

      if (updateError) throw updateError;

      await supabase.from("case_history").insert({
        case_id: caseObj.id,
        stage: caseObj.current_stage,
        updated_by: user.name,
        action_type: body.unmark ? "delay_cleared" : "delay_flagged",
        remarks: body.unmark
          ? "Delay flag removed"
          : `Marked as Delayed: ${body.reason.trim()}`,
      });

      return jsonResponse(updated);
    }

    // ── ADD COMMENT ────────────────────────────────────────────────────────
    if (action === "add_comment") {
      if (!body.text?.trim())
        return jsonResponse({ message: "Comment text is required." }, 400);

      const insertPayload: Record<string, unknown> = {
        case_id: body.caseId,
        text: body.text.trim(),
        author: user.name,
        role: user.role,
        // New fields — both optional; defaults handled by migration column defaults
        comment_type: body.comment_type || "note",
        parent_id: body.parent_id || null,
      };

      const { data: comment, error } = await supabase
        .from("case_comments")
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(comment, 201);
    }

    // ── GET COMMENTS ───────────────────────────────────────────────────────
    if (action === "get_comments") {
      const { data, error } = await supabase
        .from("case_comments")
        .select("*")
        .eq("case_id", body.caseId) // Fixed: was filtering by id, now by case_id
        .order("created_at", { ascending: true }); // Oldest first so thread tree builds correctly
      if (error) throw error;
      return jsonResponse(data || []);
    }

    // ── LOG DOWNLOAD (audit trail for PDF downloads) ────────────────────────
    if (action === "log_download") {
      if (!body.caseId)
        return jsonResponse({ message: "caseId is required" }, 400);
      const { error } = await supabase.from("case_history").insert({
        case_id: body.caseId,
        stage: body.stage || "N/A",
        department: body.dept || user.role,
        updated_by: user.name,
        action_type: "download_details",
        remarks: `PDF case details downloaded by ${user.name} (${user.role})`,
      });
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    // ── UPDATE CASE DETAILS ────────────────────────────────────────────────
    if (action === "update_details") {
      const allowedFields: Record<string, string> = {
        loanAmount: "loan_amount",
        handoffNote: "handoff_note",
        assignedTo: "assigned_to",
        siteVisitDate: "site_visit_date",
        installationNote: "installation_note",
        subsidyRefNumber: "subsidy_ref_number",
        subsidyNote: "subsidy_note",
        documentStatuses: "document_statuses",
        // ── Verification fields ──────────────────────────────────────────────
        quotationVerified: "quotation_verified",
        quotationAmount: "quotation_amount",
        financeVerified: "finance_verified",
        accountsVerified: "accounts_verified",
        nedaRegistration: "neda_registration",
        pmsgRegistration: "pmsg_registration",
        vendorSelection: "vendor_selection",
      };

      const updatePayload: Record<string, unknown> = {};
      for (const [jsKey, dbKey] of Object.entries(allowedFields)) {
        if (body[jsKey] !== undefined) {
          if (body[jsKey] === "" && dbKey === "site_visit_date") {
            updatePayload[dbKey] = null;
          } else {
            updatePayload[dbKey] = body[jsKey];
          }
        }
      }

      // Fetch old case to detect changes for audit log
      const { data: oldCase } = await supabase
        .from("cases")
        .select("quotation_amount, current_stage")
        .eq("id", body.caseId)
        .single();

      const { data: updated, error } = await supabase
        .from("cases")
        .update(updatePayload)
        .eq("id", body.caseId)
        .select()
        .single();

      if (error) throw error;

      // ── Audit trail for Quotation Edit & Verification ──────────────────────
      if (
        updatePayload.quotation_amount !== undefined &&
        oldCase &&
        Number(oldCase.quotation_amount) !==
        Number(updatePayload.quotation_amount)
      ) {
        await supabase.from("case_history").insert({
          case_id: body.caseId,
          stage: updated.current_stage,
          department: "Registration",
          updated_by: user.name,
          action_type: "quotation_edit",
          remarks: `Quotation amount edited from ₹${oldCase.quotation_amount || 0} to ₹${updatePayload.quotation_amount}.`,
        });
      }

      if (updatePayload.quotation_verified === true) {
        await supabase.from("case_history").insert({
          case_id: body.caseId,
          stage: updated.current_stage,
          department: "Registration",
          updated_by: user.name,
          action_type: "quotation_verified",
          remarks: `Quotation amount of ₹${updatePayload.quotation_amount || updated.quotation_amount || 0} was verified.`,
        });
      }
      // ───────────────────────────────────────────────────────────────────────

      return jsonResponse(updated);
    }

    // ── UPDATE FINANCE ─────────────────────────────────────────────────────
    if (action === "update_finance") {
      if (user.role !== "admin" && user.role !== "banking") {
        return jsonResponse(
          {
            message:
              "Unauthorized: Only Banking & Finance or Admin can update finance details.",
          },
          403,
        );
      }

      const allowedFields: Record<string, string> = {
        paymentType: "payment_type",
        downPayment: "down_payment",
        cashAmount: "cash_amount",
        paymentMode: "payment_mode",
        loanAmount: "loan_amount",
        loanApprovedAmount: "loan_approved_amount",
        emiAmount: "emi_amount",
        bankName: "bank_name",
        bankVisitedDate: "bank_visited_date",
        financeFormStatus: "finance_form_status",
        financeFinalStatus: "finance_final_status",
        disbursementDetails: "disbursement_details",
        financeNotes: "finance_notes",
      };

      const updatePayload: Record<string, unknown> = {};
      for (const [jsKey, dbKey] of Object.entries(allowedFields)) {
        if (body[jsKey] !== undefined) {
          if (body[jsKey] === "") {
            if (dbKey === "bank_visited_date") {
              updatePayload[dbKey] = null;
            } else {
              updatePayload[dbKey] = [
                "down_payment",
                "cash_amount",
                "loan_amount",
                "emi_amount",
              ].includes(dbKey)
                ? 0
                : "";
            }
          } else if (dbKey === "payment_type") {
            updatePayload[dbKey] = String(body[jsKey]).toLowerCase();
          } else {
            updatePayload[dbKey] = [
              "down_payment",
              "cash_amount",
              "loan_amount",
              "emi_amount",
            ].includes(dbKey)
              ? Number(body[jsKey])
              : body[jsKey];
          }
        }
      }

      const pType = String(body.paymentType || "").toLowerCase();
      if (pType === "cash") {
        updatePayload.loan_amount = 0;
        updatePayload.emi_amount = 0;
        updatePayload.bank_name = "";
      } else if (pType === "loan") {
        updatePayload.cash_amount = 0;
        updatePayload.payment_mode = "";
      }

      const { data: updated, error } = await supabase
        .from("cases")
        .update(updatePayload)
        .eq("id", body.caseId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("case_history").insert({
        case_id: body.caseId,
        stage: updated.current_stage,
        updated_by: user.name,
        action_type: "finance_update",
        remarks: body.remarks || `Updated financial details.`,
      });

      return jsonResponse(updated);
    }

    // ── ADD PAYMENT ENTRY ──────────────────────────────────────────────────────
    if (action === "add_payment") {
      if (!["admin", "accounts", "banking"].includes(user.role)) {
        return jsonResponse({ message: "Unauthorized" }, 403);
      }
      const { caseId, paymentDate, amount, paymentType: pType, notes } = body;
      if (!caseId || !paymentDate || !amount) {
        return jsonResponse(
          { message: "caseId, paymentDate, and amount are required" },
          400,
        );
      }

      const { data: newPayment, error: pmtErr } = await supabase
        .from("payment_history")
        .insert({
          case_id: caseId,
          payment_date: paymentDate,
          amount: Number(amount),
          payment_type: pType || "installment",
          notes: notes || "",
          recorded_by: user.name,
        })
        .select()
        .single();

      if (pmtErr) throw pmtErr;

      await supabase.from("case_history").insert({
        case_id: caseId,
        updated_by: user.name,
        action_type: "payment_recorded",
        remarks: `Payment of ₹${Number(amount).toLocaleString("en-IN")} recorded (${pType || "installment"}) on ${paymentDate}.`,
      });

      return jsonResponse(newPayment);
    }

    // ── GET PAYMENTS ───────────────────────────────────────────────────────────
    if (action === "get_payments") {
      if (!body.caseId)
        return jsonResponse({ message: "caseId required" }, 400);

      const { data: payments, error: pmtErr } = await supabase
        .from("payment_history")
        .select("*")
        .eq("case_id", body.caseId)
        .order("payment_date", { ascending: true });

      if (pmtErr) throw pmtErr;
      return jsonResponse(payments || []);
    }

    // ── GET INVENTORY ───────────────────────────────────────────
    if (action === "get_inventory") {
      const { data: invData, error: invErr } = await supabase
        .from("inventory")
        .select("*")
        .order("name");
      if (invErr) throw invErr;

      // Also fetch quotation specs for the given case (to auto-populate dispatch)
      let quotationSpecs = null;
      const { caseId: qCaseId } = body;
      if (qCaseId) {
        const { data: caseRow } = await supabase
          .from("cases")
          .select("customer_name, system_specs")
          .or(`id.eq.${qCaseId},case_id.eq.${qCaseId}`)
          .maybeSingle();

        if (caseRow) {
          // Prefer system_specs if already filled
          const ss = caseRow.system_specs;
          if (ss && typeof ss === "object" && Object.keys(ss).length > 0) {
            quotationSpecs = ss;
          } else if (caseRow.customer_name) {
            // Fall back to quotations table (most recent quotation for this customer)
            const { data: quot } = await supabase
              .from("quotations")
              .select(
                "product_name, panel_count, panel_unit, inverter_brand, inverter_kw, battery_brand, battery_count, battery_capacity, structure, bos, product_category",
              )
              .ilike("customer_name", caseRow.customer_name)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (quot) {
              quotationSpecs = {
                productName: quot.product_name,
                productCategory: quot.product_category,
                panelCount: quot.panel_count,
                panelUnit: quot.panel_unit,
                inverterBrand: quot.inverter_brand,
                inverterKw: quot.inverter_kw,
                batteryBrand: quot.battery_brand,
                batteryCount: quot.battery_count,
                batteryCapacity: quot.battery_capacity,
                structure: quot.structure,
                bos: quot.bos,
              };
            }
          }
        }
      }

      return jsonResponse({ inventory: invData, quotationSpecs });
    }

    // ── DISPATCH MATERIALS ──────────────────────────────────────────────────
    if (action === "dispatch_materials") {
      if (
        user.role !== "admin" &&
        user.role !== "store" &&
        user.role !== "inventory"
      ) {
        return jsonResponse(
          {
            message:
              "Unauthorized: Only Store/Inventory or Admin can dispatch materials.",
          },
          403,
        );
      }

      const { caseId, items, vehicleNumber, driverName, notes } = body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return jsonResponse({ message: "No items to dispatch." }, 400);
      }

      for (const item of items) {
        const { data: invItem } = await supabase
          .from("inventory")
          .select("stock")
          .eq("id", item.id)
          .single();
        if (invItem) {
          const newStock = Math.max(0, invItem.stock - item.quantity);
          await supabase
            .from("inventory")
            .update({ stock: newStock })
            .eq("id", item.id);
        }
      }

      const { data: dispatchRecord, error: dispatchError } = await supabase
        .from("inventory_dispatches")
        .insert({
          case_id: caseId,
          dispatched_by: user.name,
          dispatched_by_role: user.role,
          status: "Dispatched",
          vehicle_number: vehicleNumber || "",
          driver_name: driverName || "",
          notes: notes || "",
          dispatched_items: items,
        })
        .select()
        .single();

      if (dispatchError) throw dispatchError;

      await supabase.from("case_history").insert({
        case_id: caseId,
        stage: "Sent to Store",
        updated_by: user.name,
        action_type: "dispatch",
        remarks: `Dispatched materials via vehicle ${vehicleNumber || "N/A"}.`,
      });

      return jsonResponse(dispatchRecord);
    }

    // ── ASSIGN CASE ────────────────────────────────────────────────────────
    if (action === "assign") {
      const { data: caseObj } = await supabase
        .from("cases")
        .select("id, current_stage")
        .eq("id", body.caseId)
        .single();
      if (!caseObj) return jsonResponse({ message: "Case not found." }, 404);

      const { data: updated, error } = await supabase
        .from("cases")
        .update({ assigned_to: body.assignedTo || "" })
        .eq("id", body.caseId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("case_history").insert({
        case_id: body.caseId,
        stage: caseObj.current_stage,
        updated_by: user.name,
        action_type: "assignment_changed",
        remarks: body.assignedTo
          ? `Case assigned to ${body.assignedTo}`
          : "Assignment removed",
      });

      return jsonResponse(updated);
    }

    // ── TOGGLE PRIORITY ────────────────────────────────────────────────────
    if (action === "toggle_priority") {
      const { data: caseObj } = await supabase
        .from("cases")
        .select("priority")
        .eq("id", body.caseId)
        .single();
      if (!caseObj) return jsonResponse({ message: "Case not found." }, 404);

      const newPriority = caseObj.priority === "urgent" ? "normal" : "urgent";
      await supabase
        .from("cases")
        .update({ priority: newPriority })
        .eq("id", body.caseId);
      return jsonResponse({ priority: newPriority });
    }

    // ── DELETE CASE ────────────────────────────────────────────────────────
    if (action === "delete") {
      const { data: caseObj } = await supabase
        .from("cases")
        .select("current_stage, created_by")
        .eq("id", body.caseId)
        .single();
      if (!caseObj) return jsonResponse({ message: "Case not found." }, 404);

      if (caseObj.current_stage !== "Registration Done") {
        return jsonResponse(
          {
            message: "Case can only be deleted at the Registration Done stage.",
          },
          403,
        );
      }

      const isAdmin = user.role === "admin";
      const isCreator = caseObj.created_by === user.id;
      if (!isAdmin && !isCreator) {
        return jsonResponse(
          {
            message: "Only the admin or the case creator can delete this case.",
          },
          403,
        );
      }

      await supabase.from("cases").delete().eq("id", body.caseId);
      await supabase.from("case_history").delete().eq("case_id", body.caseId);
      await supabase.from("case_comments").delete().eq("case_id", body.caseId);
      return jsonResponse({ message: "Case deleted." });
    }

    // ── TOGGLE CHECKLIST ──────────────────────────────────────────────────
    if (action === "toggle_checklist") {
      const { data: caseObj } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();
      if (!caseObj) return jsonResponse({ message: "Case not found." }, 404);

      const listName = body.listName;
      const itemId = body.itemId;
      const checklist = caseObj[listName] || [];
      const updatedList = checklist.map((item: any) =>
        item._id === itemId
          ? {
            ...item,
            checked: !item.checked,
            checkedBy: !item.checked ? user.name : null,
          }
          : item,
      );

      await supabase
        .from("cases")
        .update({ [listName]: updatedList })
        .eq("id", body.caseId);
      return jsonResponse(updatedList);
    }

    // ── SUBMIT CUSTOMER FEEDBACK (admin only) ──────────────────────────────
    if (action === "submit_feedback") {
      if (user.role !== "admin")
        return jsonResponse({ message: "Forbidden" }, 403);

      const {
        caseId,
        customerName,
        rating,
        feedback_text,
        installation_quality,
        team_behavior,
        timeline_satisfaction,
        submitted_by,
      } = body;

      if (!caseId) return jsonResponse({ message: "caseId required" }, 400);
      if (!rating || rating < 1 || rating > 5)
        return jsonResponse({ message: "rating must be 1-5" }, 400);

      const { data, error } = await supabase
        .from("customer_feedback")
        .insert({
          case_id: caseId,
          customer_name: customerName || "",
          rating: Number(rating),
          feedback_text: feedback_text || "",
          installation_quality: installation_quality
            ? Number(installation_quality)
            : null,
          team_behavior: team_behavior ? Number(team_behavior) : null,
          timeline_satisfaction: timeline_satisfaction
            ? Number(timeline_satisfaction)
            : null,
          submitted_by: submitted_by || "admin",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return jsonResponse(data);
    }

    // ── GET FEEDBACK FOR A CASE (admin only) ───────────────────────────────
    if (action === "get_feedback") {
      if (user.role !== "admin")
        return jsonResponse({ message: "Forbidden" }, 403);

      const { caseId } = body;
      if (!caseId) return jsonResponse({ message: "caseId required" }, 400);

      const { data, error } = await supabase
        .from("customer_feedback")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return jsonResponse(data || []);
    }

    // ── RESEND TRACKING ID (registration/admin fallback) ──────────────────
    if (action === "resend_tracking_id") {
      if (user.role !== "admin" && user.role !== "registration") {
        return jsonResponse(
          {
            message:
              "Unauthorized: Only Registration or Admin can resend tracking ID.",
          },
          403,
        );
      }

      const { data: caseObj, error: caseErr } = await supabase
        .from("cases")
        .select("*")
        .eq("id", body.caseId)
        .single();
      if (caseErr || !caseObj)
        return jsonResponse({ message: "Case not found" }, 404);

      const brevoApiKey = Deno.env.get("BREVO_API_KEY");
      const senderEmail = Deno.env.get("GMAIL_EMAIL");
      const customerEmail = caseObj.email || "";
      const companyName = Deno.env.get("COMPANY_NAME") || "RBSC Solar";
      const companyEmail =
        Deno.env.get("COMPANY_EMAIL") || "info@rbscsolar.com";
      const companyWebsite =
        Deno.env.get("COMPANY_WEBSITE") || "www.rbscsolar.com";

      const trackingId = caseObj.system_specs?.tracking_id || caseObj.id;
      const customerName = caseObj.customer_name || "Customer";
      const trackingUrl = `https://rbscsolarcrm.probfixora.co.in/track?id=${encodeURIComponent(trackingId)}`;

      if (!brevoApiKey || !senderEmail || !customerEmail) {
        // Log the resend attempt even if email can't be sent
        await supabase.from("case_history").insert({
          case_id: body.caseId,
          stage: caseObj.current_stage,
          department: "Registration",
          updated_by: user.name,
          action_type: "tracking_id_resent",
          remarks: `Manual resend attempted by ${user.name} — email not configured or no customer email on file.`,
        });
        return jsonResponse(
          {
            message:
              "Email config missing or no customer email — resend logged but not sent.",
          },
          200,
        );
      }

      const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<title>Your Tracking ID — ${companyName}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;background:#f0f4f8;color:#1a202c}.wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)}.header{background:linear-gradient(135deg,#1a1a5e 0%,#16a34a 100%);padding:28px 40px;text-align:center}.header h1{color:#fff;font-size:20px;font-weight:700}.body{padding:32px 40px}.tracking-card{background:linear-gradient(135deg,#eef2ff,#ecfdf5);border:1.5px solid #c7d2fe;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center}.tracking-label{font-size:12px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}.tracking-id{font-size:28px;font-weight:700;color:#1a1a5e;letter-spacing:2px;font-family:monospace}.cta-wrap{text-align:center;margin:20px 0}.cta-btn{display:inline-block;background:linear-gradient(135deg,#1a1a5e,#16a34a);color:#fff!important;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:8px}.footer{background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}</style>
</head><body><div class="wrapper">
<div class="header"><h1>📋 Tracking ID Reminder</h1></div>
<div class="body">
<p style="font-size:16px;font-weight:700;color:#1a1a5e;margin-bottom:10px">Hello ${customerName},</p>
<p style="font-size:14px;color:#4a5568;line-height:1.7;margin-bottom:16px">This is a reminder of your solar installation Tracking ID. Use it to monitor your case progress at any time.</p>
<div class="tracking-card"><div class="tracking-label">Your Tracking ID</div><div class="tracking-id">${trackingId}</div><p style="font-size:12px;color:#64748b;margin-top:6px">Keep this safe for future reference</p></div>
<div class="cta-wrap"><a href="${trackingUrl}" class="cta-btn">Track Installation Live</a></div>
<p style="font-size:13px;color:#4a5568">Questions? Contact <strong>${companyEmail}</strong></p>
<p style="font-size:13px;color:#4a5568;margin-top:12px">Warm regards,<br/><strong style="color:#1a1a5e">${companyName} Team</strong></p>
</div>
<div class="footer">© ${new Date().getFullYear()} ${companyName}. Sent by ${user.name}.</div>
</div></body></html>`;

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: companyName, email: senderEmail },
          to: [{ email: customerEmail, name: customerName }],
          subject: `[Reminder] Your Tracking ID: ${trackingId} — ${companyName}`,
          htmlContent,
        }),
      });

      const emailOk = res.ok;
      await supabase.from("case_history").insert({
        case_id: body.caseId,
        stage: caseObj.current_stage,
        department: "Registration",
        updated_by: user.name,
        action_type: "tracking_id_resent",
        remarks: emailOk
          ? `Tracking ID ${trackingId} manually resent to ${customerEmail} by ${user.name}.`
          : `Resend attempted by ${user.name} — email gateway error.`,
      });

      if (!emailOk) {
        const errText = await res.text();
        console.error(`[resend_tracking_id] Brevo error: ${errText}`);
        return jsonResponse(
          { message: "Email gateway error — resend logged." },
          200,
        );
      }

      return jsonResponse({
        ok: true,
        message: `Tracking ID resent to ${customerEmail}`,
      });
    }

    // ── UPDATE DISPATCH PHASE (Two-Phase Installation) ───────────────────────
    if (action === "update_dispatch_phase") {
      const { caseId: dpCaseId, phase, photoUrl, notes } = body;
      if (!dpCaseId || !phase || !photoUrl) {
        return jsonResponse({ message: "caseId, phase, and photoUrl are required" }, 400);
      }
      if (![1, 2].includes(Number(phase))) {
        return jsonResponse({ message: "phase must be 1 or 2" }, 400);
      }

      const phaseNum = Number(phase);
      const updateFields: Record<string, unknown> = {};

      if (phaseNum === 1) {
        updateFields.phase1_photo_url = photoUrl;
        updateFields.phase1_completed_at = new Date().toISOString();
        updateFields.phase1_notes = notes || "";
        updateFields.dispatch_phase = 1;
      } else {
        // Phase 2 requires Phase 1 to be complete
        const { data: existingCase } = await supabase
          .from("cases")
          .select("dispatch_phase, customer_name, phone, case_id")
          .or(`id.eq.${dpCaseId},case_id.eq.${dpCaseId}`)
          .maybeSingle();

        if (!existingCase || (existingCase.dispatch_phase || 0) < 1) {
          return jsonResponse({ message: "Phase 1 must be completed before Phase 2" }, 400);
        }
        updateFields.phase2_photo_url = photoUrl;
        updateFields.phase2_completed_at = new Date().toISOString();
        updateFields.phase2_notes = notes || "";
        updateFields.dispatch_phase = 2;
      }

      const { error: phaseUpdateErr } = await supabase
        .from("cases")
        .update(updateFields)
        .or(`id.eq.${dpCaseId},case_id.eq.${dpCaseId}`);

      if (phaseUpdateErr) throw phaseUpdateErr;

      await supabase.from("case_history").insert({
        case_id: dpCaseId,
        updated_by: user.name,
        action_type: `phase${phaseNum}_complete`,
        remarks: `Phase ${phaseNum} installation completed by ${user.name}. Photo uploaded.${notes ? " Notes: " + notes : ""}`,
      });

      return jsonResponse({ ok: true, message: `Phase ${phaseNum} marked complete` });
    }

    return jsonResponse({ message: "Unknown action" }, 400);

  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : (err as any).message || "Internal error";
    const status =
      message.includes("Unauthorized") || message.includes("inactive")
        ? 401
        : 500;
    return jsonResponse({ message, details: err }, status);
  }
});

// ─── JSON response helper ──────────────────────────────────────────────────────
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
