import React, { useState } from "react";
import toast from "react-hot-toast";
import { Phone, Zap, Banknote, Building2, CreditCard, Edit3, Save, X, Clock } from "lucide-react";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import StatusPill from "./StatusPill";
import LoanStageTracker from "./LoanStageTracker";

export default function FinanceTableRow({ caseObj, onSave, mobileMode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [formData, setFormData] = useState({
    paymentType: caseObj.payment_type || "",
    cashAmount: caseObj.cash_amount || "",
    paymentMode: caseObj.payment_mode || "",
    loanAmount: caseObj.loan_amount || "",
    bankName: caseObj.bank_name || "",
    financeFormStatus: caseObj.finance_form_status || "Form Submitted to Bank",
    financeFinalStatus: caseObj.finance_final_status || "Pending",
    financeNotes: caseObj.finance_notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    try {
      const pType = (formData.paymentType || "").toLowerCase();
      let remarks = "Updated financial details.";
      if (pType === "cash" && formData.paymentMode) {
        remarks = `Cash payment confirmed via ${formData.paymentMode}`;
      }
      await edgeFetch(EDGE.workflow, {
        action: "update_finance",
        caseId: caseObj.id || caseObj.case_id,
        remarks,
        ...formData,
      });
      toast.success("Finance details updated.");
      setIsEditing(false);
      onSave();
    } catch {
      toast.error("Failed to update finance details");
    } finally {
      setSaving(false);
    }
  };

  const loadExpanded = async () => {
    const next = !showExpanded;
    setShowExpanded(next);
    if (next && historyData.length === 0) {
      setLoadingHistory(true);
      try {
        const res = await edgeFetch(EDGE.workflow, {
          action: "get_one",
          caseId: caseObj.id || caseObj.case_id,
        });
        setHistoryData(res.history || []);
      } catch {
        toast.error("Failed to load history");
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  const tdStyle = {
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
  };
  const payType = (formData.paymentType || "").toLowerCase();
  const isApproved =
    payType === "loan"
      ? formData.financeFormStatus === "Loan Approved" ||
        formData.financeFormStatus === "Approved"
      : payType === "cash" &&
        formData.paymentMode &&
        formData.paymentMode.trim() !== "";

  if (mobileMode) {
    return (
      <div
        style={{
          background: isEditing ? "var(--surface-2)" : "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "var(--shadow-sm)",
          transition: "background 0.2s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 700, color: "var(--text-1)", fontSize: "15px" }}>{caseObj.customer_name}</div>
            <div style={{ fontSize: "12px", color: "var(--text-4)", display: "flex", gap: "10px", marginTop: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={11} /> {caseObj.phone}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Zap size={11} /> {caseObj.load_required || "?"} kW</span>
            </div>
          </div>
          {payType === "loan" ? (
            <StatusPill status={formData.financeFormStatus || "Pending"} />
          ) : payType === "cash" && formData.paymentMode ? (
            <StatusPill status="Approved" />
          ) : (
            <span style={{ color: "var(--text-4)", fontSize: "12px" }}>—</span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--surface-2)", padding: "12px", borderRadius: "8px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-4)", textTransform: "uppercase", fontWeight: 600 }}>Type</div>
            <div style={{ marginTop: "4px" }}>
              {isEditing ? (
                <select name="paymentType" value={formData.paymentType} onChange={handleChange} className="input" style={{ width: "100%", padding: "8px", fontSize: "13px" }}>
                  <option value="">Select…</option>
                  <option value="cash">Cash</option>
                  <option value="loan">Bank Loan</option>
                </select>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, background: payType === "cash" ? "#f0fdf4" : payType === "loan" ? "#eff6ff" : "#f8fafc", color: payType === "cash" ? "#16a34a" : payType === "loan" ? "#2563eb" : "#64748b", border: `1px solid ${payType === "cash" ? "#bbf7d0" : payType === "loan" ? "#bfdbfe" : "#e2e8f0"}` }}>
                  {payType === "cash" ? <Banknote size={11} /> : payType === "loan" ? <Building2 size={11} /> : <CreditCard size={11} />}
                  {payType ? payType.toUpperCase() : "PENDING"}
                </span>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-4)", textTransform: "uppercase", fontWeight: 600 }}>Amount / Mode</div>
            <div style={{ marginTop: "4px" }}>
              {isEditing && payType === "cash" ? (
                <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="input" style={{ width: "100%", padding: "8px", fontSize: "13px" }}>
                  <option value="">Select mode…</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Physical Cash">Physical Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              ) : isEditing && payType === "loan" ? (
                <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleChange} className="input" style={{ width: "100%", padding: "8px", fontSize: "13px" }} placeholder="₹ Amount" />
              ) : payType === "cash" ? (
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-2)" }}>{formData.paymentMode || <span style={{ color: "var(--text-4)", fontStyle: "italic" }}>Mode not set</span>}</span>
              ) : payType === "loan" ? (
                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-1)" }}>₹{Number(formData.loanAmount || 0).toLocaleString("en-IN")}</div>
              ) : (
                <span style={{ color: "var(--text-4)", fontSize: "12px" }}>—</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
          {!isEditing && !isApproved && (
            <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm" style={{ flex: 1, padding: "8px", fontSize: "13px" }}><Edit3 size={14} /> Edit</button>
          )}
          {isEditing && (
            <div style={{ display: "flex", gap: "8px", flex: 1 }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm" style={{ flex: 1, padding: "8px", fontSize: "13px" }}>{saving ? "..." : <Save size={14} />} Save</button>
              <button onClick={() => setIsEditing(false)} className="btn btn-ghost btn-sm" style={{ padding: "8px" }}><X size={16} /></button>
            </div>
          )}
          <button onClick={loadExpanded} className="btn btn-ghost btn-sm" style={{ flex: !isEditing && !isApproved ? 1 : "none", padding: "8px 14px", fontSize: "13px", background: showExpanded ? "var(--brand-dim)" : "transparent", color: showExpanded ? "var(--brand)" : "var(--text-2)" }}>
            <Clock size={14} /> {showExpanded ? "Hide" : payType === "loan" ? "Stages" : "History"}
          </button>
        </div>

        {showExpanded && payType === "loan" && (
          <div style={{ background: "#f0f7ff", padding: "16px", borderRadius: "8px", border: "1px solid #bfdbfe", marginTop: "4px" }}>
            <LoanStageTracker currentStatus={formData.financeFormStatus} caseId={caseObj.id || caseObj.case_id} onSave={() => { setShowExpanded(false); onSave(); }} />
          </div>
        )}
        {showExpanded && payType !== "loan" && (
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)", marginTop: "4px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-1)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={15} /> Cash Payment History
            </h4>
            {loadingHistory ? (
              <p style={{ fontSize: "13px", color: "var(--text-3)" }}>Loading...</p>
            ) : historyData.filter(h => h.action_type === "finance_update").length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-4)", fontStyle: "italic" }}>No payment history records found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[...historyData].filter(h => h.action_type === "finance_update").reverse().slice(0, 5).map((h, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-2)", padding: "10px", background: "#fff", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 600 }}>{h.updated_by}</span><span style={{ color: "var(--text-4)" }}>{new Date(h.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span></div>
                    <span>{h.remarks}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <tr style={{ background: isEditing ? "var(--surface-2)" : "transparent", transition: "background 0.2s" }} onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.background = "var(--surface-2)"; }} onMouseLeave={(e) => { if (!isEditing) e.currentTarget.style.background = "transparent"; }}>
        <td style={tdStyle}>
          <div style={{ fontWeight: 700, color: "var(--text-1)", fontSize: "14px", marginBottom: "4px" }}>{caseObj.customer_name}</div>
          <div style={{ fontSize: "12px", color: "var(--text-4)", display: "flex", gap: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={11} /> {caseObj.phone}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Zap size={11} /> {caseObj.load_required || "?"} kW</span>
          </div>
        </td>
        <td style={tdStyle}>
          {isEditing ? (
            <select name="paymentType" value={formData.paymentType} onChange={handleChange} className="input" style={{ width: "120px", padding: "8px", fontSize: "13px" }}>
              <option value="">Select…</option>
              <option value="cash">Cash</option>
              <option value="loan">Bank Loan</option>
            </select>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, background: payType === "cash" ? "#f0fdf4" : payType === "loan" ? "#eff6ff" : "#f8fafc", color: payType === "cash" ? "#16a34a" : payType === "loan" ? "#2563eb" : "#64748b", border: `1px solid ${payType === "cash" ? "#bbf7d0" : payType === "loan" ? "#bfdbfe" : "#e2e8f0"}` }}>
              {payType === "cash" ? <Banknote size={12} /> : payType === "loan" ? <Building2 size={12} /> : <CreditCard size={12} />}
              {payType ? payType.toUpperCase() : "PENDING"}
            </span>
          )}
        </td>
        <td style={tdStyle}>
          {isEditing && payType === "cash" ? (
            <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="input" style={{ width: "150px", padding: "8px", fontSize: "13px" }}>
              <option value="">Select mode…</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="UPI">UPI</option>
              <option value="Physical Cash">Physical Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          ) : isEditing && payType === "loan" ? (
            <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleChange} className="input" style={{ width: "130px", padding: "8px", fontSize: "13px" }} placeholder="₹ Amount" />
          ) : payType === "cash" ? (
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-2)" }}>{formData.paymentMode || <span style={{ color: "var(--text-4)", fontStyle: "italic" }}>Mode not set</span>}</span>
          ) : payType === "loan" ? (
            <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-1)" }}>₹{Number(formData.loanAmount || 0).toLocaleString("en-IN")}</div>
          ) : (
            <span style={{ color: "var(--text-4)", fontSize: "12px" }}>—</span>
          )}
        </td>
        <td style={{ ...tdStyle, maxWidth: "200px" }}>
          {payType === "loan" ? (
            <StatusPill status={formData.financeFormStatus || "Pending"} />
          ) : payType === "cash" && formData.paymentMode ? (
            <StatusPill status="Approved" />
          ) : (
            <span style={{ color: "var(--text-4)", fontSize: "12px" }}>—</span>
          )}
        </td>
        <td style={tdStyle}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {!isEditing && !isApproved && (
              <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm" style={{ padding: "6px 14px", fontSize: "12.5px" }}><Edit3 size={14} /> Edit</button>
            )}
            {isEditing && (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm" style={{ padding: "6px 14px", fontSize: "12.5px" }}>{saving ? "..." : <Save size={14} />} Save</button>
                <button onClick={() => setIsEditing(false)} className="btn btn-ghost btn-sm" style={{ padding: "6px" }}><X size={16} /></button>
              </div>
            )}
            <button onClick={loadExpanded} className="btn btn-ghost btn-sm" style={{ padding: "6px 14px", fontSize: "12.5px", background: showExpanded ? "var(--brand-dim)" : "transparent", color: showExpanded ? "var(--brand)" : "var(--text-2)" }}>
              <Clock size={14} /> {showExpanded ? "Hide" : payType === "loan" ? "Loan Stages" : "History"}
            </button>
          </div>
        </td>
      </tr>

      {showExpanded && payType === "loan" && (
        <tr style={{ background: "#f0f7ff" }}>
          <td colSpan={5} style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
            <LoanStageTracker currentStatus={formData.financeFormStatus} caseId={caseObj.id || caseObj.case_id} onSave={() => { setShowExpanded(false); onSave(); }} />
          </td>
        </tr>
      )}

      {showExpanded && payType !== "loan" && (
        <tr style={{ background: "#f8fafc" }}>
          <td colSpan={5} style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-1)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Clock size={15} /> Cash Payment History</h4>
            {loadingHistory ? (
              <p style={{ fontSize: "13px", color: "var(--text-3)" }}>Loading...</p>
            ) : historyData.filter(h => h.action_type === "finance_update").length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-4)", fontStyle: "italic" }}>No payment history records found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[...historyData].filter(h => h.action_type === "finance_update").reverse().slice(0, 5).map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text-2)", padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-4)", minWidth: "140px" }}>{new Date(h.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                    <span style={{ fontWeight: 600, minWidth: "100px" }}>{h.updated_by}</span>
                    <span>{h.remarks}</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
