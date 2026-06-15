import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Building2, Briefcase, Lock, Save, ChevronRight } from "lucide-react";
import { edgeFetch, EDGE, supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";
import { DESIGNATION_OPTIONS, ROLE_OPTIONS } from "./usersConstants";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli","Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const TABS = [
  { id: "profile",      label: "Edit Profile",          Icon: User },
  { id: "bank",         label: "Bank Information",       Icon: Building2 },
  { id: "professional", label: "Professional Information", Icon: Briefcase },
  { id: "password",     label: "Change Password",        Icon: Lock },
];

const Field = ({ label, children, half = false }) => (
  <div style={{ gridColumn: half ? "span 1" : "span 2" }}>
    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "5px" }}>
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ readOnly, ...props }) => (
  <input
    {...props}
    readOnly={readOnly}
    style={{
      width: "100%", boxSizing: "border-box",
      padding: "9px 12px", fontSize: "13.5px", fontWeight: 500,
      border: readOnly ? "1.5px solid #e5e7eb" : "1.5px solid #d1d5db",
      borderRadius: "6px", outline: "none",
      background: readOnly ? "#f3f4f6" : "#fff",
      color: readOnly ? "#9ca3af" : "#111827",
      transition: "border-color 0.2s, box-shadow 0.2s",
      cursor: readOnly ? "not-allowed" : "text",
    }}
    onFocus={(e) => { if (!readOnly) e.target.style.borderColor = "#3b4cb8"; e.target.style.boxShadow = "0 0 0 3px rgba(59,76,184,0.1)"; }}
    onBlur={(e) => { e.target.style.borderColor = readOnly ? "#e5e7eb" : "#d1d5db"; e.target.style.boxShadow = "none"; }}
  />
);

const Select = ({ children, ...props }) => (
  <div style={{ position: "relative" }}>
    <select
      {...props}
      style={{
        width: "100%", boxSizing: "border-box",
        padding: "9px 32px 9px 12px", fontSize: "13.5px", fontWeight: 500,
        border: "1.5px solid #d1d5db", borderRadius: "6px", outline: "none",
        background: "#fff", color: "#111827", appearance: "none", cursor: "pointer",
      }}
      onFocus={(e) => { e.target.style.borderColor = "#3b4cb8"; e.target.style.boxShadow = "0 0 0 3px rgba(59,76,184,0.1)"; }}
      onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
    >
      {children}
    </select>
    <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280", fontSize: "11px" }}>▼</span>
  </div>
);

/**
 * EmployeeDetailsPanel
 *
 * Props:
 *   userId       — whose profile to load (null = own profile)
 *   isAdmin      — if true, can edit designation
 *   isOwnProfile — if true, use get_own_details / update_own_details (no admin check)
 *   onClose      — called when panel should close (slide-in mode)
 *   embedded     — if true, render inline (no slide overlay)
 */
