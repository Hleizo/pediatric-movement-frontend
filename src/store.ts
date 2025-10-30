import { create } from "zustand";

/* ---------- Types ---------- */

export type TaskKey = "arm_raise_right" | "arm_raise_left";

export type ResultEntry = {
  id: string;
  ts: number;               // timestamp (ms)
  task: TaskKey;
  value: number;            // numeric score / 0|1
  units: string;            // "-", "s", etc.
  status: "pass" | "fail";
  note?: string;
};

type AppState = {
  results: ResultEntry[];
  addResult: (r: ResultEntry) => void;
  clearResults: () => void;
};

/* ---------- Store ---------- */

export const useAppStore = create<AppState>((set) => ({
  results: [],
  addResult: (r) =>
    set((s) => ({ results: [...s.results, r] })),
  clearResults: () => set({ results: [] }),
}));

/* ---------- Helpers (optional) ---------- */
/* If you already have pose helpers elsewhere, keep those; these are no-ops
   so this file compiles even if other components import them. Remove if not used. */

export type Landmark = { x: number; y: number; z?: number; visibility?: number };
export type PoseForApp = { landmarks?: Landmark[] } | null;

let _lastPose: PoseForApp = null;

export function setLastPose(p: PoseForApp) {
  _lastPose = p;
}
export function getLastPose(): PoseForApp {
  return _lastPose;
}
