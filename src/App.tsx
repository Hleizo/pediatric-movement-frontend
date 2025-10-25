import React from "react";
import CameraPose from "./components/CameraPose";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 16 }}>
      <h1>🧠 Pediatric Movement App</h1>
      <CameraPose />
      <p style={{ opacity: .7, marginTop: 12 }}>
        If camera doesn’t appear, click the lock icon in the address bar and allow camera.
      </p>
    </div>
  );
}
