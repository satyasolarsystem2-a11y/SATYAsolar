/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { edgeFetch, EDGE, supabase } from "../lib/supabaseClient";
import { APP_CONFIG } from "../config";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  X,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Zap,
  FileText,
  ClipboardList,
  UserCheck,
  History,
  Package,
  Plus,
  Trash2,
  IndianRupee,
  FileCheck,
  AlertOctagon,
  Printer,
  Star,
  Clock,
  Navigation,
  Download,
  Edit2,
  Lock,
  RefreshCw,
  Microscope,
  Calculator,
  Headphones,
  Link as LinkIcon,
  Send,
} from "lucide-react";
import CaseTimeline from "./CaseTimeline";
import PaymentTracker from "./PaymentTracker";

// Normalize Supabase snake_case row → camelCase the rest of the app expects

import UpdateTab from "./CaseDrawerTabs/UpdateTab";
import DocsTab from "./CaseDrawerTabs/DocsTab";
import HistoryTab from "./CaseDrawerTabs/HistoryTab";
import FinanceTab from "./CaseDrawerTabs/FinanceTab";
import DispatchTab from "./CaseDrawerTabs/DispatchTab";
import SubsidyTab from "./CaseDrawerTabs/SubsidyTab";
import WorkOrderTab from "./CaseDrawerTabs/WorkOrderTab";
import FeedbackTab from "./CaseDrawerTabs/FeedbackTab";
import TechnicalQaTab from "./CaseDrawerTabs/TechnicalQaTab";
import AccountsTab from "./CaseDrawerTabs/AccountsTab";
import CustomerServiceTab from "./CaseDrawerTabs/CustomerServiceTab";
import CustomerPortalTab from "./CaseDrawerTabs/CustomerPortalTab";
import RegistrationTab from "./CaseDrawerTabs/RegistrationTab";
import ProjectTab from "./CaseDrawerTabs/ProjectTab";
import ElectricalTab from "./CaseDrawerTabs/ElectricalTab";
import LoanDocsTab from "./CaseDrawerTabs/LoanDocsTab";

const normalizeCase = (c) => ({
  ...c,
  caseId: c.id ?? c.case_id ?? c.caseId,
  trackingId: c.tracking_id ?? c.trackingId,
  customerId: c.customer_id ?? c.customerId,
  customerName: c.customer_name ?? c.customerName,
  currentStage: c.current_stage ?? c.currentStage,
  assignedTeam: c.assigned_team ?? c.assignedTeam,
  assignedTo: c.assigned_to ?? c.assignedTo,
  loadRequired: c.load_required ?? c.loadRequired,
  paymentType: c.payment_type ?? c.paymentType,
  delayReason: c.delay_reason ?? c.delayReason,
  markedDelayedBy: c.marked_delayed_by ?? c.markedDelayedBy,
  markedDelayedAt: c.marked_delayed_at ?? c.markedDelayedAt,
  documents: c.documents || {},
  documentStatuses: (c.document_statuses ?? c.documentStatuses) || {},
  downPayment: c.down_payment ?? c.downPayment,
  cashAmount: c.cash_amount ?? c.cashAmount,
  paymentMode: c.payment_mode ?? c.paymentMode,
  loanAmount: c.loan_amount ?? c.loanAmount,
  loanApprovedAmount: c.loan_approved_amount ?? c.loanApprovedAmount,
  emiAmount: c.emi_amount ?? c.emiAmount,
  bankName: c.bank_name ?? c.bankName,
  subsidyRefNumber: c.subsidy_ref_number ?? c.subsidyRefNumber,
  subsidyPhase1Amount: c.subsidy_phase1_amount ?? c.subsidyPhase1Amount,
  subsidyPhase2Amount: c.subsidy_phase2_amount ?? c.subsidyPhase2Amount,
  subsidyNote: c.subsidy_note ?? c.subsidyNote,
  totalAmount:
    c.total_amount ??
    c.totalAmount ??
    c.product_price ??
    c.productPrice ??
    c.quotation_price ??
    0,
  // quotation_amount is set automatically when case is created from quotation
  quotationAmount:
    c.quotation_amount ??
    c.quotationAmount ??
    c.total_amount ??
    c.totalAmount ??
    c.product_price ??
    0,
  quotationIdRef: c.quotation_id_ref ?? c.quotationIdRef ?? "",
  quotationVerified: c.quotation_verified ?? c.quotationVerified ?? false,
  financeVerified: c.finance_verified ?? c.financeVerified ?? false,
  accountsVerified: c.accounts_verified ?? c.accountsVerified ?? false,
});

const STAGES = [
  "Case Confirmed",
  "Registration: Document Verification",
  "Registration: Government Portal",
  "Registration: Payment Verification",
  "Registration Pending",
  "Registration Approved",
  "Registration Done",
  "Bank & Finance",
  "Survey Completed",
  "Design & BOM Approved",
  "Material Reserved",
  "Structure Installed",
  "Full Installation Completed",
  "Net Metering Completed",
  "Payment Cleared",
  "Subsidy Closed",
  "Project Completed",
];

// Maps each stage to the department that OWNS write access at that stage
const stageToRole = {
  "Case Confirmed": "sales",
  "Registration: Document Verification": "registration",
  "Registration: Government Portal": "registration",
  "Registration: Payment Verification": "registration",
  // Legacy stages — old cases may be here; registration dept can still move them
  "Registration Pending": "registration",
  "Registration Approved": "registration",
  "Registration Done": "registration",
  // Banking & Finance — both 'banking' and 'finance' roles can act
  "Bank & Finance": "banking",
  // Project stages
  "Survey Completed": "project",
  "Design & BOM Approved": "project",
  "Material Reserved": "warehouse",
  "Structure Installed": "project",
  "Full Installation Completed": "project",
  // Electrical
  "Net Metering Applied": "electrical",
  "Net Metering Completed": "electrical",
  // Accounts
  "Payment Cleared": "accounts",
  // Subsidy
  "Subsidy Closed": "subsidy",
  // Project completion
  "Project Completed": "customer_service",
};

