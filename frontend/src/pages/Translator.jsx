import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { createHandTracker } from "../ai/handTracker";
import useHandTracking from "../hooks/useHandTracking";
import { recognizeGesture } from "../utils/gestureRecognition";
import { extractFeatures} from "../ai/featureExtractor";
import { addSample } from "../ai/datasetCollector";
import { downloadDataset } from "../services/datasetService";
import { uploadSample } from "../services/uploadSample";

function Translator() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const { isLoading } = useHandTracking();
  console.log("isLoading=", isLoading);
  const [gesture, setGesture] = useState("Waiting...");
  const [currentFeatures, setCurrentFeatures] = useState([]);
  const [selectedGesture, setSelectedGesture] = useState("A");
  console.log(import.meta.env.VITE_SUPABASE_URL);

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
       const features = extractFeatures(results.landmarks[0]);
       setCurrentFeatures(features);
       if (gesture === "HELLO 👋") {
       addSample(features, "HELLO");
       }

       console.log(features);
       console.log("Feature Vector Length:", features.length);
       setGesture(detectedGesture);

       console.log(detectedGesture);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      

      requestAnimationFrame(detectHands);
    }

    initializeAI();
  }, []);
  useEffect(() => {
  const handleKeyDown = async(event) => {
    const key = event.key.toLowerCase();

    if (key === "h") {
     if (currentFeatures.length === 63) {
        addSample(currentFeatures, "HELLO");
       }
     }

     if (key === "d") {
       downloadDataset();
     }
   };

   window.addEventListener("keydown", handleKeyDown);

   return () => {
    window.removeEventListener("keydown", handleKeyDown);
   };
  }, [currentFeatures]);

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
      <div className="mb-4">
      <label className="mr-2 font-semibold">
        Gesture:
      </label>

      <select
        value={selectedGesture}
        onChange={(e) => setSelectedGesture(e.target.value)}
        className="bg-gray-800 text-white p-2 rounded border border-gray-600"
      >
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter => (
          <option key={letter} value={letter}>
            {letter}
          </option>
        ))}

        <option value="HELLO">HELLO</option>
        <option value="THANK_YOU">THANK YOU</option>
        <option value="YES">YES</option>
        <option value="NO">NO</option>
       </select>
      </div>

      <div className="relative">

        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          className="rounded-xl border-4 border-indigo-500"
        />
        <button
  onClick={async () => {
    if (currentFeatures.length !== 63) {
      alert("❌ Hand not detected");
      return;
    }

    await uploadSample(selectedGesture, currentFeatures);

    alert("✅ Sample Uploaded");
  }}
  className="mt-6 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg"
>
  Record Sample
</button>
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