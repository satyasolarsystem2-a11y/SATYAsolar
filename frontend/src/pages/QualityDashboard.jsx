import React from "react";
import Dashboard from "../components/Dashboard";

// Quality Assurance Department Dashboard
// Role: "quality" (maps to "qa" internally in workflow)
const QualityDashboard = ({ onLogout }) => {
  return (
    <Dashboard
      onLogout={onLogout}
      roleBadge="Quality QA"
      title="Quality Assurance Command Center"
    />
  );
};

export default QualityDashboard;
