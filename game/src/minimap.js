import { WORLD, FONT } from './config.js';
import { gasStations } from './fuel.js';
import { sprayGarages } from './spray.js';
import { martShops, dinerShops } from './robbery.js';

// Minimap HUD (brief-31): the circular bottom-left radar the game has
// shipped since v1, extracted from hud.js into its own module and brought
// to full spec — road-grid base image (render.js drawMinimapBase, painted
// once), player arrow, police blips that flash red/blue on the game clock
// while wanted, a gold objective diamond, gas dots, and square shop
// markers for CORAL SPRAY / CORAL MART / the Marlin Diner. Pure draw:
// no state of its own, no save fields.
export const MINIMAP_SCALE = .145;
export const OBJECTIVE_BLIP_COLOR = '#ffd94d';
export const POLICE_BLIP_COLOR = '#56c9e5';
export const POLICE_FLASH_COLOR = '#e5484d';

export function minimapRadius(w, h) { return Math.min(84, w * .19, h * .2); }
export function minimapCenter(w, h) { const r = minimapRadius(w, h); return { x: 24 + r, y: h - 24 - r, r }; }
export function minimapRect(w, h) { const c = minimapCenter(w, h); return { x: c.x - c.r, y: c.y - c.r, width: c.r * 2, height: c.r * 2 }; }

export function projectBlip(dx, dy, radius, margin) {
  const limit = Math.max(0, radius - margin), d = Math.hypot(dx, dy);
  if (d > limit && d > 0) { const k = limit / d; return { x: dx * k, y: dy * k, clamped: true }; }
  return { x: dx, y: dy, clamped: false };
}

export function policeBlipColor(stars, playSeconds) {
  if (!stars) return POLICE_BLIP_COLOR;
  return Math.floor(playSeconds * 2) % 2 === 0 ? POLICE_FLASH_COLOR : POLICE_BLIP_COLOR;
}

export function shopMarkers(world) {
  if (!world) return [];
  const out = [];
  for (const g of sprayGarages(world)) out.push({ kind: 'spray', x: g.x, y: g.y, color: '#2fd4c4' });
  for (const s of martShops(world)) out.push({ kind: 'mart', x: s.x, y: s.y, color: '#e7b954' });
  for (const s of dinerShops(world)) out.push({ kind: 'diner', x: s.x, y: s.y, color: '#fa8c55' });
  return out;
}

export function drawMinimap(ctx, game, w, h) {
  const { player, minimap, objective } = game;
  const { x: cx, y: cy, r: radius } = minimapCenter(w, h), scale = MINIMAP_SCALE;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#72a879'; ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.drawImage(minimap, cx - player.x * scale, cy - player.y * scale, WORLD.width * scale, WORLD.height * scale);
  if (objective?.position) {
    const p = projectBlip((objective.position.x - player.x) * scale, (objective.position.y - player.y) * scale, radius, 12);
    ctx.fillStyle = OBJECTIVE_BLIP_COLOR; ctx.strokeStyle = '#173d46'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(cx + p.x, cy + p.y - 8); ctx.lineTo(cx + p.x + 7, cy + p.y); ctx.lineTo(cx + p.x, cy + p.y + 8); ctx.lineTo(cx + p.x - 7, cy + p.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  const copColor = policeBlipColor(game.wanted?.stars ?? 0, game.playSeconds || 0);
  for (const unit of game.police?.units || []) {
    const p = projectBlip((unit.car.x - player.x) * scale, (unit.car.y - player.y) * scale, radius, 8);
    ctx.fillStyle = copColor; ctx.strokeStyle = '#123d5b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx + p.x, cy + p.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  const heli = game.police?.heli;
  if (heli) {
    const p = projectBlip((heli.x - player.x) * scale, (heli.y - player.y) * scale, radius, 8);
    ctx.fillStyle = '#eafcff'; ctx.strokeStyle = '#0e5a74'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx + p.x, cy + p.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(234,252,255,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx + p.x, cy + p.y, 9, 0, Math.PI * 2); ctx.stroke();
  }
  if (game.world) for (const station of gasStations(game.world)) {
    const p = projectBlip((station.x - player.x) * scale, (station.y - player.y) * scale, radius, 8);
    ctx.fillStyle = '#f9a03f'; ctx.strokeStyle = '#173d46'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx + p.x, cy + p.y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  if (game.world) for (const m of shopMarkers(game.world)) {
    const p = projectBlip((m.x - player.x) * scale, (m.y - player.y) * scale, radius, 8);
    ctx.fillStyle = m.color; ctx.strokeStyle = '#173d46'; ctx.lineWidth = 1.5;
    ctx.fillRect(cx + p.x - 3.5, cy + p.y - 3.5, 7, 7); ctx.strokeRect(cx + p.x - 3.5, cy + p.y - 3.5, 7, 7);
  }
  ctx.translate(cx, cy); ctx.rotate(player.facing);
  if (game.vehicle) { ctx.fillStyle = game.vehicle.color; ctx.fillRect(-10, -5, 20, 10); ctx.fillStyle = '#173c49'; ctx.fillRect(-3, -4, 7, 8); }
  else { ctx.fillStyle = '#fff9e6'; ctx.strokeStyle = '#17424b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, 7); ctx.lineTo(-3, 0); ctx.lineTo(-7, -7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#fff1d9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = '#163e47'; ctx.font = `bold 11px ${FONT}`; ctx.fillText('N', cx, cy - radius + 13);
}
