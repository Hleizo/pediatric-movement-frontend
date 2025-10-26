import React, { useEffect, useMemo, useRef, useState } from "react";
import CameraPose from "./components/CameraPose";
import ResultsCard from "./components/ResultsCard";
import Assistant from "./components/Assistant";
import TaskBar from "./components/TaskBar";
import ProgressBar from "./components/ProgressBar";
import { getLastPose, addResult } from "./store";
import { isRightArmRaised, isLeftArmRaised } from "./metrics";

type TaskKey = "arm_raise_right" | "arm_raise_left";

const ARABIC_PROMPTS: Record<TaskKey, string> = {
  arm_raise_right: "ارفع يدك اليمين فوق كتفك… ممتاز!",
  arm_raise_left:  "ارفع يدك اليسار فوق كتفك… ممتاز!",
};

const HOLD_MS = 2000; // require 2s hold to pass

export default function App() {
  const [task, setTask] = useState<TaskKey>("arm_raise_right");
  const [msg, setMsg] = useState<string>("—");
  const [speakTick, setSpeakTick] = useState(0);
  const [holdMs, setHoldMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const instruction = useMemo(() => ARABIC_PROMPTS[task], [task]);

  function speakInstruction() { setSpeakTick((t) => t + 1); }

  // Manual check button still available
  function runCheck() {
    const lm = getLastPose();
    const ok =
      task === "arm_raise_right" ? isRightArmRaised(lm) :
      task === "arm_raise_left"  ? isLeftArmRaised(lm)  : null;

    if (ok === null) { setMsg("No pose detected"); return; }
    const status = ok ? "pass" : "fail";
    setMsg(ok ? "✅ Arm is raised" : "❌ Arm is not raised");
    addResult({
      id: crypto.randomUUID(), ts: Date.now(), task,
      value: ok ? 1 : 0, units: "-", status,
      note: ok ? "" : "Wrist not above shoulder",
    });
  }

  // ---- AUTO-CHECK (hold-to-pass) ----
  useEffect(() => {
    let alive = true;
    function loop(ts: number) {
      if (!alive) return;
      const lm = getLastPose();
      const cond =
        task === "arm_raise_right" ? isRightArmRaised(lm) :
        task === "arm_raise_left"  ? isLeftArmRaised(lm)  : null;

      const last = lastTsRef.current ?? ts;
      const dt = ts - last;
      lastTsRef.current = ts;

      if (cond) {
        setHoldMs((v) => {
          const nv = Math.min(HOLD_MS, v + dt);
          // success reached
          if (nv >= HOLD_MS) {
            setMsg("✅ Great! Hold completed.");
            addResult({
              id: crypto.randomUUID(),
              ts: Date.now(),
              task,
              value: 1,
              units: "-",
              status: "pass",
            });
          }
          return nv;
        });
      } else {
        // break in condition → reset timer gradually
        setHoldMs((v) => (v > 0 ? Math.max(0, v - dt * 0.75) : 0));
      }

      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [task]);

  // Reset state when switching task
  useEffect(() => { setMsg("—"); setHoldMs(0); speakInstruction(); }, [task]);

  return (
    <div className="app">
      <h1>🧠 Pediatric Movement App</h1>

      <CameraPose />

      <section className="card">
        <TaskBar
          selected={task}
          onSelect={(t) => setTask(t)}
          onCheck={runCheck}
        />

        <div style={{ marginTop: 6, opacity: 0.85 }}>
          {task === "arm_raise_right"
            ? <>Lift your <b>right</b> hand above the right shoulder and hold for 2 seconds.</>
            : <>Lift your <b>left</b> hand above the left shoulder and hold for 2 seconds.</>}
        </div>

        <div style={{ marginTop: 8 }}>{msg}</div>

        {/* Progress towards auto-pass */}
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={holdMs} />
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Hold: {(holdMs / 1000).toFixed(1)} / {(HOLD_MS / 1000).toFixed(1)} s
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={speakInstruction}>🔊 Say instruction</button>
        </div>
      </section>

      <ResultsCard />

      <p className="muted">
        If camera doesn’t appear, click the lock icon in the address bar and allow camera.
      </p>

      <Assistant
        key={speakTick}
        phrase={instruction}
        speak={true}
        corner="top-right"
        offset={{ x: 16, y: 84 }}
      />
    </div>
  );
}
