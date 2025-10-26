import React from "react";

type TaskKey = "arm_raise_right" | "arm_raise_left";

type Props = {
  selected: TaskKey;
  onSelect: (t: TaskKey) => void;
  onCheck: () => void;
};

export default function TaskBar({ selected, onSelect, onCheck }: Props) {
  return (
    <div style={{
      display: "flex", gap: 10, flexWrap: "wrap",
      alignItems: "center", margin: "10px 0"
    }}>
      <span style={{ fontWeight: 600 }}>Select task:</span>
      <button
        className="btn"
        onClick={() => onSelect("arm_raise_right")}
        style={selected === "arm_raise_right" ? sel : btn}
      >
        Raise Right Arm
      </button>
      <button
        className="btn"
        onClick={() => onSelect("arm_raise_left")}
        style={selected === "arm_raise_left" ? sel : btn}
      >
        Raise Left Arm
      </button>

      <div style={{ width: 8 }} />
      <button className="btn" onClick={onCheck}>Check</button>
    </div>
  );
}

const btn: React.CSSProperties = { };
const sel: React.CSSProperties = { background: "#111", color: "#fff" };
