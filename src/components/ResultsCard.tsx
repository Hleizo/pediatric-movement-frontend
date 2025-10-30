import React from "react";
import { useAppStore } from "../store";

export default function ResultsCard() {
  const results = useAppStore((s) => s.results);
  const clearResults = useAppStore((s) => s.clearResults);

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    const header = ["time", "task", "value", "units", "status", "note"];
    const rows = results.map((r) => [
      new Date(r.ts).toLocaleTimeString(),
      r.task,
      r.value,
      r.units,
      r.status,
      (r.note ?? "").replace(/[\r\n,]+/g, " "),
    ]);

    const lines = [header, ...rows].map((arr) => arr.join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const hasResults = results.length > 0;

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Results</h3>

      {!hasResults ? (
        <div style={{ opacity: 0.75, marginBottom: 12 }}>
          No results yet. Raise your arm to log a pass/fail.
        </div>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: 12 }}>
          <table className="table" style={{ minWidth: 680 }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Task</th>
                <th>Value</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {/** Newest first */}
              {[...results].reverse().map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.ts).toLocaleTimeString()}</td>
                  <td>{r.task}</td>
                  <td>
                    {r.value} {r.units}
                  </td>
                  <td style={{ color: r.status === "pass" ? "#16a34a" : "#dc2626" }}>
                    {r.status === "pass" ? "PASS" : "FAIL"}
                  </td>
                  <td>{r.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" onClick={downloadJSON} disabled={!hasResults}>
          Download JSON
        </button>
        <button className="btn" onClick={downloadCSV} disabled={!hasResults}>
          Download CSV
        </button>
        <button className="btn" onClick={clearResults} disabled={!hasResults}>
          Clear
        </button>
      </div>
    </section>
  );
}
