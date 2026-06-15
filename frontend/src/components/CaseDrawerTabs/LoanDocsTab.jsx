/* ─────────────────────────────────────────────────────────────────────────────
   LoanDocsTab — Dedicated Banking Document Package tab
   Visible to: banking / finance / admin / operations roles (loan cases only)
   Separate from general customer_uploaded_docs — uses loan_banking_docs table
───────────────────────────────────────────────────────────────────────────── */
import React, { useState, useEffect } from "react";
import {
  Download, Eye, CheckCircle2, XCircle, AlertTriangle,
  Upload, RefreshCw, Clock, User, FileText, Shield,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

// ── Configurable required document types (future-proof) ─────────────────────
export const BANKING_DOC_TYPES = [
  { key: "banking_package", label: "Banking Document Package", required: true },
];

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Pending:  { bg: "#fffbeb", color: "#92400e", border: "#fde68a", icon: "⏳" },
    Verified: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", icon: "✅" },
    Rejected: { bg: "#fff1f2", color: "#9f1239", border: "#fecdd3", icon: "❌" },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.icon} {status || "Pending"}
    </span>
  );
};

// ── Audit row ────────────────────────────────────────────────────────────────
const AuditRow = ({ icon: Icon, label, value, color = "#64748b" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color }}>
    <Icon style={{ width: "13px", height: "13px", flexShrink: 0 }} />
    <span style={{ fontWeight: 600 }}>{label}:</span>
    <span>{value || "—"}</span>
  </div>
);

// ── Format timestamp ─────────────────────────────────────────────────────────
const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " at " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

