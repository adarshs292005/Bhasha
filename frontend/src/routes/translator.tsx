import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";

import { CameraView } from "@/components/CameraView";
import {
  PredictionCard,
  type PredictionStatus,
} from "@/components/PredictionCard";
import { SentenceBuilder } from "@/components/SentenceBuilder";
import { SystemStatus } from "@/components/SystemStatus";
import { ErrorMessage } from "@/components/ErrorMessage";

import { useCamera } from "@/hooks/useCamera";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useSentenceBuilder } from "@/hooks/useSentenceBuilder";
import { usePredictionStabilizer } from "@/hooks/usePredictionStabilizer";

import {
  checkModelStatus,
  checkWordModelStatus,
  isMlApiConfigured,
  sendFrame,
  sendWordFrame,
  type ModelStatus,
} from "@/services/mlApi";

export const Route = createFileRoute("/translator")({
  head: () => ({
    meta: [
      {
        title: "Translator — Bhasha ISL to text",
      },
      {
        name: "description",
        content:
          "Show Indian Sign Language signs to your camera and convert them to text.",
      },
      {
        property: "og:title",
        content: "Translator — Bhasha ISL to text",
      },
      {
        property: "og:description",
        content:
          "Show Indian Sign Language signs to your camera and convert them to text.",
      },
    ],
  }),

  component: Translator,
});

const FRAME_INTERVAL_MS = 250;

type RecognitionMode = "character" | "word";

type WordModelStatus = {
  online: boolean;
  classNames: string[];
  message: string;
};

