import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  CheckCircle,
  UploadCloud,
  Sun,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { APP_CONFIG } from "../config";

/**
 * CustomerPortal — Public page accessible via:
 *   /customer-portal?token=<secure-token>
 *
 * No login required. Validates token from DB,
 * shows quotation summary, and allows customer to Approve / Decline.
 * After approval, shows document upload section.
 */
export default function CustomerPortal() {
  const [stage, setStage] = useState("loading"); // loading | invalid | pending | approved | declined | uploaded
  const [token, setToken] = useState("");
  const [caseData, setCaseData] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState({});
  const [uploadDone, setUploadDone] = useState(false);

  // Required documents — determined by quotation system size
  const REQUIRED_DOCS = [
    "Electricity Bill (Last 2 Months)",
    "Aadhar Card (Electricity Bill Owner)",
    "PAN Card",
    "Bank Details (Cancelled Cheque)",
    "Property Proof (House Tax / Registry)",
    "Site Photos",
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setStage("invalid");
      return;
    }
    setToken(t);
    validateToken(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validateToken = async (t) => {
    try {
      const { data: tokenRow, error: tokenErr } = await supabase
        .from("customer_portal_tokens")
        .select("*")
        .eq("token", t)
        .single();

      if (tokenErr || !tokenRow) {
        setStage("invalid");
        return;
      }

      // Expiration check removed per request

      setTokenData(tokenRow);

      let caseRow = null;
      if (tokenRow.case_id) {
        const { data } = await supabase
          .from("cases")
          .select(
            "case_id, customer_name, current_stage, customer_approved_at, customer_declined_at, quotation_amount",
          )
          .eq("case_id", tokenRow.case_id)
          .single();
        caseRow = data;
      } else if (tokenRow.quotation_id) {
        const { data } = await supabase
          .from("quotations")
          .select("id, quotation_id, customer_name, product_price, status")
          .eq("quotation_id", tokenRow.quotation_id)
          .single();
        if (data) {
          caseRow = {
            case_id: data.quotation_id,
            customer_name: data.customer_name,
            current_stage: "Quotation Sent",
            quotation_amount: data.product_price,
            is_quotation_only: true,
            quotation_pk: data.id,
            status: data.status,
          };
        }
      }

      setCaseData(caseRow);

      // Mark token as used (seen)
      if (!tokenRow.used_at) {
        await supabase
          .from("customer_portal_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("token", t);
      }

      if (tokenRow.documents_uploaded_at) {
        setUploadDone(true);
        setStage("approved");
        return;
      }
      if (tokenRow.declined_at) {
        setStage("declined");
        return;
      }
      if (tokenRow.approved_at) {
        setStage("approved");
        return;
      }
      setStage("pending");
    } catch {
      setStage("invalid");
    }
  };

  const handleApprove = async () => {
    try {
      const now = new Date().toISOString();
      await supabase
        .from("customer_portal_tokens")
        .update({ approved_at: now })
        .eq("token", token);

      if (caseData?.is_quotation_only) {
        await supabase.functions.invoke("quotation", {
          body: {
            action: "approve_quotation",
            id: caseData.quotation_pk,
            portal_token: token,
          },
        });
      } else if (tokenData.case_id) {
        await supabase
          .from("cases")
          .update({
            customer_approved_at: now,
            customer_portal_stage: "approved",
          })
          .eq("case_id", tokenData.case_id);

        // Log audit
        await supabase.from("case_history").insert({
          case_id: tokenData.case_id,
          stage: "Customer Approved",
          action_type: "customer_approved",
          updated_by: tokenData.customer_name || "Customer",
          department: "customer",
          previous_stage: "Quotation Sent",
          new_stage: "Customer Approved",
        });
      }

      setStage("approved");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDecline = async () => {
    if (
      !window.confirm(
        "Are you sure you want to decline this quotation? This will notify our team.",
      )
    )
      return;
    try {
      const now = new Date().toISOString();
      await supabase
        .from("customer_portal_tokens")
        .update({ declined_at: now })
        .eq("token", token);

      if (caseData?.is_quotation_only) {
        await supabase.functions.invoke("quotation", {
          body: {
            action: "decline_quotation",
            id: caseData.quotation_pk,
            portal_token: token,
          },
        });
      } else if (tokenData.case_id) {
        await supabase
          .from("cases")
          .update({
            customer_declined_at: now,
            customer_portal_stage: "declined",
          })
          .eq("case_id", tokenData.case_id);

        await supabase.from("case_history").insert({
          case_id: tokenData.case_id,
          stage: "Customer Declined",
          action_type: "customer_declined",
          updated_by: tokenData.customer_name || "Customer",
          department: "customer",
        });
      }

      setStage("declined");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    const missingDocs = REQUIRED_DOCS.filter((d) => !docs[d]);
    if (missingDocs.length > 0) {
      alert(`Please upload all required documents:\n${missingDocs.join("\n")}`);
      return;
    }
    setUploading(true);
    try {
      let currentCaseId = tokenData.case_id;

      if (caseData?.is_quotation_only) {
        const res = await supabase.functions.invoke("quotation", {
          body: {
            action: "send_to_registration",
            id: caseData.quotation_pk,
            portal_token: token,
          },
        });
        if (
          res.error ||
          (res.data &&
            res.data.message &&
            !res.data.success &&
            !res.data.data &&
            !res.data.caseId)
        ) {
          throw new Error(
            res.error?.message || res.data?.message || "Failed to create case",
          );
        }
        currentCaseId =
          res.data.caseId || res.data.data?.id || res.data.data?.caseId;
        await supabase
          .from("customer_portal_tokens")
          .update({ case_id: currentCaseId })
          .eq("token", token);
      }

      const insertRows = [];
      const newCaseDocs = {};

      for (const [docName, file] of Object.entries(docs)) {
        if (!file) continue;
        const sanitized = docName.replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `customer-docs/${currentCaseId}/${Date.now()}_${sanitized}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("customer-docs")
          .upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("customer-docs")
          .getPublicUrl(fileName);

        insertRows.push({
          case_id: currentCaseId,
          portal_token: token,
          doc_name: docName,
          doc_url: urlData.publicUrl,
        });

        newCaseDocs[docName] = urlData.publicUrl;
      }

      await supabase.from("customer_uploaded_docs").insert(insertRows);

      // Update the main cases table so Registration dept can see the documents
      const { data: existingCase } = await supabase
        .from("cases")
        .select("documents")
        .eq("id", currentCaseId)
        .single();
      const updatedDocs = {
        ...(existingCase?.documents || {}),
        ...newCaseDocs,
      };
      await supabase
        .from("cases")
        .update({ documents: updatedDocs })
        .eq("id", currentCaseId);

      // Log audit
      await supabase.from("case_history").insert({
        case_id: currentCaseId,
        stage: "Documents Uploaded",
        action_type: "document_verified",
        updated_by: tokenData.customer_name || "Customer",
        department: "customer",
      });

      // Mark token as documents uploaded
      await supabase
        .from("customer_portal_tokens")
        .update({ documents_uploaded_at: new Date().toISOString() })
        .eq("token", token);

      setUploadDone(true);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Render States ────────────────────────────────────────────────────────────

  const page = (children) => (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Sun size={28} color="#fff" />
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            {APP_CONFIG.companyName}
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Customer Portal
          </p>
        </div>
        {children}
      </div>
    </div>
  );

  const card = (children, style = {}) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: "28px 28px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        ...style,
      }}
    >
      {children}
    </div>
  );

  if (stage === "loading")
    return page(
      card(
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid #e2e8f0",
              borderTopColor: "#2563EB",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Validating your link…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>,
      ),
    );

  if (stage === "invalid")
    return page(
      card(
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "#fff1f2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Invalid or Expired Link
          </h2>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
            This link is no longer valid. It may have expired (7 days) or
            already been used. Please contact your {APP_CONFIG.companyName}{" "}
            representative for a new link.
          </p>
        </div>,
      ),
    );

  if (stage === "pending")
    return page(
      card(
        <div>
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Solar Quotation Review
            </p>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                marginBottom: 4,
              }}
            >
              Hello, {tokenData?.customer_name || "Valued Customer"}! 👋
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
              Your personalized solar installation quotation is ready. Please
              review and confirm to proceed with the installation.
            </p>
          </div>

          {/* Quotation Summary Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #eff6ff, #e0f2fe)",
              borderRadius: 14,
              padding: "18px 22px",
              marginBottom: 20,
              border: "1px solid #bfdbfe",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#1e40af",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 12,
              }}
            >
              Quotation Summary
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  label: "Customer Name",
                  value: caseData?.customer_name || tokenData?.customer_name,
                },
                { label: "Case Reference", value: caseData?.case_id },
                {
                  label: "Quotation Amount",
                  value: caseData?.quotation_amount
                    ? `₹${Number(caseData.quotation_amount).toLocaleString("en-IN")}`
                    : "Contact Sales",
                },
                {
                  label: "Current Stage",
                  value: caseData?.current_stage || "Quotation Sent",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#475569" }}>
                    {label}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}
                  >
                    {value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What happens next */}
          <div
            style={{
              padding: "14px 18px",
              background: "#f8fafc",
              borderRadius: 12,
              marginBottom: 24,
              border: "1px solid #e2e8f0",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              After you Approve:
            </p>
            <ol style={{ margin: 0, paddingLeft: 16 }}>
              {[
                "You will upload required documents (Aadhar, PAN, etc.)",
                "Our Registration team will verify and create your case",
                "Installation team will schedule your solar installation",
              ].map((step, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: "#475569",
                    marginBottom: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleApprove}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
                transition: "all 0.2s",
              }}
            >
              <CheckCircle size={18} /> ✅ Approve Quotation
            </button>
            <button
              onClick={handleDecline}
              style={{
                width: "100%",
                padding: "12px",
                background: "#fff",
                color: "#ef4444",
                border: "1.5px solid #fecdd3",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              <XCircle size={16} /> Decline Quotation
            </button>
          </div>
        </div>,
      ),
    );

  if (stage === "declined")
    return page(
      card(
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "#fff1f2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <XCircle size={24} color="#ef4444" />
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Quotation Declined
          </h2>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
            You have declined this quotation. Our sales team has been notified
            and will reach out to address any concerns. Thank you for your time!
          </p>
        </div>,
      ),
    );

  if (stage === "approved" && !uploadDone)
    return page(
      card(
        <div>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#f0fdf4",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <CheckCircle size={24} color="#16a34a" />
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#0f172a",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Quotation Approved! 🎉
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: 13,
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              Thank you! Please upload the required documents below to proceed
              with registration.
            </p>
          </div>

          <form
            onSubmit={handleDocUpload}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {REQUIRED_DOCS.map((docName) => (
              <div key={docName}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  {docName} <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      setDocs((d) => ({ ...d, [docName]: e.target.files[0] }))
                    }
                    style={{ display: "none" }}
                    id={`doc_${docName.replace(/\s/g, "_")}`}
                  />
                  <label
                    htmlFor={`doc_${docName.replace(/\s/g, "_")}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      border: docs[docName]
                        ? "1.5px solid #16a34a"
                        : "1.5px dashed #cbd5e1",
                      background: docs[docName] ? "#f0fdf4" : "#f8fafc",
                      fontSize: 13,
                      color: docs[docName] ? "#15803d" : "#64748b",
                      fontWeight: docs[docName] ? 600 : 400,
                      transition: "all 0.2s",
                    }}
                  >
                    {docs[docName] ? (
                      <CheckCircle size={15} />
                    ) : (
                      <UploadCloud size={15} />
                    )}
                    {docs[docName]
                      ? docs[docName].name
                      : "Choose file (PDF, JPG, PNG)"}
                  </label>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={uploading}
              style={{
                width: "100%",
                padding: "13px",
                marginTop: 8,
                background: uploading
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #2563EB, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: uploading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
              }}
            >
              <UploadCloud size={16} />
              {uploading ? "Uploading…" : "Submit Documents"}
            </button>
          </form>
        </div>,
      ),
    );

  if (uploadDone || (stage === "approved" && uploadDone))
    return page(
      card(
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "#f0fdf4",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            All Done! 🌞
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            Your documents have been submitted successfully. Our Registration
            team will review them and contact you soon. Your{" "}
            {APP_CONFIG.companyName} system installation is on its way!
          </p>
          <div
            style={{
              marginTop: 20,
              padding: "14px",
              background: "#eff6ff",
              borderRadius: 12,
              border: "1px solid #bfdbfe",
            }}
          >
            <p style={{ fontSize: 13, color: "#1e40af", fontWeight: 600 }}>
              Reference: {tokenData?.case_id || caseData?.case_id}
            </p>
            <p style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>
              Save this for your records
            </p>
          </div>
        </div>,
      ),
    );

  return null;
}
