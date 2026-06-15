import React from "react";
import { Mail, Shield, UserCheck, User, Trash2, Key, X, Phone, Calendar } from "lucide-react";

const UserProfilePanel = ({ ctx }) => {
  const {
    profileUser, setProfileUser, loggedInRole,
    setSelectedUser, setShowResetModal, setShowDeleteModal,
  } = ctx;

  if (!profileUser) return null;

  return (
    <div
      className="card profile-panel-mobile"
      style={{ padding: 0, overflow: "hidden", position: "sticky", top: "20px" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px", background: "linear-gradient(135deg, #0f1724, #0f2a1a)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px", position: "relative" }}>
        <button
          onClick={() => setProfileUser(null)}
          style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X style={{ width: "16px", height: "16px" }} />
        </button>
        <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg, #2563EB, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "#fff" }}>
          {profileUser.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "15px", fontWeight: 700, color: "#fff" }}>
            {profileUser.name}
          </p>
          <span style={{ display: "inline-block", marginTop: "6px", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "rgba(37,99,235,0.12)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.2)", textTransform: "capitalize" }}>
            {profileUser.role}
          </span>
        </div>
      </div>

      {/* ── Details ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px" }}>
        <p style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          Account details
        </p>
        {[
          { icon: User,      label: "Employee ID", value: profileUser.employeeId || "N/A" },
          { icon: User,      label: "Full name",   value: profileUser.name },
          { icon: Mail,      label: "Email",       value: profileUser.email },
          { icon: Phone,     label: "Phone",       value: profileUser.phone || "N/A" },
          { icon: Calendar,  label: "Date of Birth", value: profileUser.dob || "N/A" },
          { icon: Shield,    label: "Role",        value: profileUser.role, capitalize: true },
          { icon: UserCheck, label: "Status",      value: "Active" },
        ].map(({ icon: Icon, label, value, capitalize }) => (
          <div key={label} style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon style={{ width: "14px", height: "14px", color: "var(--brand)" }} />
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "var(--text-4)", marginBottom: "2px" }}>{label}</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-1)", textTransform: capitalize ? "capitalize" : "none" }}>{value}</p>
            </div>
          </div>
        ))}

        {/* ── Admin Actions ──────────────────────────────────────────────── */}
        {(loggedInRole === "admin" || (localStorage.getItem("is_head") === "true" && loggedInRole === profileUser.role && !profileUser.isHead)) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
            {profileUser.role !== "admin" && (
              <button
                onClick={() => {
                  if (window.confirm(`Simulate view as ${profileUser.role}? You can return to Admin later.`)) {
                    localStorage.setItem("simulating", "true");
                    localStorage.setItem("realRole", localStorage.getItem("role") || "admin");
                    localStorage.setItem("realName", localStorage.getItem("name") || "");
                    localStorage.setItem("realUserId", localStorage.getItem("userId") || "");
                    localStorage.setItem("realIsHead", localStorage.getItem("is_head") || "false");
                    localStorage.setItem("role", profileUser.role);
                    localStorage.setItem("name", profileUser.name || "");
                    localStorage.setItem("userId", profileUser.id || "");
                    localStorage.setItem("is_head", profileUser.is_head || profileUser.isHead ? "true" : "false");
                    window.location.href = "/";
                  }
                }}
                className="btn btn-primary btn-sm"
                style={{ width: "100%", justifyContent: "center", marginBottom: "4px" }}
              >
                <UserCheck style={{ width: "13px", height: "13px" }} />
                Open View Department
              </button>
            )}
            <button
              onClick={() => { setSelectedUser(profileUser); setShowResetModal(true); }}
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <Key style={{ width: "13px", height: "13px" }} />
              Reset password
            </button>
            <button
              onClick={() => { setSelectedUser(profileUser); setShowDeleteModal(true); }}
              className="btn btn-danger btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <Trash2 style={{ width: "13px", height: "13px" }} />
              Remove member
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePanel;
