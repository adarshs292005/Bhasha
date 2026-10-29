/**
 * speechService — thin abstraction over speech synthesis.
 *
 * The default implementation uses the browser Web Speech API. Replace
 * `activeProvider` with another implementation (a cloud TTS service, for
 * example) without touching any component.
 */

export interface SpeechProvider {
  readonly name: string;
  isSupported(): boolean;
  speak(text: string, options?: SpeakOptions): Promise<void>;
  cancel(): void;
}

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

class BrowserSpeechProvider implements SpeechProvider {
  readonly name = "Browser speech synthesis";

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(text: string, options: SpeakOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error("Speech output is not supported in this browser."));
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = options.lang ?? "en-IN";
      utterance.rate = options.rate ?? 0.95;
      utterance.pitch = options.pitch ?? 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error("Speech output failed. Please try again."));
      window.speechSynthesis.speak(utterance);
    });
  }

  cancel(): void {
    if (this.isSupported()) window.speechSynthesis.cancel();
  }
}

let activeProvider: SpeechProvider = new BrowserSpeechProvider();

export function setSpeechProvider(provider: SpeechProvider): void {
  activeProvider.cancel();
  activeProvider = provider;
}

export function getSpeechProvider(): SpeechProvider {
  return activeProvider;
}

export function isSpeechSupported(): boolean {
  return activeProvider.isSupported();
}

export function speak(text: string, options?: SpeakOptions): Promise<void> {
  return activeProvider.speak(text, options);
}

export function cancelSpeech(): void {
  activeProvider.cancel();
}
