import React from "react";
import { History } from "lucide-react";
import { cardStyle } from "./procurementConstants";

const TransactionHistory = ({ ctx }) => {
  const { tab, txLoading, transactions } = ctx;

  if (tab !== "history") return null;

  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 20 }}>
        <History size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
        Complete Transaction Log
      </h3>
      {txLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div
            className="animate-spin"
            style={{ width: 28, height: 28, border: "2px solid var(--border)", borderTopColor: "var(--brand)", borderRadius: "50%", margin: "0 auto 12px" }}
          />
        </div>
      ) : (
        <>
          <div className="table-wrap hide-on-mobile">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Action</th>
                  <th>Quantity</th>
                  <th>Before → After</th>
                  <th>User</th>
                  <th>Notes / Reference</th>
                  <th>Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isPos = tx.quantity > 0;
                  const typeColor =
                    tx.transaction_type === "stock_in" ||
                    tx.transaction_type === "release" ||
                    (tx.transaction_type === "adjustment" && isPos)
                      ? "#10b981"
                      : tx.transaction_type === "reservation"
                        ? "#8b5cf6"
                        : "#ef4444";
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 600, fontSize: 13, color: "var(--text-1)" }}>
                        {tx.inventory_name || "—"}
                      </td>
                      <td>
                        <span style={{ padding: "4px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: `${typeColor}15`, color: typeColor }}>
                          {tx.transaction_type?.replace("_", " ")}
                        </span>
                        {tx.dispatch_type && (
                          <span style={{ marginLeft: 6, padding: "4px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "#e0e7ff", color: "#4338ca" }}>
                            {tx.dispatch_type}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 800, color: typeColor, fontSize: 14 }}>
                        {isPos ? "+" : ""}
                        {tx.quantity}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 600 }}>
                        {tx.stock_before} <span style={{ color: "var(--border)" }}>→</span> {tx.stock_after}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>
                        {tx.created_by || "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tx.notes || tx.case_id || "—"}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-4)", whiteSpace: "nowrap" }}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-4)" }}>
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
            {transactions.map((tx) => {
              const isPos = tx.quantity > 0;
              const typeColor =
                tx.transaction_type === "stock_in" ||
                tx.transaction_type === "release" ||
                (tx.transaction_type === "adjustment" && isPos)
                  ? "#10b981"
                  : tx.transaction_type === "reservation"
                    ? "#8b5cf6"
                    : "#ef4444";
              return (
                <div key={tx.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-1)" }}>
                      {tx.inventory_name || "—"}
                    </div>
                    <div style={{ fontWeight: 800, color: typeColor, fontSize: 15 }}>
                      {isPos ? "+" : ""}
                      {tx.quantity}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ padding: "4px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: `${typeColor}15`, color: typeColor }}>
                      {tx.transaction_type?.replace("_", " ")}
                    </span>
                    {tx.dispatch_type && (
                      <span style={{ padding: "4px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "#e0e7ff", color: "#4338ca" }}>
                        {tx.dispatch_type}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "var(--surface-2)", padding: "12px", borderRadius: "var(--radius-md)" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", fontWeight: 600 }}>
                        Before → After
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 600 }}>
                        {tx.stock_before} <span style={{ color: "var(--text-4)" }}>→</span> {tx.stock_after}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", fontWeight: 600 }}>
                        User
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-1)" }}>
                        {tx.created_by || "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-2)" }}>Notes: </span>
                    {tx.notes || tx.case_id || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 4 }}>
                    {tx.created_at ? new Date(tx.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-4)", background: "var(--surface-2)", borderRadius: "var(--radius-lg)" }}>
                No transactions found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
