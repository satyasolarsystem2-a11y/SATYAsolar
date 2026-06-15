/* eslint-disable no-unused-vars */
import React from "react";
import DashboardCards from "../DashboardCards";
import PipelineFunnel from "../PipelineFunnel";
import { Activity, FolderOpen, Zap, Clock, CheckCircle2, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";


const OverviewTab = ({ ctx }) => {
  const {
    activeTab,
    activities,
    analyticsData,
    analyticsLoading,
    card,
    cases,
    chartTimeframe,
    completed,
    customEnd,
    customStart,
    delayed,
    deptWidgets,
    inProgress,
    isAdmin,
    isSimulating,
    loading,
    lsSimulating,
    myWidgets,
    navigate,
    onLogout,
    overdue,
    perf,
    pipeline,
    quotations,
    roleBadge,
    setActiveTab,
    setActivities,
    setAnalyticsData,
    setAnalyticsLoading,
    setCases,
    setChartTimeframe,
    setCustomEnd,
    setCustomStart,
    setLoading,
    setOverdue,
    setPerf,
    setPipeline,
    setQuotations,
    setStats,
    setSummary,
    stats,
    summary,
    title,
    total,
    userId,
    userName,
    userRole,
    viewAsRole,
    viewAsUserId,
    viewAsUserName,
  } = ctx;

  return (
    <>
      {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <>
            <DashboardCards stats={stats} role={userRole} />

            {/* ── Dept-specific widgets (non-admin) ── */}
            {!isAdmin && myWidgets.length > 0 && (
              <div
                className="grid-stack-mobile"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${myWidgets.length}, 1fr)`,
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {myWidgets.map(({ label, val, color, icon: Icon }) => (
                  <div
                    key={label}
                    style={{
                      ...card(),
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: `${color}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ width: "20px", height: "20px", color }} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "22px",
                          fontWeight: 800,
                          color: "var(--text-1)",
                          lineHeight: 1,
                        }}
                      >
                        {val}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-4)",
                          marginTop: "3px",
                        }}
                      >
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Special Cases section (non-admin: cases assigned to this user) ── */}
            {!isAdmin &&
              (() => {
                const specialCases = cases.filter(
                  (c) => c.assignedTo && c.assignedTo === userName,
                );
                if (specialCases.length === 0) return null;
                return (
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#6366f1",
                          animation: "pulse 2s infinite",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--text-1)",
                        }}
                      >
                        Special Cases — Assigned to You
                      </h3>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          background: "#eef2ff",
                          color: "#4338ca",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        {specialCases.length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {specialCases.map((c) => {
                        const daysAt = c.stage_start_time
                          ? Math.floor(
                              (Date.now() - new Date(c.stage_start_time)) /
                                86400000,
                            )
                          : null;
                        return (
                          <div
                            key={c.caseId}
                            onClick={() => navigate("/cases")}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 16px",
                              borderRadius: "10px",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              background: "var(--surface)",
                              border: "1px solid #c7d2fe",
                              boxShadow: "0 1px 4px rgba(99,102,241,0.08)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.borderColor = "#6366f1")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.borderColor = "#c7d2fe")
                            }
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: "var(--text-1)",
                                }}
                              >
                                {c.customerName}
                              </p>
                              <p
                                style={{
                                  fontSize: "11.5px",
                                  color: "var(--text-4)",
                                  marginTop: "2px",
                                }}
                              >
                                {c.currentStage}
                              </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: "20px",
                                  background:
                                    c.status === "Delayed"
                                      ? "#fff1f2"
                                      : c.status === "Completed"
                                        ? "#ecfdf5"
                                        : "#f0fdf4",
                                  color:
                                    c.status === "Delayed"
                                      ? "#be123c"
                                      : c.status === "Completed"
                                        ? "#15803d"
                                        : "#166534",
                                  border: `1px solid ${c.status === "Delayed" ? "#fecdd3" : "#bbf7d0"}`,
                                }}
                              >
                                {c.status}
                              </span>
                              {daysAt !== null && (
                                <p
                                  style={{
                                    fontSize: "10.5px",
                                    color: "var(--text-4)",
                                    marginTop: "3px",
                                  }}
                                >
                                  {daysAt === 0
                                    ? "Today"
                                    : `${daysAt}d at stage`}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            {/* ── Main 2-column layout ── */}
            {/* LEFT: Hero card + Pipeline Funnel  |  RIGHT: Activity + Workflow status */}
            <div
              className="grid-stack-mobile"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 340px",
                gap: "16px",
                marginBottom: "16px",
                alignItems: "start",
              }}
            >
              {/* LEFT COLUMN */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Hero card */}
                <div
                  className="hero-banner"
                  onClick={() =>
                    navigate(
                      userRole === "sales" ? "/approved-quotations" : "/cases",
                    )
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "24px",
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      {
                        icon: FolderOpen,
                        label: `${total} total`,
                        bg: "rgba(255,255,255,0.08)",
                      },
                      {
                        icon: Clock,
                        label: `${inProgress} active`,
                        bg: "rgba(255,255,255,0.12)",
                      },
                      {
                        icon: CheckCircle2,
                        label: `${completed} done`,
                        bg: "rgba(255,255,255,0.16)",
                      },
                    ].map(({ icon: Icon, label, bg }) => (
                      <div
                        key={label}
                        className="hero-chip"
                        style={{ background: bg }}
                      >
                        <Icon style={{ width: "13px", height: "13px" }} />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <h2>
                    Manage your solar
                    <br />
                    installations
                  </h2>
                  <p>
                    Track every project from registration to plant activation.
                  </p>
                  <button className="hero-cta">
                    Open {userRole === "sales" ? "quotations" : "cases"}{" "}
                    <ArrowRight style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>

                {/* Pipeline Funnel card — visible to everyone now */}
                {(true) && (
                  <div
                    style={{
                      ...card(),
                      display: "flex",
                      flexDirection: "column",
                      maxHeight: "320px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                        flexShrink: 0,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontFamily: "DM Sans,sans-serif",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "var(--text-1)",
                          }}
                        >
                          {isAdmin ? "Management Funnel" : userRole === "sales" ? "Sales Funnel" : "Department Pipeline"}
                        </h3>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-4)",
                            marginTop: "2px",
                          }}
                        >
                          Cases at each workflow stage
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/cases")}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: "12.5px" }}
                      >
                        View all{" "}
                        <ArrowRight style={{ width: "12px", height: "12px" }} />
                      </button>
                    </div>
                    <div
                      style={{
                        overflowY: "auto",
                        flex: 1,
                        paddingRight: "4px",
                      }}
                    >
                      <PipelineFunnel data={pipeline} />
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                    {/* Activity Feed */}
                    <div
                      style={card({ display: "flex", flexDirection: "column" })}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "18px",
                        }}
                      >
                        <Activity
                          style={{
                            width: "15px",
                            height: "15px",
                            color: "var(--color-primary)",
                          }}
                        />
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "var(--text-1)",
                          }}
                        >
                          Activity
                        </h3>
                        {activities.length > 0 && (
                          <div
                            style={{
                              marginLeft: "auto",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-pill)",
                              background: "var(--color-primary-light)",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "var(--color-primary)",
                            }}
                          >
                            {activities.length}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          overflowY: "auto",
                          maxHeight: "340px",
                        }}
                      >
                        {activities.length > 0 ? (
                          activities.slice(0, 10).map((a, i) => (
                            <div key={i} className="activity-item">
                              <div className="activity-avatar">
                                {(a.updated_by ||
                                  a.updatedBy)?.[0]?.toUpperCase() || "U"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "6px",
                                    marginBottom: "3px",
                                  }}
                                >
                                  <span className="activity-case">
                                    {a.cases?.tracking_id
                                      ? `${a.cases.tracking_id} (${a.cases.customer_name})`
                                      : a.caseId || a.id || a.case_id}
                                  </span>
                                  <span className="activity-time">
                                    {new Date(a.timestamp).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </span>
                                </div>
                                <p className="activity-action">{a.stage}</p>
                                <p
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--color-text-muted)",
                                  }}
                                >
                                  by{" "}
                                  <span
                                    style={{
                                      color: "var(--color-text-secondary)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {a.updated_by || a.updatedBy || "Unknown"}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-state">
                            <div className="empty-icon">
                              <i className="ti ti-activity" />
                            </div>
                            <p className="empty-title">No activity yet</p>
                            <p className="empty-desc">
                              Stage updates will appear here.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Workflow status */}
                    <div style={card()}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "18px",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "var(--text-1)",
                          }}
                        >
                          Workflow status
                        </h3>
                        <span className="live-badge">
                          <span className="live-dot" />
                          Live
                        </span>
                      </div>
                      {[
                        "Registration Done",
                        "Banking In Process",
                        "Loan Approved / Cash Confirmed",
                        "Sent to Store",
                        "Installation Done",
                        "Electrical Checked",
                        "Plant Activated",
                        "Subsidy Registration Completed",
                      ]
                        .map((stage) => {
                          const count = cases.filter(
                            (c) => c.currentStage === stage,
                          ).length;
                          if (count === 0) return null;
                          return (
                            <div
                              key={stage}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "7px 0",
                                borderBottom: "0.5px solid var(--color-border)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    background: "var(--color-primary)",
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: "12.5px",
                                    color: "var(--color-text-secondary)",
                                  }}
                                >
                                  {stage}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: "var(--text-1)",
                                  background: "var(--color-primary-light)",
                                  padding: "1px 9px",
                                  borderRadius: "var(--radius-pill)",
                                }}
                              >
                                {count}
                              </span>
                            </div>
                          );
                        })
                        .filter(Boolean)}
                    </div>
              </div>
            </div>

            {/* ── Admin-only blocks ── */}
            {isAdmin && (
              <>
                {/* Monthly Report Card + Overdue */}
                <div
                  className="grid-stack-mobile"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  {/* Monthly summary */}
                  <div style={card()}>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--text-1)",
                        marginBottom: "16px",
                      }}
                    >
                      Monthly report —{" "}
                      {new Date().toLocaleString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    {summary ? (
                      <div
                        className="stats-grid-mobile"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3,1fr)",
                          gap: "12px",
                        }}
                      >
                        {[
                          {
                            label: "Registered",
                            val: summary.created,
                            colorCls: "blue",
                            navTo: "/cases",
                          },
                          {
                            label: "Completed",
                            val: summary.completed,
                            colorCls: "green",
                            navTo: "/cases?tab=completed",
                          },
                          {
                            label: "Delayed now",
                            val: summary.delayed,
                            colorCls: "red",
                            navTo: "/cases?tab=delayed",
                          },
                          {
                            label: "Avg days",
                            val: `${summary.avgCycleDays}d`,
                            colorCls: "amber",
                            navTo: "/cases",
                          },
                          {
                            label: "Active",
                            val: summary.totalActive,
                            colorCls: "blue",
                            navTo: "/cases?tab=active",
                          },
                          {
                            label: "Top delay",
                            val:
                              summary.topDelayedStage?.split(" ")[0] || "None",
                            colorCls: "red",
                            navTo: "/cases?tab=delayed",
                          },
                        ].map(({ label, val, colorCls, navTo }) => (
                          <div
                            key={label}
                            className="report-card"
                            onClick={() => navigate(navTo)}
                          >
                            <p className={`report-number ${colorCls}`}>{val}</p>
                            <p className="report-label">{label}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        style={{
                          color: "var(--color-text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        No data yet.
                      </p>
                    )}
                  </div>

                  {/* Overdue panel */}
                  <div style={card()}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "14px",
                      }}
                    >
                      <AlertTriangle
                        style={{
                          width: "15px",
                          height: "15px",
                          color: "var(--color-danger)",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--text-1)",
                        }}
                      >
                        Overdue cases
                      </h3>
                      {overdue.length > 0 && (
                        <span
                          style={{
                            marginLeft: "auto",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-pill)",
                            background: "var(--color-danger-light)",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "var(--color-danger)",
                          }}
                        >
                          {overdue.length}
                        </span>
                      )}
                    </div>
                    {overdue.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="ti ti-circle-check" />
                        </div>
                        <p className="empty-title">All clear!</p>
                        <p className="empty-desc">
                          No cases stuck for more than 3 days.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          maxHeight: "220px",
                          overflowY: "auto",
                        }}
                      >
                        {overdue.slice(0, 6).map((c) => (
                          <div
                            key={c.caseId}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 10px",
                              borderRadius: "var(--radius-md)",
                              background: "var(--surface-2)",
                              border: "0.5px solid var(--color-border)",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  color: "var(--text-1)",
                                  fontFamily: "monospace",
                                }}
                              >
                                {c.caseId}
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                {c.customerName} &middot; {c.currentStage}
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "var(--color-danger)",
                                background: "var(--color-danger-light)",
                                padding: "2px 8px",
                                borderRadius: "var(--radius-pill)",
                                flexShrink: 0,
                              }}
                            >
                              {c.daysStuck}d
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dept performance leaderboard */}
                <div style={{ ...card(), marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <TrendingUp
                      style={{
                        width: "15px",
                        height: "15px",
                        color: "var(--color-primary)",
                      }}
                    />
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--text-1)",
                      }}
                    >
                      Department performance
                    </h3>
                  </div>
                  {perf.length === 0 ? (
                    <p
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "13px",
                        textAlign: "center",
                        padding: "24px",
                      }}
                    >
                      Not enough history data yet.
                    </p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="dept-table hide-on-mobile">
                        <thead>
                          <tr>
                            {["Department", "Cases", "Avg Days", "Delayed"].map(
                              (h) => (
                                <th key={h}>{h}</th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {[...perf]
                            .sort((a, b) => a.avgDays - b.avgDays)
                            .map((d, i) => {
                              const maxCases = Math.max(
                                ...perf.map((p) => p.casesProcessed),
                                1,
                              );
                              const barW = Math.round(
                                (d.casesProcessed / maxCases) * 100,
                              );
                              const dayCls =
                                d.avgDays <= 1
                                  ? "days-fast"
                                  : d.avgDays <= 3
                                    ? "days-mid"
                                    : "days-slow";
                              return (
                                <tr key={d.team}>
                                  <td
                                    style={{
                                      fontWeight: 600,
                                      color: "var(--text-1)",
                                    }}
                                  >
                                    {i === 0 && (
                                      <span style={{ marginRight: "6px" }}>
                                        &#x1F947;
                                      </span>
                                    )}
                                    {d.team}
                                  </td>
                                  <td>
                                    <div className="mini-bar">
                                      <span>{d.casesProcessed}</span>
                                      <div className="mini-bar-track">
                                        <div
                                          className="mini-bar-fill"
                                          style={{ width: `${barW}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={dayCls}>
                                      {d.avgDays} days
                                    </span>
                                  </td>
                                  <td
                                    style={{
                                      color:
                                        d.delayCount > 0
                                          ? "var(--color-danger)"
                                          : "var(--color-text-muted)",
                                      fontWeight: d.delayCount > 0 ? 700 : 400,
                                    }}
                                  >
                                    {d.delayCount}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>

                      <div
                        className="mobile-only"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          minWidth: "100%",
                        }}
                      >
                        {[...perf]
                          .sort((a, b) => a.avgDays - b.avgDays)
                          .map((d, i) => {
                            const maxCases = Math.max(
                              ...perf.map((p) => p.casesProcessed),
                              1,
                            );
                            const barW = Math.round(
                              (d.casesProcessed / maxCases) * 100,
                            );
                            const dayCls =
                              d.avgDays <= 1
                                ? "days-fast"
                                : d.avgDays <= 3
                                  ? "days-mid"
                                  : "days-slow";
                            return (
                              <div
                                key={d.team}
                                style={{
                                  background: "var(--surface-2)",
                                  padding: "12px",
                                  borderRadius: "12px",
                                  border: "1px solid var(--border)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "var(--text-1)",
                                      fontSize: 14,
                                    }}
                                  >
                                    {i === 0 && (
                                      <span style={{ marginRight: "6px" }}>
                                        🥇
                                      </span>
                                    )}
                                    {d.team}
                                  </div>
                                  <div
                                    style={{
                                      color:
                                        d.delayCount > 0
                                          ? "var(--color-danger)"
                                          : "var(--color-text-muted)",
                                      fontWeight: d.delayCount > 0 ? 700 : 600,
                                      fontSize: 12,
                                    }}
                                  >
                                    {d.delayCount} delayed
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "16px",
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "var(--text-4)",
                                        marginBottom: "4px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      CASES ({d.casesProcessed})
                                    </div>
                                    <div
                                      className="mini-bar-track"
                                      style={{ width: "100%" }}
                                    >
                                      <div
                                        className="mini-bar-fill"
                                        style={{ width: `${barW}%` }}
                                      />
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "var(--text-4)",
                                        marginBottom: "4px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      AVG DAYS
                                    </div>
                                    <span
                                      className={dayCls}
                                      style={{ display: "inline-block" }}
                                    >
                                      {d.avgDays} days
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
    </>
  );
};

export default OverviewTab;
