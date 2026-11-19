import { spawnPopup } from './popups.js';
import { FONT } from './config.js';

export const SPIKE_SPEED = 60;
export const SPIKE_CAP = 60;
export const SPIKE_TIME = 6;
export const SPIKE_HALF = 34;

export function spikeStrip(roadblock) {
  if (!roadblock) return null;
  return { x: roadblock.x, y: roadblock.y, dirX: roadblock.dirX, dirY: roadblock.dirY, px: -roadblock.dirY, py: roadblock.dirX, half: SPIKE_HALF };
}

export function updateSpikes(police, g, dt) {
  const car = g?.vehicle;
  if (!police || !car) return;
  const strip = spikeStrip(police.roadblock);
  if (!strip || car.spikedT > 0) return;
  const dx = car.x - strip.x, dy = car.y - strip.y;
  const along = dx * strip.dirX + dy * strip.dirY;
  const across = dx * strip.px + dy * strip.py;
  if (Math.abs(along) > car.radius + 6 || Math.abs(across) > strip.half) return;
  if (Math.hypot(car.vx, car.vy) <= SPIKE_SPEED) return;
  car.spikedT = SPIKE_TIME;
  spawnPopup(g.popups, car.x, car.y - 44, 'TYRES SPIKED', '#ef826c');
}

export function drawSpikes(ctx, police, time) {
  const strip = spikeStrip(police?.roadblock);
  if (!strip) return;
  ctx.save();
  ctx.translate(strip.x, strip.y);
  ctx.rotate(Math.atan2(strip.dirY, strip.dirX));
  const seg = (strip.half * 2) / 8;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#20262b' : '#ffd37b';
    ctx.fillRect(-12, -strip.half + i * seg, 4, seg);
    ctx.fillRect(8, -strip.half + i * seg, 4, seg);
  }
  ctx.fillStyle = '#20262b';
  ctx.fillRect(-8, -strip.half, 16, strip.half * 2);
  ctx.fillStyle = '#39434b';
  ctx.fillRect(-8, -strip.half, 6, strip.half * 2);
  const glint = Math.floor(time / 300) % 2;
  for (let i = 0; i < 9; i++) {
    const y = -strip.half + 4 + i * (strip.half * 2 - 8) / 8;
    ctx.fillStyle = (i + glint) % 2 ? '#ffffff' : '#cfe3e8';
    ctx.beginPath(); ctx.arc(0, y, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#ffd37b'; ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    const y = -strip.half + 4 + i * (strip.half * 2 - 8) / 8;
    ctx.beginPath(); ctx.moveTo(-5, y - 3); ctx.lineTo(1, y); ctx.lineTo(-5, y + 3); ctx.stroke();
  }
  for (const s of [-1, 1]) {
    const cy = s * (strip.half + 12);
    ctx.fillStyle = '#20262b'; ctx.fillRect(-6, cy - 6, 12, 12);
    ctx.fillStyle = '#e8762d';
    ctx.beginPath(); ctx.arc(0, cy, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3dc';
    ctx.beginPath(); ctx.arc(0, cy, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8762d';
    ctx.beginPath(); ctx.arc(0, cy, 1.7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
