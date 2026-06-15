import React, { useState } from "react";
import { UserPlus, X, Shield, User, Mail, Phone, Calendar } from "lucide-react";
import { APP_CONFIG } from "../../config";
import { ROLE_OPTIONS, fieldStyle, fieldFocusStyle } from "./usersConstants";

const AddMemberModal = ({ ctx }) => {
  const {
    showAddModal, setShowAddModal,
    handleAddSubmit, formData, setFormData,
    addLoading, loggedInRole
  } = ctx;

  const [focusedField, setFocusedField] = useState("");

  if (!showAddModal) return null;

  return (
    <div className="modal-overlay" style={{ alignItems: "center", padding: "16px" }}>
      <div className="modal-card" style={{ maxWidth: "500px", maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563EB 60%, #3b82f6 100%)", padding: "18px 24px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: "-30px", left: "30px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }}>
                <UserPlus style={{ width: "17px", height: "17px", color: "#fff" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>Add Employee</h3>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>Create a new employee account</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "7px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", backdropFilter: "blur(10px)" }}
            >
              <X style={{ width: "15px", height: "15px" }} />
            </button>
          </div>
        </div>

        {/* ── Form Body ──────────────────────────────────────────────────── */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            
            {/* Auto-generated ID notice */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <Shield style={{ width: "13px", height: "13px", color: "#2563EB", flexShrink: 0 }} />
              <p style={{ fontSize: "12px", color: "#1d4ed8", lineHeight: 1.4 }}>
                <strong>Employee ID</strong> will be auto-generated upon creation.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                <User style={{ width: "13px", height: "13px", color: "#2563EB" }} /> Full Name <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <User style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: focusedField === "name" ? "#2563EB" : "#94a3b8", pointerEvents: "none", transition: "color 0.2s" }} />
                <input
                  type="text"
                  required
                  style={focusedField === "name" ? fieldFocusStyle : fieldStyle}
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                <Mail style={{ width: "13px", height: "13px", color: "#2563EB" }} /> Email Address <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: focusedField === "email" ? "#2563EB" : "#94a3b8", pointerEvents: "none", transition: "color 0.2s" }} />
                <input
                  type="email"
                  required
                  style={focusedField === "email" ? fieldFocusStyle : fieldStyle}
                  placeholder={`rahul@${APP_CONFIG.supportEmail.split("@")[1] || "example.com"}`}
                  value={formData.email}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                <Phone style={{ width: "13px", height: "13px", color: "#2563EB" }} /> Phone Number <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Phone style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: focusedField === "phone" ? "#2563EB" : "#94a3b8", pointerEvents: "none", transition: "color 0.2s" }} />
                <input
                  type="text"
                  required
                  style={focusedField === "phone" ? fieldFocusStyle : fieldStyle}
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                <Calendar style={{ width: "13px", height: "13px", color: "#2563EB" }} /> Date of Birth <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Calendar style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: focusedField === "dob" ? "#2563EB" : "#94a3b8", pointerEvents: "none", transition: "color 0.2s" }} />
                <input
                  type="date"
                  required
                  style={focusedField === "dob" ? fieldFocusStyle : fieldStyle}
                  value={formData.dob}
                  onFocus={() => setFocusedField("dob")}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                <Shield style={{ width: "13px", height: "13px", color: "#2563EB" }} /> Department / Role <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {ROLE_OPTIONS.map((r) => {
                  const isSelected = formData.role === r.value;
                  return (
                    <div key={r.value} style={{ display: "flex", flexDirection: "column" }}>
                      <button
                        type="button"
                      onClick={() => {
                        if (loggedInRole === "admin" || r.value === loggedInRole) {
                          setFormData({ ...formData, role: r.value });
                        }
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
                        borderRadius: "8px", 
                        cursor: (loggedInRole !== "admin" && r.value !== loggedInRole) ? "not-allowed" : "pointer",
                        opacity: (loggedInRole !== "admin" && r.value !== loggedInRole) ? 0.5 : 1,
                        border: isSelected ? `2px solid ${r.color}` : "1.5px solid #e2e8f0",
                        background: isSelected ? r.bg : "#fafafa",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? `0 0 0 2px ${r.border}80` : "none",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: isSelected ? 700 : 500, color: isSelected ? r.color : "#475569", textAlign: "left", lineHeight: 1.2 }}>
                        {r.label}
                      </span>
                      {isSelected && (
                        <div style={{ marginLeft: "auto", width: "14px", height: "14px", borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#fff", fontSize: "9px", fontWeight: 700 }}>✓</span>
                        </div>
                      )}
                    </button>
                    {isSelected && loggedInRole === "admin" && r.value !== "admin" && (
                      <select
                        value={formData.isHead ? "head" : "member"}
                        onChange={(e) => setFormData({ ...formData, isHead: e.target.value === "head" })}
                        style={{
                          marginTop: "6px",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: `1px solid ${r.color}50`,
                          background: "#fff",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: r.color,
                          cursor: "pointer",
                          outline: "none",
                          width: "100%",
                          boxShadow: `0 2px 4px ${r.color}15`
                        }}
                      >
                        <option value="member">Team Member</option>
                        <option value="head">Department Head</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px", borderTop: "1px solid #f1f5f9", marginTop: "4px" }}>
              <button
                type="submit"
                disabled={addLoading}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "12px", borderRadius: "10px", border: "none",
                  cursor: addLoading ? "not-allowed" : "pointer",
                  background: "linear-gradient(135deg, #2563EB, #1d4ed8)", color: "#fff",
                  fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                  opacity: addLoading ? 0.7 : 1, transition: "all 0.2s ease"
                }}
              >
                {addLoading ? (
                  <><div style={{ width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Adding…</>
                ) : (
                  <><UserPlus style={{ width: "15px", height: "15px" }} /> Add Employee</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ padding: "12px 20px", borderRadius: "10px", border: "1.5px solid var(--color-border)", background: "var(--color-surface)", color: "var(--text-2)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
