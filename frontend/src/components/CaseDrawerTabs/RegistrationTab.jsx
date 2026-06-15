import React, { useState } from "react";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const RegistrationTab = ({ ctx }) => {
  const { caseData, caseId, onRefresh, role } = ctx;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    sub_stage: caseData?.sub_stage || "Document Verification",
    neda_registration_status: caseData?.neda_registration_status || "",
    pm_surya_ghar_status: caseData?.pm_surya_ghar_status || "",
    vendor_selected: caseData?.vendor_selected || "",
    customer_phone_verified: caseData?.customer_phone_verified || false,
  });

  const canEdit = role === "registration" || role === "admin" || role === "operations";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        ...data
      });
      toast.success("Registration details updated");
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h3 style={{ margin: 0, color: "#1e293b", fontSize: "16px" }}>Registration Details</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600 }}>Current Sub-Stage</label>
        <select name="sub_stage" value={data.sub_stage} onChange={handleChange} disabled={!canEdit} className="input">
          <option value="Document Verification">Document Verification</option>
          <option value="Govt Portal Registration">Govt Portal Registration</option>
          <option value="Payment Mode Verification">Payment Mode Verification</option>
        </select>
        {data.sub_stage === "Payment Mode Verification" && (
          <p style={{ margin: 0, fontSize: "11px", color: "#b45309" }}>Note: Please ensure the Payment Type (Cash/Loan) is selected in the Finance tab before updating the main case stage.</p>
        )}
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600 }}>NEDA Registration Status</label>
        <input name="neda_registration_status" value={data.neda_registration_status} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Applied, Approved" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600 }}>PM Surya Ghar Status</label>
        <input name="pm_surya_ghar_status" value={data.pm_surya_ghar_status} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Portal Updated" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600 }}>Vendor Selected</label>
        <input name="vendor_selected" value={data.vendor_selected} onChange={handleChange} disabled={!canEdit} className="input" placeholder="Vendor Name" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
        <input type="checkbox" name="customer_phone_verified" checked={data.customer_phone_verified} onChange={handleChange} disabled={!canEdit} style={{ width: "16px", height: "16px" }} />
        <label style={{ fontSize: "13px", fontWeight: 600 }}>Customer Phone Verified?</label>
      </div>

      {canEdit && (
        <button onClick={handleSave} disabled={loading} style={{ alignSelf: "flex-start", marginTop: "12px", padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: loading ? "wait" : "pointer" }}>
          {loading ? "Saving..." : "Save Registration Details"}
        </button>
      )}
    </div>
  );
};

export default RegistrationTab;
