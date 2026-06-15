import React from "react";
import { STAGES } from "./TrackingConstants";

export default function TrackingMilestones({ currentIdx, isDelayed, pct, completedStages }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Milestones card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8eaf0",
          borderRadius: 14,
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,.04)",
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#0f0f23",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="mat" style={{ color: "#1a1a5e", fontSize: 20 }}>
            route
          </span>
          Project Milestones
        </h3>

        {/* Progress bar */}
        <div
          style={{
            height: 6,
            background: "#f1f5f9",
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: isDelayed
                ? "linear-gradient(90deg,#dc2626,#ef4444)"
                : "linear-gradient(90deg,#1a1a5e,#16a34a)",
              borderRadius: 99,
              animation: "barIn .9s ease both",
            }}
          />
        </div>

        {/* Timeline dots */}
        <div style={{ overflowX: "hidden" }}>
          <div className="timeline-wrapper">
            {STAGES.map((s, idx) => {
              const done = idx < currentIdx;
              const current = idx === currentIdx;
              const future = idx > currentIdx;
              const bg = done
                ? "#16a34a"
                : current && isDelayed
                  ? "#dc2626"
                  : current
                    ? "#1a1a5e"
                    : "#e8eaf0";

              return (
                <div key={s.key} className="timeline-item">
                  {idx > 0 && (
                    <div
                      className="timeline-line"
                      style={{
                        position: "absolute",
                        top: 18,
                        right: "50%",
                        left: 0,
                        height: 2,
                        background: idx <= currentIdx ? "#16a34a" : "#e8eaf0",
                        zIndex: 0,
                      }}
                    />
                  )}
                  {idx < STAGES.length - 1 && (
                    <div
                      className="timeline-line"
                      style={{
                        position: "absolute",
                        top: 18,
                        left: "50%",
                        right: 0,
                        height: 2,
                        background: idx < currentIdx ? "#16a34a" : "#e8eaf0",
                        zIndex: 0,
                      }}
                    />
                  )}

                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 1,
                      flexShrink: 0,
                      border: future ? "2px solid #e8eaf0" : "none",
                      boxShadow: current
                        ? `0 0 0 4px ${isDelayed ? "rgba(220,38,38,.15)" : "rgba(26,26,94,.12)"}`
                        : "none",
                    }}
                  >
                    <span
                      className="mat"
                      style={{
                        fontSize: 16,
                        color: future ? "#cbd5e1" : "#fff",
                      }}
                    >
                      {done ? "check" : s.icon}
                    </span>
                  </div>
                  <div
                    className="timeline-item-text"
                    style={{
                      fontWeight: current ? 700 : 500,
                      color: future
                        ? "#94a3b8"
                        : done
                          ? "#16a34a"
                          : "#1a1a5e",
                    }}
                  >
                    {s.label}
                  </div>
                  {current && (
                    <div
                      className="timeline-badge"
                      style={{
                        marginTop: 3,
                        background: isDelayed ? "#dc2626" : "#1a1a5e",
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 99,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {isDelayed ? "Delayed" : "Active"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8eaf0",
          borderRadius: 14,
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0f0f23",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="mat" style={{ color: "#1a1a5e", fontSize: 20 }}>
              history
            </span>
            Stage Activity
          </h3>
        </div>

        {completedStages.length === 0 ? (
          <p
            style={{
              color: "#94a3b8",
              fontSize: 13,
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            No activity yet.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {completedStages.map((s, i) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  gap: 16,
                  paddingBottom: i < completedStages.length - 1 ? 20 : 0,
                  position: "relative",
                }}
              >
                {/* vertical line */}
                {i < completedStages.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 19,
                      top: 36,
                      bottom: 0,
                      width: 2,
                      background: "#e8eaf0",
                    }}
                  />
                )}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: i === 0 ? "#1a1a5e" : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${i === 0 ? "#1a1a5e" : "#e8eaf0"}`,
                  }}
                >
                  <span
                    className="mat"
                    style={{
                      fontSize: 16,
                      color: i === 0 ? "#fff" : "#16a34a",
                    }}
                  >
                    {i === 0 ? s.icon : "check"}
                  </span>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#0f0f23",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginTop: 2,
                    }}
                  >
                    {i === 0 ? (
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>
                        ● Current Stage
                      </span>
                    ) : (
                      "Completed"
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
