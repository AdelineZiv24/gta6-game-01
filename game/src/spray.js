import { setWanted } from './wanted.js';
import { spawnPopup } from './popups.js';
import { FONT } from './config.js';

export const SPRAY_PRICE = 150;
export const SPRAY_RADIUS = 62;

export function sprayGarages(world) {
  const building = world.buildings.find(item => item.storefront && item.storefront.sign === 'CORAL SPRAY');
  if (!building) return [];
  const road = world.roads.horizontal.find(item => item.y > building.y + building.height) || world.roads.horizontal[world.roads.horizontal.length - 1];
  return [{ x: building.x + building.width / 2, y: road.y, name: 'CORAL SPRAY', building }];
}

export function createSprayState() { return { noticeAt: -99 }; }

export function updateSpray(g, dt) {
  const state = g.spray, car = g.vehicle;
  if (!state || !car || g.outcome) return;
  const garage = sprayGarages(g.world)[0];
  if (!garage) return;
  if (Math.hypot(garage.x - car.x, garage.y - car.y) > SPRAY_RADIUS || Math.abs(car.speed) > 30) return;
  const needs = car.health < 100 || (g.wanted?.stars ?? 0) > 0;
  if (!needs) return;
  if (g.player.cash < SPRAY_PRICE) {
    if (g.playSeconds - state.noticeAt > 2.5) { state.noticeAt = g.playSeconds; g.notice = 'NEED $150'; g.noticeUntil = g.playSeconds + 2; }
    return;
  }
  g.player.cash -= SPRAY_PRICE;
  car.health = 100;
  if (g.wanted) setWanted(g.wanted, 0);
  if (g.escape) { g.escape.peak = 0; g.escape.prev = 0; }
  spawnPopup(g.popups, car.x, car.y - 44, 'RESPRAYED', '#2fd4c4');
  g.notice = 'WANTED CLEARED · $150'; g.noticeUntil = g.playSeconds + 2;
}

export function drawSprayWorld(ctx, g, time) {
  if (!g.world) return;
  const pulse = 1 + Math.sin(time * .005) * .12;
  ctx.save(); ctx.textAlign = 'center';
  for (const garage of sprayGarages(g.world)) {
    ctx.strokeStyle = '#2fd4c4cc'; ctx.fillStyle = '#2fd4c422'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(garage.x, garage.y + 4, 30 * pulse, 14 * pulse, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (const offset of [-40, 40]) {
      const x = garage.x + offset, y = garage.y;
      ctx.fillStyle = 'rgba(38,66,64,0.25)'; ctx.beginPath(); ctx.roundRect(x - 4, y - 18, 10, 34, 3); ctx.fill();
      ctx.fillStyle = '#1f8f83'; ctx.beginPath(); ctx.roundRect(x - 6, y - 21, 10, 34, 3); ctx.fill();
    }
    ctx.fillStyle = '#1f8f83'; ctx.fillRect(garage.x - 46, garage.y - 24, 92, 7);
    ctx.font = `bold 12px ${FONT}`; ctx.strokeStyle = '#173d46'; ctx.lineWidth = 4; ctx.fillStyle = '#fff3dc';
    ctx.strokeText('CORAL SPRAY', garage.x, garage.y - 34); ctx.fillText('CORAL SPRAY', garage.x, garage.y - 34);
  }
  ctx.restore();
}
