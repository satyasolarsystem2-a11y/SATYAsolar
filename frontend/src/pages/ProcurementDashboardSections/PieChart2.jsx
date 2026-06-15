import React, { useState } from "react";
import { PALETTE } from "./dashboardConstants";

export default function PieChart2({ slices, size = 160, label }) {
  const [hovered, setHovered] = useState(null);
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  
  if (total === 0) {
    return (
      <div style={{ textAlign: "center", padding: 16 }}>
        <div style={{ width: size, height: size, borderRadius: "50%", background: "#f1f5f9", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 12, color: "var(--text-4)" }}>No data</p>
        </div>
      </div>
    );
  }

  let cumAngle = -90;
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;

  const toXY = (angle, radius) => {
    const rad = (angle * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };

  const paths = slices.map((sl, i) => {
    const deg = (sl.value / total) * 360;
    const startAngle = cumAngle;
    cumAngle += deg;
    const endAngle = cumAngle;
    const large = deg > 180 ? 1 : 0;
    const [x1, y1] = toXY(startAngle, r);
    const [x2, y2] = toXY(endAngle, r);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return {
      d,
      color: sl.color || PALETTE[i % PALETTE.length],
      label: sl.label,
      value: sl.value,
      pct: Math.round((sl.value / total) * 100),
    };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={size} height={size} style={{ display: "block" }}>
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill={p.color}
              stroke="#fff"
              strokeWidth={2}
              style={{ transition: "opacity 0.2s", opacity: hovered !== null && hovered !== i ? 0.5 : 1, cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          <circle cx={cx} cy={cy} r={r * 0.42} fill="var(--surface)" />
          {label && (
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text-2)">
              {label}
            </text>
          )}
        </svg>
        {hovered !== null && (
          <div style={{ position: "absolute", top: "50%", left: "110%", transform: "translateY(-50%)", background: "#0f172a", color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none" }}>
            {paths[hovered].label}: {paths[hovered].value} ({paths[hovered].pct}%)
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 120 }}>
        {paths.map((p, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "default", opacity: hovered !== null && hovered !== i ? 0.5 : 1, transition: "opacity 0.2s" }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-2)", flex: 1 }}>{p.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
