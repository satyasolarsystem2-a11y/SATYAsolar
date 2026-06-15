import React, { useState } from "react";
import {
  Edit3,
  Phone,
  CheckCircle2,
  FolderOpen,
  Clock,
  Copy,
  AlertTriangle,
} from "lucide-react";

// ── Escalation level config ───────────────────────────────────────────────────
// Maps escalation_level 0-3 → display. 0 = no badge shown.
const ESCALATION_CONFIG = {
  3: { label: "Critical", bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  2: { label: "Urgent", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  1: { label: "Watch", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
};

const EscalationBadge = ({ c }) => {
  const level = c.escalation_level;
  if (!level) return null;
  const cfg = ESCALATION_CONFIG[level];
  if (!cfg) return null;

  const role = (localStorage.getItem("role") || "").toLowerCase();
  const userName = (localStorage.getItem("name") || "").toLowerCase();

  const currentStage = c.current_stage || c.currentStage;
  // Fallback map in case stageToRole is not yet evaluated
  const deptMap = {
    "Case Confirmed": "sales",
    "Registration Pending": "registration",
    "Registration Approved": "registration",
    "Survey Completed": "project",
    "Design & BOM Approved": "project",
    "Material Reserved": "warehouse",
    "Structure Installed": "project",
    "Full Installation Completed": "project",
    "Net Metering Completed": "electrical",
    "Payment Cleared": "accounts",
    "Subsidy Closed": "subsidy",
    "Project Completed": "admin",
  };
  const deptInCharge = deptMap[currentStage];

  const isDeptInCharge = deptInCharge === role;
  const caseSalesPerson = (c.salesPerson || c.sales_person || "").toLowerCase();
  const isSalesPerson = Boolean(
    userName && caseSalesPerson && caseSalesPerson === userName,
  );
  const isAdmin = role === "admin";

  if (!isDeptInCharge && !isSalesPerson && !isAdmin) return null;

  const deptName = deptInCharge
    ? deptInCharge.charAt(0).toUpperCase() +
      deptInCharge.slice(1).replace("_", " ")
    : "Unknown Dept";
  const assignedSales =
    c.salesPerson || c.sales_person || "Unknown Sales Person";
  const delayReason =
    c.delayReason || c.delay_reason || "No specific reason provided";
  const delayBy = c.markedDelayedBy || c.marked_delayed_by || "";

  const tooltipText = `Pending at: ${deptName}\nEmployee: ${assignedSales}\n${delayBy ? `Marked by: ${delayBy}\n` : ""}Reason: ${delayReason}`;

  return (
    <span
      title={tooltipText}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "10px",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: "20px",
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
        flexShrink: 0,
        cursor: "help",
      }}
    >
      <AlertTriangle style={{ width: "9px", height: "9px" }} />
      {cfg.label}
    </span>
  );
};

// Full pipeline order
const STAGES = [
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
  "Project Completed",
];

// Which role owns write access at each stage
const stageToRole = {
  "Case Confirmed": "sales",
  "Registration: Document Verification": "registration",
  "Registration: Government Portal": "registration",
  "Registration: Payment Verification": "registration",
  "Bank & Finance": "banking",
  "Project: Survey & Design": "project",
  "Warehouse: Material Dispatch": "warehouse",
  "Project: Installation": "project",
  "Electrical: Net Metering": "electrical",
  "Accounts: Payment Clearance": "accounts",
  "Subsidy Registration": "subsidy",
  "Customer Service Update": "customer_service",
  "Project Completed": "admin",
};

// The last stage each role is responsible for
const roleLastStage = {
  sales: "Case Confirmed",
  registration: "Registration: Payment Verification",
  banking: "Bank & Finance",
  project: "Project: Installation",
  warehouse: "Warehouse: Material Dispatch",
  electrical: "Electrical: Net Metering",
  accounts: "Accounts: Payment Clearance",
  subsidy: "Subsidy Registration",
  customer_service: "Customer Service Update",
};

// Human-readable department label for each stage (used by admin view)
const stageToDeptLabel = {
  "Case Confirmed": "Sales Dept",
  "Registration: Document Verification": "Registration Dept",
  "Registration: Government Portal": "Registration Dept",
  "Registration: Payment Verification": "Registration Dept",
  "Bank & Finance": "Banking Dept",
  "Project: Survey & Design": "Project Dept",
  "Warehouse: Material Dispatch": "Warehouse Dept",
  "Project: Installation": "Project Dept",
  "Electrical: Net Metering": "Electrical Dept",
  "Accounts: Payment Clearance": "Accounts Dept",
  "Subsidy Registration": "Subsidy Dept",
  "Customer Service Update": "Customer Service",
  "Project Completed": "Completed",
};

const canUpdateCase = (c) => {
  const role = (localStorage.getItem("role") || "").toLowerCase();
  if (role === "admin") return true;
  const stage = c.current_stage || c.currentStage;
  return stageToRole[stage] === role;
};

// Returns department-relative status from THIS user's perspective
// For admin: returns global status + current department/stage context
const getDeptStatus = (c) => {
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const currentStage = c.current_stage || c.currentStage;
  const deptLabel = stageToDeptLabel[currentStage] || "Unknown";

  // ── Admin: show global status with department context ──
  if (role === "admin") {
    const isCompleted =
      currentStage === "Completed" || c.status === "Completed";
    if (isCompleted) {
      return {
        label: "Completed",
        color: "#15803d",
        bg: "#ecfdf5",
        border: "#bbf7d0",
        icon: "check",
        dept: "Completed",
        stage: "Completed",
      };
    }
    if (c.status === "Delayed") {
      return {
        label: "Delayed",
        color: "#be123c",
        bg: "#fff1f2",
        border: "#fecdd3",
        icon: "alert",
        dept: deptLabel,
        stage: currentStage,
      };
    }
    return {
      label: "In Progress",
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      icon: "clock",
      dept: deptLabel,
      stage: currentStage,
    };
  }

  const currentIdx = STAGES.indexOf(currentStage);
  const myLastStage = roleLastStage[role];
  const myLastIdx = myLastStage ? STAGES.indexOf(myLastStage) : -1;

  // Case is at one of my stages — "In Progress" (I need to act)
  if (stageToRole[currentStage] === role) {
    if (c.status === "Delayed") {
      return {
        label: "Delayed",
        color: "#be123c",
        bg: "#fff1f2",
        border: "#fecdd3",
        icon: "alert",
        dept: deptLabel,
        stage: currentStage,
      };
    }
    return {
      label: "In Progress",
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      icon: "clock",
      dept: deptLabel,
      stage: currentStage,
    };
  }

  // Case has moved PAST my last stage — my job is done
  if (myLastIdx >= 0 && currentIdx > myLastIdx) {
    if (role === "sales") {
      return {
        label: "Done",
        color: "#15803d",
        bg: "#ecfdf5",
        border: "#bbf7d0",
        icon: "check",
        dept: "Completed",
        stage: "Done",
      };
    }
    return {
      label: "Completed",
      color: "#15803d",
      bg: "#ecfdf5",
      border: "#bbf7d0",
      icon: "check",
      dept: deptLabel,
      stage: currentStage,
    };
  }

  // Case is before my stage (shouldn't normally happen but handle gracefully)
  return {
    label: "Pending",
    color: "#92400e",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: "clock",
    dept: deptLabel,
    stage: currentStage,
  };
};

const formatCaseDate = (timeString) => {
  if (!timeString) return null;
  const date = new Date(timeString);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return "Today";
  } else {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
};

// Copy Tracking ID to clipboard
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy Tracking ID"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "2px 4px",
        borderRadius: "4px",
        color: copied ? "#059669" : "#94a3b8",
        transition: "color 0.15s",
        display: "inline-flex",
        alignItems: "center",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
      onMouseLeave={(e) => {
        if (!copied) e.currentTarget.style.color = "#94a3b8";
      }}
    >
      <Copy style={{ width: "11px", height: "11px" }} />
    </button>
  );
};

