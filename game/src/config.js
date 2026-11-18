export const WORLD = { width: 4320, height: 3600, seed: 'coral-bay-01' };
export const CITY = {
  roadWidth: 92, blockWidth: 390, blockHeight: 330, sidewalk: 18,
  marginX: 190, marginY: 150, beachStartY: 3000, waterStartY: 3300,
  tileSize: 32, buildingInset: 30,
};
export const CAMERA = { width: 960, height: 600, followLerp: 0.12 };
export const MINIMAP = { width: 192, height: 144, padding: 8 };
export const PLAYER = { radius: 12, walkSpeed: 150, sprintSpeed: 235 };
export const VEHICLE = { radius: 18, maxSpeed: 330, acceleration: 180, braking: 280 };
export const TRAFFIC = { laneOffset: 20, followDistance: 50, cruiseSpeed: 95 };
export const POLICE = { sightRange: 420, searchSeconds: 12, wantedMax: 5 };
export const ECONOMY = { firstShift: 650, borrowedWheels: 900, envelope: 1200, nightDeposit: 1800, sunriseRun: 4000, pierEscape: 6000, taxiBase: 90, taxiPerUnit: 0.12, repair: 260, armour: 220, bustedFine: 50, hospitalBill: 75 };
export const PALETTE = {
  water: '#32b9c4', waterDeep: '#168b9d', waterLight: '#83e2dc',
  sand: '#f1d49a', sandLight: '#f8e4b4', grass: '#8bbd69', grassDark: '#6da75a',
  road: '#565c61', roadEdge: '#454b50', roadMark: '#f3df9b', sidewalk: '#d5cbb3',
  building: ['#f2e7d1', '#e9c9a7', '#d6e0d4', '#f0d7c2', '#cbd9df', '#e6dfb8'],
  roof: ['#bd7055', '#a95f4d', '#7b8581', '#d0a05e', '#657878'],
  window: '#8bc8ca', windowLit: '#f7d995', trim: '#fff2d5', shadow: 'rgba(38, 66, 64, 0.22)',
  palm: '#397d55', palmTrunk: '#9c7653', lamp: '#53595b', bench: '#805c42',
  hospital: '#f3f0e3', police: '#d4e1df', diner: '#e6a46f', garage: '#98b1a3', safehouse: '#d7c6ae',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
