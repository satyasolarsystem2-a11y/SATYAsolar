import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { edgeFetch, EDGE } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ROLE_OPTIONS, DESIGNATION_OPTIONS } from "../components/UserSections/usersConstants";
import { APP_CONFIG } from "../config";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli","Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const RegisterEmployee = ({ onLogout }) => {
  const navigate = useNavigate();
  const loggedInRole = localStorage.getItem("role");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dob: "",
    designation: "",
    countryCode: "+91",
    phone: "",
    state: "",
    city: "",
    role: "sales",
    isHead: false,
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const inputStyle = (field) => ({
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 14px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#0f172a",
    background: focusedField === field ? "#fff" : "#f8fafc",
    border: focusedField === field ? "1.5px solid #3b4cb8" : "1.5px solid #d1d5db",
    borderRadius: "6px",
    outline: "none",
    transition: "all 0.2s",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(59,76,184,0.12)" : "none",
  });

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "6px",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { toast.error("Please agree to Terms of Service"); return; }
    setLoading(true);
    try {
      await edgeFetch(EDGE.admin, {
        action: "create_user",
        name: formData.name,
        email: formData.email,
        phone: formData.countryCode + formData.phone,
        dob: formData.dob,
        role: formData.role,
        isHead: formData.isHead,
        designation: formData.designation,
      });
      toast.success(`${formData.name} registered successfully!`);
      navigate("/users");
    } catch (err) {
      toast.error(err.message || "Failed to register employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>
      <Sidebar onLogout={onLogout} />
      <main style={{ flex: 1, marginLeft: "var(--main-offset)", padding: "28px 32px" }}>
        <Header title="Register Employee" subtitle="Add a new employee to the system" onLogout={onLogout} />

        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          {/* Header bar */}
          <div style={{ background: "#3b4cb8", borderRadius: "8px 8px 0 0", padding: "16px 24px", textAlign: "center" }}>
            <h2 style={{ color: "#fff", fontSize: "18px", fontWeight: 700, margin: 0 }}>Register New Employee</h2>
          </div>

          {/* Form card */}
          <div style={{ background: "#fff", borderRadius: "0 0 8px 8px", padding: "28px 28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Full Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text" required
                  placeholder="Enter your name"
                  style={inputStyle("name")}
                  value={formData.name}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email Address */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email" required
                  placeholder="Enter your email"
                  style={inputStyle("email")}
                  value={formData.email}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date" required
                  style={inputStyle("dob")}
                  value={formData.dob}
                  onFocus={() => setFocusedField("dob")}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>

              {/* Designation */}
              <div>
                <label style={labelStyle}>Designation</label>
                <div style={{ position: "relative" }}>
                  <select
                    style={{ ...inputStyle("designation"), appearance: "none", cursor: "pointer", paddingRight: "32px" }}
                    value={formData.designation}
                    onFocus={() => setFocusedField("designation")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  >
                    <option value="">Select designation</option>
                    {DESIGNATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280", fontSize: "12px" }}>▼</span>
                </div>
              </div>

              {/* Department / Role */}
              <div>
                <label style={labelStyle}>Department</label>
                <div style={{ position: "relative" }}>
                  <select
                    style={{ ...inputStyle("role"), appearance: "none", cursor: "pointer", paddingRight: "32px" }}
                    value={formData.role}
                    onFocus={() => setFocusedField("role")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {ROLE_OPTIONS.filter(r => loggedInRole === "admin" || r.value === loggedInRole).map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280", fontSize: "12px" }}>▼</span>
                </div>
              </div>

              {/* Department Head toggle (admin only) */}
              {loggedInRole === "admin" && formData.role !== "admin" && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                  <input
                    type="checkbox"
                    id="isHead"
                    checked={formData.isHead}
                    onChange={(e) => setFormData({ ...formData, isHead: e.target.checked })}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="isHead" style={{ fontSize: "13px", fontWeight: 600, color: "#1d4ed8", cursor: "pointer" }}>
                    Make Department Head
                  </label>
                </div>
              )}

              {/* Country Code & Mobile */}
              <div>
                <label style={labelStyle}>Country Code &amp; Mobile</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    style={{ ...inputStyle("cc"), width: "100px", flexShrink: 0, appearance: "none", textAlign: "center", cursor: "pointer" }}
                    value={formData.countryCode}
                    onFocus={() => setFocusedField("cc")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  >
                    <option value="+91">IN +91</option>
                    <option value="+1">US +1</option>
                    <option value="+44">UK +44</option>
                    <option value="+971">UAE +971</option>
                  </select>
                  <input
                    type="tel" required
                    placeholder="Enter mobile number"
                    style={{ ...inputStyle("phone"), flex: 1 }}
                    value={formData.phone}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Country (fixed) */}
              <div>
                <label style={labelStyle}>Country</label>
                <input
                  type="text"
                  value="India"
                  readOnly
                  style={{ ...inputStyle("country"), background: "#f0f0f0", color: "#6b7280", cursor: "not-allowed" }}
                />
              </div>

              {/* State & City */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>State</label>
                  <div style={{ position: "relative" }}>
                    <select
                      style={{ ...inputStyle("state"), appearance: "none", cursor: "pointer", paddingRight: "28px" }}
                      value={formData.state}
                      onFocus={() => setFocusedField("state")}
                      onBlur={() => setFocusedField("")}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value, city: "" })}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280", fontSize: "11px" }}>▼</span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    style={inputStyle("city")}
                    value={formData.city}
                    onFocus={() => setFocusedField("city")}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              {/* Terms */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#3b4cb8" }}
                />
                <label htmlFor="terms" style={{ fontSize: "13px", color: "#374151", cursor: "pointer" }}>
                  I agree to all statements in{" "}
                  <span style={{ color: "#3b4cb8", fontWeight: 600 }}>Terms of Service</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !agreed}
                style={{
                  width: "100%", padding: "13px", borderRadius: "6px", border: "none",
                  background: loading || !agreed ? "#9ca3af" : "#3b4cb8",
                  color: "#fff", fontSize: "15px", fontWeight: 700,
                  cursor: loading || !agreed ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: !loading && agreed ? "0 2px 12px rgba(59,76,184,0.35)" : "none",
                }}
              >
                {loading ? "Registering…" : "Register"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/users")}
                style={{ width: "100%", padding: "11px", borderRadius: "6px", border: "1.5px solid #d1d5db", background: "#fff", color: "#374151", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Back to Employee List
              </button>

            </form>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default RegisterEmployee;