// ── Main component ───────────────────────────────────────────────────────────
const LoanDocsTab = ({ ctx }) => {
  const { caseId, normalized, role, canUpdate } = ctx;

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [remarks, setRemarks] = useState({});      // { [docId]: string }
  const [showRemarks, setShowRemarks] = useState({}); // { [docId]: bool }

  // ── Registration upload state (for reg team if they need to re-upload) ────
  const [uploading, setUploading] = useState(false);
  const [reUploadFile, setReUploadFile] = useState(null);

  const isLoanCase = (normalized?.paymentType || "").toLowerCase() === "loan";
  const isBankingRole = ["banking", "finance", "admin", "operations"].includes(role);
  const isRegRole = role === "registration" || role === "admin";

  // ── Fetch docs from loan_banking_docs ────────────────────────────────────
  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("loan_banking_docs")
        .select("*")
        .eq("case_id", caseId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      setDocs(data || []);
    } catch (err) {
      toast.error("Failed to load banking documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (caseId) fetchDocs(); }, [caseId]); // eslint-disable-line

  // ── Verify / Reject ───────────────────────────────────────────────────────
  const handleVerify = async (docId, newStatus) => {
    const remark = remarks[docId]?.trim() || "";
    if (newStatus === "Rejected" && !remark) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    setVerifyingId(docId);
    try {
      const { error } = await supabase
        .from("loan_banking_docs")
        .update({
          status: newStatus,
          remarks: remark || null,
          verified_by: localStorage.getItem("name") || "Banking Team",
          verified_at: new Date().toISOString(),
        })
        .eq("id", docId);
      if (error) throw error;
      toast.success(`Document ${newStatus.toLowerCase()} successfully!`);
      setShowRemarks((p) => ({ ...p, [docId]: false }));
      fetchDocs();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setVerifyingId(null);
    }
  };

  // ── Re-upload by Registration (if banking team requests re-submission) ────
  const handleReUpload = async () => {
    if (!reUploadFile) { toast.error("Select a file first."); return; }
    setUploading(true);
    try {
      const sanitized = reUploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `loan-banking-docs/${caseId}/${Date.now()}_${sanitized}`;
      const { error: upErr } = await supabase.storage
        .from("customer-docs")
        .upload(path, reUploadFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("customer-docs").getPublicUrl(path);
      const { error: insErr } = await supabase.from("loan_banking_docs").insert({
        case_id: caseId,
        doc_name: "Banking Document Package",
        doc_url: urlData.publicUrl,
        file_name: reUploadFile.name,
        uploaded_by: localStorage.getItem("name") || "Registration",
        status: "Pending",
      });
      if (insErr) throw insErr;
      toast.success("Banking document package re-uploaded!");
      setReUploadFile(null);
      fetchDocs();
    } catch (err) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ── Download a single doc ─────────────────────────────────────────────────
  const handleDownload = (doc) => {
    const a = document.createElement("a");
    a.href = doc.doc_url;
    a.download = doc.file_name || doc.doc_name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  // ── Download all ──────────────────────────────────────────────────────────
  const handleDownloadAll = () => {
    if (docs.length === 0) { toast.error("No documents to download."); return; }
    docs.forEach((doc, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = doc.doc_url;
        a.download = doc.file_name || doc.doc_name;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.click();
      }, i * 500);
    });
    toast.success(`Downloading ${docs.length} document(s)…`);
  };

  // ────────────────────────────────────────────────────────────────────────────
  if (!isLoanCase) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>💵</div>
        <p style={{ fontWeight: 700, color: "#374151", fontSize: "14px" }}>Cash Case</p>
        <p style={{ color: "#9ca3af", fontSize: "12.5px", marginTop: "4px" }}>
          Banking Document Package is only required for Loan cases.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
            🏦 Loan Required Documents
          </p>
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
            Banking package uploaded by Registration before case transfer
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={fetchDocs}
            style={{ padding: "6px 10px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#475569" }}
          >
            <RefreshCw style={{ width: "12px", height: "12px" }} /> Refresh
          </button>
          {docs.length > 0 && (
            <button
              onClick={handleDownloadAll}
              style={{ padding: "6px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600 }}
            >
              <Download style={{ width: "12px", height: "12px" }} /> Download All ({docs.length})
            </button>
          )}
        </div>
      </div>

      {/* ── No docs — warning banner ── */}
      {!loading && docs.length === 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px" }}>
          <AlertTriangle style={{ width: "20px", height: "20px", color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
          <div>
            <p style={{ fontWeight: 700, color: "#92400e", fontSize: "13px", margin: 0 }}>
              Banking Document Package Not Uploaded
            </p>
            <p style={{ fontSize: "12px", color: "#b45309", margin: "4px 0 0", lineHeight: 1.5 }}>
              The Registration team has not yet uploaded the required banking documents for this loan case.
              Finance processing cannot begin until the package is submitted.
            </p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "13px" }}>
          <div style={{ width: "28px", height: "28px", border: "2px solid #e2e8f0", borderTopColor: "#3b4cb8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          Loading documents…
        </div>
      )}

      {/* ── Document cards ── */}
      {!loading && docs.map((doc) => (
        <div
          key={doc.id}
          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          {/* Card header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText style={{ width: "18px", height: "18px", color: "#3b82f6" }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b", margin: 0 }}>
                  {doc.doc_name}
                </p>
                {doc.file_name && (
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0" }}>
                    {doc.file_name}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <StatusBadge status={doc.status} />
              <button
                onClick={() => window.open(doc.doc_url, "_blank")}
                style={{ padding: "5px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "#2563eb", fontWeight: 600 }}
              >
                <Eye style={{ width: "12px", height: "12px" }} /> View
              </button>
              <button
                onClick={() => handleDownload(doc)}
                style={{ padding: "5px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "#16a34a", fontWeight: 600 }}
              >
                <Download style={{ width: "12px", height: "12px" }} /> Download
              </button>
            </div>
          </div>

          {/* Audit trail */}
          <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: "12px 24px" }}>
            <AuditRow icon={User}  label="Uploaded By" value={doc.uploaded_by} color="#475569" />
            <AuditRow icon={Clock} label="Uploaded At" value={fmtDate(doc.uploaded_at)} color="#475569" />
            {doc.verified_by && (
              <AuditRow icon={Shield} label="Verified By" value={doc.verified_by} color="#15803d" />
            )}
            {doc.verified_at && (
              <AuditRow icon={Clock} label="Verified At" value={fmtDate(doc.verified_at)} color="#15803d" />
            )}
            {doc.updated_by && doc.updated_by !== doc.uploaded_by && (
              <AuditRow icon={RefreshCw} label="Last Updated By" value={doc.updated_by} color="#6366f1" />
            )}
          </div>

          {/* Existing remarks */}
          {doc.remarks && (
            <div style={{ margin: "0 16px 12px", padding: "10px 12px", background: doc.status === "Rejected" ? "#fff1f2" : "#f0fdf4", border: `1px solid ${doc.status === "Rejected" ? "#fecdd3" : "#bbf7d0"}`, borderRadius: "8px", fontSize: "12.5px", color: doc.status === "Rejected" ? "#be123c" : "#15803d" }}>
              <strong>Remarks:</strong> {doc.remarks}
            </div>
          )}

          {/* ── Verify / Reject actions (banking team only) ── */}
          {isBankingRole && doc.status === "Pending" && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Remarks input */}
              {showRemarks[doc.id] && (
                <textarea
                  value={remarks[doc.id] || ""}
                  onChange={(e) => setRemarks((p) => ({ ...p, [doc.id]: e.target.value }))}
                  placeholder="Enter approval/rejection remarks (required for rejection)…"
                  className="input"
                  style={{ minHeight: "70px", resize: "vertical", fontSize: "12.5px" }}
                />
              )}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => setShowRemarks((p) => ({ ...p, [doc.id]: !p[doc.id] }))}
                  style={{ padding: "7px 12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer", fontSize: "12px", color: "#475569" }}
                >
                  {showRemarks[doc.id] ? "Hide Remarks" : "Add Remarks"}
                </button>
                <button
                  disabled={verifyingId === doc.id}
                  onClick={() => handleVerify(doc.id, "Verified")}
                  style={{ padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", opacity: verifyingId === doc.id ? 0.6 : 1 }}
                >
                  <CheckCircle2 style={{ width: "13px", height: "13px" }} />
                  {verifyingId === doc.id ? "Saving…" : "Verify"}
                </button>
                <button
                  disabled={verifyingId === doc.id}
                  onClick={() => {
                    setShowRemarks((p) => ({ ...p, [doc.id]: true }));
                    if (remarks[doc.id]?.trim()) handleVerify(doc.id, "Rejected");
                    else toast.error("Add a rejection reason in remarks first.");
                  }}
                  style={{ padding: "7px 14px", background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <XCircle style={{ width: "13px", height: "13px" }} />
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Already verified/rejected — allow re-opening */}
          {isBankingRole && doc.status !== "Pending" && (
            <div style={{ padding: "8px 16px", borderTop: "1px solid #f1f5f9" }}>
              <button
                onClick={async () => {
                  await supabase.from("loan_banking_docs").update({ status: "Pending", remarks: null, verified_by: null, verified_at: null }).eq("id", doc.id);
                  fetchDocs();
                  toast.success("Document reset to Pending.");
                }}
                style={{ fontSize: "11.5px", color: "#6366f1", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Reset to Pending
              </button>
            </div>
          )}
        </div>
      ))}

      {/* ── Re-upload section (Registration or Admin) ── */}
      {isRegRole && (
        <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Upload style={{ width: "13px", height: "13px" }} />
            {docs.length === 0 ? "Upload Banking Document Package" : "Upload Updated Package"}
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="file"
              accept="image/*,application/pdf,.zip,.rar"
              onChange={(e) => setReUploadFile(e.target.files[0])}
              className="input"
              style={{ flex: 1, padding: "8px", fontSize: "12.5px" }}
            />
            <button
              onClick={handleReUpload}
              disabled={uploading || !reUploadFile}
              style={{ padding: "8px 16px", background: uploading || !reUploadFile ? "#e2e8f0" : "#3b4cb8", color: uploading || !reUploadFile ? "#94a3b8" : "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "12.5px", cursor: uploading || !reUploadFile ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
            Accepted: PDF, Images, ZIP. This package goes directly to Banking & Accounts — separate from general documents.
          </p>
        </div>
      )}

      {/* ── Required docs checklist (configurable) ── */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
        <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
          📋 Required Banking Documents Checklist
        </p>
        {BANKING_DOC_TYPES.map((dt) => {
          const uploaded = docs.some((d) => d.doc_name?.toLowerCase().includes(dt.key.replace("_", " ").toLowerCase()) || d.status !== undefined);
          const verified = docs.some((d) => d.status === "Verified");
          return (
            <div key={dt.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: verified ? "#16a34a" : docs.length > 0 ? "#f59e0b" : "#ef4444", flexShrink: 0 }} />
                <span style={{ fontSize: "12.5px", color: "#374151" }}>{dt.label}</span>
                {dt.required && <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: 700 }}>REQUIRED</span>}
              </div>
              <StatusBadge status={verified ? "Verified" : docs.length > 0 ? "Pending" : "Missing"} />
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default LoanDocsTab;
