import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { IndianRupee, Plus, Clock, FileText, User } from "lucide-react";
import { edgeFetch, EDGE } from "../lib/supabaseClient";

export default function PaymentTracker({ caseId, userRole, onRefresh }) {
  const [payments, setPayments] = useState([]);
  const [caseInfo, setCaseInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentType: "installment",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const canAddPayment = ["admin", "accounts", "banking"].includes(userRole);

  const fetchPayments = useCallback(async () => {
    try {
      const [paymentsData, caseData] = await Promise.all([
        edgeFetch(EDGE.workflow, {
          action: "get_payments",
          caseId,
        }),
        edgeFetch(EDGE.workflow, {
          action: "get_one",
          caseId,
        })
      ]);
      setPayments(paymentsData || []);
      setCaseInfo(caseData || {});
    } catch (err) {
      console.error("Failed to load payments/case:", err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || !paymentData.paymentDate) {
      toast.error("Amount and date are required");
      return;
    }

    setSaving(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "add_payment",
        caseId,
        ...paymentData,
      });
      toast.success("Payment recorded successfully");
      setPaymentData({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentType: "installment",
        notes: "",
      });
      setShowAdd(false);
      fetchPayments();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const dealValue = caseInfo.total_amount || caseInfo.quotation_amount || caseInfo.product_price || 0;
  const balanceDue = dealValue - totalPaid;
  const lastPayment = payments.length > 0 
    ? new Date(Math.max(...payments.map(p => new Date(p.payment_date).getTime()))).toLocaleDateString() 
    : "None";

  if (loading)
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontSize: "13px",
          color: "#94a3b8",
        }}
      >
        Loading payments...
      </div>
    );

  return (
    <div
      style={{
        marginTop: "30px",
        borderTop: "1px solid #e2e8f0",
        paddingTop: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <IndianRupee size={16} color="#059669" />
            Payment History Tracker
          </h3>
        </div>

        {canAddPayment && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#fff",
              background: "#059669",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Add Payment
          </button>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Total Amount</p>
          <p style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>₹{Number(dealValue).toLocaleString("en-IN")}</p>
        </div>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Amount Received</p>
          <p style={{ fontSize: "20px", fontWeight: 800, color: "#065f46" }}>₹{Number(totalPaid).toLocaleString("en-IN")}</p>
        </div>
        <div style={{ background: balanceDue > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${balanceDue > 0 ? "#fecaca" : "#bbf7d0"}`, borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: balanceDue > 0 ? "#dc2626" : "#059669", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Balance Due</p>
          <p style={{ fontSize: "20px", fontWeight: 800, color: balanceDue > 0 ? "#991b1b" : "#065f46" }}>₹{Number(Math.max(0, balanceDue)).toLocaleString("en-IN")}</p>
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "14px 16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Last Payment</p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e40af" }}>{lastPayment}</p>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddPayment}
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#065f46",
                  marginBottom: "4px",
                }}
              >
                Date
              </label>
              <input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    paymentDate: e.target.value,
                  })
                }
                required
                className="input"
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#065f46",
                  marginBottom: "4px",
                }}
              >
                Amount (₹)
              </label>
              <input
                type="number"
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, amount: e.target.value })
                }
                placeholder="e.g. 50000"
                required
                className="input"
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#065f46",
                  marginBottom: "4px",
                }}
              >
                Type
              </label>
              <select
                value={paymentData.paymentType}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    paymentType: e.target.value,
                  })
                }
                className="input"
              >
                <option value="down_payment">Advance / Down Payment</option>
                <option value="installment">1st Installment</option>
                <option value="installment_2">2nd Installment</option>
                <option value="installment_3">3rd Installment</option>
                <option value="final">Final Payment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#065f46",
                  marginBottom: "4px",
                }}
              >
                Notes
              </label>
              <input
                type="text"
                value={paymentData.notes}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, notes: e.target.value })
                }
                placeholder="Cheque no, UPI ref..."
                className="input"
              />
            </div>
          </div>
          <div
            style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#475569",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#fff",
                background: "#059669",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      )}

      {payments.length === 0 ? (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            background: "#f8fafc",
            borderRadius: "10px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <FileText
            size={24}
            color="#94a3b8"
            style={{ margin: "0 auto 8px" }}
          />
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
            No payments recorded yet
          </p>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Add a payment entry to start tracking.
          </p>
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            paddingLeft: "16px",
            borderLeft: "2px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {payments.map((p) => (
            <div
              key={p.id}
              style={{
                position: "relative",
                background: "#fff",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "-21px",
                  top: "16px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#059669",
                  border: "2px solid #fff",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "6px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    ₹{Number(p.amount).toLocaleString("en-IN")}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      marginLeft: "8px",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#059669",
                      background: "#d1fae5",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {p.payment_type.replace("_", " ")}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    color: "#64748b",
                  }}
                >
                  <Clock size={12} />
                  {new Date(p.payment_date).toLocaleDateString()}
                </div>
              </div>
              {p.notes && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#475569",
                    marginBottom: "8px",
                  }}
                >
                  {p.notes}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10.5px",
                  color: "#94a3b8",
                }}
              >
                <User size={11} /> Recorded by {p.recorded_by}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
