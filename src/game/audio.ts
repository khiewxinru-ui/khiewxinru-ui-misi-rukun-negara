import { assetUrl } from "../shared/content";
import { narrationAvailable } from "./narration";

export type AudioSettings = {
  music: boolean;
  effects: boolean;
  voice: boolean;
  subtitles: boolean;
  volume: number;
  reducedMotion: boolean;
  quality: "low" | "high";
  lookSensitivity: number;
};
export const defaultSettings: AudioSettings = {
  music: true,
  effects: true,
  voice: true,
  subtitles: true,
  volume: 0.55,
  reducedMotion: false,
  quality: "high",
  lookSensitivity: 1,
};

class AudioEngine {
  private context: AudioContext | null = null;
  private music = new Audio(assetUrl("assets/journey.wav"));
  private ambience = new Audio(assetUrl("assets/ambience.wav"));
  private voiceAudio: HTMLAudioElement | null = null;
  private setLevels() {
    const speaking = this.voiceAudio !== null;
    this.music.volume = this.settings.volume * (speaking ? 0.07 : 0.24);
    this.ambience.volume = this.settings.volume * (speaking ? 0.04 : 0.14);
  }
  settings = defaultSettings;
  constructor() {
    this.music.loop = true;
    this.music.preload = "none";
    this.ambience.loop = true;
    this.ambience.preload = "none";
  }
  configure(soundtrack: { music: string; ambience: string }) {
    const music = new URL(assetUrl(soundtrack.music), location.href).href,
      ambience = new URL(assetUrl(soundtrack.ambience), location.href).href;
    if (this.music.src !== music) this.music.src = music;
    if (this.ambience.src !== ambience) this.ambience.src = ambience;
    this.update(this.settings);
  }
  async unlock() {
    this.context ??= new AudioContext();
    await this.context.resume().catch(() => {});
    this.update(this.settings);
  }
  update(s: AudioSettings) {
    this.settings = s;
    this.setLevels();
    if (s.music && this.context?.state === "running")
      void this.music.play().catch(() => {});
    else this.music.pause();
    if (s.effects && this.context?.state === "running")
      void this.ambience.play().catch(() => {});
    else this.ambience.pause();
    if (!s.voice) this.stopVoice();
  }
  effect(type: "step" | "success" | "click" | "portal" = "click") {
    const ctx = this.context;
    if (!ctx || !this.settings.effects) return;
    const freqs =
      type === "success"
        ? [523, 659, 784]
        : type === "portal"
          ? [196, 294, 392, 587]
          : [type === "step" ? 100 : 440];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain(),
        t = ctx.currentTime + i * 0.12;
      osc.type = type === "step" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(
        this.settings.volume * (type === "step" ? 0.045 : 0.12),
        t + 0.015,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        t + (type === "step" ? 0.09 : 0.4),
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }
  speak(
    _text: string,
    audioPath = "",
    manual = false,
  ): "recorded" | "unavailable" | "off" {
    this.stopVoice();
    if (!this.settings.voice && !manual) return "off";
    if (narrationAvailable(audioPath)) {
      const clip = new Audio(assetUrl(audioPath));
      this.voiceAudio = clip;
      clip.volume = this.settings.volume;
      this.setLevels();
      const release = () => {
        if (this.voiceAudio === clip) {
          this.voiceAudio = null;
          this.setLevels();
        }
      };
      clip.onended = release;
      clip.onerror = release;
      void clip.play().catch(release);
      return "recorded";
    }
    return "unavailable";
  }
  stopVoice() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    this.voiceAudio?.pause();
    this.voiceAudio = null;
    this.setLevels();
  }
  pause() {
    this.music.pause();
    this.ambience.pause();
    this.stopVoice();
    void this.context?.suspend();
  }
}
export const audioEngine = new AudioEngine();
