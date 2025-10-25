// Simple Arabic TTS using the browser SpeechSynthesis as a fallback.
// For production, swap to backend /api/tts returning audio + timestamps.
export async function speakArabic(text:string, opts?:{rate?:number; pitch?:number}){
return new Promise<void>((resolve,reject)=>{
if(!('speechSynthesis' in window)) return resolve()
const utter = new SpeechSynthesisUtterance(text)
const voices = window.speechSynthesis.getVoices()
const ar = voices.find(v=>/ar|Arabic/i.test(v.lang||''))
if(ar) utter.voice = ar
utter.rate = opts?.rate ?? 0.95
utter.pitch = opts?.pitch ?? 1.05
utter.onend = ()=> resolve()
utter.onerror = (e)=> reject(e.error)
window.speechSynthesis.speak(utter)
})
}