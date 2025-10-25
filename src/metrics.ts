// src/metrics.ts
import type { Landmark, PoseFrameType as PoseFrame } from "./store";

/** Safe landmark fetch by index */
export function L(lm: PoseFrame, i: number): Landmark | undefined {
  if (!lm || !lm[i]) return undefined;
  return lm[i];
}

/** 2D angle (degrees) if you need it elsewhere */
export function angle(A: Landmark, B: Landmark, C: Landmark): number {
  const ba = { x: A.x - B.x, y: A.y - B.y };
  const bc = { x: C.x - B.x, y: C.y - B.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const m1 = Math.hypot(ba.x, ba.y);
  const m2 = Math.hypot(bc.x, bc.y);
  if (!m1 || !m2) return 0;
  const c = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return (Math.acos(c) * 180) / Math.PI;
}

/** Is right wrist above right shoulder? */
export function isRightArmRaised(lm: PoseFrame): boolean | null {
  const RIGHT_WRIST = 16, RIGHT_SHOULDER = 12;
  const w = L(lm, RIGHT_WRIST), s = L(lm, RIGHT_SHOULDER);
  if (!w || !s) return null;
  return w.y < s.y;
}

/** Center of mass proxy */
export function comXY(lm: PoseFrame): { x: number; y: number } | null {
  const L_SH = 11, R_SH = 12, L_HIP = 23, R_HIP = 24;
  const a = L(lm, L_SH), b = L(lm, R_SH), c = L(lm, L_HIP), d = L(lm, R_HIP);
  if (!a || !b || !c || !d) return null;
  return { x: (a.x + b.x + c.x + d.x) / 4, y: (a.y + b.y + c.y + d.y) / 4 };
}
