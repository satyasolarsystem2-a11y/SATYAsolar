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

const WorkOrderTab = ({ ctx }) => {
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
    <div id="work-order-print-area">
              {/* Print button — hidden in actual print via CSS */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "16px",
                }}
                className="no-print"
              >
                <button
                  onClick={() => window.print()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                    color: "#fff",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                  }}
                >
                  <Printer style={{ width: "14px", height: "14px" }} />
                  Print Job Sheet
                </button>
              </div>

              {/* ── JOB SHEET PRINTABLE CONTENT ── */}
              <div style={{ fontFamily: "DM Sans, Inter, sans-serif" }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #0f1724 0%, #0f2a1a 100%)",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#fff",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {APP_CONFIG.companyName}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.5)",
                        marginTop: "2px",
                      }}
                    >
                      Work Order / Installation Job Sheet
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#60A5FA",
                        fontFamily: "monospace",
                      }}
                    >
                      {normalized.caseId}
                    </p>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.4)",
                        marginTop: "2px",
                      }}
                    >
                      Issued:{" "}
                      {new Date().toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    marginBottom: "12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "10px",
                    }}
                  >
                    Customer Information
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    {[
                      { label: "Customer Name", val: normalized.customerName },
                      { label: "Phone", val: normalized.phone },
                      { label: "Customer ID", val: normalized.customerId },
                      {
                        label: "Tracking ID",
                        val:
                          normalized.trackingId ||
                          normalized.tracking_id ||
                          caseData?.tracking_id ||
                          "—",
                      },
                      { label: "Address", val: normalized.address },
                      {
                        label: "System Load",
                        val: `${normalized.loadRequired || "—"} kW`,
                      },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <p
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            fontWeight: 600,
                            marginBottom: "2px",
                          }}
                        >
                          {label}
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {val || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Installation Details */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    marginBottom: "12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#166534",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "10px",
                    }}
                  >
                    Installation Details
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    {[
                      { label: "Current Stage", val: normalized.currentStage },
                      { label: "Payment Type", val: normalized.paymentType },
                      {
                        label: "Assigned To",
                        val: normalized.assignedTo || "—",
                      },
                      {
                        label: "Assigned Team",
                        val: normalized.assignedTeam || "—",
                      },
                      {
                        label: "Site Visit Date",
                        val:
                          normalized.siteVisitDate || caseData?.site_visit_date
                            ? new Date(
                                normalized.siteVisitDate ||
                                  caseData?.site_visit_date,
                              ).toLocaleDateString("en-IN")
                            : "—",
                      },
                      { label: "Status", val: normalized.status },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <p
                          style={{
                            fontSize: "10px",
                            color: "#16a34a",
                            fontWeight: 600,
                            marginBottom: "2px",
                          }}
                        >
                          {label}
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#14532d",
                          }}
                        >
                          {val || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Installation Checklist */}
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    marginBottom: "12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "12px",
                    }}
                  >
                    Installation Checklist
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {[
                      "Site survey completed and approved",
                      "Panels mounted and secured on roof structure",
                      "Inverter installed and wired correctly",
                      "DC & AC cable routing completed",
                      "Earth bonding and lightning protection done",
                      "Net meter / bidirectional meter installed",
                      "System powered ON and test run completed",
                      "Customer briefed on usage and maintenance",
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: "3px",
                            flexShrink: 0,
                            background: "#fff",
                          }}
                        />
                        <span style={{ fontSize: "12.5px", color: "#334155" }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technician Signature Block */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  {["Lead Technician", "Customer Signature"].map((label) => (
                    <div
                      key={label}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "14px 16px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10.5px",
                          color: "#64748b",
                          fontWeight: 600,
                          marginBottom: "32px",
                        }}
                      >
                        {label}
                      </p>
                      <div
                        style={{
                          borderTop: "1px solid #cbd5e1",
                          paddingTop: "6px",
                        }}
                      >
                        <p style={{ fontSize: "10px", color: "#94a3b8" }}>
                          Signature &amp; Date
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <p
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    textAlign: "center",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "10px",
                  }}
                >
                  {APP_CONFIG.companyName} • {normalized.caseId} • This document
                  is computer-generated.
                </p>
              </div>
            </div>
  );
};

export default WorkOrderTab;
