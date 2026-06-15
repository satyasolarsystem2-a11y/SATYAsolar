import React, { useState, useEffect } from "react";
import { supabase, edgeFetch, EDGE } from "../lib/supabaseClient";
import { toast } from "react-hot-toast";
import {
  Plus,
  Minus,
  Send,
} from "lucide-react";
import { APP_CONFIG } from "../config";
import ManualTypeDropdown from "./ManualTypeDropdown";

// Extended to 500kW — supports large commercial/industrial systems
const KW500 = Array.from({ length: 500 }, (_, i) => `${i + 1}kW`);

// Wire specification options (replaces free-text wiring field)
const WIRE_CORE = ["Copper", "Aluminium"];
const WIRE_ARMOUR = ["Armoured", "Unarmoured"];

const BRANDS = ["Tata Power Solar Panel"];
const BLANK_BRANDS = [];
const PRODUCT_CATEGORIES = ["Topcon", "Bifacial"];
const SUB_CATEGORIES = ["Off Grid", "On Grid", "Hybrid", "On Grid Commercial"];

const WIRE_MAKES = ["Polycab", "Havells", "KEI", "Finolex"];
const WIRE_SIZES = ["2 Sq mm", "3 Sq mm", "4 Sq mm", "6 Sq mm"];
const STRUCTURE_BRANDS = ["Jindal", "Apollo"];
const STRUCTURE_SIZES = ["80mm"];
const BATTERY_BRANDS = ["Luminous", "Exide", "Sarotech"];
const BATTERY_CAPACITIES = ["150Ah", "200Ah"];

const getProductName = (brand, prodCat, subCat) => {
  if (!brand || !prodCat || !subCat || BLANK_BRANDS.includes(brand)) return "";
  const short = brand.replace(" Solar Panel", "");
  return `${short} ${prodCat} ${subCat} Solar Panel`;
};

const GTI_MAP = {
  "Tata Power Solar Panel": ["Solis", "GoodWe", "Sofar", "Approved by Tata"],
};
const DEFAULT_GTI = ["Solis", "GoodWe", "Sofar", "Approved by Tata"];
const getGTI = (brand) => GTI_MAP[brand] || DEFAULT_GTI;

const BAT_WARR = [
  "0 Years",
  "2 Years",
  "4 Years",
  "5 Years",
  "10 Years",
  "12 Years",
  "15 Years",
  "20 Years",
  "25 Years",
  "36+24 Months",
  "60 Months",
];
const STRUCTURES = ["Jindal 80mm", "Apollo 80mm"]; // eslint-disable-line no-unused-vars
const PANEL_WARR = ["25 Years", "30 Years"];

const INIT = {
  customerMode: "",
  customerId: "",
  customerName: "",
  mobile: "",
  email: "",
  address: "",
  electricalDivision: "",
  electricalNo: "",
  electricalLoad: "",
  productCategory: "",
  subCategory: "",
  panelBrand: "",
  productName: "",
  panelUnit: "",
  panelCount: 0,
  totalWatt: 0,
  totalPrice: 0,
  panelWarranty: "",
  gtiInverter: "",
  inverterKw: "",
  inverterWarranty: "",
  inverterPrice: 0,
  batteryBrand: "",
  batteryCapacity: "",
  batteryQty: 0,
  batteryWarranty: "",
  totalBatCapacity: 0,
  totalBatPrice: 0,
  structureBrand: "",
  structureSize: "",
  bos: "Complete Set",
  wire_core_material: "",
  wire_armouring: "",
  wireMake: "",
  wireSize: "",
  earthing: "",
  installation: "Added",
  productPrice: "",
  recheckPrice: "",
  evCharger: "",
  employeeId: "",
  employeeName: "",
  employeeEmail: "",
};

// Per-brand per-kW watt & price lookup (2 panels per kW, watt varies by brand)
const BRAND_WATT = {
  "Tata Power Solar Panel": 545,
};
const BRAND_PRICE_PER_PANEL = {
  "Tata Power Solar Panel": 13000,
};

