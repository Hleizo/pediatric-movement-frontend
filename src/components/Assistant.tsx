import React, { useEffect, useRef } from "react";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type Props = {
  phrase: string;        // Arabic phrase to speak
  speak: boolean;        // when true, speak once
  onDone?: () => void;
  corner?: Corner;       // where to dock (default top-right)
  offset?: { x?: number; y?: number }; // pixel offset from edges
};

export default function Assistant({
  phrase,
  speak,
  onDone,
  corner = "top-right",
  offset = { x: 16, y: 16 },
}: Props) {
  const didSpeak = useRef(false);

  useEffect(() => {
    if (!speak || didSpeak.current) return;
    didSpeak.current = true;

    const synth = window.speechSynthesis;
    if (!synth) { onDone?.(); return; }

    const utter = new SpeechSynthesisUtterance(phrase);
    const voices = synth.getVoices();
    const ar = voices.find(v => v.lang?.toLowerCase().startsWith("ar"));
    if (ar) utter.voice = ar;
    utter.lang = "ar";
    utter.rate = 0.95;
    utter.pitch = 1.1;
    utter.onend = () => onDone?.();
    synth.speak(utter);
  }, [phrase, speak, onDone]);

  // position mapping
  const pos: React.CSSProperties = { position: "fixed" };
  const x = offset.x ?? 16;
  const y = offset.y ?? 16;

  if (corner.includes("top"))  (pos as any).top = y;
  if (corner.includes("bottom")) (pos as any).bottom = y;
  if (corner.includes("left")) (pos as any).left = x;
  if (corner.includes("right")) (pos as any).right = x;

  return (
    <div
      style={{
        ...pos,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        zIndex: 9999,
        // IMPORTANT: don't block clicks on the page
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "#fce68b", display: "grid", placeItems: "center",
        boxShadow: "0 6px 16px rgba(0,0,0,.15)",
        pointerEvents: "none",
      }}>
        <span style={{ fontSize: 26 }}>🤖</span>
      </div>

      <div style={{
        maxWidth: 320,
        background: "#fff",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 6px 16px rgba(0,0,0,.15)",
        border: "1px solid #eee",
        direction: "rtl",
        fontSize: 16,
        lineHeight: 1.4,
        pointerEvents: "none",   // bubble also doesn't block clicks
      }}>
        {phrase}
      </div>
    </div>
  );
}
