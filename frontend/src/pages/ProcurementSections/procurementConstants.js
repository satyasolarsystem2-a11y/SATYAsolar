// ─────────────────────────────────────────────────────────────────────────────
// Procurement Portal — Shared constants and helpers
// ─────────────────────────────────────────────────────────────────────────────

export const LOW_STOCK_THRESHOLD = 0.3;

export const tabStyle = (active) => ({
  padding: "10px 20px",
  borderRadius: "var(--radius-md)",
  border: "none",
  cursor: "pointer",
  fontWeight: active ? 700 : 500,
  fontSize: 13,
  background: active ? "var(--color-primary)" : "var(--surface-2)",
  color: active ? "#fff" : "var(--text-2)",
  transition: "all 0.2s ease",
});

export const cardStyle = {
  background: "var(--surface)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  padding: "20px",
  boxShadow: "var(--shadow-sm)",
};

export const getPct = (item) => {
  if (!item.initial_stock || item.initial_stock === 0) return 100;
  return Math.min(100, Math.round((item.stock / item.initial_stock) * 100));
};

export const isLow = (item) => {
  if (item.low_stock_threshold) return item.stock <= item.low_stock_threshold;
  return getPct(item) <= LOW_STOCK_THRESHOLD * 100;
};

export const isOut = (item) => item.stock === 0;
