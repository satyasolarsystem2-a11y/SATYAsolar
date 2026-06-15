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

const TechnicalQaTab = ({ ctx }) => {
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
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-1)",
                    marginBottom: 4,
                  }}
                >
                  Technical QA Review
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-4)",
                    lineHeight: 1.5,
                  }}
                >
                  Record technical inspection notes, system checks, and QA
                  observations for this installation.
                </p>
              </div>

              {/* System Spec Summary */}
              {normalized.system_specs && (
                <div
                  style={{
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginBottom: 16,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0369a1",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    System Specifications
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px 16px",
                    }}
                  >
                    {Object.entries(normalized.system_specs || {})
                      .slice(0, 8)
                      .map(([k, v]) =>
                        v ? (
                          <div key={k} style={{ fontSize: 12 }}>
                            <span
                              style={{
                                color: "#64748b",
                                textTransform: "capitalize",
                              }}
                            >
                              {k.replace(/_/g, " ")}:{" "}
                            </span>
                            <strong style={{ color: "#0f172a" }}>
                              {String(v)}
                            </strong>
                          </div>
                        ) : null,
                      )}
                  </div>
                </div>
              )}

              {/* Inspection checklist */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: 12,
                  }}
                >
                  Inspection Checklist
                </p>
                {[
                  "Panel orientation and tilt verified",
                  "Wiring and cable routing inspected",
                  "Inverter installation and settings verified",
                  "Earthing and grounding confirmed",
                  "System output tested and within spec",
                  "Net meter installation verified",
                ].map((item) => (
                  <label
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{
                        width: 14,
                        height: 14,
                        accentColor: "var(--color-primary)",
                      }}
                    />
                    <span style={{ fontSize: 12.5, color: "#334155" }}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>

              {/* QA Notes */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: 6,
                  }}
                >
                  QA Notes & Observations
                </label>
                <textarea
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Record technical findings, issues found, or sign-off notes…"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1.5px solid #e2e8f0",
                    fontSize: 13,
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    background: "#fff",
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                disabled={technicalSaving || !technicalNotes.trim()}
                style={{ marginTop: 12, opacity: technicalSaving ? 0.7 : 1 }}
                onClick={async () => {
                  setTechnicalSaving(true);
                  try {
                    await supabase.from("case_history").insert({
                      case_id: normalized.caseId,
                      stage: normalized.currentStage,
                      action_type: "technical_qa_note",
                      updated_by:
                        localStorage.getItem("name") || "Technical QA",
                      department: "technical",
                      notes: technicalNotes,
                    });
                    toast.success("QA notes saved to case history");
                    setTechnicalNotes("");
                  } catch (err) {
                    toast.error(err.message);
                  } finally {
                    setTechnicalSaving(false);
                  }
                }}
              >
                {technicalSaving ? "Saving…" : "💾 Save QA Notes"}
              </button>
            </div>
  );
};

export default TechnicalQaTab;
