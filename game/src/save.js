const KEY = 'coral-bay-heat-save';
export const SAVE_VERSION = 1;

export function emptySave() {
  return { version: SAVE_VERSION, cash: 180, completed: [], currentMission: 0, pistolGranted: false, collectibles: [], bestTimes: {}, taxiFares: 0, totalEarned: 0, storyElapsed: 0, rep: { xp: 0 }, photos: [], robberyDay: -1, dinerRobberyDay: -1, courierDeliveries: 0, glow: -1, glowInstalled: false, position: null, currentCar: null };
}

export function loadSave() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    if (!value || value.version !== SAVE_VERSION) return null;
    const base = emptySave();
    return { ...base, ...value, completed: Array.isArray(value.completed) ? value.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<6) : [], currentMission:Number.isInteger(value.currentMission)?Math.max(0,Math.min(6,value.currentMission)):0, collectibles: Array.isArray(value.collectibles) ? value.collectibles.filter(n=>Number.isInteger(n)&&n>=0&&n<12) : [], bestTimes: value.bestTimes && typeof value.bestTimes === 'object' ? value.bestTimes : {}, cash:Number.isFinite(value.cash)?Math.max(0,value.cash):180, taxiFares:Number.isFinite(value.taxiFares)?Math.max(0,value.taxiFares):0, totalEarned:Number.isFinite(value.totalEarned)?Math.max(0,value.totalEarned):0, storyElapsed:Number.isFinite(value.storyElapsed)?Math.max(0,value.storyElapsed):0, rep: value.rep && Number.isFinite(value.rep.xp) ? {xp: Math.max(0, Math.floor(value.rep.xp))} : {xp: 0}, photos: Array.isArray(value.photos) ? value.photos.filter(n=>Number.isInteger(n)&&n>=0&&n<5) : [], robberyDay: Number.isInteger(value.robberyDay) ? Math.max(-1, value.robberyDay) : -1, dinerRobberyDay: Number.isInteger(value.dinerRobberyDay) ? Math.max(-1, value.dinerRobberyDay) : -1, courierDeliveries: Number.isFinite(value.courierDeliveries) ? Math.max(0, Math.floor(value.courierDeliveries)) : 0, glow: Number.isInteger(value.glow) ? Math.max(-1, Math.min(2, value.glow)) : -1, glowInstalled: value.glowInstalled === true };
  } catch { return null; }
}

export function writeSave(game, missionState) {
  if(game.shot || (typeof location!=='undefined'&&new URLSearchParams(location.search).has('shot')))return null;
  try {
    const record = { ...emptySave(), cash: game.player.cash, completed: [...missionState.completed], currentMission: missionState.scoreRun?missionState.resumeMission:missionState.currentMission, pistolGranted: game.combat.pistol, collectibles: [...missionState.collectibles], bestTimes: { ...missionState.bestTimes }, taxiFares: missionState.taxiFares, totalEarned: missionState.totalEarned, storyElapsed: missionState.storyElapsed||0, rep: { xp: Number.isFinite(game.rep?.xp) ? Math.max(0, Math.floor(game.rep.xp)) : 0 }, photos: game.photos ? [...game.photos.taken] : [], robberyDay: Number.isInteger(game.robbery?.lastDay) ? game.robbery.lastDay : -1, dinerRobberyDay: Number.isInteger(game.dinerRobbery?.lastDay) ? game.dinerRobbery.lastDay : -1, courierDeliveries: Number.isFinite(game.courier?.deliveries) ? Math.max(0, Math.floor(game.courier.deliveries)) : 0, glow: Number.isInteger(game.glow?.color) ? Math.max(-1, Math.min(2, game.glow.color)) : -1, glowInstalled: game.glow?.installed === true, position: { x: game.player.x, y: game.player.y }, currentCar: game.vehicle ? { model: game.vehicle.model.name, color: game.vehicle.color, health: game.vehicle.health, x: game.vehicle.x, y: game.vehicle.y, heading: game.vehicle.heading } : null };
    localStorage.setItem(KEY, JSON.stringify(record));
    return record;
  } catch { return null; }
}

export function hasSave() { return loadSave() !== null; }
