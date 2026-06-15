import React from "react";
import { APP_CONFIG } from "../../config";

export default function TrackingNavbar({ result, onReset }) {
  return (
    <nav
      className="nav-px"
      style={{
        background: "#fff",
        borderBottom: "1px solid #e8eaf0",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 8px rgba(0,0,0,.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src={APP_CONFIG.logoPath}
          alt={APP_CONFIG.companyName}
          style={{ height: 32, width: "auto" }}
        />
        <span className="header-title">{APP_CONFIG.companyName}</span>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {result && (
          <button
            onClick={onReset}
            style={{
              background: "none",
              border: "none",
              color: "#1a1a5e",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span className="mat" style={{ fontSize: 18 }}>
              arrow_back
            </span>
            <span className="track-btn-text">New Search</span>
          </button>
        )}
        <div
          style={{
            background: "#1a1a5e",
            color: "#fff",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="track-btn-text">Track Order</span>
          <span className="mat track-btn-icon">search</span>
        </div>
      </div>
    </nav>
  );
}
