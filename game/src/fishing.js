import { createRandom } from './random.js';
import { spawnPopup } from './popups.js';
import { awardRep, REP_FISHING } from './rep.js';
import { FONT } from './config.js';

export const FISHING_WINDOW = 1.2;
export const FISH_SPECIES = [
  { name:'Coral Sprat', minKg:0.2, maxKg:0.9, value:5, weight:40 },
  { name:'Sunbleak', minKg:0.4, maxKg:1.2, value:9, weight:26 },
  { name:'Tide Runner', minKg:0.8, maxKg:2.4, value:18, weight:17 },
  { name:'Amber Reefjack', minKg:1.5, maxKg:4.2, value:36, weight:10 },
  { name:'Dusk Grouper', minKg:2.5, maxKg:6.8, value:70, weight:5 },
  { name:'Gilded Marlin', minKg:4.0, maxKg:11.5, value:160, weight:2 },
];

export function fishingPoint(world) {
  return { x: world.pier.x + world.pier.width / 2, y: world.water.y - 16 };
}

export function createFishing() {
  return { phase:'idle', t:0, waitFor:0, caught:0, lastCatch:'', point:null, rng:createRandom('coral-bay-fishing') };
}

export function pickFish(rng) {
  const total = FISH_SPECIES.reduce((sum, fish) => sum + fish.weight, 0);
  let roll = rng() * total;
  for (const fish of FISH_SPECIES) { roll -= fish.weight; if (roll < 0) return fish; }
  return FISH_SPECIES[0];
}

export function startFishing(fishing, g) {
  if (!fishing || fishing.phase !== 'idle' || g.vehicle || g.outcome || !g.world || !g.player || g.missions?.activity) return false;
  const point = fishingPoint(g.world);
  fishing.phase = 'cast'; fishing.t = 0; fishing.point = point;
  g.player.facing = Math.PI / 2;
  if (g.missions) { g.missions.activity = 'fishing'; g.missions.objective = 'Fishing · line out…'; g.missions.marker = null; }
  spawnPopup(g.popups, point.x, point.y - 44, 'FISHING · CAST!', '#7be3f0');
  return true;
}

function abortFishing(fishing, g) {
  fishing.phase = 'idle'; fishing.t = 0;
  if (g.missions?.activity === 'fishing') { g.missions.activity = null; g.missions.marker = null; }
}

function catchFish(fishing, g) {
  const fish = pickFish(fishing.rng);
  const kg = Math.round((fish.minKg + fishing.rng() * (fish.maxKg - fish.minKg)) * 10) / 10;
  fishing.caught++; fishing.lastCatch = `${fish.name} ${kg.toFixed(1)} kg`;
  g.player.cash += fish.value;
  const state = g.missions;
  if (state) {
    state.totalEarned += fish.value;
    state.splash = { header:'FISHING', name:`${fish.name} · ${kg.toFixed(1)} kg`, reward:fish.value, total:g.player.cash, until:(g.playSeconds || 0) + 2.8 };
  }
  spawnPopup(g.popups, g.player.x, g.player.y - 44, `CAUGHT · ${fish.name} ${kg.toFixed(1)} kg · +$${fish.value}`, '#8df0a5');
  awardRep(g, REP_FISHING);
  fishing.phase = 'cast'; fishing.t = 0;
}

export function updateFishing(fishing, g, dt, input) {
  if (!fishing || !g.player) return;
  const point = fishing.point || (g.world ? fishingPoint(g.world) : null);
  if (fishing.phase === 'idle') {
    if (point && !g.vehicle && !g.outcome && !g.missions?.activity && Math.hypot(g.player.x - point.x, g.player.y - point.y) < 55 && input?.wasPressed('KeyE')) startFishing(fishing, g);
    return;
  }
  if (g.outcome || g.vehicle || (point && Math.hypot(g.player.x - point.x, g.player.y - point.y) > 70)) { abortFishing(fishing, g); return; }
  fishing.t += dt;
  const state = g.missions;
  if (fishing.phase === 'cast') {
    if (state) state.objective = 'Fishing · line out…';
    if (fishing.t >= 0.8) { fishing.phase = 'wait'; fishing.t = 0; fishing.waitFor = 2.2 + fishing.rng() * 2.6; }
  } else if (fishing.phase === 'wait') {
    if (state) state.objective = 'Fishing · wait for a bite';
    if (fishing.t >= fishing.waitFor) {
      fishing.phase = 'bite'; fishing.t = 0;
      spawnPopup(g.popups, g.player.x, g.player.y - 52, '!', '#ef826c', FISHING_WINDOW);
    }
  } else if (fishing.phase === 'bite') {
    if (state) state.objective = 'Fishing · BITE! Press E';
    if (input?.wasPressed('KeyE')) catchFish(fishing, g);
    else if (fishing.t >= FISHING_WINDOW) {
      spawnPopup(g.popups, g.player.x, g.player.y - 44, 'IT GOT AWAY', '#ef826c');
      fishing.phase = 'cast'; fishing.t = 0;
    }
  }
  if (state && state.activity === 'fishing') g.objective = { text: state.objective, position: null };
}

export function drawFishingWorld(ctx, fishing, g, time) {
  if (!fishing || !g.world) return;
  const point = fishing.point || fishingPoint(g.world);
  ctx.save(); ctx.textAlign = 'center'; ctx.lineWidth = 4;
  const pulse = 1 + Math.sin(time * .005) * .12;
  if (fishing.phase === 'idle') {
    ctx.strokeStyle = '#7be3f0cc'; ctx.fillStyle = '#7be3f022';
    ctx.beginPath(); ctx.ellipse(point.x, point.y + 4, 30 * pulse, 14 * pulse, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = `bold 13px ${FONT}`; ctx.strokeStyle = '#173d46'; ctx.fillStyle = '#fff3dc';
    ctx.strokeText('FISHING', point.x, point.y - 26); ctx.fillText('FISHING', point.x, point.y - 26);
  } else if (g.player) {
    const px = g.player.x, py = g.player.y, f = g.player.facing;
    const tipX = px + Math.cos(f) * 30, tipY = py + Math.sin(f) * 30 - 8;
    const bobX = point.x + 6, bobY = g.world.water.y + 34;
    ctx.strokeStyle = '#31456b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tipX, tipY); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,243,220,.75)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(bobX, bobY); ctx.stroke();
    const dip = fishing.phase === 'bite' ? Math.sin(time * .03) * 2 : 0;
    ctx.fillStyle = '#e85f51'; ctx.beginPath(); ctx.arc(bobX, bobY + dip, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3dc'; ctx.beginPath(); ctx.arc(bobX, bobY + dip, 1.6, 0, Math.PI * 2); ctx.fill();
    if (fishing.phase === 'bite') {
      ctx.strokeStyle = 'rgba(255,243,220,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(bobX, bobY, 8 + (time * .02) % 8, 4 + (time * .02) % 4, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
}
