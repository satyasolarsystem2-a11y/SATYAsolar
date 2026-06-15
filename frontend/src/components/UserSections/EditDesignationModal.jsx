import React, { useState } from "react";
import { X, Edit3 } from "lucide-react";
import { DESIGNATION_OPTIONS } from "./usersConstants";

const EditDesignationModal = ({ ctx }) => {
  const {
    showDesignationModal,
    setShowDesignationModal,
    handleDesignationChange,
    selectedUser,
    actionLoading,
  } = ctx;

  const [designation, setDesignation] = useState(selectedUser?.designation || "");

  if (!showDesignationModal || !selectedUser) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={() => setShowDesignationModal(false)}
    >
      <div
        style={{
          background: "#fff", borderRadius: "10px", width: "360px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "#1e2a6e", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Edit3 style={{ width: "16px", height: "16px", color: "#fff" }} />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>Edit Employee Role</span>
          </div>
          <button
            onClick={() => setShowDesignationModal(false)}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#fff", fontSize: "16px", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 18px" }}>
          {/* Employee ID */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Employee ID
            </label>
            <input
              readOnly
              value={selectedUser.employeeId || "N/A"}
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "#f3f4f6", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", color: "#374151", fontWeight: 500 }}
            />
          </div>

          {/* Employee Name */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Employee Name
            </label>
            <input
              readOnly
              value={selectedUser.name || ""}
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "#f3f4f6", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", color: "#374151", fontWeight: 500 }}
            />
          </div>

          {/* Designation Dropdown */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Designation
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 32px 9px 12px",
                  background: "#fff", border: "1.5px solid #3b4cb8",
                  borderRadius: "6px", fontSize: "13px",
                  color: "#1e293b", fontWeight: 500,
                  appearance: "none", cursor: "pointer", outline: "none",
                  boxShadow: "0 0 0 3px rgba(59,76,184,0.1)",
                }}
              >
                <option value="">-- Select Designation --</option>
                {DESIGNATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280", fontSize: "12px" }}>▼</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowDesignationModal(false)}
              style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              onClick={() => handleDesignationChange(selectedUser.id, designation)}
              style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", background: "#3b4cb8", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
              disabled={actionLoading || !designation}
            >
              {actionLoading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDesignationModal;
