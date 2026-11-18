import { spawnPopup } from './popups.js';

export const REP_MISSION = 100;
export const REP_RACE_WIN = 60;
export const REP_RACE_FINISH = 20;
export const REP_RAMPAGE_CAP = 50;
export const REP_TAXI = 10;
export const REP_COLLECTIBLE = 15;
export const REP_DEPOSIT = 10;
export const REP_FISHING = 5;

export function repRequired(level) {
  return 50 * (level - 1) * level;
}

export function repLevel(xp) {
  if(!Number.isFinite(xp) || xp < 0) xp = 0;
  let level = 1;
  while(level < 10 && repRequired(level + 1) <= xp) level++;
  return level;
}

export function repProgress(xp) {
  if(!Number.isFinite(xp) || xp < 0) xp = 0;
  const level = repLevel(xp);
  if(level === 10) return {level:10, into:xp - 4500, span:1, fraction:1, next:null};
  const floor = repRequired(level), next = repRequired(level + 1);
  const into = xp - floor, span = next - floor;
  return {level, into, span, fraction:into / span, next};
}

export function createRep(record = null) {
  return {xp:Number.isFinite(record?.rep?.xp) ? Math.max(0, Math.floor(record.rep.xp)) : 0};
}

export function awardRep(g, amount) {
  if(!g || !g.rep || !(amount > 0)) return 0;
  const gain = Math.floor(amount), before = repLevel(g.rep.xp);
  g.rep.xp += gain;
  const level = repLevel(g.rep.xp), focus = g.vehicle || g.player;
  if(focus && g.popups) spawnPopup(g.popups, focus.x, focus.y - 58, `+${gain} REP`, '#71d3d9');
  if(level > before){
    if(focus && g.popups) spawnPopup(g.popups, focus.x, focus.y - 84, `REP UP · LV ${level}`, '#f9d777', 3);
    const s = g.missions;
    if(s && (!s.splash || (g.playSeconds || 0) >= (s.splash.until || 0))){
      s.splash = {header:'STREET REP', name:`REP UP · LV ${level}`, reward:0, repLevel:level, total:g.player?.cash ?? 0, until:(g.playSeconds || 0) + 2.8};
    }
  }
  return level;
}
