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

const SubsidyTab = ({ ctx }) => {
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
              <p
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "var(--text-4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "16px",
                }}
              >
                Subsidy Registration
              </p>

              {/* Status indicator */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  background:
                    normalized.status === "Completed"
                      ? "#f0fdf4"
                      : normalized.currentStage === "Sent to Subsidy"
                        ? "#eff6ff"
                        : "#fffbeb",
                  border: `1px solid ${normalized.status === "Completed" ? "#86efac" : normalized.currentStage === "Sent to Subsidy" ? "#bfdbfe" : "#fde68a"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      normalized.status === "Completed"
                        ? "#16a34a"
                        : normalized.currentStage === "Sent to Subsidy"
                          ? "#3b82f6"
                          : "#f59e0b",
                  }}
                />
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color:
                      normalized.status === "Completed"
                        ? "#166534"
                        : normalized.currentStage === "Sent to Subsidy"
                          ? "#1e40af"
                          : "#92400e",
                  }}
                >
                  {normalized.status === "Completed"
                    ? "✓ Subsidy Registration Completed"
                    : normalized.currentStage === "Sent to Subsidy"
                      ? "🔵 Case received — start subsidy registration"
                      : "Subsidy registration pending"}
                </p>
              </div>

              <form
                onSubmit={handleSubsidyUpdate}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "6px",
                    }}
                  >
                    Government Reference Number
                  </label>
                  <input
                    type="text"
                    value={subsidyData.subsidyRefNumber}
                    onChange={(e) =>
                      setSubsidyData({
                        ...subsidyData,
                        subsidyRefNumber: e.target.value,
                      })
                    }
                    placeholder="e.g. GOV-2026-XXXXX"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "6px",
                    }}
                  >
                    Subsidy Notes
                  </label>
                  <textarea
                    value={subsidyData.subsidyNote}
                    onChange={(e) =>
                      setSubsidyData({
                        ...subsidyData,
                        subsidyNote: e.target.value,
                      })
                    }
                    placeholder="Application status, portal notes, pending docs…"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginTop: "4px",
                  }}
                >
                  {/* Save details only */}
                  <button
                    type="submit"
                    disabled={subsidyLoading}
                    style={{
                      padding: "11px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: subsidyLoading ? 0.6 : 1,
                    }}
                  >
                    {subsidyLoading ? "Saving..." : "Save Details"}
                  </button>

                  {/* Mark Subsidy Registration Completed */}
                  <button
                    type="button"
                    disabled={
                      subsidyLoading || normalized.status === "Completed"
                    }
                    onClick={async () => {
                      setSubsidyLoading(true);
                      try {
                        // Save details first
                        await edgeFetch(EDGE.workflow, {
                          action: "update_details",
                          caseId,
                          ...subsidyData,
                        });
                        // Then trigger the stage completion (auto-completes the case)
                        await edgeFetch(EDGE.workflow, {
                          action: "update_stage",
                          caseId,
                          newStage: "Subsidy Registration Completed",
                          remarks: `Subsidy registration completed. Ref: ${subsidyData.subsidyRefNumber || "N/A"}`,
                        });
                        toast.success(
                          "Subsidy registration completed! Case marked as Completed.",
                        );
                        onClose();
                        onRefresh();
                      } catch (err) {
                        toast.error(
                          err.message ||
                            "Failed to complete subsidy registration.",
                        );
                      } finally {
                        setSubsidyLoading(false);
                      }
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: "none",
                      background:
                        normalized.status === "Completed"
                          ? "#d1fae5"
                          : "linear-gradient(135deg, #16a34a, #059669)",
                      color:
                        normalized.status === "Completed" ? "#065f46" : "#fff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor:
                        normalized.status === "Completed"
                          ? "default"
                          : "pointer",
                      opacity: subsidyLoading ? 0.6 : 1,
                      boxShadow:
                        normalized.status === "Completed"
                          ? "none"
                          : "0 4px 14px rgba(22,163,74,0.3)",
                    }}
                  >
                    {normalized.status === "Completed"
                      ? "✓ Already Completed"
                      : "✓ Mark Subsidy Registration Completed"}
                  </button>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      textAlign: "center",
                      margin: 0,
                    }}
                  >
                    This will automatically mark the entire case as{" "}
                    <strong>Completed</strong>.
                  </p>
                </div>
              </form>
            </div>
  );
};

export default SubsidyTab;
