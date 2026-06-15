import React from "react";
import { Package, RefreshCw, Box } from "lucide-react";
import { cardStyle, PALETTE } from "./dashboardConstants";

export default function ItemDrillDownList({ inventory, transactions, loading, fetchData, setSelectedItem }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={15} color="#f59e0b" /> Item-wise Dispatch Breakdown
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", background: "var(--surface-2)", padding: "3px 8px", borderRadius: 20, marginLeft: 4 }}>
            Click any item to see Pie Chart
          </span>
        </h3>
        <button onClick={fetchData} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)" }}>
          <RefreshCw size={14} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {loading ? (
          <p style={{ color: "var(--text-4)", fontSize: 13 }}>Loading...</p>
        ) : (
          inventory.map((item, idx) => {
            const itemTxns = transactions.filter(t => t.inventory_id === item.id || t.inventory_name === item.name);
            const b2bQ = itemTxns.filter(t => t.dispatch_type === "b2b").reduce((s, t) => s + Math.abs(t.quantity), 0);
            const b2cQ = itemTxns.filter(t => t.dispatch_type === "b2c" || (t.transaction_type === "stock_out" && !t.dispatch_type)).reduce((s, t) => s + Math.abs(t.quantity), 0);
            const isOut = item.stock === 0;
            const isLow = !isOut && item.low_stock_threshold && item.stock <= item.low_stock_threshold;
            
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  padding: "14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: `1px solid ${isOut ? "#fecaca" : isLow ? "#fde68a" : "var(--border)"}`,
                  background: isOut ? "#fef2f2" : isLow ? "#fffbeb" : "var(--surface-2)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${PALETTE[idx % PALETTE.length]}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box size={16} color={PALETTE[idx % PALETTE.length]} />
                  </div>
                  <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: isOut ? "#fecaca" : isLow ? "#fde68a" : "#d1fae5", color: isOut ? "#dc2626" : isLow ? "#b45309" : "#065f46" }}>
                    {isOut ? "Out" : isLow ? "Low" : "OK"}
                  </span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.name}
                </p>
                <p style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 8 }}>{item.category}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "#f5f3ff", color: "#8b5cf6", fontWeight: 700 }}>B2B: {b2bQ}</span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "#f0f9ff", color: "#0ea5e9", fontWeight: 700 }}>B2C: {b2cQ}</span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "#ecfdf5", color: "#10b981", fontWeight: 700 }}>Stock: {item.stock}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
