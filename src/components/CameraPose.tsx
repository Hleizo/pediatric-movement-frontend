import React, { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";

export default function CameraPose() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle"|"ok"|"error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cam: Camera | null = null;
    let disposed = false;

    async function start() {
      try {
        if (!window.isSecureContext) {
          throw new Error("This page must be served over HTTPS to access the camera.");
        }

        // 1) Ask for camera
        setStatus("idle"); setMessage("Requesting camera…");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });

        const video = videoRef.current!;
        video.srcObject = stream;
        // iOS/Safari/Chrome mobile quirks
        video.setAttribute("playsinline", "true");
        video.muted = true; // allow autoplay
        await video.play().catch(() => {/* swallow; will play after metadata */});

        // Wait until we know video size
        if (video.readyState < 2) {
          await new Promise<void>((res) => {
            const onLoaded = () => { video.removeEventListener("loadedmetadata", onLoaded); res(); };
            video.addEventListener("loadedmetadata", onLoaded);
          });
        }

        // 2) Init MediaPipe Pose
        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        pose.onResults((res: Results) => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext("2d")!;
          const w = (video.videoWidth || 1280);
          const h = (video.videoHeight || 720);
          canvas.width = w; canvas.height = h;

          // mirror frame
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -w, 0, w, h);
          ctx.restore();

          if (res.poseLandmarks?.length) {
            const lm = res.poseLandmarks;
            ctx.lineWidth = 3; ctx.strokeStyle = "#76ff94";
            for (const [a, b] of POSE_CONNECTIONS as Array<[number, number]>) {
              const p1 = lm[a], p2 = lm[b]; if (!p1 || !p2) continue;
              ctx.beginPath();
              ctx.moveTo(p1.x * w, p1.y * h);
              ctx.lineTo(p2.x * w, p2.y * h);
              ctx.stroke();
            }
            ctx.fillStyle = "#4ad6ff";
            for (const p of lm) {
              ctx.beginPath();
              ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        // 3) Start the MediaPipe camera helper
        cam = new Camera(video, {
          onFrame: async () => {
            if (!disposed) {
              try { await pose.send({ image: video }); }
              catch (err:any) { console.error(err); }
            }
          },
          width: video.videoWidth || 1280,
          height: video.videoHeight || 720,
        });

        cam.start();
        setStatus("ok"); setMessage("");
      } catch (err: any) {
        console.error("[CameraPose] error", err);
        setStatus("error");
        setMessage(err?.message || String(err));
      }
    }

    start();

    return () => {
      disposed = true;
      try { cam?.stop(); } catch {}
      // stop tracks
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks();
      tracks?.forEach(t => { try { t.stop(); } catch {} });
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 900 }}>
      <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block" }} />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
      {status !== "ok" && (
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          background: "rgba(0,0,0,.45)", color: "#fff", textAlign: "center",
          padding: 16, fontFamily: "system-ui, Arial"
        }}>
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
