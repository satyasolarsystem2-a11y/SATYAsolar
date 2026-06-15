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

const FinanceTab = ({ ctx }) => {
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

  // ── Loan banking docs (for warning banner) ───────────────────────────────
  const loanDocs = ctx.loanDocs || [];
  const isLoanCase = (normalized?.paymentType || "").toLowerCase() === "loan";
  const hasVerifiedLoanDocs = loanDocs.some((d) => d.status === "Verified");
  const hasAnyLoanDocs = loanDocs.length > 0;

  return (
    <div>

      {/* ── Loan docs warning banner (shown for loan cases missing banking docs) ── */}
      {isLoanCase && !hasVerifiedLoanDocs && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "12px",
          padding: "14px 16px", background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: "12px", marginBottom: "20px",
        }}>
          <AlertTriangle style={{ width: "18px", height: "18px", color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: "#92400e", fontSize: "13px", margin: "0 0 2px" }}>
              {hasAnyLoanDocs ? "⚠️ Banking Document Package Not Verified" : "⚠️ Banking Document Package Missing"}
            </p>
            <p style={{ fontSize: "12px", color: "#b45309", margin: 0, lineHeight: 1.5 }}>
              {hasAnyLoanDocs
                ? "Documents have been uploaded but not yet verified. Please review them in the Loan Required Documents tab."
                : "The Registration team has not uploaded the banking document package yet. Finance processing requires this package for loan cases."}
            </p>
          </div>
          <button
            onClick={() => ctx.setActiveTab?.("loan_docs")}
            style={{ padding: "6px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            View Docs →
          </button>
        </div>
      )}

      {/* ── Already verified badge ── */}
      {isLoanCase && hasVerifiedLoanDocs && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: "10px", marginBottom: "16px",
        }}>
          <CheckCircle2 style={{ width: "16px", height: "16px", color: "#16a34a" }} />
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#15803d" }}>
            Banking Document Package verified ✓
          </span>
          <button
            onClick={() => ctx.setActiveTab?.("loan_docs")}
            style={{ marginLeft: "auto", padding: "4px 10px", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}
          >
            View Docs
          </button>
        </div>
      )}

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
                  Financial Details
                </p>
                {normalized.financeVerified && !financeEditMode && (
                  <button
                    onClick={() => setFinanceEditMode(true)}
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

              {normalized.financeVerified && !financeEditMode ? (
                <div
                  style={{
                    padding: "16px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <CheckCircle2
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "#16a34a",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#166534",
                        fontWeight: 700,
                      }}
                    >
                      Finance Details Saved
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "#166534" }}>
                        Total Amount
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#14532d",
                        }}
                      >
                        ₹{Number(normalized.totalAmount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#166534" }}>
                        Payment Type
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#14532d",
                        }}
                      >
                        {fData.paymentType || "—"}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#166534" }}>
                        Down Payment
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#14532d",
                        }}
                      >
                        ₹{Number(fData.downPayment || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#166534" }}>
                        Remaining Amount
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#14532d",
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
                </div>
              ) : (
                <>
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#e0e7ff",
                      border: "1px solid #c7d2fe",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#3730a3",
                      }}
                    >
                      Quotation Total:
                    </span>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "#312e81",
                      }}
                    >
                      ₹{Number(normalized.totalAmount).toLocaleString()}
                    </span>
                  </div>
                  <form
                    onSubmit={handleFinanceUpdate}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#475569",
                            marginBottom: "6px",
                          }}
                        >
                          Payment Type
                        </label>
                        <select
                          value={fData.paymentType}
                          onChange={(e) =>
                            setFData({ ...fData, paymentType: e.target.value })
                          }
                          className="input"
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          <option value="Cash">Cash</option>
                          <option value="Loan">Loan</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#475569",
                            marginBottom: "6px",
                          }}
                        >
                          Down Payment (₹)
                        </label>
                        <input
                          type="number"
                          value={fData.downPayment}
                          onChange={(e) =>
                            setFData({ ...fData, downPayment: e.target.value })
                          }
                          placeholder="0"
                          className="input"
                        />
                      </div>
                    </div>

                    {fData.paymentType === "Cash" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          padding: "14px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: "10px",
                        }}
                      >
                        <div style={{ display: "flex", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#166534",
                                marginBottom: "6px",
                              }}
                            >
                              Cash Amount (₹)
                            </label>
                            <input
                              type="number"
                              value={fData.cashAmount}
                              onChange={(e) =>
                                setFData({
                                  ...fData,
                                  cashAmount: e.target.value,
                                })
                              }
                              placeholder="Total cash to pay"
                              className="input"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#166534",
                                marginBottom: "6px",
                              }}
                            >
                              Payment Mode
                            </label>
                            <select
                              value={fData.paymentMode}
                              onChange={(e) =>
                                setFData({
                                  ...fData,
                                  paymentMode: e.target.value,
                                })
                              }
                              className="input"
                            >
                              <option value="">Select mode...</option>
                              <option value="Cash">Cash (Physical)</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Debit Card">Debit Card</option>
                              <option value="Credit Card">Credit Card</option>
                              <option value="UPI">UPI</option>
                            </select>
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "10px",
                            background: "#dcfce7",
                            borderRadius: "6px",
                            border: "1px solid #86efac",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#14532d",
                            }}
                          >
                            Remaining Cash to be Paid:
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#14532d",
                            }}
                          >
                            ₹
                            {Number(
                              (normalized.totalAmount || 0) -
                                (fData.downPayment || 0),
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {fData.paymentType === "Loan" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          padding: "14px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: "10px",
                        }}
                      >
                        <div style={{ display: "flex", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#1e3a8a",
                                marginBottom: "6px",
                              }}
                            >
                              Loan Amount (₹)
                            </label>
                            <input
                              type="number"
                              value={fData.loanAmount}
                              onChange={(e) =>
                                setFData({
                                  ...fData,
                                  loanAmount: e.target.value,
                                })
                              }
                              placeholder="Amount financed"
                              className="input"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#1e3a8a",
                                marginBottom: "6px",
                              }}
                            >
                              Loan Approved Amount (₹)
                            </label>
                            <input
                              type="number"
                              value={fData.loanApprovedAmount}
                              onChange={(e) =>
                                setFData({
                                  ...fData,
                                  loanApprovedAmount: e.target.value,
                                })
                              }
                              placeholder="Approved amount"
                              className="input"
                            />
                          </div>

                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#1e3a8a",
                              marginBottom: "6px",
                            }}
                          >
                            Approved Bank Name
                          </label>
                          <input
                            type="text"
                            value={fData.bankName}
                            onChange={(e) =>
                              setFData({ ...fData, bankName: e.target.value })
                            }
                            placeholder="e.g. HDFC, SBI"
                            className="input"
                          />
                        </div>
                        <div
                          style={{
                            padding: "10px",
                            background: "#dbeafe",
                            borderRadius: "6px",
                            border: "1px solid #93c5fd",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#1e3a8a",
                            }}
                          >
                            Remaining Balance (After Down Payment & Loan):
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#1e3a8a",
                            }}
                          >
                            ₹
                            {Number(
                              (normalized.totalAmount || 0) -
                                (fData.downPayment || 0) -
                                (fData.loanAmount || 0),
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "10px",
                      }}
                    >
                      <button
                        type="submit"
                        disabled={financeLoading}
                        className="btn btn-primary"
                      >
                        {financeLoading
                          ? "Saving..."
                          : "Save Financial Details"}
                      </button>
                    </div>
                  </form>

                  {/* Payment History Tracker (B.10) */}
                  <PaymentTracker caseId={normalized.caseId} userRole={role} />
                </>
              )}
            </div>
  );
};

export default FinanceTab;
