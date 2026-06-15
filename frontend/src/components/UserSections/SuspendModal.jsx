import React, { useState } from "react";
import { STATUS_OPTIONS } from "./usersConstants";

const ChangeStatusModal = ({ ctx }) => {
  const {
    showSuspendModal,
    setShowSuspendModal,
    handleStatusChange,
    selectedUser,
    actionLoading,
  } = ctx;

  const [status, setStatus] = useState("inactive");
  const [showDates, setShowDates] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  if (!showSuspendModal || !selectedUser) return null;

  const isSuspend = status === "suspended" || status === "inactive";

  const handleConfirm = () => {
    handleStatusChange(selectedUser.id, status, isSuspend ? endDate : null, isSuspend ? startDate : null);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={() => setShowSuspendModal(false)}
    >
      <div
        style={{
          background: "#fff", borderRadius: "10px", width: "300px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "#fff", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <span style={{ color: "#1f2937", fontWeight: 700, fontSize: "18px" }}>Change Status</span>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {/* Status Dropdown */}
          <div style={{ marginBottom: "16px", position: "relative" }}>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setShowDates(false); // Reset date toggle when status changes
              }}
              style={{
                width: "100%",
                padding: "10px 32px 10px 12px",
                fontSize: "15px", fontWeight: 500,
                border: "1px solid #d1d5db", borderRadius: "6px",
                appearance: "none", cursor: "pointer", outline: "none",
                background: "#fff", color: "#374151",
              }}
            >
              <option value="" disabled>Select Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#4b5563", fontSize: "12px" }}>▼</span>
          </div>

          {/* Date Range for suspend/inactive */}
          {(status === "suspended" || status === "inactive") && (
            <div style={{ marginBottom: "24px" }}>
              {!showDates ? (
                <button
                  onClick={() => setShowDates(true)}
                  style={{
                    width: "100%", padding: "10px", fontSize: "14px", fontWeight: 600,
                    color: "#4b56a3", background: "#f0f4ff", border: "1px dashed #4b56a3",
                    borderRadius: "6px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Select Duration
                </button>
              ) : (
                <div style={{ display: "flex", gap: "10px", animation: "fadeIn 0.2s ease-in-out" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "6px" }}>
                      From
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "10px 6px", fontSize: "13px", fontWeight: 500,
                        border: "1px solid #d1d5db", borderRadius: "6px",
                        outline: "none", background: "#fff", color: "#374151",
                        minWidth: "0",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "6px" }}>
                      To
                    </label>
                    <input
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "10px 6px", fontSize: "13px", fontWeight: 500,
                        border: "1px solid #d1d5db", borderRadius: "6px",
                        outline: "none", background: "#fff", color: "#374151",
                        minWidth: "0",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => setShowSuspendModal(false)}
              style={{ padding: "8px 16px", borderRadius: "4px", border: "none", background: "#af5f9f", color: "#fff", fontSize: "15px", fontWeight: 500, cursor: "pointer" }}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              style={{ padding: "8px 16px", borderRadius: "4px", border: "none", background: "#4b56a3", color: "#fff", fontSize: "15px", fontWeight: 500, cursor: "pointer" }}
              disabled={actionLoading}
            >
              {actionLoading ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeStatusModal;
