import React from "react";
import {
  Package,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Truck,
  Building,
} from "lucide-react";
import { cardStyle } from "./procurementConstants";

const TopCards = ({ ctx }) => {
  const {
    totalItems,
    totalStockValue,
    lowStockItems,
    outOfStockItems,
    b2cDispatches,
    b2bDispatches,
  } = ctx;

  const cardsData = [
    { label: "Total Items", value: totalItems, icon: Package, color: "#2563EB" },
    { label: "Stock Value", value: `₹${totalStockValue.toLocaleString()}`, icon: DollarSign, color: "#10b981" },
    { label: "Low Stock", value: lowStockItems.length, icon: TrendingDown, color: "#f59e0b" },
    { label: "Out of Stock", value: outOfStockItems.length, icon: AlertTriangle, color: "#ef4444" },
    { label: "B2C Dispatches", value: b2cDispatches, icon: Truck, color: "#8b5cf6" },
    { label: "B2B Dispatches", value: b2bDispatches, icon: Building, color: "#0ea5e9" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 16,
        marginBottom: 24,
      }}
    >
      {cardsData.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          style={{
            ...cardStyle,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
              background: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} color={color} />
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)" }}>
              {value}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-4)",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopCards;
