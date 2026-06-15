import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { supabase } from "./lib/supabaseClient";

// Core components that load immediately
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import OfflineBanner from "./components/OfflineBanner";
import LowStockPopup from "./components/LowStockPopup";
import AssignedTasksPopup from "./components/AssignedTasksPopup";

// Lazy-loaded pages/components to reduce initial bundle size
import Cases from "./components/Cases";
import CreateCase from "./components/CreateCase";
import Users from "./components/Users";
import Profile from "./components/Profile";
import Support from "./components/Support";
import RegisterEmployee from "./pages/RegisterEmployee";

import QuotationForm from "./components/QuotationForm";
import QuotationList from "./components/QuotationList";
import ApprovedQuotations from "./pages/ApprovedQuotations";
import FinalLeads from "./pages/FinalLeads";

// Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import SalesDashboard from "./pages/SalesDashboard";
import RegistrationDashboard from "./pages/RegistrationDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import FinanceTracking from "./pages/FinanceTracking";
import ProjectDashboard from "./pages/ProjectDashboard";
import WarehouseDashboard from "./pages/WarehouseDashboard";
import NetMeteringDashboard from "./pages/NetMeteringDashboard";
import QualityDashboard from "./pages/QualityDashboard";
import SubsidyDashboard from "./pages/SubsidyDashboard";
import CustomerServiceDashboard from "./pages/CustomerServiceDashboard";

// Admin portal pages
import DepartmentPortal from "./pages/DepartmentPortal";
import EmployeeDrillDown from "./pages/EmployeeDrillDown";

// ERP pages
import ProcurementPortal from "./pages/ProcurementPortal";
import ProcurementDashboard from "./pages/ProcurementDashboard";
import B2CDispatchPortal from "./pages/B2CDispatchPortal";
import WattageSettings from "./pages/WattageSettings";
import CustomerPortal from "./pages/CustomerPortal";
import AuditLogViewer from "./pages/AuditLogViewer";
import DispatchCustomers from "./pages/DispatchCustomers";

// Public pages
import TrackingPage from "./pages/TrackingPage";

