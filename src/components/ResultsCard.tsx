import React from "react";
import { getHistory, useApp } from "../store";

function Chip({ status }: { status: "pass" | "warn" | "fail" }) {
  const map = {
    pass: { bg: "#eafff2", fg: "#0b8f4e", label: "PASS" },
    warn: { bg: "#fff9e6", fg: "#a36b00", label: "WARN" },
    fail: { bg: "#ffefef", fg: "#b3261e", label: "FAIL" },
  }[status];
  return (
    <span style={{
      background: map.bg, color: map.fg, padding: "2px 8px",
      borderRadius: 999, fontSize: 12, fontWeight: 600
    }}>{map.label}</span>
  );
}

export default function ResultsCard() {
  const history = useApp((s) => s.history);
  const clear = useApp((s) => s.clearHistory);

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(getHistory(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `session_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="card">
      <h3 style={{ margin: "0 0 8px" }}>Results</h3>
      {history.length === 0 ? (
        <div className="muted">No results yet. Run a task to record.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                <th style={{ padding: "6px 4px" }}>Time</th>
                <th style={{ padding: "6px 4px" }}>Task</th>
                <th style={{ padding: "6px 4px" }}>Value</th>
                <th style={{ padding: "6px 4px" }}>Status</th>
                <th style={{ padding: "6px 4px" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.slice().reverse().map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                  <td style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                    {new Date(r.ts).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: "6px 4px" }}>{r.task}</td>
                  <td style={{ padding: "6px 4px" }}>{r.value} {r.units}</td>
                  <td style={{ padding: "6px 4px" }}><Chip status={r.status} /></td>
                  <td style={{ padding: "6px 4px", opacity: .85 }}>{r.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="btn" onClick={downloadJSON}>Download JSON</button>
        <button className="btn" onClick={clear}>Clear</button>
      </div>
    </section>
  );
}
