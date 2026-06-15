import React, { useState } from "react";
import { edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const ProjectTab = ({ ctx }) => {
  const { caseData, caseId, onRefresh, role } = ctx;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    site_survey_status: caseData?.site_survey_status || "",
    design_approval_status: caseData?.design_approval_status || "",
    bom_preparation_status: caseData?.bom_preparation_status || "",
    phase1_structure_dispatch: caseData?.phase1_structure_dispatch || "",
    phase1_structure_installed: caseData?.phase1_structure_installed || false,
    phase2_panel_dispatch: caseData?.phase2_panel_dispatch || "",
    phase2_inverter_dispatch: caseData?.phase2_inverter_dispatch || "",
    phase2_installation_completed: caseData?.phase2_installation_completed || false,
  });

  const canEdit = role === "project" || role === "admin" || role === "operations";

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
      toast.success("Project details updated");
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ margin: 0, color: "#1e293b", fontSize: "15px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>Survey & Design</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600 }}>Site Survey Status</label>
            <input name="site_survey_status" value={data.site_survey_status} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Completed" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600 }}>Design Approval Status</label>
            <input name="design_approval_status" value={data.design_approval_status} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Approved" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600 }}>BOM Preparation Status</label>
            <input name="bom_preparation_status" value={data.bom_preparation_status} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Done" />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ margin: 0, color: "#1e293b", fontSize: "15px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>Phase 1 (Structure)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600 }}>Structure Dispatch Status</label>
            <input name="phase1_structure_dispatch" value={data.phase1_structure_dispatch} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Dispatched" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-end", height: "38px" }}>
            <input type="checkbox" name="phase1_structure_installed" checked={data.phase1_structure_installed} onChange={handleChange} disabled={!canEdit} style={{ width: "16px", height: "16px" }} />
            <label style={{ fontSize: "13px", fontWeight: 600 }}>Structure Installed?</label>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ margin: 0, color: "#1e293b", fontSize: "15px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>Phase 2 (Panels & Inverter)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600 }}>Panel Dispatch Status</label>
            <input name="phase2_panel_dispatch" value={data.phase2_panel_dispatch} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Dispatched" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600 }}>Inverter Dispatch Status</label>
            <input name="phase2_inverter_dispatch" value={data.phase2_inverter_dispatch} onChange={handleChange} disabled={!canEdit} className="input" placeholder="e.g. Dispatched" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-end", height: "38px" }}>
            <input type="checkbox" name="phase2_installation_completed" checked={data.phase2_installation_completed} onChange={handleChange} disabled={!canEdit} style={{ width: "16px", height: "16px" }} />
            <label style={{ fontSize: "13px", fontWeight: 600 }}>Installation Completed?</label>
          </div>
        </div>
      </div>

      {canEdit && (
        <button onClick={handleSave} disabled={loading} style={{ alignSelf: "flex-start", marginTop: "8px", padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: loading ? "wait" : "pointer" }}>
          {loading ? "Saving..." : "Save Project Details"}
        </button>
      )}
    </div>
  );
};

export default ProjectTab;
