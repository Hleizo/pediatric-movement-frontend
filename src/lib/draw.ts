// Minimal skeleton drawer with NO external pose types.
// Works with any landmark array: [{x,y,score?}, ...]
// If your landmarks are normalized [0..1], scale before calling.

export type KP = { x: number; y: number; score?: number };

// BlazePose-like connectors (indices for 33-landmark layout).
export const CONNECTORS: [number, number][] = [
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 12],           // shoulders
  [11, 23], [12, 24], // torso
  [23, 24],           // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

export function drawSkeletonFromLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: KP[],
  connectors: [number, number][] = CONNECTORS,
  minScore = 0.5
) {
  // joints
  ctx.fillStyle = "#4ad6ff";
  for (const p of landmarks) {
    const s = p.score ?? 1;
    if (s < minScore) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // bones
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#76ff94";
  for (const [a, b] of connectors) {
    const p1 = landmarks[a];
    const p2 = landmarks[b];
    if (!p1 || !p2) continue;
    const s1 = p1.score ?? 1;
    const s2 = p2.score ?? 1;
    if (s1 < minScore || s2 < minScore) continue;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}
