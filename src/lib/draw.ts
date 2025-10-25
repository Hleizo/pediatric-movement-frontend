// TFJS-free drawer
export type KP = { x: number; y: number; score?: number };

export const CONNECTORS: [number, number][] = [
  [11,13],[13,15],[12,14],[14,16],[11,12],
  [11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],
];

export function drawSkeletonFromLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: KP[],
  connectors: [number, number][] = CONNECTORS,
  minScore = 0.5
) {
  ctx.fillStyle = "#4ad6ff";
  for (const p of landmarks) {
    if ((p.score ?? 1) < minScore) continue;
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
  }
  ctx.lineWidth = 3; ctx.strokeStyle = "#76ff94";
  for (const [a,b] of connectors) {
    const p1 = landmarks[a], p2 = landmarks[b];
    if (!p1 || !p2) continue;
    if ((p1.score ?? 1) < minScore || (p2.score ?? 1) < minScore) continue;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
}
