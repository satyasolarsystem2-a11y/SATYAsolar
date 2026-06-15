import React from "react";
import StatusPill from "./StatusPill";

export default function OverviewTab({ cardData, cases, setActiveView }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {cardData.map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: "14px", padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 1px ${border}` }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <p style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: "11px", color: "var(--text-4)", marginTop: "3px" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-1)" }}>Cases in Finance Stage ({cases.length})</h3>
          {cases.length > 5 && (
            <button onClick={() => setActiveView("tracker")} className="btn btn-ghost btn-sm">View all →</button>
          )}
        </div>
        {cases.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-4)", textAlign: "center", padding: "30px" }}>No active finance cases</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {cases.slice(0, 5).map((c) => {
              const pt = (c.payment_type || "").toLowerCase();
              const displayStatus = pt === "cash" ? (c.payment_mode && c.payment_mode.trim() !== "" ? "Approved" : "Pending") : (c.finance_final_status || "Pending");
              return (
                <div key={c.id || c.case_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface-2)", borderRadius: "10px" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-1)" }}>{c.customer_name}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-4)" }}>{c.tracking_id || c.id || c.case_id} · {c.phone}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <StatusPill status={displayStatus} />
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: pt === "cash" ? "#f0fdf4" : pt === "loan" ? "#eff6ff" : "#f8fafc", color: pt === "cash" ? "#16a34a" : pt === "loan" ? "#2563eb" : "#64748b" }}>
                      {pt.toUpperCase() || "PENDING"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
