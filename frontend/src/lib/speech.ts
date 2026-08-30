type WordBoundaryCallback = (charIndex: number, charLength: number, word: string) => void;
type StateCallback = (isSpeaking: boolean, isPaused: boolean) => void;

class SpeechController {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private rate: number = 1.0;
  private isMuted: boolean = false;
  private onBoundaryCallback: WordBoundaryCallback | null = null;
  private onStateChangeCallback: StateCallback | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  public setCallbacks(onBoundary: WordBoundaryCallback, onStateChange: StateCallback) {
    this.onBoundaryCallback = onBoundary;
    this.onStateChangeCallback = onStateChange;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  public setRate(rate: number) {
    this.rate = rate;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.stop();
    }
  }

  public speak(text: string, language: string = "English") {
    if (!this.synth || this.isMuted) return;

    this.stop();

    if (this.voices.length === 0) {
      this.loadVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;

    const lowerLang = language.toLowerCase();
    const isHindi = lowerLang.includes("hindi");
    const isHinglish = lowerLang.includes("hinglish");

    // Match best voice for Hindi, Hinglish (Indian English/Hindi), or English
    if (isHindi) {
      const hiVoice = this.voices.find(
        (v) => v.lang.toLowerCase().startsWith("hi") || v.lang.toLowerCase().includes("hi-in")
      );
      if (hiVoice) {
        utterance.voice = hiVoice;
        utterance.lang = "hi-IN";
      } else {
        utterance.lang = "hi-IN";
      }
    } else if (isHinglish) {
      const inVoice = this.voices.find(
        (v) => v.lang.toLowerCase().includes("en-in") || v.lang.toLowerCase().startsWith("hi")
      );
      if (inVoice) {
        utterance.voice = inVoice;
      }
      utterance.lang = "en-IN";
    } else {
      const enVoice = this.voices.find(
        (v) => v.lang.toLowerCase().includes("en-us") || v.lang.toLowerCase().includes("en-gb") || v.lang.startsWith("en")
      );
      if (enVoice) {
        utterance.voice = enVoice;
      }
      utterance.lang = "en-US";
    }

    // Word boundary event for animated mouth timing
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === "word" || !event.name) {
        const charIndex = event.charIndex;
        const charLength = event.charLength || 5;
        const word = text.substring(charIndex, charIndex + charLength);
        if (this.onBoundaryCallback) {
          this.onBoundaryCallback(charIndex, charLength, word);
        }
      }
    };

    utterance.onstart = () => {
      if (this.onStateChangeCallback) this.onStateChangeCallback(true, false);
    };

    utterance.onpause = () => {
      if (this.onStateChangeCallback) this.onStateChangeCallback(true, true);
    };

    utterance.onresume = () => {
      if (this.onStateChangeCallback) this.onStateChangeCallback(true, false);
    };

    utterance.onend = () => {
      if (this.onStateChangeCallback) this.onStateChangeCallback(false, false);
      if (this.onBoundaryCallback) this.onBoundaryCallback(-1, 0, "");
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis notice:", e);
      if (this.onStateChangeCallback) this.onStateChangeCallback(false, false);
      if (this.onBoundaryCallback) this.onBoundaryCallback(-1, 0, "");
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      if (this.onStateChangeCallback) this.onStateChangeCallback(false, false);
      if (this.onBoundaryCallback) this.onBoundaryCallback(-1, 0, "");
    }
  }

  public isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}

export const speechController = new SpeechController();
