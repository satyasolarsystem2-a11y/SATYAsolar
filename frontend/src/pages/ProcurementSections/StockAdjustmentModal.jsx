import React from "react";
import { X } from "lucide-react";

const StockAdjustmentModal = ({ ctx }) => {
  const {
    adjustingItem,
    setAdjustingItem,
    adjustType,
    adjustQty,
    setAdjustQty,
    adjustNotes,
    setAdjustNotes,
    adjustSaving,
    handleAdjustmentSubmit,
  } = ctx;

  if (!adjustingItem) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "450px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {adjustType === "add" ? "Add Stock" : "Deduct Stock"}
          </h2>
          <button
            onClick={() => setAdjustingItem(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleAdjustmentSubmit}
          style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#475569" }}>
              Item: <strong style={{ color: "#0f172a" }}>{adjustingItem.name}</strong>
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Current Stock: <strong>{adjustingItem.stock} {adjustingItem.unit}</strong>
            </p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              Quantity to {adjustType === "add" ? "Add" : "Deduct"} *
            </label>
            <input
              type="number"
              required
              min="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="e.g. 10"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              Notes / Reference
            </label>
            <textarea
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder={adjustType === "add" ? "e.g. Received new shipment" : "e.g. Broken or misplaced stock"}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                background: "#fff",
                boxSizing: "border-box",
                minHeight: "60px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={() => setAdjustingItem(null)}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
              disabled={adjustSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: adjustType === "add" ? "#10b981" : "#ef4444", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              disabled={adjustSaving}
            >
              {adjustSaving ? "Saving..." : adjustType === "add" ? "Add Stock" : "Deduct Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
