import React from "react";

export default function TrackingStyles() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0&display=swap"
        rel="stylesheet"
      />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { font-family: 'Inter', sans-serif; background: #f5f7fa; color: #1a1a2e; }
        .mat { font-family: 'Material Symbols Outlined'; font-size: 20px; line-height: 1; font-style: normal; user-select: none; display: inline-block; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes barIn { from { width: 0; } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.5;} }
        .tp-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        .tp-btn { transition: all .15s; }
        .tp-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(26,26,94,.12); border-color: #1a1a5e; }
        .chip:hover { background: #e8eaf6; border-color: #1a1a5e; cursor: pointer; }
        .chip { transition: all .15s; }
        .feat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(26,26,94,.10); }
        .feat-card { transition: all .2s; }
        
        /* Mobile Responsive Classes */
        .hero-split { display: grid; grid-template-columns: 1fr 1fr; min-height: calc(100vh - 60px); }
        .results-grid { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 20px; align-items: start; }
        .timeline-wrapper { display: flex; min-width: 520px; align-items: flex-start; }
        .timeline-item { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
        .timeline-item-text { margin-top: 8px; font-size: 10px; text-align: center; line-height: 1.3; max-width: 64px; }
        .meta-top { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
        .nav-px { padding: 0 32px; }
        
        .footer-card { background: #fff; border: 1px solid #e8eaf0; border-radius: 12px; margin: 32px 24px; padding: 48px; margin-top: auto; display: flex; flex-direction: column; gap: 36px; box-shadow: 0 4px 20px rgba(0,0,0,.03); }
        .footer-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 40px; }
        .footer-heading { font-size: 12px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
        .footer-text { font-size: 13px; color: #64748b; line-height: 1.7; }
        .footer-link { display: flex; align-items: center; gap: 12px; color: #64748b; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .footer-link:hover { color: #1a1a5e; }
        .footer-link .mat { color: #94a3b8; font-size: 18px; font-variation-settings: 'FILL' 0; }
        .footer-bottom { border-top: 1px solid #f1f5f9; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; font-size: 13px; font-weight: 500; }
        .header-title { font-weight: 800; font-size: 16px; color: #1a1a5e; letter-spacing: -.3px; }
        .track-btn-icon { display: none; }
        
        @media (max-width: 768px) {
          .hero-split { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 40px 24px !important; }
          .results-grid { grid-template-columns: 1fr; }
          .timeline-wrapper { min-width: auto; flex-direction: column; align-items: flex-start; gap: 16px; }
          .timeline-item { flex-direction: row; align-items: center; width: 100%; gap: 16px; }
          .timeline-item-text { margin-top: 0; text-align: left; max-width: none; font-size: 13px; }
          .timeline-line { display: none !important; }
          .timeline-badge { margin-top: 0 !important; margin-left: auto; }
          .meta-top { flex-direction: column; align-items: stretch; }
          .nav-px { padding: 0 16px !important; }
          .footer-card { margin: 24px 16px; padding: 32px 24px; }
          .footer-bottom { flex-direction: column; text-align: center; justify-content: center; }
          .header-title { display: none; }
          .track-btn-text { display: none; }
          .track-btn-icon { display: inline-block; font-size: 20px; }
        }
      `}</style>
    </>
  );
}
