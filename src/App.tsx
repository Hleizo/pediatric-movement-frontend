import React, { useState } from "react";
import CameraPose from "./components/CameraPose";
import { getLastPose } from "./store";

export default function App() {
  const [result, setResult] = useState<string | null>(null);

  function checkRaiseRightArm() {
    const lm = getLastPose();
    if (!lm) { setResult("No pose yet — try again."); return; }
    // MediaPipe indices
    const RIGHT_WRIST = 16, RIGHT_SHOULDER = 12;
    const wrist = lm[RIGHT_WRIST], shoulder = lm[RIGHT_SHOULDER];
    if (!wrist || !shoulder) { setResult("Landmarks missing."); return; }
    // y is top=0, bottom=1 → "raised" if wrist.y < shoulder.y
    const raised = wrist.y < shoulder.y;
    setResult(raised ? "✅ Right arm raised" : "❌ Right arm not raised");
  }

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 16 }}>
      <h1>🧠 Pediatric Movement App</h1>
      <CameraPose />
      <div style={{ marginTop: 16 }}>
        <button
          onClick={checkRaiseRightArm}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
        >
          Check: Raise Right Arm
        </button>
        {result && <div style={{ marginTop: 8 }}>{result}</div>}
      </div>
      <p style={{ opacity: .7, marginTop: 8 }}>
        If camera doesn’t appear, click the lock icon in the address bar and allow camera.
      </p>
    </div>
  );
}