// ── Styles & sub-components defined OUTSIDE to prevent re-creation on render ──
const S = {
  page: {
    padding: "24px 16px",
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  hdr: {
    background: "linear-gradient(135deg, var(--brand) 0%, #1e1b4b 100%)",
    borderRadius: "20px",
    padding: "32px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 20,
    boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.4)",
    position: "relative",
    overflow: "hidden",
  },
  card: {
    background: "var(--surface)",
    borderRadius: "20px",
    boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05), 0 0 1px rgba(0,0,0,0.1)",
    padding: "28px",
    border: "1px solid var(--border)",
    transition: "all 0.3s ease",
  },
  sh: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: 17,
    fontWeight: 800,
    color: "var(--text-1)",
    paddingBottom: 16,
    marginBottom: 24,
    letterSpacing: 0.3,
    borderBottom: "1px dashed var(--border-2)",
  },
  shNum: {
    width: 32,
    height: 32,
    background: "linear-gradient(135deg, var(--brand), #818cf8)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    boxShadow: "0 4px 10px rgba(79, 70, 229, 0.2)",
  },
  g2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  g3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
  },
  lbl: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text-2)",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inp: {
    width: "100%",
    padding: "16px 18px",
    border: "2px solid var(--border-2)",
    borderRadius: "14px",
    fontSize: 15,
    fontWeight: 500,
    boxSizing: "border-box",
    outline: "none",
    background: "var(--page-bg)",
    transition: "all 0.2s ease",
    color: "var(--text-1)",
    boxShadow: "none",
  },
  sel: {
    width: "100%",
    padding: "16px 18px",
    border: "2px solid var(--border-2)",
    borderRadius: "14px",
    fontSize: 15,
    fontWeight: 500,
    boxSizing: "border-box",
    outline: "none",
    background: "var(--page-bg)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "var(--text-1)",
  },
  ro: {
    width: "100%",
    padding: "16px 18px",
    border: "2px dashed var(--border-2)",
    borderRadius: "14px",
    fontSize: 15,
    fontWeight: 600,
    boxSizing: "border-box",
    background: "var(--surface-2)",
    color: "var(--text-4)",
  },
  info: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--brand)",
    marginTop: 12,
    display: "inline-block",
    padding: "8px 14px",
    background: "var(--brand-dim)",
    borderRadius: 8,
    border: "1px solid rgba(79, 70, 229, 0.1)",
  },
  ctr: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginTop: 6,
    background: "var(--page-bg)",
    padding: "8px",
    borderRadius: "14px",
    width: "fit-content",
    border: "1px solid var(--border-2)",
  },
  cbtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "none",
    background: "var(--brand)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    boxShadow: "0 4px 10px rgba(79, 70, 229, 0.2)",
    transition: "all 0.2s",
  },
  cnum: {
    fontSize: 18,
    fontWeight: 800,
    minWidth: 48,
    textAlign: "center",
    color: "var(--text-1)",
  },
  sub: {
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg, var(--brand), #818cf8)",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
    boxShadow: "0 8px 20px -4px rgba(79, 70, 229, 0.4)",
    transition: "all 0.3s ease",
  },
  req: { color: "var(--rose)" },
};

const SectionHeader = ({ num, title }) => (
  <div style={S.sh}>
    <div style={S.shNum}>{num}</div>
    <div>{title}</div>
  </div>
);

const Ctr = ({ value, onChange }) => (
  <div style={S.ctr}>
    <button
      type="button"
      style={S.cbtn}
      onClick={() => onChange(Math.max(0, value - 1))}
    >
      <Minus size={12} />
    </button>
    <span style={S.cnum}>{value}</span>
    <button type="button" style={S.cbtn} onClick={() => onChange(value + 1)}>
      <Plus size={12} />
    </button>
  </div>
);

