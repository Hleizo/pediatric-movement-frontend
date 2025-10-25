import React from "react";
import CameraPose from "./components/CameraPose";

export default function App() {
  return (
    <div style={{fontFamily:"system-ui, Arial", padding: 16}}>
      <header style={{display:"flex",alignItems:"center",gap:8}}>
        <h1 style={{margin:0}}>🧠 Pediatric Movement App</h1>
        <span style={{opacity:.7}}>Prototype — MediaPipe Pose</span>
      </header>

      <div style={{marginTop:16, display:"grid", gap:12}}>
        <CameraPose />
      </div>

      <p style={{opacity:.7, marginTop:12}}>
        If the camera doesn’t appear, click the lock icon in the address bar and allow camera.
      </p>
    </div>
  );
}
