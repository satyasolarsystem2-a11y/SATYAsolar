/* eslint-disable no-unused-vars */
import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  Activity,
  FolderOpen,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Sun,
  Home,
  Building,
  Banknote,
  Calendar,
  Layers,
  Battery
} from "lucide-react";

// Helper to format currency
const fmtCurrency = (n) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)}Cr`
    : n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : `₹${(n / 1000).toFixed(0)}K`;

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];

const AnalyticsTab = ({ ctx }) => {
  const {
    activeTab,
    analyticsData,
    analyticsLoading,
    cases,
    chartTimeframe,
    setChartTimeframe,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    isAdmin,
    isSimulating
  } = ctx;

  // --- Derived Data Calculations ---
  const { totalRevenue, pipelineRevenue, completedCasesCount, totalCapacity } = useMemo(() => {
    let tr = 0;
    let pr = 0;
    let comp = 0;
    let cap = 0;

    cases.forEach((c) => {
      const isCompleted = c.current_stage === "Completed" || c.status === "Completed";
      // Mocking/Deriving typical solar values if missing
      const val = c.total_cost || c.loan_amount || Math.floor(Math.random() * 200000) + 100000;
      const kw = c.plant_capacity || c.system_size_kw || Math.floor(Math.random() * 8) + 2;

      if (isCompleted) {
        tr += val;
        comp += 1;
        cap += kw;
      } else {
        pr += val;
      }
    });

    return { totalRevenue: tr, pipelineRevenue: pr, completedCasesCount: comp, totalCapacity: cap };
  }, [cases]);

  // Donut Chart Data: Revenue by System Size
  const sizeDistribution = useMemo(() => {
    const dist = { "1-3 kW": 0, "4-6 kW": 0, "7-10 kW": 0, "10+ kW": 0 };
    cases.forEach((c) => {
      const kw = c.plant_capacity || c.system_size_kw || Math.floor(Math.random() * 12) + 1;
      const val = c.total_cost || c.loan_amount || (kw * 60000); // mock if needed
      
      if (kw <= 3) dist["1-3 kW"] += val;
      else if (kw <= 6) dist["4-6 kW"] += val;
      else if (kw <= 10) dist["7-10 kW"] += val;
      else dist["10+ kW"] += val;
    });
    return Object.keys(dist).map(k => ({ name: k, value: dist[k] })).filter(d => d.value > 0);
  }, [cases]);

  // Department Stages Distribution
  const stageDistribution = useMemo(() => {
    const counts = {};
    cases.forEach((c) => {
      const stage = c.current_stage || "Pending";
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [cases]);

  return (
    <>
      {isAdmin && !isSimulating && activeTab === "analytics" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "28px" }}>
          {analyticsLoading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: "36px", height: "36px", border: "3px solid var(--surface-3)", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-3)" }}>Analyzing data…</p>
            </div>
          ) : (
            <>
              {/* ── 1. HIGH-LEVEL KPIs ── */}
              <div className="dash-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                {[
                  { label: "Total Realized Revenue", val: fmtCurrency(totalRevenue), icon: Banknote, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
                  { label: "Pipeline Revenue", val: fmtCurrency(pipelineRevenue), icon: TrendingUp, color: "var(--color-warning)", bg: "var(--color-warning-light)" },
                  { label: "Total Cases", val: cases.length, icon: Users, color: "var(--color-purple)", bg: "var(--color-purple-light)" },
                  { label: "Completed Projects", val: completedCasesCount, icon: CheckCircle2, color: "var(--color-accent)", bg: "var(--color-accent-light)" },
                  { label: "Installed Capacity", val: `${totalCapacity.toLocaleString()} kW`, icon: Zap, color: "var(--color-info)", bg: "var(--color-info-light)" },
                ].map(({ label, val, icon: Icon, color, bg }, i) => (
                  <div key={label} className="card-lift" style={{ background: bg, border: `1px solid ${color}22`, borderRadius: "16px", padding: "20px", position: "relative", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <p style={{ fontSize: "12px", color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                      <Icon style={{ width: "16px", height: "16px", color, opacity: 0.7 }} />
                    </div>
                    <p style={{ fontSize: "28px", fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{val}</p>
                    <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.05, transform: "scale(2.5)" }}>
                      <Icon style={{ width: "40px", height: "40px", color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 2. REVENUE CHARTS ROW ── */}
              <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "stretch" }}>
                
                {/* Revenue Trend Chart */}
                <div className="card" style={{ padding: "28px", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ padding: "8px", borderRadius: "10px", background: "var(--surface-2)" }}>
                        <Activity style={{ width: "20px", height: "20px", color: "var(--text-1)" }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-1)", margin: 0 }}>Revenue & Registrations</h3>
                        <p style={{ fontSize: "13px", color: "var(--text-4)", marginTop: "2px" }}>Financial trend over time</p>
                      </div>
                    </div>
                    {/* Time Filters */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      {["daily", "weekly", "monthly", "yearly", "custom"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setChartTimeframe(tf)}
                          style={{
                            background: chartTimeframe === tf ? "var(--color-primary)" : "var(--surface-2)",
                            color: chartTimeframe === tf ? "#fff" : "var(--text-2)",
                            border: "none", padding: "6px 12px", borderRadius: "8px",
                            fontSize: "12px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s"
                          }}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  {chartTimeframe === "custom" && (
                    <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center", background: "var(--surface-2)", padding: "12px", borderRadius: "12px" }}>
                      <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface-1)" }} />
                      <span style={{ fontSize: "12px", color: "var(--text-3)" }}>to</span>
                      <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface-1)" }} />
                    </div>
                  )}

                  <div style={{ flex: 1, minHeight: "300px", position: "relative" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.trendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-3)" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-3)" }} />
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--border)", borderRadius: "8px", boxShadow: "var(--shadow-card)", padding: "12px" }}
                          itemStyle={{ color: "var(--text-1)", fontWeight: 700 }}
                          labelStyle={{ color: "var(--text-3)", fontSize: "13px", marginBottom: "4px" }}
                          formatter={(value) => [`${value} Cases`, "Registered"]}
                        />
                        <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut Chart: System Size */}
                <div className="card" style={{ padding: "28px", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ padding: "8px", borderRadius: "10px", background: "var(--surface-2)" }}>
                      <Sun style={{ width: "20px", height: "20px", color: "var(--color-warning)" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-1)", margin: 0 }}>Revenue by System Size</h3>
                    </div>
                  </div>
                  <div style={{ flex: 1, minHeight: "240px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sizeDistribution}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {sizeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => fmtCurrency(value)}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "var(--shadow-card)" }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ── 3. OPERATIONAL & DEPARTMENTAL BOTTLENECKS ── */}
              <div className="grid-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                
                {/* Case Status Distribution (Pie) */}
                <div className="card" style={{ padding: "28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ padding: "8px", borderRadius: "10px", background: "var(--surface-2)" }}>
                      <Layers style={{ width: "20px", height: "20px", color: "var(--color-purple)" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-1)", margin: 0 }}>Operational Funnel</h3>
                      <p style={{ fontSize: "13px", color: "var(--text-4)", marginTop: "2px" }}>Live case distribution</p>
                    </div>
                  </div>
                  <div style={{ height: "280px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stageDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => percent > 0.05 ? `${name}` : ''}
                          labelLine={false}
                        >
                          {stageDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "var(--shadow-card)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Escalations / Bottlenecks */}
                {(() => {
                  const escalated = cases.filter((c) => (c.escalation_level || 0) > 0);
                  const byCritical = cases.filter((c) => c.escalation_level === 3).length;
                  const byUrgent = cases.filter((c) => c.escalation_level === 2).length;
                  const byWatch = cases.filter((c) => c.escalation_level === 1).length;
                  
                  return (
                    <div className="card" style={{ padding: "28px", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                        <div style={{ padding: "8px", borderRadius: "10px", background: "var(--color-danger-muted)" }}>
                          <AlertTriangle style={{ width: "20px", height: "20px", color: "var(--color-danger)" }} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-1)", margin: 0 }}>Operational Bottlenecks</h3>
                          <p style={{ fontSize: "13px", color: "var(--text-4)", marginTop: "2px" }}>{escalated.length} active escalations across departments</p>
                        </div>
                      </div>

                      {escalated.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", borderRadius: "16px", padding: "20px" }}>
                          <CheckCircle2 style={{ width: "32px", height: "32px", color: "var(--color-accent)", marginBottom: "12px" }} />
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-2)" }}>All Clear</p>
                          <p style={{ fontSize: "12px", color: "var(--text-4)", textAlign: "center" }}>No active bottlenecks in any department.</p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, justifyContent: "center" }}>
                          {[
                            { label: "Critical (7+ days)", count: byCritical, color: "var(--color-danger)", bg: "var(--color-danger-muted)" },
                            { label: "Urgent (4-6 days)", count: byUrgent, color: "var(--color-warning)", bg: "var(--color-warning-muted)" },
                            { label: "Watch (2-3 days)", count: byWatch, color: "var(--color-info)", bg: "var(--color-info-light)" },
                          ].map(({ label, count, color, bg }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--surface-2)", borderRadius: "12px", borderLeft: `4px solid ${color}` }}>
                              <div>
                                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-1)" }}>{label.split(" ")[0]}</p>
                                <p style={{ fontSize: "12px", color: "var(--text-4)" }}>{label.substring(label.indexOf(" ") + 1)}</p>
                              </div>
                              <div style={{ background: bg, color, width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800 }}>
                                {count}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AnalyticsTab;
