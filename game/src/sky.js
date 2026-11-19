import { WORLD } from './config.js';
import { billboardGlow } from './billboards.js';

const NIGHT = ['#0a1c38', '#14335e'];
const KEYFRAMES = [
  [0, NIGHT],
  [420, ['#46689c', '#f6b26b']],
  [720, ['#2f6fb8', '#a5d8ec']],
  [1100, ['#2e3a6e', '#ff8c4a']],
  [1320, NIGHT],
  [1440, NIGHT],
];

function wrapMinutes(clockMinutes) {
  return ((clockMinutes % 1440) + 1440) % 1440;
}

function interpolateColor(start, end, fraction) {
  let color = '#';
  for (const index of [1, 3, 5]) {
    const from = Number.parseInt(start.slice(index, index + 2), 16);
    const to = Number.parseInt(end.slice(index, index + 2), 16);
    color += Math.round(from + (to - from) * fraction).toString(16).padStart(2, '0');
  }
  return color;
}

export function skyStops(clockMinutes) {
  const minute = wrapMinutes(clockMinutes);
  const next = KEYFRAMES.findIndex(([time]) => time > minute);
  const [startTime, startColors] = KEYFRAMES[next - 1];
  const [endTime, endColors] = KEYFRAMES[next];
  const fraction = (minute - startTime) / (endTime - startTime);
  return startColors.map((color, offset) => ({
    offset,
    color: interpolateColor(color, endColors[offset], fraction),
  }));
}

export function celestial(clockMinutes) {
  const hour = wrapMinutes(clockMinutes);
  if (hour >= 330 && hour <= 1170) {
    const u = (hour - 330) / 840;
    const elevation = Math.sin(u * Math.PI);
    return { kind: 'sun', fx: u, elevation, color: elevation < 0.3 ? '#ff9448' : '#ffd968', radius: 26 };
  }
  const u = ((hour + 1440 - 1170) % 1440) / 600;
  return { kind: 'moon', fx: u, elevation: Math.sin(u * Math.PI) * 0.8 + 0.1, color: '#e9edf5', radius: 19 };
}

export function drawSkyGradient(context, world, view, clockMinutes) {
  const x0 = Math.max(view.x, 0);
  const x1 = Math.min(view.x + view.width, WORLD.width);
  const y0 = Math.max(view.y, world.water.y);
  const y1 = Math.min(view.y + view.height, WORLD.height);
  if (x1 <= x0 || y1 <= y0) return;

  const gradient = context.createLinearGradient(0, world.water.y, 0, WORLD.height);
  for (const { offset, color } of skyStops(clockMinutes)) gradient.addColorStop(offset, color);
  context.fillStyle = gradient;
  context.fillRect(x0, y0, x1 - x0, y1 - y0);
}

function fillCircle(context, x, y, radius) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

export function drawCelestial(context, world, view, clockMinutes) {
  const cel = celestial(clockMinutes);
  const cx = cel.fx * WORLD.width;
  const cy = world.water.y + (1 - cel.elevation) * (WORLD.height - world.water.y) * 0.6 + 16;
  const margin = cel.radius * 2;
  if (cx + margin < view.x || cx - margin > view.x + view.width ||
      cy + margin < view.y || cy - margin > view.y + view.height) return;

  context.save();
  context.globalAlpha = 0.35;
  context.fillStyle = cel.color;
  fillCircle(context, cx, cy, cel.radius * 1.9);
  context.globalAlpha = 1;
  fillCircle(context, cx, cy, cel.radius);
  if (cel.kind === 'moon') {
    context.fillStyle = 'rgba(120,135,160,0.35)';
    fillCircle(context, cx - 6, cy - 3, 4);
    fillCircle(context, cx + 5, cy + 6, 3);
  }
  for (let i = 0; i < 8; i += 1) {
    const ry = cy + cel.radius + 6 + i * 7;
    if (ry > WORLD.height) break;
    const w = cel.radius * (1.6 - i * 0.14) * (0.75 + 0.25 * Math.sin(ry * 1.7));
    context.globalAlpha = 0.20 * (1 - i / 9);
    context.fillStyle = cel.color;
    context.fillRect(cx - w / 2 + Math.sin(ry * 0.9) * 3, ry, w, 2.4);
  }
  context.restore();
}

export function drawWetReflections(context, world, view, night, intensity, timeSeconds) {
  if (!(intensity > 0)) return;

  const sources = [];
  for (const b of world.billboards || []) {
    sources.push({
      x: b.x + b.width / 2, y: b.building.y + b.building.height, w: b.width * 0.62, len: 64,
      color: billboardGlow(b, timeSeconds), base: intensity * (0.14 + 0.44 * night),
    });
  }
  for (const building of world.buildings) {
    if (!building.storefront) continue;
    sources.push({
      x: building.x + building.width / 2, y: building.y + building.height,
      w: building.width * 0.44, len: 58, color: building.storefront.color,
      base: intensity * (0.12 + 0.40 * night),
    });
  }
  for (const prop of world.props) {
    if (prop.kind !== 'lamp') continue;
    sources.push({
      x: prop.x + 9, y: prop.y + 10, w: 26, len: 40,
      color: '#ffd98c', base: intensity * (night > 0.15 ? 0.38 : 0.04),
    });
  }

  context.save();
  context.beginPath();
  for (const road of world.roads.horizontal) {
    context.rect(0, road.y - road.width / 2, WORLD.width, road.width);
  }
  for (const road of world.roads.vertical) {
    context.rect(road.x - road.width / 2, 0, road.width, road.length);
  }
  context.clip();
  for (const source of sources) {
    if (source.base <= 0.01 || source.x < view.x - 80 || source.x > view.x + view.width + 80 ||
        source.y < view.y - 80 || source.y > view.y + view.height + 80) continue;
    for (let i = 0; i < 6; i += 1) {
      const alpha = source.base * Math.pow(1 - i / 6, 1.6);
      if (alpha < 0.01) continue;
      context.fillStyle = source.color;
      context.globalAlpha = alpha;
      const sw = source.w * (1 - i * 0.06);
      context.fillRect(source.x - sw / 2, source.y + i * (source.len / 6), sw, source.len / 6 + 1);
    }
  }
  context.restore();
}
