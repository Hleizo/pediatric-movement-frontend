export function angleDeg(A:number[],B:number[],C:number[]) {
const BA = [A[0]-B[0], A[1]-B[1]]
const BC = [C[0]-B[0], C[1]-B[1]]
const dot = BA[0]*BC[0] + BA[1]*BC[1]
const magBA = Math.hypot(BA[0],BA[1])
const magBC = Math.hypot(BC[0],BC[1])
const cosv = dot / (magBA*magBC + 1e-8)
return Math.acos(Math.max(-1,Math.min(1,cosv))) * 180/Math.PI
}