const stageToDeptLabel = {
  sales: "Sales Department",
  registration: "Registration Department",
  banking: "Banking & Finance Department",
  finance: "Banking & Finance Department",
  warehouse: "Warehouse Department",
  project: "Project Department",
  field_installation: "Project / Installation Department",
  electrical: "Electrical Department",
  net_metering: "Electrical / Net Metering Department",
  accounts: "Accounts Department",
  subsidy: "Subsidy Department",
  customer_service: "Customer Service & AMC",
  operations: "Operations (Monitoring)",
  admin: "Management (Admin)",
};

const getTabs = (role, currentStage) => {
  const tabs = [
    { id: "update", icon: Zap, label: "Update" },
    { id: "docs", icon: FileText, label: "Documents" },
  ];

  // ── History (Operations & Admin ONLY) ─────────────────────────────────
  if (role === "admin" || role === "operations") {
    tabs.push({ id: "history", icon: History, label: "History" });
  }

  // ── Accounts tab (accounts dept + admin/ops) ───────────────────────────
  if (role === "accounts" || role === "admin" || role === "operations") {
    tabs.push({ id: "finance", icon: ClipboardList, label: "Accounts" });
  }

  // ── Banking & Finance tab (banking/finance dept) ───────────────────────
  if (role === "banking" || role === "finance" || role === "admin" || role === "operations") {
    tabs.push({ id: "banking_tab", icon: IndianRupee, label: "Banking & Finance" });
  }

  // ── Loan Required Documents tab (banking/finance/admin — loan cases) ────
  if (role === "banking" || role === "finance" || role === "registration" || role === "admin" || role === "operations") {
    tabs.push({ id: "loan_docs", icon: FileText, label: "Loan Required Documents" });
  }

  // ── Dispatch tab (warehouse dept + project dept for installation) ──────
  if (role === "warehouse" || role === "project" || role === "field_installation" || role === "admin" || role === "operations") {
    tabs.push({ id: "dispatch", icon: Package, label: "Dispatch" });
  }

  // ── Subsidy tab ────────────────────────────────────────────────────────
  if (role === "subsidy" || role === "admin" || role === "operations") {
    tabs.push({ id: "subsidy", icon: FileCheck, label: "Subsidy" });
  }



  // ── Project Phase + Job Sheet (project dept) ───────────────────────────
  if (role === "project" || role === "field_installation" || role === "admin" || role === "operations") {
    tabs.push({ id: "project", icon: Printer, label: "Project Phase" });
    tabs.push({ id: "work_order", icon: Printer, label: "Job Sheet" });
  }

  // ── Electrical / Net Metering tab ─────────────────────────────────────
  if (role === "electrical" || role === "net_metering" || role === "admin" || role === "operations") {
    tabs.push({ id: "electrical", icon: Zap, label: "Electrical" });
  }

  // ── Feedback + Customer Portal (admin/operations only) ────────────────
  if (role === "admin" || role === "operations") {
    tabs.push({ id: "feedback", icon: Star, label: "Feedback" });
    tabs.push({ id: "send_to_customer", icon: LinkIcon, label: "Customer Portal" });
  }

  // ── Customer Service & AMC tab ─────────────────────────────────────────
  if (role === "customer_service" || role === "admin" || role === "operations") {
    tabs.push({ id: "service_amc", icon: Microscope, label: "Service & AMC" });
  }

  return tabs;
};


