import { spawnPopup } from './popups.js';
import { awardRep, REP_PHOTO } from './rep.js';
import { FONT } from './config.js';

export const PHOTO_REWARD = 25;
export const PHOTO_RADIUS = 55;

export function photoSpots(world) {
  const fountain = world.props.find(prop => prop.kind === 'fountain');
  const diner = world.spawnPoints.diner;
  return [
    { name:'Pier End — Coral Bay', x:world.spawnPoints.pier.x, y:world.spawnPoints.pier.y },
    { name:'Boardwalk Palms', x:world.roads.vertical[6].x - 70, y:world.beach.y + 90 },
    { name:'Fountain Court', x:fountain ? fountain.x + 64 : world.roads.vertical[4].x, y:fountain ? fountain.y + 64 : world.beach.y + 70 },
    { name:'Marlin Diner', x:diner.x, y:diner.y + 62 },
    { name:'Harbor Crane', x:world.roads.vertical[6].x - 70, y:world.roads.horizontal[4].y - 70 },
  ];
}

export function createPhotos(record = null) {
  const taken = Array.isArray(record?.photos) ? [...new Set(record.photos.filter(n => Number.isInteger(n) && n >= 0 && n < 5))] : [];
  return { taken, dirty: false };
}

export function updatePhotos(photos, g, dt, input) {
  if (!photos || !g?.player || !g.world || g.vehicle || g.outcome || g.missions?.activity || g.missions?.dialogue) return -1;
  const spots = photoSpots(g.world);
  for (let i = 0; i < spots.length; i++) {
    if (Math.hypot(g.player.x - spots[i].x, g.player.y - spots[i].y) >= PHOTO_RADIUS) continue;
    if (photos.taken.includes(i) || !input?.wasPressed('KeyE')) return -1;
    photos.taken.push(i); photos.dirty = true;
    g.player.cash += PHOTO_REWARD;
    if (g.missions) g.missions.totalEarned += PHOTO_REWARD;
    spawnPopup(g.popups, g.player.x, g.player.y - 44, `POSTCARD · ${spots[i].name}`, '#f9d777');
    awardRep(g, REP_PHOTO);
    return i;
  }
  return -1;
}

export function drawPhotosWorld(ctx, photos, g, time) {
  if (!photos || !g?.world) return;
  const spots = photoSpots(g.world);
  const pulse = 1 + Math.sin(time * .005) * .12;
  ctx.save(); ctx.textAlign = 'center';
  spots.forEach((spot, i) => {
    const taken = photos.taken.includes(i);
    ctx.strokeStyle = taken ? '#9fb4b0aa' : '#f9d777cc'; ctx.fillStyle = taken ? '#9fb4b018' : '#f9d77722'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(spot.x, spot.y + 4, 30 * pulse, 14 * pulse, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = taken ? '#9fb4b0' : '#173d46';
    ctx.beginPath(); ctx.roundRect(spot.x - 9, spot.y - 30, 18, 13, 3); ctx.fill();
    ctx.fillRect(spot.x - 3, spot.y - 34, 6, 4);
    ctx.fillStyle = '#eaf6f4'; ctx.beginPath(); ctx.arc(spot.x, spot.y - 23.5, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.font = `bold 11px ${FONT}`; ctx.strokeStyle = '#173d46'; ctx.lineWidth = 4; ctx.fillStyle = '#fff3dc';
    ctx.strokeText(spot.name.toUpperCase(), spot.x, spot.y - 44); ctx.fillText(spot.name.toUpperCase(), spot.x, spot.y - 44);
    if (g.player && !g.vehicle && Math.hypot(g.player.x - spot.x, g.player.y - spot.y) < PHOTO_RADIUS) {
      ctx.font = `bold 12px ${FONT}`; ctx.fillStyle = taken ? '#c9d4d1' : '#ffe16d';
      const label = taken ? 'PHOTO TAKEN' : 'E · SNAP PHOTO';
      ctx.strokeText(label, spot.x, spot.y + 30); ctx.fillText(label, spot.x, spot.y + 30);
    }
  });
  ctx.restore();
}
