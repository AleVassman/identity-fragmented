export class AudioManager {
    constructor() {
        this.ctx = null;
        this.isInitialized = false;

        this.audioPast = new Audio('/audio/past.mp3');
        this.audioPresent = new Audio('/audio/present.mp3');

        this.audioPast.loop = true;
        this.audioPresent.loop = true;

        // Skip the silent intro seconds of the Scott Buckley track
        this.pastStartTime = 2.5; // (in seconds) Adjust if needed

        this.gainPast = null;
        this.gainPresent = null;
        this.masterGain = null;
    }

    init() {
        if (this.isInitialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        const sourcePast = this.ctx.createMediaElementSource(this.audioPast);
        const sourcePresent = this.ctx.createMediaElementSource(this.audioPresent);

        this.gainPast = this.ctx.createGain();
        this.gainPresent = this.ctx.createGain();
        this.masterGain = this.ctx.createGain();

        this.gainPast.gain.value = 1.0;
        this.gainPresent.gain.value = 0.0;
        this.masterGain.gain.value = 1.0;

        sourcePast.connect(this.gainPast);
        sourcePresent.connect(this.gainPresent);

        this.gainPast.connect(this.masterGain);
        this.gainPresent.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.isInitialized = true;
    }

    start() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        // Jump immediately past the silent lead-in
        try {
            this.audioPast.currentTime = this.pastStartTime;
        } catch (e) {}

        this.audioPast.play().catch(() => {});
        this.audioPresent.play().catch(() => {});
        this.setProgress(0.0);
    }

    setProgress(progress) {
        if (!this.isInitialized || !this.ctx) return;

        const now = this.ctx.currentTime;
        const RAMP_TIME = 0.05;

        let volPast = 0.0;
        let volPresent = 0.0;

        // ACT I: The Past (0.00 – 0.35)
        if (progress < 0.35) {
            volPast = 1.0;
            volPresent = 0.0;
        }
        // CROSSFADE (0.35 – 0.45)
        else if (progress >= 0.35 && progress < 0.45) {
            const crossT = (progress - 0.35) / 0.10;
            volPast = Math.cos(crossT * 0.5 * Math.PI);
            volPresent = Math.sin(crossT * 0.5 * Math.PI);
        }
        // ACT II: The Present (0.45 – 0.90)
        else if (progress >= 0.45 && progress < 0.90) {
            volPast = 0.0;
            volPresent = 1.0;
        }
        // ACT III: Fade to Silence (0.90 – 0.96)
        else if (progress >= 0.90 && progress < 0.96) {
            const fadeT = (progress - 0.90) / 0.06;
            volPast = 0.0;
            volPresent = Math.max(0.0, 1.0 - fadeT);
        }
        // THE VOID: Silence (0.96 – 1.00)
        else {
            volPast = 0.0;
            volPresent = 0.0;
        }

        this.gainPast.gain.setTargetAtTime(volPast, now, RAMP_TIME);
        this.gainPresent.gain.setTargetAtTime(volPresent, now, RAMP_TIME);
    }

    rewind() {
        if (!this.isInitialized) return;

        try {
            this.audioPast.currentTime = this.pastStartTime;
            this.audioPresent.currentTime = 0;
        } catch (e) {}

        this.audioPast.pause();
        this.audioPresent.pause();
        this.setProgress(0.0);
    }
}