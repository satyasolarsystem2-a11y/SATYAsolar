import React from "react";
import { APP_CONFIG } from "../../config";
import TrackingMilestones from "./TrackingMilestones";
import TrackingSidebar from "./TrackingSidebar";

export default function TrackingResults({
  result,
  inputId,
  setInputId,
  handleTrack,
  isCompleted,
  isDelayed,
  pct,
  currentIdx,
  completedStages,
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: "32px 24px",
        maxWidth: 1080,
        margin: "0 auto",
        width: "100%",
        animation: "fadeUp .4s ease both",
      }}
    >
      {/* Top meta row */}
      <div className="meta-top">
        <div>
          {/* Status badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                background: isCompleted
                  ? "#dcfce7"
                  : isDelayed
                    ? "#fee2e2"
                    : "#eef0ff",
                color: isCompleted
                  ? "#15803d"
                  : isDelayed
                    ? "#dc2626"
                    : "#1a1a5e",
                border: `1px solid ${isCompleted ? "#86efac" : isDelayed ? "#fca5a5" : "#c7d2fe"}`,
                borderRadius: 20,
                padding: "3px 12px",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "currentColor",
                  display: "inline-block",
                  animation: isDelayed ? "pulse 1.5s infinite" : "none",
                }}
              />
              {isCompleted
                ? "Installation Complete"
                : isDelayed
                  ? "Delayed"
                  : "In Progress"}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#94a3b8",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            >
              {result.tracking_id || result.id || result.case_id}
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(22px,4vw,32px)",
              fontWeight: 800,
              color: "#0f0f23",
              letterSpacing: -0.4,
              marginBottom: 4,
            }}
          >
            {APP_CONFIG.companyName} Installation
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Current Stage:{" "}
            <strong style={{ color: "#1a1a5e" }}>
              {result.current_stage}
            </strong>
          </p>
        </div>

        {/* ETA / Progress card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8eaf0",
            borderRadius: 12,
            padding: "16px 20px",
            minWidth: 180,
            textAlign: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "center",
              marginBottom: 6,
            }}
          >
            <span className="mat" style={{ fontSize: 18, color: "#1a1a5e" }}>
              calendar_month
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Progress
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1a5e" }}>
            {pct}%
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Overall Complete</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="results-grid">
        {/* LEFT */}
        <TrackingMilestones
          currentIdx={currentIdx}
          isDelayed={isDelayed}
          pct={pct}
          completedStages={completedStages}
        />

        {/* RIGHT sidebar */}
        <TrackingSidebar
          result={result}
          inputId={inputId}
          setInputId={setInputId}
          handleTrack={handleTrack}
        />
      </div>
    </div>
  );
}
