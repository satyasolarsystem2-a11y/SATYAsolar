import React from "react";
import { APP_CONFIG } from "../../config";

export default function TrackingSidebar({ result, inputId, setInputId, handleTrack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Need Help card */}
      <div
        style={{
          background: "#1a1a5e",
          borderRadius: 14,
          padding: "22px 18px",
          color: "#fff",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
          Need help?
        </div>
        <p
          style={{
            fontSize: 12,
            color: "#c7d2fe",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          Our support team is available to assist you with your solar installation.
        </p>
        <a
          href={`mailto:${APP_CONFIG.supportEmail}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: "#fff",
            color: "#1a1a5e",
            borderRadius: 8,
            padding: "10px 14px",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          <span className="mat" style={{ fontSize: 18, color: "#1a1a5e" }}>
            mail
          </span>
          Email Support
        </a>
      </div>

      {/* Case Info card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8eaf0",
          borderRadius: 14,
          padding: "20px 18px",
          boxShadow: "0 2px 12px rgba(0,0,0,.04)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 14,
          }}
        >
          Case Info
        </div>
        {[
          {
            label: "Tracking ID",
            value: result.tracking_id || result.id || result.case_id,
            mono: true,
          },
          { label: "Status", value: result.status || "Active" },
          { label: "Stage", value: result.current_stage },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <span style={{ fontSize: 12, color: "#64748b" }}>{row.label}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0f0f23",
                fontFamily: row.mono ? "monospace" : "inherit",
                maxWidth: 130,
                textAlign: "right",
                wordBreak: "break-all",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Track another */}
      <div
        style={{
          background: "#f8faff",
          border: "1px solid #e8eaf0",
          borderRadius: 14,
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#64748b",
            marginBottom: 10,
          }}
        >
          Track another ID
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder={`${APP_CONFIG.trackingPrefix}XXXX-00000`}
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            style={{
              flex: 1,
              padding: "8px 10px",
              border: "1.5px solid #e2e8f0",
              borderRadius: 7,
              fontSize: 12,
              fontFamily: "monospace",
              color: "#1a1a2e",
              background: "#fff",
              outline: "none",
            }}
          />
          <button
            className="tp-btn"
            onClick={() => handleTrack()}
            style={{
              background: "#1a1a5e",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            <span className="mat" style={{ fontSize: 18 }}>
              search
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
