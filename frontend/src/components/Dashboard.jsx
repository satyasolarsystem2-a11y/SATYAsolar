/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { edgeFetch, EDGE } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DashboardCards from "./DashboardCards";
import Footer from "./Footer";
import PipelineFunnel from "./PipelineFunnel";
import LeadTracker from "./LeadTracker";
import {
  ArrowRight,
  Activity,
  FolderOpen,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  GitBranch,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";


import OverviewTab from "./DashboardTabs/OverviewTab";
import AnalyticsTab from "./DashboardTabs/AnalyticsTab";

const Dashboard = ({
  onLogout,
  title = "Dashboard",
  roleBadge,
  viewAsUserId,
  viewAsUserName,
  viewAsRole,
}) => {

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [cases, setCases] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [perf, setPerf] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  // ── Analytics tab state (lazy-loaded when tab is opened) ──────────────────
  const [analyticsData, setAnalyticsData] = useState({
    trendData: null,
    revenuePipeline: null,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState("daily");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const navigate = useNavigate();

  // ── Simulation identity ──────────────────────────────────────────────────
  // Props (legacy) take precedence, then localStorage.simulating (set by EmployeeDrillDown)
  const lsSimulating = localStorage.getItem("simulating") === "true";
  const isSimulating =
    !!(viewAsUserId || viewAsUserName || viewAsRole) || lsSimulating;
  const userRole = (
    viewAsRole ||
    localStorage.getItem("role") ||
    "user"
  ).toLowerCase();
  const userName = viewAsUserName || localStorage.getItem("name") || "";
  const userId = viewAsUserId || localStorage.getItem("userId") || "";
  const isAdmin =
    !isSimulating &&
    (
      localStorage.getItem("realRole") ||
      localStorage.getItem("role") ||
      ""
    ).toLowerCase() === "admin";

  useEffect(() => {
    const load = async () => {
      try {
        if (isSimulating || !isAdmin) {
          // ── EMPLOYEE SCOPED VIEW (also used for admin simulation) ──
          const results =
            await Promise.allSettled([
              edgeFetch(EDGE.analytics, {
                action: "employee_stats",
                userId,
                userName,
                userRole,
              }),
              edgeFetch(EDGE.workflow, {
                action: "get_all",
                viewAsRole: userRole,
              }),
              edgeFetch(EDGE.analytics, {
                action: "activity",
                viewAsUserName: userName,
              }),
              userRole === "sales"
                ? edgeFetch(EDGE.quotation, {
                  action: "list",
                  salesPerson: userName,
                })
                : Promise.resolve([]),
              edgeFetch(EDGE.analytics, { 
                action: "pipeline", 
                funnelType: userRole === "sales" ? "sales" : "department",
                department: userRole 
              }),
            ]);

          const get = (r) => (r.status === "fulfilled" ? r.value : null);

          const empStats = results[0];
          const empCases = results[1];
          const empActivity = results[2];
          const empQuotes = results[3];
          
          // Map employee_stats → DashboardCards format
          const es = get(empStats);
          if (es) {
            const rawCases = get(empCases) || [];
            if (userRole === "sales") {
              const quotes = get(empQuotes) || [];
              setQuotations(quotes);
            }
            // For non-sales roles (and now sales too), count from the actual cases list
            // so that Dashboard numbers match the Customers list exactly
            const myStages =
              {
                sales: ["Case Confirmed"],
                registration: [
                  "Registration: Document Verification",
                  "Registration: Government Portal",
                  "Registration: Payment Verification",
                ],
                banking: ["Bank & Finance"],
                project: ["Project: Survey & Design", "Project: Installation"],
                warehouse: ["Warehouse: Material Dispatch"],
                electrical: ["Electrical: Net Metering"],
                accounts: ["Accounts: Payment Clearance"],
                subsidy: ["Subsidy Registration"],
                customer_service: ["Customer Service Update"],
              }[userRole] || [];
            const fullPipeline = [
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
            const myLastIdx = Math.max(
              ...myStages.map((s) => fullPipeline.indexOf(s)),
            );
            const active = rawCases.filter((c) =>
              myStages.includes(c.current_stage ?? c.currentStage),
            );
            const completed = rawCases.filter((c) => {
              const idx = fullPipeline.indexOf(
                c.current_stage ?? c.currentStage,
              );
              return idx > myLastIdx;
            });
            setStats({
              totalCases: active.length + completed.length,
              inProgressCases: active.filter(
                (c) => c.status === "In Progress",
              ).length,
              completedCases: completed.length,
              delayedCases: active.filter((c) => c.status === "Delayed")
                .length,
            });
          }

          // Cases filtered by employee's role stages
          const rawCases = get(empCases) || [];
          setCases(
            rawCases.map((c) => ({
              ...c,
              caseId: c.case_id ?? c.caseId,
              customerName: c.customer_name ?? c.customerName,
              currentStage: c.current_stage ?? c.currentStage,
              siteVisitDate: c.site_visit_date ?? c.siteVisitDate,
              assignedTo: c.assigned_to ?? c.assignedTo,
              createdAt: c.created_at ?? c.createdAt,
            })),
          );

          setActivities(get(empActivity) || []);
          setPipeline(get(results[4]) || []); // Results 4 is the pipeline
          setLoading(false);
          return;
        }

        // ── NORMAL MODE: original data fetching ──
        const reqs = [
          edgeFetch(EDGE.analytics, { action: "stats" }),
          edgeFetch(EDGE.analytics, {
            action: "activity",
            ...(!isAdmin && { viewAsUserName: userName })
          }),
          edgeFetch(EDGE.workflow, { action: "get_all" }),
          edgeFetch(EDGE.analytics, { 
            action: "pipeline", 
            funnelType: isAdmin ? "ceo" : (userRole === "sales" ? "sales" : "department"),
            department: userRole 
          }),
          edgeFetch(EDGE.analytics, { action: "monthly_summary" }),
        ];
        if (isAdmin) {
          reqs.push(edgeFetch(EDGE.analytics, { action: "overdue" }));
          reqs.push(edgeFetch(EDGE.analytics, { action: "performance" }));
        }
        if (userRole === "sales") {
          reqs.push(edgeFetch(EDGE.quotation, { action: "list", salesPerson: !isAdmin ? userName : undefined }));
        }

        const results = await Promise.allSettled(reqs);
        const getData = (idx) =>
          results[idx]?.status === "fulfilled" ? results[idx].value : null;
        const failures = results.filter((r) => r.status === "rejected");

        setActivities(getData(1) || []);

        // Normalize snake_case → camelCase for cases array
        const rawCases = getData(2) || [];
        setCases(
          rawCases.map((c) => ({
            ...c,
            caseId: c.id ?? c.case_id ?? c.caseId,
            customerName: c.customer_name ?? c.customerName,
            currentStage: c.current_stage ?? c.currentStage,
            siteVisitDate: c.site_visit_date ?? c.siteVisitDate,
            assignedTo: c.assigned_to ?? c.assignedTo,
            createdAt: c.created_at ?? c.createdAt,
          })),
        );

        setPipeline(getData(3) || []);
        setSummary(getData(4));
        if (isAdmin) {
          // Normalize overdue cases too
          const rawOverdue = getData(5) || [];
          setOverdue(
            rawOverdue.map((c) => ({
              ...c,
              caseId: c.id ?? c.case_id ?? c.caseId,
              customerName: c.customer_name ?? c.customerName,
              currentStage: c.current_stage ?? c.currentStage,
            })),
          );
          setPerf(getData(6) || []);
        }

        setStats(getData(0));

        if (failures.length > 0) {
          console.error("Some dashboard requests failed:", failures);
          toast.error(`Partial load: ${failures.length} widgets failed.`);
        }
      } catch (err) {
        console.error("Dashboard Critical Error:", err);
        toast.error("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lazy-load analytics data when admin opens the Analytics tab ────────────
  useEffect(() => {
    if (activeTab !== "analytics" || !isAdmin) return;
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const payload = { action: "trend_data", timeframe: chartTimeframe };
        if (chartTimeframe === "custom") {
          payload.startDate = customStart;
          payload.endDate = customEnd;
        }
        const [trend, revenue] = await Promise.allSettled([
          edgeFetch(EDGE.analytics, payload),
          edgeFetch(EDGE.analytics, { action: "revenue_pipeline" }),
        ]);
        setAnalyticsData({
          trendData: trend.status === "fulfilled" ? trend.value : [],
          revenuePipeline:
            revenue.status === "fulfilled" ? revenue.value : null,
        });
      } catch {
        // silently fail — analytics tab shows empty state
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [activeTab, chartTimeframe, customStart, customEnd, isAdmin]); // eslint-disable-line

  if (loading)
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
            maxWidth: "1400px",
            boxSizing: "border-box",
          }}
        >
          <Header
            title={title}
            subtitle="Overview of your projects today"
            roleBadge={roleBadge}
            onLogout={onLogout}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{
                    flex: "1 1 160px",
                    height: "110px",
                    borderRadius: "14px",
                    minWidth: "140px",
                  }}
                />
              ))}
            </div>
            <div
              className="skeleton"
              style={{ height: "60px", borderRadius: "12px" }}
            />
            <div
              className="skeleton"
              style={{ height: "220px", borderRadius: "14px" }}
            />
            <div
              className="skeleton"
              style={{ height: "180px", borderRadius: "14px" }}
            />
          </div>
          <Footer />
        </main>
      </div>
    );

  const total = stats?.totalCases || 0;
  const inProgress = stats?.inProgressCases || 0;
  const completed = stats?.completedCases || 0;
  const delayed = stats?.delayedCases || 0;

  // Dept-specific widget data
  const deptWidgets = {
    banking: [
      {
        label: "Pending loan cases",
        val: cases.filter((c) => c.currentStage === "Banking In Process")
          .length,
        color: "#f59e0b",
        icon: Clock,
      },
      {
        label: "Awaiting approval",
        val: cases.filter(
          (c) => c.currentStage === "Loan Approved / Cash Confirmed",
        ).length,
        color: "#f97316",
        icon: CheckCircle2,
      },
      {
        label: "Delayed in banking",
        val: cases.filter(
          (c) =>
            c.currentStage === "Banking In Process" && c.status === "Delayed",
        ).length,
        color: "#f43f5e",
        icon: AlertTriangle,
      },
    ],
    field_installation: [
      {
        label: "Sites to install",
        val: cases.filter((c) => c.currentStage === "Installation Done").length,
        color: "#10b981",
        icon: Zap,
      },
      {
        label: "With site visit date",
        val: cases.filter((c) => c.siteVisitDate).length,
        color: "#6366f1",
        icon: Calendar,
      },
      {
        label: "Overdue installs",
        val: cases.filter(
          (c) =>
            c.currentStage === "Installation Done" && c.status === "Delayed",
        ).length,
        color: "#f43f5e",
        icon: AlertTriangle,
      },
    ],
    electrical: [
      {
        label: "Awaiting inspection",
        val: cases.filter((c) => c.currentStage === "Electrical Checked")
          .length,
        color: "#0ea5e9",
        icon: Zap,
      },
      {
        label: "Delayed checks",
        val: cases.filter(
          (c) =>
            c.currentStage === "Electrical Checked" && c.status === "Delayed",
        ).length,
        color: "#f43f5e",
        icon: AlertTriangle,
      },
    ],
    subsidy: [
      {
        label: "Subsidy Pending",
        val: cases.filter(
          (c) => c.currentStage === "Subsidy Registration Completed",
        ).length,
        color: "#ec4899",
        icon: Clock,
      },
      {
        label: "Subsidy Delayed",
        val: cases.filter(
          (c) =>
            c.currentStage === "Subsidy Registration Completed" &&
            c.status === "Delayed",
        ).length,
        color: "#f43f5e",
        icon: AlertTriangle,
      },
    ],
    sales: [
      {
        label: "Registered today",
        val: quotations.filter((q) => {
          const d = new Date(q.created_at || q.createdAt);
          const n = new Date();
          return d.toDateString() === n.toDateString();
        }).length,
        color: "#10b981",
        icon: Zap,
      },
      {
        label: "Registered this month",
        val: quotations.filter((q) => {
          const d = new Date(q.created_at || q.createdAt);
          const n = new Date();
          return (
            d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
          );
        }).length,
        color: "#6366f1",
        icon: TrendingUp,
      },
    ],
    inventory: [
      {
        label: "Pending dispatch",
        val: cases.filter((c) => c.currentStage === "Sent to Store").length,
        color: "#8b5cf6",
        icon: FolderOpen,
      },
      {
        label: "Delayed in inventory",
        val: cases.filter(
          (c) => c.currentStage === "Sent to Store" && c.status === "Delayed",
        ).length,
        color: "#f43f5e",
        icon: AlertTriangle,
      },
    ],
    registration: [
      {
        label: "Pending Registration",
        val: cases.filter((c) =>
          ["Registration: Document Verification", "Registration: Government Portal", "Registration: Payment Verification", "Registration Pending", "Registration Approved", "Registration Done"].includes(c.currentStage)
        ).length,
        color: "#6366f1",
        icon: Clock,
      },
      {
        label: "Registration Delayed",
        val: cases.filter(
          (c) =>
            ["Registration: Document Verification", "Registration: Government Portal", "Registration: Payment Verification", "Registration Pending", "Registration Approved", "Registration Done"].includes(c.currentStage) && c.status === "Delayed",
        ).length,
        color: "#f43f5e",
        icon: AlertTriangle,
      },
    ],
  };
  const myWidgets = deptWidgets[userRole] || [];

  const card = (style = {}) => ({
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-card)",
    padding: "20px",
    ...style,
  });


  const ctx = {
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
    viewAsUserName
  };

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
          padding: isSimulating ? "0 32px 28px" : "28px 32px",
          maxWidth: "1400px",
          boxSizing: "border-box",
        }}
      >
        <Header
          title={title}
          subtitle={
            isSimulating
              ? `Viewing ${userName}'s data`
              : "Overview of your projects today"
          }
          roleBadge={roleBadge}
          onLogout={onLogout}
        />

        <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
          {[
            { key: "overview", label: "Overview", icon: Activity, show: true },
            {
              key: "leads",
              label: "Lead Tracking",
              icon: GitBranch,
              show: userRole === "sales",
            },
            {
              key: "analytics",
              label: "Analytics",
              icon: TrendingUp,
              show: isAdmin && !isSimulating,
            },
          ]
            .filter((t) => t.show)
            .map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 16px",
                  borderRadius: "999px",
                  border: "1.5px solid",
                  borderColor:
                    activeTab === key
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                  background:
                    activeTab === key ? "var(--color-primary)" : "transparent",
                  color: activeTab === key ? "#fff" : "var(--text-3)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon style={{ width: "14px", height: "14px" }} />
                {label}
              </button>
            ))}
        </div>

        {userRole === "sales" && activeTab === "leads" && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <GitBranch
                style={{
                  width: "18px",
                  height: "18px",
                  color: "var(--color-primary)",
                }}
              />
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--text-1)",
                  }}
                >
                  Lead Tracking
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-4)",
                    marginTop: "2px",
                  }}
                >
                  Real-time pipeline view of every lead you've worked on
                </p>
              </div>
            </div>
            <LeadTracker
              userId={userId}
              userName={userName}
              userRole={userRole}
            />
          </div>
        )}

        {activeTab === "overview" && <OverviewTab ctx={ctx} />}
        {activeTab === "analytics" && <AnalyticsTab ctx={ctx} />}
        <Footer />
      </main>
    </div>
  );
};

export default Dashboard;
