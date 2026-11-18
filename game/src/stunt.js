import { spawnPopup } from './popups.js';
import { awardRep, REP_STUNT } from './rep.js';

export const STUNT_AIR_TIME = 0.7;
export const STUNT_PRIZE = 50;
export const STUNT_MIN_SPEED = 150;

export function stuntRamps(world) {
  const v = world.roads.vertical, h = world.roads.horizontal;
  return [
    { x:v[5].x + 200, y:h[6].y, dir:0 },
    { x:v[3].x, y:h[2].y + 180, dir:Math.PI / 2 },
    { x:v[7].x - 200, y:h[4].y, dir:Math.PI },
  ];
}

export function stuntLaunch(car, ramp) {
  car.airT = 0.001; car.stuntFrom = { x:ramp.x, y:ramp.y }; car.stuntPopup = false;
}

export function updateStunt(g, dt) {
  const car = g.vehicle;
  if (!car || !g.world) return;
  if (car.airT > 0) {
    if (!car.stuntPopup && car.airT >= 0.3) {
      car.stuntPopup = true;
      spawnPopup(g.popups, car.x, car.y - 58, 'STUNT JUMP', '#ffe16d');
    }
    if (car.airT >= STUNT_AIR_TIME) {
      car.airT = 0;
      if (g.world.pointInWater({ x:car.x, y:car.y })) {
        const from = car.stuntFrom || { x:car.x, y:car.y };
        car.x = from.x; car.y = from.y; car.speed = 0; car.vx = 0; car.vy = 0;
        spawnPopup(g.popups, car.x, car.y - 44, 'SPLASH · NO AWARD', '#ef826c');
      } else {
        g.player.cash += STUNT_PRIZE;
        if (g.missions) g.missions.totalEarned += STUNT_PRIZE;
        spawnPopup(g.popups, car.x, car.y - 44, `STUNT +$${STUNT_PRIZE}`, '#8df0a5');
        awardRep(g, REP_STUNT);
      }
      car.stuntFrom = null;
    }
    return;
  }
  if (Math.hypot(car.vx, car.vy) < STUNT_MIN_SPEED) return;
  const travel = Math.atan2(car.vy, car.vx);
  for (const ramp of stuntRamps(g.world)) {
    let diff = Math.abs(travel - ramp.dir) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < 0.6 && Math.hypot(car.x - ramp.x, car.y - ramp.y) < 30) { stuntLaunch(car, ramp); return; }
  }
}

export function drawStuntWorld(ctx, g, time) {
  if (!g || !g.world) return;
  ctx.save(); ctx.textAlign = 'center';
  for (const ramp of stuntRamps(g.world)) {
    ctx.save(); ctx.translate(ramp.x, ramp.y); ctx.rotate(ramp.dir);
    ctx.fillStyle = '#31456b'; ctx.beginPath(); ctx.moveTo(-22, -13); ctx.lineTo(22, -13); ctx.lineTo(22, 13); ctx.lineTo(-22, 13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f9d777';
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 14 - 4, -8); ctx.lineTo(i * 14 + 5, 0); ctx.lineTo(i * 14 - 4, 8); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = '#173d46'; ctx.lineWidth = 2; ctx.strokeRect(-22, -13, 44, 26);
    ctx.restore();
  }
  ctx.restore();
}
