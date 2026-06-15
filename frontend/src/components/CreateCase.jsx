import React, { useState } from "react";
import { supabase, edgeFetch, EDGE } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Send, Plus } from "lucide-react";
import Sidebar from "./Sidebar";

import { INIT, S } from "./CreateCaseSections/createCaseConstants";

import CustomerSection from "./CreateCaseSections/CustomerSection";
import DocumentUploadSection from "./CreateCaseSections/DocumentUploadSection";

export default function CreateCase({ onLogout }) {
  const [f, setF] = useState(INIT);
  const [loading, setLoad] = useState(false);
  const [docs, setDocs] = useState({});
  const [geoTags, setGeoTags] = useState({});
  const navigate = useNavigate();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      setDocs((prev) => ({ ...prev, [key]: file }));
      
      // Request geolocation for file
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGeoTags((prev) => ({
              ...prev,
              [key]: { lat: pos.coords.latitude, lng: pos.coords.longitude }
            }));
          },
          (err) => console.warn("Geolocation warning:", err),
          { enableHighAccuracy: true }
        );
      }
    }
  };

  // ── Document rules ────────────────────────────────────────────────────────
  const BASE_DOCS_CC = [
    "Electricity Bill (Last 2 Months)",
    "Aadhar Card Copy (Electricity Bill Owner)",
    "PAN Card (Electricity Bill Owner)",
    "Bank Details (Cancelled Cheque / Account Number)",
    "Property Proof (House Tax Receipt / Registry Copy)",
    "Verification 4 Photo (Customer House GPS Pic)",
  ];

  const MANDATORY_DOCS = BASE_DOCS_CC;
  const getOptionalDocuments = () => [];

  // ── Form submission ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!f.email) {
      toast.error("Customer Email ID is required!");
      return;
    }
    
    // Validate documents
    for (const doc of MANDATORY_DOCS) {
      if (!docs[doc]) {
        toast.error(`Please upload "${doc}".`);
        return;
      }
    }

    setLoad(true);
    try {
      const uploadedUrls = {};
      toast.loading("Uploading documents...", { id: "upload" });

      for (const [key, file] of Object.entries(docs)) {
        if (file) {
          const sanitizedKey = key.replace(/[^a-zA-Z0-9]/g, "_");
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
          
          let geoStr = "";
          if (geoTags[key]) {
            geoStr = `_GPS_${geoTags[key].lat.toFixed(6)}_${geoTags[key].lng.toFixed(6)}`;
          }

          const fileName = `case_docs/${Date.now()}_${sanitizedKey}${geoStr}_${sanitizedFileName}`;
          const { error } = await supabase.storage
            .from("documents")
            .upload(fileName, file);
          if (error) {
            throw new Error(`Upload failed for ${key}: ${error.message}`);
          } else {
            const { data: publicUrlData } = supabase.storage
              .from("documents")
              .getPublicUrl(fileName);
            uploadedUrls[key] = publicUrlData.publicUrl;
          }
        }
      }
      toast.dismiss("upload");

      const parseKw = (val) =>
        parseInt(String(val).replace(/kW$/i, ""), 10) || 0;

      const payload = {
        action: "create_case",
        reference: f.reference || "",
        pinCode: f.pinCode || "",
        customerName: f.customerName,
        email: f.email,
        phone: f.mobile,
        alternatePhone: "",
        address: f.address,
        loadRequired: parseKw(f.electricalLoad),
        systemSpecs: {}, // No system specs required anymore
        documents: uploadedUrls,
      };

      await edgeFetch(EDGE.workflow, payload);
      toast.success("✅ Case successfully registered!");
      setF(INIT);
      setDocs({});
      setGeoTags({});
      navigate("/cases");
    } catch (err) {
      toast.error(err.message || "Submission failed");
    } finally {
      setLoad(false);
      toast.dismiss("upload");
    }
  };

  // ── Context object passed to all section sub-components ───────────────────
  const [customDocsList, setCustomDocsList] = useState([]);

  const removeCustomDoc = (docName) => {
    setCustomDocsList(prev => prev.filter(n => n !== docName));
    setDocs(prev => {
      const newDocs = { ...prev };
      delete newDocs[docName];
      return newDocs;
    });
  };

  const ctx = {
    f, set, docs,
    handleFileChange,
    MANDATORY_DOCS, getOptionalDocuments,
    customDocsList, setCustomDocsList,
    removeCustomDoc,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--page-bg)" }}>
      <Sidebar onLogout={onLogout} />

      <main style={{ flex: 1, marginLeft: "var(--main-offset)" }}>
        <div style={S.page}>
          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div style={S.hdr}>
            <div
              style={{
                width: 45, height: 45,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Plus size={24} />
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 800 }}>New Case Registration</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                Register a new solar installation customer and upload documents
              </div>
            </div>
          </div>

          {/* ── Form ────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>
            <CustomerSection ctx={ctx} />
            <DocumentUploadSection ctx={ctx} />

            <button
              type="submit"
              disabled={loading}
              style={{ ...S.sub, opacity: loading ? 0.6 : 1, marginTop: "24px" }}
            >
              <Send size={16} />
              {loading ? "Registering Case..." : "Submit"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
