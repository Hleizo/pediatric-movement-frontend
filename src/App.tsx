import React, { useState } from "react";
import CameraPose from "./components/CameraPose";
import ResultsCard from "./components/ResultsCard";
import { getLastPose, addResult } from "./store";
import { isRightArmRaised, isLeftArmRaised } from "./metrics";

export default function App() {
  const [armRightMsg, setArmRightMsg] = useState<string>("—");
  const [armLeftMsg, setArmLeftMsg]   = useState<string>("—");

  function checkRightArm() {
    const lm = getLastPose();
    const ok = isRightArmRaised(lm);
    if (ok === null) { setArmRightMsg("No pose detected"); return; }
    const status = ok ? "pass" : "fail";
    setArmRightMsg(ok ? "✅ Right arm raised" : "❌ Right arm not raised");
    addResult({
      id: crypto.randomUUID(),
      ts: Date.now(),
      task: "arm_raise_right",
      value: ok ? 1 : 0,
      units: "-",
      status,
      note: ok ? "" : "Wrist not above shoulder",
    });
  }

  function checkLeftArm() {
    const lm = getLastPose();
    const ok = isLeftArmRaised(lm);
    if (ok === null) { setArmLeftMsg("No pose detected"); return; }
    const status = ok ? "pass" : "fail";
    setArmLeftMsg(ok ? "✅ Left arm raised" : "❌ Left arm not raised");
    addResult({
      id: crypto.randomUUID(),
      ts: Date.now(),
      task: "arm_raise_left",
      value: ok ? 1 : 0,
      units: "-",
      status,
      note: ok ? "" : "Wrist not above shoulder",
    });
  }

  return (
    <div className="app">
      <h1>🧠 Pediatric Movement App</h1>

      <CameraPose />

      <div className="cards">
        <section className="card">
          <h3 style={{ margin: "0 0 8px" }}>Task: Raise Right Arm</h3>
          <p style={{ margin: "0 0 8px", opacity: 0.8 }}>
            Lift your <b>right</b> hand above the right shoulder, then press “Check”.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn" onClick={checkRightArm}>Check</button>
            <div>{armRightMsg}</div>
          </div>
        </section>

        <section className="card">
          <h3 style={{ margin: "0 0 8px" }}>Task: Raise Left Arm</h3>
          <p style={{ margin: "0 0 8px", opacity: 0.8 }}>
            Lift your <b>left</b> hand above the left shoulder, then press “Check”.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn" onClick={checkLeftArm}>Check</button>
            <div>{armLeftMsg}</div>
          </div>
        </section>

        <ResultsCard />
      </div>

      <p className="muted">
        If camera doesn’t appear, click the lock icon in the address bar and allow camera.
      </p>
    </div>
  );
}
