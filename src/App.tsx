import React, { useMemo, useState } from "react";
import CameraPose from "./components/CameraPose";
import ResultsCard from "./components/ResultsCard";
import Assistant from "./components/Assistant";
import TaskBar from "./components/TaskBar";
import { getLastPose, addResult } from "./store";
import { isRightArmRaised, isLeftArmRaised } from "./metrics";

type TaskKey = "arm_raise_right" | "arm_raise_left";

const ARABIC_PROMPTS: Record<TaskKey, string> = {
  arm_raise_right: "ارفع يدك اليمين فوق كتفك… ممتاز! اضغط تحقق.",
  arm_raise_left:  "ارفع يدك اليسار فوق كتفك… ممتاز! اضغط تحقق.",
};

export default function App() {
  const [task, setTask] = useState<TaskKey>("arm_raise_right");
  const [msg, setMsg] = useState<string>("—");
  const [speakTick, setSpeakTick] = useState(0); // just to re-trigger Assistant

  const instruction = useMemo(() => ARABIC_PROMPTS[task], [task]);

  function speakInstruction() {
    // bump the tick to re-trigger Assistant TTS effect
    setSpeakTick(t => t + 1);
  }

  function runCheck() {
    const lm = getLastPose();
    let ok: boolean | null = null;

    if (task === "arm_raise_right") ok = isRightArmRaised(lm);
    if (task === "arm_raise_left")  ok = isLeftArmRaised(lm);

    if (ok === null) {
      setMsg("No pose detected");
      return;
    }

    const status = ok ? "pass" : "fail";
    const label  = ok ? "✅ Arm is raised" : "❌ Arm is not raised";
    setMsg(label);

    addResult({
      id: crypto.randomUUID(),
      ts: Date.now(),
      task,
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

      <section className="card">
        <TaskBar
          selected={task}
          onSelect={(t) => { setTask(t); setMsg("—"); speakInstruction(); }}
          onCheck={runCheck}
        />
        <div style={{ marginTop: 6, opacity: 0.85 }}>
          {task === "arm_raise_right" ? (
            <>Lift your <b>right</b> hand above the right shoulder, then press “Check”.</>
          ) : (
            <>Lift your <b>left</b> hand above the left shoulder, then press “Check”.</>
          )}
        </div>
        <div style={{ marginTop: 8 }}>{msg}</div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={speakInstruction}>🔊 Say instruction</button>
        </div>
      </section>

      <ResultsCard />

      <p className="muted">
        If camera doesn’t appear, click the lock icon in the address bar and allow camera.
      </p>

      {/* Assistant bubble (Arabic). It re-speaks when speakTick changes */}
      <Assistant
        key={speakTick}
  phrase={instruction}
  speak={true}
  corner="top-right"
  offset={{ x: 16, y: 84 }}   // push down so it doesn't cover the title
/>
    </div>
  );
}
