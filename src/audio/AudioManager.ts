import { Sound } from "@pixi/sound";

export class AudioManager {
  private readonly spinSound: Sound;
  private readonly reelStopSound: Sound;
  private readonly winSound: Sound;
  private readonly bigWinSound: Sound;
  private readonly clickSound: Sound;
  private readonly coinSound: Sound;
  private readonly music: Sound;
  private muted: boolean;
  private musicStarted = false;

  constructor(baseUrl: string) {
    this.spinSound = Sound.from({ url: `${baseUrl}audio/spin.mp3`, volume: 0.5 });
    this.reelStopSound = Sound.from({ url: `${baseUrl}audio/reel-stop.mp3`, volume: 0.4 });
    this.winSound = Sound.from({ url: `${baseUrl}audio/win.mp3`, volume: 0.5 });
    this.bigWinSound = Sound.from({ url: `${baseUrl}audio/big-win.mp3`, volume: 0.6 });
    this.clickSound = Sound.from({ url: `${baseUrl}audio/click.mp3`, volume: 0.4 });
    this.coinSound = Sound.from({ url: `${baseUrl}audio/coin.mp3`, volume: 0.45 });
    this.music = Sound.from({
      url: `${baseUrl}audio/music.mp3`,
      loop: true,
      volume: 0.25,
      preload: false,
    });
    this.muted = true;
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

  playClick(): void {
    this.play(this.clickSound);
  }

  playCoin(): void {
    this.play(this.coinSound);
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
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
