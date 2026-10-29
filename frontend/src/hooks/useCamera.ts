import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraState } from "@/components/CameraView";

/** Owns the webcam MediaStream lifecycle and exposes a frame grabber. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
    setErrorMessage(null);
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setErrorMessage("This browser does not support camera access.");
      return;
    }
    setState("requesting");
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("active");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setState("denied");
        setErrorMessage(
          "Camera access was blocked. Allow the camera for this site in your browser settings, then try again.",
        );
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setState("error");
        setErrorMessage("No camera was found on this device.");
      } else {
        setState("error");
        setErrorMessage("The camera could not be started. Close other apps using it and retry.");
      }
    }
  }, []);

  /** Returns the current frame as a JPEG data URL, or null when inactive. */
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = (canvasRef.current ??= document.createElement("canvas"));
    canvas.width = 320;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 320) || 240;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.6);
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, state, errorMessage, start, stop, captureFrame };
}
