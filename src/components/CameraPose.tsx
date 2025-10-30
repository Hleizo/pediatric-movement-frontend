import React, { useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import type { PoseForApp, Landmark } from "../metrics";

type Props = {
  onPose?: (pose: PoseForApp) => void;
  onReady?: () => void;
  onError?: (msg: string) => void;
};

/** Stable Google-hosted model (don’t fetch .task from a CDN mirror) */
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

/** Use a modest working size for smoothness */
const DETECT_W = 480;
const DETECT_H = 360;

/** ~15–20 FPS is plenty for demo and keeps laptops cool */
const DETECT_INTERVAL_MS = 66;

export default function CameraPose({ onPose, onReady, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectRef = useRef<number>(0);

  const [status, setStatus] = useState("Starting camera…");
  const [needsUserStart, setNeedsUserStart] = useState(false);

  /** Cleanly stop everything */
  function stopAll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
    streamRef.current = null;
    onPose?.(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: DETECT_W, height: DETECT_H },
          audio: false,
        });
        if (cancelled) return;

        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;

        // Wait for metadata so width/height are known
        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) resolve();
          else video.onloadedmetadata = () => resolve();
        });

        // Try autoplay; if blocked, show Start button
        try {
          await video.play();
          setNeedsUserStart(false);
        } catch {
          setNeedsUserStart(true);
        }

        setStatus("Camera running ✓");
      } catch (e: any) {
        const msg = typeof e?.message === "string" ? e.message : String(e);
        setStatus(`Error: ${msg}`);
        onError?.(msg);
      }
    }

    async function loadModel() {
      try {
        setStatus((s) => s + " • loading pose model…");
        const files = await FilesetResolver.forVisionTasks(WASM_BASE);
        landmarkerRef.current = await PoseLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) setStatus("Camera + pose running ✓");
        onReady?.();
      } catch (e: any) {
        const msg = typeof e?.message === "string" ? e.message : String(e);
        setStatus(`Error: ${msg}`);
        onError?.(msg);
      }
    }

    function ensureCanvasSize() {
      const c = canvasRef.current;
      if (!c) return;
      c.width = DETECT_W;
      c.height = DETECT_H;
    }

    function loop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !canvas || !landmarker) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // If camera not actually playing, just keep waiting
      if (video.paused || video.ended || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      if (now - lastDetectRef.current >= DETECT_INTERVAL_MS) {
        lastDetectRef.current = now;

        const result = landmarker.detectForVideo(video, now);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw the live camera frame at the SAME size we detect → no warp
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (result?.landmarks?.length) {
            const utils = new DrawingUtils(ctx);
            result.landmarks.forEach((lm) => {
              utils.drawLandmarks(lm, { radius: 3, color: "#33E6FF" });
              utils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
                color: "#29c76f",
                lineWidth: 3,
              });
            });
          }
          ctx.restore();
        }

        const first: PoseForApp =
          result?.landmarks?.[0] ? { landmarks: result.landmarks[0] as Landmark[] } : null;
        onPose?.(first);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    // Start
    ensureCanvasSize();
    startCamera().then(loadModel);
    rafRef.current = requestAnimationFrame(loop);

    // Pause loop when tab hidden; resume when visible
    function onVis() {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      stopAll();
    };
  }, [onPose, onReady, onError]);

  async function handleUserStart() {
    try {
      await videoRef.current?.play();
      setNeedsUserStart(false);
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : String(e);
      setStatus(`Error: ${msg}`);
      onError?.(msg);
    }
  }

  return (
    <div style={{ position: "relative", width: 540, maxWidth: "100%" }}>
      <video ref={videoRef} muted playsInline style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: 12,
          boxShadow: "0 6px 24px rgba(0,0,0,.15)",
          background: "#000",
        }}
      />
      {/* Status pill */}
      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 8,
          background: "rgba(0,0,0,.55)",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        {status}
      </div>
      {/* Autoplay fallback button (only shows when needed) */}
      {needsUserStart && (
        <button
          onClick={handleUserStart}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            boxShadow: "0 10px 24px rgba(0,0,0,.2)",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Start camera
        </button>
      )}
    </div>
  );
}
