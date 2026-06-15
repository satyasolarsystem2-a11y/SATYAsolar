import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

const DeleteModal = ({ ctx }) => {
  const {
    showDeleteModal, setShowDeleteModal,
    handleDeleteUser, actionLoading, selectedUser
  } = ctx;

  if (!showDeleteModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "400px", textAlign: "center" }}>
        <div style={{ padding: "32px 28px 24px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <AlertTriangle style={{ width: "24px", height: "24px", color: "#e11d48" }} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-1)", marginBottom: "8px" }}>Remove Team Member?</h3>
          <p style={{ fontSize: "14px", color: "var(--text-3)", lineHeight: 1.5, marginBottom: "24px" }}>
            Are you sure you want to remove <strong>{selectedUser?.name}</strong> from the team? They will immediately lose access to the CRM.
          </p>
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
              style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={actionLoading}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "10px", border: "none", background: "#e11d48", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}
            >
              {actionLoading ? "Removing..." : <><Trash2 style={{ width: "16px", height: "16px" }} /> Yes, Remove</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
