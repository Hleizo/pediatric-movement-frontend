// src/store.ts
// Tiny, dependency-free store for sharing pose data across components.

export type Landmark = { x: number; y: number; z?: number; visibility?: number };
export type PoseFrame = Landmark[] | null;

let _lastPose: PoseFrame = null;
let _lastFrameAt = 0;
let _running = false;
let _task: "idle" | "one_leg" | "walk" | "arm_raise" = "idle";

export function setLastPose(lm: PoseFrame) {
  _lastPose = lm;
  _lastFrameAt = Date.now();
}
export function getLastPose(): PoseFrame {
  return _lastPose;
}
export function getLastFrameAt(): number {
  return _lastFrameAt;
}

export function setRunning(v: boolean) {
  _running = v;
}
export function isRunning(): boolean {
  return _running;
}

export function setTask(t: "idle" | "one_leg" | "walk" | "arm_raise") {
  _task = t;
}
export function getTask(): "idle" | "one_leg" | "walk" | "arm_raise" {
  return _task;
}
