import React from "react";
import { useNavigate } from "react-router-dom";

/* ── Card definitions per role ────────────────────────────────────────── */
const defaultCardDefs = [
  {
    title: "Total Projects",
    key: "totalCases",
    icon: "ti ti-folders",
    label: "All time",
    colorClass: "stat-card--blue",
  },
  {
    title: "In Progress",
    key: "inProgressCases",
    icon: "ti ti-clock",
    label: "Active work",
    colorClass: "stat-card--amber",
  },
  {
    title: "Completed",
    key: "completedCases",
    icon: "ti ti-circle-check",
    label: "Fulfilled",
    colorClass: "stat-card--green",
  },
  {
    title: "Needs Attention",
    key: "delayedCases",
    icon: "ti ti-alert-circle",
    label: "Flagged today",
    colorClass: "stat-card--red",
  },
];

const navMap = {
  totalCases: "/cases",
  inProgressCases: "/cases?tab=active",
  completedCases: "/cases?tab=completed",
  delayedCases: "/cases?tab=delayed",
};

/* ── Trend arrow helper ──────────────────────────────────────────────── */
const getTrend = (stats, prevStats, key) => {
  const cur = stats?.[key] ?? 0;
  const prev = prevStats?.[key];
  if (prev === undefined || prev === null)
    return { text: null, cls: "neutral" };
  const diff = cur - prev;
  if (diff > 0) return { text: `+${diff} this week`, cls: "positive" };
  if (diff < 0) return { text: `${diff} this week`, cls: "negative" };
  return { text: null, cls: "neutral" };
};

/* ═══════════════════════════════════════════════════════════════════════
   DASHBOARD CARDS
═══════════════════════════════════════════════════════════════════════ */
const DashboardCards = ({ stats, role, prevStats }) => {
  const navigate = useNavigate();
  const cardDefs = defaultCardDefs;
  const nav = navMap;

  return (
    <div
      className="dash-cards-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "14px",
        marginBottom: "24px",
      }}
    >
      {cardDefs.map(({ title, key, icon, label, colorClass }) => {
        const trend = getTrend(stats, prevStats, key);
        const value = stats?.[key] ?? 0;

        return (
          <div
            key={key}
            className={`stat-card ${colorClass}`}
            onClick={() => navigate(nav[key])}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(nav[key])}
            aria-label={`${title}: ${value}`}
          >
            {/* Icon + Trend row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "14px",
              }}
            >
              <div className="stat-icon-wrap">
                <i className={icon} style={{ fontSize: "18px" }} />
              </div>
              {trend.text && (
                <span className={`stat-trend ${trend.cls}`}>
                  {trend.cls === "positive" ? (
                    <i
                      className="ti ti-trending-up"
                      style={{ fontSize: "12px" }}
                    />
                  ) : trend.cls === "negative" ? (
                    <i
                      className="ti ti-trending-down"
                      style={{ fontSize: "12px" }}
                    />
                  ) : null}
                  {trend.text}
                </span>
              )}
            </div>

            {/* Number */}
            <div
              className="stat-number"
              style={{
                marginBottom: "3px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {value.toLocaleString()}
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-2)",
                letterSpacing: "-0.01em",
                marginBottom: "12px",
              }}
            >
              {title}
            </div>

            {/* Bottom divider row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "10px",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <span className="stat-chip">{label}</span>
              <span className="stat-updated">Just now</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;
