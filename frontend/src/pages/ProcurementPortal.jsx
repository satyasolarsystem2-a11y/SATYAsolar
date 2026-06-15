import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AddInventoryItemModal from "../components/AddInventoryItemModal";
import B2BDispatchModal from "../components/B2BDispatchModal";
import toast from "react-hot-toast";
import { Plus, BarChart3, History, Building } from "lucide-react";

import { tabStyle, isLow, isOut } from "./ProcurementSections/procurementConstants";
import LowStockAlert from "./ProcurementSections/LowStockAlert";
import TopCards from "./ProcurementSections/TopCards";
import InventoryTable from "./ProcurementSections/InventoryTable";
import TransactionHistory from "./ProcurementSections/TransactionHistory";
import StockAdjustmentModal from "./ProcurementSections/StockAdjustmentModal";

export default function ProcurementPortal({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showB2BModal, setShowB2BModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  // Stock Adjustment
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [adjustType, setAdjustType] = useState("add");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustSaving, setAdjustSaving] = useState(false);

  const userName = localStorage.getItem("name") || "Admin";

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("inventory").select("*").order("name", { ascending: true });
      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      toast.error("Failed to load inventory: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const { data, error } = await supabase.from("inventory_transactions").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      setTransactions(data || []);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (tab === "history") fetchTransactions();
  }, [tab, fetchTransactions]);

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setModalMode("view");
    setShowAddModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setModalMode("edit");
    setShowAddModal(true);
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!adjustingItem || !adjustQty || Number(adjustQty) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    setAdjustSaving(true);
    try {
      const qty = Number(adjustQty);
      const isAdd = adjustType === "add";
      const change = isAdd ? qty : -qty;
      const newStock = adjustingItem.stock + change;

      if (newStock < 0) throw new Error("Stock quantity cannot be less than 0");

      const { error: updateError } = await supabase.from("inventory").update({ stock: newStock }).eq("id", adjustingItem.id);
      if (updateError) throw updateError;

      const { error: txError } = await supabase.from("inventory_transactions").insert({
        inventory_id: adjustingItem.id,
        inventory_name: adjustingItem.name,
        transaction_type: isAdd ? "stock_in" : "stock_out",
        quantity: change,
        stock_before: adjustingItem.stock,
        stock_after: newStock,
        notes: adjustNotes || (isAdd ? "Manual Stock Addition" : "Manual Stock Deduction"),
        created_by: userName,
      });

      if (txError) throw txError;

      toast.success(`Stock ${isAdd ? "added" : "deducted"} successfully!`);
      setAdjustingItem(null);
      setAdjustQty("");
      setAdjustNotes("");
      fetchInventory();
      fetchTransactions();
    } catch (err) {
      toast.error("Adjustment failed: " + err.message);
    } finally {
      setAdjustSaving(false);
    }
  };

  const filtered = inventory.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = inventory.filter((i) => isLow(i) && !isOut(i));
  const outOfStockItems = inventory.filter(isOut);
  const totalItems = inventory.length;
  const totalStockValue = inventory.reduce((s, i) => s + i.stock * (i.unit_price || i.purchase_price || 0), 0);
  const b2bDispatches = transactions.filter((t) => t.dispatch_type === "b2b").length;
  const b2cDispatches = transactions.filter((t) => t.dispatch_type === "b2c" || (!t.dispatch_type && t.transaction_type === "stock_out")).length;

  const ctx = {
    tab, setTab,
    inventory, fetchInventory, loading, filtered,
    transactions, fetchTransactions, txLoading,
    search, setSearch,
    adjustingItem, setAdjustingItem, adjustType, setAdjustType, adjustQty, setAdjustQty, adjustNotes, setAdjustNotes, adjustSaving, handleAdjustmentSubmit,
    lowStockItems, outOfStockItems, totalItems, totalStockValue, b2bDispatches, b2cDispatches,
    handleViewItem, handleEditItem,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--page-bg)" }}>
      <Sidebar onLogout={onLogout} />
      <main style={{ flex: 1, marginLeft: "var(--main-offset)", padding: "28px 32px", boxSizing: "border-box", maxWidth: "1400px", overflowX: "hidden" }}>
        <Header title="Procurement & Master Inventory" subtitle="Overarching stock control and B2B/B2C dispatch management" onLogout={onLogout} />

        <LowStockAlert ctx={ctx} />
        <TopCards ctx={ctx} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={tabStyle(tab === "dashboard")} onClick={() => setTab("dashboard")}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><BarChart3 size={14} /> Inventory Table</span>
            </button>
            <button style={tabStyle(tab === "history")} onClick={() => setTab("history")}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><History size={14} /> Transaction History</span>
            </button>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setShowB2BModal(true)}
              className="btn btn-outline"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "var(--surface-2)", border: "1px solid var(--border-color)", color: "var(--text-1)" }}
            >
              <Building size={16} /> B2B Dispatch
            </button>
            <button
              onClick={() => { setModalMode("create"); setSelectedItem(null); setShowAddModal(true); }}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px" }}
            >
              <Plus size={16} /> Add New Item
            </button>
          </div>
        </div>

        <InventoryTable ctx={ctx} />
        <TransactionHistory ctx={ctx} />

        <Footer />
      </main>

      {showAddModal && (
        <AddInventoryItemModal
          onClose={() => { setShowAddModal(false); setSelectedItem(null); }}
          onAdded={fetchInventory}
          item={selectedItem}
          mode={modalMode}
        />
      )}

      {showB2BModal && (
        <B2BDispatchModal
          onClose={() => setShowB2BModal(false)}
          onSave={() => { setShowB2BModal(false); fetchInventory(); fetchTransactions(); }}
          items={inventory}
        />
      )}

      <StockAdjustmentModal ctx={ctx} />
    </div>
  );
}
