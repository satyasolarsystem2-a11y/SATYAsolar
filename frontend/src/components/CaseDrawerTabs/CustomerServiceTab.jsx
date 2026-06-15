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

const CustomerServiceTab = ({ ctx }) => {
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
                  Customer Service — CRM Log
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-4)",
                    lineHeight: 1.5,
                  }}
                >
                  Log follow-up calls, complaints, escalations, and customer
                  communication history.
                </p>
              </div>

              {/* Customer Contact Info */}
              <div
                style={{
                  background: "#f5f3ff",
                  border: "1px solid #ddd6fe",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#5b21b6",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Customer Contact
                </p>
                <div
                  style={{
                    fontSize: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div>
                    <span style={{ color: "#64748b" }}>Name: </span>
                    <strong>{normalized.customerName || "—"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Phone: </span>
                    <strong>{normalized.phone || "—"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Email: </span>
                    <strong>{normalized.email || "—"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Address: </span>
                    <strong>{normalized.address || "—"}</strong>
                  </div>
                </div>
              </div>

              {/* CRM Note */}
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
                  Log Interaction / Note
                </label>
                <textarea
                  value={crmNote}
                  onChange={(e) => setCrmNote(e.target.value)}
                  placeholder="Call outcome, complaint details, follow-up action, or escalation reason…"
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
                disabled={crmSaving || !crmNote.trim()}
                style={{ marginTop: 12, opacity: crmSaving ? 0.7 : 1 }}
                onClick={async () => {
                  setCrmSaving(true);
                  try {
                    await supabase.from("case_history").insert({
                      case_id: normalized.caseId,
                      stage: normalized.currentStage,
                      action_type: "crm_interaction",
                      updated_by:
                        localStorage.getItem("name") || "Customer Service",
                      department: "customer_service",
                      notes: crmNote,
                    });
                    toast.success("CRM interaction logged");
                    setCrmNote("");
                  } catch (err) {
                    toast.error(err.message);
                  } finally {
                    setCrmSaving(false);
                  }
                }}
              >
                {crmSaving ? "Saving…" : "🎧 Log Interaction"}
              </button>
            </div>
  );
};

export default CustomerServiceTab;
