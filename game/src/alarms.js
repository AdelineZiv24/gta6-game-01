import { createRandom } from './random.js';
import { spawnPopup } from './popups.js';

export const ALARM_CHANCE = 0.35;
export const ALARM_TIME = 4;
export const ALARM_RANGE = 120;

export function createAlarmState() {
  return { rng: createRandom('coral-bay-alarms'), active: [] };
}

export function alarmEligible(car, g) {
  if (!car || car.driver !== 'parked' || car.police || car.bus || car.alarmDone) return false;
  if (car === g?.missions?.rival || car === g?.race?.rival) return false;
  return true;
}

export function maybeAlarm(state, car, g) {
  if (!state || !alarmEligible(car, g)) return false;
  if (state.rng() >= ALARM_CHANCE) return false;
  car.alarmT = ALARM_TIME;
  state.active.push({ car, x: car.x, y: car.y, t: ALARM_TIME, blip: 0 });
  spawnPopup(g?.popups, car.x, car.y - 44, 'ALARM', '#ffb02e');
  g?.audio?.effect('alarm');
  return true;
}

export function updateAlarms(state, g, report, dt) {
  if (!state || !g) return;
  for (let i = state.active.length - 1; i >= 0; i--) {
    const alarm = state.active[i], car = alarm.car;
    alarm.t -= dt;
    car.alarmT = Math.max(0, alarm.t);
    alarm.blip -= dt;
    if (alarm.t > 0 && alarm.blip <= 0) { alarm.blip = 0.6; g.audio?.effect('alarm'); }
    if (alarm.t > 0) continue;
    state.active.splice(i, 1);
    car.alarmT = 0; car.alarmDone = true;
    const focus = g.vehicle || g.player;
    if (focus && Math.hypot(focus.x - alarm.x, focus.y - alarm.y) <= ALARM_RANGE) report('vehicle_theft', alarm.x, alarm.y, 1, false);
  }
}
