import React from "react";

export default function ProgressBar({ value, max = 2000 }: { value: number; max?: number }) {
  const p = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ width: "100%", height: 6, borderRadius: 3, background: "#eee" }}>
      <div
        style={{
          width: `${p * 100}%`,
          height: "100%",
          background: p >= 1 ? "#22c55e" : "#0d6efd",
          transition: "width 90ms linear",
          borderRadius: 3,
        }}
      />
    </div>
  );
}
