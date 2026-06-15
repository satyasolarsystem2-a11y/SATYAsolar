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

const AccountsTab = ({ ctx }) => {
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text-1)",
                      marginBottom: 4,
                    }}
                  >
                    Accounts & Payment Verification
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-4)",
                      lineHeight: 1.5,
                    }}
                  >
                    Verify payment receipts, track outstanding balances, and log
                    financial clearance.
                  </p>
                </div>
                {normalized.accountsVerified && !accountsEditMode && (
                  <button
                    onClick={() => setAccountsEditMode(true)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: "4px 8px",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Edit2
                      style={{
                        width: "13px",
                        height: "13px",
                        marginRight: "4px",
                      }}
                    />{" "}
                    Edit
                  </button>
                )}
              </div>

              {normalized.accountsVerified && !accountsEditMode ? (
                <div
                  style={{
                    padding: "16px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <CheckCircle2
                    style={{ width: "18px", height: "18px", color: "#16a34a" }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#166534",
                        fontWeight: 600,
                      }}
                    >
                      Payment Received & Verified
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#14532d",
                        fontWeight: 700,
                      }}
                    >
                      Remaining Balance: ₹
                      {Number(
                        (normalized.totalAmount || 0) -
                          (fData.downPayment || 0) -
                          (fData.paymentType === "Loan"
                            ? fData.loanAmount || 0
                            : 0),
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Total Amount
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#0f172a",
                          marginTop: "4px",
                        }}
                      >
                        ₹{Number(normalized.totalAmount).toLocaleString()}
                      </p>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Down Payment
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#0f172a",
                          marginTop: "4px",
                        }}
                      >
                        ₹{Number(fData.downPayment || 0).toLocaleString()}
                      </p>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Loan Amount
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#0f172a",
                          marginTop: "4px",
                        }}
                      >
                        ₹
                        {Number(
                          fData.paymentType === "Loan"
                            ? fData.loanAmount || 0
                            : 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        background: "#e0e7ff",
                        border: "1px solid #c7d2fe",
                        borderRadius: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#3730a3",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Remaining Balance
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#312e81",
                          marginTop: "4px",
                        }}
                      >
                        ₹
                        {Number(
                          (normalized.totalAmount || 0) -
                            (fData.downPayment || 0) -
                            (fData.paymentType === "Loan"
                              ? fData.loanAmount || 0
                              : 0),
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAccountsVerify}
                    disabled={accountsVerifyLoading}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    {accountsVerifyLoading
                      ? "Verifying..."
                      : "Verify Payment Received"}
                  </button>
                </>
              )}

              {/* Payment Summary */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#15803d",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Payment Summary
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px 16px",
                  }}
                >
                  {[
                    ["Payment Type", normalized.paymentType || "—"],
                    ["Payment Mode", normalized.paymentMode || "—"],
                    [
                      "Down Payment",
                      normalized.downPayment
                        ? `₹${Number(normalized.downPayment).toLocaleString("en-IN")}`
                        : "—",
                    ],
                    [
                      "Loan Amount",
                      normalized.loanAmount
                        ? `₹${Number(normalized.loanAmount).toLocaleString("en-IN")}`
                        : "—",
                    ],
                    [
                      "EMI Amount",
                      normalized.emiAmount
                        ? `₹${Number(normalized.emiAmount).toLocaleString("en-IN")}`
                        : "—",
                    ],
                    ["Bank", normalized.bankName || "—"],
                  ].map(([label, val]) => (
                    <div key={label} style={{ fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>{label}: </span>
                      <strong style={{ color: "#0f172a" }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accounts Notes */}
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
                  Accounts Notes & Clearance Log
                </label>
                <textarea
                  value={accountsNotes}
                  onChange={(e) => setAccountsNotes(e.target.value)}
                  placeholder="Payment confirmed, outstanding amount, invoice number, or financial clearance notes…"
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
                disabled={accountsSaving || !accountsNotes.trim()}
                style={{ marginTop: 12, opacity: accountsSaving ? 0.7 : 1 }}
                onClick={async () => {
                  setAccountsSaving(true);
                  try {
                    await supabase.from("case_history").insert({
                      case_id: normalized.caseId,
                      stage: normalized.currentStage,
                      action_type: "accounts_note",
                      updated_by: localStorage.getItem("name") || "Accounts",
                      department: "accounts",
                      notes: accountsNotes,
                    });
                    toast.success("Accounts note saved");
                    setAccountsNotes("");
                  } catch (err) {
                    toast.error(err.message);
                  } finally {
                    setAccountsSaving(false);
                  }
                }}
              >
                {accountsSaving ? "Saving…" : "💾 Save Note"}
              </button>
            </div>
  );
};

export default AccountsTab;
