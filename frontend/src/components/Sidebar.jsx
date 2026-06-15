import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, MapPin } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { APP_CONFIG } from "../config";

/* ── Icon map — Tabler Icons class names ─────────────────────────────────── */
const ICONS = {
  Dashboard: "ti ti-layout-dashboard",
  Finance: "ti ti-report-money",
  "All Customers": "ti ti-users",
  "Quotation List": "ti ti-file-invoice",
  Employee: "ti ti-users-group",
  "Create Case": "ti ti-circle-plus",
  Customers: "ti ti-users",
  "Quotation Form": "ti ti-file-plus",
  "Approved Customer": "ti ti-user-check",
  "Final Leads": "ti ti-rocket",
  Departments: "ti ti-building",
  Reports: "ti ti-chart-bar",
  Tracking: "ti ti-map-pin",
  "ERP Tasks": "ti ti-checklist",
  Inventory: "ti ti-package",
  Procurement: "ti ti-building-warehouse",
  Dispatch: "ti ti-truck-delivery",
  "Capacity Mapping": "ti ti-bolt",
  "Technical QA": "ti ti-microscope",
  Accounts: "ti ti-calculator",
  "CRM Tasks": "ti ti-heart-handshake",
  "Audit Log": "ti ti-shield-lock",
  Support: "ti ti-headset",
  Team: "ti ti-users-group",
};

/* ── Mobile bottom nav — role-specific 4 tabs ───────────────────────────── */
// Home and Account are always tab[0] and tab[3].
// Middle two tabs are role-tailored.
const getMobileNav = (role, dashPath) => {
  const home = { name: "Home", path: dashPath, icon: "ti ti-layout-dashboard" };
  const clients = { name: "Clients", path: "/cases", icon: "ti ti-users" };
  const team = { name: "Employee", path: "/users", icon: "ti ti-users-group" };
  const finance = {
    name: "Finance",
    path: "/finance-tracking",
    icon: "ti ti-report-money",
  };
  const quote = {
    name: "Quote",
    path: "/quotation-form",
    icon: "ti ti-file-plus",
  };
  const newCase = {
    name: "New Case",
    path: "/create-case",
    icon: "ti ti-circle-plus",
  };
  const dispatch = {
    name: "Dispatch",
    path: "/b2c-dispatch",
    icon: "ti ti-truck-delivery",
  };
  const procure = {
    name: "Procure",
    path: "/procurement-portal",
    icon: "ti ti-building-warehouse",
  };
  const support = { name: "Support", path: "/support", icon: "ti ti-headset" };
  const track = {
    name: "Track",
    path: "/track",
    external: true,
    icon: "ti ti-map-pin",
  };
  const audit = {
    name: "Audit",
    path: "/audit-log",
    icon: "ti ti-shield-lock",
  };

  const maps = {
    admin: [home, team, clients, audit],
    sales: [home, newCase, clients, track],
    registration: [home, newCase, clients, support],
    // New consolidated roles
    finance: [home, finance, clients, support],
    project: [home, clients, track, support],
    warehouse: [home, dispatch, procure, clients],
    net_metering: [home, clients, support, support],
    quality: [home, clients, support, support],
    qa: [home, clients, support, support],
    subsidy: [home, clients, support, support],
    customer_service: [home, clients, support, support],
    // Legacy support
    banking: [home, finance, clients, support],
    accounts: [home, finance, clients, support],
    inventory: [home, dispatch, procure, clients],
    field_installation: [home, clients, track, support],
    electrical: [home, clients, support, support],
    technical: [home, clients, support, support],
  };
  // Remove duplicates
  const tabs = maps[role] || [home, clients, support, support];
  const seen = new Set();
  return tabs.filter((t) => {
    if (seen.has(t.path)) return false;
    seen.add(t.path);
    return true;
  });
};

