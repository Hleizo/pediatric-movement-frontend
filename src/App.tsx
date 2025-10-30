import React, { useCallback, useMemo, useRef, useState } from "react";
import CameraPose from "./components/CameraPose";
import { isLeftArmRaised, isRightArmRaised, PoseForApp } from "./metrics";

type TaskKey = "arm_raise_right" | "arm_raise_left";
const HOLD_MS = 2000;

export default function App() {
  const [task, setTask] = useState<TaskKey>("arm_raise_right");
  const [msg, setMsg] = useState("—");
  const [hold, setHold] = useState(0);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lastTs = useRef<number>(performance.now());

  const instruction = useMemo(
    () =>
      task === "arm_raise_right"
        ? "Lift your RIGHT hand above your right shoulder and hold for 2 seconds."
        : "Lift your LEFT hand above your left shoulder and hold for 2 seconds.",
    [task]
  );

  const onPose = useCallback(
    (pose: PoseForApp) => {
      const ts = performance.now();
      const dt = ts - lastTs.current;
      lastTs.current = ts;

      const ok =
        task === "arm_raise_right" ? isRightArmRaised(pose) : isLeftArmRaised(pose);

      if (ok) {
        setHold((h) => {
          const nh = Math.min(HOLD_MS, h + dt);
          if (nh >= HOLD_MS) setMsg("✅ Great! Hold completed.");
          else setMsg("🟡 Keep holding…");
          return nh;
        });
      } else {
        setHold((h) => Math.max(0, h - dt * 0.75));
        setMsg("❌ Arm is not raised");
      }
    },
    [task]
  );

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 16px" }}>🧠 Pediatric Movement App</h1>

      <CameraPose onPose={onPose} onReady={() => setReady(true)} onError={setErr} />

      <div style={{ marginTop: 16, color: ready ? "#0a0" : "#666" }}>
        {ready ? "Camera + pose running ✓" : "Starting camera & model…"}
      </div>
      {err && <div style={{ color: "#b00", marginTop: 6 }}>Error: {err}</div>}

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <b>Task:</b>{" "}
          <button
            onClick={() => {
              setTask("arm_raise_right");
              setHold(0);
              setMsg("—");
            }}
            style={{
              marginRight: 8,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: task === "arm_raise_right" ? "#e8f1ff" : "#fff",
              cursor: "pointer",
            }}
          >
            Raise RIGHT arm
          </button>
          <button
            onClick={() => {
              setTask("arm_raise_left");
              setHold(0);
              setMsg("—");
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: task === "arm_raise_left" ? "#e8f1ff" : "#fff",
              cursor: "pointer",
            }}
          >
            Raise LEFT arm
          </button>
        </div>

        <div style={{ marginBottom: 4 }}>{instruction}</div>
        <div style={{ marginBottom: 8 }}>{msg}</div>

        {/* Progress bar */}
        <div
          style={{
            width: 360,
            maxWidth: "100%",
            height: 10,
            background: "#eee",
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid #ddd",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(hold / HOLD_MS) * 100}%`,
              background: hold >= HOLD_MS ? "#35d07f" : "#4aa3ff",
              transition: "width 80ms linear",
            }}
          />
        </div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
          Hold: {(hold / 1000).toFixed(1)} / {(HOLD_MS / 1000).toFixed(1)} s
        </div>
      </div>

      <p style={{ marginTop: 20, opacity: 0.8 }}>
        If the camera doesn’t appear, click the lock icon in the address bar and allow camera
        access. If a “Start camera” button shows up, click it once (browser autoplay policy).
      </p>
    </div>
  );
}
