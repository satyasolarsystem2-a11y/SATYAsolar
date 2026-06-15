import React, { useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const ElectricalForm = ({ ctx }) => {
  const { normalized, caseId, newStage, STAGES, onClose, onRefresh } = ctx;

  const [applicationNumber, setApplicationNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isApplicationStage = normalized.currentStage === "Full Installation Completed";
  const isCompletionStage = normalized.currentStage === "Net Metering Applied";

  let nextStageText = newStage;
  if (!nextStageText) {
    const currentIndex = STAGES.indexOf(normalized.currentStage);
    if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
      nextStageText = STAGES[currentIndex + 1];
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalRemarks = applicationNumber 
        ? `Net Metering Application No: ${applicationNumber}. ${remarks}` 
        : remarks || `Moved to ${nextStageText}`;

      // 1. Update Stage
      await edgeFetch(EDGE.workflow, {
        action: "update_stage",
        caseId,
        newStage: nextStageText,
        remarks: finalRemarks,
      });

      toast.success(`Stage updated to ${nextStageText}!`);
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to process electrical updates.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ paddingTop: "4px" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Zap size={16} style={{ color: "#eab308" }} />
          <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#ca8a04", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
            Electrical & Net Metering Updates
          </p>
        </div>

        {isApplicationStage && (
          <div style={{ marginBottom: "14px", padding: "12px", background: "#fefce8", border: "1px solid #fef08a", borderRadius: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#854d0e", display: "block", marginBottom: "6px" }}>Net Metering Application Number</label>
            <input 
              type="text" 
              value={applicationNumber} 
              onChange={(e) => setApplicationNumber(e.target.value)} 
              placeholder="e.g., UPPCL-123456" 
              className="input" 
            />
          </div>
        )}

        <div style={{ marginTop: "14px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Remarks / Serial Numbers (Optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={`Any notes regarding meter installation, CEIG approval, or serial numbers...`}
            className="input"
            style={{ minHeight: "80px", resize: "vertical" }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary"
        style={{ width: "100%", display: "flex", justifyContent: "center", gap: "6px", backgroundColor: "#eab308", borderColor: "#eab308" }}
      >
        {submitting ? (
          <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing…</>
        ) : (
          <>Confirm & Move to {nextStageText} <ArrowRight style={{ width: "14px", height: "14px" }} /></>
        )}
      </button>
    </form>
  );
};

export default ElectricalForm;
