import React, { useState, useEffect, useCallback } from "react";
import { supabase, edgeFetch, EDGE } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { Shield, Search, RefreshCw, Download } from "lucide-react";

const ACTION_COLORS = {
  stage_updated: { bg: "#eff6ff", text: "#1d4ed8" },
  mark_delayed: { bg: "#fff7ed", text: "#c2410c" },
  unmark_delayed: { bg: "#f0fdf4", text: "#15803d" },
  document_verified: { bg: "#f5f3ff", text: "#5b21b6" },
  technical_qa_note: { bg: "#ecfeff", text: "#155e75" },
  accounts_note: { bg: "#f7fee7", text: "#3f6212" },
  crm_interaction: { bg: "#fdf4ff", text: "#7e22ce" },
  portal_link_generated: { bg: "#fef9c3", text: "#a16207" },
  customer_approved: { bg: "#f0fdf4", text: "#15803d" },
  customer_declined: { bg: "#fff1f2", text: "#be123c" },
  finance_updated: { bg: "#fffbeb", text: "#92400e" },
  dispatch_materials: { bg: "#e0f2fe", text: "#075985" },
};

const getActionMeta = (type) =>
  ACTION_COLORS[type] || { bg: "#f1f5f9", text: "#475569" };

const DEPT_LABELS = {
  admin: "👑 Admin",
  sales: "📊 Sales",
  registration: "📋 Registration",
  banking: "🏦 Banking",
  inventory: "📦 Inventory",
  field_installation: "⚡ Installation",
  subsidy: "🌿 Subsidy",
  technical: "🔬 Technical QA",
  accounts: "💰 Accounts",
  customer_service: "🎧 Customer Service",
  customer: "👤 Customer",
};

