import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

window.addEventListener('error', (event) => {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="color:red; padding:20px; font-family:sans-serif;">
        <h2>Runtime Error:</h2>
        <pre style="white-space: pre-wrap; font-size: 14px;">${event.error ? event.error.stack : event.message}</pre>
      </div>
    `;
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
