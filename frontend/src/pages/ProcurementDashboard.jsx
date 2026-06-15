import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import {
  Package,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Building,
  Truck,
  CheckCircle,
} from "lucide-react";
import { PALETTE } from "./ProcurementDashboardSections/dashboardConstants";
import DashboardAlertBanner from "./ProcurementDashboardSections/DashboardAlertBanner";
import DashboardStatCards from "./ProcurementDashboardSections/DashboardStatCards";
import PieChartsRow from "./ProcurementDashboardSections/PieChartsRow";
import ItemDrillDownList from "./ProcurementDashboardSections/ItemDrillDownList";
import CustomerDispatchSection from "./ProcurementDashboardSections/CustomerDispatchSection";
import QuickActions from "./ProcurementDashboardSections/QuickActions";
import ItemDrillModal from "./ProcurementDashboardSections/ItemDrillModal";

export default function ProcurementDashboard({ onLogout }) {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchFilter, setDispatchFilter] = useState("all"); // 'all' | 'b2b' | 'b2c'
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  const userName = localStorage.getItem("name") || "Procurement";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: inv }, { data: txns }] = await Promise.all([
        supabase
          .from("inventory")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("inventory_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      setInventory(inv || []);
      setTransactions(txns || []);
    } catch (err) {
      toast.error("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Computed stats ── */
  const totalItems = inventory.length;
  const totalValue = inventory.reduce(
    (s, i) => s + i.stock * (i.unit_price || i.purchase_price || 0),
    0,
  );
  const lowStockItems = inventory.filter(
    (i) =>
      i.low_stock_threshold && i.stock <= i.low_stock_threshold && i.stock > 0,
  );
  const outOfStockItems = inventory.filter((i) => i.stock === 0);
  const inStockItems = inventory.filter(
    (i) => i.stock > 0 && !lowStockItems.includes(i),
  );

  const b2bTxns = transactions.filter((t) => t.dispatch_type === "b2b");
  const b2cTxns = transactions.filter(
    (t) =>
      t.dispatch_type === "b2c" ||
      (t.transaction_type === "stock_out" && !t.dispatch_type),
  );
  const b2bTotal = b2bTxns.reduce((s, t) => s + Math.abs(t.quantity), 0);
  const b2cTotal = b2cTxns.reduce((s, t) => s + Math.abs(t.quantity), 0);

  /* ── Pie slices: Stock Status ── */
  const stockSlices = [
    { label: "In Stock", value: inStockItems.length, color: "#10b981" },
    { label: "Low Stock", value: lowStockItems.length, color: "#f59e0b" },
    { label: "Out of Stock", value: outOfStockItems.length, color: "#ef4444" },
  ].filter((s) => s.value > 0);

  /* ── Pie slices: Dispatch Type ── */
  const dispatchSlices = [
    { label: "B2B Dispatches", value: b2bTotal, color: "#8b5cf6" },
    { label: "B2C Dispatches", value: b2cTotal, color: "#0ea5e9" },
  ].filter((s) => s.value > 0);

  /* ── Category pie ── */
  const catMap = {};
  inventory.forEach((item, i) => {
    const cat = item.category || "Other";
    if (!catMap[cat])
      catMap[cat] = {
        count: 0,
        color: PALETTE[Object.keys(catMap).length % PALETTE.length],
      };
    catMap[cat].count++;
  });
  const categorySlices = Object.entries(catMap).map(
    ([label, { count, color }]) => ({ label, value: count, color }),
  );

  /* ── B2B Customers group ── */
  const b2bCustomers = {};
  b2bTxns.forEach((tx) => {
    const name = tx.b2b_client_name || "Unknown Client";
    if (!b2bCustomers[name]) b2bCustomers[name] = { txns: [], totalQty: 0 };
    b2bCustomers[name].txns.push(tx);
    b2bCustomers[name].totalQty += Math.abs(tx.quantity);
  });

  /* ── B2C Customers group (from notes / cases) ── */
  const b2cCustomers = {};
  b2cTxns.forEach((tx) => {
    const name =
      tx.notes?.replace("B2C dispatch for ", "").split(" - ")[0] ||
      tx.case_id ||
      "Residential Customer";
    if (!b2cCustomers[name]) b2cCustomers[name] = { txns: [], totalQty: 0 };
    b2cCustomers[name].txns.push(tx);
    b2cCustomers[name].totalQty += Math.abs(tx.quantity);
  });

  /* ── Filtered customer list for display ── */
  const customerData =
    dispatchFilter === "b2b"
      ? Object.entries(b2bCustomers).map(([name, d]) => ({
          name,
          ...d,
          type: "B2B",
        }))
      : dispatchFilter === "b2c"
        ? Object.entries(b2cCustomers).map(([name, d]) => ({
            name,
            ...d,
            type: "B2C",
          }))
        : [
            ...Object.entries(b2bCustomers).map(([name, d]) => ({
              name,
              ...d,
              type: "B2B",
            })),
            ...Object.entries(b2cCustomers).map(([name, d]) => ({
              name,
              ...d,
              type: "B2C",
            })),
          ].sort((a, b) => b.totalQty - a.totalQty);

  const stats = [
    {
      label: "Total Items",
      value: totalItems,
      icon: Package,
      color: "#2563EB",
      bg: "#eff6ff",
    },
    {
      label: "Stock Value",
      value: `₹${totalValue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "#10b981",
      bg: "#ecfdf5",
    },
    {
      label: "In Stock",
      value: inStockItems.length,
      icon: CheckCircle,
      color: "#10b981",
      bg: "#ecfdf5",
    },
    {
      label: "Low Stock",
      value: lowStockItems.length,
      icon: TrendingDown,
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    {
      label: "Out of Stock",
      value: outOfStockItems.length,
      icon: AlertTriangle,
      color: "#ef4444",
      bg: "#fef2f2",
    },
    {
      label: "B2B Dispatched",
      value: b2bTotal,
      icon: Building,
      color: "#8b5cf6",
      bg: "#f5f3ff",
    },
    {
      label: "B2C Dispatched",
      value: b2cTotal,
      icon: Truck,
      color: "#0ea5e9",
      bg: "#f0f9ff",
    },
  ];

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
          boxSizing: "border-box",
          maxWidth: "1400px",
        }}
      >
        <Header
          title={`Welcome back, ${userName.split(" ")[0]} 👋`}
          subtitle="Procurement Dashboard — Full inventory & dispatch analytics"
          onLogout={onLogout}
        />

        <DashboardAlertBanner
          outOfStockItems={outOfStockItems}
          lowStockItems={lowStockItems}
          loading={loading}
        />

        <DashboardStatCards stats={stats} loading={loading} />

        <PieChartsRow
          stockSlices={stockSlices}
          dispatchSlices={dispatchSlices}
          categorySlices={categorySlices}
          loading={loading}
        />

        <ItemDrillDownList
          inventory={inventory}
          transactions={transactions}
          loading={loading}
          fetchData={fetchData}
          setSelectedItem={setSelectedItem}
        />

        <CustomerDispatchSection
          customerData={customerData}
          dispatchFilter={dispatchFilter}
          setDispatchFilter={setDispatchFilter}
          loading={loading}
          b2bCustomersCount={Object.keys(b2bCustomers).length}
          b2cCustomersCount={Object.keys(b2cCustomers).length}
          expandedCustomer={expandedCustomer}
          setExpandedCustomer={setExpandedCustomer}
        />

        <QuickActions />

        <Footer />
      </main>

      {selectedItem && (
        <ItemDrillModal
          item={selectedItem}
          transactions={transactions}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
