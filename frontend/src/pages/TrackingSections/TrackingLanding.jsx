import React from "react";
import { APP_CONFIG } from "../../config";
import { FEATURES } from "./TrackingConstants";

export default function TrackingLanding({ inputId, setInputId, setError, handleTrack, loading, error }) {
  return (
    <>
      <section className="hero-split">
        {/* LEFT — Navy */}
        <div
          className="hero-left"
          style={{
            background: "linear-gradient(145deg, #0f0f2d 0%, #1a1a5e 100%)",
            padding: "clamp(40px,6vw,80px) clamp(24px,5vw,64px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "5px 14px",
              marginBottom: 28,
              width: "fit-content",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#4ade80",
                display: "inline-block",
              }}
            />
            <span
              style={{
                color: "#86efac",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Live Tracking
            </span>
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: "clamp(26px,3.2vw,42px)",
              fontWeight: 800,
              lineHeight: 1.22,
              letterSpacing: -0.5,
              marginBottom: 20,
            }}
          >
            Track your solar
            <br />
            project's progress
            <br />
            <span style={{ color: "#4ade80" }}>in real-time.</span>
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 15,
              lineHeight: 1.75,
              marginBottom: 36,
              maxWidth: 380,
            }}
          >
            Get instant visibility into every stage of your {APP_CONFIG.companyName} installation — from registration to plant activation.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "how_to_reg", text: "Registration & verification status" },
              { icon: "construction", text: "Installation progress & scheduling" },
              { icon: "bolt", text: "Plant activation & completion" },
            ].map((item) => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span className="mat" style={{ fontSize: 17, color: "#86efac" }}>
                    {item.icon}
                  </span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 500 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — White search panel */}
        <div
          style={{
            background: "#f7f9fc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(32px,4vw,64px) clamp(24px,4vw,56px)",
          }}
        >
          <div style={{ width: "100%", maxWidth: 400 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f0f23", marginBottom: 6 }}>Find your case</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 28 }}>
              Enter the Tracking ID from your registration confirmation email.
            </p>

            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Tracking ID
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,.06)",
                marginBottom: 12,
              }}
            >
              <span className="mat" style={{ paddingLeft: 14, color: "#94a3b8", fontSize: 20 }}>
                search
              </span>
              <input
                className="tp-input"
                type="text"
                value={inputId}
                onChange={(e) => {
                  setInputId(e.target.value.toUpperCase());
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                placeholder={`e.g. ${APP_CONFIG.trackingPrefix}RAME-94721`}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: "14px 12px",
                  fontSize: 14,
                  fontFamily: "monospace",
                  fontWeight: 600,
                  color: "#1a1a2e",
                  background: "transparent",
                  letterSpacing: 0.5,
                }}
              />
            </div>

            <button
              className="tp-btn"
              onClick={() => handleTrack()}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: "#1a1a5e",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loading ? 0.75 : 1,
                boxShadow: "0 4px 16px rgba(26,26,94,.25)",
              }}
            >
              {loading ? (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: "2px solid rgba(255,255,255,.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                  }}
                />
              ) : (
                <span className="mat" style={{ fontSize: 20 }}>
                  search
                </span>
              )}
              {loading ? "Searching…" : "Track Project"}
            </button>

            {error && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: 12, fontWeight: 500, textAlign: "center" }}>
                {error === "no_record" ? "No record found. Please check your Tracking ID." : "Network error. Please try again."}
              </p>
            )}

            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 20, lineHeight: 1.7 }}>
              Your Tracking ID was sent to your registered email.<br />
              Format: <strong style={{ fontFamily: "monospace", color: "#1a1a5e" }}>{APP_CONFIG.trackingPrefix}NAME-00000</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ padding: "56px 24px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="feat-card"
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #e8eaf0",
                padding: "24px 22px",
                boxShadow: "0 2px 12px rgba(0,0,0,.05)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#eef0ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  color: "#1a1a5e",
                }}
              >
                <span className="mat" style={{ fontSize: 22 }}>
                  {f.icon}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f0f23", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
