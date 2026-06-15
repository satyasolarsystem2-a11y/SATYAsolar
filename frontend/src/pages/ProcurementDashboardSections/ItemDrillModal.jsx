import React from "react";
import { X } from "lucide-react";
import PieChart2 from "./PieChart2";

export default function ItemDrillModal({ item, transactions, onClose }) {
  const itemTxns = transactions.filter(t => t.inventory_id === item.id || t.inventory_name === item.name);
  const b2bQty = itemTxns.filter(t => t.dispatch_type === "b2b").reduce((s, t) => s + Math.abs(t.quantity), 0);
  const b2cQty = itemTxns.filter(t => t.dispatch_type === "b2c" || (t.transaction_type === "stock_out" && !t.dispatch_type)).reduce((s, t) => s + Math.abs(t.quantity), 0);
  const stockInQty = itemTxns.filter(t => t.transaction_type === "stock_in").reduce((s, t) => s + Math.abs(t.quantity), 0);

  const slices = [
    { label: "B2B Dispatch", value: b2bQty, color: "#8b5cf6" },
    { label: "B2C Dispatch", value: b2cQty, color: "#0ea5e9" },
    { label: "Remaining Stock", value: item.stock, color: "#10b981" },
  ].filter(s => s.value > 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 25px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{item.name}</h3>
            <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{item.category} · SKU: {item.sku || "N/A"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", padding: 6 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.5px" }}>Dispatch Breakdown</h4>
          <PieChart2 slices={slices} size={150} label="Stock" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 24 }}>
            {[
              { label: "Total Received", value: stockInQty, color: "#10b981" },
              { label: "B2B Dispatched", value: b2bQty, color: "#8b5cf6" },
              { label: "B2C Dispatched", value: b2cQty, color: "#0ea5e9" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center", padding: "12px 8px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 20, fontWeight: 800, color }}>{value}</p>
                <p style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", fontWeight: 600, marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>

          {itemTxns.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", marginBottom: 10 }}>Recent Activity</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                {itemTxns.slice(0, 8).map(tx => {
                  const isIn = tx.transaction_type === "stock_in";
                  const color = isIn ? "#10b981" : tx.dispatch_type === "b2b" ? "#8b5cf6" : "#0ea5e9";
                  return (
                    <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "var(--surface-2)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{tx.transaction_type?.replace("_", " ")}</span>
                        {tx.b2b_client_name && <span style={{ fontSize: 11, color: "var(--text-4)", marginLeft: 6 }}>→ {tx.b2b_client_name}</span>}
                        {tx.notes && !tx.b2b_client_name && <span style={{ fontSize: 11, color: "var(--text-4)", marginLeft: 6 }}>{tx.notes}</span>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{tx.quantity > 0 ? "+" : ""}{tx.quantity}</span>
                      <span style={{ fontSize: 10, color: "var(--text-4)" }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-IN") : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
