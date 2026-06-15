import React, { useState } from "react";
import { CheckCircle, UploadCloud, Trash2 } from "lucide-react";
import { S } from "./createCaseConstants";

const DocumentUploadSection = ({ ctx }) => {
  const [newDocName, setNewDocName] = useState("");
  const {
    docs,
    handleFileChange,
    getSystemKw,
    MANDATORY_DOCS,
    getOptionalDocuments,
    removeCustomDoc,
  } = ctx;

  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "22px 24px",
          borderBottom: "1px solid var(--border-2)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div style={{ ...S.sh, borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
          <div style={S.shNum}>2</div>
          <div>Customer Documents</div>
        </div>
      </div>

      <div style={{ padding: "22px 24px" }}>

        {/* ── Documents Checklist Header ────────────────────────────────── */}
        <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-1)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Documents Checklist
          </h3>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-4)" }}>
            {MANDATORY_DOCS.filter((d) => docs[d]).length} / {MANDATORY_DOCS.length} Ready
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* ── Mandatory Documents ──────────────────────────────────────── */}
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--rose)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
              Mandatory Documents{" "}
              <span style={{ fontSize: "10px", background: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px" }}>
                Required
              </span>
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {MANDATORY_DOCS.map((docName, idx) => {
                const isSelected = !!docs[docName];
                return (
                  <div
                    key={`man-${idx}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "var(--radius-xl)",
                      border: `1px solid ${isSelected ? "#A7F3D0" : "#fca5a5"}`,
                      background: isSelected ? "var(--color-accent-light)" : "#fef2f2",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isSelected ? "var(--color-accent)" : "#fee2e2",
                            color: isSelected ? "#fff" : "#ef4444",
                            boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                          }}
                        >
                          {isSelected ? (
                            <CheckCircle style={{ width: "20px", height: "20px" }} />
                          ) : (
                            <span style={{ fontWeight: 700, fontSize: "12px" }}>{idx + 1}</span>
                          )}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#064E3B" : "#7f1d1d" }}>
                          {docName} <span style={{ color: "#ef4444" }}>*</span>
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {isSelected ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent)", maxWidth: "120px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={docs[docName].name}>
                              {docs[docName].name}
                            </span>
                            <label style={{ cursor: "pointer", padding: "6px 12px", background: "var(--surface)", border: "1px solid #A7F3D0", color: "var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700 }}>
                              Replace
                              <input type="file" style={{ display: "none" }} onChange={(e) => handleFileChange(e, docName)} accept=".pdf,image/*" capture="environment" />
                            </label>
                          </div>
                        ) : (
                          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", color: "#fff", background: "#ef4444", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700, boxShadow: "var(--shadow-sm)" }}>
                            <UploadCloud style={{ width: "16px", height: "16px" }} />
                            Choose File
                            <input type="file" style={{ display: "none" }} onChange={(e) => handleFileChange(e, docName)} accept=".pdf,image/*" capture="environment" />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Custom Documents ────────────────────────────────────────── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", marginTop: "24px" }}>
              <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "4px" }}>
                Additional Documents{" "}
                <span style={{ fontSize: "10px", background: "var(--surface-2)", color: "var(--text-4)", padding: "2px 6px", borderRadius: "4px" }}>
                  Optional
                </span>
              </h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input 
                  type="text" 
                  placeholder="Enter new document name..." 
                  value={newDocName} 
                  onChange={(e) => setNewDocName(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "12px", background: "var(--surface)" }}
                />
                <label style={{ cursor: newDocName.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: newDocName.trim() ? "var(--text-1)" : "var(--text-4)", color: "#fff", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700, boxShadow: "var(--shadow-sm)", transition: "all 0.2s" }}>
                  <UploadCloud style={{ width: "16px", height: "16px" }} />
                  Upload
                  <input type="file" style={{ display: "none" }} disabled={!newDocName.trim()} onChange={(e) => {
                    if (newDocName.trim()) {
                      const trimmed = newDocName.trim();
                      if (!ctx.customDocsList.includes(trimmed)) {
                        ctx.setCustomDocsList([...ctx.customDocsList, trimmed]);
                      }
                      handleFileChange(e, trimmed);
                      setNewDocName("");
                    }
                  }} accept=".pdf,image/*" capture="environment" />
                </label>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {ctx.customDocsList.map((docName, idx) => {
                const isSelected = !!docs[docName];
                return (
                  <div
                    key={`opt-${idx}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "var(--radius-xl)",
                      border: `1px solid ${isSelected ? "#A7F3D0" : "var(--border)"}`,
                      background: isSelected ? "var(--color-accent-light)" : "var(--surface)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? "var(--color-accent)" : "var(--surface-2)", color: isSelected ? "#fff" : "var(--text-4)", boxShadow: isSelected ? "var(--shadow-sm)" : "none" }}>
                          {isSelected ? (
                            <CheckCircle style={{ width: "20px", height: "20px" }} />
                          ) : (
                            <span style={{ fontWeight: 700, fontSize: "12px" }}>{MANDATORY_DOCS.length + idx + 1}</span>
                          )}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#064E3B" : "var(--text-2)" }}>
                          {docName}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isSelected ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent)", maxWidth: "120px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={docs[docName].name}>
                              {docs[docName].name}
                            </span>
                            <label style={{ cursor: "pointer", padding: "6px 12px", background: "var(--surface)", border: "1px solid #A7F3D0", color: "var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700 }}>
                              Replace
                              <input type="file" style={{ display: "none" }} onChange={(e) => handleFileChange(e, docName)} accept=".pdf,image/*" capture="environment" />
                            </label>
                          </div>
                        ) : (
                          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "var(--text-1)", color: "#fff", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700, boxShadow: "var(--shadow-sm)" }}>
                            <UploadCloud style={{ width: "16px", height: "16px" }} />
                            Choose File
                            <input type="file" style={{ display: "none" }} onChange={(e) => handleFileChange(e, docName)} accept=".pdf,image/*" capture="environment" />
                          </label>
                        )}
                        <button
                          type="button"
                          onClick={() => removeCustomDoc(docName)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: "32px", height: "32px", borderRadius: "var(--radius-md)",
                            background: "#fee2e2", color: "#ef4444", border: "none",
                            cursor: "pointer", marginLeft: "4px"
                          }}
                          title="Remove custom document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadSection;