const EmployeeDetailsPanel = ({ userId, isAdmin = false, isOwnProfile = false, onClose, embedded = false }) => {
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({});
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      let result;
      if (isOwnProfile) {
        result = await edgeFetch(EDGE.admin, { action: "get_own_details" });
      } else {
        result = await edgeFetch(EDGE.admin, { action: "get_employee_details", userId });
      }
      setData(result);
      setForm(result);
    } catch (err) {
      toast.error("Could not load employee details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId || isOwnProfile) fetchDetails();
  }, [userId, isOwnProfile]);

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSave = async (section) => {
    setSaving(true);
    try {
      const sectionFields = {
        profile: ["name", "phone", "dob", "gender", "city", "state", "country", "address", "emergency_contact_name", "emergency_contact_phone"],
        bank:    ["bank_name", "branch_name", "account_number", "ifsc_code"],
        professional: ["experience_years", "company_name", "work_location", "last_ctc", "aadhar_card", "pan_card", ...(isAdmin ? ["designation"] : [])],
      };
      const keys = sectionFields[section] || [];
      const payload = { action: isOwnProfile ? "update_own_details" : "update_employee_details" };
      if (!isOwnProfile) payload.userId = userId;
      keys.forEach((k) => { payload[k] = form[k] || ""; });

      await edgeFetch(EDGE.admin, payload);

      if (isOwnProfile && form.name) {
        localStorage.setItem("name", form.name);
        window.dispatchEvent(new StorageEvent("storage", { key: "name", newValue: form.name }));
      }
      toast.success("Details updated successfully");
      setData({ ...data, ...form });
    } catch (err) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) return toast.error("Passwords do not match");
    if (newPw.length < 6) return toast.error("Minimum 6 characters required");
    setChangingPw(true);
    try {
      const email = data.email || localStorage.getItem("email");
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password: currentPw });
      if (authError) throw new Error("Current password is incorrect");
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success("Password changed successfully");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  // Left sidebar nav items (same for both modes, password only for own profile)
  const visibleTabs = isOwnProfile ? TABS : TABS.filter(t => t.id !== "password");

  const roleMeta = ROLE_OPTIONS.find(r => r.value === (data.role || "sales")) || {};

  const avatarInitials = (data.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const content = (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── Left sidebar ── */}
      <div style={{ width: "220px", flexShrink: 0, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "24px 0" }}>
        {/* Avatar */}
        <div style={{ textAlign: "center", paddingBottom: "20px", borderBottom: "1px solid #f1f5f9", marginBottom: "12px", padding: "0 16px 20px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: 800, color: "#fff",
            margin: "0 auto 10px", border: "3px solid #fef3c7",
          }}>
            {avatarInitials}
          </div>
          <p style={{ fontWeight: 700, fontSize: "14px", color: "#111827", margin: "0 0 4px" }}>{data.name || "Employee"}</p>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>{data.email || ""}</p>
          {data.employee_id && (
            <span style={{ display: "inline-block", marginTop: "6px", padding: "2px 8px", background: "#eff6ff", color: "#1d4ed8", borderRadius: "10px", fontSize: "10.5px", fontWeight: 600 }}>
              {data.employee_id}
            </span>
          )}
          {data.role && (
            <div style={{ marginTop: "6px" }}>
              <span style={{ display: "inline-block", padding: "2px 8px", background: roleMeta.bg || "#f1f5f9", color: roleMeta.color || "#374151", borderRadius: "10px", fontSize: "10.5px", fontWeight: 700 }}>
                {roleMeta.label || data.role}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 16px 8px" }}>DASHBOARD</p>
        <nav style={{ flex: 1 }}>
          {visibleTabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "11px 16px", border: "none", cursor: "pointer",
                background: tab === id ? "#eff6ff" : "transparent",
                color: tab === id ? "#3b4cb8" : "#374151",
                fontWeight: tab === id ? 700 : 500,
                fontSize: "13.5px",
                borderLeft: tab === id ? "3px solid #3b4cb8" : "3px solid transparent",
                transition: "all 0.15s",
                textAlign: "left",
              }}
            >
              <Icon style={{ width: "14px", height: "14px", flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </nav>

        {!isOwnProfile && (
          <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb" }}>
            <button
              onClick={() => {
                if (window.confirm(`Simulate view as ${data.role}? You can return to Admin later.`)) {
                  if (onClose) onClose();
                  navigate(`/department-portal/${userId}`, {
                    state: { member: { id: userId, role: data.role, name: data.name, isHead: data.is_head || data.isHead } }
                  });
                }
              }}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "11px", background: "#f8fafc", color: "#3b4cb8",
                border: "1px solid #bfdbfe", borderRadius: "6px",
                fontWeight: 700, fontSize: "13px", cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
            >
              Open View Department <ChevronRight style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        )}
      </div>

      {/* ── Right content ── */}
      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: "28px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "28px", height: "28px", border: "2px solid #e5e7eb", borderTopColor: "#3b4cb8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ color: "#9ca3af", fontSize: "13px" }}>Loading details…</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── EDIT PROFILE ── */}
            {tab === "profile" && (
              <section>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "24px", textAlign: "center" }}>Update Employee Details</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", maxWidth: "700px" }}>
                  <Field label="Full Name" half>
                    <Input type="text" value={form.name || ""} onChange={set("name")} placeholder="Full name" />
                  </Field>
                  <Field label="Email Address" half>
                    <Input type="email" value={form.email || ""} readOnly placeholder="Email" />
                  </Field>
                  <Field label="Mobile Number" half>
                    <Input type="tel" value={form.phone || ""} onChange={set("phone")} placeholder="Mobile number" />
                  </Field>
                  <Field label="Date of Birth" half>
                    <Input type="date" value={form.dob || ""} onChange={set("dob")} />
                  </Field>
                  <Field label="Gender" half>
                    <Select value={form.gender || ""} onChange={set("gender")}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </Select>
                  </Field>
                  <Field label="Country" half>
                    <Input type="text" value="India" readOnly />
                  </Field>
                  <Field label="State" half>
                    <Select value={form.state || ""} onChange={set("state")}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                  <Field label="City" half>
                    <Input type="text" value={form.city || ""} onChange={set("city")} placeholder="City" />
                  </Field>
                  <Field label="Emergency Contact Name" half>
                    <Input type="text" value={form.emergency_contact_name || ""} onChange={set("emergency_contact_name")} placeholder="Contact name" />
                  </Field>
                  <Field label="Emergency Contact Phone" half>
                    <Input type="tel" value={form.emergency_contact_phone || ""} onChange={set("emergency_contact_phone")} placeholder="Contact phone" />
                  </Field>
                  <Field label="Home Address">
                    <textarea
                      value={form.address || ""}
                      onChange={set("address")}
                      placeholder="Full home address"
                      rows={2}
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: "13.5px", border: "1.5px solid #d1d5db", borderRadius: "6px", outline: "none", resize: "vertical", fontFamily: "inherit" }}
                      onFocus={(e) => { e.target.style.borderColor = "#3b4cb8"; e.target.style.boxShadow = "0 0 0 3px rgba(59,76,184,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
                    />
                  </Field>
                </div>
                <button onClick={() => handleSave("profile")} disabled={saving} style={saveBtn}>
                  {saving ? "Saving…" : "Update Details"}
                </button>
              </section>
            )}

            {/* ── BANK INFORMATION ── */}
            {tab === "bank" && (
              <section>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "24px", textAlign: "center" }}>Bank Information</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", maxWidth: "700px" }}>
                  <Field label="Bank Name" half>
                    <Input type="text" value={form.bank_name || ""} onChange={set("bank_name")} placeholder="e.g. State Bank of India" />
                  </Field>
                  <Field label="Branch Name" half>
                    <Input type="text" value={form.branch_name || ""} onChange={set("branch_name")} placeholder="Branch name" />
                  </Field>
                  <Field label="Account Number" half>
                    <Input type="text" value={form.account_number || ""} onChange={set("account_number")} placeholder="Account number" />
                  </Field>
                  <Field label="IFSC Code" half>
                    <Input type="text" value={form.ifsc_code || ""} onChange={set("ifsc_code")} placeholder="e.g. SBIN0001234" />
                  </Field>
                </div>
                <button onClick={() => handleSave("bank")} disabled={saving} style={saveBtn}>
                  {saving ? "Saving…" : "Update Details"}
                </button>
              </section>
            )}

            {/* ── PROFESSIONAL INFORMATION ── */}
            {tab === "professional" && (
              <section>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "24px", textAlign: "center" }}>Professional Information</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", maxWidth: "700px" }}>
                  <Field label="Experience (Years)" half>
                    <Input type="number" min="0" value={form.experience_years || ""} onChange={set("experience_years")} placeholder="e.g. 3" />
                  </Field>
                  <Field label="Previous Company Name" half>
                    <Input type="text" value={form.company_name || ""} onChange={set("company_name")} placeholder="Previous company" />
                  </Field>
                  <Field label="Work Location" half>
                    <Input type="text" value={form.work_location || ""} onChange={set("work_location")} placeholder="e.g. Noida, UP" />
                  </Field>
                  <Field label={isAdmin ? "Designation" : "Designation (set by admin)"} half>
                    {isAdmin ? (
                      <Select value={form.designation || ""} onChange={set("designation")}>
                        <option value="">Select designation</option>
                        {DESIGNATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </Select>
                    ) : (
                      <Input type="text" value={form.designation || ""} readOnly />
                    )}
                  </Field>
                  <Field label="Last CTC (₹)" half>
                    <Input type="text" value={form.last_ctc || ""} onChange={set("last_ctc")} placeholder="e.g. 3,60,000" />
                  </Field>
                  <Field label="Aadhar Card Number" half>
                    <Input type="text" value={form.aadhar_card || ""} onChange={set("aadhar_card")} placeholder="XXXX XXXX XXXX" maxLength={14} />
                  </Field>
                  <Field label="PAN Card Number" half>
                    <Input type="text" value={form.pan_card || ""} onChange={set("pan_card")} placeholder="e.g. ABCDE1234F" maxLength={10} />
                  </Field>
                </div>
                <button onClick={() => handleSave("professional")} disabled={saving} style={saveBtn}>
                  {saving ? "Saving…" : "Update Details"}
                </button>
              </section>
            )}

            {/* ── CHANGE PASSWORD (own profile only) ── */}
            {tab === "password" && isOwnProfile && (
              <section>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "8px", textAlign: "center" }}>Change Password</h2>
                <p style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", marginBottom: "24px" }}>
                  Update your account password
                </p>
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", maxWidth: "500px" }}>
                  <p style={{ fontSize: "12.5px", color: "#92400e" }}>⚠️ Changing your password will require you to sign in again on other devices.</p>
                </div>
                <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "500px" }}>
                  <Field label="Current Password">
                    <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current password" required />
                  </Field>
                  <Field label="New Password">
                    <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password (min 6 chars)" required />
                  </Field>
                  <Field label="Confirm New Password">
                    <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter new password" required />
                  </Field>
                  <button type="submit" disabled={changingPw} style={{ ...saveBtn, marginTop: "8px" }}>
                    {changingPw ? "Changing…" : "Update Details"}
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e5e7eb", overflow: "hidden", minHeight: "500px" }}>
        {content}
      </div>
    );
  }

  // Slide-in panel (from right)
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.4)",
        display: "flex", justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(820px, 95vw)", height: "100%", background: "#fff",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          animation: "slideInRight 0.25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb", background: "#1e2a6e", flexShrink: 0 }}>
          <div>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "16px", margin: 0 }}>Employee Details</h3>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", margin: "2px 0 0" }}>{data.name || "Loading…"}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {content}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const saveBtn = {
  marginTop: "20px",
  padding: "11px 28px",
  background: "#3b4cb8",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 2px 10px rgba(59,76,184,0.3)",
  transition: "opacity 0.2s",
};

export default EmployeeDetailsPanel;
