import React, { useState, useEffect, useCallback, useRef } from "react";
import { edgeFetch, EDGE } from "../lib/supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  Clock,
  AlertOctagon,
  CheckCircle2,
  Layers,
  Plus,
  Filter,
  ChevronDown,
  Download,
  X,
  ClipboardCheck,
} from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CaseTable from "./CaseTable";
import CaseDrawer from "./CaseDrawer";
import Breadcrumbs from "./Breadcrumbs";
import Footer from "./Footer";

const DEPT_STAGES = {
  all: [],
  sales: ["Case Confirmed"],
  registration: [
    "Registration: Document Verification",
    "Registration: Government Portal",
    "Registration: Payment Verification"
  ],
  banking: ["Bank & Finance"],
  project: ["Project: Survey & Design", "Project: Installation"],
  warehouse: ["Warehouse: Material Dispatch"],
  electrical: ["Electrical: Net Metering"],
  accounts: ["Accounts: Payment Clearance"],
  subsidy: ["Subsidy Registration"],
  customer_service: ["Customer Service Update"],
  completed: ["Project Completed"],
};

const DEPT_LABELS = {
  all: "All Departments",
  sales: "Sales",
  registration: "Registration",
  banking: "Banking",
  project: "Project",
  warehouse: "Warehouse",
  electrical: "Electrical",
  accounts: "Accounts",
  subsidy: "Subsidy",
  customer_service: "Customer Service",
  completed: "Completed",
};

// Full pipeline order — used to determine if a case has moved PAST my dept's stage
const STAGE_ORDER = [
  "Case Confirmed",
  "Registration: Document Verification",
  "Registration: Government Portal",
  "Registration: Payment Verification",
  "Bank & Finance",
  "Project: Survey & Design",
  "Warehouse: Material Dispatch",
  "Project: Installation",
  "Electrical: Net Metering",
  "Accounts: Payment Clearance",
  "Subsidy Registration",
  "Customer Service Update",
  "Project Completed"
];

const roleStageMap = {
  admin: [],
  sales: ["Case Confirmed"],
  registration: [
    "Registration: Document Verification",
    "Registration: Government Portal",
    "Registration: Payment Verification"
  ],
  banking: ["Bank & Finance"],
  project: ["Project: Survey & Design", "Project: Installation"],
  warehouse: ["Warehouse: Material Dispatch"],
  electrical: ["Electrical: Net Metering"],
  accounts: ["Accounts: Payment Clearance"],
  subsidy: ["Subsidy Registration"],
  customer_service: ["Customer Service Update"],
};

// For dept-relative status filtering
const DEPT_STAGE_BOUNDS = {};
for (const [dept, stages] of Object.entries(DEPT_STAGES)) {
  if (dept === "all" || dept === "completed") {
    DEPT_STAGE_BOUNDS[dept] = { active: stages, past: [] };
    continue;
  }
  const lastActiveIdx = Math.max(...stages.map(s => STAGE_ORDER.indexOf(s)));
  DEPT_STAGE_BOUNDS[dept] = {
    active: stages,
    past: STAGE_ORDER.slice(lastActiveIdx + 1),
  };
}

