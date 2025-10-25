import type { Landmark, PoseFrame as PoseFrameType } from "./store";

/** Safe landmark read */
export function L(lm: PoseFrameType, i: number): Landmark | undefined {
  if (!lm || !lm[i]) return undefined;
  return lm[i];
}

/** 2D angle in degrees (utility if needed later) */
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

/** Right arm raised? wrist above shoulder (y smaller) */
export function isRightArmRaised(lm: PoseFrameType): boolean | null {
  const RIGHT_WRIST = 16, RIGHT_SHOULDER = 12;
  const w = L(lm, RIGHT_WRIST), s = L(lm, RIGHT_SHOULDER);
  if (!w || !s) return null;
  return w.y < s.y;
}

/** Left arm raised? wrist above shoulder (y smaller) */
export function isLeftArmRaised(lm: PoseFrameType): boolean | null {
  const LEFT_WRIST = 15, LEFT_SHOULDER = 11;
  const w = L(lm, LEFT_WRIST), s = L(lm, LEFT_SHOULDER);
  if (!w || !s) return null;
  return w.y < s.y;
}
