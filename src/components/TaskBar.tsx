import React from "react";
import type { TaskKey } from "../store";

type Props = {
  selected: TaskKey;
  onSelect: (t: TaskKey) => void;
};

const items: { key: TaskKey; label: string }[] = [
  { key: "arm_raise_right", label: "Raise RIGHT arm" },
  { key: "arm_raise_left",  label: "Raise LEFT arm"  },
  { key: "t_pose",          label: "T-Pose"          },
  { key: "arms_forward",    label: "Arms forward"    },
];

export default function TaskBar({ selected, onSelect }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((it) => (
        <button
          key={it.key}
          className="btn"
          style={{
            background: selected === it.key ? "#0a58ca" : undefined,
            color: selected === it.key ? "#fff" : undefined,
          }}
          onClick={() => onSelect(it.key)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
