import React from "react";
import { Users, Building, Truck, ChevronUp, ChevronDown, Package } from "lucide-react";
import { cardStyle, PALETTE } from "./dashboardConstants";

export default function CustomerDispatchSection({ customerData, dispatchFilter, setDispatchFilter, loading, b2bCustomersCount, b2cCustomersCount, expandedCustomer, setExpandedCustomer }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={15} color="#2563EB" /> Dispatch Customers
        </h3>
        <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 10, padding: 4, gap: 2 }}>
          {[
            { key: "all", label: "All", count: b2bCustomersCount + b2cCustomersCount },
            { key: "b2b", label: "B2B", count: b2bCustomersCount },
            { key: "b2c", label: "B2C", count: b2cCustomersCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setDispatchFilter(key)}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                background: dispatchFilter === key ? (key === "b2b" ? "#8b5cf6" : key === "b2c" ? "#0ea5e9" : "var(--color-primary)") : "transparent",
                color: dispatchFilter === key ? "#fff" : "var(--text-3)",
                transition: "all 0.2s"
              }}
            >
              {label} <span style={{ fontSize: 10, opacity: 0.8 }}>({count})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div className="animate-spin" style={{ width: 24, height: 24, border: "2px solid var(--border)", borderTopColor: "#2563EB", borderRadius: "50%", margin: "0 auto" }} />
        </div>
      ) : customerData.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Users size={32} color="var(--text-4)" style={{ margin: "0 auto 12px", display: "block" }} />
          <p style={{ color: "var(--text-4)", fontSize: 13 }}>
            No {dispatchFilter === "all" ? "" : dispatchFilter.toUpperCase() + " "} dispatches found
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {customerData.map((customer, idx) => {
            const isB2B = customer.type === "B2B";
            const color = isB2B ? "#8b5cf6" : "#0ea5e9";
            const bg = isB2B ? "#f5f3ff" : "#f0f9ff";
            const border = isB2B ? "#ddd6fe" : "#bae6fd";
            const isExpanded = expandedCustomer === `${customer.type}-${customer.name}`;

            const itemsDispatched = {};
            customer.txns.forEach(tx => {
              const name = tx.inventory_name || "Unknown Item";
              if (!itemsDispatched[name]) itemsDispatched[name] = 0;
              itemsDispatched[name] += Math.abs(tx.quantity);
            });

            return (
              <div key={`${customer.type}-${customer.name}-${idx}`} style={{ borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden" }}>
                <div
                  onClick={() => setExpandedCustomer(isExpanded ? null : `${customer.type}-${customer.name}`)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: bg, cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(0.97)"}
                  onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isB2B ? <Building size={18} color={color} /> : <Truck size={18} color={color} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer.name}</p>
                      <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: color, color: "#fff" }}>{customer.type}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>
                      {customer.txns.length} dispatch{customer.txns.length !== 1 ? "es" : ""} · {Object.keys(itemsDispatched).length} item type{Object.keys(itemsDispatched).length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color }}>{customer.totalQty}</p>
                    <p style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 600 }}>units</p>
                  </div>
                  {isExpanded ? <ChevronUp size={16} color="var(--text-4)" /> : <ChevronDown size={16} color="var(--text-4)" />}
                </div>

                {isExpanded && (
                  <div style={{ padding: "12px 16px", background: "var(--surface)", borderTop: `1px solid ${border}` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", marginBottom: 10, letterSpacing: "0.5px" }}>Items Dispatched</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginBottom: 14 }}>
                      {Object.entries(itemsDispatched).map(([itemName, qty], i) => (
                        <div key={itemName} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${PALETTE[i % PALETTE.length]}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Package size={14} color={PALETTE[i % PALETTE.length]} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{itemName}</p>
                            <p style={{ fontSize: 11, color, fontWeight: 700 }}>{qty} units</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", marginBottom: 8 }}>Dispatch History</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {customer.txns.map((tx) => (
                        <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "var(--surface-2)", fontSize: 12 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: "var(--text-1)", flex: 1 }}>{tx.inventory_name}</span>
                          <span style={{ fontWeight: 800, color }}>{Math.abs(tx.quantity)} units</span>
                          <span style={{ color: "var(--text-4)", whiteSpace: "nowrap" }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
