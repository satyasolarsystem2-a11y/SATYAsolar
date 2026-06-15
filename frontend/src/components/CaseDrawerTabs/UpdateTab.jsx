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

import BankingForm from "../StageForms/BankingForm";
import ProjectForm from "../StageForms/ProjectForm";
import ElectricalForm from "../StageForms/ElectricalForm";
import AccountsForm from "../StageForms/AccountsForm";
import SubsidyTab from "./SubsidyTab"; // Reuse existing subsidy logic

const UpdateTab = ({ ctx }) => {
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
    handleRegPaymentSubmit,
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
    isDocVerificationStage,
    isFinanceApproved,
    isGovPortalStage,
    isPaymentVerStage,
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

  // ── Local state for Registration Payment Verification UI ──
  const [regPaymentType, setRegPaymentType] = React.useState(
    normalized?.paymentType ? normalized.paymentType.toLowerCase() : ""
  );
  const [regTotalAmount, setRegTotalAmount] = React.useState(
    normalized?.quotationAmount ? String(normalized.quotationAmount) : ""
  );
  const [regDownPayment, setRegDownPayment] = React.useState(
    normalized?.downPayment ? String(normalized.downPayment) : ""
  );
  const [regPaymentMode, setRegPaymentMode] = React.useState(
    normalized?.paymentMode || ""
  );
  const [regRemarks, setRegRemarks] = React.useState("");
  const [regSubmitting, setRegSubmitting] = React.useState(false);
  const [regLoanDocFile, setRegLoanDocFile] = React.useState(null);

  const regRemaining = Math.max(
    0,
    Number(regTotalAmount || 0) - Number(regDownPayment || 0)
  );

  // ── Local state for Government Portal UI ──
  const [govNeda, setGovNeda] = React.useState(normalized?.neda_registration || "");
  const [govPmsg, setGovPmsg] = React.useState(normalized?.pmsg_registration || "");
  const [govVendor, setGovVendor] = React.useState(normalized?.vendor_selection || "");
  const [govRemarks, setGovRemarks] = React.useState("");
  const [govSubmitting, setGovSubmitting] = React.useState(false);

  const handleGovPortalSubmit = async (e) => {
    e.preventDefault();
    setGovSubmitting(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        nedaRegistration: govNeda,
        pmsgRegistration: govPmsg,
        vendorSelection: govVendor,
      });

      await edgeFetch(EDGE.workflow, {
        action: "update_stage",
        caseId,
        newStage: "Registration: Payment Verification",
        remarks: govRemarks || "Government Portal Registration completed.",
      });
      toast.success("Case moved to Payment Verification!");
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to update details.");
    } finally {
      setGovSubmitting(false);
    }
  };

  const handleRegPaymentFormSubmit = async (e) => {
    e.preventDefault();
    if (!regPaymentType) {
      toast.error("Please select a payment type.");
      return;
    }
    if (regPaymentType === "cash" && !regTotalAmount) {
      toast.error("Please enter the total amount.");
      return;
    }
    if (regPaymentType === "loan" && !regLoanDocFile) {
      toast.error("Please upload the Loan Document.");
      return;
    }
    if (!regRemarks.trim()) {
      toast.error("Please enter a handoff note.");
      return;
    }
    setRegSubmitting(true);
    try {
      if (regPaymentType === "loan" && regLoanDocFile) {
        toast.loading("Uploading Loan Document...", { id: "loanDoc" });
        const sanitized = "Loan_Document".replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `loan-banking-docs/${caseId}/${Date.now()}_${sanitized}_${regLoanDocFile.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("customer-docs")
          .upload(fileName, regLoanDocFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from("customer-docs")
          .getPublicUrl(fileName);
        
        const uploaderName = localStorage.getItem("name") || "Registration User";
          
        // 1. Save to customer_uploaded_docs (general docs tab)
        await supabase.from("customer_uploaded_docs").insert({
          case_id: caseId,
          doc_name: "Loan Document",
          doc_url: urlData.publicUrl,
          status: "Pending Verification",
        });

        // 2. ALSO save to loan_banking_docs (dedicated banking package tab)
        await supabase.from("loan_banking_docs").insert({
          case_id: caseId,
          doc_name: "Banking Document Package",
          doc_url: urlData.publicUrl,
          file_name: regLoanDocFile.name,
          uploaded_by: uploaderName,
          status: "Pending",
        });
        
        // 3. Log audit trail
        await supabase.from("case_history").insert({
          case_id: caseId,
          stage: "Documents Uploaded",
          action_type: "document_verified",
          remarks: `Banking Document Package uploaded by ${uploaderName} during Registration Payment Verification.`,
          updated_by: uploaderName,
        });
        
        toast.success("Banking document package uploaded!", { id: "loanDoc" });
      }

      await handleRegPaymentSubmit({
        paymentType: regPaymentType,
        totalAmount: regTotalAmount,
        downPayment: regDownPayment,
        paymentMode: regPaymentMode,
        remarks: regRemarks,
      });
    } catch (err) {
      toast.error(err.message || "Failed to process payment details", { id: "loanDoc" });
    } finally {
      setRegSubmitting(false);
    }
  };

  // ── Additional stage detection (not provided by ctx) ────────────────────
  const isProjectSurveyStage = normalized.currentStage === "Project: Survey & Design";
  const isProjectInstallStage = normalized.currentStage === "Project: Installation";
  const isProjectStage = isProjectSurveyStage || isProjectInstallStage;

  const isWarehouseStage = normalized.currentStage === "Warehouse: Material Dispatch";
  const isElectricalStage = normalized.currentStage === "Electrical: Net Metering";
  const isAccountsStage = normalized.currentStage === "Accounts: Payment Clearance";
  const isSubsidyStage = normalized.currentStage === "Subsidy Registration";
  const isCustomerServiceStage = normalized.currentStage === "Customer Service Update";

  // Compute the next stage label for display and forms
  const nextStageText = (() => {
    const currentIndex = STAGES.indexOf(normalized.currentStage);
    if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
      return STAGES[currentIndex + 1];
    }
    return newStage || normalized.currentStage;
  })();

  const showGenericForm =
    !isBankingStage &&
    !isGovPortalStage &&
    !isPaymentVerStage &&
    !isProjectStage &&
    !isWarehouseStage &&
    !isElectricalStage &&
    !isAccountsStage &&
    !isSubsidyStage &&
    !isCustomerServiceStage;

  return (
    <div>
              {/* READ-ONLY BANNER — shown when this role doesn't own the current stage */}
              {!canUpdate && !isCompleted && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    padding: "18px 20px",
                    borderRadius: "14px",
                    marginBottom: "20px",
                    background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                    border: "1px solid #fde68a",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertTriangle
                      style={{ width: "18px", height: "18px", color: "#fff" }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 700,
                        color: "#92400e",
                        marginBottom: "4px",
                      }}
                    >
                      View-Only Access
                    </p>
                    <p
                      style={{
                        fontSize: "12.5px",
                        color: "#b45309",
                        lineHeight: 1.5,
                      }}
                    >
                      This customer is currently with{" "}
                      <strong>{ownerDept}</strong>. Your department has
                      completed its tasks for this record. Updates can only be
                      made by the assigned department.
                    </p>
                  </div>
                </div>
              )}

              {/* Stage info (always visible) */}
              {!isCompleted && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: "10.5px",
                        color: "#94a3b8",
                        marginBottom: "6px",
                      }}
                    >
                      Current stage
                    </p>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        color: "#475569",
                        background: "#fff",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {normalized.currentStage}
                    </span>
                  </div>
                  {canUpdate && (
                    <>
                      <ArrowRight
                        style={{
                          width: "16px",
                          height: "16px",
                          color: "#cbd5e1",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <p
                          style={{
                            fontSize: "10.5px",
                            color: "var(--color-primary)",
                            fontWeight: 600,
                            marginBottom: "6px",
                          }}
                        >
                          Moving to
                        </p>
                        <span
                          style={{
                            display: "block",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: "#065f46",
                            background: "#d1fae5",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid #a7f3d0",
                          }}
                        >
                          {(() => {
                            if (isPaymentVerStage) return regPaymentType === "loan" ? "Bank & Finance" : "Project: Survey & Design";
                            return nextStageText;
                          })()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Delay Risk Banner (shown when 2+ days at stage but not yet flagged) ── */}
              {isDelayRisk && canUpdate && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                  }}
                >
                  <Clock
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "#d97706",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "#92400e",
                        marginBottom: "2px",
                      }}
                    >
                      Delay Risk — {daysAtStage} day
                      {daysAtStage !== 1 ? "s" : ""} at this stage
                    </p>
                    <p
                      style={{
                        fontSize: "11.5px",
                        color: "#b45309",
                        lineHeight: 1.4,
                      }}
                    >
                      This case has been in{" "}
                      <strong>{normalized.currentStage}</strong> for{" "}
                      {daysAtStage} days. Consider flagging a delay if progress
                      is blocked.
                    </p>
                  </div>
                </div>
              )}

              {/* ── ADMIN: Assign to Employee ── */}
              {role === "admin" && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px 16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <UserCheck
                        style={{
                          width: "13px",
                          height: "13px",
                          color: "#6366f1",
                        }}
                      />
                      Assign to Employee
                    </p>
                    {normalized.assignedTo && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#6366f1",
                          background: "#eef2ff",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        Currently: {normalized.assignedTo}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      onFocus={async () => {
                        if (deptEmployees.length === 0) {
                          try {
                            const emps = await edgeFetch(EDGE.workflow, {
                              action: "get_dept_employees",
                              caseId: normalized.caseId,
                            });
                            setDeptEmployees(emps || []);
                          } catch {
                            /* silently fail */
                          }
                        }
                      }}
                      className="input"
                      style={{
                        flex: 1,
                        fontSize: "12.5px",
                        paddingTop: "7px",
                        paddingBottom: "7px",
                      }}
                    >
                      <option value="">— Select employee —</option>
                      {deptEmployees.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={assignLoading || !selectedEmployee}
                      onClick={async () => {
                        setAssignLoading(true);
                        try {
                          await edgeFetch(EDGE.workflow, {
                            action: "assign",
                            caseId: normalized.caseId,
                            assignedTo: selectedEmployee,
                          });
                          toast.success(`Case assigned to ${selectedEmployee}`);
                          onRefresh();
                        } catch (err) {
                          toast.error(err.message || "Could not assign case.");
                        } finally {
                          setAssignLoading(false);
                        }
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background:
                          assignLoading || !selectedEmployee
                            ? "#e2e8f0"
                            : "#6366f1",
                        color:
                          assignLoading || !selectedEmployee
                            ? "#94a3b8"
                            : "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor:
                          assignLoading || !selectedEmployee
                            ? "not-allowed"
                            : "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                      }}
                    >
                      {assignLoading ? "Saving…" : "Assign"}
                    </button>
                    {normalized.assignedTo && (
                      <button
                        type="button"
                        onClick={async () => {
                          setAssignLoading(true);
                          try {
                            await edgeFetch(EDGE.workflow, {
                              action: "assign",
                              caseId: normalized.caseId,
                              assignedTo: "",
                            });
                            toast.success("Assignment removed");
                            setSelectedEmployee("");
                            onRefresh();
                          } catch (err) {
                            toast.error(err.message || "Error");
                          } finally {
                            setAssignLoading(false);
                          }
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1px solid #fecdd3",
                          background: "#fff1f2",
                          color: "#be123c",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <X style={{ width: "12px", height: "12px" }} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isCompleted ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <CheckCircle2
                    style={{
                      width: "40px",
                      height: "40px",
                      color: "var(--color-primary)",
                      margin: "0 auto 12px",
                    }}
                  />
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "15px",
                    }}
                  >
                    Customer Completed
                  </p>
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                      marginTop: "6px",
                    }}
                  >
                    This project has been fully processed.
                  </p>
                </div>
              ) : canUpdate ? (
                <>
                  {/* ── Registration: Payment Verification — dedicated payment form ── */}
                  {isPaymentVerStage ? (
                    <form onSubmit={handleRegPaymentFormSubmit} style={{ paddingTop: "4px" }}>
                      <div style={{ marginBottom: "20px" }}>
                        <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
                          Payment Details
                        </p>
                        {/* Payment Type */}
                        <div style={{ marginBottom: "14px" }}>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Payment Type</label>
                          <div style={{ display: "flex", gap: "10px" }}>
                            {["cash", "loan"].map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setRegPaymentType(type)}
                                style={{
                                  flex: 1, padding: "10px", borderRadius: "8px", border: "2px solid",
                                  borderColor: regPaymentType === type ? "#6366f1" : "#e2e8f0",
                                  background: regPaymentType === type ? "#eef2ff" : "#f8fafc",
                                  color: regPaymentType === type ? "#4f46e5" : "#64748b",
                                  fontWeight: 700, fontSize: "13px", cursor: "pointer", textTransform: "capitalize",
                                  transition: "all 0.15s"
                                }}
                              >
                                {type === "cash" ? "💵 Cash" : "🏦 Loan"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {regPaymentType === "cash" && (
                          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                              <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Total Amount (₹)</label>
                                <input
                                  type="number"
                                  value={regTotalAmount}
                                  onChange={(e) => setRegTotalAmount(e.target.value)}
                                  placeholder="Quotation total"
                                  className="input"
                                  required
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Down Payment (₹)</label>
                                <input
                                  type="number"
                                  value={regDownPayment}
                                  onChange={(e) => setRegDownPayment(e.target.value)}
                                  placeholder="0"
                                  className="input"
                                />
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: regRemaining > 0 ? "#fffbeb" : "#f0fdf4", borderRadius: "8px", border: `1px solid ${regRemaining > 0 ? "#fde68a" : "#bbf7d0"}` }}>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: regRemaining > 0 ? "#92400e" : "#166534" }}>Remaining Amount:</span>
                              <span style={{ fontSize: "15px", fontWeight: 800, color: regRemaining > 0 ? "#b45309" : "#16a34a" }}>₹{regRemaining.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        )}

                        {regPaymentType === "loan" && (
                          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                            <div style={{ marginBottom: "12px", padding: "10px 14px", background: "#fffbeb", borderRadius: "8px", border: "1px solid #fde68a" }}>
                              <p style={{ fontSize: "12px", fontWeight: 700, color: "#92400e", marginBottom: "2px" }}>🏦 Loan Selected</p>
                              <p style={{ fontSize: "11.5px", color: "#b45309" }}>Case will move to Banking Department for loan processing.</p>
                            </div>
                            <div style={{ marginBottom: "12px" }}>
                              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Customer</label>
                              <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", padding: "8px 12px", background: "#f1f5f9", borderRadius: "6px", margin: 0 }}>{normalized.customerName || "—"}</p>
                            </div>

                            {/* Loan Amount + Down Payment — side by side */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                              <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Loan Amount (₹) <span style={{ color: "#ef4444" }}>*</span></label>
                                <input
                                  type="number"
                                  value={regTotalAmount}
                                  onChange={(e) => setRegTotalAmount(e.target.value)}
                                  placeholder="Total loan amount"
                                  className="input"
                                  required
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Down Payment (₹)</label>
                                <input
                                  type="number"
                                  value={regDownPayment}
                                  onChange={(e) => setRegDownPayment(e.target.value)}
                                  placeholder="0"
                                  className="input"
                                />
                              </div>
                            </div>

                            {/* Remaining amount chip */}
                            {regTotalAmount && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: regRemaining > 0 ? "#fffbeb" : "#f0fdf4", borderRadius: "8px", border: `1px solid ${regRemaining > 0 ? "#fde68a" : "#bbf7d0"}`, marginBottom: "12px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 600, color: regRemaining > 0 ? "#92400e" : "#166534" }}>Loan Balance:</span>
                                <span style={{ fontSize: "15px", fontWeight: 800, color: regRemaining > 0 ? "#b45309" : "#16a34a" }}>₹{regRemaining.toLocaleString("en-IN")}</span>
                              </div>
                            )}

                            <div style={{ marginBottom: "0" }}>
                              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Loan Document Upload (required) <span style={{color: "#ef4444"}}>*</span></label>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setRegLoanDocFile(e.target.files[0])}
                                className="input"
                                style={{ padding: "8px", background: "#fff", width: "100%", boxSizing: "border-box" }}
                                required
                              />
                            </div>
                          </div>
                        )}

                        {regPaymentType && (
                          <div style={{ marginTop: "14px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Handoff Note (required)</label>
                            <textarea
                              value={regRemarks}
                              onChange={(e) => setRegRemarks(e.target.value)}
                              placeholder="Payment details confirmed. Notes for next department…"
                              className="input"
                              style={{ minHeight: "80px", resize: "vertical" }}
                              required
                            />
                          </div>
                        )}
                      </div>

                      {regPaymentType && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setRegSubmitting(true);
                              await handleRegPaymentSubmit({
                                paymentType: regPaymentType,
                                totalAmount: regTotalAmount,
                                downPayment: regDownPayment,
                                paymentMode: regPaymentMode,
                                remarks: regRemarks,
                              });
                            } catch (err) {
                              toast.error(err.message || "Failed to process payment details", { id: "paymentSubmit" });
                            } finally {
                              setRegSubmitting(false);
                            }
                          }}
                          disabled={
                            regSubmitting ||
                            updateLoading ||
                            !regPaymentType ||
                            !regRemarks.trim() ||
                            !regTotalAmount ||
                            (regPaymentType === "cash" && !regDownPayment) ||
                            (regPaymentType === "loan" && !regLoanDocFile)
                          }
                          style={{
                            padding: "12px",
                            background: "var(--color-primary)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            fontWeight: 600,
                            fontSize: "13.5px",
                            cursor: regSubmitting ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "all 0.15s ease",
                            boxShadow: "var(--shadow-brand)",
                            opacity:
                              regSubmitting ||
                              updateLoading ||
                              !regPaymentType ||
                              !regRemarks.trim() ||
                              (regPaymentType === "cash" && (!regTotalAmount || !regDownPayment)) ||
                              (regPaymentType === "loan" && !regLoanDocFile)
                                ? 0.7
                                : 1,
                          }}
                        >
                          {regSubmitting || updateLoading ? (
                            <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing...</>
                          ) : (
                            <>{regPaymentType === "loan" ? "Move to Bank & Finance" : "Move to Project: Survey & Design"} <ArrowRight style={{ width: "14px", height: "14px" }} /></>
                          )}
                        </button>
                      )}
                    </form>
                  ) : isGovPortalStage ? (
                    <form onSubmit={handleGovPortalSubmit} style={{ paddingTop: "4px" }}>
                      <div style={{ marginBottom: "20px" }}>
                        <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
                          Government Portal Registration
                        </p>
                        
                        <div style={{ marginBottom: "14px" }}>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>NEDA Registration No.</label>
                          <input
                            type="text"
                            value={govNeda}
                            onChange={(e) => setGovNeda(e.target.value)}
                            placeholder="Enter NEDA Reg No."
                            className="input"
                            required
                          />
                        </div>

                        <div style={{ marginBottom: "14px" }}>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>PM Surya Ghar Registration No.</label>
                          <input
                            type="text"
                            value={govPmsg}
                            onChange={(e) => setGovPmsg(e.target.value)}
                            placeholder="Enter PM Surya Ghar Reg No."
                            className="input"
                            required
                          />
                        </div>

                        <div style={{ marginBottom: "14px" }}>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Vendor Selection</label>
                          <select
                            value={govVendor}
                            onChange={(e) => setGovVendor(e.target.value)}
                            className="input"
                            required
                          >
                            <option value="">-- Select Vendor --</option>
                            <option value="Satya Solar">Satya Solar</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div style={{ marginTop: "14px" }}>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Handoff Note (Optional)</label>
                          <textarea
                            value={govRemarks}
                            onChange={(e) => setGovRemarks(e.target.value)}
                            placeholder="Portal details updated..."
                            className="input"
                            style={{ minHeight: "80px", resize: "vertical" }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={govSubmitting}
                        className="btn btn-primary"
                        style={{ width: "100%", display: "flex", justifyContent: "center", gap: "6px" }}
                      >
                        {govSubmitting ? (
                          <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing…</>
                        ) : (
                          <>Government Portal Registration Done <ArrowRight style={{ width: "14px", height: "14px" }} /></>
                        )}
                      </button>
                    </form>
                  ) : (
                  <div>
                        {isBankingStage && <BankingForm ctx={ctx} />}
                        {isProjectStage && <ProjectForm ctx={ctx} />}
                        {isElectricalStage && <ElectricalForm ctx={ctx} />}
                        {isAccountsStage && <AccountsForm ctx={ctx} />}
                        {isSubsidyStage && <SubsidyTab ctx={ctx} />}

                        {showGenericForm && (
                          <form onSubmit={handleUpdateSubmit}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                marginTop: "14px",
                              }}
                            >
                              <label
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#374151",
                                }}
                              >
                                Internal Handoff Remarks (Optional)
                              </label>
                              <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder={`Notes for the next department regarding ${nextStageText}...`}
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #d1d5db",
                                  fontSize: "13px",
                                  outline: "none",
                                  minHeight: "80px",
                                  resize: "vertical",
                                }}
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={updateLoading}
                              className="btn btn-primary"
                              style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                gap: "6px",
                                marginTop: "12px",
                              }}
                            >
                              {updateLoading ? (
                                <>
                                  <div
                                    style={{
                                      width: "14px",
                                      height: "14px",
                                      border: "2px solid rgba(255,255,255,0.3)",
                                      borderTopColor: "#fff",
                                      borderRadius: "50%",
                                      animation: "spin 0.8s linear infinite",
                                    }}
                                  />
                                  Processing…
                                </>
                              ) : (
                                <>
                                  {normalized.currentStage === "Case Confirmed" ? "Move to Registration Department" : 
                                   normalized.currentStage === "Registration: Document Verification" ? "Document Verification Done" :
                                   "Confirm & move to next stage"}{" "}
                                  <ArrowRight
                                    style={{ width: "14px", height: "14px" }}
                                  />
                                </>
                              )}
                            </button>
                          </form>
                        )}
                  </div>
                  )} {/* end isPaymentVerStage conditional */}

                    {/* ── Resend Tracking ID — shown at Phone Verification Done stage ── */}
                    {normalized.currentStage === "Phone Verification Done" &&
                      (role === "registration" || role === "admin") && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            background: "#f0f9ff",
                            border: "1px solid #bae6fd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#0369a1",
                                marginBottom: "2px",
                              }}
                            >
                              Customer not received tracking ID?
                            </p>
                            <p style={{ fontSize: "11px", color: "#0284c7" }}>
                              Manually resend the tracking ID via email as a
                              fallback.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleResendTrackingId}
                            disabled={resendLoading}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "7px 14px",
                              borderRadius: "8px",
                              border: "none",
                              background: resendLoading ? "#e0f2fe" : "#0ea5e9",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: resendLoading ? "wait" : "pointer",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            {resendLoading ? (
                              <>
                                <div
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    border: "2px solid rgba(255,255,255,0.3)",
                                    borderTopColor: "#fff",
                                    borderRadius: "50%",
                                    animation: "spin 0.8s linear infinite",
                                  }}
                                />
                                Sending…
                              </>
                            ) : (
                              <>
                                <RefreshCw
                                  style={{ width: "12px", height: "12px" }}
                                />
                                Resend Tracking ID
                              </>
                            )}
                          </button>
                        </div>
                      )}


                  <div
                    style={{
                      marginTop: "20px",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "18px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "10px",
                      }}
                    >
                      Delay flag
                    </p>
                    {normalized.status === "Delayed" ? (
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: "#fff7ed",
                          border: "1px solid #fed7aa",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <AlertTriangle
                            style={{
                              width: "14px",
                              height: "14px",
                              color: "#ea580c",
                              flexShrink: 0,
                              marginTop: "2px",
                            }}
                          />
                          <div>
                            <p
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#9a3412",
                                marginBottom: "3px",
                              }}
                            >
                              Currently marked as Delayed
                            </p>
                            {normalized.delayReason && (
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#c2410c",
                                  fontStyle: "italic",
                                }}
                              >
                                "{normalized.delayReason}"
                              </p>
                            )}
                            {normalized.markedDelayedBy && (
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#c2410c",
                                  opacity: 0.75,
                                  marginTop: "2px",
                                }}
                              >
                                — by {normalized.markedDelayedBy}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleMarkDelayed(true)}
                          disabled={delayLoading}
                          className="btn"
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            borderColor: "#bbf7d0",
                            width: "fit-content",
                            padding: "6px 12px",
                            fontSize: "12px",
                          }}
                        >
                          <CheckCircle2
                            style={{ width: "13px", height: "13px" }}
                          />{" "}
                          Remove delay flag
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowDelayForm((v) => !v)}
                          className="btn"
                          style={{
                            color: showDelayForm ? "#ea580c" : "#b45309",
                            background: showDelayForm
                              ? "#fff7ed"
                              : "transparent",
                            borderColor: showDelayForm
                              ? "#fed7aa"
                              : "transparent",
                            width: "fit-content",
                            padding: "6px 12px",
                            fontSize: "12px",
                          }}
                        >
                          <AlertTriangle
                            style={{ width: "13px", height: "13px" }}
                          />
                          {showDelayForm ? "Cancel" : "Flag as Delayed"}
                        </button>
                        {showDelayForm && (
                          <div
                            style={{
                              marginTop: "10px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                            }}
                          >
                            <textarea
                              value={delayReason}
                              onChange={(e) => setDelayReason(e.target.value)}
                              placeholder="Reason for delay…"
                              className="input"
                              style={{ minHeight: "72px", resize: "vertical" }}
                            />
                            <button
                              onClick={() => handleMarkDelayed(false)}
                              disabled={delayLoading || !delayReason.trim()}
                              className="btn btn-primary"
                              style={{
                                background: "var(--amber)",
                                color: "#fff",
                                border: "none",
                                opacity:
                                  delayLoading || !delayReason.trim()
                                    ? 0.55
                                    : 1,
                              }}
                            >
                              Confirm delay
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : null}
            </div>
  );
};

export default UpdateTab;
