import React, { useState } from "react";
import { Key, Lock, Eye, EyeOff } from "lucide-react";

const ResetPasswordModal = ({ ctx }) => {
  const {
    showResetModal, setShowResetModal,
    handleResetPassword, newPassword, setNewPassword,
    actionLoading, selectedUser
  } = ctx;

  const [showPassword, setShowPassword] = useState(false);

  if (!showResetModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "420px" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Key style={{ width: "18px", height: "18px", color: "#2563EB" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-1)", margin: 0 }}>Reset Password</h3>
            <p style={{ fontSize: "12px", color: "var(--text-4)", marginTop: "2px" }}>For {selectedUser?.name}</p>
          </div>
        </div>
        
        <form onSubmit={handleResetPassword} style={{ padding: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
              <Lock style={{ width: "13px", height: "13px", color: "#2563EB" }} /> New Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "#94a3b8" }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="input"
                style={{ width: "100%", paddingLeft: "36px", paddingRight: "40px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "11px 14px 11px 36px", fontSize: "14px" }}
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
              </button>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-4)", marginTop: "8px" }}>
              The user will need to log in with this new password.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => { setShowResetModal(false); setNewPassword(""); }}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || newPassword.length < 6}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #2563EB, #1d4ed8)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: (actionLoading || newPassword.length < 6) ? "not-allowed" : "pointer", opacity: (actionLoading || newPassword.length < 6) ? 0.7 : 1 }}
            >
              {actionLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