/* ── Admin navigation structure ─────────────────────────────────────────── */
const NAV = {
  admin: [
    {
      group: "Overview",
      items: [
        { name: "Dashboard", path: "/admin-dashboard" },
        { name: "Finance", path: "/finance-tracking" },
      ],
    },
    {
      group: "Management",
      items: [
        { name: "All Customers", path: "/cases" },
        { name: "Quotation List", path: "/quotations" },
        {
          name: "Employee",
          subItems: [
            { name: "Employee List", path: "/users", icon: "ti ti-list" },
            { name: "New Employee", path: "/users/add", icon: "ti ti-user-plus" },
          ],
        },
      ],
    },
    {
      group: "ERP",
      items: [
        { name: "Procurement", path: "/procurement-portal" },
        { name: "Dispatch", path: "/b2c-dispatch" },
        { name: "Audit Log", path: "/audit-log" },
      ],
    },
    {
      group: "Apps",
      items: [
        { name: "Departments", path: "/department-portal" },
        { name: "Tracking", path: "/track", external: true },
      ],
    },
  ],
};

/* ── Role-based navigation builder ──────────────────────────────────────── */
const getRoleGroups = (role, isHead = false) => {
  const dashMap = {
    sales: "/sales-dashboard",
    registration: "/registration-dashboard",
    // New consolidated roles
    finance: "/finance-dashboard",
    project: "/project-dashboard",
    warehouse: "/warehouse-dashboard",
    net_metering: "/net-metering-dashboard",
    quality: "/quality-dashboard",
    qa: "/quality-dashboard",
    subsidy: "/subsidy-dashboard",
    customer_service: "/customer-service-dashboard",
    // Legacy support
    banking: "/finance-dashboard",
    accounts: "/finance-dashboard",
    inventory: "/warehouse-dashboard",
    field_installation: "/project-dashboard",
    field: "/project-dashboard",
    electrical: "/project-dashboard",
    technical: "/project-dashboard",
  };

  let groups = [];

  if (role === "sales") {
    groups = [
      {
        group: "Workspace",
        items: [
          { name: "Dashboard", path: "/sales-dashboard" },
          { name: "Create Case", path: "/create-case" },
          { name: "Customers", path: "/cases" },
          { name: "Tracking", path: "/track", external: true },
        ],
      },
    ];
  } else if (role === "registration") {
    groups = [
      {
        group: "Workspace",
        items: [
          { name: "Dashboard", path: "/registration-dashboard" },
          { name: "Create Case", path: "/create-case" },
          { name: "Customers", path: "/cases" },
        ],
      },
    ];
  } else if (role === "finance" || role === "banking" || role === "accounts") {
    groups = [
      {
        group: "Workspace",
        items: [
          { name: "Dashboard", path: "/finance-dashboard" },
          { name: "Customers", path: "/cases" },
          { name: "Finance", path: "/finance-tracking" },
        ],
      },
    ];
  } else if (role === "project" || role === "field_installation" || role === "field" || role === "technical" || role === "electrical") {
    groups = [
      {
        group: "Workspace",
        items: [
          { name: "Dashboard", path: dashMap[role] || "/project-dashboard" },
          { name: "Customers", path: "/cases" },
          { name: "Tracking", path: "/track", external: true },
        ],
      },
    ];
  } else if (role === "warehouse" || role === "inventory" || role === "procurement") {
    groups = [
      {
        group: "Workspace",
        items: [
          { name: "Dashboard", path: dashMap[role] || "/warehouse-dashboard" },
          { name: "Customers", path: "/cases" },
          { name: "Dispatch", path: "/b2c-dispatch" },
          { name: "Procurement", path: "/procurement-portal" },
        ],
      },
    ];
  } else if (role === "customer_service") {
    groups = [
      {
        group: "Workspace",
        items: [
          { name: "Dashboard", path: "/customer-service-dashboard" },
          { name: "Customers", path: "/cases" },
        ],
      },
    ];
  } else {
    // All other roles (subsidy, net_metering, quality, qa): Dashboard + Customers
    groups = [
      {
        group: "Workspace",
        items: [
          { name: "Dashboard", path: dashMap[role] || "/admin-dashboard" },
          { name: "Customers", path: "/cases" },
        ],
      },
    ];
  }

  if (isHead && role !== "admin") {
    groups.push({
      group: "My Team",
      items: [
        { name: "Team Members", path: "/users", icon: "ti ti-users-group" },
        { name: "My Department", path: "/department-portal", icon: "ti ti-building" },
      ],
    });
  }

  return groups;
};

