import React, { useState } from "react";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const ElectricalTab = ({ ctx }) => {
  const { caseData, caseId, onRefresh, role } = ctx;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    uppcl_documentation_status: caseData?.uppcl_documentation_status || "",
    net_metering_approval_status: caseData?.net_metering_approval_status || "",
    meter_installed: caseData?.meter_installed || false,
  });

  const canEdit = role === "electrical" || role === "admin" || role === "operations";

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
      toast.success("Electrical details updated");
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h3 style={{ margin: 0, color: "#1e293b", fontSize: "16px" }}>Electrical & Net Metering</h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600 }}>UPPCL Documentation Status</label>
        <input name="uppcl_documentation_status" value={data.uppcl_documentation_status} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Submitted" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600 }}>Net Metering Approval Status</label>
        <input name="net_metering_approval_status" value={data.net_metering_approval_status} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Approved" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
        <input type="checkbox" name="meter_installed" checked={data.meter_installed} onChange={handleChange} disabled={!canEdit} style={{ width: "16px", height: "16px" }} />
        <label style={{ fontSize: "13px", fontWeight: 600 }}>Net Meter Installed?</label>
      </div>

      {canEdit && (
        <button onClick={handleSave} disabled={loading} style={{ alignSelf: "flex-start", marginTop: "12px", padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: loading ? "wait" : "pointer" }}>
          {loading ? "Saving..." : "Save Electrical Details"}
        </button>
      )}
    </div>
  );
};

export default ElectricalTab;
