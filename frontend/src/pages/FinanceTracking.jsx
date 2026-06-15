import React, { useState, useEffect } from "react";
import { edgeFetch, EDGE } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckCircle2, AlertTriangle, Landmark, RefreshCw, Banknote, Building2, Clock } from "lucide-react";

import OverviewTab from "./FinanceSections/OverviewTab";
import TrackerTab from "./FinanceSections/TrackerTab";

const FinanceTracking = ({ onLogout }) => {
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  const [activeFinanceType, setActiveFinanceType] = useState("loan");

  const cases = allCases.filter(
    (c) => (c.payment_type || "").toLowerCase() === activeFinanceType
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await edgeFetch(EDGE.workflow, { action: "get_all" });
      setAllCases(data);
    } catch {
      toast.error("Failed to load finance cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalLoans = allCases.filter(
    (c) => (c.payment_type || "").toLowerCase() === "loan"
  ).length;
  const approvedLoans = allCases.filter(
    (c) =>
      (c.payment_type || "").toLowerCase() === "loan" &&
      c.finance_final_status === "Approved"
  ).length;
  const pendingVisits = allCases.filter(
    (c) =>
      (c.payment_type || "").toLowerCase() === "loan" &&
      !c.bank_visited_date &&
      c.finance_final_status !== "Approved"
  ).length;

  const totalCash = allCases.filter(
    (c) => (c.payment_type || "").toLowerCase() === "cash"
  ).length;
  const cashConfirmed = allCases.filter(
    (c) =>
      (c.payment_type || "").toLowerCase() === "cash" &&
      c.payment_mode &&
      c.payment_mode.trim() !== ""
  ).length;
  const pendingCash = totalCash - cashConfirmed;

  const cardData =
    activeFinanceType === "loan"
      ? [
          { label: "Total Loan Cases", value: totalLoans, color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: Landmark },
          { label: "Approved Loans", value: approvedLoans, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: CheckCircle2 },
          { label: "Pending Bank Visit", value: pendingVisits, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: AlertTriangle },
        ]
      : [
          { label: "Total Cash Cases", value: totalCash, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: Banknote },
          { label: "Cash Confirmed", value: cashConfirmed, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: CheckCircle2 },
          { label: "Pending Cash Mode", value: pendingCash, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: Clock },
        ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--page-bg)" }}>
      <Sidebar onLogout={onLogout} />

      <main style={{ flex: 1, marginLeft: "var(--main-offset)", padding: "28px 32px", maxWidth: "1400px", boxSizing: "border-box" }}>
        <Header
          title="Finance Command Center"
          subtitle="Manage loan approvals, cash confirmations, and case status"
          roleBadge="Banking"
          onLogout={onLogout}
        />

        {/* ── Type Switcher (Loan vs Cash) ── */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setActiveFinanceType("loan")}
            style={{
              padding: "8px 24px",
              borderRadius: "8px",
              background: activeFinanceType === "loan" ? "#2563eb" : "#fff",
              color: activeFinanceType === "loan" ? "#fff" : "#475569",
              border: "1px solid #bfdbfe",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Building2 size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "6px" }} /> Loan Cases
          </button>
          <button
            onClick={() => setActiveFinanceType("cash")}
            style={{
              padding: "8px 24px",
              borderRadius: "8px",
              background: activeFinanceType === "cash" ? "#16a34a" : "#fff",
              color: activeFinanceType === "cash" ? "#fff" : "#475569",
              border: "1px solid #bbf7d0",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Banknote size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "6px" }} /> Cash Cases
          </button>
        </div>

        {/* ── View Switcher ── */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
            { key: "overview", label: "📊 Overview" },
            { key: "tracker", label: activeFinanceType === "loan" ? "🏦 Loan Tracker" : "💵 Cash Payment Tracker" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              style={{
                padding: "8px 18px",
                borderRadius: "9999px",
                border: "1.5px solid",
                borderColor: activeView === key ? "var(--color-primary)" : "var(--color-border)",
                background: activeView === key ? "var(--color-primary)" : "transparent",
                color: activeView === key ? "#fff" : "var(--text-3)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
          <button onClick={loadData} className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", gap: "6px" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {activeView === "overview" && (
          <OverviewTab cardData={cardData} cases={cases} setActiveView={setActiveView} />
        )}

        {activeView === "tracker" && (
          <TrackerTab cases={cases} loading={loading} loadData={loadData} />
        )}

        <Footer />
      </main>
    </div>
  );
};

export default FinanceTracking;
