import React from "react";
import { cardStyle } from "./dashboardConstants";

export default function DashboardStatCards({ stats, loading }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          style={{ ...cardStyle, padding: "16px", display: "flex", flexDirection: "column", gap: 12, transition: "transform 0.2s, box-shadow 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>{loading ? "—" : value}</p>
            <p style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 600, textTransform: "uppercase", marginTop: 4, letterSpacing: "0.4px" }}>{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
