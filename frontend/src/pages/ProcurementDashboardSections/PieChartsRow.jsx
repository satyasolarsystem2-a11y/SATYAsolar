import React from "react";
import { PieChart, Building, BarChart3 } from "lucide-react";
import PieChart2 from "./PieChart2";
import { cardStyle } from "./dashboardConstants";

export default function PieChartsRow({ stockSlices, dispatchSlices, categorySlices, loading }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <PieChart size={15} color="#10b981" /> Stock Status
        </h3>
        {loading ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="animate-spin" style={{ width: 24, height: 24, border: "2px solid var(--border)", borderTopColor: "#10b981", borderRadius: "50%" }} />
          </div>
        ) : (
          <PieChart2 slices={stockSlices} size={130} label="Items" />
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <Building size={15} color="#8b5cf6" /> B2B vs B2C Dispatch
        </h3>
        {loading ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="animate-spin" style={{ width: 24, height: 24, border: "2px solid var(--border)", borderTopColor: "#8b5cf6", borderRadius: "50%" }} />
          </div>
        ) : dispatchSlices.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-4)", fontSize: 13 }}>No dispatches yet</div>
        ) : (
          <PieChart2 slices={dispatchSlices} size={130} label="Units" />
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={15} color="#2563EB" /> By Category
        </h3>
        {loading ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="animate-spin" style={{ width: 24, height: 24, border: "2px solid var(--border)", borderTopColor: "#2563EB", borderRadius: "50%" }} />
          </div>
        ) : (
          <PieChart2 slices={categorySlices} size={130} label="Items" />
        )}
      </div>
    </div>
  );
}
