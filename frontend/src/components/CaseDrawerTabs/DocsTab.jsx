/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { X, ArrowRight, MessageSquare, AlertTriangle, CheckCircle2, User, Phone, MapPin, Zap, FileText, ClipboardList, UserCheck, History, Package, Plus, Trash2, IndianRupee, FileCheck, AlertOctagon, Printer, Star, Clock, Navigation, Download, Edit2, Lock, RefreshCw, Microscope, Calculator, Headphones, Link as LinkIcon, Send } from "lucide-react";
import CaseTimeline from "../CaseTimeline";
import PaymentTracker from "../PaymentTracker";
import { edgeFetch, EDGE, supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { APP_CONFIG } from "../../config";

const DocsTab = ({ ctx }) => {
  const {
    STAGES,
    TABS,
    accountsEditMode,
    accountsNotes,
    accountsSaving,
    accountsVerifyLoading,
    activeTab,
    assignLoading,
    canUpdate,
    caseData,
    caseId,
    crmNote,
    crmSaving,
    customerDocs,
    daysAtStage,
    delayLoading,
    delayReason,
    deptEmployees,
    dispatchDetails,
    dispatchItems,
    dispatchLoading,
    docStatuses,
    docs,
    downloadZipLoading,
    fData,
    feedbackList,
    feedbackLoading,
    feedbackSubmitting,
    financeEditMode,
    financeLoading,
    geoError,
    geoLoading,
    geoLocation,
    handleAccountsVerify,
    handleAddDispatchItem,
    handleCaptureLocation,
    handleDispatchItemChange,
    handleDispatchSubmit,
    handleDocStatusChange,
    handleDownloadPDF,
    handleDownloadZip,
    handleFeedbackSubmit,
    handleFinanceUpdate,
    handleMarkDelayed,
    handleQuotationVerify,
    handleRemoveDispatchItem,
    handleResendTrackingId,
    handleSubsidyUpdate,
    handleUpdateSubmit,
    hasDocError,
    hasFinanceError,
    hasQuotationError,
    history,
    inventoryList,
    isBankingStage,
    isCompleted,
    isDelayRisk,
    isFinanceApproved,
    isRegDeptStage,
    isRegStage,
    newFeedback,
    newStage,
    normalized,
    onClose,
    onRefresh,
    ownerDept,
    ownerRole,
    pType,
    pct,
    portalGenerating,
    portalLink,
    printLoading,
    printRef,
    quotationAmountEdit,
    quotationEditMode,
    quotationVerifyLoading,
    remarks,
    resendLoading,
    role,
    selectedEmployee,
    setAccountsEditMode,
    setAccountsNotes,
    setAccountsSaving,
    setAccountsVerifyLoading,
    setActiveTab,
    setAssignLoading,
    setCrmNote,
    setCrmSaving,
    setCustomerDocs,
    setDelayLoading,
    setDelayReason,
    setDeptEmployees,
    setDispatchDetails,
    setDispatchItems,
    setDispatchLoading,
    setDocStatuses,
    setDownloadZipLoading,
    setFData,
    setFeedbackList,
    setFeedbackLoading,
    setFeedbackSubmitting,
    setFinanceEditMode,
    setFinanceLoading,
    setGeoError,
    setGeoLoading,
    setGeoLocation,
    setHistory,
    setInventoryList,
    setNewFeedback,
    setNewStage,
    setPortalGenerating,
    setPortalLink,
    setPrintLoading,
    setQuotationAmountEdit,
    setQuotationEditMode,
    setQuotationVerifyLoading,
    setRemarks,
    setResendLoading,
    setSelectedEmployee,
    setShowDelayForm,
    setSubsidyData,
    setSubsidyLoading,
    setTechnicalNotes,
    setTechnicalSaving,
    setUpdateLoading,
    showDelayForm,
    stageIdx,
    stageStartTime,
    subsidyData,
    subsidyLoading,
    technicalNotes,
    technicalSaving,
    unverifiedDocs,
    updateLoading
  } = ctx;

  return (
    <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "var(--text-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: 0,
                  }}
                >
                  Uploaded Documents
                </p>
              </div>

              {/* ── Mandatory Documents Checklist (Admin only) ── */}
              {(role === "admin") && !isRegStage && (() => {
                const MANDATORY_KEYS = [
                  "Electricity Bill (Last 2 Months)",
                  "Aadhar Card Copy (Electricity Bill Owner)",
                  "PAN Card (Electricity Bill Owner)",
                  "Bank Details (Cancelled Cheque / Account Number)",
                  "Property Proof (House Tax Receipt / Registry Copy)",
                ];
                const uploadedKeys = Object.keys({ ...(normalized.documents || {}), ...Object.fromEntries((customerDocs || []).map(d => [d.doc_name, d.doc_url])) });
                const missingDocs = MANDATORY_KEYS.filter(k => !uploadedKeys.some(u => u.toLowerCase().includes(k.toLowerCase().slice(0, 10))));
                const allMandatoryUploaded = missingDocs.length === 0;
                return (
                  <div style={{
                    marginBottom: "16px",
                    padding: "14px 16px",
                    background: allMandatoryUploaded ? "#f0fdf4" : "#fffbeb",
                    border: `1px solid ${allMandatoryUploaded ? "#bbf7d0" : "#fde68a"}`,
                    borderRadius: "12px",
                  }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: allMandatoryUploaded ? "#166534" : "#92400e", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                      {allMandatoryUploaded ? <CheckCircle2 size={14} /> : <AlertOctagon size={14} />}
                      Mandatory Documents for Registration
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {MANDATORY_KEYS.map((doc) => {
                        const uploaded = uploadedKeys.some(u => u.toLowerCase().includes(doc.toLowerCase().slice(0, 10)));
                        return (
                          <div key={doc} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: uploaded ? "#16a34a" : "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {uploaded && <CheckCircle2 size={10} color="#fff" />}
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 500, color: uploaded ? "#166534" : "#92400e" }}>{doc}</span>
                          </div>
                        );
                      })}
                    </div>
                    {!allMandatoryUploaded && (
                      <p style={{ fontSize: "11px", color: "#b45309", marginTop: "10px", fontWeight: 600 }}>
                        ⚠ Upload all mandatory documents before forwarding to Registration Department.
                      </p>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const allDocsObj = { ...(normalized.documents || {}) };
                customerDocs.forEach((d) => {
                  allDocsObj[d.doc_name] = d.doc_url;
                });
                const docs = Object.entries(allDocsObj);
                const visibleDocs = docs.filter(([docName]) => {
                  if (role === "admin" || role === "registration" || role === "sales") return true;
                  const name = docName.toLowerCase();
                  if (role === "banking")
                    return (
                      name.includes("pan") ||
                      name.includes("aadhar") ||
                      name.includes("bank") ||
                      name.includes("cheque") ||
                      name.includes("electricity") ||
                      name.includes("finance") ||
                      name.includes("loan") ||
                      name.includes("receipt") ||
                      name.includes("bill")
                    );
                  if (role === "field_installation")
                    return (
                      name.includes("photo") ||
                      name.includes("gps") ||
                      name.includes("site") ||
                      name.includes("layout") ||
                      name.includes("structure") ||
                      name.includes("electricity") ||
                      name.includes("bill")
                    );
                  if (role === "subsidy")
                    return (
                      name.includes("pan") ||
                      name.includes("aadhar") ||
                      name.includes("electricity") ||
                      name.includes("subsidy") ||
                      name.includes("photo") ||
                      name.includes("gps") ||
                      name.includes("bill") ||
                      name.includes("bank") ||
                      name.includes("cheque")
                    );
                  if (role === "inventory")
                    return (
                      name.includes("dispatch") ||
                      name.includes("challan") ||
                      name.includes("invoice") ||
                      name.includes("po") ||
                      name.includes("bill")
                    );
                  return false;
                });

                if (docs.length === 0) {
                  return (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <FileText
                        style={{
                          width: "32px",
                          height: "32px",
                          color: "#cbd5e1",
                          margin: "0 auto 12px",
                        }}
                      />
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        No documents uploaded yet.
                      </p>
                    </div>
                  );
                }

                if (visibleDocs.length === 0) {
                  return (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <FileText
                        style={{
                          width: "32px",
                          height: "32px",
                          color: "#cbd5e1",
                          margin: "0 auto 12px",
                        }}
                      />
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        Documents are masked for your department.
                      </p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {/* Download All Documents as ZIP */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "4px",
                      }}
                    >
                      <button
                        onClick={() => handleDownloadZip(visibleDocs)}
                        disabled={
                          downloadZipLoading || visibleDocs.length === 0
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "7px 14px",
                          borderRadius: "8px",
                          border: "1px solid #bfdbfe",
                          background: downloadZipLoading
                            ? "#e0f2fe"
                            : "#eff6ff",
                          color: downloadZipLoading ? "#0369a1" : "#1d4ed8",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor:
                            downloadZipLoading || visibleDocs.length === 0
                              ? "not-allowed"
                              : "pointer",
                          opacity: visibleDocs.length === 0 ? 0.5 : 1,
                          transition: "all 0.15s",
                        }}
                        title={
                          visibleDocs.length === 0
                            ? "No documents to download"
                            : `Download all ${visibleDocs.length} document(s) as ZIP`
                        }
                      >
                        {downloadZipLoading ? (
                          <>
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                border: "2px solid #bfdbfe",
                                borderTopColor: "#1d4ed8",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                              }}
                            />
                            Compressing…
                          </>
                        ) : (
                          <>
                            <Download
                              style={{ width: "13px", height: "13px" }}
                            />
                            Download All ({visibleDocs.length})
                          </>
                        )}
                      </button>
                    </div>
                    {visibleDocs.map(([docName, docUrl]) => {
                      const status = docStatuses[docName] || "Yellow";
                      const statusColors = {
                        Red: {
                          bg: "#fee2e2",
                          text: "#ef4444",
                          border: "#fecaca",
                        },
                        Yellow: {
                          bg: "#fef3c7",
                          text: "#f59e0b",
                          border: "#fde68a",
                        },
                        Green: {
                          bg: "#dcfce7",
                          text: "#10b981",
                          border: "#bbf7d0",
                        },
                      };
                      return (
                        <div
                          key={docName}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "#fff",
                            border: `1px solid ${statusColors[status].border}`,
                            borderRadius: "12px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                background: statusColors[status].text,
                                boxShadow: `0 0 0 3px ${statusColors[status].bg}`,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "13.5px",
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              {docName}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <select
                              value={status}
                              onChange={(e) =>
                                handleDocStatusChange(docName, e.target.value)
                              }
                              style={{
                                padding: "4px 8px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: `1px solid ${statusColors[status].border}`,
                                background: statusColors[status].bg,
                                color: statusColors[status].text,
                                fontWeight: 700,
                                outline: "none",
                                cursor: "pointer",
                              }}
                            >
                              <option value="Yellow">Pending</option>
                              <option value="Green">Verified</option>
                              <option value="Red">Rejected</option>
                            </select>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: "6px 12px",
                                background: "#f1f5f9",
                                color: "#334155",
                                fontSize: "12px",
                                fontWeight: 600,
                                borderRadius: "6px",
                                textDecoration: "none",
                                transition: "background 0.2s",
                              }}
                              onMouseOver={(e) =>
                                (e.target.style.background = "#e2e8f0")
                              }
                              onMouseOut={(e) =>
                                (e.target.style.background = "#f1f5f9")
                              }
                            >
                              View
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Quotation Verification Section — in Docs Tab (readonly summary) */}
              {(role === "admin") && !isRegStage && (
                <div
                  style={{
                    marginTop: "24px",
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "20px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "var(--text-4)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "12px",
                    }}
                  >
                    Quotation Amount
                  </p>
                  <div
                    style={{
                      padding: "14px 16px",
                      background: normalized.quotationVerified
                        ? "#f0fdf4"
                        : "#fffbeb",
                      border: `1px solid ${normalized.quotationVerified ? "#bbf7d0" : "#fde68a"}`,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {normalized.quotationVerified ? (
                      <CheckCircle2
                        style={{
                          width: "18px",
                          height: "18px",
                          color: "#16a34a",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <AlertOctagon
                        style={{
                          width: "18px",
                          height: "18px",
                          color: "#d97706",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div>
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: normalized.quotationVerified
                            ? "#166534"
                            : "#92400e",
                          marginBottom: "2px",
                        }}
                      >
                        {normalized.quotationVerified
                          ? "Verified ✓"
                          : "Pending Verification — go to Update tab"}
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: normalized.quotationVerified
                            ? "#14532d"
                            : "#78350f",
                        }}
                      >
                        ₹
                        {Number(normalized.quotationAmount || 0).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
  );
};

export default DocsTab;
