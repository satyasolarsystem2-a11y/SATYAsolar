import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const BankingForm = ({ ctx }) => {
  const { normalized, caseId, onClose, onRefresh } = ctx;

  const [paymentType, setPaymentType] = useState(normalized?.paymentType || "");
  const [downPayment, setDownPayment] = useState(normalized?.downPayment || "");
  const [cashAmount, setCashAmount] = useState(normalized?.cashAmount || "");
  const [paymentMode, setPaymentMode] = useState(normalized?.paymentMode || "");
  const [loanAmount, setLoanAmount] = useState(normalized?.loanAmount || "");
  const [loanApprovedAmount, setLoanApprovedAmount] = useState(normalized?.loanApprovedAmount || "");
  const [bankName, setBankName] = useState(normalized?.bankName || "");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentType) {
      toast.error("Please select a payment type.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save Finance Details
      await edgeFetch(EDGE.workflow, {
        action: "update_finance",
        caseId,
        paymentType,
        downPayment,
        cashAmount,
        paymentMode,
        loanAmount,
        loanApprovedAmount,
        bankName,
        financeFormStatus: "complete",
      });

      // 2. Move to Warehouse
      await edgeFetch(EDGE.workflow, {
        action: "update_stage",
        caseId,
        newStage: "Material Reserved",
        remarks: remarks || "Banking clearance completed. Finance details logged.",
      });

      toast.success("Case moved to Warehouse!");
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to process banking updates.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ paddingTop: "4px" }}>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
          Banking & Finance Clearance
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="input"
              required
            >
              <option value="">-- Select --</option>
              <option value="Cash">Cash</option>
              <option value="Loan">Loan</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Down Payment (₹)</label>
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              placeholder="0"
              className="input"
            />
          </div>
        </div>

        {paymentType === "Cash" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px", padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#166534", display: "block", marginBottom: "6px" }}>Cash Amount (₹)</label>
              <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0" className="input" />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#166534", display: "block", marginBottom: "6px" }}>Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="input">
                <option value="">Select mode...</option>
                <option value="Cash">Cash (Physical)</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        )}

        {paymentType === "Loan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "14px", padding: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#1e3a8a", display: "block", marginBottom: "6px" }}>Loan Amount (₹)</label>
                <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="0" className="input" />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#1e3a8a", display: "block", marginBottom: "6px" }}>Approved Amount (₹)</label>
                <input type="number" value={loanApprovedAmount} onChange={(e) => setLoanApprovedAmount(e.target.value)} placeholder="0" className="input" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#1e3a8a", display: "block", marginBottom: "6px" }}>Approved Bank Name</label>
              <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC, SBI" className="input" />
            </div>
          </div>
        )}

        <div style={{ marginTop: "14px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Handoff Note for Warehouse (Optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Any special instructions for dispatch..."
            className="input"
            style={{ minHeight: "80px", resize: "vertical" }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary"
        style={{ width: "100%", display: "flex", justifyContent: "center", gap: "6px" }}
      >
        {submitting ? (
          <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing…</>
        ) : (
          <>Approve Finance & Move to Warehouse <ArrowRight style={{ width: "14px", height: "14px" }} /></>
        )}
      </button>
    </form>
  );
};

export default BankingForm;
