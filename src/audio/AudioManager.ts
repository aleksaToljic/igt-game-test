import { Sound } from "@pixi/sound";

const MUTE_KEY = "igt-slot-muted";

export class AudioManager {
  private readonly spinSound: Sound;
  private readonly reelStopSound: Sound;
  private readonly winSound: Sound;
  private readonly bigWinSound: Sound;
  private readonly music: Sound;
  private muted: boolean;
  private musicStarted = false;

  constructor(baseUrl: string) {
    this.spinSound = Sound.from({ url: `${baseUrl}audio/spin.mp3`, volume: 0.5 });
    this.reelStopSound = Sound.from({ url: `${baseUrl}audio/reel-stop.mp3`, volume: 0.4 });
    this.winSound = Sound.from({ url: `${baseUrl}audio/win.mp3`, volume: 0.5 });
    this.bigWinSound = Sound.from({ url: `${baseUrl}audio/big-win.mp3`, volume: 0.6 });
    this.music = Sound.from({
      url: `${baseUrl}audio/music.mp3`,
      loop: true,
      volume: 0.25,
      preload: false,
    });
    this.muted = localStorage.getItem(MUTE_KEY) === "true";
  }

  startMusic(): void {
    if (this.musicStarted || this.muted) {
      return;
    }
    this.musicStarted = true;
    this.music.play();
  }

  playSpin(): void {
    this.play(this.spinSound);
  }

  playReelStop(): void {
    this.play(this.reelStopSound);
  }

  playWin(): void {
    this.play(this.winSound);
  }

  playBigWin(): void {
    this.play(this.bigWinSound);
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem(MUTE_KEY, String(this.muted));
    if (this.muted) {
      this.music.stop();
      this.musicStarted = false;
    } else {
      this.startMusic();
    }
    return this.muted;
  }

  private play(sound: Sound): void {
    if (!this.muted) {
      sound.play();
    }
  }
}
