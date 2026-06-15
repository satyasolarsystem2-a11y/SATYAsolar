import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardAlertBanner({ outOfStockItems, lowStockItems, loading }) {
  const navigate = useNavigate();

  if (loading || (outOfStockItems.length === 0 && lowStockItems.length === 0)) return null;

  return (
    <div style={{ background: outOfStockItems.length > 0 ? "#fef2f2" : "#fef3c7", border: `1px solid ${outOfStockItems.length > 0 ? "#fecaca" : "#fcd34d"}`, borderRadius: "var(--radius-lg)", padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <AlertTriangle size={18} color={outOfStockItems.length > 0 ? "#dc2626" : "#b45309"} />
        <p style={{ fontWeight: 700, color: outOfStockItems.length > 0 ? "#991b1b" : "#92400e", fontSize: 13 }}>
          {outOfStockItems.length > 0 ? `${outOfStockItems.length} items out of stock. ` : ""}
          {lowStockItems.length > 0 ? `${lowStockItems.length} items low on stock.` : ""}
        </p>
      </div>
      <button
        onClick={() => navigate("/procurement-portal")}
        style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: outOfStockItems.length > 0 ? "#dc2626" : "#b45309", color: "#fff", display: "flex", alignItems: "center", gap: 5 }}
      >
        Manage <ArrowRight size={13} />
      </button>
    </div>
  );
}
