import React from "react";
import { ShoppingCart, Plus, Package, Building, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cardStyle } from "./dashboardConstants";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div style={{ ...cardStyle, marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <ShoppingCart size={14} color="#2563EB" /> Quick Actions
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {[
          { label: "Add New Item", icon: Plus, color: "#2563EB", bg: "#eff6ff", path: "/procurement-portal", desc: "Add inventory item" },
          { label: "View Inventory", icon: Package, color: "#10b981", bg: "#ecfdf5", path: "/procurement-portal", desc: "Manage all stock" },
          { label: "B2B Dispatch", icon: Building, color: "#8b5cf6", bg: "#f5f3ff", path: "/procurement-portal", desc: "Process B2B orders" },
          { label: "Transaction Log", icon: ClipboardList, color: "#f59e0b", bg: "#fffbeb", path: "/procurement-portal", desc: "View stock movements" },
        ].map(({ label, icon: Icon, color, bg, path, desc }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            style={{ padding: "14px", borderRadius: 12, border: `1px solid ${color}20`, background: bg, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 20px ${color}25`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 10, color: "var(--text-4)" }}>{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
