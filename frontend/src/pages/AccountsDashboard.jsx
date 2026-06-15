import React, { useState, useEffect, useCallback } from "react";
import { edgeFetch, EDGE } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle2, Search, ChevronDown, Download } from "lucide-react";
import { toast } from "react-hot-toast";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function AccountsDashboard({ onLogout }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const fetchCases = useCallback(async () => {
    try {
      const data = await edgeFetch(EDGE.workflow, { action: "list_cases" });
      setCases(data || []);
    } catch (err) {
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  // Compute payment summary per case
  const casesWithFinance = cases.map((c) => {
    const totalAmount = Number(c.system_specs?.productPrice || c.quotation_amount || c.product_price || 0);
    const receivedAmount = Number(c.total_received || 0);
    const balance = totalAmount - receivedAmount;
    return { ...c, totalAmount, receivedAmount, balance };
  });

  // Filter
  const filtered = casesWithFinance.filter((c) => {
    const matchSearch =
      !search ||
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.case_id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && c.balance > 0) ||
      (filterStatus === "cleared" && c.balance <= 0);
    return matchSearch && matchStatus;
  });

  // Totals
  const totalDeal = filtered.reduce((s, c) => s + c.totalAmount, 0);
  const totalReceived = filtered.reduce((s, c) => s + c.receivedAmount, 0);
  const totalBalance = filtered.reduce((s, c) => s + Math.max(0, c.balance), 0);

  // Excel Export
  const handleExport = () => {
    const rows = [
      ["Case ID", "Customer", "Stage", "Total Amount", "Received", "Balance"],
      ...filtered.map((c) => [
        c.case_id,
        c.customer_name,
        c.current_stage,
        c.totalAmount,
        c.receivedAmount,
        Math.max(0, c.balance),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export successful!");
  };

  const card = (label, value, color, bgColor, borderColor) => (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: "16px", padding: "20px 24px" }}>
      <p style={{ fontSize: "12px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "26px", fontWeight: 900, color, lineHeight: 1 }}>{fmt(value)}</p>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--page-bg)" }}>
      <Sidebar onLogout={onLogout} />
      <main style={{ flex: 1, marginLeft: "var(--main-offset)", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-1)", display: "flex", alignItems: "center", gap: "12px" }}>
            <IndianRupee size={28} color="var(--brand)" /> Accounts Dashboard
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-3)", marginTop: "6px" }}>
            Real-time payment tracking — Total Amount − Received = Balance Due
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {card("Total Deal Value", totalDeal, "#475569", "#f8fafc", "#e2e8f0")}
          {card("Amount Received", totalReceived, "#059669", "#f0fdf4", "#bbf7d0")}
          {card("Balance Due", totalBalance, "#dc2626", "#fef2f2", "#fecaca")}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "16px", padding: "20px 24px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Active Cases</p>
            <p style={{ fontSize: "26px", fontWeight: 900, color: "#1e40af" }}>{filtered.length}</p>
          </div>
        </div>

        {/* Filters + Export */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or Case ID..."
              style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "14px", background: "var(--surface)", color: "var(--text-1)", boxSizing: "border-box", outline: "none" }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "14px", background: "var(--surface)", color: "var(--text-1)", outline: "none", cursor: "pointer" }}
          >
            <option value="all">All Cases</option>
            <option value="pending">Balance Pending</option>
            <option value="cleared">Fully Cleared</option>
          </select>
          <button
            onClick={handleExport}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>

        {/* Cases Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-3)" }}>Loading accounts data...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-3)" }}>No cases found.</div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px 140px 140px 140px 40px", padding: "12px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", gap: "8px" }}>
              {["Case ID", "Customer", "Stage", "Total Amount", "Received", "Balance Due", ""].map((h) => (
                <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>

            {filtered.map((c, i) => (
              <div key={c.id || i}>
                <div
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px 140px 140px 140px 40px", padding: "14px 20px", gap: "8px", alignItems: "center", borderBottom: "1px solid var(--border)", cursor: "pointer", background: expanded === c.id ? "var(--surface-2)" : "transparent", transition: "background 0.15s" }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand)", fontFamily: "monospace" }}>{c.case_id}</span>
                  <div>
                    <p style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-1)" }}>{c.customer_name}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-3)" }}>{c.phone}</p>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px", width: "fit-content" }}>{c.current_stage}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-1)" }}>{fmt(c.totalAmount)}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#059669" }}>{fmt(c.receivedAmount)}</span>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: c.balance > 0 ? "#dc2626" : "#059669" }}>
                    {c.balance > 0 ? fmt(c.balance) : <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={14} /> Cleared</span>}
                  </span>
                  <ChevronDown size={16} style={{ color: "var(--text-3)", transform: expanded === c.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </div>

                {/* Expanded Row */}
                {expanded === c.id && (
                  <div style={{ padding: "16px 20px 20px", background: "#fafbff", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                      <div><p style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, marginBottom: "4px" }}>PAYMENT TYPE</p><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-1)", textTransform: "capitalize" }}>{c.payment_type || "—"}</p></div>
                      <div><p style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, marginBottom: "4px" }}>BANK NAME</p><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-1)" }}>{c.bank_name || "—"}</p></div>
                      <div><p style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, marginBottom: "4px" }}>LOAN AMOUNT</p><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-1)" }}>{fmt(c.loan_amount)}</p></div>
                      <div><p style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, marginBottom: "4px" }}>DOWN PAYMENT</p><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-1)" }}>{fmt(c.down_payment)}</p></div>
                      <div><p style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 600, marginBottom: "4px" }}>ADDRESS</p><p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-2)" }}>{c.address || "—"}</p></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}
