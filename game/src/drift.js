import { spawnPopup } from './popups.js';
import { awardRep, REP_DRIFT } from './rep.js';
import { angleDifference } from './random.js';

export const DRIFT_MIN_SPEED = 120;
export const DRIFT_MIN_SLIP = 0.35;
export const DRIFT_START = 0.4;
export const DRIFT_SEGMENT = 1.2;
export const DRIFT_PER_CHAIN = 15;
export const DRIFT_GRACE = 0.5;

export function createDrift() {
  return { chain:0, time:0, pending:0, grace:0, lastHealth:null };
}

export function updateDrift(drift, g, dt, input) {
  if (!drift) return;
  const car = g.vehicle;
  if (!car) { drift.chain = 0; drift.time = 0; drift.pending = 0; drift.grace = 0; drift.lastHealth = null; return; }
  const impact = drift.lastHealth != null && car.health < drift.lastHealth - .01;
  drift.lastHealth = car.health;
  if (drift.pending > 0) {
    if (impact) {
      spawnPopup(g.popups, car.x, car.y - 44, 'DRIFT LOST', '#ef826c');
      drift.pending = 0; drift.grace = 0;
    } else {
      drift.grace -= dt;
      if (drift.grace <= 0) {
        const pay = DRIFT_PER_CHAIN * drift.pending;
        g.player.cash += pay; if (g.missions) g.missions.totalEarned += pay;
        spawnPopup(g.popups, car.x, car.y - 44, `DRIFT +$${pay}`, '#8df0a5');
        awardRep(g, REP_DRIFT * drift.pending);
        drift.pending = 0; drift.grace = 0;
      }
    }
    return;
  }
  if (impact && drift.time > 0) {
    if (drift.chain > 0) spawnPopup(g.popups, car.x, car.y - 44, 'DRIFT LOST', '#ef826c');
    drift.chain = 0; drift.time = 0;
    return;
  }
  const speed = Math.hypot(car.vx, car.vy);
  const slip = speed > 1 ? Math.abs(angleDifference(car.heading, Math.atan2(car.vy, car.vx))) : 0;
  const drifting = Boolean(input?.isDown('Space')) && speed > DRIFT_MIN_SPEED && slip > DRIFT_MIN_SLIP && !car.airT;
  if (drifting) {
    drift.time += dt;
    const chain = drift.time >= DRIFT_START ? Math.floor((drift.time - DRIFT_START) / DRIFT_SEGMENT) + 1 : 0;
    if (chain > drift.chain) {
      drift.chain = chain;
      spawnPopup(g.popups, car.x, car.y - 58, `DRIFT ×${chain}`, '#ffe16d');
    }
  } else if (drift.time > 0) {
    if (drift.chain > 0) { drift.pending = drift.chain; drift.grace = DRIFT_GRACE; }
    drift.chain = 0; drift.time = 0;
  }
}
