// High-impact, multi-stage loud explosion sound generator
// Combines Web Audio API synthesized rumble + instant HTML5 Audio fallback

let sharedAudioCtx = null;

function getAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

// Generate base64 PCM WAV for instant loud blast
function getExplosionWavUri() {
  const sampleRate = 22050;
  const duration = 1.6;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // 1. Initial deafening crack (0 to 0.15s)
    const crack = (Math.random() * 2 - 1) * Math.exp(-t * 8.0);
    // 2. Heavy sub-bass blast (drops 160Hz -> 25Hz)
    const freq = Math.max(25, 160 - t * 90);
    const sub = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2.2);
    // 3. Low rolling thunder & shockwave
    const thunder = (Math.sin(2 * Math.PI * 40 * t) + (Math.random() * 2 - 1) * 0.4) * Math.exp(-t * 1.6);

    let sample = crack * 0.6 + sub * 0.85 + thunder * 0.5;
    // Boost and soft clip
    sample = Math.max(-1, Math.min(1, sample * 1.4));
    buffer[i] = sample < 0 ? sample * 32768 : sample * 32767;
  }

  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);
  function writeString(offset, string) {
    for (let j = 0; j < string.length; j++) view.setUint8(offset + j, string.charCodeAt(j));
  }
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Convert binary to base64
  let binary = '';
  const bytes = new Uint8Array(header.length + buffer.byteLength);
  bytes.set(header, 0);
  bytes.set(new Uint8Array(buffer.buffer), header.length);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

let cachedExplosionUri = null;

export function triggerMassiveExplosionSound(enabled = true) {
  if (!enabled) return;

  // 1. Play HTML5 Audio element (Always allowed during direct user click!)
  try {
    if (!cachedExplosionUri) {
      cachedExplosionUri = getExplosionWavUri();
    }
    const audio = new Audio(cachedExplosionUri);
    audio.volume = 1.0;
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {
    console.warn('HTML5 audio play error:', e);
  }

  // 2. Play Web Audio API synthesized shockwave simultaneously for massive depth
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-16, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(18, ctx.currentTime);
    compressor.attack.setValueAtTime(0.001, ctx.currentTime);
    compressor.release.setValueAtTime(0.35, ctx.currentTime);
    compressor.connect(ctx.destination);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(2.4, ctx.currentTime);
    masterGain.connect(compressor);

    // Shockwave noise buffer
    const bufSize = Math.floor(ctx.sampleRate * 2.0);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.8);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(2.2, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.9);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();

    // Heavy Sub-bass oscillator
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(150, ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 1.3);

    subGain.gain.setValueAtTime(2.0, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 1.4);

    sub.connect(subGain);
    subGain.connect(masterGain);
    sub.start();
    sub.stop(ctx.currentTime + 1.45);
  } catch (e) {
    console.warn('Web Audio synthesis error:', e);
  }
}
