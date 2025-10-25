// src/components/CameraPose.tsx
import React, { useEffect, useRef, useState } from "react";
import { setLastPose, setRunning } from "../store";

/** load a UMD <script> only once (for CDN MediaPipe Pose) */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

export default function CameraPose() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    let stopped = false;
    let raf = 0;
    let lastTs = performance.now();
    let frameCount = 0;

    async function start() {
      try {
        if (!window.isSecureContext) {
          throw new Error("This page must be served over HTTPS to access the camera.");
        }

        setStatus("idle");
        setMessage("Requesting camera…");

        // 1) Camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
        const video = videoRef.current!;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        await video.play();
        if (video.readyState < 2) {
          await new Promise<void>((res) => {
            const onMeta = () => { video.removeEventListener("loadedmetadata", onMeta); res(); };
            video.addEventListener("loadedmetadata", onMeta);
          });
        }

        // 2) Load MediaPipe Pose UMD and use globals
        const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
        await loadScript(`${CDN}/pose.js`);

        const PoseCtor = (window as any).Pose as any;
        const CONNECTIONS = (window as any).POSE_CONNECTIONS as Array<[number, number]>;
        if (!PoseCtor || !CONNECTIONS) throw new Error("MediaPipe Pose global not found.");

        const pose = new PoseCtor({
          locateFile: (file: string) => `${CDN}/${file}`,
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        pose.onResults((res: any) => {
          // share landmarks via store
          setLastPose(res.poseLandmarks ?? null);

          // simple FPS calc
          frameCount++;
          const now = performance.now();
          if (now - lastTs >= 1000) {
            setFps(frameCount);
            frameCount = 0;
            lastTs = now;
          }

          const w = video.videoWidth || 1280;
          const h = video.videoHeight || 720;
          canvas.width = w; canvas.height = h;

          // draw mirrored video
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -w, 0, w, h);
          ctx.restore();

          // draw skeleton if available
          if (res.poseLandmarks?.length) {
            const lm = res.poseLandmarks;

            // connections
            ctx.lineWidth = 3; ctx.strokeStyle = "#76ff94";
            for (const [a, b] of CONNECTIONS) {
              const p1 = lm[a], p2 = lm[b]; if (!p1 || !p2) continue;
              ctx.beginPath();
              ctx.moveTo(p1.x * w, p1.y * h);
              ctx.lineTo(p2.x * w, p2.y * h);
              ctx.stroke();
            }
            // keypoints
            ctx.fillStyle = "#4ad6ff";
            for (const p of lm) {
              ctx.beginPath();
              ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        // 3) Simple loop (no camera_utils)
        const tick = async () => {
          if (stopped) return;
          try { await pose.send({ image: video }); } catch {}
          raf = requestAnimationFrame(tick);
        };

        setRunning(true);
        setStatus("ok");
        setMessage("");
        tick();
      } catch (err: any) {
        console.error("[CameraPose] error", err);
        setRunning(false);
        setStatus("error");
        setMessage(err?.message || String(err));
      }
    }

    start();

    return () => {
      stopped = true;
      setRunning(false);
      cancelAnimationFrame(raf);
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks();
      tracks?.forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 900 }}>
      <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block" }} />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

      {/* Status badge */}
      {status === "ok" && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(0,0,0,.55)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 8,
            fontFamily: "system-ui, Arial",
            fontSize: 13,
          }}
        >
          Model ready {fps !== null ? `• ~${fps} fps` : ""}
        </div>
      )}

      {/* Loading / Error overlay */}
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
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
              If permission is blocked, click the 🔒 in the address bar → allow camera, then refresh.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
