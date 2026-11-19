import { createRandom } from './random.js';

export const FIREWORK_COLORS = ['#ff5d5d', '#ffd166', '#6ee7ff', '#ff8ae2', '#a8e063'];
export const FIREWORK_NIGHT = .5;

export function createFireworks() {
  return { rockets: [], sparks: [], timer: 1.6, bursts: 0, lastBurst: null, burstPoints: [], random: createRandom('coral-bay-fireworks') };
}

export function fireworkLaunchPoint(world) { return world.spawnPoints.pier; }

function launch(fw, world) {
  const p = fireworkLaunchPoint(world);
  fw.rockets.push({ x: p.x + (fw.random() * 36 - 18), y: p.y, vy: -(290 + fw.random() * 70), fuse: 1.02 + fw.random() * .25, color: FIREWORK_COLORS[Math.floor(fw.random() * FIREWORK_COLORS.length)] });
}

function burst(fw, rocket) {
  fw.bursts++;
  fw.lastBurst = { x: rocket.x, y: rocket.y };
  fw.burstPoints.push(fw.lastBurst); if (fw.burstPoints.length > 12) fw.burstPoints.shift();
  const n = 24 + Math.floor(fw.random() * 8);
  for (let i = 0; i < n; i++) {
    const angle = i / n * Math.PI * 2 + fw.random() * .25, speed = 70 + fw.random() * 130, life = .8 + fw.random() * .5;
    fw.sparks.push({ x: rocket.x, y: rocket.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, max: life, color: rocket.color });
  }
}

export function stageFireworksShot(fw, focus) {
  fw.rockets.push({ x: focus.x + 170, y: focus.y + 170, vy: -300, fuse: .9, color: '#ffd166' });
  fw.rockets.push({ x: focus.x - 140, y: focus.y + 190, vy: -310, fuse: 1.5, color: '#6ee7ff' });
  fw.rockets.push({ x: focus.x + 120, y: focus.y + 150, vy: -295, fuse: 2.05, color: '#ff8ae2' });
  fw.rockets.push({ x: focus.x - 180, y: focus.y + 210, vy: -315, fuse: 2.6, color: '#a8e063' });
}

export function updateFireworks(fw, world, night, dt) {
  if (!fw) return;
  if (night > FIREWORK_NIGHT) { fw.timer -= dt; if (fw.timer <= 0) { launch(fw, world); fw.timer = 6 + fw.random() * 3; } }
  for (let i = fw.rockets.length - 1; i >= 0; i--) { const r = fw.rockets[i]; r.y += r.vy * dt; r.vy += 55 * dt; r.fuse -= dt; if (r.fuse <= 0) { fw.rockets.splice(i, 1); burst(fw, r); } }
  for (const s of fw.sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 95 * dt; const drag = Math.exp(-.6 * dt); s.vx *= drag; s.vy *= drag; }
  fw.sparks = fw.sparks.filter(s => s.life > 0);
}

export function drawFireworks(ctx, fw) {
  if (!fw) return;
  ctx.save();
  for (const r of fw.rockets) { ctx.globalAlpha = .9; ctx.strokeStyle = '#ffe6a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, r.y + 12); ctx.lineTo(r.x, r.y); ctx.stroke(); ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(r.x, r.y, 2.4, 0, Math.PI * 2); ctx.fill(); }
  for (const s of fw.sparks) { ctx.globalAlpha = Math.max(0, s.life / s.max); ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
