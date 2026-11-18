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
  ctx.fillStyle = '#20262b';
  ctx.fillRect(-4, -strip.half, 8, strip.half * 2);
  ctx.fillStyle = '#39434b';
  ctx.fillRect(-4, -strip.half, 3, strip.half * 2);
  const glint = Math.floor(time / 300) % 2;
  for (let i = 0; i < 9; i++) {
    const y = -strip.half + 4 + i * (strip.half * 2 - 8) / 8;
    ctx.fillStyle = (i + glint) % 2 ? '#c8d4d8' : '#7e8f96';
    ctx.beginPath(); ctx.arc(0, y, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
