import { createRandom } from './random.js';
import { spawnPopup } from './popups.js';
import { FONT } from './config.js';

export const ROBBERY_TIME = 3;
export const ROBBERY_MIN = 180;
export const ROBBERY_MAX = 320;
export const ROBBERY_RADIUS = 62;
export const ROBBERY_CLERK_RANGE = 130;

export function martShops(world) {
  const building = world.buildings.find(item => item.storefront && item.storefront.sign === 'CORAL MART');
  if (!building) return [];
  const road = world.roads.horizontal.find(item => item.y > building.y + building.height) || world.roads.horizontal[world.roads.horizontal.length - 1];
  return [{ x: building.x + building.width / 2, y: road.y, name: 'CORAL MART', building }];
}

export function robberyPayout(rng) {
  return ROBBERY_MIN + Math.floor(rng() * (ROBBERY_MAX - ROBBERY_MIN + 1));
}

export function createRobberyState(record = null) {
  return { phase: 'idle', progress: 0, clerk: null, noticeAt: -99, lastDay: Number.isInteger(record?.robberyDay) ? Math.max(-1, record.robberyDay) : -1, dirty: false, rng: createRandom('coral-bay-mart') };
}

function nearestClerk(people, shop) {
  let best = null, bestDistance = ROBBERY_CLERK_RANGE;
  for (const p of people || []) {
    if (!p || p.state === 'down') continue;
    const d = Math.hypot(p.x - shop.x, p.y - shop.y);
    if (d < bestDistance) { best = p; bestDistance = d; }
  }
  return best;
}

function abortRobbery(state) {
  if (state.clerk) state.clerk.pause = 0;
  state.phase = 'idle'; state.progress = 0; state.clerk = null;
}

function completeRobbery(state, g, report, shop, day) {
  const pay = robberyPayout(state.rng);
  g.player.cash += pay;
  if (g.missions) g.missions.totalEarned += pay;
  spawnPopup(g.popups, g.player.x, g.player.y - 44, `ROBBERY +$${pay}`, '#ef826c');
  g.audio?.effect('cash');
  if (report) report('robbery', shop.x, shop.y, 3, true);
  if (state.clerk) { state.clerk.pause = 0; state.clerk.panic = 6; }
  state.phase = 'idle'; state.progress = 0; state.clerk = null;
  state.lastDay = day; state.dirty = true;
}

export function updateRobbery(state, g, people, report, dt) {
  if (!state || !g?.player || !g.world) return;
  const shop = martShops(g.world)[0];
  if (!shop) return;
  const day = Math.floor((g.clockMinutes ?? 0) / 1440);
  const inside = !g.vehicle && Math.hypot(g.player.x - shop.x, g.player.y - shop.y) < ROBBERY_RADIUS;
  if (state.phase === 'holdup') {
    const valid = inside && !g.outcome && g.combat?.weapon === 'pistol' && !g.missions?.activity;
    if (!valid) { abortRobbery(state); return; }
    if (state.clerk) { state.clerk.pause = Math.max(state.clerk.pause || 0, .3); state.clerk.panic = 0; }
    state.progress += dt;
    g.notice = 'HOLD UP…'; g.noticeUntil = (g.playSeconds || 0) + .3;
    if (state.progress >= ROBBERY_TIME) completeRobbery(state, g, report, shop, day);
    return;
  }
  if (!inside || g.outcome || g.missions?.activity || g.missions?.dialogue) return;
  if (state.lastDay === day) {
    if ((g.playSeconds || 0) - state.noticeAt > 4) { state.noticeAt = g.playSeconds || 0; g.notice = 'TILL EMPTY · COME BACK TOMORROW'; g.noticeUntil = (g.playSeconds || 0) + 2; }
    return;
  }
  if (g.combat?.weapon === 'pistol') {
    state.phase = 'holdup'; state.progress = 0;
    state.clerk = nearestClerk(people, shop);
    if (state.clerk) { state.clerk.pause = Math.max(state.clerk.pause || 0, .3); state.clerk.panic = 0; }
    g.notice = 'HOLD UP…'; g.noticeUntil = (g.playSeconds || 0) + .3;
  } else if ((g.playSeconds || 0) - state.noticeAt > 4) {
    state.noticeAt = g.playSeconds || 0; g.notice = "THE CLERK ISN'T SCARED OF FISTS"; g.noticeUntil = (g.playSeconds || 0) + 2;
  }
}

export function drawRobberyWorld(ctx, state, g, time) {
  if (!state || !g?.world) return;
  const shop = martShops(g.world)[0];
  if (!shop) return;
  const pulse = 1 + Math.sin(time * .005) * .12;
  ctx.save(); ctx.textAlign = 'center';
  ctx.strokeStyle = '#e2574ccc'; ctx.fillStyle = '#e2574c22'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(shop.x, shop.y + 4, 30 * pulse, 14 * pulse, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8c352c'; ctx.fillRect(shop.x - 46, shop.y - 24, 92, 7);
  ctx.font = `bold 12px ${FONT}`; ctx.strokeStyle = '#173d46'; ctx.lineWidth = 4; ctx.fillStyle = '#fff3dc';
  ctx.strokeText('CORAL MART', shop.x, shop.y - 34); ctx.fillText('CORAL MART', shop.x, shop.y - 34);
  if (state.phase === 'holdup') {
    const w = 120, x = shop.x - w / 2, y = shop.y - 78;
    ctx.fillStyle = '#103c48e8'; ctx.beginPath(); ctx.roundRect(x - 8, y - 16, w + 16, 40, 6); ctx.fill();
    ctx.font = `bold 11px ${FONT}`; ctx.fillStyle = '#ff9d8d';
    ctx.fillText('HOLD UP…', shop.x, y - 4);
    ctx.fillStyle = '#ffffff33'; ctx.fillRect(x, y + 6, w, 8);
    ctx.fillStyle = '#ef826c'; ctx.fillRect(x, y + 6, w * Math.min(1, state.progress / ROBBERY_TIME), 8);
  }
  ctx.restore();
}
