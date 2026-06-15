import React from "react";
import { AlertTriangle } from "lucide-react";

const LowStockAlert = ({ ctx }) => {
  const { lowStockItems, outOfStockItems } = ctx;

  if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: outOfStockItems.length > 0 ? "#fef2f2" : "#fef3c7",
        border: `1px solid ${outOfStockItems.length > 0 ? "#fecaca" : "#fcd34d"}`,
        borderRadius: "var(--radius-lg)",
        padding: "14px 20px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <AlertTriangle
        style={{
          color: outOfStockItems.length > 0 ? "#dc2626" : "#b45309",
          flexShrink: 0,
        }}
        size={20}
      />
      <div>
        <p
          style={{
            fontWeight: 700,
            color: outOfStockItems.length > 0 ? "#991b1b" : "#92400e",
            fontSize: 14,
          }}
        >
          ⚠ Warning:{" "}
          {outOfStockItems.length > 0
            ? `${outOfStockItems.length} items OUT OF STOCK. `
            : ""}
          {lowStockItems.length > 0
            ? `${lowStockItems.length} items below minimum safety threshold.`
            : ""}
        </p>
        <p
          style={{
            color: outOfStockItems.length > 0 ? "#dc2626" : "#b45309",
            fontSize: 12,
            marginTop: 2,
          }}
        >
          Please restock these items to avoid project delays.
        </p>
      </div>
    </div>
  );
};

export default LowStockAlert;
