import React, { useEffect, useRef, useState } from "react";
import CameraPose from "./components/CameraPose";
import { getLastPose, getLastFrameAt } from "./store";
import { isRightArmRaised, comXY } from "./metrics";

export default function App() {
  const [armResult, setArmResult] = useState<string>("—");
  const [balanceState, setBalanceState] = useState<"idle" | "running">("idle");
  const [balanceTime, setBalanceTime] = useState<number>(0);
  const balanceStartRef = useRef<number | null>(null);
  const comHistory = useRef<{ x: number; y: number; t: number }[]>([]);

  function checkRightArm() {
    const lm = getLastPose();
    const ok = isRightArmRaised(lm);
    if (ok === null) setArmResult("No pose detected");
    else setArmResult(ok ? "✅ Right arm raised" : "❌ Right arm not raised");
  }

  const LEFT_ANKLE = 27, RIGHT_ANKLE = 28;

  useEffect(() => {
    const id = setInterval(() => {
      const lm = getLastPose();
      const ts = getLastFrameAt();
      if (!lm || !ts) return;

      const la = lm[LEFT_ANKLE], ra = lm[RIGHT_ANKLE];
      if (!la || !ra) return;

      const rightFootUp = ra.y < la.y - 0.03; // coarse threshold

      if (balanceState === "running") {
        if (rightFootUp) {
          if (balanceStartRef.current == null) balanceStartRef.current = ts;
          const c = comXY(lm);
          if (c) comHistory.current.push({ ...c, t: ts });
          setBalanceTime(((ts - (balanceStartRef.current ?? ts)) / 1000) | 0);
        } else {
          setBalanceState("idle");
          balanceStartRef.current = null;
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [balanceState]);

  function startBalance() {
    setBalanceTime(0);
    comHistory.current = [];
    balanceStartRef.current = null;
    setBalanceState("running");
  }

  return (
    <div className="app">
      <h1>🧠 Pediatric Movement App</h1>

      {/* Camera panel */}
      <CameraPose />

      {/* Cards BELOW the camera */}
      <div className="cards">
        <section className="card">
          <h3 style={{ margin: "0 0 8px" }}>Task: Raise Right Arm</h3>
          <p style={{ margin: "0 0 8px", opacity: 0.8 }}>
            Lift your right hand above the right shoulder, then press “Check”.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn" onClick={checkRightArm}>Check</button>
            <div>{armResult}</div>
          </div>
        </section>

        <section className="card">
          <h3 style={{ margin: "0 0 8px" }}>Task: One-Leg Stance (left leg support)</h3>
          <p style={{ margin: "0 0 8px", opacity: 0.8 }}>
            Stand on the <b>left</b> leg and lift the right foot. Timer runs while the right foot stays up.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {balanceState === "idle" ? (
              <button className="btn" onClick={startBalance}>Start</button>
            ) : (
              <button className="btn" onClick={() => setBalanceState("idle")}>Stop</button>
            )}
            <div>⏱ {balanceTime}s</div>
          </div>
        </section>
      </div>

      <p className="muted">
        If camera doesn’t appear, click the lock icon in the address bar and allow camera.
      </p>
    </div>
  );
}
