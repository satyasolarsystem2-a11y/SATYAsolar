import React from "react";
import Dashboard from "../components/Dashboard";

// Project Department Dashboard — replaces Installation + Technical + Electrical
// Role: "project"
const ProjectDashboard = ({ onLogout }) => {
  return (
    <Dashboard
      onLogout={onLogout}
      roleBadge="Project"
      title="Project Command Center"
    />
  );
};

export default ProjectDashboard;
