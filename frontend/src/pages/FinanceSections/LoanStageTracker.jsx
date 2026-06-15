import React, { useState } from "react";
import toast from "react-hot-toast";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import { LOAN_STAGES } from "./financeConstants";

export default function LoanStageTracker({ currentStatus, caseId, onSave }) {
  const [saving, setSaving] = useState(false);
  const currentIdx = LOAN_STAGES.indexOf(currentStatus);

  const handleAdvance = async (stage) => {
    setSaving(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_finance",
        caseId,
        financeFormStatus: stage,
        financeFinalStatus: stage === "Loan Approved" ? "Approved" : "Pending",
        remarks: `Loan stage updated: ${stage}`,
      });
      if (stage === "Loan Approved") {
        toast.success("🎉 Loan Approved! Check Customers tab if ready.");
      } else {
        toast.success(`Stage updated: ${stage}`);
      }
      onSave();
    } catch (err) {
      toast.error(err.message || "Failed to update loan stage");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "#eff6ff",
        borderRadius: "12px",
        border: "1px solid #bfdbfe",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#1e3a8a",
          marginBottom: "16px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Loan Processing Stages
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0",
          marginBottom: "16px",
        }}
      >
        {LOAN_STAGES.map((stage, idx) => {
          const done = currentIdx >= idx;
          const active = currentIdx === idx;
          return (
            <React.Fragment key={stage}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: done ? "#2563eb" : "#dbeafe",
                    color: done ? "#fff" : "#93c5fd",
                    border: active ? "3px solid #1d4ed8" : "none",
                    transition: "all 0.3s",
                  }}
                >
                  {done ? "✓" : idx + 1}
                </div>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: done ? "#1d4ed8" : "#93c5fd",
                    marginTop: "6px",
                    textAlign: "center",
                    maxWidth: "70px",
                  }}
                >
                  {stage}
                </p>
              </div>
              {idx < LOAN_STAGES.length - 1 && (
                <div
                  style={{
                    flex: 0,
                    width: "24px",
                    height: "2px",
                    background: currentIdx > idx ? "#2563eb" : "#bfdbfe",
                    marginTop: "14px",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {LOAN_STAGES.map((stage, idx) => {
          if (currentIdx >= idx) return null;
          if (idx > currentIdx + 1) return null;
          return (
            <button
              key={stage}
              onClick={() => handleAdvance(stage)}
              disabled={saving}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: "#2563eb",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {saving ? "..." : <ChevronRight size={12} />}
              Mark: {stage}
            </button>
          );
        })}
        {currentIdx === LOAN_STAGES.length - 1 && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#059669",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={14} /> Loan Fully Approved
          </span>
        )}
      </div>
    </div>
  );
}
