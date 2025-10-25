import React, { useEffect, useRef, useState } from "react";
import { setLastPose, setRunning } from "../store";

/** Load a UMD <script> once (CDN MediaPipe Pose) */
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
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fps, setFps] = useState<number | null>(null);

  // Stable panel size (16:9) – updated only on container width changes
  const sizeRef = useRef({ w: 0, h: 0 });
  useEffect(() => {
    const el = panelRef.current!;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      const h = Math.round((w * 9) / 16); // 16:9 aspect
      sizeRef.current = { w, h };
      el.style.height = `${h}px`; // <— fixed CSS height so layout is stable
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

        // 2) MediaPipe Pose via CDN (UMD globals)
        const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
        await loadScript(`${CDN}/pose.js`);

        const PoseCtor = (window as any).Pose as any;
        const CONNECTIONS = (window as any).POSE_CONNECTIONS as Array<[number, number]>;
        if (!PoseCtor || !CONNECTIONS) throw new Error("MediaPipe Pose global not found.");

        const pose = new PoseCtor({ locateFile: (f: string) => `${CDN}/${f}` });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        function resizeCanvasToPanel() {
          const { w, h } = sizeRef.current;
          // CSS size: fixed (does not affect layout)
          canvas.style.width = w + "px";
          canvas.style.height = h + "px";
          // Internal resolution: device pixel ratio for sharpness
          const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // clamp 1–2
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
        }

        pose.onResults((res: any) => {
          // ensure canvas matches current panel size (cheap)
          resizeCanvasToPanel();

          // share landmarks
          setLastPose(res.poseLandmarks ?? null);

          // FPS
          frameCount++;
          const now = performance.now();
          if (now - lastTs >= 1000) {
            setFps(frameCount);
            frameCount = 0;
            lastTs = now;
          }

          const { w, h } = sizeRef.current;

          // draw mirrored video scaled to panel
          ctx.save();
          ctx.clearRect(0, 0, w, h);
          ctx.scale(-1, 1);
          ctx.drawImage(video, -w, 0, w, h);
          ctx.restore();

          // draw skeleton
          if (res.poseLandmarks?.length) {
            const lm = res.poseLandmarks;
            ctx.lineWidth = 4; ctx.strokeStyle = "#2ce67e";
            for (const [a, b] of CONNECTIONS) {
              const p1 = lm[a], p2 = lm[b]; if (!p1 || !p2) continue;
              ctx.beginPath();
              ctx.moveTo(p1.x * w, p1.y * h);
              ctx.lineTo(p2.x * w, p2.y * h);
              ctx.stroke();
            }
            ctx.fillStyle = "#2ec9ff";
            for (const p of lm) {
              ctx.beginPath();
              ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        // 3) Loop – no layout reads here
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
    <div ref={panelRef} className="panel" style={{ position: "relative" }}>
      {/* Absolutely positioned media – cannot change layout height */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />

      {status === "ok" && (
        <div className="badge">Model ready {fps !== null ? `• ~${fps} fps` : ""}</div>
      )}
      {status !== "ok" && (
        <div className="overlay">
          <div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              {status === "idle" ? "Preparing camera…" : "Camera error"}
            </div>
            {!!message && <div style={{ fontSize: 14, opacity: .9 }}>{message}</div>}
            <div style={{ fontSize: 13, opacity: .8, marginTop: 8 }}>
              If permission is blocked, click the 🔒 in the address bar → allow camera, then refresh.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
