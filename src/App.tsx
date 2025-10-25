// src/App.tsx
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

  // --- Arm raise: snapshot check ---
  function checkRightArm() {
    const lm = getLastPose();
    const ok = isRightArmRaised(lm);
    if (ok === null) setArmResult("No pose detected");
    else setArmResult(ok ? "✅ Right arm raised" : "❌ Right arm not raised");
  }

  // --- One-leg stance (left) quick timer (child should lift right foot) ---
  // Simple heuristic: assume right ankle rises (y decreases) and stays higher than left for a period.
  const LEFT_ANKLE = 27, RIGHT_ANKLE = 28;

  useEffect(() => {
    const id = setInterval(() => {
      const lm = getLastPose();
      const ts = getLastFrameAt();
      if (!lm || !ts) return;

      // balance heuristics
      const la = lm[LEFT_ANKLE], ra = lm[RIGHT_ANKLE];
      if (!la || !ra) return;

      const rightFootUp = ra.y < la.y - 0.03; // threshold (tune later)
      if (balanceState === "running") {
        if (rightFootUp) {
          if (balanceStartRef.current == null) balanceStartRef.current = ts;
          // record CoM to show we could check sway later
          const c = comXY(lm);
          if (c) comHistory.current.push({ ...c, t: ts });
          setBalanceTime(((ts - (balanceStartRef.current ?? ts)) / 1000) | 0);
        } else {
          // dropped foot: stop
          setBalanceState("idle");
          balanceStartRef.current = null;
        }
      }
    }, 100); // 10 Hz is fine for UI
    return () => clearInterval(id);
  }, [balanceState]);

  function startBalance() {
    setBalanceTime(0);
    comHistory.current = [];
    balanceStartRef.current = null;
    setBalanceState("running");
  }

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 16 }}>
      <h1>🧠 Pediatric Movement App</h1>
      <CameraPose />

      {/* Tasks */}
      <div style={{ display: "grid", gap: 12, marginTop: 16, maxWidth: 900 }}>
        <section style={card}>
          <h3 style={{ margin: "0 0 8px" }}>Task: Raise Right Arm</h3>
          <p style={{ margin: "0 0 8px", opacity: 0.8 }}>
            Lift your right hand above the right shoulder, then press “Check”.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button style={btn} onClick={checkRightArm}>Check</button>
            <div>{armResult}</div>
          </div>
        </section>

        <section style={card}>
          <h3 style={{ margin: "0 0 8px" }}>Task: One-Leg Stance (Left foot on ground)</h3>
          <p style={{ margin: "0 0 8px", opacity: 0.8 }}>
            Stand on the <b>left</b> leg and lift the right foot. Timer runs while the right foot stays up.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {balanceState === "idle" ? (
              <button style={btn} onClick={startBalance}>Start</button>
            ) : (
              <button style={btn} onClick={() => setBalanceState("idle")}>Stop</button>
            )}
            <div>⏱ {balanceTime}s</div>
          </div>
        </section>
      </div>

      <p style={{ opacity: 0.7, marginTop: 12 }}>
        If camera doesn’t appear, click the lock icon in the address bar and allow camera.
      </p>
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 12,
  padding: 12,
  background: "#fff",
};

const btn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "#f8f8f8",
};
