// All sounds are synthesized locally. Category buses accept future recorded assets.
export class AudioManager {
  constructor(settings) { this.settings = settings; this.context = null; this.nextThunder = 18; this.elapsed = 0; }
  async start() {
    if (this.context) { await this.context.resume(); return; }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const c = this.context = new AudioContext();
    this.master = c.createGain(); this.master.connect(c.destination);
    this.categories = {};
    for (const key of ['music', 'ambience', 'sfx', 'voice']) { const gain = c.createGain(); gain.connect(this.master); this.categories[key] = gain; }
    const buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < data.length; i++) { previous = (previous + Math.random() * 0.04 - 0.02) / 1.015; data[i] = previous; }
    this.noise = buffer;
    const wind = c.createBufferSource(); wind.buffer = buffer; wind.loop = true;
    const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 850;
    const gain = c.createGain(); gain.gain.value = 0.7;
    wind.connect(filter).connect(gain).connect(this.categories.ambience); wind.start();
    for (const hz of [55, 82.41, 110.12]) {
      const oscillator = c.createOscillator(), g = c.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = hz; g.gain.value = 0.028;
      oscillator.connect(g).connect(this.categories.music); oscillator.start();
    }
    this.applySettings(); await c.resume();
  }
  applySettings() { if (this.master) this.master.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.volume, this.context.currentTime, 0.1); }
  tone(hz, duration, volume, type = 'sine', category = 'sfx', endHz = hz) {
    if (!this.context) return;
    const c = this.context, now = c.currentTime, oscillator = c.createOscillator(), gain = c.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(hz, now); oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endHz), now + duration);
    gain.gain.setValueAtTime(0.001, now); gain.gain.exponentialRampToValueAtTime(volume, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(this.categories[category]); oscillator.start(); oscillator.stop(now + duration + 0.1);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  horn() { this.tone(87, 4, 0.12, 'sawtooth', 'sfx', 82); this.tone(130, 4.3, 0.045, 'sine', 'sfx', 123); }
  scream() { this.tone(590, 1.8, 0.04, 'triangle', 'voice', 270); }
  thunder() {
    if (!this.context) return;
    const c = this.context, source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    source.buffer = this.noise; source.playbackRate.value = 0.4; filter.type = 'lowpass'; filter.frequency.value = 180;
    gain.gain.setValueAtTime(1.4, c.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 5);
    source.connect(filter).connect(gain).connect(this.categories.sfx); source.start(); source.stop(c.currentTime + 5);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  createPositionalSource(buffer, position, category = 'sfx') {
    if (!this.context) return null;
    const source = this.context.createBufferSource(), panner = this.context.createPanner();
    source.buffer = buffer; panner.panningModel = 'HRTF'; panner.refDistance = 5;
    panner.positionX.value = position.x; panner.positionY.value = position.y; panner.positionZ.value = position.z;
    source.connect(panner).connect(this.categories[category]);
    source.onended = () => { source.disconnect(); panner.disconnect(); }; return source;
  }
  update(dt, camera) {
    if (!this.context) return;
    this.elapsed += dt;
    if (this.elapsed > this.nextThunder) { this.thunder(); this.nextThunder = this.elapsed + 26 + Math.random() * 20; }
    const listener = this.context.listener;
    if (listener.positionX) { listener.positionX.value = camera.position.x; listener.positionY.value = camera.position.y; listener.positionZ.value = camera.position.z; }
  }
}
