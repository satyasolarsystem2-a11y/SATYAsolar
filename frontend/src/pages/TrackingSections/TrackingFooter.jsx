import React from "react";
import { APP_CONFIG } from "../../config";

export default function TrackingFooter() {
  return (
    <footer className="footer-card">
      <div className="footer-cols">
        {/* Column 1: Brand */}
        <div>
          <img
            src={APP_CONFIG.logoPath}
            alt={APP_CONFIG.companyName}
            style={{ height: 36, marginBottom: 20 }}
          />
          <p className="footer-text" style={{ maxWidth: 280 }}>
            Building sustainable energy
            <br />
            infrastructure across India with smart
            <br />
            solar solutions.
          </p>
        </div>

        {/* Column 2: Contact */}
        <div>
          <div className="footer-heading">Contact</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <a href="mailto:info@satyasolarsystems.com" className="footer-link">
              <span className="mat">mail</span> info@satyasolarsystems.com
            </a>
            <a href="https://wa.me/916386663156" className="footer-link">
              <span className="mat">chat_bubble</span> +91 6386663156
            </a>
            <a href="tel:+916386663156" className="footer-link">
              <span className="mat">call</span> +91 6386663156
            </a>
          </div>
        </div>

        {/* Column 3: Office */}
        <div>
          <div className="footer-heading">Office</div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span
              className="mat"
              style={{
                color: "#94a3b8",
                fontSize: 18,
                marginTop: 2,
                fontVariationSettings: "'FILL' 0",
              }}
            >
              location_on
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <strong style={{ color: "#1a1a5e", fontSize: 14, fontWeight: 700 }}>
                Lucknow Headquarters
              </strong>
              <span className="footer-text">
                {APP_CONFIG.companyAddress}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div style={{ color: "#94a3b8" }}>
          &copy; {APP_CONFIG.year} {APP_CONFIG.companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