const CaseTable = ({ cases, onUpdateClick, onRefresh }) => {
  if (cases.length === 0) {
    return (
      <div className="table-wrap">
        <div
          style={{
            padding: "80px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <FolderOpen
              style={{ width: "24px", height: "24px", color: "var(--text-5)" }}
            />
          </div>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-1)",
              marginBottom: "6px",
            }}
          >
            No customers found
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-4)" }}>
            No records match your current filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── DESKTOP TABLE ── */}
      <div className="table-wrap hide-on-mobile">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {[
                  "Tracking ID",
                  "Customer ID",
                  "Customer Name",
                  "Status",
                  "Date",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: h === "Action" ? "right" : "left",
                      whiteSpace: "nowrap",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((c, i) => {
                const customerId = c.customer_id || c.customerId || "—";
                const dateLabel = formatCaseDate(
                  c.stageStartTime || c.stage_start_time || c.createdAt || c.created_at
                );
                const canUpdate = canUpdateCase(c);
                const isCompleted =
                  (c.current_stage || c.currentStage) === "Completed" ||
                  c.status === "Completed";

                return (
                  <tr
                    key={c._id || i}
                    style={{
                      borderTop: i > 0 ? "1px solid var(--border-2)" : "none",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--surface-2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    {/* Tracking ID */}
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--text-2)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {c.tracking_id || c.trackingId || "—"}
                      </span>
                    </td>

                    {/* Customer ID + Escalation badge */}
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "var(--color-primary)",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {customerId}
                          </span>
                          {customerId !== "—" && (
                            <CopyButton text={customerId} />
                          )}
                        </div>
                        <EscalationBadge c={c} />
                      </div>
                    </td>

                    {/* Customer Name + Phone */}
                    <td style={{ padding: "10px 12px", minWidth: "160px" }}>
                      <p
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 600,
                          color: "var(--text-1)",
                          marginBottom: "3px",
                        }}
                      >
                        {c.customerName}
                      </p>
                      {c.phone && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Phone
                            style={{
                              width: "11px",
                              height: "11px",
                              color: "var(--text-4)",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "11.5px",
                              color: "var(--text-3)",
                            }}
                          >
                            {c.phone}
                          </span>
                        </div>
                      )}
                    </td>



                    {/* Status */}
                    <td style={{ padding: "10px 12px" }}>
                      {(() => {
                        const deptSt = getDeptStatus(c);
                        const icon =
                          deptSt?.icon === "check" ? (
                            <CheckCircle2
                              style={{ width: "11px", height: "11px" }}
                            />
                          ) : deptSt?.icon === "alert" ? (
                            <span style={{ fontSize: "11px" }}>⚠</span>
                          ) : (
                            <Clock style={{ width: "11px", height: "11px" }} />
                          );
                        const label = deptSt?.label || c.status;
                        const bg =
                          deptSt?.bg ||
                          (isCompleted
                            ? "#ecfdf5"
                            : c.status === "Delayed"
                              ? "#fff1f2"
                              : "#eff6ff");
                        const color =
                          deptSt?.color ||
                          (isCompleted
                            ? "#15803d"
                            : c.status === "Delayed"
                              ? "#be123c"
                              : "#1d4ed8");
                        const border =
                          deptSt?.border ||
                          (isCompleted
                            ? "#bbf7d0"
                            : c.status === "Delayed"
                              ? "#fecdd3"
                              : "#bfdbfe");
                        const dept = deptSt?.dept;
                        const stage = deptSt?.stage;
                        // eslint-disable-next-line no-unused-vars
                        const dummyDeptSt = null; 
                        return (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                padding: "4px 10px",
                                borderRadius: "20px",
                                background: bg,
                                color,
                                border: `1px solid ${border}`,
                                width: "fit-content",
                              }}
                            >
                              {icon}
                              {label}
                            </span>
                            {/* Removed dept and stage details underneath per user request */}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Date */}
                    <td style={{ padding: "10px 12px" }}>
                      {dateLabel && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Clock
                            style={{
                              width: "12px",
                              height: "12px",
                              color: "#94a3b8",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "12px",
                              color:
                                c.status === "Delayed" ? "#be123c" : "#64748b",
                              fontWeight: c.status === "Delayed" ? 600 : 400,
                            }}
                          >
                            {dateLabel}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      {canUpdate ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateClick(c);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "7px 14px",
                            borderRadius: "var(--radius-sm)",
                            border: "none",
                            background: "var(--color-primary)",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            boxShadow: "var(--shadow-brand)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--color-primary-hover)";
                            e.currentTarget.style.transform =
                              "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "var(--color-primary)";
                            e.currentTarget.style.transform = "";
                          }}
                        >
                          <Edit3 style={{ width: "13px", height: "13px" }} />
                          Update
                        </button>
                      ) : (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            color: "var(--color-accent)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2
                            style={{ width: "14px", height: "14px" }}
                          />
                          Done
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          style={{
            padding: "10px 20px",
            background: "var(--surface-2)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <p style={{ fontSize: "11.5px", color: "var(--text-4)" }}>
            {cases.length} customer{cases.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── MOBILE CARDS (hidden on desktop via .mobile-only CSS) ── */}
      <div
        className="mobile-only"
        style={{ flexDirection: "column", gap: "12px" }}
      >
        {cases.map((c, i) => {
          const customerId = c.customer_id || c.customerId || "—";
          const dateLabel = formatCaseDate(c.stageStartTime || c.stage_start_time || c.createdAt || c.created_at);
          const canUpdate = canUpdateCase(c);
          const isCompleted =
            (c.current_stage || c.currentStage) === "Completed" ||
            c.status === "Completed";

          return (
            <div
              key={`mob-${c._id || i}`}
              onClick={() => (canUpdate ? onUpdateClick(c) : undefined)}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-card)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                cursor: canUpdate ? "pointer" : "default",
                transition: "box-shadow 0.2s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (canUpdate) {
                  e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-card)";
                e.currentTarget.style.transform = "";
              }}
            >
              {/* Top row: Customer ID + Status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--text-4)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Customer ID:
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "var(--color-primary)",
                      }}
                    >
                      {customerId}
                    </span>
                    {customerId !== "—" && <CopyButton text={customerId} />}
                  </div>
                </div>
                {/* Status badge - mobile */}
                {(() => {
                  const deptSt = getDeptStatus(c);
                  const label = deptSt?.label || c.status;
                  const bg =
                    deptSt?.bg ||
                    (isCompleted
                      ? "#ecfdf5"
                      : c.status === "Delayed"
                        ? "#fff1f2"
                        : "#eff6ff");
                  const color =
                    deptSt?.color ||
                    (isCompleted
                      ? "#15803d"
                      : c.status === "Delayed"
                        ? "#be123c"
                        : "#1d4ed8");
                  const border =
                    deptSt?.border ||
                    (isCompleted
                      ? "#bbf7d0"
                      : c.status === "Delayed"
                        ? "#fecdd3"
                        : "#bfdbfe");
                  const dept = deptSt?.dept;
                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                        alignItems: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: "20px",
                          background: bg,
                          color,
                          border: `1px solid ${border}`,
                        }}
                      >
                        {label}
                      </span>
                      {/* Removed dept and stage details underneath per user request */}
                    </div>
                  );
                })()}
              </div>

              {/* Customer name + phone + escalation badge */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    flexWrap: "wrap",
                    marginBottom: "4px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--text-1)",
                      margin: 0,
                    }}
                  >
                    {c.customerName}
                  </p>
                  <EscalationBadge c={c} />
                </div>
                {c.phone && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Phone
                      style={{
                        width: "11px",
                        height: "11px",
                        color: "var(--text-4)",
                      }}
                    />
                    <span
                      style={{ fontSize: "12.5px", color: "var(--text-3)" }}
                    >
                      {c.phone}
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid var(--border-2)",
                  paddingTop: "10px",
                }}
              >
                {dateLabel ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Clock
                      style={{
                        width: "12px",
                        height: "12px",
                        color: "var(--text-4)",
                      }}
                    />
                    <span style={{ fontSize: "12px", color: "var(--text-3)" }}>
                      {dateLabel}
                    </span>
                  </div>
                ) : (
                  <span />
                )}

                {isCompleted ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--color-accent)",
                      fontSize: "12.5px",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 style={{ width: "14px", height: "14px" }} />
                    Done
                  </div>
                ) : canUpdate ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateClick(c);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: "var(--color-primary)",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "var(--shadow-brand)",
                    }}
                  >
                    <Edit3 style={{ width: "13px", height: "13px" }} />
                    Update
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--color-accent)",
                      fontSize: "12.5px",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 style={{ width: "14px", height: "14px" }} />
                    Done
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {cases.length > 0 && (
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#94a3b8",
              padding: "8px 0",
            }}
          >
            {cases.length} customer{cases.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
};

export default CaseTable;
