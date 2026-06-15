// ─────────────────────────────────────────────────────────────────────────────
// CreateCase — Shared constants, lookup tables, helpers, and mini-components
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Plus, Minus } from "lucide-react";

// ── kW range (1–500) ─────────────────────────────────────────────────────────
export const KW500 = Array.from({ length: 500 }, (_, i) => `${i + 1}kW`);

// ── Wire options ──────────────────────────────────────────────────────────────
export const WIRE_CORE = ["Copper", "Aluminium"];
export const WIRE_ARMOUR = ["Armoured", "Unarmoured"];

// ── Panel brands & categories ─────────────────────────────────────────────────
export const BRANDS = [
  "Tata Power Solar Panel",
];

export const BLANK_BRANDS = [];

export const PRODUCT_CATEGORIES = ["Topcon", "Bifacial", "EV Charger"];
export const SUB_CATEGORIES = ["Off Grid", "On Grid", "Hybrid", "On Grid Commercial"];

// ── Component specs ───────────────────────────────────────────────────────────
export const WIRE_MAKES = ["Polycab", "Havells", "KEI", "Finolex"];
export const WIRE_SIZES = ["2", "3", "4", "6"];
export const STRUCTURE_BRANDS = ["Jindal", "Apollo"];
export const STRUCTURE_SIZES = ["80mm"];
export const BATTERY_BRANDS = ["Luminous", "Exide", "Sarotech"];
export const BATTERY_CAPACITIES = ["150Ah", "200Ah"];

// ── Pricing / wattage lookup ──────────────────────────────────────────────────
export const BRAND_WATT = {
  "Tata Power Solar Panel": 545,
};

export const BRAND_PRICE_PER_PANEL = {
  "Tata Power Solar Panel": 13000,
};

// ── GTI inverter map per brand ────────────────────────────────────────────────
export const GTI_MAP = {
  "Tata Power Solar Panel": ["Solis", "GoodWe", "Sofar", "Approved by Tata"],
};

export const DEFAULT_GTI = ["Solis", "GoodWe", "Sofar", "Approved by Tata"];
export const getGTI = (brand) => GTI_MAP[brand] || DEFAULT_GTI;

// ── Warranty options ──────────────────────────────────────────────────────────
export const BATTERY_OPTIONS = [
  { label: "Luminous 150Ah", capacity: 150, price: 15000 },
  { label: "Luminous 200Ah", capacity: 200, price: 19000 },
  { label: "Exide 150Ah", capacity: 150, price: 15000 },
  { label: "Exide 200Ah", capacity: 200, price: 19000 },
  { label: "Sarotech 150Ah", capacity: 150, price: 15000 },
  { label: "Sarotech 200Ah", capacity: 200, price: 19000 },
];

export const BAT_WARR = [
  "0 Years", "2 Years", "4 Years", "5 Years", "10 Years",
  "12 Years", "15 Years", "20 Years", "25 Years",
  "36+24 Months", "60 Months",
];

export const STRUCTURES = ["Jindal 80mm", "Apollo 80mm"];
export const PANEL_WARR = ["25 Years", "30 Years"];

// ── Blank form initial state ──────────────────────────────────────────────────
export const INIT = {
  customerMode: "", customerId: "", customerName: "", mobile: "", email: "",
  address: "", electricalDivision: "", electricalNo: "", electricalLoad: "",
  productCategory: "", subCategory: "", panelBrand: "", productName: "",
  panelUnit: "", panelCount: 0, totalWatt: 0, totalPrice: 0, panelWarranty: "",
  gtiInverter: "", inverterKw: "", inverterWarranty: "", inverterPrice: 0,
  batteryBrand: "", batteryCapacity: "", batteryQty: 0, batteryWarranty: "",
  totalBatCapacity: 0, totalBatPrice: 0, structureBrand: "", structureSize: "",
  bos: "Complete Set", wire_core_material: "", wire_armouring: "", wireMake: "",
  wireSize: "", earthing: "", installation: "Added", productPrice: "",
  recheckPrice: "", employeeId: "", employeeName: "", employeeEmail: "",
};

