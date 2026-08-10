import { AUDIO_FEEDBACK } from '../config/audioFeedbackConfig.js';

const audioState = {
  isMuted: false,
  context: null,
};

function resolveAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  return new AudioContextConstructor();
}

export class AudioManager {
  constructor({ config = AUDIO_FEEDBACK } = {}) {
    this.config = config;
  }

  get isMuted() {
    return audioState.isMuted;
  }

  setMuted(isMuted) {
    audioState.isMuted = Boolean(isMuted);
  }

  toggleMuted() {
    this.setMuted(!this.isMuted);

    if (!this.isMuted) {
      this.play('toggle');
    }

    return this.isMuted;
  }

  unlock() {
    const context = this.getContext();

    if (!context) {
      return false;
    }

    if (context.state === 'suspended') {
      context.resume?.().catch(() => {});
    }

    return true;
  }

  play(soundKey) {
    if (this.isMuted) {
      return;
    }

    const definition = this.config.sounds[soundKey];

    if (!definition) {
      return;
    }

    const context = this.getContext();

    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      context
        .resume?.()
        .then(() => this.playDefinition(context, definition))
        .catch(() => {});
      return;
    }

    this.playDefinition(context, definition);
  }

  playDefinition(context, definition) {
    if (definition.type === 'arpeggio') {
      this.playArpeggio(context, definition);
      return;
    }

    if (definition.type === 'warning-beeps') {
      this.playWarningBeeps(context, definition);
      return;
    }

    this.playTone(context, definition);
  }

  getContext() {
    if (!audioState.context) {
      audioState.context = resolveAudioContext();
    }

    return audioState.context;
  }

  playArpeggio(context, definition) {
    definition.frequencies.forEach((frequency, index) => {
      this.playTone(context, {
        ...definition,
        frequency,
        endFrequency: frequency * 1.04,
        durationMs: definition.stepMs,
        startOffsetMs: index * definition.stepMs * 0.72,
      });
    });
  }

  playWarningBeeps(context, definition) {
    for (let index = 0; index < definition.count; index += 1) {
      this.playTone(context, {
        ...definition,
        durationMs: definition.beepDurationMs,
        startOffsetMs: index * (definition.beepDurationMs + definition.gapMs),
      });
    }
  }

  playTone(context, definition) {
    const startTime = context.currentTime + (definition.startOffsetMs ?? 0) / 1000;
    const endTime = startTime + definition.durationMs / 1000;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const volume = definition.volume * this.config.masterVolume;

    oscillator.type = definition.wave ?? 'sine';
    oscillator.frequency.setValueAtTime(definition.frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, definition.endFrequency ?? definition.frequency),
      endTime,
    );

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(endTime + 0.02);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  destroy() {
    // AudioContext is shared between scenes so the browser unlock survives scene changes.
  }
}