function Translator() {
  const camera = useCamera();

  const handTracking = useHandTracking(
    camera.videoRef,
  );

  const sentence = useSentenceBuilder();

  const [recognitionMode, setRecognitionMode] =
    useState<RecognitionMode>("character");

  const [modelStatus, setModelStatus] =
    useState<ModelStatus | null>(null);

  const [wordModelStatus, setWordModelStatus] =
    useState<WordModelStatus | null>(null);

  const [checking, setChecking] =
    useState(false);

  const [recognitionError, setRecognitionError] =
    useState<string | null>(null);

  const inFlight = useRef(false);

  const latestCharacterFeaturesRef =
    useRef<number[] | null>(null);

  const latestWordFeaturesRef =
    useRef<number[] | null>(null);

  const latestHandCountRef = useRef(0);

  const configured = isMlApiConfigured();

  /*
   * Keep the latest character and word features.
   * The two models use different normalization.
   */
  useEffect(() => {
    latestCharacterFeaturesRef.current =
      handTracking.features;

    latestWordFeaturesRef.current =
      handTracking.wordFeatures;

    latestHandCountRef.current =
      handTracking.handCount;
  }, [
    handTracking.features,
    handTracking.wordFeatures,
    handTracking.handCount,
  ]);

  /*
   * Add stable predictions to the sentence.
   */
  const handleCommit = useCallback(
    (
      prediction: Parameters<
        typeof sentence.addPrediction
      >[0],
    ) => {
      sentence.addPrediction(prediction);
    },
    [sentence.addPrediction],
  );

  /*
   * Shared prediction stabilizer.
   */
  const stabilizer = usePredictionStabilizer(
    handleCommit,
    {
      stableFrames: 6,
      minConfidence: 0.7,
      cooldownMs: 1500,
    },
  );

  const pushPrediction = stabilizer.push;
  const resetStabilizer = stabilizer.reset;
  const currentPrediction = stabilizer.current;
  const stability = stabilizer.stability;
  const locked = stabilizer.locked;

  /*
   * Check both backend models.
   */
  const refreshStatus = useCallback(async () => {
    setChecking(true);

    try {
      const [
        characterStatus,
        wordStatus,
      ] = await Promise.all([
        checkModelStatus(),
        checkWordModelStatus(),
      ]);

      setModelStatus(characterStatus);
      setWordModelStatus(wordStatus);
    } catch (error) {
      console.error(
        "Failed to check model status:",
        error,
      );
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  /*
   * Reset the previous prediction when switching modes.
   */
  useEffect(() => {
    resetStabilizer();
    setRecognitionError(null);
    inFlight.current = false;
  }, [
    recognitionMode,
    resetStabilizer,
  ]);

  /*
   * Send features to the selected model.
   *
   * Character:
   *   features -> /api/v2/predict
   *
   * Word:
   *   wordFeatures -> /api/v2/predict-word
   */
  useEffect(() => {
    if (
      camera.state !== "active" ||
      !configured ||
      !handTracking.ready
    ) {
      return;
    }

    if (
      recognitionMode === "character" &&
      modelStatus?.api !== "online"
    ) {
      return;
    }

    if (
      recognitionMode === "word" &&
      wordModelStatus?.online !== true
    ) {
      return;
    }

    let cancelled = false;

    const sendPredictionRequest = async () => {
      if (
        cancelled ||
        inFlight.current
      ) {
        return;
      }

      const features =
        recognitionMode === "character"
          ? latestCharacterFeaturesRef.current
          : latestWordFeaturesRef.current;

      const handCount =
        latestHandCountRef.current;

      /*
       * Both models expect exactly 126 features.
       */
      if (
        !features ||
        features.length !== 126
      ) {
        return;
      }

      if (
        handCount !== 1 &&
        handCount !== 2
      ) {
        return;
      }

      inFlight.current = true;

      try {
        const prediction =
          recognitionMode === "character"
            ? await sendFrame({
                features,
                handCount,
              })
            : await sendWordFrame({
                features,
                handCount,
              });

        if (cancelled) {
          return;
        }

        setRecognitionError(null);

        if (prediction) {
          pushPrediction(prediction);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          `${recognitionMode} prediction error:`,
          error,
        );

        setRecognitionError(
          error instanceof Error
            ? error.message
            : "Recognition is currently unavailable.",
        );
      } finally {
        inFlight.current = false;
      }
    };

    /*
     * Request immediately, then every 250 ms.
     */
    void sendPredictionRequest();

    const timer = window.setInterval(
      () => {
        void sendPredictionRequest();
      },
      FRAME_INTERVAL_MS,
    );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      inFlight.current = false;
    };
  }, [
    camera.state,
    configured,
    handTracking.ready,
    recognitionMode,
    modelStatus?.api,
    wordModelStatus?.online,
    pushPrediction,
  ]);

  /*
   * Clear recognition state when the camera stops.
   */
  useEffect(() => {
    if (camera.state !== "active") {
      resetStabilizer();

      setRecognitionError(null);

      latestCharacterFeaturesRef.current = null;
      latestWordFeaturesRef.current = null;
      latestHandCountRef.current = 0;

      inFlight.current = false;
    }
  }, [
    camera.state,
    resetStabilizer,
  ]);

  /*
   * Determine whether the selected model is online.
   */
  const selectedModelOnline =
    recognitionMode === "character"
      ? modelStatus?.api === "online"
      : wordModelStatus?.online === true;

  /*
   * Determine prediction card status.
   */
  let status: PredictionStatus = "idle";

  if (!configured) {
    status = "not-connected";
  } else if (recognitionError) {
    status = "error";
  } else if (camera.state !== "active") {
    status = "idle";
  } else if (
    !handTracking.ready ||
    !selectedModelOnline
  ) {
    status = "idle";
  } else if (locked) {
    status = "recognised";
  } else if (stability > 0) {
    status = "stabilising";
  } else {
    status = "listening";
  }

  return (
    <div className="container-page py-8 md:py-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Translator
        </h1>

        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Start your camera, show one sign at a time,
          and hold the sign steady for a moment.
        </p>
      </header>

      {!configured && (
        <div className="mt-6 max-w-3xl rounded-lg border-2 border-info/40 bg-info/10 p-4">
          <div className="flex gap-3">
            <Info
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-info"
            />

            <div>
              <h2 className="text-sm font-bold">
                Recognition is not connected yet
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Connect the Bhasha FastAPI recognition
                backend to enable sign recognition.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recognition mode selector */}
      <section
        className="mt-6 max-w-3xl rounded-xl border p-4"
        aria-labelledby="recognition-mode-heading"
      >
        <h2
          id="recognition-mode-heading"
          className="text-sm font-bold"
        >
          Recognition mode
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Choose whether to recognize individual
          characters or complete words.
        </p>

        <div
          className="mt-3 grid grid-cols-2 gap-3"
          role="group"
          aria-label="Recognition mode"
        >
          <button
            type="button"
            aria-pressed={
              recognitionMode === "character"
            }
            onClick={() =>
              setRecognitionMode("character")
            }
            className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
              recognitionMode === "character"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            Character Recognition
          </button>

          <button
            type="button"
            aria-pressed={
              recognitionMode === "word"
            }
            onClick={() =>
              setRecognitionMode("word")
            }
            className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
              recognitionMode === "word"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            Word Recognition
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {recognitionMode === "character"
            ? `Character model: ${
                modelStatus?.api === "online"
                  ? "Online"
                  : "Not confirmed online"
              }`
            : `Word model: ${
                wordModelStatus?.online
                  ? "Online"
                  : "Not confirmed online"
              }`}
        </p>

        {recognitionMode === "word" &&
          wordModelStatus &&
          !wordModelStatus.online && (
            <p className="mt-2 text-sm text-destructive">
              {wordModelStatus.message ||
                "The word model is unavailable. Check the backend and word-model endpoint."}
            </p>
          )}
      </section>

      {handTracking.error && (
        <div className="mt-6 max-w-3xl">
          <ErrorMessage
            title="Hand tracking is unavailable"
            description={handTracking.error}
          />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <CameraView
            ref={camera.videoRef}
            state={camera.state}
            errorMessage={camera.errorMessage}
            onStart={() => void camera.start()}
            onStop={camera.stop}
            handsDetected={handTracking.handDetected}
            handDetectionAvailable={
              configured &&
              handTracking.ready &&
              selectedModelOnline
            }
          />

          <SystemStatus
            cameraState={camera.state}
            handDetectionAvailable={
              configured &&
              handTracking.ready &&
              selectedModelOnline
            }
            handDetectionActive={
              camera.state === "active" &&
              handTracking.ready &&
              handTracking.handDetected &&
              !recognitionError &&
              selectedModelOnline
            }
            modelStatus={modelStatus}
            checking={checking}
            onRefresh={() => void refreshStatus()}
          />

          {recognitionMode === "word" &&
            wordModelStatus?.online && (
              <div className="rounded-lg border p-4">
                <h2 className="text-sm font-bold">
                  Word model ready
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  The word model reports{" "}
                  {wordModelStatus.classNames.length} classes.
                  Hold a trained sign steadily in view to
                  test recognition.
                </p>
              </div>
            )}
        </div>

        <div className="space-y-6 lg:col-span-5">
          <PredictionCard
            prediction={currentPrediction}
            status={status}
            stability={stability}
          />

          {recognitionError && (
            <ErrorMessage
              title="Recognition is unavailable"
              description={recognitionError}
              action={{
                label: "Check connection",
                onClick: () => void refreshStatus(),
              }}
            />
          )}

          <SentenceBuilder
            tokens={sentence.tokens}
            sentence={sentence.sentence}
            saved={sentence.saved}
            onUndo={sentence.undo}
            onClear={sentence.clear}
            onRemove={sentence.removeToken}
            onAddManual={sentence.addManual}
            onSave={() => {
              const entry = sentence.save();

              if (entry) {
                toast.success("Sentence saved");
              }
            }}
            onError={(message) =>
              toast.error(message)
            }
          />
        </div>
      </div>
    </div>
  );
}