import { useCallback, useRef, useState } from "react";
import type { Prediction } from "@/services/mlApi";

/**
 * Debounce / stabilisation layer between the raw model output stream and the
 * sentence builder.
 *
 * The backend may emit a prediction for every video frame. This hook only
 * commits a sign once the SAME label has been observed for `stableFrames`
 * consecutive frames above `minConfidence`, and never commits the same label
 * twice until a different label (or a gap of `cooldownMs`) occurs.
 */
export interface StabilizerOptions {
  /** Consecutive matching frames required before committing. */
  stableFrames?: number;
  /** Minimum confidence (0..1) for a frame to count. */
  minConfidence?: number;
  /** Time that must pass before the same label can be committed again. */
  cooldownMs?: number;
}

export interface StabilizerState {
  /** The most recent raw prediction received. */
  current: Prediction | null;
  /** Progress towards a stable prediction, 0..1. */
  stability: number;
  /** True once the current candidate has been committed. */
  locked: boolean;
}

export function usePredictionStabilizer(
  onCommit: (prediction: Prediction) => void,
  options: StabilizerOptions = {},
) {
  const { stableFrames = 6, minConfidence = 0.7, cooldownMs = 1200 } = options;

  const streakLabel = useRef<string | null>(null);
  const streakCount = useRef(0);
  const lastCommitted = useRef<{ label: string; at: number } | null>(null);
  const [state, setState] = useState<StabilizerState>({
    current: null,
    stability: 0,
    locked: false,
  });

  const reset = useCallback(() => {
    streakLabel.current = null;
    streakCount.current = 0;
    lastCommitted.current = null;
    setState({ current: null, stability: 0, locked: false });
  }, []);

  const push = useCallback(
    (prediction: Prediction | null) => {
      if (!prediction || prediction.confidence < minConfidence) {
        streakLabel.current = null;
        streakCount.current = 0;
        setState({ current: prediction, stability: 0, locked: false });
        return;
      }

      if (streakLabel.current === prediction.label) {
        streakCount.current += 1;
      } else {
        streakLabel.current = prediction.label;
        streakCount.current = 1;
      }

      const stability = Math.min(streakCount.current / stableFrames, 1);
      let locked = false;

      if (streakCount.current >= stableFrames) {
        const previous = lastCommitted.current;
        const now = Date.now();
        const isRepeat =
          previous?.label === prediction.label && now - previous.at < cooldownMs;
        if (!isRepeat) {
          lastCommitted.current = { label: prediction.label, at: now };
          onCommit(prediction);
        }
        locked = true;
        streakCount.current = 0;
        streakLabel.current = null;
      }

      setState({ current: prediction, stability, locked });
    },
    [cooldownMs, minConfidence, onCommit, stableFrames],
  );

  return { push, reset, ...state, stableFrames, minConfidence };
}