// ── Auto-derive product name ──────────────────────────────────────────────────
export const getProductName = (brand, prodCat, subCat) => {
  if (!brand || !prodCat || !subCat || BLANK_BRANDS.includes(brand)) return "";
  const short = brand.replace(" Solar Panel", "");
  return `${short} ${prodCat} ${subCat} Solar Panel`;
};

// ── Shared style tokens ───────────────────────────────────────────────────────
export const S = {
  page: { padding: "24px 16px", fontFamily: "Plus Jakarta Sans, Inter, sans-serif", width: "100%", maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" },
  hdr: { background: "linear-gradient(135deg, var(--brand) 0%, #1e1b4b 100%)", borderRadius: "20px", padding: "32px", color: "#fff", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.4)", position: "relative", overflow: "hidden" },
  card: { background: "var(--surface)", borderRadius: "20px", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05), 0 0 1px rgba(0,0,0,0.1)", padding: "28px", border: "1px solid var(--border)", transition: "all 0.3s ease" },
  sh: { display: "flex", alignItems: "center", gap: 14, fontSize: 17, fontWeight: 800, color: "var(--text-1)", paddingBottom: 16, marginBottom: 24, letterSpacing: 0.3, borderBottom: "1px dashed var(--border-2)" },
  shNum: { width: 32, height: 32, background: "linear-gradient(135deg, var(--brand), #818cf8)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800, boxShadow: "0 4px 10px rgba(79, 70, 229, 0.2)" },
  g2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 },
  g3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 },
  lbl: { display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  inp: { width: "100%", padding: "16px 18px", border: "2px solid var(--border-2)", borderRadius: "14px", fontSize: 15, fontWeight: 500, boxSizing: "border-box", outline: "none", background: "var(--page-bg)", transition: "all 0.2s ease", color: "var(--text-1)", boxShadow: "none" },
  sel: { width: "100%", padding: "16px 18px", border: "2px solid var(--border-2)", borderRadius: "14px", fontSize: 15, fontWeight: 500, boxSizing: "border-box", outline: "none", background: "var(--page-bg)", cursor: "pointer", transition: "all 0.2s ease", color: "var(--text-1)" },
  ro: { width: "100%", padding: "16px 18px", border: "2px dashed var(--border-2)", borderRadius: "14px", fontSize: 15, fontWeight: 600, boxSizing: "border-box", background: "var(--surface-2)", color: "var(--text-4)" },
  info: { fontSize: 13, fontWeight: 700, color: "var(--brand)", marginTop: 12, display: "inline-block", padding: "8px 14px", background: "var(--brand-dim)", borderRadius: 8, border: "1px solid rgba(79, 70, 229, 0.1)" },
  ctr: { display: "flex", alignItems: "center", gap: 16, marginTop: 6, background: "var(--page-bg)", padding: "8px", borderRadius: "14px", width: "fit-content", border: "1px solid var(--border-2)" },
  cbtn: { width: 40, height: 40, borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, boxShadow: "0 4px 10px rgba(79, 70, 229, 0.2)", transition: "all 0.2s" },
  cnum: { fontSize: 18, fontWeight: 800, minWidth: 48, textAlign: "center", color: "var(--text-1)" },
  sub: { width: "100%", padding: "18px", background: "linear-gradient(135deg, var(--brand), #818cf8)", color: "#fff", border: "none", borderRadius: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16, boxShadow: "0 8px 20px -4px rgba(79, 70, 229, 0.4)", transition: "all 0.3s ease" },
  req: { color: "var(--rose)" },
};

// ── Reusable micro-components ─────────────────────────────────────────────────

export const SectionHeader = ({ num, title }) => (
  <div style={S.sh}>
    <div style={S.shNum}>{num}</div>
    <div>{title}</div>
  </div>
);

export const Ctr = ({ value, onChange }) => (
  <div style={S.ctr}>
    <button type="button" style={S.cbtn} onClick={() => onChange(Math.max(0, value - 1))}>
      <Minus size={12} />
    </button>
    <span style={S.cnum}>{value}</span>
    <button type="button" style={S.cbtn} onClick={() => onChange(value + 1)}>
      <Plus size={12} />
    </button>
  </div>
);

export const F = ({ label, req, children }) => (
  <div>
    <label style={S.lbl}>
      {label}
      {req && <span style={S.req}> *</span>}
    </label>
    {children}
  </div>
);