// Helper component for role-based redirection from root
const DashboardRedirect = () => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  if (!token) return <Navigate to="/login" replace />;

  const dashMap = {
    admin: "/admin-dashboard",
    operations: "/admin-dashboard",  // Operations oversees all — uses admin dashboard
    sales: "/sales-dashboard",
    registration: "/registration-dashboard",
    // Consolidated roles
    finance: "/finance-dashboard",
    project: "/project-dashboard",
    electrical: "/project-dashboard", // Electrical is part of project/installation
    warehouse: "/warehouse-dashboard",
    net_metering: "/net-metering-dashboard",
    quality: "/quality-dashboard",
    qa: "/quality-dashboard",
    subsidy: "/subsidy-dashboard",
    customer_service: "/customer-service-dashboard",
    // Legacy roles — keep working for any existing users
    banking: "/finance-dashboard",
    accounts: "/finance-dashboard",
    inventory: "/warehouse-dashboard",
    procurement: "/warehouse-dashboard",
    field_installation: "/project-dashboard",
    field: "/project-dashboard",
    technical: "/project-dashboard",
  };

  // SAFETY: never fall back to /login (causes infinite loop when token exists)
  const dashboardPath = dashMap[role] || "/cases";
  return <Navigate to={dashboardPath} replace />;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Restore dark mode on every mount / refresh
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    localStorage.clear();
    window.location.href = "/login";
  };

  // ── Sync name & role from DB on every app load ───────────────────────────
  // This ensures that if a user's profile is updated in the DB,
  // ALL devices reflect the change automatically on next page load/refresh.
  useEffect(() => {
    if (!token) return;
    // Skip DB sync during simulation — don't overwrite simulated role/name
    if (localStorage.getItem("simulating") === "true") return;
    const syncProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, role")
          .eq("id", user.id)
          .single();
        if (profile) {
          if (profile.name) localStorage.setItem("name", profile.name);
          if (profile.role) localStorage.setItem("role", profile.role);
        }
      } catch {
        // Silent fail — don't disrupt the UX if this fails
      }
    };
    syncProfile();
  }, [token]); // re-runs whenever token changes (i.e., on login)

  // ── Inactivity & Background Timers ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const LOGOUT_TIMEOUT = 20 * 60 * 1000;
    const RELOAD_TIMEOUT = 10 * 60 * 1000;

    let lastActiveTime = Date.now();
    let hasPromptedReload = false;

    const updateActivity = () => {
      lastActiveTime = Date.now();
      hasPromptedReload = false;
    };

    const performLogout = () => {
      try {
        supabase.auth.signOut();
      } catch (_) {}
      localStorage.clear();
      window.location.href = "/login";
    };

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, updateActivity));

    const checkIdleStatus = () => {
      const idleTime = Date.now() - lastActiveTime;

      if (idleTime >= LOGOUT_TIMEOUT) {
        performLogout();
        return;
      }

      if (idleTime >= RELOAD_TIMEOUT && !hasPromptedReload) {
        hasPromptedReload = true;
        if (
          window.confirm(
            "You've been inactive for a while. The data might be outdated. Do you want to reload the page to get the latest updates?",
          )
        ) {
          window.location.reload();
        }
      }
    };

    const interval = setInterval(checkIdleStatus, 30 * 1000);

    const handleVisibility = () => {
      if (!document.hidden) {
        checkIdleStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      events.forEach((e) => window.removeEventListener(e, updateActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token]);

  const isSimulating = localStorage.getItem("simulating") === "true";

  return (
    <Router>
      <div className="App">
        {/* Offline detection banner — always mounted */}
        <OfflineBanner />
        
        {token && <AssignedTasksPopup />}

        {/* Admin Simulation Banner */}
        {isSimulating && (
          <div
            style={{
              background: "#3b82f6", // matching the exact blue from their screenshot
              color: "#fff",
              padding: "10px 16px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              fontSize: "14px",
              fontWeight: 600,
              zIndex: 999999,
              position: "sticky",
              top: 0,
              width: "100%",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
            }}
          >
            <span>
              You are currently simulating the {localStorage.getItem("role")} view.
            </span>
            <button
              onClick={() => {
                localStorage.setItem("role", localStorage.getItem("realRole") || "admin");
                localStorage.setItem("name", localStorage.getItem("realName") || "");
                localStorage.setItem("userId", localStorage.getItem("realUserId") || "");
                localStorage.setItem("is_head", localStorage.getItem("realIsHead") || "false");
                localStorage.removeItem("simulating");
                localStorage.removeItem("realRole");
                localStorage.removeItem("realName");
                localStorage.removeItem("realUserId");
                localStorage.removeItem("realIsHead");
                sessionStorage.removeItem("crm_simulation");
                window.location.href = "/";
              }}
              style={{
                background: "rgba(255,255,255,0.25)",
                border: "none",
                color: "#fff",
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.35)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            >
              Return to Admin
            </button>
          </div>
        )}

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            style: { fontSize: "13px", fontFamily: "Inter, sans-serif" },
          }}
          containerStyle={{ zIndex: 999999 }}
        />

        {/* Low Stock Popup — only shows for admin/inventory roles with critical stock */}
        {token && <LowStockPopup />}

        <Routes>
          {/* Fully Public Routes — no auth required */}
          <Route path="/track" element={<TrackingPage />} />

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              !token ? <Login setToken={setToken} /> : <Navigate to="/" />
            }
          />

          {/* Role-Based Dashboards */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute role={["admin", "operations"]}>
                <AdminDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-dashboard"
            element={
              <ProtectedRoute role="sales">
                <SalesDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registration-dashboard"
            element={
              <ProtectedRoute role="registration">
                <RegistrationDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          {/* Finance Department (replaces banking + accounts) */}
          <Route
            path="/finance-dashboard"
            element={
              <ProtectedRoute role={["finance", "banking", "accounts", "admin"]}>
                <FinanceDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          {/* Project Department (replaces field_installation + technical + electrical) */}
          <Route
            path="/project-dashboard"
            element={
              <ProtectedRoute role={["project", "field", "field_installation", "technical", "electrical", "admin"]}>
                <ProjectDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          {/* Warehouse Department (replaces inventory + procurement) */}
          <Route
            path="/warehouse-dashboard"
            element={
              <ProtectedRoute role={["warehouse", "inventory", "procurement", "admin"]}>
                <WarehouseDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          {/* Net Metering Department */}
          <Route
            path="/net-metering-dashboard"
            element={
              <ProtectedRoute role={["net_metering", "admin"]}>
                <NetMeteringDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          {/* Quality Assurance Department */}
          <Route
            path="/quality-dashboard"
            element={
              <ProtectedRoute role={["quality", "qa", "admin"]}>
                <QualityDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subsidy-dashboard"
            element={
              <ProtectedRoute role={["subsidy", "admin"]}>
                <SubsidyDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-service-dashboard"
            element={
              <ProtectedRoute role={["customer_service", "admin"]}>
                <CustomerServiceDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* Shared Protected Routes */}
          <Route
            path="/finance-tracking"
            element={
              <ProtectedRoute role={["banking", "admin", "accounts", "finance"]}>
                <FinanceTracking onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases"
            element={
              <ProtectedRoute
                role={[
                  "admin",
                  "registration",
                  "banking",
                  "inventory",
                  "field_installation",
                  "electrical",
                  "subsidy",
                  "technical",
                  "accounts",
                  "customer_service",
                  "sales",
                  "project",
                  "warehouse",
                  "finance",
                  "net_metering",
                  "quality",
                  "qa",
                  "operations"
                ]}
              >
                <Cases onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotation-form"
            element={
              <ProtectedRoute role={["sales"]}>
                <QuotationForm onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations"
            element={
              <ProtectedRoute role={["sales", "admin"]}>
                <QuotationList onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approved-quotations"
            element={
              <ProtectedRoute role={["sales", "admin"]}>
                <ApprovedQuotations onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/final-leads"
            element={
              <ProtectedRoute role={["sales", "admin"]}>
                <FinalLeads onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-case"
            element={
              <ProtectedRoute role={["registration", "sales"]}>
                <CreateCase onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route path="/my-tasks" element={<Navigate to="/cases" replace />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute role="admin" allowHead={true}>
                <Users onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/add"
            element={
              <ProtectedRoute role="admin">
                <RegisterEmployee onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department-portal"
            element={
              <ProtectedRoute role="admin" allowHead={true}>
                <DepartmentPortal onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department-portal/:userId"
            element={
              <ProtectedRoute role="admin">
                <EmployeeDrillDown onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* ERP Routes */}
          <Route
            path="/procurement-dashboard"
            element={
              <ProtectedRoute role={["admin", "inventory", "warehouse", "procurement"]}>
                <ProcurementDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/procurement-portal"
            element={
              <ProtectedRoute role={["admin", "inventory", "warehouse", "procurement"]}>
                <ProcurementPortal onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/b2c-dispatch"
            element={
              <ProtectedRoute role={["admin", "inventory", "warehouse", "procurement"]}>
                <B2CDispatchPortal onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch-customers"
            element={
              <ProtectedRoute role={["admin", "inventory", "warehouse", "procurement"]}>
                <DispatchCustomers onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wattage-settings"
            element={
              <ProtectedRoute role="admin">
                <WattageSettings onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute role="admin">
                <AuditLogViewer onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* Public Routes — no auth required */}
          <Route path="/customer-portal" element={<CustomerPortal />} />

          {/* Default Redirects */}
          <Route path="/" element={<DashboardRedirect />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
const MyTasks = null;
