import { createRandom, clamp } from './random.js';

// Vehicle damage visuals: damage is derived from the health the collision
// physics already writes (resolveCarContacts + wall impacts in vehicles.js),
// so this module adds no physics and no save fields — only a pooled smoke /
// flame particle layer whose rate and darkness scale with damage.
export const SMOKE_START = 25;
export const PLUME_START = 50;
export const FLAME_START = 80;
const POOL_SIZE = 260;

export function damageOf(car) {
  return clamp(100 - (car?.health ?? 100), 0, 100);
}

export function smokeBand(damage) {
  return damage >= FLAME_START ? 3 : damage >= PLUME_START ? 2 : damage >= SMOKE_START ? 1 : 0;
}

export function smokeRate(damage) {
  const band = smokeBand(damage);
  return band === 1 ? 6 : band === 2 ? 15 : band === 3 ? 28 : 0;
}

export function createDamageSmoke() {
  return {
    particles: Array.from({ length: POOL_SIZE }, () => ({ life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0, size: 3, gray: 120, color: '', flame: false })),
    cursor: 0, emitted: 0, carry: new WeakMap(), random: createRandom('bay-damage-smoke'),
  };
}

function emit(state, car, band) {
  const p = state.particles[state.cursor++ % state.particles.length];
  const r = state.random;
  const fx = car.x + Math.cos(car.heading) * car.model.length * .3;
  const fy = car.y + Math.sin(car.heading) * car.model.length * .3;
  p.flame = band === 3 && r() < .45;
  p.color = r() < .5 ? '#ffb02e' : '#ff7a3c';
  p.x = fx + (r() - .5) * 9; p.y = fy + (r() - .5) * 9;
  p.vx = (r() - .5) * 12; p.vy = -11 - r() * 15;
  p.max = p.life = p.flame ? .34 + r() * .26 : 1.05 + r() * .95;
  p.size = p.flame ? 2.4 + r() * 2.2 : 3.4 + r() * 3.2 + (band === 2 ? 1.6 : 0);
  p.gray = band === 1 ? 148 + Math.floor(r() * 22) : band === 2 ? 92 + Math.floor(r() * 22) : 44 + Math.floor(r() * 18);
  state.emitted++;
}

export function updateDamageSmoke(state, cars, dt) {
  if (!state) return;
  for (const p of state.particles) {
    if (p.life <= 0) continue;
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy -= (p.flame ? 30 : 13) * dt; p.vx *= Math.exp(-1.1 * dt);
  }
  for (const car of cars) {
    const damage = damageOf(car), rate = smokeRate(damage);
    if (rate <= 0) { state.carry.delete(car); continue; }
    let acc = (state.carry.get(car) || 0) + rate * dt;
    const band = smokeBand(damage);
    while (acc >= 1) { acc -= 1; emit(state, car, band); }
    state.carry.set(car, acc);
  }
}

export function drawDamageSmoke(ctx, state) {
  if (!state) return;
  ctx.save();
  for (const p of state.particles) {
    if (p.life <= 0) continue;
    const t = p.life / p.max;
    if (p.flame) {
      ctx.globalAlpha = Math.min(1, t * 1.5) * .92;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * t + .6, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.globalAlpha = Math.min(1, (1 - t) * 3) * t * .5;
      ctx.fillStyle = `rgb(${p.gray},${p.gray},${p.gray})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size + (1 - t) * 10, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
