import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const AccountsForm = ({ ctx }) => {
  const { normalized, caseId, newStage, STAGES, onClose, onRefresh, setActiveTab } = ctx;

  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  let nextStageText = newStage;
  if (!nextStageText) {
    const currentIndex = STAGES.indexOf(normalized.currentStage);
    if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
      nextStageText = STAGES[currentIndex + 1];
    }
  }

  const remainingBalance = Number(
    (normalized.totalAmount || 0) -
      (normalized.downPayment || 0) -
      (normalized.paymentType === "Loan" ? normalized.loanAmount || 0 : 0)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Update Stage
      await edgeFetch(EDGE.workflow, {
        action: "update_stage",
        caseId,
        newStage: nextStageText,
        remarks: remarks || `Final Payment Cleared. Moved to ${nextStageText}`,
      });

      toast.success(`Stage updated to ${nextStageText}!`);
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to process accounts updates.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ paddingTop: "4px" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <ClipboardList size={16} style={{ color: "#059669" }} />
          <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
            Accounts Clearance
          </p>
        </div>

        <div style={{ marginBottom: "14px", padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#166534", display: "block" }}>Total Invoice Amount</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#14532d" }}>₹{Number(normalized.totalAmount || 0).toLocaleString()}</span>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#166534", display: "block" }}>Payment Type</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#14532d" }}>{normalized.paymentType || "—"}</span>
            </div>
          </div>
          <div style={{ height: "1px", background: "#dcfce7", margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#166534" }}>Remaining Balance (Expected):</span>
            <span style={{ fontSize: "15px", fontWeight: 800, color: remainingBalance > 0 ? "#dc2626" : "#16a34a" }}>
              ₹{remainingBalance.toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Need to verify individual payment receipts?</span>
          <button 
            type="button" 
            onClick={() => setActiveTab("finance")} 
            className="btn btn-ghost btn-sm" 
            style={{ fontSize: "12px", color: "#3b82f6" }}
          >
            Go to Accounts Tab →
          </button>
        </div>

        <div style={{ marginTop: "14px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Clearance Remarks (Optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. All payments settled, no outstanding dues..."
            className="input"
            style={{ minHeight: "80px", resize: "vertical" }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary"
        style={{ width: "100%", display: "flex", justifyContent: "center", gap: "6px", backgroundColor: "#059669", borderColor: "#059669" }}
      >
        {submitting ? (
          <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing…</>
        ) : (
          <><CheckCircle2 style={{ width: "16px", height: "16px" }} /> Confirm Final Payment Clearance</>
        )}
      </button>
    </form>
  );
};

export default AccountsForm;
