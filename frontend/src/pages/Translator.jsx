import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { createHandTracker } from "../ai/handTracker";
import useHandTracking from "../hooks/useHandTracking";
import { recognizeGesture } from "../utils/gestureRecognition";
import { extractFeatures } from "../ai/featureExtractor";
import { uploadSample } from "../services/uploadSample";
import islChart from "../assets/isl-chart.png";

function Translator() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const { isLoading } = useHandTracking();

  const [gesture, setGesture] = useState("Waiting...");
  const [currentFeatures, setCurrentFeatures] = useState([]);
  const [selectedGesture, setSelectedGesture] = useState("A");
  const [participant, setParticipant] = useState("");

  const [sampleCount, setSampleCount] = useState(0);
  const [isChartOpen, setIsChartOpen] = useState(false);

  useEffect(() => {
    let handTracker;
    let animationFrameId;

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
        animationFrameId = requestAnimationFrame(detectHands);
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

      if (results.landmarks.length > 0) {
        const detectedGesture = recognizeGesture(
          results.landmarks[0]
        );

        const features = extractFeatures(
          results.landmarks[0]
        );

        setCurrentFeatures(features);
        setGesture(detectedGesture);

        console.log("Feature Vector Length:", features.length);
        console.log("Detected Gesture:", detectedGesture);
      }

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      animationFrameId = requestAnimationFrame(detectHands);
    }

    initializeAI();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const handleAddSample = async () => {
    if (!participant.trim()) {
      return;
    }

    if (currentFeatures.length !== 63) {
      return;
    }

    const success = await uploadSample(
      selectedGesture,
      currentFeatures,
      participant
    );

    if (success) {
      setSampleCount((count) => count + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-10">

      <h1 className="text-4xl font-bold mb-8 text-center">
        Bhasha Dataset Collector
      </h1>

      {/* ISL REFERENCE */}

      <div className="mb-6 flex flex-col items-center text-center">

        <h2 className="text-2xl font-semibold mb-4">
          ISL Fingerspelling Reference
        </h2>

        <button
          onClick={() => setIsChartOpen(true)}
          className="cursor-pointer hover:opacity-80 transition"
        >
          <img
            src={islChart}
            alt="Indian Sign Language fingerspelling reference"
            className="w-64 max-h-40 object-contain rounded-lg border-2 border-indigo-500"
          />
        </button>

        <p className="text-gray-400 text-sm mt-2">
          Click chart to enlarge
        </p>

      </div>

      {/* FULL SCREEN CHART */}

      {isChartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setIsChartOpen(false)}
        >
          <button
            onClick={() => setIsChartOpen(false)}
            className="absolute top-5 right-6 text-white text-4xl hover:text-gray-300"
          >
            ×
          </button>

          <img
            src={islChart}
            alt="Indian Sign Language reference"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* AI STATUS */}

      {isLoading && (
        <p className="text-green-400 mb-4">
          Initializing AI...
        </p>
      )}

      {/* PARTICIPANT */}

      <input
        type="text"
        placeholder="Participant Name"
        value={participant}
        onChange={(e) => {
          setParticipant(e.target.value);
          setSampleCount(0);
        }}
        className="bg-gray-800 text-white p-2 rounded border border-gray-600 mb-4 w-64"
      />

      {/* GESTURE SELECT */}

      <div className="mb-4">

        <label className="mr-2 font-semibold">
          Gesture:
        </label>

        <select
          value={selectedGesture}
          onChange={(e) =>
            setSelectedGesture(e.target.value)
          }
          className="bg-gray-800 text-white p-2 rounded border border-gray-600"
        >
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(
            (letter) => (
              <option
                key={letter}
                value={letter}
              >
                {letter}
              </option>
            )
          )}

          <option value="HELLO">
            HELLO
          </option>

          <option value="THANK_YOU">
            THANK YOU
          </option>

          <option value="YES">
            YES
          </option>

          <option value="NO">
            NO
          </option>
        </select>

      </div>

      {/* CAMERA */}

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

      {/* DETECTED GESTURE */}

      <div className="mt-6 text-center">

        <p className="text-gray-400">
          Detected Gesture
        </p>

        <h2 className="text-3xl font-bold text-indigo-400">
          {gesture}
        </h2>

      </div>

      {/* ADD SAMPLE */}

      <button
        onClick={handleAddSample}
        className="mt-6 bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-lg font-semibold transition"
      >
        + Add Sample
      </button>

      {/* TALLY */}

      <div className="mt-5 text-center">

        <p className="text-gray-400">
          Your samples
        </p>

        <p className="text-4xl font-bold text-indigo-400">
          {sampleCount}
        </p>

      </div>

    </div>
  );
}

export default Translator;