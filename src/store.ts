import { create } from 'zustand'


export type Landmark = { x:number; y:number; z?:number; c?:number }
export type Frame = { t:number; lm:Record<string,Landmark> }


type State = {
running: boolean
task: 'idle'|'one_leg'|'walk'|'arm_raise'
landmarks: Record<string,Landmark>
lastFrameAt: number
}


export const useApp = create<State>(()=>({
running: false,
task: 'idle',
landmarks: {},
lastFrameAt: 0,
}))