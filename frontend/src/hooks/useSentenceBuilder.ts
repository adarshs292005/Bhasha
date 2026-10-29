import { useCallback, useState } from "react";
import type { Prediction } from "@/services/mlApi";

export interface SentenceToken {
  id: string;
  label: string;
  confidence: number;
  addedAt: string;
}

export interface SavedSentence {
  id: string;
  text: string;
  savedAt: string;
}

let counter = 0;
const nextId = () => `token-${Date.now()}-${counter++}`;

/**
 * Reusable sentence state. Receives a stream of stable predictions and builds
 * an ordered list of signs plus the readable sentence.
 */
export function useSentenceBuilder() {
  const [tokens, setTokens] = useState<SentenceToken[]>([]);
  const [saved, setSaved] = useState<SavedSentence[]>([]);

  const addPrediction = useCallback((prediction: Prediction) => {
    setTokens((current) => [
      ...current,
      {
        id: nextId(),
        label: prediction.label,
        confidence: prediction.confidence,
        addedAt: prediction.timestamp,
      },
    ]);
  }, []);

  const addManual = useCallback((label: string) => {
    const clean = label.trim().toUpperCase();
    if (!clean) return;
    setTokens((current) => [
      ...current,
      { id: nextId(), label: clean, confidence: 1, addedAt: new Date().toISOString() },
    ]);
  }, []);

  const undo = useCallback(() => setTokens((current) => current.slice(0, -1)), []);
  const clear = useCallback(() => setTokens([]), []);
  const removeToken = useCallback(
    (id: string) => setTokens((current) => current.filter((token) => token.id !== id)),
    [],
  );

  const sentence = tokens.map((token) => token.label).join(" ");

  const save = useCallback(() => {
    if (!sentence) return null;
    const entry: SavedSentence = {
      id: nextId(),
      text: sentence,
      savedAt: new Date().toISOString(),
    };
    setSaved((current) => [entry, ...current].slice(0, 20));
    return entry;
  }, [sentence]);

  const clearSaved = useCallback(() => setSaved([]), []);

  return {
    tokens,
    sentence,
    saved,
    addPrediction,
    addManual,
    undo,
    clear,
    removeToken,
    save,
    clearSaved,
  };
}
