import React, { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

const ROLE_ROUTES = {
  admin: "/admin-dashboard",
  sales: "/sales-dashboard",
  registration: "/registration-dashboard",
  finance: "/finance-dashboard",
  banking: "/finance-dashboard",
  accounts: "/finance-dashboard",
  project: "/project-dashboard",
  field_installation: "/project-dashboard",
  field: "/project-dashboard",
  technical: "/project-dashboard",
  electrical: "/project-dashboard",
  warehouse: "/warehouse-dashboard",
  inventory: "/warehouse-dashboard",
  procurement: "/warehouse-dashboard",
  net_metering: "/net-metering-dashboard",
  quality: "/quality-dashboard",
  qa: "/quality-dashboard",
  subsidy: "/subsidy-dashboard",
  customer_service: "/customer-service-dashboard",
};

const EmployeeDrillDown = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const stateData = location.state || {};
    const member = stateData.member || {};

    const memberRole = (member.role || "").toLowerCase();
    const memberName = member.name || "Employee";
    const memberId = member.id || userId || "";
    const targetRoute = ROLE_ROUTES[memberRole] || "/sales-dashboard";

    // 1. Backup admin's real identity so we can restore it later
    if (localStorage.getItem("role") !== memberRole) {
      localStorage.setItem("realRole", localStorage.getItem("role") || "admin");
      localStorage.setItem("realName", localStorage.getItem("name") || "");
      localStorage.setItem("realUserId", localStorage.getItem("userId") || "");
      localStorage.setItem("realIsHead", localStorage.getItem("is_head") || "false");
    }

    // 2. Switch identity to the employee
    localStorage.setItem("simulating", "true");
    localStorage.setItem("role", memberRole);
    localStorage.setItem("name", memberName);
    if (memberId) localStorage.setItem("userId", memberId);
    localStorage.setItem("is_head", member.isHead ? "true" : "false");

    // 3. Navigate to their EXACT dashboard route using window.location.href
    //    This forces a full page reload so that App.jsx reads isSimulating correctly
    //    and displays the simulation banner.
    window.location.href = targetRoute;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--page-bg)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            margin: "0 auto 14px",
            border: "3px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-3)", fontSize: "14px" }}>
          Loading dashboard…
        </p>
      </div>
    </div>
  );
};

export default EmployeeDrillDown;
