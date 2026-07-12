import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { createHandTracker } from "../ai/handTracker";
import useHandTracking from "../hooks/useHandTracking";
import { recognizeGesture } from "../utils/gestureRecognition";

function Translator() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const { isLoading } = useHandTracking();
  console.log("isLoading=", isLoading);
  const [gesture, setGesture] = useState("Waiting...");

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
       const detectedGesture = recognizeGesture(results.landmarks[0]);
       setGesture(detectedGesture);

       console.log(detectedGesture);
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
      {isLoading && (
       <p className="text-green-400 mb-4">
         Initializing AI...
       </p>
      )}
      <div className="relative">

        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          className="rounded-xl border-4 border-indigo-500"
        />
        <div className="mt-8 text-center">

         <h2 className="text-3xl font-bold text-indigo-400">
          {gesture}
          
         </h2>

        </div>

        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
        />

      </div>

    </div>
  );
}

export default Translator;