import { createRandom } from './random.js';
import { spawnPopup } from './popups.js';
import { awardRep, REP_COURIER } from './rep.js';
import { FONT } from './config.js';

export const COURIER_BASE = 120;
export const COURIER_PER_SECOND = 4;
export const COURIER_MIN_DISTANCE = 1200;

export function courierStartPoint(world) {
  return { x: world.roads.vertical[5].x, y: world.roads.horizontal[1].y };
}

export function courierDoors(world) {
  const v = world.roads.vertical, h = world.roads.horizontal, s = world.spawnPoints;
  return [
    { name:'Coral Bay General', x:s.hospital.x, y:s.hospital.y },
    { name:'CBPD Station', x:s.police.x, y:s.police.y },
    { name:'Marlin Diner', x:s.diner.x, y:s.diner.y },
    { name:'Marlin Auto Works', x:s.garage.x, y:s.garage.y },
    { name:'Seabreeze Apartments', x:s.safehouse.x, y:s.safehouse.y },
    { name:'Marina Pier', x:s.pier.x, y:s.pier.y },
    { name:'Northwest Corner', x:v[0].x, y:h[0].y },
    { name:'Harbor Front', x:v[7].x, y:h[4].y },
    { name:'West Beach', x:v[0].x, y:h[6].y },
    { name:'Midtown Crossing', x:v[4].x, y:h[2].y },
  ];
}

export function courierTimeLimit(distance) {
  return Math.round(25 + distance / 30);
}

export function courierPayout(courier) {
  return COURIER_BASE + Math.round(COURIER_PER_SECOND * Math.max(0, courier.timeLeft));
}

export function createCourier() {
  return { phase:'idle', target:null, targetName:'', distance:0, timeLimit:0, timeLeft:0, result:null, resultUntil:0, runs:0, rng:createRandom('coral-bay-courier') };
}

function pickTarget(courier, world) {
  const doors = courierDoors(world), start = courierStartPoint(world);
  const index = Math.floor(courier.rng() * doors.length) % doors.length;
  for (let step = 0; step < doors.length; step++) {
    const door = doors[(index + step) % doors.length];
    if (Math.hypot(door.x - start.x, door.y - start.y) >= COURIER_MIN_DISTANCE) return door;
  }
  return doors[index];
}

export function startCourier(courier, g) {
  if (!courier || courier.phase === 'running' || !g.vehicle || !g.world || g.missions?.activity) return false;
  g.vehicle.fuel = Math.max(g.vehicle.fuel ?? 100, 40);
  const start = courierStartPoint(g.world), door = pickTarget(courier, g.world);
  courier.target = { x:door.x, y:door.y }; courier.targetName = door.name;
  courier.distance = Math.hypot(door.x - start.x, door.y - start.y);
  courier.timeLimit = courier.timeLeft = courierTimeLimit(courier.distance);
  courier.result = null; courier.phase = 'running'; courier.runs++;
  if (g.missions) { g.missions.activity = 'courier'; g.missions.objective = `Courier · deliver to ${door.name}`; g.missions.marker = courier.target; }
  spawnPopup(g.popups, start.x, start.y - 58, 'COURIER RUSH · GO!', '#7be3f0');
  return true;
}

function finishCourier(courier, g) {
  const pay = courierPayout(courier), state = g.missions, focus = g.vehicle || g.player;
  courier.phase = 'done'; courier.result = 'delivered'; courier.resultUntil = (g.playSeconds || 0) + 3.5;
  g.player.cash += pay; if (state) state.totalEarned += pay;
  if (state) {
    state.splash = { name:'COURIER RUSH', reward:pay, total:g.player.cash, until:(g.playSeconds || 0) + 2.8 };
    state.activity = null; state.marker = null; state.objective = `Delivered · +$${pay}`;
  }
  awardRep(g, REP_COURIER);
  spawnPopup(g.popups, focus.x, focus.y - 44, `DELIVERED · +$${pay}`, '#8df0a5');
}

function expireCourier(courier, g) {
  const state = g.missions, focus = g.vehicle || g.player;
  courier.phase = 'done'; courier.result = 'expired'; courier.resultUntil = (g.playSeconds || 0) + 3.5;
  if (state) {
    state.splash = { name:'COURIER · EXPIRED', reward:0, total:g.player.cash, until:(g.playSeconds || 0) + 2.8 };
    state.activity = null; state.marker = null; state.objective = 'Courier run expired · no penalty';
  }
  spawnPopup(g.popups, focus.x, focus.y - 44, 'EXPIRED · NO PENALTY', '#ef826c');
}

function abortCourier(courier, g) {
  courier.phase = 'idle'; courier.target = null;
  if (g.missions?.activity === 'courier') { g.missions.activity = null; g.missions.marker = null; }
}

export function updateCourier(courier, g, dt) {
  if (!courier || courier.phase === 'idle') return;
  if (courier.phase === 'done') {
    if ((g.playSeconds || 0) >= courier.resultUntil) { courier.phase = 'idle'; courier.target = null; }
    return;
  }
  if (g.outcome || !g.vehicle) { abortCourier(courier, g); return; }
  courier.timeLeft -= dt;
  if (courier.timeLeft <= 0) { courier.timeLeft = 0; expireCourier(courier, g); return; }
  const focus = g.vehicle, target = courier.target;
  const dist = Math.hypot(focus.x - target.x, focus.y - target.y);
  if (dist < 78) { finishCourier(courier, g); return; }
  const state = g.missions;
  if (state) { state.objective = `Courier · ${courier.targetName} · ${Math.round(dist)} m · ${Math.ceil(courier.timeLeft)}s`; state.marker = target; }
  g.objective = { text: state ? state.objective : 'Courier', position: target };
}

export function drawCourierWorld(ctx, courier, g, time) {
  if (!courier || !g.world) return;
  ctx.save(); ctx.textAlign = 'center'; ctx.lineWidth = 4;
  const pulse = 1 + Math.sin(time * .005) * .12;
  if (courier.phase === 'idle') {
    const start = courierStartPoint(g.world);
    ctx.strokeStyle = '#7be3f0cc'; ctx.fillStyle = '#7be3f022';
    ctx.beginPath(); ctx.ellipse(start.x, start.y + 4, 30 * pulse, 14 * pulse, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = `bold 13px ${FONT}`; ctx.strokeStyle = '#173d46'; ctx.fillStyle = '#fff3dc';
    ctx.strokeText('COURIER', start.x, start.y - 26); ctx.fillText('COURIER', start.x, start.y - 26);
  } else if (courier.phase === 'running' && courier.target) {
    const point = courier.target;
    ctx.strokeStyle = '#7be3f0cc'; ctx.fillStyle = '#7be3f022';
    ctx.beginPath(); ctx.ellipse(point.x, point.y + 4, 29 * pulse, 13 * pulse, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = .32 + Math.sin(time * .004) * .08; ctx.fillStyle = '#7be3f0';
    ctx.beginPath(); ctx.moveTo(point.x - 12, point.y); ctx.lineTo(point.x + 12, point.y); ctx.lineTo(point.x + 5, point.y - 100); ctx.lineTo(point.x - 5, point.y - 100); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    ctx.font = `bold 14px ${FONT}`; ctx.strokeStyle = '#173d46'; ctx.fillStyle = '#7be3f0';
    ctx.strokeText('DROP', point.x, point.y - 34); ctx.fillText('DROP', point.x, point.y - 34);
  }
  ctx.restore();
}
