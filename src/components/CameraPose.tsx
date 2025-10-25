import React, { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";

export default function CameraPose() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cam: Camera | null = null;
    let disposed = false;

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
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
      const video = videoRef.current!;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      // mirror video
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      if (res.poseLandmarks && res.poseLandmarks.length) {
        const lm = res.poseLandmarks;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#76ff94";
        for (const [a, b] of POSE_CONNECTIONS as Array<[number, number]>) {
          const p1 = lm[a], p2 = lm[b];
          if (!p1 || !p2) continue;
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          ctx.stroke();
        }
        ctx.fillStyle = "#4ad6ff";
        for (const p of lm) {
          ctx.beginPath();
          ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    async function init() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      cam = new Camera(videoRef.current, {
        onFrame: async () => { if (!disposed) await pose.send({ image: videoRef.current! }); },
        width: 1280,
        height: 720,
      });
      cam.start();
      setReady(true);
    }

    init();
    return () => {
      disposed = true;
      cam?.stop();
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks();
      tracks?.forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="panel videoWrap">
      <video className="video" ref={videoRef} playsInline muted />
      <canvas className="canvas" ref={canvasRef} />
      {!ready && (
        <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center", background:"rgba(0,0,0,.4)"}}>
          Loading camera + pose…
        </div>
      )}
    </div>
  );
}
