import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelSpeech, isSpeechSupported, speak } from "@/services/speechService";

interface SpeakButtonProps {
  text: string;
  size?: "default" | "lg" | undefined;
  className?: string | undefined;
  onError?: ((message: string) => void) | undefined;
}

/** Speaks text through the pluggable speech service. */
export function SpeakButton({ text, size = "lg", className, onError }: SpeakButtonProps) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(isSpeechSupported());
    return () => cancelSpeech();
  }, []);

  const disabled = !text.trim() || !supported;

  const handleClick = async () => {
    if (speaking) {
      cancelSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    try {
      await speak(text);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Speech output failed.");
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled}
      aria-live="polite"
      title={
        supported ? undefined : "Speech output is not available in this browser."
      }
    >
      {speaking ? (
        <VolumeX aria-hidden="true" />
      ) : (
        <Volume2 aria-hidden="true" />
      )}
      <span>{speaking ? "Stop speaking" : "Speak"}</span>
    </Button>
  );
}
