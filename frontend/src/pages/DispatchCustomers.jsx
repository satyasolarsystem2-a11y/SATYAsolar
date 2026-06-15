import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import {
  Users,
  Building,
  Truck,
  ChevronRight,
  FileText,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


export default function DispatchCustomers({ onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'b2b' | 'b2c'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // For B2C cases details
  const [b2cDetails, setB2cDetails] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: txns, error } = await supabase
        .from("inventory_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const filteredTxns = (txns || []).filter(
        (t) =>
          t.dispatch_type === "b2b" ||
          t.dispatch_type === "b2c" ||
          (t.transaction_type === "stock_out" && !t.dispatch_type),
      );
      setTransactions(filteredTxns);

      // Fetch cases to get customer details for B2C
      const { data: casesData } = await supabase
        .from("cases")
        .select(
          "id, tracking_id, customer_name, phone, address, city, state, pincode",
        );

      const caseMap = {};
      (casesData || []).forEach((c) => {
        caseMap[c.id] = c;
      });
      setB2cDetails(caseMap);
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group B2B
  const b2bCustomers = {};
  transactions
    .filter((t) => t.dispatch_type === "b2b")
    .forEach((tx) => {
      const name = tx.b2b_client_name || "Unknown Client";
      if (!b2bCustomers[name]) b2bCustomers[name] = { txns: [], totalQty: 0 };
      b2bCustomers[name].txns.push(tx);
      b2bCustomers[name].totalQty += Math.abs(tx.quantity);
    });

  // Group B2C
  const b2cCustomers = {};
  transactions
    .filter(
      (t) =>
        t.dispatch_type === "b2c" ||
        (t.transaction_type === "stock_out" && !t.dispatch_type),
    )
    .forEach((tx) => {
      const nameStr = tx.notes?.replace("B2C dispatch for ", "") || "";
      const name =
        nameStr.split(" - ")[0] || tx.case_id || "Residential Customer";
      const caseInfo = tx.case_id ? b2cDetails[tx.case_id] : null;

      if (!b2cCustomers[name])
        b2cCustomers[name] = { txns: [], totalQty: 0, caseInfo };
      b2cCustomers[name].txns.push(tx);
      b2cCustomers[name].totalQty += Math.abs(tx.quantity);
      if (!b2cCustomers[name].caseInfo && caseInfo)
        b2cCustomers[name].caseInfo = caseInfo;
    });

  const customerList =
    filter === "b2b"
      ? Object.entries(b2bCustomers).map(([name, d]) => ({
          name,
          ...d,
          type: "B2B",
        }))
      : filter === "b2c"
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

  const handleGenerateInvoice = (customer) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor("#1e3a8a");
    doc.text("Satya Solar", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor("#64748b");
    doc.text("Dispatch Invoice / Delivery Challan", 14, 30);

    doc.setDrawColor("#e2e8f0");
    doc.line(14, 35, 196, 35);

    // Customer Info
    doc.setFontSize(12);
    doc.setTextColor("#0f172a");
    doc.text("Bill To / Dispatched To:", 14, 45);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(customer.name, 14, 53);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (customer.type === "B2B") {
      doc.text(`Customer Type: B2B Partner`, 14, 60);
    } else {
      doc.text(`Customer Type: B2C Residential`, 14, 60);
      if (customer.caseInfo) {
        if (customer.caseInfo.phone)
          doc.text(`Phone: ${customer.caseInfo.phone}`, 14, 67);
        if (customer.caseInfo.address) {
          const addr = `${customer.caseInfo.address}, ${customer.caseInfo.city || ""}, ${customer.caseInfo.state || ""} ${customer.caseInfo.pincode || ""}`;
          const splitAddress = doc.splitTextToSize(`Address: ${addr}`, 100);
          doc.text(splitAddress, 14, 74);
        }
      }
    }

    // Invoice Info
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 140, 45);
    doc.text(`Doc No: DC-${Date.now().toString().slice(-6)}`, 140, 52);

    // Items Table
    const tableData = customer.txns.map((tx, index) => [
      index + 1,
      tx.inventory_name,
      Math.abs(tx.quantity).toString(),
      new Date(tx.created_at).toLocaleDateString("en-IN"),
      tx.notes || "-",
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["S.No", "Item Name", "Quantity", "Dispatch Date", "Remarks"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: "#1e3a8a", textColor: "#ffffff" },
      styles: { fontSize: 9 },
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor("#0f172a");
    doc.text(`Total Items Dispatched: ${customer.totalQty}`, 14, finalY);

    doc.setFontSize(9);
    doc.setTextColor("#64748b");
    doc.text("This is an auto-generated delivery challan.", 14, finalY + 15);

    doc.autoPrint();
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
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
          boxSizing: "border-box",
          maxWidth: "1400px",
        }}
      >
        <Header
          title="Dispatch Customers"
          subtitle="View B2B and B2C clients, tracking history, and generate invoices"
          onLogout={onLogout}
        />

        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 24,
            height: "calc(100vh - 140px)",
          }}
        >
          {/* LEFT: Customer List */}
          <div
            style={{
              width: "400px",
              background: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  background: "var(--surface-2)",
                  borderRadius: 10,
                  padding: 4,
                  gap: 2,
                }}
              >
                {[
                  { key: "all", label: "All" },
                  { key: "b2b", label: "B2B" },
                  { key: "b2c", label: "B2C" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 13,
                      background:
                        filter === key
                          ? key === "b2b"
                            ? "#8b5cf6"
                            : key === "b2c"
                              ? "#0ea5e9"
                              : "var(--color-primary)"
                          : "transparent",
                      color: filter === key ? "#fff" : "var(--text-3)",
                      transition: "all 0.2s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div
                    className="animate-spin"
                    style={{
                      width: 24,
                      height: 24,
                      border: "2px solid var(--border)",
                      borderTopColor: "#2563EB",
                      borderRadius: "50%",
                      margin: "0 auto",
                    }}
                  />
                </div>
              ) : customerList.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: "var(--text-4)",
                  }}
                >
                  No customers found
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {customerList.map((customer, idx) => {
                    const isSelected = selectedCustomer?.name === customer.name;
                    const isB2B = customer.type === "B2B";
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCustomer(customer)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          background: isSelected
                            ? "var(--surface-2)"
                            : "transparent",
                          border: `1px solid ${isSelected ? "var(--border)" : "transparent"}`,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background =
                              "var(--surface-2)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: isB2B ? "#f5f3ff" : "#f0f9ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isB2B ? (
                            <Building size={16} color="#8b5cf6" />
                          ) : (
                            <Truck size={16} color="#0ea5e9" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "var(--text-1)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {customer.name}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text-4)" }}>
                            {customer.totalQty} items dispatched
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          color={isSelected ? "var(--text-2)" : "transparent"}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Customer Details & History */}
          <div
            style={{
              flex: 1,
              background: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {!selectedCustomer ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-4)",
                }}
              >
                <Users size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p style={{ fontSize: 15, fontWeight: 500 }}>
                  Select a customer to view details
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: "24px 32px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--surface-2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          background:
                            selectedCustomer.type === "B2B"
                              ? "#8b5cf6"
                              : "#0ea5e9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 24,
                          fontWeight: 700,
                        }}
                      >
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 4,
                          }}
                        >
                          <h2
                            style={{
                              fontSize: 20,
                              fontWeight: 700,
                              color: "var(--text-1)",
                              margin: 0,
                            }}
                          >
                            {selectedCustomer.name}
                          </h2>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              background:
                                selectedCustomer.type === "B2B"
                                  ? "#f5f3ff"
                                  : "#f0f9ff",
                              color:
                                selectedCustomer.type === "B2B"
                                  ? "#8b5cf6"
                                  : "#0ea5e9",
                            }}
                          >
                            {selectedCustomer.type}
                          </span>
                        </div>
                        {selectedCustomer.type === "B2C" &&
                          selectedCustomer.caseInfo && (
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-3)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                                marginTop: 8,
                              }}
                            >
                              {selectedCustomer.caseInfo.phone && (
                                <span>
                                  📞 {selectedCustomer.caseInfo.phone}
                                </span>
                              )}
                              {selectedCustomer.caseInfo.address && (
                                <span>
                                  📍 {selectedCustomer.caseInfo.address},{" "}
                                  {selectedCustomer.caseInfo.city},{" "}
                                  {selectedCustomer.caseInfo.state}{" "}
                                  {selectedCustomer.caseInfo.pincode}
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleGenerateInvoice(selectedCustomer)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "var(--color-primary)",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Download size={16} /> Download Invoice
                    </button>
                  </div>
                </div>

                <div
                  style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}
                >
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text-1)",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FileText size={16} color="var(--color-primary)" /> Dispatch
                    History
                  </h3>

                  <>
                    <div className="table-wrap hide-on-mobile">
                      <table style={{ width: "100%", minWidth: 500 }}>
                        <thead>
                          <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>Date</th>
                            <th>Notes / Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCustomer.txns.map((tx) => (
                            <tr key={tx.id}>
                              <td
                                style={{
                                  fontWeight: 600,
                                  color: "var(--text-1)",
                                }}
                              >
                                {tx.inventory_name}
                              </td>
                              <td
                                style={{
                                  fontWeight: 800,
                                  color:
                                    selectedCustomer.type === "B2B"
                                      ? "#8b5cf6"
                                      : "#0ea5e9",
                                }}
                              >
                                {Math.abs(tx.quantity)}
                              </td>
                              <td
                                style={{ color: "var(--text-4)", fontSize: 12 }}
                              >
                                {new Date(tx.created_at).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                              <td
                                style={{ color: "var(--text-3)", fontSize: 12 }}
                              >
                                {tx.notes || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div
                      className="mobile-only"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {selectedCustomer.txns.map((tx) => (
                        <div
                          key={tx.id}
                          style={{
                            background: "var(--surface-2)",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "1px solid var(--border)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
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
                              }}
                            >
                              {tx.inventory_name}
                            </div>
                            <div
                              style={{
                                fontWeight: 800,
                                color:
                                  selectedCustomer.type === "B2B"
                                    ? "#8b5cf6"
                                    : "#0ea5e9",
                                fontSize: "15px",
                              }}
                            >
                              {Math.abs(tx.quantity)}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                            <span style={{ fontWeight: 600 }}>Notes:</span>{" "}
                            {tx.notes || "-"}
                          </div>
                          <div
                            style={{
                              color: "var(--text-4)",
                              fontSize: 12,
                              textAlign: "right",
                            }}
                          >
                            {new Date(tx.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                </div>
              </>
            )}
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