export default function AuditLogViewer({ onLogout }) {
  const [logs, setLogs] = useState([]);
  const [casesMap, setCasesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchCasesMap = useCallback(async () => {
    try {
      const data = await edgeFetch(EDGE.workflow, { action: "get_all" });
      const map = {};
      data.forEach((c) => {
        map[c.id] = c;
      });
      setCasesMap(map);
    } catch (err) {
      console.error("Failed to load cases for audit log:", err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("case_history")
        .select("*", { count: "exact" })
        .order("timestamp", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterDept) query = query.eq("department", filterDept);
      if (filterAction) query = query.eq("action_type", filterAction);
      if (dateFrom) query = query.gte("timestamp", dateFrom);
      if (dateTo) query = query.lte("timestamp", dateTo + "T23:59:59Z");

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      toast.error("Failed to load audit log: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterDept, filterAction, dateFrom, dateTo]);

  useEffect(() => {
    fetchCasesMap();
    fetchLogs();
  }, [fetchCasesMap, fetchLogs]);

  const filtered = logs.filter((log) => {
    const c = casesMap[log.case_id] || {};
    const cId = c.customer_id || c.case_id || log.case_id || "";
    const searchLower = search.toLowerCase();

    return (
      !search ||
      cId.toLowerCase().includes(searchLower) ||
      (c.customer_name &&
        c.customer_name.toLowerCase().includes(searchLower)) ||
      log.case_id?.toLowerCase().includes(searchLower) ||
      log.updated_by?.toLowerCase().includes(searchLower) ||
      log.notes?.toLowerCase().includes(searchLower) ||
      log.action_type?.toLowerCase().includes(searchLower)
    );
  });

  const handleExportCSV = () => {
    const rows = [
      [
        "Timestamp",
        "Customer ID",
        "Customer Name",
        "Action",
        "Department",
        "By",
        "Stage",
        "Notes",
      ],
      ...filtered.map((l) => {
        const c = casesMap[l.case_id] || {};
        const custId = c.customer_id || c.case_id || l.case_id || "";
        const custName = c.customer_name || "";
        return [
          new Date(l.timestamp).toLocaleString("en-IN"),
          custId,
          custName,
          l.action_type || "",
          l.department || "",
          l.updated_by || "",
          l.stage || "",
          (l.notes || "").replace(/"/g, '""'),
        ].map((v) => `"${v}"`);
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported as CSV");
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
          padding: "28px 32px",
        }}
      >
        <Header
          title="Audit Log"
          subtitle="Immutable record of all system actions and changes"
          onLogout={onLogout}
        />

        {/* Security notice */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a, #1e1b4b)",
            borderRadius: "var(--radius-lg)",
            padding: "14px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Shield size={18} color="#818cf8" style={{ flexShrink: 0 }} />
          <p
            style={{
              fontSize: 12.5,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "#a5b4fc" }}>Immutable Audit Trail</strong>{" "}
            — All entries are read-only and cannot be deleted or modified.
            Tamper-evident log for compliance and security review. Admin access
            only.
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          {/* Search */}
          <div style={{ flex: "2 1 200px" }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-4)",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Search
            </label>
            <div style={{ position: "relative" }}>
              <Search
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-4)",
                }}
                size={13}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Case ID, user, action, notes…"
                className="input"
                style={{ paddingLeft: 32, width: "100%" }}
              />
            </div>
          </div>

          {/* Department filter */}
          <div style={{ flex: "1 1 140px" }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-4)",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Department
            </label>
            <select
              className="input"
              value={filterDept}
              onChange={(e) => {
                setFilterDept(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Departments</option>
              {Object.entries(DEPT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Action filter */}
          <div style={{ flex: "1 1 160px" }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-4)",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Action Type
            </label>
            <select
              className="input"
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Actions</option>
              {Object.keys(ACTION_COLORS).map((k) => (
                <option key={k} value={k}>
                  {k.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div style={{ flex: "1 1 130px" }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-4)",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              From
            </label>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div style={{ flex: "1 1 130px" }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-4)",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              To
            </label>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <button
              onClick={fetchLogs}
              className="btn btn-ghost btn-sm"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Log Table */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div
                className="animate-spin"
                style={{
                  width: 28,
                  height: 28,
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--brand)",
                  borderRadius: "50%",
                  margin: "0 auto 12px",
                }}
              />
              <p style={{ color: "var(--text-4)", fontSize: 13 }}>
                Loading audit log…
              </p>
            </div>
          ) : (
            <>
              <>
                <div className="table-wrap hide-on-mobile">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 130 }}>Timestamp</th>
                        <th style={{ width: 140 }}>Customer ID</th>
                        <th style={{ width: 140 }}>Action</th>
                        <th style={{ width: 120 }}>Department</th>
                        <th style={{ width: 120 }}>By</th>
                        <th style={{ width: 140 }}>Stage</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((log) => {
                        const { bg, text } = getActionMeta(log.action_type);
                        const caseObj = casesMap[log.case_id] || {};
                        const displayId =
                          caseObj.customer_id ||
                          caseObj.case_id ||
                          log.case_id ||
                          "—";
                        return (
                          <tr key={log.id}>
                            <td
                              style={{
                                fontSize: 11,
                                color: "var(--text-4)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {log.timestamp
                                ? new Date(log.timestamp).toLocaleString(
                                    "en-IN",
                                    { dateStyle: "short", timeStyle: "short" },
                                  )
                                : "—"}
                            </td>
                            <td>
                              <div
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: 12,
                                  color: "var(--color-primary)",
                                  fontWeight: 600,
                                }}
                              >
                                {displayId}
                              </div>
                              {caseObj.customer_name && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "var(--text-3)",
                                    marginTop: 2,
                                  }}
                                >
                                  {caseObj.customer_name}
                                </div>
                              )}
                            </td>
                            <td>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 99,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: bg,
                                  color: text,
                                  textTransform: "capitalize",
                                  whiteSpace: "nowrap",
                                  display: "inline-block",
                                }}
                              >
                                {(log.action_type || "—").replace(/_/g, " ")}
                              </span>
                            </td>
                            <td
                              style={{ fontSize: 12, color: "var(--text-3)" }}
                            >
                              {DEPT_LABELS[log.department] ||
                                log.department ||
                                "—"}
                            </td>
                            <td
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--text-2)",
                              }}
                            >
                              {log.updated_by || "—"}
                            </td>
                            <td
                              style={{ fontSize: 12, color: "var(--text-3)" }}
                            >
                              {log.stage || log.new_stage || "—"}
                            </td>
                            <td
                              style={{
                                fontSize: 12,
                                color: "var(--text-3)",
                                maxWidth: 280,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {log.notes || "—"}
                            </td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: "center",
                              padding: 40,
                              color: "var(--text-4)",
                            }}
                          >
                            No audit log entries found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div
                  className="mobile-only"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    padding: "16px",
                    background: "var(--page-bg)",
                  }}
                >
                  {filtered.map((log) => {
                    const { bg, text } = getActionMeta(log.action_type);
                    const caseObj = casesMap[log.case_id] || {};
                    const displayId =
                      caseObj.customer_id ||
                      caseObj.case_id ||
                      log.case_id ||
                      "—";
                    return (
                      <div
                        key={log.id}
                        style={{
                          background: "var(--surface)",
                          padding: "16px",
                          borderRadius: "12px",
                          border: "1px solid var(--border)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: 13,
                                color: "var(--color-primary)",
                                fontWeight: 600,
                              }}
                            >
                              {displayId}
                            </div>
                            {caseObj.customer_name && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-3)",
                                  marginTop: 2,
                                }}
                              >
                                {caseObj.customer_name}
                              </div>
                            )}
                          </div>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 99,
                              fontSize: 10,
                              fontWeight: 700,
                              background: bg,
                              color: text,
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {(log.action_type || "—").replace(/_/g, " ")}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                            background: "var(--surface-2)",
                            padding: "12px",
                            borderRadius: "8px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-4)",
                                textTransform: "uppercase",
                                fontWeight: 600,
                              }}
                            >
                              Department
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "var(--text-1)",
                                marginTop: "4px",
                              }}
                            >
                              {DEPT_LABELS[log.department] ||
                                log.department ||
                                "—"}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-4)",
                                textTransform: "uppercase",
                                fontWeight: 600,
                              }}
                            >
                              By
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "var(--text-2)",
                                marginTop: "4px",
                              }}
                            >
                              {log.updated_by || "—"}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-4)",
                                textTransform: "uppercase",
                                fontWeight: 600,
                              }}
                            >
                              Stage
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "var(--text-3)",
                                marginTop: "4px",
                              }}
                            >
                              {log.stage || log.new_stage || "—"}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-4)",
                                textTransform: "uppercase",
                                fontWeight: 600,
                              }}
                            >
                              Timestamp
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--text-4)",
                                marginTop: "4px",
                              }}
                            >
                              {log.timestamp
                                ? new Date(log.timestamp).toLocaleString(
                                    "en-IN",
                                    { dateStyle: "short", timeStyle: "short" },
                                  )
                                : "—"}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                          <span
                            style={{ fontWeight: 600, color: "var(--text-2)" }}
                          >
                            Notes:
                          </span>{" "}
                          {log.notes || "—"}
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--text-4)",
                      }}
                    >
                      No audit log entries found for the selected filters.
                    </div>
                  )}
                </div>
              </>

              {/* Pagination */}
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p style={{ fontSize: 12, color: "var(--text-4)" }}>
                  Showing {page * PAGE_SIZE + 1}–
                  {page * PAGE_SIZE + filtered.length} entries (page {page + 1})
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    style={{ opacity: page === 0 ? 0.4 : 1 }}
                  >
                    ← Prev
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={filtered.length < PAGE_SIZE}
                    onClick={() => setPage((p) => p + 1)}
                    style={{ opacity: filtered.length < PAGE_SIZE ? 0.4 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
