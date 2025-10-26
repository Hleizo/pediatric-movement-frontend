import React from "react";

export default function ProgressBar({ value, max = 2000 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ height: 8, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: "#0ea5e9", transition: "width .12s" }} />
    </div>
  );
}
