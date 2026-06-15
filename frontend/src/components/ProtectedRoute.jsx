import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role, allowHead }) => {
  const token = localStorage.getItem("token");
  const currentRole = (localStorage.getItem("role") || "").toLowerCase();
  const isHead = localStorage.getItem("is_head") === "true";

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRoleAccess = roles.includes(currentRole) || currentRole === "admin";
    const hasHeadAccess = allowHead && isHead;

    if (!hasRoleAccess && !hasHeadAccess) {
      const dashMap = {
        admin: "/admin-dashboard",
        operations: "/admin-dashboard",
        sales: "/sales-dashboard",
        registration: "/registration-dashboard",
        finance: "/finance-dashboard",
        banking: "/finance-dashboard",
        accounts: "/finance-dashboard",
        project: "/project-dashboard",
        electrical: "/project-dashboard",
        field_installation: "/project-dashboard",
        field: "/project-dashboard",
        technical: "/project-dashboard",
        warehouse: "/warehouse-dashboard",
        inventory: "/warehouse-dashboard",
        procurement: "/warehouse-dashboard",
        net_metering: "/net-metering-dashboard",
        quality: "/quality-dashboard",
        qa: "/quality-dashboard",
        subsidy: "/subsidy-dashboard",
        customer_service: "/customer-service-dashboard",
      };
      // SAFETY: fall back to /cases (never /login when token exists — causes infinite loop)
      const dashboardPath = dashMap[currentRole] || "/cases";
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
