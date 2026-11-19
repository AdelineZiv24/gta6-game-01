import { createRandom } from './random.js';
import { FONT } from './config.js';

// Downtown storefront dressing: precomputed once per world from a
// deterministic per-building hash (no world rng draws consumed, so the rest
// of the world build is untouched), drawn as a pure overlay after the
// buildings. Zero gameplay state, zero save fields.
export const STOREFRONT_SIGNS = ['CORAL COLA', 'HOTEL MARLIN', 'PIER 9 SEAFOOD', 'BAY FM 101.3', 'CORAL FM 98.1', 'VOLTA MOTORS', 'CAFE', 'BAKERY', 'TACKLE', 'PAWN', 'HOTEL', 'DINER'];
export const STOREFRONT_AWNINGS = ['#d85d4e', '#287f86', '#d39b39', '#47704f', '#e05fd0', '#2fd4c4'];

export function downtownRect(world) {
  const v = world.roads.vertical, h = world.roads.horizontal;
  return { x0: v[2].x - 60, x1: v[4].x + 60, y0: h[2].y - 60, y1: h[4].y + 60 };
}

export function isDowntown(world, building) {
  const r = downtownRect(world), cx = building.x + building.width / 2, cy = building.y + building.height / 2;
  return cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1;
}

export function createStorefronts(world) {
  const out = [];
  for (const b of world.buildings) {
    const diner = Boolean(b.landmark && b.short === 'MARLIN DINER');
    if (!diner && !isDowntown(world, b)) continue;
    const rnd = createRandom(`bay-storefront:${b.id}:${Math.round(b.x)},${Math.round(b.y)}`);
    const sign = diner ? 'MARLIN DINER' : (b.storefront?.sign ?? STOREFRONT_SIGNS[Math.floor(rnd() * STOREFRONT_SIGNS.length)]);
    const awning = b.storefront?.color ?? STOREFRONT_AWNINGS[Math.floor(rnd() * STOREFRONT_AWNINGS.length)];
    const panes = 2 + Math.floor(rnd() * 3);
    out.push({ building: b.id, x: b.x, y: b.y, width: b.width, height: b.height, sign, awning, panes, ...(diner ? { openSign: true } : {}) });
  }
  return out;
}

export function drawStorefronts(ctx, world, view, night = 0) {
  if (!world.storefronts) return;
  for (const s of world.storefronts) {
    if (s.x + s.width < view.x - 20 || s.x > view.x + view.width + 20 || s.y + s.height < view.y - 20 || s.y > view.y + view.height + 20) continue;
    const bandY = s.y + s.height - 40 - (s.openSign ? 18 : 0);
    ctx.fillStyle = '#22282c'; ctx.fillRect(s.x + 5, bandY, s.width - 10, 40);
    ctx.fillStyle = 'rgba(255,244,214,.16)'; ctx.fillRect(s.x + 5, bandY, s.width - 10, 2);
    const boardW = Math.min(s.width - 14, 30 + s.sign.length * 7.4);
    const boardX = s.x + s.width / 2 - boardW / 2;
    ctx.fillStyle = '#14181b'; ctx.fillRect(boardX, bandY + 2, boardW, 15);
    ctx.fillStyle = s.awning; ctx.fillRect(boardX, bandY + 2, boardW, 2); ctx.fillRect(boardX, bandY + 15, boardW, 2);
    ctx.fillStyle = '#fff3dc'; ctx.font = `bold 11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.sign, s.x + s.width / 2, bandY + 9.5);
    ctx.fillStyle = s.awning; ctx.fillRect(s.x + 9, bandY + 19, s.width - 18, 8);
    ctx.fillStyle = '#fff2d5'; ctx.fillRect(s.x + 9, bandY + 25, s.width - 18, 2);
    const paneArea = s.width - 18, paneGap = 4;
    const paneW = (paneArea - paneGap * (s.panes - 1)) / s.panes;
    if (night > 0.05) { ctx.save(); ctx.globalAlpha = .16 * night; ctx.fillStyle = '#ffd98c'; ctx.fillRect(s.x + 9, bandY + 28, paneArea, 10); ctx.restore(); }
    ctx.fillStyle = night > 0.15 ? '#ffd98c' : '#8fb7bd';
    for (let i = 0; i < s.panes; i++) ctx.fillRect(s.x + 9 + i * (paneW + paneGap), bandY + 29, paneW, 8);
    if (s.openSign) {
      if (night > 0.05) { ctx.save(); ctx.globalAlpha = .30 * night; ctx.fillStyle = '#ff6b9d'; ctx.fillRect(s.x + 8, bandY + 28, paneW + 2, 10); ctx.restore(); }
      ctx.fillStyle = 'rgba(20,16,22,.85)'; ctx.fillRect(s.x + 9, bandY + 29, paneW, 8);
      ctx.fillStyle = '#ff8fb5'; ctx.font = `bold 8px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('OPEN', s.x + 9 + paneW / 2, bandY + 33.5);
    }
  }
}
