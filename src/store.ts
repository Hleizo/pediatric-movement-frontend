import { create } from "zustand";

/** --------- Pose Types --------- */
export type Landmark = { x: number; y: number; z?: number; c?: number };
export type PoseFrame = Landmark[] | null;

/** --------- Tasks & Results --------- */
export type Task = "arm_raise_right" | "arm_raise_left";

export type Result = {
  id: string;
  ts: number;                 // timestamp ms
  task: Task;
  value: number;              // 1/0 for pass/fail
  units: string;              // "-" for boolean
  status: "pass" | "warn" | "fail";
  note?: string;
};

type State = {
  running: boolean;
  lastPose: PoseFrame;
  lastFrameAt: number | null;
  history: Result[];

  setRunning: (v: boolean) => void;
  setLastPose: (lm: PoseFrame) => void;
  setLastFrameAt: (t: number) => void;

  addResult: (r: Result) => void;
  clearHistory: () => void;
};

// ---- localStorage persistence ----
const KEY = "pm_app_history_v1";
function loadHistory(): Result[] {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}
function saveHistory(list: Result[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
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
    const list = [...get().history, r].slice(-200);
    saveHistory(list);
    set({ history: list });
  },
  clearHistory: () => { saveHistory([]); set({ history: [] }); },
}));

/** Non-hook helpers */
export function getLastPose() { return useApp.getState().lastPose; }
export function getLastFrameAt() { return useApp.getState().lastFrameAt; }
export function addResult(r: Result) { return useApp.getState().addResult(r); }
export function getHistory() { return useApp.getState().history; }
export function setRunning(v: boolean) { return useApp.getState().setRunning(v); }
// src/store.ts

// ...existing code above...

export function setLastPose(lm: PoseFrame) {
  return useApp.getState().setLastPose(lm);
}
