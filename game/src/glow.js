import { sprayGarages, SPRAY_RADIUS } from './spray.js';
import { spawnPopup } from './popups.js';
import { headlightLevel } from './vehicles.js';

export const GLOW_INSTALL = 200;
export const GLOW_CYCLE = 50;
export const GLOW_DWELL = 0.8;
export const GLOW_COLORS = [
  { name: 'CYAN', hex: '#2fd4c4' },
  { name: 'MAGENTA', hex: '#e05fd0' },
  { name: 'LIME', hex: '#a8e063' },
];

export function createGlow(record = null) {
  const color = Number.isInteger(record?.glow) ? Math.max(-1, Math.min(2, record.glow)) : -1;
  return { color, installed: color >= 0 || record?.glowInstalled === true, zoneT: 0, armed: true, noticeAt: -99, dirty: false };
}

export function glowAlpha(clockMinutes) {
  return 0.18 + 0.55 * headlightLevel(clockMinutes);
}

export function updateGlow(glow, g, dt) {
  if (!glow || !g?.vehicle || g.outcome) return false;
  const car = g.vehicle;
  const garage = sprayGarages(g.world)[0];
  if (!garage) return false;
  const inside = Math.hypot(garage.x - car.x, garage.y - car.y) <= SPRAY_RADIUS && Math.abs(car.speed) <= 30;
  if (!inside) { glow.zoneT = 0; glow.armed = true; return false; }
  const needs = car.health < 100 || (g.wanted?.stars ?? 0) > 0;
  if (needs || !glow.armed) { glow.zoneT = 0; return false; }
  glow.zoneT += dt;
  if (glow.zoneT < GLOW_DWELL) return false;
  const price = glow.color < 0 && !glow.installed ? GLOW_INSTALL : GLOW_CYCLE;
  if (g.player.cash < price) {
    if (g.playSeconds - glow.noticeAt > 2.5) { glow.noticeAt = g.playSeconds; g.notice = `NEED $${price}`; g.noticeUntil = g.playSeconds + 2; }
    return false;
  }
  g.player.cash -= price;
  glow.installed = true;
  glow.color = glow.color < 0 ? 0 : (glow.color >= GLOW_COLORS.length - 1 ? -1 : glow.color + 1);
  glow.dirty = true; glow.zoneT = 0; glow.armed = false;
  const label = glow.color >= 0 ? `UNDERGLOW · ${GLOW_COLORS[glow.color].name} · $${price}` : `UNDERGLOW OFF · $${price}`;
  spawnPopup(g.popups, car.x, car.y - 44, 'NEON UNDERGLOW', glow.color >= 0 ? GLOW_COLORS[glow.color].hex : '#c9d4d1');
  g.notice = label; g.noticeUntil = g.playSeconds + 2;
  return true;
}

export function drawUnderglow(ctx, g, time) {
  const glow = g?.glow, car = g?.vehicle;
  if (!glow || glow.color < 0 || !car) return;
  const alpha = glowAlpha(g.clockMinutes ?? 720);
  const l = car.model.length, w = car.model.width;
  ctx.save();
  ctx.translate(car.x, car.y); ctx.rotate(car.heading);
  ctx.fillStyle = GLOW_COLORS[glow.color].hex;
  ctx.globalAlpha = alpha * 0.55;
  ctx.beginPath(); ctx.ellipse(0, 3, l * 0.8, w * 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.ellipse(0, 3, l * 0.62, w * 0.98, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
