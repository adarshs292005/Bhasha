import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const LANDMARKS_PER_HAND = 21;
const COORDINATES_PER_LANDMARK = 3;
const FEATURES_PER_HAND =
  LANDMARKS_PER_HAND * COORDINATES_PER_LANDMARK;

export const TOTAL_FEATURES = FEATURES_PER_HAND * 2;

type Landmark = {
  x: number;
  y: number;
  z: number;
};

type Handedness = "Left" | "Right";

type HandDetection = {
  landmarks: Landmark[];
  handedness: Handedness;
};

type DatasetHandTrackingState = {
  features: number[] | null;
  handCount: number;
  leftDetected: boolean;
  rightDetected: boolean;
  ready: boolean;
  error: string | null;
};

function normalizeHand(landmarks: Landmark[]): number[] {
  if (landmarks.length !== LANDMARKS_PER_HAND) {
    return new Array<number>(FEATURES_PER_HAND).fill(0);
  }

  const wrist = landmarks[0];
  const reference = landmarks[9];

  // TypeScript's strict array checking requires
  // explicit validation even after checking length.
  if (!wrist || !reference) {
    return new Array<number>(FEATURES_PER_HAND).fill(0);
  }

  const dx = reference.x - wrist.x;
  const dy = reference.y - wrist.y;
  const dz = reference.z - wrist.z;

  const scale = Math.sqrt(
    dx * dx +
      dy * dy +
      dz * dz,
  );

  const safeScale =
    scale > 0.000001 ? scale : 1;

  const normalized: number[] = [];

  for (const landmark of landmarks) {
    normalized.push(
      (landmark.x - wrist.x) / safeScale,
      (landmark.y - wrist.y) / safeScale,
      (landmark.z - wrist.z) / safeScale,
    );
  }

  return normalized;
}

function buildFeatureVector(
  detections: HandDetection[],
): {
  features: number[];
  handCount: number;
  leftDetected: boolean;
  rightDetected: boolean;
} {
  const leftFeatures = new Array<number>(
    FEATURES_PER_HAND,
  ).fill(0);

  const rightFeatures = new Array<number>(
    FEATURES_PER_HAND,
  ).fill(0);

  let leftDetected = false;
  let rightDetected = false;

  for (const detection of detections) {
    const normalized = normalizeHand(
      detection.landmarks,
    );

    if (detection.handedness === "Left") {
      for (
        let i = 0;
        i < FEATURES_PER_HAND;
        i += 1
      ) {
        const value = normalized[i];

        if (value !== undefined) {
          leftFeatures[i] = value;
        }
      }

      leftDetected = true;
    } else if (
      detection.handedness === "Right"
    ) {
      for (
        let i = 0;
        i < FEATURES_PER_HAND;
        i += 1
      ) {
        const value = normalized[i];

        if (value !== undefined) {
          rightFeatures[i] = value;
        }
      }

      rightDetected = true;
    }
  }

  return {
    features: [
      ...leftFeatures,
      ...rightFeatures,
    ],
    handCount: detections.length,
    leftDetected,
    rightDetected,
  };
}

export function useDatasetHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const handLandmarkerRef =
    useRef<HandLandmarker | null>(null);

  const animationFrameRef =
    useRef<number | null>(null);

  const lastVideoTimeRef =
    useRef<number>(-1);

  const [state, setState] =
    useState<DatasetHandTrackingState>({
      features: null,
      handCount: 0,
      leftDetected: false,
      rightDetected: false,
      ready: false,
      error: null,
    });

  const stopTracking = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(
        animationFrameRef.current,
      );

      animationFrameRef.current = null;
    }

    lastVideoTimeRef.current = -1;
  }, []);

  const detectFrame = useCallback(() => {
    const video = videoRef.current;
    const handLandmarker =
      handLandmarkerRef.current;

    if (!video || !handLandmarker) {
      return;
    }

    if (
      video.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      animationFrameRef.current =
        requestAnimationFrame(detectFrame);

      return;
    }

    if (
      video.currentTime !==
      lastVideoTimeRef.current
    ) {
      lastVideoTimeRef.current =
        video.currentTime;

      try {
        const result =
          handLandmarker.detectForVideo(
            video,
            performance.now(),
          );

        const detections: HandDetection[] = [];

        const landmarks =
          result.landmarks ?? [];

        const handedness =
          result.handedness ?? [];

        for (
          let index = 0;
          index < landmarks.length;
          index += 1
        ) {
          const currentLandmarks =
            landmarks[index];

          const currentHandedness =
            handedness[index];

          if (
            !currentLandmarks ||
            currentLandmarks.length !==
              LANDMARKS_PER_HAND
          ) {
            continue;
          }

          const category =
            currentHandedness?.[0];

          if (!category) {
            continue;
          }

          const categoryName =
            category.categoryName;

          if (
            categoryName !== "Left" &&
            categoryName !== "Right"
          ) {
            continue;
          }

          const typedLandmarks: Landmark[] =
            currentLandmarks.map(
              (landmark) => ({
                x: landmark.x,
                y: landmark.y,
                z: landmark.z,
              }),
            );

          detections.push({
            landmarks: typedLandmarks,
            handedness: categoryName,
          });
        }

        const featureData =
          buildFeatureVector(detections);

        setState({
          features: featureData.features,
          handCount:
            featureData.handCount,
          leftDetected:
            featureData.leftDetected,
          rightDetected:
            featureData.rightDetected,
          ready: true,
          error: null,
        });
      } catch (error) {
        console.error(
          "Dataset hand detection error:",
          error,
        );

        setState((previous) => ({
          ...previous,
          error:
            "Hand detection failed.",
        }));
      }
    }

    animationFrameRef.current =
      requestAnimationFrame(detectFrame);
  }, [videoRef]);

  const startTracking = useCallback(() => {
    if (!handLandmarkerRef.current) {
      setState((previous) => ({
        ...previous,
        error:
          "Hand tracking model is not ready.",
      }));

      return;
    }

    stopTracking();

    animationFrameRef.current =
      requestAnimationFrame(detectFrame);
  }, [detectFrame, stopTracking]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setState((previous) => ({
          ...previous,
          error: null,
        }));

        const vision =
          await FilesetResolver.forVisionTasks(
            WASM_URL,
          );

        if (cancelled) {
          return;
        }

        const handLandmarker =
          await HandLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath: MODEL_URL,
                delegate: "GPU",
              },
              runningMode: "VIDEO",
              numHands: 2,
              minHandDetectionConfidence: 0.5,
              minHandPresenceConfidence: 0.5,
              minTrackingConfidence: 0.5,
            },
          );

        if (cancelled) {
          handLandmarker.close();
          return;
        }

        handLandmarkerRef.current =
          handLandmarker;

        setState((previous) => ({
          ...previous,
          ready: true,
          error: null,
        }));
      } catch (error) {
        console.error(
          "Failed to initialize dataset hand tracking:",
          error,
        );

        if (!cancelled) {
          setState((previous) => ({
            ...previous,
            ready: false,
            error:
              "Failed to load MediaPipe hand tracking.",
          }));
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;

      stopTracking();

      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, [stopTracking]);

  useEffect(() => {
    if (
      state.ready &&
      videoRef.current
    ) {
      startTracking();
    }
  }, [
    state.ready,
    videoRef,
    startTracking,
  ]);

  return {
    features: state.features,
    handCount: state.handCount,
    leftDetected: state.leftDetected,
    rightDetected: state.rightDetected,
    ready: state.ready,
    error: state.error,
    startTracking,
    stopTracking,
  };
}