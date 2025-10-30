// src/metrics.ts
export type Landmark = { x: number; y: number; z?: number; visibility?: number };
export type PoseForApp = { landmarks?: Landmark[] } | null;

/** Mediapipe indices (33 landmarks) */
const IDX = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
};

/** y is normalized (0..1). Smaller y == higher on screen. */
export function isRightArmRaised(pose: PoseForApp): boolean {
  const lm = pose?.landmarks;
  if (!lm) return false;
  const rs = lm[IDX.RIGHT_SHOULDER];
  const rw = lm[IDX.RIGHT_WRIST];
  if (!rs || !rw) return false;
  return rw.y < rs.y - 0.03; // small margin
}

export function isLeftArmRaised(pose: PoseForApp): boolean {
  const lm = pose?.landmarks;
  if (!lm) return false;
  const ls = lm[IDX.LEFT_SHOULDER];
  const lw = lm[IDX.LEFT_WRIST];
  if (!ls || !lw) return false;
  return lw.y < ls.y - 0.03; // small margin
}
