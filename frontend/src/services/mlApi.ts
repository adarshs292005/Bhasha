export type ConnectionState =
  | "unknown"
  | "checking"
  | "online"
  | "offline";

export interface Prediction {
  label: string;
  confidence: number;
  timestamp: string;
  modelVersion: string | undefined;
}

export interface WordPrediction extends Prediction {
  accepted: boolean;
}

export interface ModelStatus {
  model: ConnectionState;
  api: ConnectionState;
  dataset: ConnectionState;
  modelVersion: string | undefined;
  message: string | undefined;
}

export interface FramePayload {
  features: number[];
  handCount: number;
}

interface BackendPrediction {
  label?: string;
  confidence?: number;
  accepted?: boolean;
  model_version?: string;
  backend_version?: string;
}

interface BackendHealth {
  status?: string;
  backend_version?: string;
  model_loaded?: boolean;
  word_model_loaded?: boolean;
  model_version?: string;
  features?: number;
  classes?: number;
  character_classes?: number;
  word_classes?: number;
}

interface BackendModelInfo {
  backend_version?: string;
  model_version?: string;
  model_type?: string;
  features?: number;
  classes?: number;
  class_names?: string[];
}

interface BackendWordModelInfo {
  model_type?: string;
  features?: number;
  classes?: number;
  class_names?: string[];
}

export class MlApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MlApiError";
  }
}

const BASE_URL = "http://127.0.0.1:8000";

export function isMlApiConfigured(): boolean {
  return true;
}

export function getMlApiBaseUrl(): string {
  return BASE_URL;
}

async function getRequest<T>(
  path: string,
  timeoutMs = 5000,
): Promise<T> {
  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new MlApiError(
        `Backend returned HTTP ${response.status}.`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof MlApiError) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new MlApiError("Backend request timed out.");
    }

    throw new MlApiError(
      "Could not connect to FastAPI backend.",
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

async function requestPrediction(
  endpoint: string,
  payload: FramePayload,
): Promise<BackendPrediction | null> {
  if (payload.features.length !== 126) {
    throw new MlApiError(
      `Expected 126 features, received ${payload.features.length}.`,
    );
  }

  if (payload.handCount !== 1 && payload.handCount !== 2) {
    throw new MlApiError(
      `Invalid hand count: ${payload.handCount}.`,
    );
  }

  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, 8000);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        features: payload.features,
        hand_count: payload.handCount,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new MlApiError(
        `Prediction failed with HTTP ${response.status}.`,
      );
    }

    return (await response.json()) as BackendPrediction;
  } catch (error) {
    if (error instanceof MlApiError) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new MlApiError("Prediction request timed out.");
    }

    throw new MlApiError(
      "Could not connect to FastAPI prediction endpoint.",
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function sendFrame(
  payload: FramePayload,
): Promise<Prediction | null> {
  const raw = await requestPrediction(
    "/api/v2/predict",
    payload,
  );

  if (
    !raw ||
    typeof raw.label !== "string" ||
    typeof raw.confidence !== "number"
  ) {
    return null;
  }

  return {
    label: raw.label.toUpperCase(),
    confidence:
      raw.confidence > 1
        ? raw.confidence / 100
        : raw.confidence,
    timestamp: new Date().toISOString(),
    modelVersion: raw.model_version,
  };
}

export async function sendWordFrame(
  payload: FramePayload,
): Promise<WordPrediction | null> {
  const raw = await requestPrediction(
    "/api/v2/predict-word",
    payload,
  );

  if (
    !raw ||
    typeof raw.label !== "string" ||
    typeof raw.confidence !== "number"
  ) {
    return null;
  }

  return {
    label: raw.label,
    confidence:
      raw.confidence > 1
        ? raw.confidence / 100
        : raw.confidence,
    accepted: raw.accepted === true,
    timestamp: new Date().toISOString(),
    modelVersion: raw.model_version,
  };
}

export async function checkModelStatus(): Promise<ModelStatus> {
  try {
    const health = await getRequest<BackendHealth>(
      "/api/v2/health",
    );

    const info = await getRequest<BackendModelInfo>(
      "/api/v2/model-info",
    );

    const classCount =
      health.character_classes ?? health.classes;

    const healthy =
      health.status === "healthy" &&
      health.model_loaded === true &&
      health.features === 126 &&
      classCount === 36 &&
      info.classes === 36;

    return {
      api: healthy ? "online" : "offline",
      model: healthy ? "online" : "offline",
      dataset: "unknown",
      modelVersion:
        health.model_version ?? info.model_version,
      message: healthy
        ? "Bhasha ML backend is connected."
        : "Backend responded, but model validation failed.",
    };
  } catch (error) {
    return {
      api: "offline",
      model: "offline",
      dataset: "offline",
      modelVersion: undefined,
      message:
        error instanceof Error
          ? error.message
          : "Could not connect to FastAPI.",
    };
  }
}

export async function checkWordModelStatus(): Promise<{
  online: boolean;
  classNames: string[];
  message: string;
}> {
  try {
    const health = await getRequest<BackendHealth>(
      "/api/v2/health",
    );

    const info = await getRequest<BackendWordModelInfo>(
      "/api/v2/word-model-info",
    );

    const online =
      health.status === "healthy" &&
      health.word_model_loaded === true &&
      info.features === 126 &&
      info.classes === 19 &&
      Array.isArray(info.class_names) &&
      info.class_names.length === 19;

    return {
      online,
      classNames: info.class_names ?? [],
      message: online
        ? "Bhasha word model is connected."
        : "Word model validation failed.",
    };
  } catch (error) {
    return {
      online: false,
      classNames: [],
      message:
        error instanceof Error
          ? error.message
          : "Could not connect to the word model.",
    };
  }
}

export async function getPrediction(): Promise<Prediction | null> {
  throw new MlApiError(
    "Use sendFrame() for Bhasha V2 prediction.",
  );
}