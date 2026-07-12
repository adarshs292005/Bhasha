import { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { createHandTracker } from "../ai/handTracker";


function Translator() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let handTracker;

    async function initializeAI() {
      console.log("Loading AI...");

      handTracker = await createHandTracker();

      console.log("AI Loaded Successfully!");

      detectHands();
    }

    async function detectHands() {
      if (
        !webcamRef.current ||
        !webcamRef.current.video ||
        webcamRef.current.video.readyState !== 4
      ) {
        requestAnimationFrame(detectHands);
        return;
      }

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const results = handTracker.detectForVideo(
        video,
        performance.now()
      );
      if (results.landmarks.length>0) {
        console.log("Hand detected!");
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      

      requestAnimationFrame(detectHands);
    }

    initializeAI();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-10">

      <h1 className="text-4xl font-bold mb-8">
        Bhasha AI Translator
      </h1>

      <div className="relative">

        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          className="rounded-xl border-4 border-indigo-500"
        />

        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
        />

      </div>

    </div>
  );
}

export default Translator;