import React from "react";
import { Trash2, Edit2 } from "lucide-react";
import { getRoleMeta, getStatusMeta, ROLE_OPTIONS } from "./usersConstants";
import { useNavigate } from "react-router-dom";

const UserTable = ({ ctx }) => {
  const {
    filtered, users, baseUsers, search,
    loggedInRole, isHead,
    setSelectedUser, setShowResetModal, setShowDeleteModal,
    setShowSuspendModal, setShowDesignationModal, setShowDetailsPanel,
    handleStatusChange,
  } = ctx;
  const navigate = useNavigate();
  const isHeadUser = isHead || localStorage.getItem("is_head") === "true";
  const canAdmin = loggedInRole === "admin" || isHeadUser;
  const canAddEmployee = loggedInRole === "admin"; // Heads cannot add employees

  const thStyle = {
    padding: "10px 0.5vw", fontSize: "12px", fontWeight: 700,
    color: "#fff", textAlign: "left",
    background: "transparent",
  };

  const tdStyle = {
    padding: "8px 0.5vw", fontSize: "12.5px",
    color: "#374151", verticalAlign: "middle",
    borderBottom: "1px solid #f1f5f9",
  };

  return (
    <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
      {/* Blue Header */}
      <div style={{ background: "#3b4cb8", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ color: "#fff", fontSize: "17px", fontWeight: 700, margin: 0 }}>Employee List</h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {canAddEmployee && (
            <button
              onClick={() => navigate("/users/add")}
              style={{ padding: "7px 14px", background: "#fff", color: "#3b4cb8", border: "none", borderRadius: "5px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
            >
              + Add Employee
            </button>
          )}
          <button
            onClick={() => {
              const rows = [["ID","Name","Designation","Email","Mobile","Status","Joined"]];
              filtered.forEach(u => rows.push([u.employeeId||"N/A", u.name, u.designation||"", u.email, u.phone||"", u.status||"active", u.createdAt?.slice(0,10)||""]));
              const csv = rows.map(r=>r.join(",")).join("\n");
              const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download="employees.csv"; a.click();
            }}
            style={{ padding: "7px 14px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "5px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
          >
            ⬇ Download
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div style={{ overflowX: "auto" }} className="hide-on-mobile">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1e2a6e" }}>
              <th style={thStyle}>Unique ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Dept</th>
              <th style={thStyle}>Designation</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Mobile</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Registration Date</th>
              {canAdmin && <th style={{ ...thStyle, textAlign: "center" }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const sm = getStatusMeta(user.status || "active");
              const isCurrentUserAdmin = loggedInRole === "admin" || (isHeadUser && loggedInRole === user.role && !user.isHead);
              return (
                <tr key={user.id} style={{ background: "#fff", transition: "background 0.15s", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8faff"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                  onClick={() => { setSelectedUser(user); setShowDetailsPanel(true); }}
                >
                  {/* Unique ID */}
                  <td style={tdStyle}>
                    <a href="#" onClick={(e) => { e.preventDefault(); }} style={{ color: "#3b4cb8", fontWeight: 600, fontSize: "12px", textDecoration: "none" }}>
                      {user.employeeId || "N/A"}
                    </a>
                  </td>

                  {/* Name */}
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#3b4cb8,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "12.5px", margin: 0, color: "#1e293b", whiteSpace: "nowrap" }}>{user.name}</p>
                        {user.isHead && <span style={{ fontSize: "10px", fontWeight: 700, color: "#6b21a8", background: "#f3e8ff", padding: "1px 5px", borderRadius: "10px" }}>HEAD</span>}
                      </div>
                    </div>
                  </td>

                  {/* Dept */}
                  <td style={tdStyle}>
                    {(() => {
                      const rm = ROLE_OPTIONS.find(r => r.value === user.role);
                      return rm ? (
                        <span style={{ padding: "3px 8px", borderRadius: "4px", background: rm.bg, color: rm.color, fontWeight: 700, fontSize: "11px", border: `1px solid ${rm.border}`, whiteSpace: "nowrap" }}>
                          {rm.emoji} {rm.label}
                        </span>
                      ) : <span style={{ fontSize: "12px", color: "#9ca3af" }}>{user.role || "—"}</span>;
                    })()}
                  </td>

                  {/* Designation */}
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "12.5px", color: "#475569" }}>{user.designation || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not set</span>}</span>
                      {isCurrentUserAdmin && (
                        <button
                          title="Edit designation"
                          onClick={() => { setSelectedUser(user); setShowDesignationModal(true); }}
                          style={{ background: "none", border: "none", padding: "2px 4px", cursor: "pointer", color: "#3b4cb8", opacity: 0.7 }}
                        >
                          <Edit2 style={{ width: "11px", height: "11px" }} />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Email */}
                  <td style={tdStyle}>
                    <span style={{ fontSize: "12.5px", color: "#475569" }}>{user.email}</span>
                  </td>

                  {/* Mobile */}
                  <td style={tdStyle}>
                    <span style={{ fontSize: "12.5px", color: "#475569" }}>{user.phone || "—"}</span>
                  </td>

                  {/* Status */}
                  <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                    {isCurrentUserAdmin && user.role !== "admin" ? (
                      <button
                        onClick={() => { setSelectedUser(user); setShowSuspendModal(true); }}
                        style={{
                          padding: "4px 10px", borderRadius: "4px", border: `1px solid ${sm.border}`,
                          background: sm.bg, color: sm.color, fontWeight: 700, fontSize: "11.5px",
                          cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap",
                        }}
                      >
                        {sm.label}
                        {user.status === "suspended" && user.suspendedUntil && (
                          <span style={{ display: "block", fontSize: "9.5px", fontWeight: 600, marginTop: "1px" }}>
                            till {new Date(user.suspendedUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </button>
                    ) : (
                      <span style={{ padding: "4px 10px", borderRadius: "4px", border: `1px solid ${sm.border}`, background: sm.bg, color: sm.color, fontWeight: 700, fontSize: "11.5px", textTransform: "capitalize" }}>
                        {sm.label}
                      </span>
                    )}
                  </td>

                  {/* Registration Date */}
                  <td style={tdStyle}>
                    {user.createdAt ? (
                      <div>
                        <span style={{ fontSize: "11.5px", color: "#475569", display: "block", whiteSpace: "nowrap" }}>
                          {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span style={{ fontSize: "10px", color: "#9ca3af", display: "block" }}>
                          {new Date(user.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  {canAdmin && (
                    <td style={{ ...tdStyle, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      {isCurrentUserAdmin && (
                        <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                          <button
                            title="Edit employee details"
                            onClick={() => { setSelectedUser(user); setShowDetailsPanel(true); }}
                            style={{ width: "28px", height: "28px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <Edit2 style={{ width: "12px", height: "12px", color: "#2563eb" }} />
                          </button>
                          {user.role !== "admin" && (
                            <button
                              title="Remove employee"
                              onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                              style={{ width: "28px", height: "28px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Trash2 style={{ width: "12px", height: "12px", color: "#be123c" }} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "#9ca3af", fontSize: "14px" }}>
                  {search ? `No employees match "${search}"` : "No employees found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ padding: "10px 16px", background: "#f8fafc", borderTop: "1px solid #e5e7eb", fontSize: "12px", color: "#6b7280" }}>
          {loggedInRole === "admin"
            ? `${users.length} employee${users.length !== 1 ? "s" : ""} total`
            : `${(baseUsers || filtered).length} employee${(baseUsers || filtered).length !== 1 ? "s" : ""} in your department`
          }
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "14px" }}>
            {search ? `No employees match "${search}"` : "No employees found"}
          </div>
        )}
        {filtered.map((user) => {
          const sm = getStatusMeta(user.status || "active");
          const isCurrentUserAdmin = loggedInRole === "admin" || (isHeadUser && loggedInRole === user.role && !user.isHead);
          return (
            <div key={user.id} style={{ background: "#fff", padding: "14px", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", cursor: "pointer" }} onClick={() => { setSelectedUser(user); setShowDetailsPanel(true); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg,#3b4cb8,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "15px", flexShrink: 0 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 2px", color: "#1e293b" }}>{user.name}</p>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>{user.designation || user.role}</p>
                  </div>
                </div>
                <span style={{ padding: "3px 8px", borderRadius: "4px", border: `1px solid ${sm.border}`, background: sm.bg, color: sm.color, fontWeight: 700, fontSize: "11px" }}>
                  {sm.label}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", color: "#475569" }}>
                <span><b>ID:</b> {user.employeeId || "N/A"}</span>
                <span><b>Mobile:</b> {user.phone || "—"}</span>
                <span style={{ gridColumn: "1/-1" }}><b>Email:</b> {user.email}</span>
              </div>
              {isCurrentUserAdmin && (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }} onClick={(e) => e.stopPropagation()}>
                  {user.role !== "admin" && (
                    <button onClick={() => { setSelectedUser(user); setShowSuspendModal(true); }} style={{ flex: 1, padding: "8px", background: sm.bg, border: `1px solid ${sm.border}`, borderRadius: "6px", color: sm.color, fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
                      Change Status
                    </button>
                  )}
                  <button onClick={() => { setSelectedUser(user); setShowDesignationModal(true); }} style={{ padding: "8px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", cursor: "pointer" }}>
                    <Edit2 style={{ width: "13px", height: "13px", color: "#2563eb" }} />
                  </button>
                  {user.role !== "admin" && (
                    <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} style={{ padding: "8px 12px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "6px", cursor: "pointer" }}>
                      <Trash2 style={{ width: "13px", height: "13px", color: "#be123c" }} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserTable;
