/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import { CheckCircle2, AlertTriangle, Package, Camera, Upload, Loader2, Lock, Truck } from "lucide-react";
import { supabase, edgeFetch, EDGE } from "../../lib/supabaseClient";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

const DispatchTab = ({ ctx }) => {
  const {
    canUpdate,
    caseData,
    caseId,
    dispatchDetails,
    dispatchItems,
    dispatchLoading,
    handleAddDispatchItem,
    handleDispatchItemChange,
    handleDispatchSubmit,
    handleRemoveDispatchItem,
    inventoryList,
    normalized,
    onRefresh,
    role,
    setDispatchDetails,
    setDispatchItems,
    setDispatchLoading,
  } = ctx;

  const [phase1Photo, setPhase1Photo] = useState(null);
  const [phase1Preview, setPhase1Preview] = useState(null);
  const [phase1Uploading, setPhase1Uploading] = useState(false);
  const [phase1Notes, setPhase1Notes] = useState("");

  const [phase2Photo, setPhase2Photo] = useState(null);
  const [phase2Preview, setPhase2Preview] = useState(null);
  const [phase2Uploading, setPhase2Uploading] = useState(false);
  const [phase2Notes, setPhase2Notes] = useState("");

  const phase1Ref = useRef(null);
  const phase2Ref = useRef(null);

  const dispatchPhase = normalized.dispatch_phase || 0;
  const phase1Done = dispatchPhase >= 1 || !!normalized.phase1_photo_url;
  const phase2Done = dispatchPhase >= 2 || !!normalized.phase2_photo_url;

  const canDoPhase1 = canUpdate && !phase1Done;
  const canDoPhase2 = canUpdate && phase1Done && !phase2Done;

  const handlePhotoChange = (e, phase) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (phase === 1) { setPhase1Photo(file); setPhase1Preview(ev.target.result); }
      else { setPhase2Photo(file); setPhase2Preview(ev.target.result); }
    };
    reader.readAsDataURL(file);
  };

  const uploadPhase = async (phase) => {
    const photo = phase === 1 ? phase1Photo : phase2Photo;
    const notes = phase === 1 ? phase1Notes : phase2Notes;
    if (!photo) { toast.error("Please capture a photo first."); return; }

    const setter = phase === 1 ? setPhase1Uploading : setPhase2Uploading;
    setter(true);
    try {
      const fileName = `phase${phase}_${caseId}_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("documents").upload(fileName, photo);
      if (error) throw new Error(error.message);
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);

      await edgeFetch(EDGE.workflow, {
        action: "update_dispatch_phase",
        caseId,
        phase,
        photoUrl: urlData.publicUrl,
        notes,
      });
      toast.success(`Phase ${phase} installation recorded!`);
      onRefresh();
    } catch (err) {
      toast.error(err.message || `Phase ${phase} upload failed`);
    } finally {
      setter(false);
    }
  };

  const statusBadge = (done, label) => (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "11.5px", fontWeight: 700,
      padding: "4px 10px", borderRadius: "20px",
      background: done ? "#dcfce7" : "#f1f5f9",
      color: done ? "#15803d" : "#64748b",
      border: `1px solid ${done ? "#bbf7d0" : "#e2e8f0"}`,
    }}>
      {done ? <CheckCircle2 size={12} /> : <Lock size={12} />} {label}
    </span>
  );

  const PhaseCard = ({ phase, title, icon: Icon, subtitle, canDo, done, photoUrl, notes, setNotes, photo, preview, inputRef, onPhotoChange, onUpload, uploading }) => (
    <div style={{
      borderRadius: "14px",
      border: `2px solid ${done ? "#bbf7d0" : canDo ? "#6366f1" : "#e2e8f0"}`,
      background: done ? "#f0fdf4" : canDo ? "#fafbff" : "#f8fafc",
      padding: "20px",
      opacity: !canDo && !done ? 0.6 : 1,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: done ? "#16a34a" : canDo ? "#6366f1" : "#94a3b8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{title}</p>
            <p style={{ fontSize: "11.5px", color: "#64748b" }}>{subtitle}</p>
          </div>
        </div>
        {statusBadge(done, done ? "Complete" : canDo ? "In Progress" : "Locked")}
      </div>

      {done && photoUrl && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600, marginBottom: "8px" }}>📸 Installation Photo Uploaded</p>
          <img src={photoUrl} alt={`Phase ${phase} install`} style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "10px", border: "1px solid #bbf7d0" }} />
        </div>
      )}

      {canDo && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Camera capture */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Camera size={13} /> Capture Live Installation Photo (Required)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onPhotoChange(e, phase)}
              style={{ display: "none" }}
            />
            {preview ? (
              <div style={{ position: "relative" }}>
                <img src={preview} alt="preview" style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "10px", border: "2px solid #6366f1" }} />
                <button
                  onClick={() => inputRef.current?.click()}
                  style={{ position: "absolute", top: "8px", right: "8px", padding: "4px 10px", background: "#fff", border: "1px solid #6366f1", color: "#6366f1", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                >
                  Retake
                </button>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                style={{
                  width: "100%", padding: "24px", border: "2px dashed #6366f1",
                  borderRadius: "10px", background: "#eef2ff", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                  color: "#4338ca",
                }}
              >
                <Camera size={24} />
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Tap to Open Camera</span>
                <span style={{ fontSize: "11px", color: "#6366f1", opacity: 0.8 }}>Gallery upload not allowed — live camera only</span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "6px" }}>
              Installation Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about the installation..."
              rows={2}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", resize: "vertical", boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {/* Submit button */}
          <button
            onClick={() => onUpload(phase)}
            disabled={uploading || !photo}
            style={{
              width: "100%", padding: "11px",
              borderRadius: "10px", border: "none",
              background: uploading || !photo ? "#e2e8f0" : "linear-gradient(135deg, #6366f1, #4338ca)",
              color: uploading || !photo ? "#94a3b8" : "#fff",
              fontSize: "13.5px", fontWeight: 700,
              cursor: uploading || !photo ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            {uploading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Uploading...</> : <><Upload size={15} /> Mark Phase {phase} Complete</>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
          Two-Phase Installation Dispatch
        </p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {statusBadge(phase1Done, "Phase 1: Structure")}
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>→</span>
          {statusBadge(phase2Done, "Phase 2: Kit + Panels")}
        </div>
      </div>

      {/* Phase 1 */}
      <PhaseCard
        phase={1}
        title="Phase 1 — Structure Installation"
        icon={Package}
        subtitle="Dispatch structure from warehouse → install on site"
        canDo={canDoPhase1}
        done={phase1Done}
        photoUrl={normalized.phase1_photo_url}
        notes={phase1Notes}
        setNotes={setPhase1Notes}
        photo={phase1Photo}
        preview={phase1Preview}
        inputRef={phase1Ref}
        onPhotoChange={handlePhotoChange}
        onUpload={uploadPhase}
        uploading={phase1Uploading}
      />

      {/* Phase 2 */}
      <PhaseCard
        phase={2}
        title="Phase 2 — Kit, Panels & Inverter"
        icon={Truck}
        subtitle="Dispatch solar kit → install panels and inverter"
        canDo={canDoPhase2}
        done={phase2Done}
        photoUrl={normalized.phase2_photo_url}
        notes={phase2Notes}
        setNotes={setPhase2Notes}
        photo={phase2Photo}
        preview={phase2Preview}
        inputRef={phase2Ref}
        onPhotoChange={handlePhotoChange}
        onUpload={uploadPhase}
        uploading={phase2Uploading}
      />

      {/* Inventory Dispatch Form (existing, below phases) */}
      {canUpdate && (
        <div style={{ marginTop: "8px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
            Dispatch Materials from Inventory
          </p>

          <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "12px", border: "1px solid #bbf7d0", marginBottom: "20px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>📦 Items to Dispatch</span>
              <button onClick={handleAddDispatchItem} type="button" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "4px 10px", cursor: "pointer" }}>
                <Plus size={13} /> Add Extra Item
              </button>
            </h4>
            {dispatchItems.some((i) => i._auto) && (
              <p style={{ fontSize: "11px", color: "#16a34a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                ✅ Auto-detected from quotation — adjust quantity if needed
              </p>
            )}
            {dispatchItems.length === 0 ? (
              <p style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>No items detected. Click "+ Add Extra Item" to add manually.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 32px", gap: "8px", padding: "4px 2px" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Item</span>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", textAlign: "center" }}>Qty</span>
                  <span />
                </div>
                {dispatchItems.map((item, idx) => {
                  const invItem = inventoryList.find((i) => i.id === item.id);
                  const itemName = invItem?.name || item._name || "Unknown Item";
                  const itemUnit = invItem?.unit || item._unit || "";
                  const itemStock = invItem?.stock ?? "?";
                  return (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 80px 32px", gap: "8px", alignItems: "center", background: "#fff", borderRadius: "8px", padding: "8px 10px", border: "1px solid #e2e8f0" }}>
                      {item._auto ? (
                        <div>
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f172a" }}>{itemName}</span>
                          <span style={{ fontSize: "10.5px", color: "#64748b", marginLeft: "6px" }}>Stock: {itemStock} {itemUnit}</span>
                        </div>
                      ) : (
                        <select value={item.id} onChange={(e) => handleDispatchItemChange(idx, "id", e.target.value)} style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", width: "100%" }}>
                          <option value="">Select Item...</option>
                          {inventoryList.map((inv) => (
                            <option key={inv.id} value={inv.id} disabled={inv.stock <= 0}>{inv.name} (Stock: {inv.stock} {inv.unit})</option>
                          ))}
                        </select>
                      )}
                      <input type="number" min="1" value={item.quantity} onChange={(e) => handleDispatchItemChange(idx, "quantity", parseInt(e.target.value) || 1)} style={{ padding: "6px 8px", fontSize: "12.5px", fontWeight: 700, borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", textAlign: "center", width: "100%" }} />
                      <button onClick={() => handleRemoveDispatchItem(idx)} type="button" style={{ padding: "5px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleDispatchSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Vehicle Number</label>
                <input type="text" value={dispatchDetails.vehicleNumber} onChange={(e) => setDispatchDetails({ ...dispatchDetails, vehicleNumber: e.target.value })} placeholder="e.g. MH 12 AB 1234" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", color: "#0f172a", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Driver Name</label>
                <input type="text" value={dispatchDetails.driverName} onChange={(e) => setDispatchDetails({ ...dispatchDetails, driverName: e.target.value })} placeholder="Driver Name" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", color: "#0f172a", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Dispatch Notes</label>
              <textarea value={dispatchDetails.notes} onChange={(e) => setDispatchDetails({ ...dispatchDetails, notes: e.target.value })} placeholder="Any specific instructions for delivery?" rows={2} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", color: "#0f172a", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="submit" disabled={dispatchLoading || dispatchItems.length === 0} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "#fff", fontSize: "13.5px", fontWeight: 600, cursor: dispatchLoading || dispatchItems.length === 0 ? "not-allowed" : "pointer", opacity: dispatchLoading || dispatchItems.length === 0 ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {dispatchLoading ? "Dispatching..." : "Confirm Dispatch & Deduct Inventory"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DispatchTab;