const F = ({ label, req, children }) => (
  <div>
    <label style={S.lbl}>
      {label}
      {req && <span style={S.req}> *</span>}
    </label>
    {children}
  </div>
);

export default function QuotationForm() {
  const [f, setF] = useState(INIT);
  const [customers, setCust] = useState([]);
  const [loading, setLoad] = useState(false);
  const [wattMappings, setWattMappings] = useState({});

  useEffect(() => {
    // Load admin-defined wattage mappings from DB (kW value → watt override)
    supabase
      .from("wattage_mappings")
      .select("kw_value, watt_value")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) {
          const map = {};
          data.forEach((r) => {
            map[r.kw_value] = r.watt_value;
          });
          setWattMappings(map);
        }
      })
      .catch(() => {}); // silent — fall back to brand defaults
  }, []);

  useEffect(() => {
    const loadUserAndCustomers = async () => {
      // 1. Auto-fill logged-in sales employee details
      const id = localStorage.getItem("userId") || "";
      const name = localStorage.getItem("name") || "";
      const localEmpId = localStorage.getItem("employeeId");

      // Fetch email and employee_id from session/db
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = user?.email || "";

      let finalEmpId = localEmpId || "";

      // If we don't have the short EMP-XXXX id in localStorage, fetch it from profiles
      if (!localEmpId || localEmpId === "N/A") {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("employee_id")
            .eq("id", id)
            .single();
          if (profile?.employee_id) {
            finalEmpId = profile.employee_id;
            localStorage.setItem("employeeId", finalEmpId);
          } else {
            finalEmpId = "EMP-XXXX"; // Fallback
          }
        } catch (e) {
          finalEmpId = "EMP-XXXX";
        }
      }

      setF((p) => ({
        ...p,
        employeeId: finalEmpId,
        employeeName: name,
        employeeEmail: email,
      }));
      // and they can just select "New Customer".
      try {
        const all = await edgeFetch(EDGE.admin, { action: "list_users" });
        if (all) setCust(all.filter((u) => u.role === "customer"));
      } catch (err) {
        // Silently ignore 403. User can manually type New Customer.
      }
    };

    loadUserAndCustomers();
  }, []);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const onProdCat = (cat) => {
    setF((p) => ({
      ...p,
      productCategory: cat,
      productName: getProductName(p.panelBrand, cat, p.subCategory),
    }));
  };

  const onSubCat = (cat) => {
    setF((p) => ({
      ...p,
      subCategory: cat,
      productName: getProductName(p.panelBrand, p.productCategory, cat),
    }));
  };

  const onBrand = (brand) => {
    setF((p) => ({
      ...p,
      panelBrand: brand,
      productName: getProductName(brand, p.productCategory, p.subCategory),
      gtiInverter: "",
      ...recalc(brand, p.panelUnit),
    }));
  };

  const recalc = (brand, unit) => {
    if (!brand || !unit) return {};
    const kw = parseInt(unit);
    if (!kw) return {};
    const panels = kw * 2;
    const watt = BRAND_WATT[brand] || 545;
    // Use admin-defined wattage mapping if available, else brand default
    const totalWatt = wattMappings[kw] ? wattMappings[kw] : panels * watt;
    const price = BRAND_PRICE_PER_PANEL[brand] || 11000;
    return { panelCount: panels, totalWatt, totalPrice: panels * price };
  };

  const onPanelUnit = (unit) => {
    setF((p) => ({ ...p, panelUnit: unit, ...recalc(p.panelBrand, unit) }));
  };

  const onPanelCount = (n) => {
    const price = BRAND_PRICE_PER_PANEL[f.panelBrand] || 11000;
    const watt = BRAND_WATT[f.panelBrand] || 545;
    setF((p) => ({
      ...p,
      panelCount: n,
      totalWatt: n * watt,
      totalPrice: n * price,
    }));
  };

  const onEmployee = (id) => { // eslint-disable-line no-unused-vars
    setF((p) => ({
      ...p,
      employeeId: id,
    }));
  };

  const onCustomer = (id) => {
    if (!id) {
      setF((p) => ({
        ...p,
        customerMode: "",
        customerId: "",
        customerName: "",
        mobile: "",
        email: "",
        address: "",
      }));
      return;
    }
    if (id === "new") {
      setF((p) => ({
        ...p,
        customerMode: "new",
        customerId: "",
        customerName: "",
        mobile: "",
        email: "",
        address: "",
      }));
      return;
    }
    const c = customers.find((x) => x.id === id);
    setF((p) => ({
      ...p,
      customerMode: "existing",
      customerId: id,
      customerName: c?.name || "",
      mobile: c?.mobile || "",
      email: c?.email || "",
      address: c?.address || "",
    }));
  };

  const onInverterKw = (kw) => {
    const num = parseInt(String(kw).replace(/kW$/i, ""), 10) || 0;
    setF((p) => ({ ...p, inverterKw: kw, inverterPrice: num * 9000 }));
  };

  const updateBatteryVals = (bBrand, bCap, qty) => {
    const capNum = parseInt(String(bCap).replace(/Ah$/i, ""), 10) || 0;
    let price = 0;
    if (capNum === 150) price = 15000;
    else if (capNum === 200) price = 19000;
    else price = capNum * 100;

    setF((p) => ({
      ...p,
      batteryBrand: bBrand,
      batteryCapacity: bCap,
      batteryQty: qty,
      totalBatCapacity: qty * capNum,
      totalBatPrice: qty * price,
    }));
  };

  const priceOk =
    f.productPrice && f.recheckPrice && f.productPrice === f.recheckPrice;
  const showBat = f.subCategory === "Off Grid" || f.subCategory === "Hybrid";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!f.email) {
      toast.error("Customer Email ID is required!");
      return;
    }
    if (!priceOk) {
      toast.error("Prices do not match!");
      return;
    }
    setLoad(true);
    try {
      const token = localStorage.getItem("token"); // eslint-disable-line no-unused-vars

      // Map flat form state → nested schema expected by backend
        const buildWiring = () => {
          if (!f.wireSize && !f.wireMake && !f.wire_core_material && !f.wire_armouring) return "";
          const sizeStr = f.wireSize ? f.wireSize.replace(/sq mm/i, "").trim() : "";
          
          let res = sizeStr ? `${sizeStr} Square MM<br/>` : "";
          res += `(Havells/Polycap/KEI)`;
          
          let extra = f.wire_core_material || "";
          if (f.wire_armouring) extra += (extra ? " - " : "") + f.wire_armouring;
          
          if (extra) {
            res += `<br/>(${extra})`;
          }
          return res;
        };

        const payload = {
          action: "create",
          customerName: f.customerName,
          customerMobile: f.mobile,
          customerEmail: f.email,
          customerAddress: f.address,
          electricalDivision: f.electricalDivision,
          electricalNumber: f.electricalNo,
          electricalLoad: f.electricalLoad,
          productCategory: f.subCategory, // mapped for backward compatibility
          productBrand: f.panelBrand,
          productName: f.productName || f.panelBrand,
          panelUnit: f.panelUnit,
          panelCount: f.panelCount,
          totalWatt: f.totalWatt,
          productPrice: Number(f.productPrice),
          panelWarranty: f.panelWarranty,
          inverterBrand: f.gtiInverter,
          inverterKw: f.inverterKw,
          inverterWarranty: f.inverterWarranty,
          inverterPrice: Number(f.inverterPrice) || 0,
          batteryBrand:
            f.batteryBrand && f.batteryCapacity
              ? `${f.batteryBrand} ${f.batteryCapacity}`.trim()
              : null,
          batteryCount: f.batteryQty || 0,
          batteryWarranty: f.batteryWarranty || null,
          batteryCapacity: f.totalBatCapacity || 0,
          batteryPrice: f.totalBatPrice || 0,
          structure: f.structureBrand
            ? `${f.structureBrand} ${f.structureSize ? (f.structureSize.toLowerCase().endsWith('mm') ? f.structureSize : f.structureSize + ' mm') : ''}`.trim()
            : "",
          bos: f.bos,
          wiring: buildWiring(),
          wireCoreM: `${f.wireMake || ""} ${f.wire_core_material || ""} ${f.wireSize || ""}`.trim(),
          wireArmouring: f.wire_armouring,
          earthing: f.earthing ? String(f.earthing) : "",
          evCharger: f.evCharger,
          installation: f.installation,
          employeeId: f.employeeId,
          employeeName: f.employeeName,
          employeeEmail: f.employeeEmail,
        };

      await edgeFetch(EDGE.quotation, payload);
      toast.success(`✅ Quotation submitted! PDF sent to ${f.email}`);
      setF(INIT);
    } catch (err) {
      toast.error(err.message || "Submission failed");
    } finally {
      setLoad(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <img
          src={APP_CONFIG.logoPath}
          alt={`${APP_CONFIG.companyName} Logo`}
          style={{ height: 45, width: "auto" }}
        />
        <div>
          <div style={{ fontSize: 21, fontWeight: 800 }}>
            Solar Quotation Form
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Generate professional solar project quotations
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── 1. Customer ── */}
        <div style={S.card}>
          <SectionHeader num="1" title="Customer Information" />
          <div style={{ ...S.g2, marginBottom: 14 }}>
            <F label="Customer Name/ID/Mobile" req>
              <select
                style={S.sel}
                value={
                  f.customerMode === "existing" ? f.customerId : f.customerMode
                }
                onChange={(e) => onCustomer(e.target.value)}
              >
                <option value="">Select Customer</option>
                <option value="new">New Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.mobile || c.email}
                  </option>
                ))}
              </select>
            </F>
            <F label="Mobile Number" req>
              <input
                style={S.inp}
                type="tel"
                value={f.mobile}
                onChange={(e) => set("mobile", e.target.value)}
                required
                readOnly={f.customerMode === "existing"}
              />
            </F>
          </div>
          <div style={{ ...S.g2, marginBottom: 14 }}>
            <F label="Customer Name" req>
              <input
                style={S.inp}
                value={f.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                required
                readOnly={f.customerMode === "existing"}
              />
            </F>
            <F label="Address" req>
              <input
                style={S.inp}
                value={f.address}
                onChange={(e) => set("address", e.target.value)}
                required
                readOnly={f.customerMode === "existing"}
              />
            </F>
          </div>
          <div style={S.g2}>
            <F label="Email ID" req>
              <input
                style={S.inp}
                type="email"
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
                readOnly={f.customerMode === "existing"}
                required
              />
            </F>
            <div style={S.g2}>
              <F label="Electrical Division" req>
                <input
                  style={S.inp}
                  value={f.electricalDivision}
                  onChange={(e) => set("electricalDivision", e.target.value)}
                  required
                />
              </F>
              <F label="Electrical Number" req>
                <input
                  style={S.inp}
                  value={f.electricalNo}
                  onChange={(e) => set("electricalNo", e.target.value)}
                  required
                />
              </F>
            </div>
          </div>
        </div>

        {/* ── 2. Technical Specs ── */}
        <div style={S.card}>
          <SectionHeader num="2" title="Technical Specifications" />
          <div style={S.g2}>
            <F label="Electrical Load" req>
              <ManualTypeDropdown
                options={KW500}
                value={f.electricalLoad}
                onChange={(v) => set("electricalLoad", v)}
                placeholder="Select Load"
                customLabel="Custom Load"
                required
                style={S.sel}
              />
            </F>
            <F label="Product Category" req>
              <select
                style={S.sel}
                value={f.productCategory}
                onChange={(e) => onProdCat(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </F>
            <F label="Sub Category" req>
              <select
                style={S.sel}
                value={f.subCategory}
                onChange={(e) => onSubCat(e.target.value)}
                required
              >
                <option value="">Select Sub Category</option>
                {SUB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </F>
          </div>
        </div>

        {/* ── 3. Panel & Brand ── */}
        <div style={S.card}>
          <SectionHeader num="3" title="Panel &amp; Brand Details" />
          <div style={{ ...S.g2, marginBottom: 14 }}>
            <F label="Panel Brand" req>
              <ManualTypeDropdown
                options={BRANDS}
                value={f.panelBrand}
                onChange={(v) => onBrand(v)}
                placeholder="Select Brand"
                customLabel="Custom Brand"
                required
                style={S.sel}
              />
            </F>
            <F label="Product Name">
              <input
                style={S.ro}
                value={f.productName}
                readOnly
                placeholder="Auto-filled from brand + category"
              />
            </F>
          </div>
          <div style={S.g2}>
            <F label="Panel Unit (kW)" req>
              <ManualTypeDropdown
                options={KW500}
                value={f.panelUnit}
                onChange={(v) => onPanelUnit(v)}
                placeholder="Select Panel Unit"
                customLabel="Custom Panel Unit"
                required
                style={S.sel}
              />
            </F>
            <div>
              <F label="Number of Panels">
                <Ctr value={f.panelCount} onChange={onPanelCount} />
              </F>
              <div style={{ marginTop: 14 }}>
                <F label="Total Wattage">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      style={{ ...S.inp, flex: 1 }}
                      type="number"
                      value={f.totalWatt}
                      onChange={(e) => set("totalWatt", Number(e.target.value))}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text-3)",
                      }}
                    >
                      W
                    </span>
                  </div>
                </F>
              </div>
              <div style={S.info}>
                Total Panel Price: ₹{f.totalPrice.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Warranty & Inverter ── */}
        <div style={S.card}>
          <SectionHeader num="4" title="Warranty &amp; Inverter" />
          <div style={S.g2}>
            <F label="Panel Warranty">
              <ManualTypeDropdown
                options={PANEL_WARR}
                value={f.panelWarranty}
                onChange={(v) => set("panelWarranty", v)}
                placeholder="Select Warranty"
                customLabel="Custom Warranty"
                style={S.sel}
              />
            </F>
            <F label="GTI Inverter" req>
              <ManualTypeDropdown
                options={getGTI(f.panelBrand)}
                value={f.gtiInverter}
                onChange={(v) => set("gtiInverter", v)}
                placeholder="Select GTI Inverter"
                customLabel="Custom GTI Inverter"
                required
                style={S.sel}
              />
            </F>
            <F label="Inverter kW" req>
              <ManualTypeDropdown
                options={KW500}
                value={f.inverterKw}
                onChange={onInverterKw}
                placeholder="Select kW"
                customLabel="Custom Inverter kW"
                required
                style={S.sel}
              />
            </F>
            <div>
              <F label="Inverter Price (₹)">
                <input
                  style={S.inp}
                  type="number"
                  value={f.inverterPrice}
                  onChange={(e) => set("inverterPrice", Number(e.target.value))}
                  placeholder="Estimated Price"
                />
              </F>
              <div style={{ ...S.info, marginTop: 8 }}>
                Total Inverter Price: ₹{(f.inverterPrice || 0).toLocaleString()}
              </div>
            </div>
            <F label="Inverter Warranty (Years)">
              <input
                style={S.inp}
                type="number"
                min="0"
                value={f.inverterWarranty}
                onChange={(e) => set("inverterWarranty", e.target.value)}
                placeholder="e.g. 5"
              />
            </F>
          </div>
        </div>

        {/* ── 5. System Components & Extras ── */}
        <div style={S.card}>
          <SectionHeader num="5" title="System Components &amp; Extras" />
          {showBat ? (
            <div style={{ ...S.g2, marginBottom: 14 }}>
              <div>
                <F label="Battery Brand">
                  <ManualTypeDropdown
                    options={BATTERY_BRANDS}
                    value={f.batteryBrand}
                    onChange={(v) =>
                      updateBatteryVals(
                        v,
                        f.batteryCapacity,
                        Math.max(1, f.batteryQty || 1),
                      )
                    }
                    placeholder="Select Battery Brand"
                    customLabel="Custom Brand"
                    style={S.sel}
                  />
                </F>
                <div style={{ marginTop: 14 }}>
                  <F label="Battery Capacity (Ah)">
                    <ManualTypeDropdown
                      options={BATTERY_CAPACITIES}
                      value={f.batteryCapacity}
                      onChange={(v) =>
                        updateBatteryVals(
                          f.batteryBrand,
                          v,
                          Math.max(1, f.batteryQty || 1),
                        )
                      }
                      placeholder="Select Capacity"
                      customLabel="Custom Capacity"
                      style={S.sel}
                    />
                  </F>
                </div>
                {f.batteryBrand && f.batteryCapacity && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "#eff6ff",
                      borderRadius: 8,
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      Price per battery:{" "}
                      <strong style={{ color: "#1d4ed8" }}>
                        &#8377;
                        {(
                          f.totalBatPrice / (f.batteryQty || 1) || 0
                        ).toLocaleString()}
                      </strong>
                    </div>
                    <div style={S.info}>
                      Total Capacity: {f.totalBatCapacity} Ah
                    </div>
                    <div style={S.info}>
                      Total Battery Price: &#8377;
                      {f.totalBatPrice.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <F label="Number of Batteries">
                  <Ctr
                    value={f.batteryQty}
                    onChange={(qty) =>
                      updateBatteryVals(f.batteryBrand, f.batteryCapacity, qty)
                    }
                  />
                </F>
                <div style={{ marginTop: 14 }}>
                  <F label="Battery Warranty">
                    <ManualTypeDropdown
                      options={BAT_WARR}
                      value={f.batteryWarranty}
                      onChange={(v) => set("batteryWarranty", v)}
                      placeholder="Select Warranty"
                      customLabel="Custom Warranty"
                      style={S.sel}
                    />
                  </F>
                </div>
              </div>
            </div>
          ) : (
            f.subCategory && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#eff6ff",
                  borderRadius: 8,
                  color: "#2563eb",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 14,
                  border: "1px solid #dbeafe",
                }}
              >
                ✓ Battery not required for <strong>{f.subCategory}</strong>{" "}
                systems
              </div>
            )
          )}
          <div style={S.g3}>
            <div>
              <F label="Structure Brand">
                <ManualTypeDropdown
                  options={STRUCTURE_BRANDS}
                  value={f.structureBrand}
                  onChange={(v) => set("structureBrand", v)}
                  placeholder="Select Structure Brand"
                  customLabel="Custom Brand"
                  style={S.sel}
                />
              </F>
              {f.structureBrand && (
                <div style={{ marginTop: 10 }}>
                  <F label="Structure Size (mm)">
                    <ManualTypeDropdown
                      options={STRUCTURE_SIZES}
                      value={f.structureSize}
                      onChange={(v) => set("structureSize", v)}
                      placeholder="Select Size"
                      customLabel="Custom Size"
                      style={S.sel}
                    />
                  </F>
                </div>
              )}
            </div>
            <F label="BOS (Balance of System)">
              <input style={S.ro} value={f.bos} readOnly />
            </F>
            <div>
              <F label="Wire Brand">
                <ManualTypeDropdown
                  options={WIRE_MAKES}
                  value={f.wireMake}
                  onChange={(v) => set("wireMake", v)}
                  placeholder="Select Brand"
                  customLabel="Custom Brand"
                  style={S.sel}
                />
              </F>
              <div style={{ marginTop: 10 }}>
                <F label="Wire Size (sq mm)">
                  <ManualTypeDropdown
                    options={WIRE_SIZES}
                    value={f.wireSize}
                    onChange={(v) => set("wireSize", v)}
                    placeholder="Select Size"
                    customLabel="Custom Size"
                    style={S.sel}
                  />
                </F>
              </div>
              <div style={{ marginTop: 10 }}>
                <F label="Wire Material">
                  <select
                    style={S.sel}
                    value={f.wire_core_material}
                    onChange={(e) => set("wire_core_material", e.target.value)}
                  >
                    <option value="">Select Material</option>
                    {WIRE_CORE.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </F>
              </div>
              <div style={{ marginTop: 10 }}>
                <F label="Armored / Unarmored">
                  <select
                    style={S.sel}
                    value={f.wire_armouring}
                    onChange={(e) => set("wire_armouring", e.target.value)}
                  >
                    <option value="">Select Option</option>
                    {WIRE_ARMOUR.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </F>
              </div>
            </div>
          </div>
          <div style={{ ...S.g2, marginTop: 14 }}>
            <F label="Earthing">
              <input
                style={S.inp}
                type="number"
                value={f.earthing}
                onChange={(e) => set("earthing", Number(e.target.value))}
                placeholder="e.g. 2"
              />
            </F>
            <F label="EV Charger (Optional)">
              <select
                style={S.sel}
                value={f.evCharger}
                onChange={(e) => set("evCharger", e.target.value)}
              >
                <option value="">None</option>
                <option value="7kW">7kW</option>
                <option value="11kW">11kW</option>
                <option value="22kW">22kW</option>
              </select>
            </F>
          </div>
          <div style={{ marginTop: 14 }}>
            <F label="Installation & Net Metering">
              <input style={S.ro} value={f.installation} readOnly />
            </F>
          </div>
        </div>

        {/* ── 6. Pricing & Employee ── */}
        <div style={S.card}>
          <SectionHeader num="6" title="Final Submission" />
          <div style={{ ...S.g2, marginBottom: 14 }}>
            <F label="Product Price Quote (₹)" req>
              <input
                style={{
                  ...S.inp,
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#16a34a",
                }}
                type="number"
                min="0"
                placeholder="Enter final price"
                value={f.productPrice}
                onChange={(e) => set("productPrice", e.target.value)}
                required
              />
            </F>
            <F label="Re-check Product Price (₹)" req>
              <input
                style={{
                  ...S.inp,
                  fontSize: 17,
                  fontWeight: 700,
                  borderColor: f.recheckPrice
                    ? priceOk
                      ? "#16a34a"
                      : "#ef4444"
                    : "#d1d5db",
                  color: f.recheckPrice
                    ? priceOk
                      ? "#16a34a"
                      : "#ef4444"
                    : "#111",
                }}
                type="number"
                min="0"
                placeholder="Re-enter to verify"
                value={f.recheckPrice}
                onChange={(e) => set("recheckPrice", e.target.value)}
                required
              />
              {f.recheckPrice && (
                <p
                  style={{
                    fontSize: 12,
                    marginTop: 3,
                    color: priceOk ? "#16a34a" : "#ef4444",
                  }}
                >
                  {priceOk ? "✓ Match" : "⚠ No match"}
                </p>
              )}
            </F>
          </div>
          <div style={S.g3}>
            <F label="Employee ID">
              <input
                style={S.ro}
                value={f.employeeId}
                readOnly
                placeholder="Auto-filled"
              />
            </F>
            <F label="Employee Name">
              <input
                style={S.ro}
                value={f.employeeName}
                readOnly
                placeholder="Auto-filled"
              />
            </F>
            <F label="Employee Email">
              <input
                style={S.ro}
                value={f.employeeEmail}
                readOnly
                placeholder="Auto-filled"
              />
            </F>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ ...S.sub, opacity: loading ? 0.6 : 1 }}
        >
          <Send size={16} />
          {loading ? "Submitting…" : "Submit Quotation"}
        </button>
      </form>
    </div>
  );
}
