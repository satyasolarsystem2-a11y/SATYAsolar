// supabase/functions/admin/index.ts
// Admin-only operations: create user, list users, update user, delete user, reset password
// Replaces Express authController.js + userController.js (admin routes)
// Deploy: supabase functions deploy admin

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;
import { logoBase64 } from "../quotation/logoBase64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

async function getAdminUser(
  req: Request,
  supabase: ReturnType<typeof createClient>,
) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, status, is_head")
    .eq("id", user.id)
    .single();
  if (!profile || profile.status === "inactive")
    throw new Error("Unauthorized");
  if (profile.role?.toLowerCase() !== "admin" && !profile.is_head)
    throw new Error("Admin or Department Head access required");
  return { ...user, name: profile.name, role: profile.role?.toLowerCase(), is_head: profile.is_head };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  // Admin client — uses service role, bypasses RLS
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const action = body.action || "";

    // ── SELF-SERVICE ACTIONS (no admin required) ──────────────────────────
    // These actions are available to ALL authenticated users (employees, etc.)
    const selfServiceActions = ["get_own_details", "update_own_details", "complete_first_login", "update_own_name"];
    if (selfServiceActions.includes(action)) {
      const authHeader = req.headers.get("Authorization");
      const token = (authHeader || "").replace("Bearer ", "");
      const { data: { user }, error: authErr } = await supabaseServiceRole.auth.getUser(token);
      if (authErr || !user) return jsonResponse({ message: "Unauthorized" }, 401);

      if (action === "get_own_details") {
        const { data: profile, error } = await supabaseServiceRole
          .from("profiles")
          .select("id, name, role, phone, dob, designation, status, is_head, employee_id, city, state, country, address, gender, emergency_contact_name, emergency_contact_phone, bank_name, branch_name, account_number, ifsc_code, experience_years, company_name, work_location, last_ctc, aadhar_card, pan_card, created_at")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        return jsonResponse({ ...profile, email: user.email || "" });
      }

      if (action === "update_own_details") {
        const fields = { ...body };
        delete fields.action;
        const allowed = [
          "name", "phone", "dob", "gender", "city", "state", "country",
          "address", "emergency_contact_name", "emergency_contact_phone",
          "bank_name", "branch_name", "account_number", "ifsc_code",
          "experience_years", "company_name", "work_location", "last_ctc", "aadhar_card", "pan_card",
        ];
        const updatePayload: Record<string, unknown> = {};
        for (const key of allowed) {
          if (fields[key] !== undefined) updatePayload[key] = fields[key];
        }
        if (Object.keys(updatePayload).length === 0) return jsonResponse({ message: "No fields to update" }, 400);
        const { error } = await supabaseServiceRole.from("profiles").update(updatePayload).eq("id", user.id);
        if (error) throw error;
        if (updatePayload.name) {
          await supabaseServiceRole.auth.admin.updateUserById(user.id, { user_metadata: { name: updatePayload.name } });
        }
        return jsonResponse({ message: "Profile updated successfully" });
      }

      if (action === "update_own_name") {
        const { name } = body;
        if (!name || !name.trim()) return jsonResponse({ message: "Name cannot be empty" }, 400);
        const { error } = await supabaseServiceRole.from("profiles").update({ name: name.trim() }).eq("id", user.id);
        if (error) throw error;
        return jsonResponse({ message: "Name updated successfully" });
      }

      if (action === "complete_first_login") {
        await supabaseServiceRole.from("profiles").update({ is_first_login: false }).eq("id", user.id);
        return jsonResponse({ message: "First login marked complete" });
      }
    }

    // ── ADMIN/HEAD ACTIONS ────────────────────────────────────────────────
    const supabase = supabaseServiceRole; // reuse
    const adminUser = await getAdminUser(req, supabase);

    // ── CREATE USER ────────────────────────────────────────────────────────
    if (action === "create_user") {
      const { name, email, role, phone, dob, isHead } = body;

      // Validation
      if (!name || !email || !role) {
        return jsonResponse(
          { message: "Name, email, and role are required" },
          400,
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return jsonResponse({ message: "Invalid email format" }, 400);
      }

      const validRoles = [
        "admin",
        "sales",
        "registration",
        "finance",        // replaces banking + accounts
        "project",        // replaces field_installation + technical + electrical
        "warehouse",      // replaces inventory + procurement
        "net_metering",   // new
        "quality",        // new (QA)
        "subsidy",
        "customer_service",
        // Legacy roles — kept for backward compatibility
        "banking",
        "accounts",
        "inventory",
        "procurement",
        "field_installation",
        "electrical",
        "technical",
        "operations"
      ];
      if (!validRoles.includes(role)) {
        return jsonResponse({ message: `Invalid role: ${role}` }, 400);
      }

      // Department Head restrictions
      if (adminUser.role !== "admin") {
        if (adminUser.role !== role) {
          return jsonResponse({ message: "You can only create users in your own department" }, 403);
        }
        if (isHead) {
          return jsonResponse({ message: "You cannot create a Department Head" }, 403);
        }
      }

      // Generate default password and Employee ID
      const password = Deno.env.get("DEFAULT_PASSWORD") || "Satyasolar@1234";
      const employeeId = "EMP-" + Math.floor(1000 + Math.random() * 9000);

      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password,
          user_metadata: { name, role },
          email_confirm: true, // skip email verification for internal tool
        });

      if (authError) {
        if (
          authError.message.includes("already registered") ||
          authError.message.includes("already exists")
        ) {
          return jsonResponse(
            { message: "An employee with this email already exists" },
            400,
          );
        }
        throw authError;
      }

      // Create profile row (using upsert because auth trigger might create a stub)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        name,
        role,
        phone,
        dob,
        designation: body.designation || "",
        is_head: isHead || false,
        status: "active",
        is_first_login: true,
        employee_id: employeeId,
      });

      if (profileError) {
        // Cleanup the auth user since profile creation failed
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // Send professional onboarding email via Brevo HTTP API
      try {
        const brevoApiKey = Deno.env.get("BREVO_API_KEY");
        const gmailEmail = Deno.env.get("GMAIL_EMAIL");

        if (!brevoApiKey || !gmailEmail) {
          console.error(
            "BREVO_API_KEY or GMAIL_EMAIL not set. Cannot send onboarding email.",
          );
        } else {
          const joinedDate = new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
          const portalUrl =
            Deno.env.get("FRONTEND_URL") ||
            "https://rbscsolarcrm.probfixora.co.in";
          const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to ${Deno.env.get("COMPANY_NAME") || "RBSC Solar"}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;background:#f0f4f8;color:#1a202c}
    .wrapper{max-width:620px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)}
    .header{background:linear-gradient(135deg,#1a1a5e 0%,#2563eb 100%);padding:28px 40px 24px;text-align:center}
    .header-logo{display:block;margin:0 auto 12px;max-height:60px;width:auto}
    .header h1{color:#fff;font-size:20px;font-weight:700;margin:0;letter-spacing:0.3px}
    .header p{color:rgba(255,255,255,0.80);font-size:13px;margin-top:4px}
    .divider-bar{height:4px;background:linear-gradient(90deg,#1a1a5e,#2563eb)}
    .body{padding:36px 40px}
    .greeting{font-size:18px;font-weight:700;color:#1a1a5e;margin-bottom:10px}
    .intro{font-size:14px;color:#4a5568;line-height:1.7;margin-bottom:24px}
    .credentials{background:#f8faff;border:1.5px solid #c7d2fe;border-radius:10px;padding:0;margin-bottom:24px;overflow:hidden}
    .credentials-title{background:#1a1a5e;color:#fff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:10px 20px}
    .credentials table{width:100%;border-collapse:collapse;font-size:13px}
    .credentials td{padding:12px 20px;border-bottom:1px solid #e2e8f0;color:#374151}
    .credentials tr:last-child td{border-bottom:none}
    .credentials td:first-child{font-weight:600;color:#1a1a5e;width:40%;background:#f1f5fb}
    .password-note{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;font-size:13px;color:#78350f;margin-bottom:24px;line-height:1.6}
    .cta-wrap{text-align:center;margin-bottom:28px}
    .cta-btn{display:inline-block;background:#2563eb;color:#ffffff !important;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:8px;letter-spacing:0.3px}
    .sign{font-size:13px;color:#4a5568;line-height:1.7}
    .footer{background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0}
    .footer-logo{font-size:15px;font-weight:700;color:#1a1a5e;margin-bottom:4px}
    .footer-logo span{color:#2563eb}
    @media (prefers-color-scheme: dark) {
      body { background: #121212 !important; color: #f1f5f9 !important; }
      .wrapper { background: #1e1e1e !important; box-shadow: none !important; }
      .body { background: #1e1e1e !important; }
      .greeting { color: #ffffff !important; }
      .intro { color: #cbd5e1 !important; }
      .credentials { background: #2d2d2d !important; border-color: #475569 !important; }
      .credentials-title { background: #0f172a !important; color: #ffffff !important; }
      .credentials td { border-bottom-color: #333333 !important; color: #e2e8f0 !important; }
      .credentials td:first-child { background: #252525 !important; color: #93c5fd !important; }
      .password-note { background: #451a03 !important; border-color: #78350f !important; color: #fef3c7 !important; }
      .sign { color: #cbd5e1 !important; }
      .footer { background: #121212 !important; border-top-color: #333333 !important; }
      .footer-logo { color: #ffffff !important; }
      .footer p { color: #94a3b8 !important; }
    }
    .footer p{font-size:11px;color:#94a3b8;line-height:1.6;margin-top:4px}
    .footer a{color:#4f46e5;text-decoration:none}
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <img src="${portalUrl}/logo.png" alt="${Deno.env.get("COMPANY_NAME") || "RBSC Solar"}" class="header-logo"/>
    <h1>Welcome to ${Deno.env.get("COMPANY_NAME") || "RBSC Solar"}</h1>
    <p>Your employee account is ready</p>
  </div>
  <div class="divider-bar"></div>
  <div class="body">
    <div class="greeting">Dear ${name},</div>
    <p class="intro">
      Congratulations and welcome aboard! Your ${Deno.env.get("COMPANY_NAME") || "RBSC Solar"} employee account has been successfully created.
      Please find your login credentials below. You will be prompted to change your password on first login.
    </p>
    <div class="credentials">
      <div class="credentials-title">Account Credentials</div>
      <table>
        <tr><td>Employee ID</td><td>${employeeId}</td></tr>
        <tr><td>Email Address</td><td>${email.toLowerCase().trim()}</td></tr>
        <tr><td>Temporary Password</td><td style="font-family:monospace;font-weight:700;color:#1a1a5e">${password}</td></tr>
        <tr><td>Assigned Role</td><td>${role.charAt(0).toUpperCase() + role.slice(1)}</td></tr>
        <tr><td>Joined On</td><td>${joinedDate}</td></tr>
      </table>
    </div>
    <div class="password-note">
      <strong>Security Notice:</strong> The temporary password above must be changed after your first login.
      Do not share your credentials with anyone.
    </div>
    <div class="cta-wrap">
      <a href="${portalUrl}" class="cta-btn" target="_blank" style="color: #ffffff !important; text-decoration: none; background-color: #2563eb;">Login to CRM Portal</a>
    </div>
    <p class="sign">
      Warm regards,<br/>
      <strong style="color:#1a1a5e">${Deno.env.get("COMPANY_NAME") || "RBSC Solar"} — Admin Team</strong><br/>
      <span style="font-size:12px;color:#94a3b8">Lucknow, Uttar Pradesh, India</span>
    </p>
  </div>
  <div class="footer">
    <div class="footer-logo">${Deno.env.get("COMPANY_NAME_PRIMARY") || "RBSC"} <span>${Deno.env.get("COMPANY_NAME_SECONDARY") || "Solar"}</span></div>
    <p>
      &copy; ${new Date().getFullYear()} ${Deno.env.get("COMPANY_NAME") || "RBSC Associates"}. All rights reserved.<br/>
      <a href="https://${Deno.env.get("COMPANY_WEBSITE") || "rbscsolar.com"}">${Deno.env.get("COMPANY_WEBSITE") || "rbscsolar.com"}</a> &nbsp;|&nbsp;
      <a href="mailto:${Deno.env.get("COMPANY_EMAIL") || "info@rbscsolar.com"}">${Deno.env.get("COMPANY_EMAIL") || "info@rbscsolar.com"}</a>
    </p>
    <p style="margin-top:8px;color:#cbd5e1;font-size:10px">This is an automated message. Please do not reply.</p>
  </div>
</div>
</body>
</html>`;

          const payload = {
            sender: {
              name: `${Deno.env.get("COMPANY_NAME") || "RBSC Solar"}`,
              email: gmailEmail,
            },
            to: [{ email: email.toLowerCase().trim() }],
            subject: `Welcome to ${Deno.env.get("COMPANY_NAME") || "RBSC Solar"} – Your Employee Account is Ready`,
            htmlContent: html,
          };

          const res = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "api-key": brevoApiKey,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorData = await res.text();
            console.error(`Brevo API error: ${errorData}`);
          } else {
            const result = await res.json();
            console.log(
              `✅ Onboarding email sent via Brevo to ${email}, Message ID: ${result.messageId}`,
            );
          }
        }
      } catch (err) {
        console.error("Failed to send onboarding email:", err);
      }

      return jsonResponse(
        {
          message: "User created successfully",
          user: {
            id: authData.user.id,
            name,
            email: authData.user.email,
            role,
            phone,
            dob,
            isHead: isHead || false,
            status: "active",
            isFirstLogin: true,
            employeeId,
          },
        },
        201,
      );
    }

    // ── LIST ALL USERS ─────────────────────────────────────────────────────
    if (action === "list_users") {
      // Get from profiles (has role + status + employee_id + phone + dob + is_head)
      let query = supabase
        .from("profiles")
        .select(
          "id, name, role, phone, dob, status, is_first_login, created_at, employee_id, is_head, designation, suspended_from, suspended_until",
        );
      
      // If Department Head, only show their own department
      if (adminUser.role !== "admin") {
        query = query.eq("role", adminUser.role);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      const profileMap = new Map();
      for (const p of profiles) profileMap.set(p.id, p);

      // Get emails from auth admin
      const {
        data: { users: authUsers },
      } = await supabase.auth.admin.listUsers();

      const users = authUsers
        .filter((u: any) => profileMap.has(u.id))
        .map((u: any) => {
        const p = profileMap.get(u.id);
        return {
          id: u.id,
          name: p?.name || "Incomplete Account",
          email: u.email || "",
          role: p?.role || "sales",
          phone: p?.phone || "",
          dob: p?.dob || "",
          designation: p?.designation || "",
          isHead: p?.is_head || false,
          status: p?.status || "inactive",
          suspendedFrom: p?.suspended_from || null,
          suspendedUntil: p?.suspended_until || null,
          isFirstLogin: p?.is_first_login ?? true,
          createdAt: u.created_at,
          employeeId: p?.employee_id || "N/A",
        };
      });

      return jsonResponse(users);
    }

    // ── UPDATE USER ────────────────────────────────────────────────────────
    if (action === "update_user") {
      const { userId, name, role, status, designation } = body;
      if (!userId) return jsonResponse({ message: "userId required" }, 400);

      // Department Head restrictions
      if (adminUser.role !== "admin") {
        const { data: targetProfile } = await supabase.from("profiles").select("role, is_head").eq("id", userId).single();
        if (!targetProfile || targetProfile.role !== adminUser.role) {
          return jsonResponse({ message: "You can only update users in your own department" }, 403);
        }
        if (targetProfile.is_head && (role || status)) {
          return jsonResponse({ message: "You cannot update another Department Head" }, 403);
        }
      }

      const updatePayload: Record<string, unknown> = {};
      if (name !== undefined) updatePayload.name = name;
      if (role !== undefined) updatePayload.role = role;
      if (status !== undefined) updatePayload.status = status;
      if (designation !== undefined) updatePayload.designation = designation;

      const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId);

      if (error) throw error;

      // Also update auth user metadata if role/name changed
      if (name || role) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { name, role },
        });
      }

      return jsonResponse({ message: "User updated successfully" });
    }

    // ── UPDATE USER STATUS ──────────────────────────────────────────────────
    if (action === "update_user_status") {
      const { userId, status, suspendEndDate, suspendStartDate } = body;
      if (!userId || !status) return jsonResponse({ message: "userId and status required" }, 400);

      const { data: targetProfile } = await supabase.from("profiles").select("role, is_head").eq("id", userId).single();

      if (adminUser.role !== "admin") {
        if (!targetProfile || targetProfile.role !== adminUser.role) {
          return jsonResponse({ message: "You can only update status of users in your own department" }, 403);
        }
        if (targetProfile.is_head) {
          return jsonResponse({ message: "You cannot change status of another Department Head" }, 403);
        }
      } else {
        // Admin user restrictions: cannot update another admin's status
        if (targetProfile && targetProfile.role === "admin" && userId !== adminUser.id) {
          return jsonResponse({ message: "You cannot change the status of another Admin" }, 403);
        }
      }

      let ban_duration = "none";
      let suspended_until = null;
      let suspended_from = null;

      if (status === "inactive" || status === "suspended") {
        if (!suspendEndDate) return jsonResponse({ message: "endDate is required" }, 400);
        
        const suspendEnd = new Date(suspendEndDate);
        if (isNaN(suspendEnd.getTime())) return jsonResponse({ message: "Invalid suspendEndDate format" }, 400);

        const suspendStart = suspendStartDate ? new Date(suspendStartDate) : new Date();
        if (isNaN(suspendStart.getTime())) return jsonResponse({ message: "Invalid suspendStartDate format" }, 400);

        const now = new Date();
        if (suspendEnd.getTime() <= suspendStart.getTime()) {
          return jsonResponse({ message: "Suspend end date must be after start date" }, 400);
        }

        suspended_until = suspendEnd.toISOString();
        suspended_from = suspendStart.toISOString();

        // Only ban immediately if the suspension start date is today or in the past
        if (suspendStart.getTime() <= now.getTime() && suspendEnd.getTime() > now.getTime()) {
          const diffMs = suspendEnd.getTime() - now.getTime();
          const hours = Math.ceil(diffMs / (1000 * 60 * 60));
          ban_duration = `${hours}h`;
        }
      } else if (status === "terminate" || status === "resigned") {
        // Terminate/Resign: also permanently block login
        ban_duration = "876000h";
      } else if (status !== "active") {
        return jsonResponse({ message: "Invalid status" }, 400);
      }

      // 1. Update the auth.users ban_duration natively
      const { error: banError } = await supabase.auth.admin.updateUserById(userId, { ban_duration });
      if (banError) throw banError;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ status, suspended_until, suspended_from })
        .eq("id", userId);

      if (profileError) throw profileError;

      return jsonResponse({ message: "User status updated successfully" });
    }

    // ── DELETE USER ────────────────────────────────────────────────────────
    if (action === "delete_user") {
      const { userId } = body;
      if (!userId) return jsonResponse({ message: "userId required" }, 400);

      const { data: targetProfile } = await supabase.from("profiles").select("role, is_head").eq("id", userId).single();

      // Department Head restrictions
      if (adminUser.role !== "admin") {
        if (!targetProfile || targetProfile.role !== adminUser.role) {
          return jsonResponse({ message: "You can only delete users in your own department" }, 403);
        }
        if (targetProfile.is_head) {
          return jsonResponse({ message: "You cannot delete another Department Head" }, 403);
        }
      } else {
        if (targetProfile && targetProfile.role === "admin") {
          return jsonResponse({ message: "You cannot delete an Admin" }, 403);
        }
      }

      // Delete profile first
      await supabase.from("profiles").delete().eq("id", userId);

      // Delete auth user
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      return jsonResponse({ message: "User deleted" });
    }

    // ── RESET PASSWORD ─────────────────────────────────────────────────────
    if (action === "reset_password") {
      const { userId, newPassword } = body;
      if (!userId || !newPassword)
        return jsonResponse(
          { message: "userId and newPassword required" },
          400,
        );

      // Department Head restrictions
      if (adminUser.role !== "admin") {
        const { data: targetProfile } = await supabase.from("profiles").select("role, is_head").eq("id", userId).single();
        if (!targetProfile || targetProfile.role !== adminUser.role) {
          return jsonResponse({ message: "You can only reset passwords for users in your own department" }, 403);
        }
        if (targetProfile.is_head) {
          return jsonResponse({ message: "You cannot reset the password of another Department Head" }, 403);
        }
      }

      if (newPassword.length < 6) {
        return jsonResponse(
          { message: "Password must be at least 6 characters" },
          400,
        );
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (error) throw error;

      // Mark first login again if resetting
      await supabase
        .from("profiles")
        .update({ is_first_login: true })
        .eq("id", userId);

      return jsonResponse({ message: "Password reset successfully" });
    }

    // ── MARK FIRST LOGIN COMPLETE ──────────────────────────────────────────
    if (action === "complete_first_login") {
      const authHeader = req.headers.get("Authorization");
      const token = (authHeader || "").replace("Bearer ", "");
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (!user) return jsonResponse({ message: "Unauthorized" }, 401);

      await supabase
        .from("profiles")
        .update({ is_first_login: false })
        .eq("id", user.id);
      return jsonResponse({ message: "First login marked complete" });
    }

    // ── UPDATE OWN NAME (any authenticated user) ───────────────────────────
    if (action === "update_own_name") {
      const authHeader = req.headers.get("Authorization");
      const token = (authHeader || "").replace("Bearer ", "");
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser(token);
      if (authErr || !user)
        return jsonResponse({ message: "Unauthorized" }, 401);

      const { name } = body;
      if (!name || !name.trim())
        return jsonResponse({ message: "Name cannot be empty" }, 400);

      const { error } = await supabase
        .from("profiles")
        .update({ name: name.trim() })
        .eq("id", user.id);

      if (error) throw error;

      return jsonResponse({ message: "Name updated successfully" });
    }

    // ── GET EMPLOYEE DETAILS ─────────────────────────────────────────────
    if (action === "get_employee_details") {
      const { userId } = body;
      if (!userId) return jsonResponse({ message: "userId required" }, 400);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, name, role, phone, dob, designation, status, is_head, employee_id, city, state, country, address, gender, emergency_contact_name, emergency_contact_phone, bank_name, branch_name, account_number, ifsc_code, experience_years, company_name, work_location, last_ctc, aadhar_card, pan_card, created_at")
        .eq("id", userId)
        .single();
      if (error) throw error;

      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
      const authUser = authUsers.find((u: any) => u.id === userId);

      return jsonResponse({ ...profile, email: authUser?.email || "" });
    }

    // ── UPDATE EMPLOYEE DETAILS (admin edits any employee) ───────────────
    if (action === "update_employee_details") {
      const { userId, ...fields } = body;
      if (!userId) return jsonResponse({ message: "userId required" }, 400);

      // Department Head restrictions
      if (adminUser.role !== "admin") {
        const { data: targetProfile } = await supabase.from("profiles").select("role, is_head").eq("id", userId).single();
        if (!targetProfile || targetProfile.role !== adminUser.role) {
          return jsonResponse({ message: "You can only edit users in your own department" }, 403);
        }
        if (targetProfile.is_head) {
          return jsonResponse({ message: "You cannot edit another Department Head" }, 403);
        }
      }

      const allowed = [
        "name", "phone", "dob", "gender", "designation", "city", "state", "country",
        "address", "emergency_contact_name", "emergency_contact_phone",
        "bank_name", "branch_name", "account_number", "ifsc_code",
        "experience_years", "company_name", "work_location", "last_ctc", "aadhar_card", "pan_card",
      ];

      const updatePayload: Record<string, unknown> = {};
      for (const key of allowed) {
        if (fields[key] !== undefined) updatePayload[key] = fields[key];
      }

      if (Object.keys(updatePayload).length === 0) return jsonResponse({ message: "No fields to update" }, 400);

      const { error } = await supabase.from("profiles").update(updatePayload).eq("id", userId);
      if (error) throw error;

      if (updatePayload.name) {
        await supabase.auth.admin.updateUserById(userId, { user_metadata: { name: updatePayload.name } });
      }

      return jsonResponse({ message: "Employee details updated successfully" });
    }

    // ── UPDATE OWN DETAILS (any authenticated user edits their own profile) ─
    if (action === "update_own_details") {
      const authHeader = req.headers.get("Authorization");
      const token = (authHeader || "").replace("Bearer ", "");
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) return jsonResponse({ message: "Unauthorized" }, 401);

      const { ...fields } = body;
      delete fields.action;

      // Employees cannot change their role, designation, or status
      const allowed = [
        "name", "phone", "dob", "gender", "city", "state", "country",
        "address", "emergency_contact_name", "emergency_contact_phone",
        "bank_name", "branch_name", "account_number", "ifsc_code",
        "experience_years", "company_name", "work_location", "last_ctc", "aadhar_card", "pan_card",
      ];

      const updatePayload: Record<string, unknown> = {};
      for (const key of allowed) {
        if (fields[key] !== undefined) updatePayload[key] = fields[key];
      }

      if (Object.keys(updatePayload).length === 0) return jsonResponse({ message: "No fields to update" }, 400);

      const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);
      if (error) throw error;

      if (updatePayload.name) {
        localStorage && null; // just ignore, server side
        await supabase.auth.admin.updateUserById(user.id, { user_metadata: { name: updatePayload.name } });
      }

      return jsonResponse({ message: "Profile updated successfully" });
    }

    // ── GET OWN DETAILS (any authenticated user) ─────────────────────────
    if (action === "get_own_details") {
      const authHeader = req.headers.get("Authorization");
      const token = (authHeader || "").replace("Bearer ", "");
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) return jsonResponse({ message: "Unauthorized" }, 401);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, name, role, phone, dob, designation, status, is_head, employee_id, city, state, country, address, gender, emergency_contact_name, emergency_contact_phone, bank_name, branch_name, account_number, ifsc_code, experience_years, company_name, work_location, last_ctc, aadhar_card, pan_card, created_at")
        .eq("id", user.id)
        .single();
      if (error) throw error;

      return jsonResponse({ ...profile, email: user.email || "" });
    }

    return jsonResponse({ message: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : (err as any).message || "Internal error";
    console.error("Admin function error:", err);
    const status =
      message.includes("Unauthorized") || message.includes("Admin") ? 403 : 500;
    return jsonResponse({ message }, status);
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
