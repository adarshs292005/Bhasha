import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

interface HandednessResult {
  categoryName?: string;
}

interface DetectionResult {
  landmarks: LandmarkPoint[][];
  handednesses: HandednessResult[][];
}

export interface HandTrackingState {
  features: number[] | null;
  wordFeatures: number[] | null;
  handDetected: boolean;
  handCount: number;
  ready: boolean;
  error: string | null;
}

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const FEATURES_PER_HAND = 63;
const TOTAL_FEATURES = 126;

/* ---------------------------------------------
   Existing character-model distance function
--------------------------------------------- */

function getDistance(
  a: LandmarkPoint,
  b: LandmarkPoint,
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/* ---------------------------------------------
   Existing character-model normalization

   IMPORTANT:
   Keep this unchanged so character recognition
   continues using its existing feature format.
--------------------------------------------- */

function normalizeHand(
  landmarks: LandmarkPoint[],
): number[] {
  if (landmarks.length < 21) {
    return new Array(FEATURES_PER_HAND).fill(0);
  }

  const wrist = landmarks[0];
  const reference = landmarks[9];

  if (!wrist || !reference) {
    return new Array(FEATURES_PER_HAND).fill(0);
  }

  const referenceDistance = getDistance(wrist, reference);

  const scale =
    referenceDistance > 0.0001
      ? referenceDistance
      : 1;

  const features: number[] = [];

  for (let i = 0; i < 21; i++) {
    const landmark = landmarks[i];

    if (!landmark) {
      features.push(0, 0, 0);
      continue;
    }

    features.push(
      (landmark.x - wrist.x) / scale,
      (landmark.y - wrist.y) / scale,
      (landmark.z - wrist.z) / scale,
    );
  }

  return features;
}

/* ---------------------------------------------
   Word-model normalization

   Matches the Python training pipeline:
   1. Subtract wrist coordinates.
   2. Find maximum XY-plane distance from wrist.
   3. Divide all XYZ coordinates by that scale.
   4. Flatten to 63 features.
--------------------------------------------- */

function normalizeHandForWords(
  landmarks: LandmarkPoint[],
): number[] {
  if (landmarks.length < 21) {
    return new Array(FEATURES_PER_HAND).fill(0);
  }

  const wrist = landmarks[0];

  if (!wrist) {
    return new Array(FEATURES_PER_HAND).fill(0);
  }

  const relativePoints = landmarks
    .slice(0, 21)
    .map((landmark) => ({
      x: landmark.x - wrist.x,
      y: landmark.y - wrist.y,
      z: landmark.z - wrist.z,
    }));

  let scale = 0;

  for (const point of relativePoints) {
    const xyDistance = Math.sqrt(
      point.x * point.x + point.y * point.y,
    );

    scale = Math.max(scale, xyDistance);
  }

  if (scale > 1e-8) {
    return relativePoints.flatMap((point) => [
      point.x / scale,
      point.y / scale,
      point.z / scale,
    ]);
  }

  return relativePoints.flatMap(() => [0, 0, 0]);
}

/* ---------------------------------------------
   Build features for both models

   Character features use existing normalization.
   Word features use training-compatible normalization.

   Both use:
   [Left hand: 63 features]
   [Right hand: 63 features]
--------------------------------------------- */

function buildFeatures(
  result: DetectionResult,
): {
  features: number[];
  wordFeatures: number[];
  handCount: number;
} {
  const leftFeatures = new Array(FEATURES_PER_HAND).fill(0);
  const rightFeatures = new Array(FEATURES_PER_HAND).fill(0);

  const leftWordFeatures = new Array(FEATURES_PER_HAND).fill(0);
  const rightWordFeatures = new Array(FEATURES_PER_HAND).fill(0);

  const landmarks = result.landmarks ?? [];
  const handednesses = result.handednesses ?? [];

  let leftDetected = false;
  let rightDetected = false;

  for (let i = 0; i < landmarks.length; i++) {
    const handLandmarks = landmarks[i];

    if (!handLandmarks || handLandmarks.length < 21) {
      continue;
    }

    const handedness = handednesses[i]?.[0];
    const categoryName = handedness?.categoryName?.toLowerCase();

    let targetCharacter: number[] | null = null;
    let targetWord: number[] | null = null;

    if (categoryName === "left" && !leftDetected) {
      targetCharacter = leftFeatures;
      targetWord = leftWordFeatures;
      leftDetected = true;
    } else if (categoryName === "right" && !rightDetected) {
      targetCharacter = rightFeatures;
      targetWord = rightWordFeatures;
      rightDetected = true;
    } else if (!categoryName) {
      // Preserve the existing fallback when handedness is unavailable.
      if (!leftDetected) {
        targetCharacter = leftFeatures;
        targetWord = leftWordFeatures;
        leftDetected = true;
      } else if (!rightDetected) {
        targetCharacter = rightFeatures;
        targetWord = rightWordFeatures;
        rightDetected = true;
      }
    }

    if (targetCharacter && targetWord) {
      const characterVector = normalizeHand(handLandmarks);
      const wordVector = normalizeHandForWords(handLandmarks);

      for (let j = 0; j < FEATURES_PER_HAND; j++) {
        targetCharacter[j] = characterVector[j] ?? 0;
        targetWord[j] = wordVector[j] ?? 0;
      }
    }
  }

  const handCount =
    Number(leftDetected) + Number(rightDetected);

  const features = [
    ...leftFeatures,
    ...rightFeatures,
  ];

  const wordFeatures = [
    ...leftWordFeatures,
    ...rightWordFeatures,
  ];

  return {
    features,
    wordFeatures,
    handCount,
  };
}

/* ---------------------------------------------
   Hook
--------------------------------------------- */

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
): HandTrackingState {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const runningRef = useRef<boolean>(false);

  const [state, setState] = useState<HandTrackingState>({
    features: null,
    wordFeatures: null,
    handDetected: false,
    handCount: 0,
    ready: false,
    error: null,
  });

  /* -------------------------------------------
     Initialize MediaPipe
  ------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setState({
          features: null,
          wordFeatures: null,
          handDetected: false,
          handCount: 0,
          ready: false,
          error: null,
        });

        const vision = await FilesetResolver.forVisionTasks(
          WASM_URL,
        );

        if (cancelled) {
          return;
        }

        const handLandmarker =
          await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

        if (cancelled) {
          handLandmarker.close();
          return;
        }

        handLandmarkerRef.current = handLandmarker;

        setState((previous) => ({
          ...previous,
          ready: true,
          error: null,
        }));

        console.log("MediaPipe HandLandmarker ready");
      } catch (error) {
        console.error("MediaPipe initialization error:", error);

        if (!cancelled) {
          setState({
            features: null,
            wordFeatures: null,
            handDetected: false,
            handCount: 0,
            ready: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to initialize MediaPipe.",
          });
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
      runningRef.current = false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, []);

  /* -------------------------------------------
     Run detection
  ------------------------------------------- */

  useEffect(() => {
    if (!state.ready) {
      return;
    }

    const video = videoRef.current;

    if (!video) {
      console.error(
        "Hand tracking: video element not available.",
      );
      return;
    }

    runningRef.current = true;

    const detect = () => {
      if (!runningRef.current) {
        return;
      }

      const currentVideo = videoRef.current;
      const landmarker = handLandmarkerRef.current;

      if (!currentVideo || !landmarker) {
        animationFrameRef.current =
          requestAnimationFrame(detect);
        return;
      }

      if (
        currentVideo.readyState <
        HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        animationFrameRef.current =
          requestAnimationFrame(detect);
        return;
      }

      const currentTime = currentVideo.currentTime;

      if (currentTime === lastVideoTimeRef.current) {
        animationFrameRef.current =
          requestAnimationFrame(detect);
        return;
      }

      lastVideoTimeRef.current = currentTime;

      try {
        const result = landmarker.detectForVideo(
          currentVideo,
          performance.now(),
        );

        const detectionResult =
          result as unknown as DetectionResult;

        const {
          features,
          wordFeatures,
          handCount,
        } = buildFeatures(detectionResult);

        const handDetected = handCount > 0;

        setState((previous) => ({
          ...previous,
          features: handDetected ? features : null,
          wordFeatures: handDetected ? wordFeatures : null,
          handDetected,
          handCount,
          error: null,
        }));
      } catch (error) {
        console.error("MediaPipe detection error:", error);

        setState((previous) => ({
          ...previous,
          features: null,
          wordFeatures: null,
          handDetected: false,
          handCount: 0,
          error:
            error instanceof Error
              ? error.message
              : "Hand detection failed.",
        }));
      }

      animationFrameRef.current =
        requestAnimationFrame(detect);
    };

    detect();

    return () => {
      runningRef.current = false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state.ready, videoRef]);

  return state;
}