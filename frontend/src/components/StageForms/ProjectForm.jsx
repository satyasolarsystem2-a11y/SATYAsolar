import React, { useState } from "react";
import { ArrowRight, Upload } from "lucide-react";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const ProjectForm = ({ ctx }) => {
  const { normalized, caseId, newStage, STAGES, onClose, onRefresh, role } = ctx;

  const [siteVisitDate, setSiteVisitDate] = useState(normalized?.siteVisitDate || "");
  const [installationNote, setInstallationNote] = useState(normalized?.installationNote || "");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSurveyStage = normalized.currentStage === "Material Reserved";
  const isDesignStage = normalized.currentStage === "Survey Completed";
  const isStructureStage = normalized.currentStage === "Structure Dispatch";
  const isKitStage = normalized.currentStage === "Kit Dispatched";

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
      // 1. Update Project Details
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        updates: {
          site_visit_date: siteVisitDate,
          installation_note: installationNote,
        },
      });

      // 2. Update Stage
      await edgeFetch(EDGE.workflow, {
        action: "update_stage",
        caseId,
        newStage: nextStageText,
        remarks: remarks || `Moved to ${nextStageText}`,
      });

      toast.success(`Stage updated to ${nextStageText}!`);
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to update project details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ paddingTop: "4px" }}>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
          Project & Installation Updates
        </p>

        {isSurveyStage && (
          <div style={{ marginBottom: "14px", padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>Scheduled Site Visit Date</label>
            <input type="date" value={siteVisitDate} onChange={(e) => setSiteVisitDate(e.target.value)} className="input" />
            <p style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>Note: Please ensure the customer is notified of the survey date.</p>
          </div>
        )}

        {(isStructureStage || isKitStage) && (
          <div style={{ marginBottom: "14px", padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>Installation Notes / Equipment Info</label>
            <textarea
              value={installationNote}
              onChange={(e) => setInstallationNote(e.target.value)}
              placeholder="Record structural challenges, equipment details, or panel/inverter specifics here..."
              className="input"
              style={{ minHeight: "80px", resize: "vertical" }}
            />
          </div>
        )}

        <div style={{ marginTop: "14px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Internal Handoff Remarks (Optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={`Notes for the next department regarding ${nextStageText}...`}
            className="input"
            style={{ minHeight: "60px", resize: "vertical" }}
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
          <>Confirm & Move to {nextStageText} <ArrowRight style={{ width: "14px", height: "14px" }} /></>
        )}
      </button>
    </form>
  );
};

export default ProjectForm;
