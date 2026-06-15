import React from "react";
import { BadgeCheck, X, Clock } from "lucide-react";

const statusColor = (s) =>
  s === "Approved" || s === "Form Accepted" || s === "Loan Approved"
    ? { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" }
    : s === "Rejected"
      ? { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" }
      : { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };

export default function StatusPill({ status }) {
  const c = statusColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 12px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {status === "Approved" ||
      status === "Form Accepted" ||
      status === "Loan Approved" ? (
        <BadgeCheck size={12} />
      ) : status === "Rejected" ? (
        <X size={12} />
      ) : (
        <Clock size={12} />
      )}
      {status}
    </span>
  );
}
