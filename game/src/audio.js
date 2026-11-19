const MUSIC_STEP = 0.25;

export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;
  let musicClock = 0;
  let musicStep = 0;
  let engineOsc;
  let engineGain;
  let sirenOsc;
  let sirenGain;

  function unlock() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.2;
      master.connect(context.destination);
      engineOsc = context.createOscillator();
      engineGain = context.createGain();
      engineOsc.type = 'sawtooth';
      engineGain.gain.value = 0;
      engineOsc.connect(engineGain).connect(master);
      engineOsc.start();
      sirenOsc = context.createOscillator();
      sirenGain = context.createGain();
      sirenOsc.type = 'square';
      sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain).connect(master);
      sirenOsc.start();
    }
    if (context.state === 'suspended') context.resume();
  }

  function tone(frequency, duration, type = 'sine', volume = 0.06, endFrequency = frequency) {
    if (!context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function noise(duration, volume, cutoff = 1800) {
    if (!context) return;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start();
  }

  function effect(name, amount = 1) {
    unlock();
    amount = Math.max(0.12, Math.min(1, amount));
    if (name === 'gun') { noise(0.13, 0.18 * amount, 5200); tone(110, 0.12, 'triangle', 0.09 * amount, 40); }
    if (name === 'empty') tone(700, 0.05, 'square', 0.025, 480);
    if (name === 'punch') { tone(125, 0.1, 'triangle', 0.08 * amount, 55); noise(0.07, 0.06 * amount, 700); }
    if (name === 'pickup') { tone(740, 0.12, 'sine', 0.07, 980); tone(1080, 0.16, 'sine', 0.05, 1300); }
    if (name === 'cash') { tone(660, 0.15, 'sine', 0.08, 880); tone(990, 0.22, 'sine', 0.06, 1320); }
    if (name === 'dialogue') tone(520, 0.04, 'sine', 0.025, 590);
    if (name === 'collision') { tone(100, 0.22, 'triangle', 0.14 * amount, 34); noise(0.18, 0.14 * amount, 1100); }
    if (name === 'explosion') { noise(0.5, 0.22 * amount, 900); tone(64, 0.5, 'triangle', 0.16 * amount, 30); }
    if (name === 'busted') { tone(440, 0.35, 'triangle', 0.09, 180); tone(220, 0.58, 'sine', 0.07, 80); }
    if (name === 'hospital') { tone(520, 0.24, 'sine', 0.07, 620); tone(780, 0.4, 'sine', 0.06, 980); }
    if (name === 'skid') noise(0.11, 0.06 * amount, 1900);
    if (name === 'horn') { tone(370, 0.22, 'square', 0.05); tone(466, 0.22, 'square', 0.04); }
    if (name === 'alarm') { tone(920, 0.09, 'square', 0.045); tone(698, 0.14, 'square', 0.035, 622); }
  }

  function musicTick() {
    const roots = [110, 130.81, 146.83, 98];
    const root = roots[Math.floor(musicStep / 8) % roots.length];
    const beat = musicStep % 8;
    if (beat === 0 || beat === 4) tone(root, 0.4, 'triangle', 0.035, root * 0.96);
    if (beat === 2 || beat === 6) { tone(root * 1.5, 0.65, 'sine', 0.014); tone(root * 1.9, 0.65, 'sine', 0.012); }
    noise(0.024, beat % 2 ? 0.006 : 0.01, 9000);
    musicStep += 1;
  }

  function update(game, dt) {
    if (!context) return;
    const now = context.currentTime;
    const car = game.state === 'playing' ? game.vehicle : null;
    const speed = car ? Math.abs(car.speed) : 0;
    engineGain.gain.setTargetAtTime(car ? Math.min(0.05, speed / 4200) : 0, now, 0.12);
    engineOsc.frequency.setTargetAtTime(52 + speed * 1.35, now, 0.1);
    const focus = game.vehicle || game.player;
    let closest = Infinity;
    for (const unit of game.police?.units || []) {
      const distance = Math.hypot(unit.x - focus.x, unit.y - focus.y);
      if (unit.health > 0 && distance < 430 && game.wanted?.seen) closest = Math.min(closest, distance);
    }
    sirenGain.gain.setTargetAtTime(Number.isFinite(closest) ? Math.max(0, 0.04 * (1 - closest / 480)) : 0, now, 0.2);
    sirenOsc.frequency.setTargetAtTime(Math.floor(now * 2) % 2 ? 620 : 790, now, 0.04);
    if (car?.handbraking && speed > 70) effect('skid', speed / 300);
    musicClock += dt;
    while (musicClock >= MUSIC_STEP) { musicClock -= MUSIC_STEP; musicTick(); }
  }

  function toggleMute() {
    muted = !muted;
    if (context) master.gain.setTargetAtTime(muted ? 0 : 0.2, context.currentTime, 0.04);
  }

  return { unlock, effect, update, toggleMute, get muted() { return muted; } };
}