const Cases = ({ onLogout }) => {
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");
  const [selectedCase, setSelectedCase] = useState(null);
  // ── Advanced Admin Filters ────────────────────────────────────────────────
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showAdvFilters, setShowAdvFilters] = useState(false);

  const navigate = useNavigate();
  const searchRef = useRef(null);
  const userRole = localStorage.getItem("role") || "";

  /* ── Fetch cases ── */
  const fetchCases = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const data = await edgeFetch(EDGE.workflow, { action: "get_all" });
      const mapped = data.map((c) => ({
        ...c,
        caseId: c.id || c.case_id || c.caseId,
        customerId: c.customer_id || c.customerId,
        trackingId: c.tracking_id || c.trackingId,
        customerName: c.customer_name || c.customerName,
        currentStage: c.current_stage || c.currentStage,
        assignedTeam: c.assigned_team || c.assignedTeam,
        stageStartTime: c.stage_start_time || c.stageStartTime,
        delayReason: c.delay_reason || c.delayReason,
        delayFlag: c.delay_flag || c.delayFlag,
        alternatePhone: c.alternate_phone || c.alternatePhone,
        loadRequired: c.load_required || c.loadRequired,
        paymentType: c.payment_type || c.paymentType,
        createdBy: c.created_by || c.createdBy,
        salesPerson: c.sales_person || c.salesPerson,
        // Drawer header info row
        phone: c.phone,
        address: c.address,
        // Financial
        consumerId: c.consumer_id || c.consumerId,
        loanAmount: c.loan_amount || c.loanAmount,
        bankName: c.bank_name || c.bankName,
        emiAmount: c.emi_amount || c.emiAmount,
        downPayment: c.down_payment || c.downPayment,
        cashAmount: c.cash_amount || c.cashAmount,
        paymentMode: c.payment_mode || c.paymentMode,
        assignedTo: c.assigned_to || c.assignedTo,
        // Subsidy
        subsidyRefNumber: c.subsidy_ref_number || c.subsidyRefNumber,
        subsidyNote: c.subsidy_note || c.subsidyNote,
        // Installation
        siteVisitDate: c.site_visit_date || c.siteVisitDate,
        installationNote: c.installation_note || c.installationNote,
        // Dispatch
        dispatchedItems: c.dispatched_items || c.dispatchedItems,
        dispatchVehicle: c.dispatch_vehicle || c.dispatchVehicle,
        dispatchDriver: c.dispatch_driver || c.dispatchDriver,
        dispatchDate: c.dispatch_date || c.dispatchDate,
        // Company / project
        companyName: c.company_name || c.companyName,
        projectType: c.project_type || c.projectType,
        employeeName: c.employee_name || c.employeeName,
        employeeId: c.employee_id || c.employeeId,
        gstin: c.gstin,
        // Quotation / system specs (used by dispatch tab to auto-detect items)
        system_specs: c.system_specs,
      }));
      setCases(mapped);
    } catch {
      toast.error("Could not load cases.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  /* ── Delete Case ── */
  const handleDeleteCase = async (caseId) => {
    try {
      await edgeFetch(EDGE.workflow, { action: "delete", caseId });
      toast.success("Case deleted successfully.");
      fetchCases();
    } catch (err) {
      toast.error(err.message || "Could not delete case.");
    }
  };

  /* ── CSV Export ── */
  const handleExportCSV = (filteredCases) => {
    if (!filteredCases || filteredCases.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const daysInStage = (t) => {
      if (!t) return "";
      const d = Math.floor((Date.now() - new Date(t)) / 86400000);
      return d === 0 ? "Today" : `${d} day${d !== 1 ? "s" : ""}`;
    };
    const stageToLabel = {
      "Quotation": "Sales",
      "Registration": "Registration",
      "Finance Clearance": "Finance",
      "Structure Dispatch": "Warehouse",
      "Structure Installed": "Field",
      "Kit Dispatched": "Warehouse",
      "Kit Installed": "Field",
      "Net Metering Filed": "Registration",
      "QA Inspected": "QA",
      "Subsidy Filed": "Subsidy",
      "Completed": "Completed",
    };
    // Dept-relative status for CSV (same logic as filters)
    const getDeptRelativeStatus = (c) => {
      const stage = c.currentStage || c.current_stage || "";
      const bounds =
        deptFilter !== "all" ? DEPT_STAGE_BOUNDS[deptFilter] : null;
      if (!bounds) return c.status || "";
      if (bounds.past.includes(stage) || stage === "Completed")
        return "Completed";
      if (bounds.active.includes(stage))
        return c.status === "Delayed" ? "Delayed" : "In Progress";
      return "Pending";
    };
    const activeFilterLabel =
      deptFilter !== "all" ? DEPT_LABELS[deptFilter] : "All";
    const headers = [
      "Customer ID",
      "Tracking ID",
      "Customer Name",
      "Phone",
      "Current Stage",
      "Department",
      "Overall Status",
      ...(deptFilter !== "all" ? [`${activeFilterLabel} Status`] : []),
      "Assigned Employee",
      "Time in Stage",
      "Created At",
    ];
    const rows = filteredCases.map((c) => [
      c.customerId || c.customer_id || "",
      c.trackingId || c.tracking_id || "",
      c.customerName || c.customer_name || "",
      c.phone || "",
      c.currentStage || c.current_stage || "",
      stageToLabel[c.currentStage || c.current_stage] || "",
      c.status || "",
      ...(deptFilter !== "all" ? [getDeptRelativeStatus(c)] : []),
      c.assignedTo || c.assigned_to || "",
      daysInStage(c.stageStartTime || c.stage_start_time),
      c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    const deptSuffix =
      deptFilter !== "all"
        ? `_${DEPT_LABELS[deptFilter].replace(/[^a-zA-Z0-9]/g, "_")}`
        : "";
    const statusSuffix = statusFilter !== "all" ? `_${statusFilter}` : "";
    link.download = `Cases_Export_${today}${deptSuffix}${statusSuffix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredCases.length} records to CSV`);
  };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e) => {
      // N → open new case (registration role only, if not already typing in an input)
      if (
        e.key === "n" &&
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA"
      ) {
        const role = (localStorage.getItem("role") || "").toLowerCase();
        if (role === "registration" || role === "admin") {
          e.preventDefault();
          navigate("/create-case");
        }
      }
      // / → focus search
      if (
        e.key === "/" &&
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  /* ── Filtering ── */
  const q = search.toLowerCase();
  const myStages = roleStageMap[userRole] || [];

  // The first stage index this department is responsible for
  const myFirstStageIdx =
    myStages.length > 0
      ? Math.min(...myStages.map((s) => STAGE_ORDER.indexOf(s)))
      : -1;

  const searched = cases.filter((c) => {
    // 1. Text search filter
    const matchesSearch =
      c.caseId?.toLowerCase().includes(q) ||
      c.trackingId?.toLowerCase().includes(q) ||
      c.customerId?.toLowerCase().includes(q) ||
      c.customerName?.toLowerCase().includes(q) ||
      c.currentStage?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // 2. Visibility filter (Don't show cases that haven't reached this department yet)
    if (userRole === "admin" || userRole === "sales") return true;
    if (myFirstStageIdx < 0) return true; // fallback for unknown roles

    const cIdx = STAGE_ORDER.indexOf(c.currentStage);
    return cIdx >= myFirstStageIdx || cIdx === -1;
  });

  // Role-aware tab helpers
  const myLastStageIdx =
    myStages.length > 0
      ? Math.max(...myStages.map((s) => STAGE_ORDER.indexOf(s)))
      : -1;

  const isAtMyStage = (c) => myStages.includes(c.currentStage);
  const isPastMyStage = (c) => {
    if (userRole === "admin") return c.status === "Completed";
    if (myLastStageIdx < 0) return false;
    const cIdx = STAGE_ORDER.indexOf(c.currentStage);
    return cIdx > myLastStageIdx;
  };

  const isInProgress = (c) => {
    if (userRole === "admin") return c.status === "In Progress";
    if (userRole === "finance") {
      const pt = (c.paymentType || c.payment_type || "").toLowerCase();
      return (
        isAtMyStage(c) &&
        (pt === "cash" || c.finance_final_status === "Approved")
      );
    }
    return isAtMyStage(c);
  };

  // ── Advanced Admin Filters (applied after tab) ───────────────────────────
  const applyAdvancedFilters = (list) => {
    if (userRole !== "admin") return list;
    let result = list;

    // Department filter — narrows to cases currently at these stages
    if (deptFilter !== "all") {
      const stages = DEPT_STAGES[deptFilter] || [];
      result = result.filter((c) =>
        stages.includes(c.currentStage || c.current_stage),
      );
    }

    // Status filter — dept-relative when a dept filter is active, global otherwise
    if (statusFilter !== "all") {
      const bounds =
        deptFilter !== "all" ? DEPT_STAGE_BOUNDS[deptFilter] : null;

      if (bounds) {
        // Dept-relative status logic:
        // in_progress → case is currently AT this dept's active stages
        // completed   → case has moved PAST this dept's stages
        // delayed     → case is at this dept's active stages AND marked Delayed
        if (statusFilter === "in_progress") {
          result = result.filter((c) => {
            const stage = c.currentStage || c.current_stage;
            return bounds.active.includes(stage) && c.status !== "Delayed";
          });
        } else if (statusFilter === "delayed") {
          result = result.filter((c) => {
            const stage = c.currentStage || c.current_stage;
            return bounds.active.includes(stage) && c.status === "Delayed";
          });
        } else if (statusFilter === "completed") {
          // Dept=Registration + Status=Completed means cases that have MOVED PAST registration.
          // We filter from the full searched list (to preserve text search) but ignore the
          // dept active-stage restriction — we want all cases past this dept.
          result = searched.filter((c) => {
            const stage = c.currentStage || c.current_stage;
            return bounds.past.includes(stage) || stage === "Completed";
          });
        }
      } else {
        // No dept filter — use global status
        if (statusFilter === "in_progress")
          result = result.filter((c) => c.status === "In Progress");
        if (statusFilter === "delayed")
          result = result.filter((c) => c.status === "Delayed");
        if (statusFilter === "completed")
          result = result.filter((c) => c.status === "Completed");
      }
    }

    // Date range filter (by created_at)
    if (fromDate) {
      const from = new Date(fromDate);
      result = result.filter(
        (c) => c.created_at && new Date(c.created_at) >= from,
      );
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter(
        (c) => c.created_at && new Date(c.created_at) <= to,
      );
    }

    return result;
  };

  const tabFiltered = applyAdvancedFilters(
    (() => {
      if (activeTab === "assigned") return searched.filter(c => c.assignedTo === localStorage.getItem("name"));
      if (activeTab === "mystage") return searched.filter(isAtMyStage);
      if (activeTab === "active") return searched.filter(isInProgress);
      if (activeTab === "delayed")
        return searched.filter((c) => c.status === "Delayed");
      if (activeTab === "completed") return searched.filter(isPastMyStage);
      return searched;
    })(),
  );

  const hasActiveAdvFilters =
    deptFilter !== "all" || statusFilter !== "all" || fromDate || toDate;
  const clearAdvFilters = () => {
    setDeptFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const tabs = [
    { id: "all", label: "All Customers", icon: Layers, count: searched.length },
    {
      id: "assigned",
      label: "Assigned Tasks",
      icon: ClipboardCheck,
      count: searched.filter((c) => c.assignedTo === localStorage.getItem("name")).length,
    },
    {
      id: "active",
      label: "In Progress",
      icon: Clock,
      count: searched.filter(isInProgress).length,
    },
    {
      id: "delayed",
      label: "Delayed",
      icon: AlertOctagon,
      count: searched.filter((c) => c.status === "Delayed").length,
    },
    {
      id: "completed",
      label: "Completed",
      icon: CheckCircle2,
      count: searched.filter(isPastMyStage).length,
    },
  ];

  if (loading)
    return (
      <div className="main-loading">
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid var(--border)",
              borderTopColor: "var(--brand)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ fontSize: "13px", color: "var(--text-4)" }}>
            Loading cases…
          </p>
        </div>
      </div>
    );

  const delayedCount = cases.filter((c) => c.status === "Delayed").length;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--page-bg)",
      }}
    >
      <Sidebar onLogout={onLogout} />

      <main
        style={{
          flex: 1,
          marginLeft: "var(--main-offset)",
          padding: "28px 32px",
        }}
      >
        <Breadcrumbs />
        <Header
          title="Customers"
          subtitle="Track and manage all solar installation customers"
          onLogout={onLogout}
        />

        {/* ── Daily alert banner ── */}
        {delayedCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              marginBottom: "16px",
              borderRadius: "10px",
              background: "rgba(244,63,94,0.06)",
              border: "1px solid rgba(244,63,94,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#f43f5e",
                  boxShadow: "0 0 0 3px rgba(244,63,94,0.2)",
                  animation: "pulseRing 1.8s ease-in-out infinite",
                }}
              />
              <span
                style={{ fontSize: "13px", fontWeight: 600, color: "#be123c" }}
              >
                {delayedCount} customer{delayedCount !== 1 ? "s" : ""} need
                attention today
              </span>
            </div>
            <button
              onClick={() => setActiveTab("delayed")}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#be123c",
                background: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.2)",
                borderRadius: "6px",
                padding: "5px 12px",
                cursor: "pointer",
              }}
            >
              View delayed →
            </button>
          </div>
        )}

        {/* ── Controls row ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {/* Search box */}
            <div
              style={{
                position: "relative",
                flex: "1 1 220px",
                maxWidth: "380px",
              }}
            >
              <Search
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "14px",
                  height: "14px",
                  color: "var(--text-4)",
                  pointerEvents: "none",
                }}
              />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search name, ID, phone…  /"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: "36px", fontSize: "13px" }}
              />
            </div>

            {/* Right side: Admin filter toggle + New Case */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {userRole === "admin" && (
                <button
                  onClick={() => setShowAdvFilters((v) => !v)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    transition: "all 0.15s",
                    background:
                      showAdvFilters || hasActiveAdvFilters
                        ? "#eef2ff"
                        : "var(--surface)",
                    color:
                      showAdvFilters || hasActiveAdvFilters
                        ? "#4338ca"
                        : "var(--text-3)",
                    border: `1px solid ${showAdvFilters || hasActiveAdvFilters ? "#c7d2fe" : "var(--border)"}`,
                  }}
                >
                  <Filter style={{ width: "13px", height: "13px" }} />
                  Filters
                  {hasActiveAdvFilters && (
                    <span
                      style={{
                        fontSize: "10px",
                        background: "#4338ca",
                        color: "#fff",
                        padding: "1px 6px",
                        borderRadius: "10px",
                        fontWeight: 700,
                      }}
                    >
                      ON
                    </span>
                  )}
                  <ChevronDown
                    style={{
                      width: "12px",
                      height: "12px",
                      transform: showAdvFilters ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
              )}
              {["admin", "finance", "accounts"].includes(userRole) && (
                <button
                  onClick={() => handleExportCSV(tabFiltered)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-3)",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ecfdf5";
                    e.currentTarget.style.color = "#15803d";
                    e.currentTarget.style.borderColor = "#bbf7d0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface)";
                    e.currentTarget.style.color = "var(--text-3)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <Download style={{ width: "13px", height: "13px" }} />
                  Export CSV
                </button>
              )}
              {userRole === "sales" && (
                <button
                  onClick={() => navigate("/create-case")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(37,99,235,0.3)",
                  }}
                >
                  <Plus style={{ width: "16px", height: "16px" }} />
                  New Customer
                </button>
              )}
            </div>
          </div>

          {/* ── Admin Advanced Filter Panel ── */}
          {userRole === "admin" && showAdvFilters && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "12px",
                flexWrap: "wrap",
                padding: "16px",
                borderRadius: "12px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* Department */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flex: "1 1 160px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Department
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="input"
                  style={{
                    fontSize: "12.5px",
                    paddingTop: "7px",
                    paddingBottom: "7px",
                  }}
                >
                  {Object.entries(DEPT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              {/* Status */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flex: "1 1 140px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input"
                  style={{
                    fontSize: "12.5px",
                    paddingTop: "7px",
                    paddingBottom: "7px",
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="in_progress">In Progress</option>
                  <option value="delayed">Delayed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              {/* From Date */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flex: "1 1 140px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input"
                  style={{
                    fontSize: "12.5px",
                    paddingTop: "7px",
                    paddingBottom: "7px",
                  }}
                />
              </div>
              {/* To Date */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flex: "1 1 140px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="input"
                  style={{
                    fontSize: "12.5px",
                    paddingTop: "7px",
                    paddingBottom: "7px",
                  }}
                />
              </div>
              {/* Clear */}
              {hasActiveAdvFilters && (
                <button
                  onClick={clearAdvFilters}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #fecdd3",
                    background: "#fff1f2",
                    color: "#be123c",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    alignSelf: "flex-end",
                  }}
                >
                  <X style={{ width: "12px", height: "12px" }} /> Clear
                </button>
              )}
              {/* Result count */}
              <div
                style={{
                  alignSelf: "flex-end",
                  fontSize: "12px",
                  color: "var(--text-4)",
                  whiteSpace: "nowrap",
                  paddingBottom: "8px",
                }}
              >
                {tabFiltered.length} result{tabFiltered.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div
            className="hide-scrollbar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "4px",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Filter
              style={{
                width: "14px",
                height: "14px",
                color: "var(--text-4)",
                flexShrink: 0,
                marginRight: "4px",
              }}
            />
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  background:
                    activeTab === tab.id
                      ? tab.id === "delayed"
                        ? "#fff1f2"
                        : tab.id === "mystage"
                          ? "#eef2ff"
                          : tab.id === "completed"
                            ? "#ecfdf5"
                            : tab.id === "active"
                              ? "#fffbeb"
                              : "var(--brand)"
                      : "var(--surface)",
                  color:
                    activeTab === tab.id
                      ? tab.id === "delayed"
                        ? "#be123c"
                        : tab.id === "mystage"
                          ? "#4338ca"
                          : tab.id === "completed"
                            ? "#15803d"
                            : tab.id === "active"
                              ? "#b45309"
                              : "#fff"
                      : "var(--text-3)",
                  border: `1px solid ${activeTab === tab.id ? "transparent" : "var(--border)"}`,
                  boxShadow:
                    activeTab === tab.id
                      ? "0 2px 8px rgba(0,0,0,0.05)"
                      : "none",
                }}
              >
                {tab.icon && (
                  <tab.icon
                    style={{
                      width: "13px",
                      height: "13px",
                      flexShrink: 0,
                      color:
                        activeTab === tab.id
                          ? tab.id === "delayed"
                            ? "#be123c"
                            : tab.id === "mystage"
                              ? "#4338ca"
                              : tab.id === "completed"
                                ? "#15803d"
                                : tab.id === "active"
                                  ? "#b45309"
                                  : "#fff"
                          : "var(--text-4)",
                    }}
                  />
                )}
                {tab.label}
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    minWidth: "20px",
                    textAlign: "center",
                    background:
                      activeTab === tab.id
                        ? "rgba(255,255,255,0.25)"
                        : "var(--surface-2)",
                    padding: "1px 6px",
                    borderRadius: "20px",
                    color: activeTab === tab.id ? "inherit" : "var(--text-4)",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* (Keyboard shortcut hint card removed) */}

        <CaseTable
          cases={tabFiltered}
          onUpdateClick={setSelectedCase}
          onDeleteClick={handleDeleteCase}
        />

        {tabFiltered.length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-4)",
              fontSize: "13px",
              marginTop: "24px",
            }}
          >
            No customers match <strong>"{search || activeTab}"</strong>
          </p>
        )}

        <Footer />
      </main>

      {/* ── Slide-in Drawer ── */}
      {selectedCase && (
        <CaseDrawer
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onRefresh={() => {
            fetchCases();
            setSelectedCase(null);
          }}
        />
      )}
    </div>
  );
};

export default Cases;
