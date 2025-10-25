import React, { useEffect, useRef, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";

export default function CameraPose() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cam: Camera | null = null;
    let disposed = false;

    async function start() {
      try {
        setStatus("idle");
        setMessage("Requesting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });
        const video = videoRef.current!;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        await video.play();

        // ✅ dynamically import Pose from CDN
        const mp = await import(
          /* @vite-ignore */
          "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"
        );
        const pose = new mp.Pose({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        pose.onResults((res: any) => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext("2d")!;
          const w = video.videoWidth || 1280;
          const h = video.videoHeight || 720;
          canvas.width = w;
          canvas.height = h;
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -w, 0, w, h);
          ctx.restore();
          if (res.poseLandmarks?.length) {
            ctx.fillStyle = "#4ad6ff";
            for (const p of res.poseLandmarks) {
              ctx.beginPath();
              ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        cam = new Camera(video, {
          onFrame: async () => {
            if (!disposed) await pose.send({ image: video });
          },
          width: 1280,
          height: 720,
        });
        cam.start();

        setStatus("ok");
        setMessage("");
      } catch (err: any) {
        console.error("CameraPose error:", err);
        setStatus("error");
        setMessage(err?.message || String(err));
      }
    }

    start();

    return () => {
      disposed = true;
      cam?.stop();
      (videoRef.current?.srcObject as MediaStream | null)?.getTracks()?.forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 900 }}>
      <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block" }} />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
      {status !== "ok" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,.45)",
            color: "#fff",
            textAlign: "center",
            padding: 16,
            fontFamily: "system-ui, Arial",
          }}
        >
          <div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              {status === "idle" ? "Preparing camera…" : "Camera error"}
            </div>
            {!!message && <div style={{ fontSize: 14, opacity: 0.9 }}>{message}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
