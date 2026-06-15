import React from "react";
import Dashboard from "../components/Dashboard";

// Net Metering Department Dashboard
// Role: "net_metering"
const NetMeteringDashboard = ({ onLogout }) => {
  return (
    <Dashboard
      onLogout={onLogout}
      roleBadge="Net Metering"
      title="Net Metering Command Center"
    />
  );
};

export default NetMeteringDashboard;
