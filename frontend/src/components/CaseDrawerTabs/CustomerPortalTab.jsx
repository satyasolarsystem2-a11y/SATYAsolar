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

const CustomerPortalTab = ({ ctx }) => {
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
                  Customer Portal — Approval Link
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-4)",
                    lineHeight: 1.5,
                  }}
                >
                  Generate a secure, one-time link for the customer to review
                  their quotation and approve or decline online.
                </p>
              </div>

              {/* Customer info */}
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1e40af",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Recipient
                </p>
                <div style={{ fontSize: 13 }}>
                  <div>
                    <span style={{ color: "#475569" }}>Name: </span>
                    <strong>{normalized.customerName}</strong>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ color: "#475569" }}>Email: </span>
                    <strong>{normalized.email || "Not on file"}</strong>
                  </div>
                </div>
              </div>

              {portalLink ? (
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#15803d",
                      marginBottom: 8,
                    }}
                  >
                    ✅ Portal Link Generated (valid 7 days)
                  </p>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      readOnly
                      value={portalLink}
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #bbf7d0",
                        background: "#f0fdf4",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(portalLink);
                        toast.success("Link copied!");
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "#64748b",
                      marginTop: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    Share this link with the customer via WhatsApp or email.
                    They can approve the quotation and upload documents without
                    logging in.
                  </p>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={portalGenerating}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    opacity: portalGenerating ? 0.7 : 1,
                  }}
                  onClick={async () => {
                    setPortalGenerating(true);
                    try {
                      const token =
                        Math.random().toString(36).substr(2) +
                        Date.now().toString(36);
                      const expiresAt = new Date(
                        Date.now() + 7 * 24 * 60 * 60 * 1000,
                      ).toISOString();
                      const { error } = await supabase
                        .from("customer_portal_tokens")
                        .insert({
                          case_id: normalized.caseId,
                          token,
                          customer_name: normalized.customerName,
                          customer_email: normalized.email || "",
                          expires_at: expiresAt,
                        });
                      if (error) throw error;
                      const link = `${window.location.origin}/customer-portal?token=${token}`;
                      setPortalLink(link);
                      // Log to case history
                      await supabase.from("case_history").insert({
                        case_id: normalized.caseId,
                        stage: normalized.currentStage,
                        action_type: "portal_link_generated",
                        updated_by: localStorage.getItem("name") || "Admin",
                        department: "admin",
                        notes:
                          "Customer portal link generated and sent for quotation approval.",
                      });
                      toast.success("Portal link generated!");
                    } catch (err) {
                      toast.error(err.message || "Failed to generate link");
                    } finally {
                      setPortalGenerating(false);
                    }
                  }}
                >
                  <LinkIcon size={14} />
                  {portalGenerating
                    ? "Generating…"
                    : "🔗 Generate Customer Portal Link"}
                </button>
              )}
    </div>
  );
};

export default CustomerPortalTab;
