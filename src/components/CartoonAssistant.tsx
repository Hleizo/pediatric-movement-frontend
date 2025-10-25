import React from "react";

export default function CartoonAssistant({
  phrase,
  status,
}: {
  phrase?: string;
  status?: "idle" | "ok" | "warn" | "bad";
}) {
  const badge =
    status === "ok" ? "👏 ممتاز!"
    : status === "warn" ? "⚠️ انتبه"
    : status === "bad" ? "❗حاول مرة أخرى"
    : "🤖";

  return (
    <div className="panel card assistant" style={{display:"grid",placeItems:"center"}}>
      <div className="bot-emoji" aria-hidden>🤖</div>
      <div className="rtl" style={{ textAlign: "center", marginTop: 6 }}>
        <div className="badge">{badge}</div>
        <div style={{ fontSize: 18, marginTop: 6 }}>
          {phrase ?? "مرحبًا! جاهزين؟"}
        </div>
        <div className="mini">Cartoon placeholder (no Lottie)</div>
      </div>
    </div>
  );
}
