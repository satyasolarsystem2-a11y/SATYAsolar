import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import TrackingStyles from "./TrackingSections/TrackingStyles";
import TrackingNavbar from "./TrackingSections/TrackingNavbar";
import TrackingLanding from "./TrackingSections/TrackingLanding";
import TrackingResults from "./TrackingSections/TrackingResults";
import TrackingFooter from "./TrackingSections/TrackingFooter";

import { STAGES, stageIndex } from "./TrackingSections/TrackingConstants";

const WORKFLOW_URL = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/workflow`;
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [inputId, setInputId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = useCallback(
    async (idToSearch) => {
      const id = (idToSearch || inputId).trim().toUpperCase();
      if (!id) {
        setError("Please enter your Tracking ID.");
        return;
      }
      setLoading(true);
      setError("");
      setResult(null);
      try {
        const res = await fetch(WORKFLOW_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: ANON_KEY,
            Authorization: `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify({ action: "track_status", trackingId: id }),
        });
        const data = await res.json();
        if (!res.ok) setError("no_record");
        else setResult(data);
      } catch {
        setError("network");
      } finally {
        setLoading(false);
      }
    },
    [inputId]
  );

  useEffect(() => {
    const urlId = searchParams.get("id");
    if (urlId) {
      const c = urlId.trim().toUpperCase();
      setInputId(c);
      handleTrack(c);
    }
    // eslint-disable-next-line
  }, []);

  const currentIdx = result ? stageIndex(result.current_stage) : -1;
  const isDelayed = result?.status === "Delayed";
  const isCompleted = currentIdx >= 6;
  const pct = isCompleted
    ? 100
    : currentIdx < 0
      ? 0
      : Math.round(((currentIdx + 1) / STAGES.length) * 100);

  const completedStages = STAGES.slice(
    0,
    Math.max(0, currentIdx + 1)
  ).reverse();

  const handleReset = () => {
    setResult(null);
    setError("");
    setInputId("");
  };

  return (
    <>
      <TrackingStyles />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#f5f7fa",
        }}
      >
        <TrackingNavbar result={result} onReset={handleReset} />

        {!result && (
          <TrackingLanding
            inputId={inputId}
            setInputId={setInputId}
            setError={setError}
            handleTrack={handleTrack}
            loading={loading}
            error={error}
          />
        )}

        {result && (
          <TrackingResults
            result={result}
            inputId={inputId}
            setInputId={setInputId}
            handleTrack={handleTrack}
            isCompleted={isCompleted}
            isDelayed={isDelayed}
            pct={pct}
            currentIdx={currentIdx}
            completedStages={completedStages}
          />
        )}

        <TrackingFooter />
      </div>
    </>
  );
}
