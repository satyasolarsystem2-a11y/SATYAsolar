import React from "react";
import { Search, RefreshCw, Eye, Edit, Plus, Minus } from "lucide-react";
import { cardStyle, isLow, isOut } from "./procurementConstants";

const InventoryTable = ({ ctx }) => {
  const {
    tab,
    loading,
    search,
    setSearch,
    fetchInventory,
    filtered,
    handleViewItem,
    handleEditItem,
    setAdjustingItem,
    setAdjustType,
  } = ctx;

  if (tab !== "dashboard") return null;

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
          Inventory Catalog
        </h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-4)",
              }}
              size={14}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, category..."
              className="input"
              style={{ paddingLeft: 32, width: 280, fontSize: 13 }}
            />
          </div>
          <button
            onClick={fetchInventory}
            className="btn btn-ghost btn-sm"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div
            className="animate-spin"
            style={{
              width: 28,
              height: 28,
              border: "2px solid var(--border)",
              borderTopColor: "var(--brand)",
              borderRadius: "50%",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "var(--text-4)", fontSize: 13 }}>
            Loading inventory…
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrap hide-on-mobile" style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category / Brand</th>
                  <th>SKU / Model</th>
                  <th>Capacity</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Safety / WH</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const low = isLow(item);
                  const out = isOut(item);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        background: out ? "#fef2f2" : low ? "#fffbeb" : "transparent",
                      }}
                    >
                      <td style={{ fontWeight: 600, color: "var(--text-1)" }}>
                        {item.name}
                      </td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
                          {item.category}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-4)" }}>
                          {item.brand || "N/A"}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            fontSize: 12,
                            fontFamily: "monospace",
                            background: "var(--surface-2)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            display: "inline-block",
                          }}
                        >
                          {item.sku || "N/A"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>
                          {item.model_number || "N/A"}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-3)" }}>
                        {item.capacity || "—"}
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: out ? "#ef4444" : low ? "#f59e0b" : "#10b981",
                          fontSize: 14,
                        }}
                      >
                        {item.stock}{" "}
                        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-4)" }}>
                          {item.unit}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#8b5cf6", fontSize: 13 }}>
                        {item.reserved_quantity || 0}
                      </td>
                      <td>
                        <div style={{ fontSize: 11, color: "var(--text-4)" }}>
                          Min: {item.low_stock_threshold || 0}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-4)" }}>
                          WH: {item.warehouse_location || "—"}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background: out ? "#fecaca" : low ? "#fde68a" : "#d1fae5",
                            color: out ? "#991b1b" : low ? "#92400e" : "#065f46",
                          }}
                        >
                          {out ? "Out of Stock" : low ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => handleViewItem(item)}
                            className="btn btn-ghost btn-sm"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="btn btn-ghost btn-sm"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustType("add");
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ color: "#10b981" }}
                            title="Add Stock"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustType("deduct");
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ color: "#ef4444" }}
                            title="Deduct Stock"
                          >
                            <Minus size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{ textAlign: "center", padding: 40, color: "var(--text-4)" }}
                    >
                      No matching inventory items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
            {filtered.map((item) => {
              const low = isLow(item);
              const out = isOut(item);
              return (
                <div
                  key={item.id}
                  style={{
                    background: out ? "#fef2f2" : low ? "#fffbeb" : "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-1)", fontSize: 15 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
                        {item.category} • {item.brand || "No Brand"}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: out ? "#fecaca" : low ? "#fde68a" : "#d1fae5",
                        color: out ? "#991b1b" : low ? "#92400e" : "#065f46",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {out ? "Out of Stock" : low ? "Low Stock" : "In Stock"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      background: "var(--surface-2)",
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", fontWeight: 600 }}>
                        SKU / Model
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500, fontFamily: "monospace" }}>
                        {item.sku || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", fontWeight: 600 }}>
                        Capacity
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>
                        {item.capacity || "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", fontWeight: 600 }}>
                        Available
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: out ? "#ef4444" : low ? "#f59e0b" : "#10b981" }}>
                        {item.stock} <span style={{ fontSize: 11 }}>{item.unit}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", fontWeight: 600 }}>
                        Reserved
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#8b5cf6" }}>
                        {item.reserved_quantity || 0}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                    <button onClick={() => handleViewItem(item)} className="btn btn-outline" style={{ flex: 1, padding: "8px" }}>
                      <Eye size={16} /> View
                    </button>
                    <button onClick={() => handleEditItem(item)} className="btn btn-outline" style={{ flex: 1, padding: "8px" }}>
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setAdjustingItem(item);
                        setAdjustType("add");
                      }}
                      className="btn btn-outline"
                      style={{ padding: "8px", color: "#10b981", borderColor: "#10b981", flex: "0 0 auto" }}
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setAdjustingItem(item);
                        setAdjustType("deduct");
                      }}
                      className="btn btn-outline"
                      style={{ padding: "8px", color: "#ef4444", borderColor: "#ef4444", flex: "0 0 auto" }}
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-4)", background: "var(--surface-2)", borderRadius: "var(--radius-lg)" }}>
                No matching inventory items found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryTable;
