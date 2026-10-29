import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Camera,
  CameraOff,
  Circle,
  RotateCcw,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { cn } from "@/lib/utils";
import { useCamera } from "@/hooks/useCamera";
import { useDatasetHandTracking } from "@/hooks/useDatasetHandTracking";
import { supabase } from "@/lib/supabase";

const SAMPLES_PER_SIGN = 50;
const CAPTURE_INTERVAL_MS = 100;

type CaptureStatus =
  | "idle"
  | "countdown"
  | "capturing"
  | "complete";

type UploadStatus =
  | "idle"
  | "uploading"
  | "success"
  | "error";

interface DatasetSample {
  personId: string;
  label: string;
  features: number[];
  handCount: number;
  leftDetected: boolean;
  rightDetected: boolean;
  sampleIndex: number;
  createdAt: string;
}

const CHARACTER_CLASSES = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export function DatasetCollector() {
  const camera = useCamera();

  const handTracking = useDatasetHandTracking(camera.videoRef);

  const [personId, setPersonId] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("A");

  const [captureStatus, setCaptureStatus] =
    useState<CaptureStatus>("idle");

  const [uploadStatus, setUploadStatus] =
    useState<UploadStatus>("idle");

  const [countdown, setCountdown] = useState<number | null>(null);

  const [samples, setSamples] = useState<DatasetSample[]>([]);

  const [lastSampleTime, setLastSampleTime] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [uploadError, setUploadError] =
    useState<string | null>(null);

  const countdownTimerRef = useRef<number | null>(null);
  const captureTimerRef = useRef<number | null>(null);

  const latestFeaturesRef =
    useRef<number[] | null>(null);

  const latestHandCountRef = useRef(0);
  const latestLeftDetectedRef = useRef(false);
  const latestRightDetectedRef = useRef(false);

  const uploadedCaptureKeyRef =
    useRef<string | null>(null);

  useEffect(() => {
    latestFeaturesRef.current = handTracking.features;
    latestHandCountRef.current = handTracking.handCount;
    latestLeftDetectedRef.current =
      handTracking.leftDetected;
    latestRightDetectedRef.current =
      handTracking.rightDetected;
  }, [
    handTracking.features,
    handTracking.handCount,
    handTracking.leftDetected,
    handTracking.rightDetected,
  ]);

  /*
   * Start / stop MediaPipe with the camera.
   */
  useEffect(() => {
    if (camera.state !== "active") {
      handTracking.stopTracking();
      return;
    }

    if (!handTracking.ready) {
      return;
    }

    handTracking.startTracking();

    return () => {
      handTracking.stopTracking();
    };
  }, [
    camera.state,
    handTracking.ready,
    handTracking.startTracking,
    handTracking.stopTracking,
  ]);

  /*
   * Cleanup timers when component unmounts.
   */
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
      }

      if (captureTimerRef.current !== null) {
        window.clearInterval(captureTimerRef.current);
      }
    };
  }, []);

  const stopCaptureTimers = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (captureTimerRef.current !== null) {
      window.clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  }, []);

  const resetCapture = useCallback(() => {
    stopCaptureTimers();

    setCaptureStatus("idle");
    setCountdown(null);
    setSamples([]);
    setLastSampleTime(null);
    setMessage(null);
    setUploadStatus("idle");
    setUploadError(null);

    uploadedCaptureKeyRef.current = null;
  }, [stopCaptureTimers]);

  /*
   * Capture one valid feature sample.
   */
  const captureSample = useCallback(() => {
    const features = latestFeaturesRef.current;

    if (!features || features.length !== 126) {
      return false;
    }

    const handCount = latestHandCountRef.current;

    /*
     * At least one hand must be visible.
     *
     * We allow one-hand samples because the original
     * character dataset contains both one-hand and
     * two-hand detections.
     */
    if (handCount < 1 || handCount > 2) {
      return false;
    }

    setSamples((previous) => {
      if (previous.length >= SAMPLES_PER_SIGN) {
        return previous;
      }

      const sampleIndex = previous.length + 1;

      const sample: DatasetSample = {
        personId: personId.trim(),
        label: selectedLabel,
        features: [...features],
        handCount,
        leftDetected: latestLeftDetectedRef.current,
        rightDetected: latestRightDetectedRef.current,
        sampleIndex,
        createdAt: new Date().toISOString(),
      };

      return [...previous, sample];
    });

    setLastSampleTime(new Date().toLocaleTimeString());

    return true;
  }, [personId, selectedLabel]);

  /*
   * Upload all 50 samples to Supabase.
   */
  const uploadSamples = useCallback(
    async (samplesToUpload: DatasetSample[]) => {
      if (samplesToUpload.length !== SAMPLES_PER_SIGN) {
        setUploadStatus("error");
        setUploadError(
          `Expected ${SAMPLES_PER_SIGN} samples, but received ${samplesToUpload.length}.`,
        );
        return;
      }

      const cleanPersonId = personId.trim();

      if (!cleanPersonId) {
        setUploadStatus("error");
        setUploadError("Participant ID is missing.");
        return;
      }

      setUploadStatus("uploading");
      setUploadError(null);
      setMessage("Uploading samples to Supabase...");

      const rows = samplesToUpload.map((sample) => ({
        person_id: sample.personId,
        label: sample.label,
        features: sample.features,
        hand_count: sample.handCount,
        left_detected: sample.leftDetected,
        right_detected: sample.rightDetected,
        sample_index: sample.sampleIndex,
        created_at: sample.createdAt,
      }));

      try {
        const { error } = await supabase
          .from("webcam_dataset_samples")
          .insert(rows);

        if (error) {
          console.error(
            "Supabase dataset upload error:",
            error,
          );

          setUploadStatus("error");
          setUploadError(
            `${error.message}${
              error.details ? ` — ${error.details}` : ""
            }`,
          );
          setMessage("Upload failed.");
          return;
        }

        setUploadStatus("success");
        setUploadError(null);
        setMessage(
          `${samplesToUpload.length} samples uploaded successfully to Supabase.`,
        );

        console.log(
          `✅ Uploaded ${samplesToUpload.length} samples for ${cleanPersonId} / ${selectedLabel}`,
        );
      } catch (error) {
        console.error(
          "Unexpected Supabase upload error:",
          error,
        );

        setUploadStatus("error");

        setUploadError(
          error instanceof Error
            ? error.message
            : "An unexpected upload error occurred.",
        );

        setMessage("Upload failed.");
      }
    },
    [personId, selectedLabel],
  );

  /*
   * Finish capture once 50 samples have been collected.
   */
  useEffect(() => {
    if (
      captureStatus !== "capturing" ||
      samples.length < SAMPLES_PER_SIGN
    ) {
      return;
    }

    stopCaptureTimers();

    setCaptureStatus("complete");
    setCountdown(null);

    setMessage(
      `${SAMPLES_PER_SIGN} samples collected for ${selectedLabel}.`,
    );
  }, [
    captureStatus,
    samples.length,
    selectedLabel,
    stopCaptureTimers,
  ]);

  /*
   * Automatically upload once collection is complete.
   */
  useEffect(() => {
    if (
      captureStatus !== "complete" ||
      samples.length !== SAMPLES_PER_SIGN ||
      !personId.trim()
    ) {
      return;
    }

    const captureKey = `${personId.trim()}-${selectedLabel}-${samples
      .map((sample) => sample.sampleIndex)
      .join("-")}`;

    if (uploadedCaptureKeyRef.current === captureKey) {
      return;
    }

    uploadedCaptureKeyRef.current = captureKey;

    void uploadSamples(samples);
  }, [
    captureStatus,
    personId,
    samples,
    selectedLabel,
    uploadSamples,
  ]);

  /*
   * Start the actual sample capture.
   */
  const beginCapture = useCallback(() => {
    setCaptureStatus("capturing");
    setCountdown(null);
    setMessage(null);
    setUploadStatus("idle");
    setUploadError(null);

    /*
     * Capture immediately, then every 100 ms.
     */
    captureSample();

    captureTimerRef.current = window.setInterval(() => {
      captureSample();
    }, CAPTURE_INTERVAL_MS);
  }, [captureSample]);

  /*
   * 3 → 2 → 1 countdown.
   */
  const startCountdown = useCallback(() => {
    if (!personId.trim()) {
      setMessage("Enter a participant ID first.");
      return;
    }

    if (camera.state !== "active") {
      setMessage("Start the camera first.");
      return;
    }

    if (!handTracking.ready) {
      setMessage("Hand tracking is still loading.");
      return;
    }

    resetCapture();

    setCaptureStatus("countdown");
    setCountdown(3);
    setMessage("Get ready...");

    let current = 3;

    countdownTimerRef.current = window.setInterval(() => {
      current -= 1;

      if (current <= 0) {
        if (countdownTimerRef.current !== null) {
          window.clearInterval(
            countdownTimerRef.current,
          );

          countdownTimerRef.current = null;
        }

        setCountdown(null);
        beginCapture();

        return;
      }

      setCountdown(current);
    }, 1000);
  }, [
    beginCapture,
    camera.state,
    handTracking.ready,
    personId,
    resetCapture,
  ]);

  /*
   * Stop camera and reset collection state.
   */
  const handleStopCamera = useCallback(() => {
    stopCaptureTimers();

    setCaptureStatus("idle");
    setCountdown(null);

    camera.stop();
  }, [camera, stopCaptureTimers]);

  /*
   * Export current samples as JSON.
   */
  const downloadSamples = useCallback(() => {
    if (samples.length === 0) {
      setMessage("There are no samples to download.");
      return;
    }

    const payload = {
      personId: personId.trim(),
      label: selectedLabel,
      sampleCount: samples.length,
      featureCount: 126,
      samples,
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      {
        type: "application/json",
      },
    );

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bhasha_${personId.trim()}_${selectedLabel}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    setMessage("Dataset samples downloaded.");
  }, [personId, samples, selectedLabel]);

  const progress = Math.min(
    (samples.length / SAMPLES_PER_SIGN) * 100,
    100,
  );

  const canCapture =
    camera.state === "active" &&
    handTracking.ready &&
    personId.trim().length > 0 &&
    captureStatus !== "countdown" &&
    captureStatus !== "capturing";

  return (
    <div className="container-page py-8 md:py-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Bhasha Dataset Collector
        </h1>

        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Help improve Bhasha by recording hand-sign samples.
          No name is required. Use the participant ID provided
          to you.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* LEFT */}
        <div className="space-y-6 lg:col-span-7">
          {/* Participant */}
          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-base font-bold">
                Participant details
              </h2>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label
                  htmlFor="person-id"
                  className="text-sm font-semibold"
                >
                  Participant ID
                </label>

                <input
                  id="person-id"
                  value={personId}
                  onChange={(event) =>
                    setPersonId(
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="Example: P01"
                  disabled={
                    captureStatus === "countdown" ||
                    captureStatus === "capturing"
                  }
                  className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Use an anonymous ID such as P01, P02, P03.
                </p>
              </div>

              <div>
                <label
                  htmlFor="sign-select"
                  className="text-sm font-semibold"
                >
                  Sign / character
                </label>

                <select
                  id="sign-select"
                  value={selectedLabel}
                  onChange={(event) => {
                    setSelectedLabel(event.target.value);
                    resetCapture();
                  }}
                  disabled={
                    captureStatus === "countdown" ||
                    captureStatus === "capturing"
                  }
                  className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {CHARACTER_CLASSES.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Camera */}
          <section className="rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-base font-bold">
                Camera
              </h2>

              <p
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                  camera.state === "active"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-border bg-secondary text-muted-foreground",
                )}
              >
                <Circle
                  aria-hidden="true"
                  className={cn(
                    "size-2.5",
                    camera.state === "active"
                      ? "fill-destructive"
                      : "fill-muted-foreground",
                  )}
                />

                {camera.state === "active"
                  ? "Camera active"
                  : "Camera off"}
              </p>
            </div>

            <div className="p-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-md border-2 border-border-strong bg-surface">
                <video
                  ref={camera.videoRef}
                  playsInline
                  muted
                  aria-label="Dataset collection camera"
                  className={cn(
                    "size-full scale-x-[-1] object-cover",
                    camera.state === "active"
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />

                {camera.state !== "active" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <CameraOff className="size-8 text-muted-foreground" />

                    <p className="text-sm font-medium text-muted-foreground">
                      Start the camera to begin collecting
                      data.
                    </p>
                  </div>
                ) : null}

                {camera.state === "active" ? (
                  <p className="absolute left-3 top-3 rounded bg-foreground/85 px-2 py-1 text-xs font-semibold text-background">
                    LIVE
                  </p>
                ) : null}

                {countdown !== null ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px]">
                    <div className="flex size-32 items-center justify-center rounded-full bg-background/90 text-6xl font-black shadow-xl">
                      {countdown}
                    </div>
                  </div>
                ) : null}

                {captureStatus === "capturing" ? (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-md bg-background/90 px-3 py-2 text-sm font-semibold shadow">
                    <span>
                      Capturing {selectedLabel}
                    </span>

                    <span>
                      {samples.length}/{SAMPLES_PER_SIGN}
                    </span>
                  </div>
                ) : null}
              </div>

              {camera.errorMessage ? (
                <div className="mt-3">
                  <ErrorMessage
                    title="Camera error"
                    description={camera.errorMessage}
                  />
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="min-h-12 flex-1"
                  onClick={() => void camera.start()}
                  disabled={
                    camera.state === "active" ||
                    camera.state === "requesting"
                  }
                >
                  <Camera />
                  Start camera
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 flex-1"
                  onClick={handleStopCamera}
                  disabled={camera.state !== "active"}
                >
                  <CameraOff />
                  Stop camera
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 lg:col-span-5">
          {/* Capture */}
          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-base font-bold">
                Capture
              </h2>
            </div>

            <div className="space-y-5 p-4">
              <div className="rounded-md border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current sign
                </p>

                <p className="mt-1 text-4xl font-black">
                  {selectedLabel}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    Progress
                  </span>

                  <span className="text-muted-foreground">
                    {samples.length}/{SAMPLES_PER_SIGN}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Hands
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {handTracking.handCount}
                  </p>
                </div>

                <div className="rounded-md border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Features
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {handTracking.features?.length ?? 0}
                  </p>
                </div>

                <div className="rounded-md border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Status
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {handTracking.ready ? "OK" : "…"}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-border bg-surface px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hand detection
                </p>

                <p className="mt-1 text-sm font-medium">
                  {handTracking.handCount === 0
                    ? "No hands detected."
                    : handTracking.handCount === 1
                      ? "1 hand detected."
                      : "2 hands detected."}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Left:{" "}
                  {handTracking.leftDetected
                    ? "detected"
                    : "missing"}
                  {" · "}
                  Right:{" "}
                  {handTracking.rightDetected
                    ? "detected"
                    : "missing"}
                </p>
              </div>

              {message ? (
                <div className="rounded-md border border-info/40 bg-info/10 px-4 py-3 text-sm">
                  {message}
                </div>
              ) : null}

              {uploadStatus === "uploading" ? (
                <div className="flex items-center gap-3 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
                  <Upload className="size-5 animate-pulse" />

                  <div>
                    <p className="font-semibold">
                      Uploading dataset...
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Sending {samples.length} samples to
                      Supabase.
                    </p>
                  </div>
                </div>
              ) : null}

              {uploadStatus === "success" ? (
                <div className="rounded-md border border-success/40 bg-success/10 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="size-5 shrink-0" />

                    <div>
                      <p className="font-bold">
                        Uploaded successfully
                      </p>

                      <p className="mt-1 text-sm">
                        {samples.length} samples for{" "}
                        {personId} / {selectedLabel} are now
                        stored in Supabase.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {uploadStatus === "error" ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
                  <p className="font-bold text-destructive">
                    Supabase upload failed
                  </p>

                  {uploadError ? (
                    <p className="mt-2 break-words text-sm">
                      {uploadError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {handTracking.error ? (
                <ErrorMessage
                  title="Hand tracking unavailable"
                  description={handTracking.error}
                />
              ) : null}

              {captureStatus === "complete" ? (
                <div className="rounded-md border border-success/40 bg-success/10 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="size-5 shrink-0" />

                    <div>
                      <p className="font-bold">
                        Collection complete
                      </p>

                      <p className="mt-1 text-sm">
                        {samples.length} samples for participant{" "}
                        {personId} — sign {selectedLabel}.
                      </p>

                      {lastSampleTime ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Last sample: {lastSampleTime}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="min-h-12"
                  onClick={startCountdown}
                  disabled={!canCapture}
                >
                  <Circle className="fill-current" />
                  Start capture
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12"
                  onClick={resetCapture}
                  disabled={
                    captureStatus === "countdown" ||
                    captureStatus === "capturing" ||
                    uploadStatus === "uploading"
                  }
                >
                  <RotateCcw />
                  Reset samples
                </Button>

                <Button
                  size="lg"
                  variant="secondary"
                  className="min-h-12"
                  onClick={downloadSamples}
                  disabled={samples.length === 0}
                >
                  Download samples
                </Button>
              </div>
            </div>
          </section>

          {/* Instructions */}
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold">
              Collection instructions
            </h2>

            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Enter your participant ID.</li>
              <li>2. Select the character.</li>
              <li>3. Start the camera.</li>
              <li>4. Position your hand(s) clearly.</li>
              <li>5. Click Start capture.</li>
              <li>6. Wait for the 3 → 2 → 1 countdown.</li>
              <li>
                7. Hold the sign naturally until capture
                finishes.
              </li>
              <li>
                8. Wait for the Supabase upload confirmation.
              </li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}