/* ── Role display label ──────────────────────────────────────────────────── */
const getRoleLabel = (role) => {
  const labels = {
    admin: "Admin",
    sales: "Sales",
    registration: "Registration",
    finance: "Finance",
    banking: "Finance",
    accounts: "Finance",
    project: "Project",
    field_installation: "Project",
    field: "Project",
    technical: "Project",
    electrical: "Project",
    warehouse: "Warehouse",
    inventory: "Warehouse",
    procurement: "Warehouse",
    net_metering: "Net Metering",
    quality: "Quality QA",
    qa: "Quality QA",
    subsidy: "Subsidy",
    customer_service: "Customer Service",
  };
  return labels[role] || (role.charAt(0).toUpperCase() + role.slice(1));
};

/* ── Role accent color ───────────────────────────────────────────────────── */
const ROLE_COLORS = {
  admin: "#2563EB",
  sales: "#7C3AED",
  registration: "#0EA5E9",
  finance: "#F59E0B",
  banking: "#F59E0B",
  accounts: "#F59E0B",
  project: "#F97316",
  field_installation: "#F97316",
  field: "#F97316",
  technical: "#F97316",
  electrical: "#EF4444",
  warehouse: "#10B981",
  inventory: "#10B981",
  procurement: "#10B981",
  net_metering: "#06B6D4",
  quality: "#8B5CF6",
  qa: "#8B5CF6",
  subsidy: "#EC4899",
  customer_service: "#A78BFA",
};

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState(
    localStorage.getItem("name") || "User",
  );
  const [userRole, setUserRole] = useState(
    (localStorage.getItem("role") || "user").toLowerCase(),
  );
  const [isHead, setIsHead] = useState(
    localStorage.getItem("is_head") === "true"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (name) => {
    setOpenDropdowns((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const groups = userRole === "admin" ? NAV.admin : getRoleGroups(userRole, isHead);
  const roleColor = ROLE_COLORS[userRole] || "#2563EB";
  const roleLabel = getRoleLabel(userRole);

  const dashPath = groups[0]?.items[0]?.path || "/admin-dashboard";
  const mobileTabs = getMobileNav(userRole, dashPath);
  const bottomNavPaths = new Set(mobileTabs.map((t) => t.path));

  // Touch tracking for swipe down to close
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  const handleCloseMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMobileOpen(false);
      setIsClosing(false);
      setDragY(0);
    }, 250);
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    setIsDragging(true);
  };
  const handleTouchMove = (e) => {
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 80) {
      handleCloseMenu();
    } else {
      setDragY(0); // snap back
    }
  };

  // Nav item click handler for bottom sheet to close smoothly
  const handleNavClick = (item) => {
    if (item.external) {
      window.open(item.path, "_blank", "noopener,noreferrer");
    } else {
      navigate(item.path);
    }
    handleCloseMenu();
  };

  /* ── Sync profile from DB on mount ──────────────────────────────────── */
  useEffect(() => {
    const isSimulating = localStorage.getItem("simulating") === "true";
    if (isSimulating) {
      setUserRole((localStorage.getItem("role") || "user").toLowerCase());
      setUserName(localStorage.getItem("name") || "User");
      setIsHead(localStorage.getItem("is_head") === "true");
      return;
    }

    const syncProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, role, is_head")
          .eq("id", user.id)
          .single();
        if (profile) {
          if (profile.name) {
            localStorage.setItem("name", profile.name);
            setUserName(profile.name);
          }
          if (profile.role) {
            localStorage.setItem("role", profile.role);
            setUserRole(profile.role.toLowerCase());
          }
          if (profile.is_head !== undefined) {
            localStorage.setItem("is_head", profile.is_head ? "true" : "false");
            setIsHead(profile.is_head);
          }
        }
      } catch {
        /* silent fail */
      }
    };
    syncProfile();
  }, []);

  /* ── Close mobile sidebar on route change ──────────────────────────── */
  useEffect(() => {
    setMobileOpen(false);
    setIsClosing(false);
    setDragY(0);
  }, [location.pathname]);

  /* ── Listen for custom event from Header to open menu ──────────────── */
  useEffect(() => {
    const handleOpen = () => setMobileOpen(true);
    window.addEventListener("openMobileMenu", handleOpen);
    return () => window.removeEventListener("openMobileMenu", handleOpen);
  }, []);

  /* ── Nav item click handler ─────────────────────────────────────────── */
  const handleNav = (item) => {
    if (item.external) {
      window.open(item.path, "_blank", "noopener,noreferrer");
    } else {
      navigate(item.path);
    }
    setMobileOpen(false);
  };

  /* ── Sidebar inner content (shared between desktop & mobile) ─────────── */
  const SidebarContent = () => (
    <>
      {/* Logo / Brand */}
      <div
        style={{
          padding: "16px 12px 14px",
          borderBottom: `1px solid var(--color-border)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginBottom: "12px",
          }}
          onClick={() => navigate("/")}
          title="Go to dashboard"
        >
          <img
            src={APP_CONFIG.logoPath}
            alt={APP_CONFIG.companyName}
            style={{
              width: "150%",
              height: "100px",
              objectFit: "contain",
              display: "block",
              marginLeft: "-25%",
            }}
          />
        </div>

        {/* Role badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "var(--radius-pill)",
            background: `${roleColor}15`,
            border: `1px solid ${roleColor}30`,
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: roleColor,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: 600, color: roleColor }}>
            {roleLabel} Portal
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "8px 6px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {groups.map(({ group, items }, gi) => (
          <div key={group}>
            {gi > 0 && (
              <div
                style={{
                  height: "1px",
                  background: "var(--color-border)",
                  margin: "6px 10px",
                }}
              />
            )}
            <p className="nav-section-label">{group}</p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1px" }}
            >
              {items.map((item) => {
                const iconCls = ICONS[item.name] || "ti ti-point";

                // Render Dropdown item
                if (item.subItems) {
                  const isOpen = openDropdowns[item.name];
                  const isAnySubActive = item.subItems.some((sub) => {
                    const subPath = sub.path.split("?")[0];
                    if (sub.path.includes("?")) {
                      return location.pathname === subPath && location.search.includes(sub.path.split("?")[1]);
                    }
                    return location.pathname === subPath && !location.search.includes("action=add");
                  });

                  return (
                    <div key={item.name} style={{ display: "flex", flexDirection: "column" }}>
                      <button
                        onClick={() => toggleDropdown(item.name)}
                        className={`nav-item${isAnySubActive ? " active" : ""}`}
                        title={item.name}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <i className={iconCls} style={{ fontSize: "15px", width: "18px", textAlign: "center", flexShrink: 0 }} />
                          <span style={{ flex: 1, textAlign: "left" }}>{item.name}</span>
                        </div>
                        <i className={`ti ti-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: "14px", opacity: 0.6 }} />
                      </button>
                      
                      {isOpen && (
                        <div style={{ display: "flex", flexDirection: "column", paddingLeft: "14px", marginTop: "2px", gap: "2px" }}>
                          {item.subItems.map((sub) => {
                            const subPath = sub.path.split("?")[0];
                            const hasQuery = sub.path.includes("?");
                            let isSubActive = false;
                            
                            if (hasQuery) {
                              isSubActive = location.pathname === subPath && location.search.includes(sub.path.split("?")[1]);
                            } else {
                              isSubActive = location.pathname === subPath && !location.search.includes("action=add");
                            }

                            return (
                              <button
                                key={sub.name}
                                onClick={() => handleNav(sub)}
                                className={`nav-item${isSubActive ? " active" : ""}`}
                                title={sub.name}
                                style={{ padding: "8px 12px", fontSize: "13px" }}
                              >
                                <i className={sub.icon || "ti ti-point"} style={{ fontSize: "14px", width: "18px", textAlign: "center", flexShrink: 0 }} />
                                <span style={{ flex: 1, textAlign: "left" }}>{sub.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive =
                  !item.external && location.pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNav(item)}
                    className={`nav-item${isActive ? " active" : ""}`}
                    title={item.name}
                  >
                    {item.name === "Tracking" ? (
                      <MapPin
                        style={{
                          width: "15px",
                          height: "15px",
                          flexShrink: 0,
                          opacity: 0.85,
                        }}
                      />
                    ) : (
                      <i
                        className={iconCls}
                        style={{
                          fontSize: "15px",
                          width: "18px",
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {item.external && (
                      <i
                        className="ti ti-external-link"
                        style={{
                          fontSize: "11px",
                          opacity: 0.45,
                          flexShrink: 0,
                          transition: "opacity 0.15s",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: Support + Profile */}
      <div
        style={{
          padding: "8px 6px 12px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={() => {
            navigate("/support");
            setMobileOpen(false);
          }}
          className={`nav-item${location.pathname === "/support" ? " active" : ""}`}
          style={{ marginBottom: "6px" }}
          title="Support"
        >
          <i
            className="ti ti-headset"
            style={{ fontSize: "15px", width: "18px", textAlign: "center" }}
          />
          <span>Support</span>
        </button>

        {/* User Profile card */}
        <div
          onClick={() => {
            navigate("/profile");
            setMobileOpen(false);
          }}
          title="View profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 10px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-2)",
            cursor: "pointer",
            transition: "background 0.15s ease",
            marginTop: "2px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-sm)",
              flexShrink: 0,
              background: roleColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.5px",
            }}
          >
            {initials}
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--text-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              {userName}
            </p>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 500,
                color: "var(--text-4)",
                textTransform: "capitalize",
              }}
            >
              {roleLabel}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            title="Sign out"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-4)",
              padding: "5px",
              borderRadius: "var(--radius-xs)",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-danger)";
              e.currentTarget.style.background = "var(--color-danger-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-4)";
              e.currentTarget.style.background = "none";
            }}
          >
            <LogOut style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="sidebar-desktop"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: Slide-in sidebar drawer ─────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleCloseMenu}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 150,
              background: "hsla(222,47%,5%,0.55)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              animation: isClosing
                ? "fadeOut 0.25s ease both"
                : "fadeIn 0.25s ease both",
            }}
          />

          {/* Bottom Sheet Drawer panel */}
          <aside
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 160,
              background: "var(--sidebar-bg)",
              borderTop: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              boxShadow: "var(--shadow-xl)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              transform: `translateY(${isClosing ? "100%" : dragY + "px"})`,
              transition: isDragging
                ? "none"
                : "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
              animation:
                !isDragging && dragY === 0 && !isClosing
                  ? "slideInUp 0.35s cubic-bezier(0.16,1,0.3,1) both"
                  : "none",
            }}
          >
            {/* Draggable Header Area */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: "none" }}
            >
              {/* Grab Handle Area (Expanded touch target) */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  padding: "16px 0 8px 0",
                  cursor: "grab",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "4px",
                    borderRadius: "2px",
                    background: "var(--text-4)",
                  }}
                />
              </div>

              {/* Profile Info Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "0 20px 16px 20px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: roleColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {initials}
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text-1)",
                    }}
                  >
                    {userName}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-3)",
                      textTransform: "capitalize",
                    }}
                  >
                    {roleLabel}
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                height: "1px",
                background: "var(--color-border)",
                margin: "0 20px",
              }}
            />

            {/* Scrollable Menu Area */}
            <div
              style={{
                padding: "16px 14px",
                overflowY: "auto",
                overscrollBehavior: "contain",
              }}
            >
              <p
                className="nav-section-label"
                style={{
                  paddingLeft: "8px",
                  marginBottom: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                MENU
              </p>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "2px" }}
              >
                {groups.map(({ items }, gi) => {
                  const filteredItems = items.filter(
                    (item) => !bottomNavPaths.has(item.path),
                  );
                  if (filteredItems.length === 0) return null;
                  return (
                    <React.Fragment key={gi}>
                      {filteredItems.map((item) => {
                        const isActive =
                          !item.external && location.pathname === item.path;
                        const iconCls = ICONS[item.name] || "ti ti-point";
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleNavClick(item)}
                            className={`nav-item${isActive ? " active" : ""}`}
                            style={{ padding: "12px 14px" }}
                          >
                            {item.name === "Tracking" ? (
                              <MapPin
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  flexShrink: 0,
                                  opacity: 0.85,
                                }}
                              />
                            ) : (
                              <i
                                className={iconCls}
                                style={{
                                  fontSize: "20px",
                                  width: "24px",
                                  textAlign: "center",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <span style={{ flex: 1, fontSize: "15px" }}>
                              {item.name}
                            </span>
                            {item.external && (
                              <i
                                className="ti ti-external-link"
                                style={{
                                  fontSize: "14px",
                                  opacity: 0.45,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>

              <div
                style={{
                  height: "1px",
                  background: "var(--color-border)",
                  margin: "20px 8px",
                }}
              />

              <div
                style={{ display: "flex", flexDirection: "column", gap: "2px" }}
              >
                <button
                  onClick={() => handleNavClick({ path: "/profile" })}
                  className={`nav-item${location.pathname === "/profile" ? " active" : ""}`}
                  style={{ padding: "12px 14px" }}
                >
                  <i
                    className="ti ti-user-circle"
                    style={{
                      fontSize: "20px",
                      width: "24px",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: "15px" }}>Profile</span>
                </button>

                <button
                  onClick={() => {
                    const html = document.documentElement;
                    const isDark = html.getAttribute("data-theme") === "dark";
                    html.setAttribute("data-theme", isDark ? "light" : "dark");
                    localStorage.setItem("theme", isDark ? "light" : "dark");
                  }}
                  className="nav-item"
                  style={{ padding: "12px 14px" }}
                >
                  <i
                    className="ti ti-moon"
                    style={{
                      fontSize: "20px",
                      width: "24px",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: "15px" }}>Toggle Theme</span>
                </button>

                <button
                  onClick={() => handleNavClick({ path: "/support" })}
                  className={`nav-item${location.pathname === "/support" ? " active" : ""}`}
                  style={{ padding: "12px 14px" }}
                >
                  <i
                    className="ti ti-headset"
                    style={{
                      fontSize: "20px",
                      width: "24px",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: "15px" }}>Support</span>
                </button>

                <button
                  onClick={onLogout}
                  className="nav-item"
                  style={{ padding: "12px 14px", color: "var(--color-danger)" }}
                >
                  <LogOut
                    style={{
                      width: "20px",
                      height: "20px",
                      flexShrink: 0,
                      opacity: 0.85,
                    }}
                  />
                  <span style={{ fontSize: "15px", fontWeight: 600 }}>
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ── Mobile Bottom Navigation — Role-specific 4 tabs ──────────────── */}
      <nav
        className="mobile-bottom-nav"
        role="navigation"
        aria-label="Mobile navigation"
      >
        {(() => {
          return mobileTabs.map((tab, idx) => {
            const isLast = idx === mobileTabs.length - 1;
            // Last tab is always Account (Profile)
            if (isLast) {
              const isActive = location.pathname === "/profile";
              return (
                <button
                  key="account"
                  onClick={() => setMobileOpen(true)}
                  className={`mobile-nav-btn ${isActive ? "active" : ""}`}
                  aria-label="Account"
                  aria-current={isActive ? "page" : undefined}
                >
                  <div
                    className="mobile-nav-icon-wrap"
                    style={{
                      background: isActive ? roleColor : "transparent",
                      borderRadius: "var(--radius-md)",
                      width: "36px",
                      height: "28px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: isActive ? "#fff" : "currentColor",
                      }}
                    >
                      {initials}
                    </span>
                  </div>
                  <span className="mobile-nav-label">Account</span>
                </button>
              );
            }

            const isActive = tab.external
              ? false
              : location.pathname === tab.path;

            return (
              <button
                key={tab.path + idx}
                onClick={() => {
                  if (tab.external) {
                    window.open(tab.path, "_blank", "noopener,noreferrer");
                  } else {
                    navigate(tab.path);
                  }
                }}
                className={`mobile-nav-btn ${isActive ? "active" : ""}`}
                aria-label={tab.name}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="mobile-nav-icon-wrap">
                  <i className={tab.icon} style={{ fontSize: "19px" }} />
                </div>
                <span className="mobile-nav-label">{tab.name}</span>
              </button>
            );
          });
        })()}
      </nav>
    </>
  );
};

export default Sidebar;
