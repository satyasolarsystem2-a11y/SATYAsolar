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

const FeedbackTab = ({ ctx }) => {
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
                Customer Feedback
              </p>

              {feedbackLoading ? (
                <div style={{ textAlign: "center", padding: "32px" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "2px solid #e2e8f0",
                      borderTopColor: "#3b82f6",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      margin: "0 auto 10px",
                    }}
                  />
                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    Loading feedback…
                  </p>
                </div>
              ) : (
                <>
                  {/* Existing feedback entries */}
                  {feedbackList.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        marginBottom: "20px",
                      }}
                    >
                      {feedbackList.map((fb, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px 16px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <div style={{ display: "flex", gap: "2px" }}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    fill: n <= fb.rating ? "#f59e0b" : "none",
                                    color:
                                      n <= fb.rating ? "#f59e0b" : "#e2e8f0",
                                  }}
                                />
                              ))}
                            </div>
                            <span
                              style={{ fontSize: "11px", color: "#94a3b8" }}
                            >
                              {new Date(fb.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                          {fb.feedback_text && (
                            <p
                              style={{
                                fontSize: "12.5px",
                                color: "#334155",
                                fontStyle: "italic",
                              }}
                            >
                              '{fb.feedback_text}'
                            </p>
                          )}
                          <div
                            style={{
                              display: "flex",
                              gap: "12px",
                              marginTop: "6px",
                            }}
                          >
                            {[
                              ["Install", fb.installation_quality],
                              ["Team", fb.team_behavior],
                              ["Timeline", fb.timeline_satisfaction],
                            ].map(([k, v]) =>
                              v ? (
                                <span
                                  key={k}
                                  style={{ fontSize: "11px", color: "#64748b" }}
                                >
                                  {k}:{" "}
                                  <strong style={{ color: "#0f172a" }}>
                                    {v}/5
                                  </strong>
                                </span>
                              ) : null,
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        background: "#f8fafc",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        marginBottom: "20px",
                      }}
                    >
                      <Star
                        style={{
                          width: "28px",
                          height: "28px",
                          color: "#cbd5e1",
                          margin: "0 auto 8px",
                        }}
                      />
                      <p style={{ fontSize: "13px", color: "#64748b" }}>
                        No feedback recorded yet.
                      </p>
                    </div>
                  )}

                  {/* Add new feedback form */}
                  <div
                    style={{
                      background: "#fffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: "12px",
                      }}
                    >
                      Record Feedback
                    </p>
                    <form
                      onSubmit={handleFeedbackSubmit}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#475569",
                            display: "block",
                            marginBottom: "6px",
                          }}
                        >
                          Overall Rating *
                        </label>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() =>
                                setNewFeedback((f) => ({ ...f, rating: n }))
                              }
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                              }}
                            >
                              <Star
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  fill:
                                    n <= newFeedback.rating
                                      ? "#f59e0b"
                                      : "none",
                                  color:
                                    n <= newFeedback.rating
                                      ? "#f59e0b"
                                      : "#cbd5e1",
                                  transition: "all 0.1s",
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "10px",
                        }}
                      >
                        {[
                          ["Installation Quality", "installation_quality"],
                          ["Team Behavior", "team_behavior"],
                          ["Timeline", "timeline_satisfaction"],
                        ].map(([label, field]) => (
                          <div key={field}>
                            <label
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#64748b",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              {label}
                            </label>
                            <select
                              value={newFeedback[field] || ""}
                              onChange={(e) =>
                                setNewFeedback((f) => ({
                                  ...f,
                                  [field]: Number(e.target.value),
                                }))
                              }
                              style={{
                                width: "100%",
                                padding: "6px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                              }}
                            >
                              <option value="">Select</option>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n} / 5
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#475569",
                            display: "block",
                            marginBottom: "6px",
                          }}
                        >
                          Feedback Notes
                        </label>
                        <textarea
                          value={newFeedback.feedback_text}
                          onChange={(e) =>
                            setNewFeedback((f) => ({
                              ...f,
                              feedback_text: e.target.value,
                            }))
                          }
                          placeholder="Customer comments, suggestions, or complaints..."
                          rows={3}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            fontSize: "13px",
                            outline: "none",
                            resize: "vertical",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={
                          feedbackSubmitting || newFeedback.rating === 0
                        }
                        className="btn btn-primary"
                        style={{
                          opacity:
                            feedbackSubmitting || newFeedback.rating === 0
                              ? 0.6
                              : 1,
                        }}
                      >
                        {feedbackSubmitting ? "Saving…" : "Save Feedback"}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
  );
};

export default FeedbackTab;
