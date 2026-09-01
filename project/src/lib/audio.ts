let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3, delay = 0) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();
    osc.connect(gainNode);
    gainNode.connect(ac.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gainNode.gain.setValueAtTime(0, ac.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(gain, ac.currentTime + delay + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ac.currentTime + delay + duration);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration + 0.05);
  } catch {
    // Audio not available
  }
}

export function playClick() {
  playTone(800, 0.08, 'square', 0.15);
}

export function playReveal() {
  playTone(440, 0.12, 'sine', 0.25, 0);
  playTone(554, 0.12, 'sine', 0.25, 0.1);
  playTone(659, 0.2, 'sine', 0.3, 0.2);
}

export function playImpostor() {
  playTone(440, 0.15, 'sawtooth', 0.2, 0);
  playTone(330, 0.15, 'sawtooth', 0.2, 0.15);
  playTone(220, 0.3, 'sawtooth', 0.25, 0.3);
}

export function playTick() {
  playTone(1200, 0.05, 'square', 0.1);
}

export function playEliminated() {
  playTone(330, 0.2, 'sine', 0.3, 0);
  playTone(220, 0.4, 'sine', 0.2, 0.2);
}

export function playVictory() {
  [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.15, 'sine', 0.3, i * 0.12));
}

export function vibrate(pattern: number | number[]) {
  try { navigator.vibrate(pattern); } catch { /* unsupported */ }
}
