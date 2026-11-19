import { gasStations } from './fuel.js';
import { damagePlayer } from './combat.js';

export const BARREL_RADIUS = 115;
export const BARREL_CHAIN_RADIUS = 125;
export const BARREL_CAR_DAMAGE = 55;
export const BARREL_FUSE = .12;
export const BARREL_CHAIN_DELAY = .35;

export function barrelPositions(world) {
  const v = world.roads.vertical, h = world.roads.horizontal, out = [];
  for (const s of gasStations(world)) { out.push({ x: s.x - 58, y: s.y + 8 }); out.push({ x: s.x + 58, y: s.y - 8 }); }
  out.push({ x: v[3].x + 52, y: h[2].y - 30 });
  out.push({ x: v[6].x + 52, y: h[5].y - 30 });
  out.push({ x: v[1].x + 52, y: h[5].y - 30 });
  out.push({ x: v[6].x - 52, y: h[1].y + 30 });
  return out;
}

export function createBarrels(world) {
  return { list: barrelPositions(world).map(p => ({ x: p.x, y: p.y, state: 'idle', timer: 0 })), particles: [], flash: null, bursts: 0 };
}

function detonate(state, game, barrel, cars, people, report) {
  barrel.state = 'gone';
  state.bursts++;
  state.flash = { x: barrel.x, y: barrel.y, life: .22, max: .22 };
  game.audio?.effect('explosion');
  report('explosion', barrel.x, barrel.y, 4, true);
  for (let i = 0; i < 26; i++) {
    const angle = i / 26 * Math.PI * 2 + (i % 5) * .13, smoke = i >= 18;
    const speed = smoke ? 18 + (i % 4) * 9 : 46 + (i % 7) * 31;
    const life = smoke ? 1.3 + (i % 3) * .25 : .55 + (i % 4) * .16;
    state.particles.push({ x: barrel.x, y: barrel.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, max: life, size: smoke ? 5 + (i % 3) * 2 : 2.4 + (i % 3), smoke, color: smoke ? '#7d8380' : ['#ffb02e', '#ff7a3c', '#ffe6a0'][i % 3] });
  }
  if (state.particles.length > 200) state.particles.splice(0, state.particles.length - 200);
  for (const car of cars) {
    const d = Math.hypot(car.x - barrel.x, car.y - barrel.y);
    if (d < BARREL_RADIUS) { car.health = Math.max(0, car.health - BARREL_CAR_DAMAGE); if (car === game.vehicle) damagePlayer(game, 10); }
  }
  if (!game.vehicle && game.player && Math.hypot(game.player.x - barrel.x, game.player.y - barrel.y) < BARREL_RADIUS) damagePlayer(game, 25);
  for (const p of people) {
    if (p.state === 'down') continue;
    const d = Math.hypot(p.x - barrel.x, p.y - barrel.y);
    if (d < 70) p.state = 'down'; else if (d < 150) p.panic = Math.max(p.panic || 0, 6);
  }
  for (const other of state.list) if (other !== barrel && other.state === 'idle' && Math.hypot(other.x - barrel.x, other.y - barrel.y) < BARREL_CHAIN_RADIUS) { other.state = 'lit'; other.timer = BARREL_CHAIN_DELAY; }
}

export function updateBarrels(state, game, cars, people, report, dt) {
  if (!state) return;
  for (const barrel of state.list) if (barrel.state === 'lit') { barrel.timer -= dt; if (barrel.timer <= 0) detonate(state, game, barrel, cars, people, report); }
  for (const p of state.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; const drag = Math.exp(-2 * dt); p.vx *= drag; p.vy = p.vy * drag + (p.smoke ? -16 : 120) * dt; }
  state.particles = state.particles.filter(p => p.life > 0);
  if (state.flash) { state.flash.life -= dt; if (state.flash.life <= 0) state.flash = null; }
}

export function drawBarrelsWorld(ctx, state, time) {
  if (!state) return;
  ctx.save();
  for (const b of state.list) {
    if (b.state === 'gone') { ctx.globalAlpha = .45; ctx.fillStyle = '#23282a'; ctx.beginPath(); ctx.ellipse(b.x, b.y, 27, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; continue; }
    ctx.fillStyle = 'rgba(38,66,64,.25)'; ctx.beginPath(); ctx.ellipse(b.x + 2, b.y + 4, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c23b2e'; ctx.beginPath(); ctx.roundRect(b.x - 9, b.y - 13, 18, 26, 4); ctx.fill();
    ctx.fillStyle = '#8e2718'; ctx.fillRect(b.x - 9, b.y - 4, 18, 3); ctx.fillRect(b.x - 9, b.y + 5, 18, 3);
    ctx.fillStyle = '#fff3dc'; ctx.fillRect(b.x - 9, b.y - 1, 18, 2);
    ctx.fillStyle = '#7a1f14'; ctx.beginPath(); ctx.ellipse(b.x, b.y - 13, 9, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    if (b.state === 'lit') { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(b.x, b.y - 17, 2.6 + Math.sin(time * .09) * 1.1, 0, Math.PI * 2); ctx.fill(); }
  }
  if (state.flash) {
    const f = state.flash, t = 1 - f.life / f.max;
    ctx.globalAlpha = (1 - t) * .85; ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.arc(f.x, f.y, 18 + t * 74, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = (1 - t) * .9; ctx.fillStyle = '#ffe6a0'; ctx.beginPath(); ctx.arc(f.x, f.y, 9 + t * 40, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (const p of state.particles) { ctx.globalAlpha = Math.max(0, p.life / p.max) * (p.smoke ? .5 : .95); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size + (p.smoke ? (1 - p.life / p.max) * 7 : 0), 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
