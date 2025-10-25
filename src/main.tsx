import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const el = document.getElementById("root");
if (!el) {
  // Fallback so we SEE something even if #root is missing
  const fallback = document.createElement("div");
  fallback.style.cssText = "padding:20px;font-family:system-ui";
  fallback.innerText = "Root element #root not found. Check index.html";
  document.body.appendChild(fallback);
} else {
  console.log("[main] rendering App");
  createRoot(el).render(<App />);
}
