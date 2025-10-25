// src/store.ts
import { create } from "zustand";

/** --------- Landmark Types --------- */
export type Landmark = { x: number; y: number; z?: number; c?: number };
export type PoseFrame = Landmark[] | null;

/** --------- Tasks & Results --------- */
export type Task = "arm_raise_right" | "one_leg_left";

export type Result = {
  id: string;
  ts: number;           // timestamp (ms)
  task: Task;
  value: number;        // main metric (e.g., duration seconds)
  units: string;        // "s" or "-"
  status: "pass" | "warn" | "fail";
  note?: string;
};

type State = {
  running: boolean;
  lastPose: PoseFrame;
  lastFrameAt: number | null;
  history: Result[];

  // setters/getters for pose
  setRunning: (v: boolean) => void;
  setLastPose: (lm: PoseFrame) => void;
  setLastFrameAt: (t: number) => void;

  // results
  addResult: (r: Result) => void;
  clearHistory: () => void;
};

// --- persistence helpers ---
const KEY = "pm_app_history_v1";
function loadHistory(): Result[] {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return [];
    return JSON.parse(s);
  } catch {
    return [];
  }
}
function saveHistory(list: Result[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export const useApp = create<State>((set, get) => ({
  running: false,
  lastPose: null,
  lastFrameAt: null,
  history: loadHistory(),

  setRunning: (v) => set({ running: v }),
  setLastPose: (lm) => set({ lastPose: lm, lastFrameAt: Date.now() }),
  setLastFrameAt: (t) => set({ lastFrameAt: t }),

  addResult: (r) => {
    const list = [...get().history, r].slice(-200); // cap
    saveHistory(list);
    set({ history: list });
  },
  clearHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },
}));

/** Shorthand getters for non-react code */
export function getLastPose() { return useApp.getState().lastPose; }
export function getLastFrameAt() { return useApp.getState().lastFrameAt; }
export function addResult(r: Result) { useApp.getState().addResult(r); }
export function getHistory() { return useApp.getState().history; }
export function setRunning(v:boolean) { useApp.getState().setRunning(v); }

/** Exported types for helpers */
export type { PoseFrame as PoseFrameType };
