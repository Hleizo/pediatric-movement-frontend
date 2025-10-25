import { Pose } from '@tensorflow-models/pose-detection'


const CONNECTORS: [number,number][]= [
// a minimal set of connections for clarity
[11,13],[13,15], // left arm
[12,14],[14,16], // right arm
[11,12], // shoulders
[11,23],[12,24], // torso left/right
[23,24], // hips
[23,25],[25,27], // left leg
[24,26],[26,28], // right leg
]


export function drawSkeleton(ctx:CanvasRenderingContext2D, pose: Pose){
const kp = pose.keypoints
ctx.lineWidth = 3
ctx.strokeStyle = '#4ad6ff'
ctx.fillStyle = '#eaf2ff'
// draw joints
kp.forEach(p=>{ if((p.score??0) > 0.6){ ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill() } })
// draw bones
ctx.strokeStyle = '#76ff94'
CONNECTORS.forEach(([a,b])=>{
const p1 = kp[a]
const p2 = kp[b]
if((p1?.score??0) > 0.5 && (p2?.score??0) > 0.5){
ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke()
}
})
}