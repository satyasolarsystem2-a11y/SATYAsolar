import React from "react";
import { FolderOpen } from "lucide-react";
import FinanceTableRow from "./FinanceTableRow";

export default function TrackerTab({ cases, loading, loadData }) {
  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-1)" }}>Finance Tracking</h2>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "2px" }}>
          {cases.length} case{cases.length !== 1 ? "s" : ""} in pipeline
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "76px", borderRadius: "14px", background: "var(--surface-2)" }} />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 32px", background: "var(--surface)", borderRadius: "14px", border: "1px dashed var(--color-border)" }}>
          <FolderOpen size={32} color="var(--text-4)" style={{ marginBottom: "12px", opacity: 0.5 }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-1)", marginBottom: "6px" }}>No active finance cases</h3>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Cases appear here when they reach Bank & Finance stage.</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div className="table-wrap hide-on-mobile" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "860px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  {["Customer Info", "Payment Type", "Amount / Mode", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <FinanceTableRow key={c.id || c.case_id} caseObj={c} onSave={loadData} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px", background: "var(--page-bg)" }}>
            {cases.map((c) => (
              <FinanceTableRow key={`mob-${c.id || c.case_id}`} caseObj={c} onSave={loadData} mobileMode={true} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