const CaseDrawer = ({ caseData, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("update");
  const [newStage, setNewStage] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayLoading, setDelayLoading] = useState(false);
  const [docStatuses, setDocStatuses] = useState({});
  const [history, setHistory] = useState([]);

  const role = localStorage.getItem("role");
  // normalized must be declared FIRST — other derived values depend on it
  const normalized = normalizeCase(caseData || {});

  const TABS = getTabs(role, normalized.currentStage);

  // Compute whether this user's role owns the current stage (write access)
  const ownerRole = stageToRole[normalized.currentStage] || "";
  // banking/finance are equivalent; project/field_installation are equivalent; electrical/net_metering are equivalent
  const roleAliases = { finance: "banking", field_installation: "project", net_metering: "electrical" };
  const effectiveRole = roleAliases[role] || role;
  const effectiveOwnerRole = roleAliases[ownerRole] || ownerRole;
  const canUpdate = role === "admin" || effectiveOwnerRole === effectiveRole;
  const ownerDept = stageToDeptLabel[ownerRole] || "Another Department";

  const [financeLoading, setFinanceLoading] = useState(false);
  const [fData, setFData] = useState({
    paymentType: "",
    downPayment: "",
    cashAmount: "",
    paymentMode: "",
    loanAmount: "",
    loanApprovedAmount: "",
    emiAmount: "",
    bankName: "",
  });
  const [financeEditMode, setFinanceEditMode] = useState(false);

  const [quotationVerifyLoading, setQuotationVerifyLoading] = useState(false);
  const [quotationEditMode, setQuotationEditMode] = useState(false);
  const [quotationAmountEdit, setQuotationAmountEdit] = useState("");

  const [accountsVerifyLoading, setAccountsVerifyLoading] = useState(false);
  const [accountsEditMode, setAccountsEditMode] = useState(false);

  // ── Download All Docs ZIP state ─────────────────────────────────────────────
  const [downloadZipLoading, setDownloadZipLoading] = useState(false);

  // ── Resend Tracking ID state ────────────────────────────────────────────────
  const [resendLoading, setResendLoading] = useState(false);

  // ── Assign to Employee state (admin only) ────────────────────────────────
  const [deptEmployees, setDeptEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(
    normalized.assignedTo || "",
  );
  const [assignLoading, setAssignLoading] = useState(false);

  // Dispatch Tab State
  const [inventoryList, setInventoryList] = useState([]);
  const [dispatchItems, setDispatchItems] = useState([]);
  const [dispatchDetails, setDispatchDetails] = useState({
    vehicleNumber: "",
    driverName: "",
    notes: "",
  });
  const [dispatchLoading, setDispatchLoading] = useState(false);

  // Subsidy Tab State
  const [subsidyLoading, setSubsidyLoading] = useState(false);
  const [subsidyData, setSubsidyData] = useState({
    subsidyRefNumber: "",
    subsidyNote: "",
  });

  // ── Geo-location state (field_installation only) ────────────────────────────
  const [geoLocation, setGeoLocation] = useState(null); // { lat, lng, accuracy }
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // ── Feedback state (admin, completed cases) ─────────────────────────────────
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    rating: 0,
    feedback_text: "",
    installation_quality: 0,
    team_behavior: 0,
    timeline_satisfaction: 0,
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const printRef = useRef(null);

  // ── New ERP department tab states ───────────────────────────────────────────
  const [technicalNotes, setTechnicalNotes] = useState("");
  const [technicalSaving, setTechnicalSaving] = useState(false);
  const [accountsNotes, setAccountsNotes] = useState("");
  const [accountsSaving, setAccountsSaving] = useState(false);
  const [crmNote, setCrmNote] = useState("");
  const [crmSaving, setCrmSaving] = useState(false);
  const [portalLink, setPortalLink] = useState("");
  const [portalGenerating, setPortalGenerating] = useState(false);

  // ── Loan banking docs state ───────────────────────────────────────────────
  const [loanDocs, setLoanDocs] = useState([]);

  // ── Delay risk detection ─────────────────────────────────────────────────────
  // Show amber warning if case has been at current stage > 2 days (client-side)
  const stageStartTime =
    normalized.stage_start_time || caseData?.stage_start_time;
  const daysAtStage = stageStartTime
    ? Math.floor((Date.now() - new Date(stageStartTime).getTime()) / 86400000)
    : 0;
  const isDelayRisk =
    daysAtStage >= 2 &&
    normalized.status !== "Completed" &&
    normalized.status !== "Delayed";

  // Compute next stage dynamically based on the current payment type
  useEffect(() => {
    if (!caseData) return;
    const idx = STAGES.findIndex(
      (s) => s.toLowerCase() === normalized.currentStage?.toLowerCase(),
    );
    if (idx >= 0 && idx < STAGES.length - 1) {
      let nStage = STAGES[idx + 1];
      const currentPType = (fData.paymentType || normalized.paymentType || "").toLowerCase();
      // Special: Bank & Finance is skipped for cash customers from Payment Verification
      if (nStage === "Bank & Finance" && currentPType === "cash") {
        nStage = "Survey Completed";
      }
      // Special: Registration Payment Verification — jump based on payment type
      if (normalized.currentStage === "Registration: Payment Verification") {
        nStage = currentPType === "loan" ? "Bank & Finance" : "Material Reserved";
      }
      setNewStage(nStage);
    }
  }, [caseData, fData.paymentType, normalized.currentStage, normalized.paymentType]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!caseData) return;

    setDocStatuses(normalized.documentStatuses || {});
    setFData({
      paymentType: normalized.paymentType
        ? normalized.paymentType.toLowerCase() === "loan"
          ? "Loan"
          : "Cash"
        : "",
      downPayment: normalized.downPayment || "",
      cashAmount: normalized.cashAmount || "",
      paymentMode: normalized.paymentMode || "",
      loanAmount: normalized.loanAmount || "",
      loanApprovedAmount: normalized.loanApprovedAmount || "",
      emiAmount: normalized.emiAmount || "",
      bankName: normalized.bankName || "",
    });

    setSubsidyData({
      subsidyRefNumber: normalized.subsidyRefNumber || "",
      subsidyNote: normalized.subsidyNote || "",
    });
    // Reset geo on case change
    setGeoLocation(null);
    setGeoError("");
  }, [caseData]); // eslint-disable-line

  // Fetch case history for timeline tab
  useEffect(() => {
    const cId = caseData?.id || caseData?.case_id || caseData?.caseId;
    if (!cId) return;
    edgeFetch(EDGE.workflow, { action: "get_one", caseId: cId })
      .then((res) => setHistory(res.history || []))
      .catch(() => {});
  }, [caseData?.id, caseData?.case_id, caseData?.caseId]);

  const [customerDocs, setCustomerDocs] = useState([]);
  useEffect(() => {
    if (activeTab !== "docs") return;
    const cId = caseData?.id || caseData?.case_id || caseData?.caseId;
    if (!cId) return;
    supabase
      .from("customer_uploaded_docs")
      .select("*")
      .eq("case_id", cId)
      .then(({ data }) => setCustomerDocs(data || []))
      .catch(console.error);
  }, [activeTab, caseData?.id, caseData?.case_id, caseData?.caseId]);

  // Fetch loan banking docs when loan_docs OR banking_tab is opened
  useEffect(() => {
    if (activeTab !== "loan_docs" && activeTab !== "banking_tab") return;
    const cId = caseData?.id || caseData?.case_id || caseData?.caseId;
    if (!cId) return;
    supabase
      .from("loan_banking_docs")
      .select("*")
      .eq("case_id", cId)
      .order("uploaded_at", { ascending: false })
      .then(({ data }) => setLoanDocs(data || []))
      .catch(console.error);
  }, [activeTab, caseData?.id, caseData?.case_id, caseData?.caseId]);

  // Fetch inventory for dispatch tab + auto-populate items from system_specs / quotations
  useEffect(() => {
    if (activeTab !== "dispatch") return;
    if (inventoryList.length > 0) return; // already loaded
    const caseId = caseData?.id || caseData?.case_id || caseData?.caseId;
    edgeFetch(EDGE.workflow, { action: "get_inventory", caseId })
      .then((res) => {
        // New response: { inventory: [...], quotationSpecs: {...} | null }
        const invList = res.inventory || res || [];
        const specs = res.quotationSpecs || null;
        setInventoryList(invList);

        if (!specs || !invList || invList.length === 0) return;

        // Safe parse if specs is still a string
        let s = specs;
        if (typeof s === "string") {
          try {
            s = JSON.parse(s);
          } catch {
            return;
          }
        }

        const autoItems = [];
        const match = (keywords, qty) => {
          if (!qty || qty <= 0) return;
          const kws = keywords
            .map((k) => String(k).toLowerCase().trim())
            .filter(Boolean);
          const found = invList.find((inv) =>
            kws.some((kw) => inv.name.toLowerCase().includes(kw)),
          );
          if (found)
            autoItems.push({
              id: found.id,
              quantity: qty,
              _name: found.name,
              _unit: found.unit,
              _auto: true,
            });
        };

        // Solar Panels — panelUnit is e.g. "5kW", panelCount is number of panels
        const panelKw = String(s.panelUnit || "").replace(/[^0-9.]/g, "");
        const panelCount = Number(s.panelCount) || 0;
        if (panelCount > 0) {
          match(
            [
              `solar panel ${panelKw}kw`,
              `solar panel`,
              String(s.productName || "")
                .split(" ")[0]
                .toLowerCase(),
            ],
            panelCount,
          );
        }

        // Inverter — inverterKw is e.g. "5kW"
        const invKw = String(s.inverterKw || "").replace(/[^0-9.]/g, "");
        if (invKw && s.inverterBrand) {
          match(
            [
              `inverter ${invKw}kw`,
              `${String(s.inverterBrand).toLowerCase()} inverter`,
              "inverter",
            ],
            1,
          );
        }

        // Battery — batteryBrand e.g. "Luminous 200Ah", batteryCount is number
        const batCount = Number(s.batteryCount) || 0;
        const batCap = Number(s.batteryCapacity) || 0;
        if (batCount > 0) {
          // batteryBrand may already include capacity e.g. "Luminous 200Ah"
          const batBrandLower = String(s.batteryBrand || "").toLowerCase();
          const batCapStr =
            batCap > 0 ? String(batCap) : batBrandLower.replace(/[^0-9]/g, "");
          match([`battery ${batCapStr}ah`, batBrandLower, "battery"], batCount);
        }

        // Structure — e.g. "Apollo 80mm"
        if (s.structure && String(s.structure).trim()) {
          const structStr = String(s.structure).toLowerCase();
          const mm = structStr.replace(/[^0-9]/g, "") || "";
          match([`structure ${mm}mm`, "apollo structure", "structure"], 1);
        }

        // Wiring / Cable
        if (s.wiring && String(s.wiring).trim()) {
          const wireSize = String(s.wiring).replace(/[^0-9]/g, "");
          match(
            [`wiring ${wireSize}`, `cable ${wireSize}`, "ac wiring", "wiring"],
            1,
          );
        }

        // Earthing
        if (s.earthing && String(s.earthing).trim()) {
          match(["earthing", "earth"], 1);
        }

        // BOS
        if (s.bos && String(s.bos).trim()) {
          match(["bos", "balance of system"], 1);
        }

        // Net Metering
        if (
          s.installation &&
          String(s.installation).trim() &&
          String(s.installation).toLowerCase() !== "none"
        ) {
          match(["net metering", "metering"], 1);
        }

        if (autoItems.length > 0) setDispatchItems(autoItems);
      })
      .catch((err) => console.error("Failed to fetch inventory", err));
  }, [activeTab]); // eslint-disable-line

  // Fetch feedback when feedback tab is opened (admin only)
  useEffect(() => {
    if (activeTab !== "feedback") return;
    const cId = caseData?.id || caseData?.case_id || caseData?.caseId;
    if (!cId) return;
    setFeedbackLoading(true);
    edgeFetch(EDGE.workflow, { action: "get_feedback", caseId: cId })
      .then((res) => setFeedbackList(res || []))
      .catch(() => setFeedbackList([]))
      .finally(() => setFeedbackLoading(false));
  }, [activeTab]); // eslint-disable-line

  // ── Geo-location capture handler ─────────────────────────────────────────────
  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocation({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGeoLoading(false);
        toast.success("Location captured successfully!");
      },
      (err) => {
        setGeoError(
          "Could not access location. Please allow location permission or skip.",
        );
        setGeoLoading(false);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true },
    );
  };

  // ── Admin feedback submission ────────────────────────────────────────────────
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (newFeedback.rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    const cId = caseData?.id || caseData?.case_id || caseData?.caseId;
    setFeedbackSubmitting(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "submit_feedback",
        caseId: cId,
        customerName: normalized.customerName,
        rating: newFeedback.rating,
        feedback_text: newFeedback.feedback_text,
        installation_quality:
          newFeedback.installation_quality || newFeedback.rating,
        team_behavior: newFeedback.team_behavior || newFeedback.rating,
        timeline_satisfaction:
          newFeedback.timeline_satisfaction || newFeedback.rating,
        submitted_by: "admin",
      });
      toast.success("Feedback recorded!");
      setNewFeedback({
        rating: 0,
        feedback_text: "",
        installation_quality: 0,
        team_behavior: 0,
        timeline_satisfaction: 0,
      });
      // Refresh feedback list
      const res = await edgeFetch(EDGE.workflow, {
        action: "get_feedback",
        caseId: cId,
      });
      setFeedbackList(res || []);
    } catch (err) {
      toast.error(err.message || "Failed to submit feedback.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const stageIdx = STAGES.findIndex(
    (s) => s.toLowerCase() === normalized.currentStage?.toLowerCase(),
  );
  const pct =
    stageIdx >= 0 ? Math.round(((stageIdx + 1) / STAGES.length) * 100) : 0;
  const caseId = caseData?.id || caseData?.case_id || caseData?.caseId;

  // Stage-specific flags for Registration Department
  const isDocVerificationStage = normalized.currentStage === "Registration: Document Verification";
  const isGovPortalStage = normalized.currentStage === "Registration: Government Portal";
  const isPaymentVerStage = normalized.currentStage === "Registration: Payment Verification";
  const isRegDeptStage = isDocVerificationStage || isGovPortalStage || isPaymentVerStage;

  // Legacy flag — kept for backward compatibility with old quotation/registration stages
  const isRegStage = isRegDeptStage ||
    normalized.currentStage === "Registration" ||
    normalized.currentStage === "Quotation";

  const docs = normalized.documents || {};

  // ── Mandatory docs check — only for Sales when sending to Registration ──
  const MANDATORY_DOC_KEYS = [
    "Electricity Bill (Last 2 Months)",
    "Aadhar Card Copy (Electricity Bill Owner)",
    "PAN Card (Electricity Bill Owner)",
    "Bank Details (Cancelled Cheque / Account Number)",
    "Property Proof (House Tax Receipt / Registry Copy)",
  ];
  const allUploadedDocKeys = [
    ...Object.keys(docs),
    ...(customerDocs || []).map((d) => d.doc_name),
  ];
  const missingMandatoryDocs = MANDATORY_DOC_KEYS.filter(
    (req) => !allUploadedDocKeys.some((u) => u.toLowerCase().includes(req.toLowerCase().slice(0, 10)))
  );
  // Only sales role moving case TO registration needs missing doc check
  const hasMissingMandatoryDocs =
    role === "sales" && normalized.currentStage === "Case Confirmed" && missingMandatoryDocs.length > 0;

  const unverifiedDocs = Object.keys(docs).filter(
    (d) => (docStatuses[d] || "Yellow") !== "Green",
  );
  // Doc error only applies at Document Verification stage (registration role)
  const hasDocError = (isDocVerificationStage && (role === "registration" || role === "admin") && unverifiedDocs.length > 0) || hasMissingMandatoryDocs;

  // Quotation error only for legacy registration stages (NOT new reg dept stages)
  const hasQuotationError = false; // Removed — Payment Verification stage handles payment details directly

  const isBankingStage = normalized.currentStage === "Bank & Finance";
  const pType = (normalized.paymentType || "").toLowerCase();
  const isFinanceApproved =
    pType === "loan"
      ? normalized.finance_form_status === "Loan Approved" ||
        normalized.finance_form_status === "Approved" ||
        normalized.finance_final_status === "Approved"
      : pType === "cash" &&
        normalized.paymentMode &&
        normalized.paymentMode.trim() !== "";
  const hasFinanceError = isBankingStage && !isFinanceApproved;

  /* ── Handlers ── */
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error("Please add a handoff note.");
      return;
    }

    // ── Client-side Gates ────────────────────────────────────────────────
    if (hasDocError) return;
    if (hasFinanceError) return;
    // ─────────────────────────────────────────────────────────────────────

    setUpdateLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_stage",
        caseId,
        newStage,
        remarks,
      });
      toast.success("Stage updated!");
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // ── Registration Payment Verification submit ──────────────────────────────
  // Saves payment details (type, amounts) then moves case to Warehouse or Banking
  const handleRegPaymentSubmit = async (paymentData) => {
    const { paymentType, totalAmount, downPayment, paymentMode, remarks: pmtRemarks } = paymentData;
    if (!paymentType) {
      toast.error("Please select a payment type (Cash or Loan).");
      return;
    }
    setUpdateLoading(true);
    try {
      // First save the payment details to the case
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        paymentType,
        cashAmount: paymentType === "cash" ? Number(totalAmount || 0) : 0,
        downPayment: Number(downPayment || 0),
        paymentMode: paymentMode || "",
        loanAmount: paymentType === "loan" ? Number(totalAmount || 0) : 0,
      });

      // Then move to next stage (backend determines Warehouse or Banking based on payment_type)
      const targetStage = paymentType === "loan" ? "Bank & Finance" : "Material Reserved";
      await edgeFetch(EDGE.workflow, {
        action: "update_stage",
        caseId,
        newStage: targetStage,
        paymentType,
        remarks: pmtRemarks || `Payment type: ${paymentType}. Down payment: ₹${Number(downPayment || 0).toLocaleString("en-IN")}`,
      });
      toast.success(paymentType === "loan" ? "Case sent to Banking Department!" : "Case moved to Warehouse!");
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to submit payment details.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleMarkDelayed = async (unmark = false) => {
    if (!unmark && !delayReason.trim()) {
      toast.error("Enter a delay reason.");
      return;
    }
    setDelayLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "mark_delayed",
        caseId,
        reason: delayReason,
        unmark,
      });
      toast.success(unmark ? "Delay removed." : "Case marked delayed.");
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Failed.");
    } finally {
      setDelayLoading(false);
    }
  };

  const handleDocStatusChange = async (docName, status) => {
    const newStatuses = { ...docStatuses, [docName]: status };
    setDocStatuses(newStatuses);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        documentStatuses: newStatuses,
      });
      toast.success(`Document marked as ${status}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleSubsidyUpdate = async (e) => {
    e.preventDefault();
    setSubsidyLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        ...subsidyData,
      });
      toast.success("Subsidy details updated!");
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setSubsidyLoading(false);
    }
  };

  const handleFinanceUpdate = async (e) => {
    e.preventDefault();
    setFinanceLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_finance",
        caseId,
        ...fData,
        financeVerified: true,
      });
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        financeVerified: true,
      });
      toast.success("Finance details updated!");
      setFinanceEditMode(false);
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setFinanceLoading(false);
    }
  };

  const handleQuotationVerify = async (editedAmount) => {
    setQuotationVerifyLoading(true);
    try {
      const amount =
        editedAmount !== undefined
          ? Number(editedAmount)
          : Number(normalized.quotationAmount);
      if (!amount || amount <= 0) {
        toast.error("Please enter a valid quotation amount.");
        return;
      }
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        quotationVerified: true,
        quotationAmount: amount,
      });
      // Toast notification — non-intrusive corner notification (no popup/page-close)
      toast.success("✓ Quotation verified successfully!");
      setQuotationEditMode(false);
      setQuotationAmountEdit("");
      onRefresh(); // refresh data in-place, drawer stays open
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setQuotationVerifyLoading(false);
    }
  };

  // ── Download All Documents as ZIP ──────────────────────────────────────────
  const handleDownloadZip = async (visibleDocs) => {
    if (!visibleDocs || visibleDocs.length === 0) return;
    setDownloadZipLoading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("documents");
      let successCount = 0;

      await Promise.all(
        visibleDocs.map(async ([docName, docUrl]) => {
          try {
            const response = await fetch(docUrl, { mode: "cors" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            // Derive extension from Content-Type or URL
            const ct = response.headers.get("content-type") || "";
            const extMap = {
              "application/pdf": ".pdf",
              "image/jpeg": ".jpg",
              "image/jpg": ".jpg",
              "image/png": ".png",
              "image/webp": ".webp",
            };
            const ext =
              extMap[ct.split(";")[0].trim()] ||
              (docUrl.match(/\.([a-z0-9]{2,5})(\?|$)/i)?.[1]
                ? "." + docUrl.match(/\.([a-z0-9]{2,5})(\?|$)/i)[1]
                : "");
            const safeDocName = docName.replace(/[^a-zA-Z0-9_\- ]/g, "_");
            folder.file(`${safeDocName}${ext}`, blob);
            successCount++;
          } catch (fileErr) {
            console.warn(
              `[downloadZip] Skipped "${docName}":`,
              fileErr.message,
            );
          }
        }),
      );

      if (successCount === 0) {
        toast.error(
          "Could not download any documents. Files may be inaccessible.",
        );
        return;
      }

      // Systematic filename: Documents_[CustomerID]_[CustomerName].zip
      const custId = (normalized.customerId || "UNKNOWN").replace(
        /[^a-zA-Z0-9_\-]/g,
        "_",
      );
      const custName = (normalized.customerName || "Customer")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const zipName = `Documents_${custId}_${custName}.zip`;

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, zipName);
      toast.success(
        `Downloaded ${successCount} document${successCount !== 1 ? "s" : ""} as ${zipName}`,
      );
    } catch (err) {
      toast.error("ZIP download failed. Please try again.");
      console.error("[downloadZip]", err);
    } finally {
      setDownloadZipLoading(false);
    }
  };

  // ── Resend Tracking ID ─────────────────────────────────────────────────────
  const handleResendTrackingId = async () => {
    setResendLoading(true);
    try {
      const res = await edgeFetch(EDGE.workflow, {
        action: "resend_tracking_id",
        caseId,
      });
      toast.success(res.message || "Tracking ID resent to customer!");
    } catch (err) {
      toast.error(err.message || "Resend failed.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleAccountsVerify = async () => {
    setAccountsVerifyLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "update_details",
        caseId,
        accountsVerified: true,
      });
      toast.success("Payment received and verified!");
      setAccountsEditMode(false);
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setAccountsVerifyLoading(false);
    }
  };

  const handleAddDispatchItem = () => {
    setDispatchItems([...dispatchItems, { id: "", quantity: 1 }]);
  };

  const handleDispatchItemChange = (index, field, value) => {
    const newItems = [...dispatchItems];
    newItems[index][field] = value;
    setDispatchItems(newItems);
  };

  const handleRemoveDispatchItem = (index) => {
    setDispatchItems(dispatchItems.filter((_, i) => i !== index));
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (dispatchItems.length === 0) {
      toast.error("Add at least one item to dispatch.");
      return;
    }
    // Validate
    for (const item of dispatchItems) {
      if (!item.id || item.quantity <= 0) {
        toast.error("Ensure all selected items have a valid quantity.");
        return;
      }
    }

    setDispatchLoading(true);
    try {
      await edgeFetch(EDGE.workflow, {
        action: "dispatch_materials",
        caseId,
        items: dispatchItems,
        vehicleNumber: dispatchDetails.vehicleNumber,
        driverName: dispatchDetails.driverName,
        notes: dispatchDetails.notes,
      });
      toast.success(
        "Materials dispatched and inventory deducted successfully!",
      );

      // Auto-update stage if currently in Sent to Store
      if (normalized.currentStage === "Sent to Store") {
        await edgeFetch(EDGE.workflow, {
          action: "update_stage",
          caseId,
          newStage: "Installation Done",
          remarks: "Materials dispatched, moved to Installation",
        });
      }

      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Dispatch failed.");
    } finally {
      setDispatchLoading(false);
    }
  };

  // ── PDF Download ─────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setPrintLoading(true);

    const trackId =
      normalized.trackingId || normalized.id || normalized.caseId || "—";
    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const deptLabel =
      role === "admin"
        ? "Admin"
        : role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ");
    const fmt = (v) =>
      v && !isNaN(v) ? `₹${Number(v).toLocaleString("en-IN")}` : v || "—";
    const hasVal = (v) =>
      v !== null && v !== undefined && String(v).trim() !== "";

    const secHdr = (t) =>
      `<tr><td colspan="4" style="background:#0f1724;color:#fff;padding:10px 14px;font-size:14px;font-weight:700;letter-spacing:0.07em;border:none">${t}</td></tr>`;

    const row2 = (l1, v1, l2 = "", v2 = "") =>
      `<tr>
        <td style="padding:10px 14px;font-weight:700;color:#334155;font-size:13px;width:18%;background:#f8fafc;border:1px solid #cbd5e1">${l1}</td>
        <td style="padding:10px 14px;color:#000;font-size:14px;font-weight:500;width:32%;border:1px solid #cbd5e1">${hasVal(v1) ? v1 : "—"}</td>
        <td style="padding:10px 14px;font-weight:700;color:#334155;font-size:13px;width:18%;background:#f8fafc;border:1px solid #cbd5e1">${l2}</td>
        <td style="padding:10px 14px;color:#000;font-size:14px;font-weight:500;width:32%;border:1px solid #cbd5e1">${hasVal(v2) ? v2 : l2 ? "—" : ""}</td>
      </tr>`;

    const isAdmin = role === "admin";
    const isBank = ["admin", "banking"].includes(role);
    const isReg = ["admin", "registration", "banking", "sales"].includes(role);
    const isInst = ["admin", "field_installation"].includes(role);
    const isInv = ["admin", "inventory"].includes(role);
    const isSub = ["admin", "subsidy"].includes(role);

    // Customer section
    const customerSection = `
      ${secHdr("CUSTOMER INFORMATION")}
      ${row2("Tracking ID", `<strong>${trackId}</strong>`, "Customer ID", normalized.customerId)}
      ${row2("Customer Name", `<strong>${normalized.customerName}</strong>`, "Status", normalized.status)}
      ${row2("Current Stage", normalized.currentStage, "Assigned Team", normalized.assignedTeam || "—")}
      ${isReg || isInst ? row2("Phone", normalized.phone, "Alternate Phone", normalized.alternatePhone || "—") : ""}
      ${isReg || isInst ? row2("Address", normalized.address, "Load Required", normalized.loadRequired ? normalized.loadRequired + " kW" : "—") : ""}
      ${isReg ? row2("Payment Type", normalized.paymentType, "Consumer ID", normalized.consumerId || "—") : ""}
      ${isReg ? row2("Company", normalized.companyName || "—", "Project Type", normalized.projectType || "—") : ""}
      ${isReg ? row2("Sales Person", normalized.salesPerson || "—", "GSTIN", normalized.gstin || "N/A") : ""}
    `;

    // Finance section
    const financeSection = isBank
      ? `
      ${secHdr("FINANCIAL DETAILS")}
      ${row2("Payment Type", normalized.paymentType, "Down Payment", fmt(normalized.downPayment))}
      ${row2("Loan Amount", fmt(normalized.loanAmount), "Monthly EMI", fmt(normalized.emiAmount))}
      ${row2("Approved Bank", normalized.bankName || "—", "Cash Amount", fmt(normalized.cashAmount))}
    `
      : "";

    // Installation section
    const installSection = isInst
      ? `
      ${secHdr("INSTALLATION DETAILS")}
      ${row2("Site Visit Date", normalized.siteVisitDate || "—", "Load Required", normalized.loadRequired ? normalized.loadRequired + " kW" : "—")}
      ${row2("Installation Note", normalized.installationNote || "—", "", "")}
    `
      : "";

    // Dispatch section with items table
    let dispatchSection = "";
    if (isInv) {
      const items = normalized.dispatchedItems;
      let itemsBody = "";
      if (Array.isArray(items) && items.length > 0) {
        itemsBody = items
          .map(
            (it, i) =>
              `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px;text-align:center">${i + 1}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px">${it.name || it.item || "—"}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px;text-align:center">${it.quantity ?? "—"}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px">${it.unit || "—"}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;font-size:13px">${it.notes || "—"}</td>
          </tr>`,
          )
          .join("");
      } else {
        itemsBody = `<tr><td colspan="5" style="padding:12px;color:#64748b;font-size:13px;border:1px solid #cbd5e1;text-align:center">No dispatch items recorded.</td></tr>`;
      }
      dispatchSection = `
        ${secHdr("DISPATCH DETAILS")}
        ${row2("Dispatch Date", normalized.dispatchDate || "—", "Vehicle Number", normalized.dispatchVehicle || "—")}
        ${row2("Driver Name", normalized.dispatchDriver || "—", "", "")}
        ${secHdr("DISPATCH MATERIALS")}
        <tr><td colspan="4" style="padding:0;border:none">
          <table style="width:100%;border-collapse:collapse">
            <tr style="background:#1e293b;color:#fff">
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px;width:5%">Sr.</th>
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px">Item Description</th>
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px;text-align:center">Qty</th>
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px">Unit</th>
              <th style="padding:9px 12px;border:1px solid #334155;font-size:13px">Notes</th>
            </tr>
            ${itemsBody}
          </table>
        </td></tr>
      `;
    }

    // Subsidy section
    const subsidySection = isSub
      ? `
      ${secHdr("SUBSIDY DETAILS")}
      ${row2("Consumer ID", normalized.consumerId || "—", "Subsidy Ref. No.", normalized.subsidyRefNumber || "—")}
      ${row2("Subsidy Note", normalized.subsidyNote || "—", "", "")}
    `
      : "";

    const statusColor =
      normalized.status === "Completed"
        ? "#065f46"
        : normalized.status === "Delayed"
          ? "#991b1b"
          : "#3730a3";
    const statusBg =
      normalized.status === "Completed"
        ? "#d1fae5"
        : normalized.status === "Delayed"
          ? "#fee2e2"
          : "#e0e7ff";

    const printHTML = `<!DOCTYPE html><html><head>
      <title>{APP_CONFIG.companyName} — ${trackId}</title>
      <meta charset="UTF-8"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff}
        .page{max-width:850px;margin:auto;padding:20px}
        .hdr{background:linear-gradient(135deg,#0f1724 0%,#0f2a1a 100%);color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-radius:6px}
        .hdr-left h1{font-size:26px;font-weight:800;letter-spacing:-0.01em}
        .hdr-left p{font-size:14px;color:rgba(255,255,255,0.7);margin-top:4px}
        .hdr-right{text-align:right}
        .hdr-right .tid{font-family:monospace;font-size:18px;font-weight:700;color:#93c5fd}
        .hdr-right .dt{font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px}
        .badge{display:inline-block;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;background:${statusBg};color:${statusColor};margin-top:8px}
        .dept{display:inline-block;padding:6px 16px;background:#ede9fe;color:#5b21b6;border-radius:6px;font-size:13px;font-weight:700;letter-spacing:0.05em;margin-bottom:18px}
        table.info{width:100%;border-collapse:collapse;margin-bottom:0}
        .footer{font-size:11px;color:#64748b;border-top:1px solid #cbd5e1;padding-top:14px;margin-top:24px;display:flex;justify-content:space-between}
        @media print{body{padding:0}.page{padding:12px}}
      </style></head>
      <body><div class="page">
        <div class="hdr">
          <div class="hdr-left">
            <h1>&#9728; {APP_CONFIG.companyName} CRM</h1>
            <p>Official Case Document</p>
          </div>
          <div class="hdr-right">
            <div class="tid">${trackId}</div>
            <div class="dt">Generated: ${today}</div>
            <div class="badge">${normalized.status || "In Progress"}</div>
          </div>
        </div>
        <div class="dept">&#128203; Downloaded by: ${deptLabel}</div>
        <table class="info">
          ${customerSection}
          ${financeSection}
          ${installSection}
          ${dispatchSection}
          ${subsidySection}
        </table>
        <div class="footer">
          <span>&#9888; Confidential — Authorized for ${deptLabel} only. Do not share.</span>
          <span>{APP_CONFIG.companyName} CRM &nbsp;&middot;&nbsp; ${today}</span>
        </div>
      </div></body></html>`;

    const win = window.open("", "_blank", "width=920,height=750");
    if (win) {
      win.document.write(printHTML);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 400);
    } else {
      toast.error("Popup blocked — allow popups for this site and try again.");
    }
    setPrintLoading(false);
    toast.success("PDF ready — use Ctrl+P → Save as PDF");
  };

  const isCompleted = caseData?.currentStage === "Completed";

  /* ── Render ── */

  const ctx = {
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
    updateLoading,
    loanDocs,
    setLoanDocs,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", padding: "16px" }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
      <div
        style={{ width: "100%", maxWidth: "800px", maxHeight: "92vh", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <div style={{ backgroundColor: "#0f172a", padding: "16px 24px", color: "#ffffff", display: "flex", flexDirection: "column", gap: "12px", position: "relative", flexShrink: 0 }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: "14px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {normalized.trackingId}
              </span>
              <span style={{ color: "#a855f7", fontWeight: 700, fontSize: "13px", letterSpacing: "0.02em" }}>
                Customer ID: {normalized.customerId || "N/A"}
              </span>
            </div>
            
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}>
                <Download size={16} /> PDF
              </button>
              <button onClick={onClose} style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none", color: "#ffffff", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyItems: "center", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}>
                <X size={18} />
              </button>
            </div>
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0", letterSpacing: "-0.02em", color: "#f8fafc" }}>
            {normalized.customerName}
          </h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", color: "#94a3b8", fontSize: "14px", fontWeight: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Phone size={16} style={{ color: "#64748b" }} /> {caseData.phone || "N/A"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={16} style={{ color: "#64748b" }} /> {caseData.city || caseData.district || "N/A"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Zap size={16} style={{ color: "#64748b" }} /> {caseData.plant_capacity || caseData.system_size_kw || "0"} kW - {normalized.paymentType || "N/A"}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
            <span style={{ backgroundColor: "#064e3b", color: "#34d399", padding: "6px 16px", borderRadius: "9999px", fontSize: "13px", fontWeight: 700 }}>
              {normalized.status === "Completed" ? "Completed" : normalized.currentStage || "In Progress"}
            </span>
            {normalized.assignedTo && normalized.assignedTo === localStorage.getItem("name") && (
              <span style={{ backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)", padding: "5px 14px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                <UserCheck size={14} /> Assigned to You
              </span>
            )}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "4px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${(Math.max(0, STAGES.indexOf(normalized.currentStage)) + 1) / STAGES.length * 100}%`, height: "100%", backgroundColor: "#f59e0b", position: "absolute", left: 0, top: 0, borderRadius: "2px" }} />
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                Stage {Math.max(0, STAGES.indexOf(normalized.currentStage)) + 1} of {STAGES.length}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "0 16px", flexShrink: 0 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  borderBottom: isActive ? "3px solid #f59e0b" : "3px solid transparent",
                  backgroundColor: "transparent",
                  color: isActive ? "#f59e0b" : "#64748b",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  outline: "none",
                  transition: "all 0.2s"
                }}
              >
                <tab.icon
                  size={18}
                  style={{ color: isActive ? "#f59e0b" : "#cbd5e1" }}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {activeTab === "update" && <UpdateTab ctx={ctx} />}
          {activeTab === "registration" && <RegistrationTab ctx={ctx} />}
          {activeTab === "project" && <ProjectTab ctx={ctx} />}
          {activeTab === "electrical" && <ElectricalTab ctx={ctx} />}
          {activeTab === "docs" && <DocsTab ctx={ctx} />}
          {activeTab === "history" && <HistoryTab ctx={ctx} />}
          {activeTab === "finance" && <FinanceTab ctx={ctx} />}
          {activeTab === "banking_tab" && <FinanceTab ctx={ctx} />}
          {activeTab === "loan_docs" && <LoanDocsTab ctx={ctx} />}
          {activeTab === "dispatch" && <DispatchTab ctx={ctx} />}
          {activeTab === "subsidy" && <SubsidyTab ctx={ctx} />}
          {activeTab === "work_order" && <WorkOrderTab ctx={ctx} />}
          {activeTab === "feedback" && <FeedbackTab ctx={ctx} />}
          {activeTab === "technical_qa" && <TechnicalQaTab ctx={ctx} />}
          {activeTab === "accounts" && <AccountsTab ctx={ctx} />}
          {activeTab === "customer_service" && <CustomerServiceTab ctx={ctx} />}
          {activeTab === "send_to_customer" && <CustomerPortalTab ctx={ctx} />}
        </div>
      </div>
    </div>
  );
};

export default CaseDrawer;
