export function hashSeed(seed) {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRandom(seed = 1) {
  let state = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export const randomRange = (random, min, max) => min + random() * (max - min);
export const randomInt = (random, min, max) => Math.floor(randomRange(random, min, max + 1));
export const pick = (random, items) => items[Math.floor(random() * items.length)];
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (start, end, amount) => start + (end - start) * amount;
export const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
export const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
export const angleDifference = (from, to) => normalizeAngle(to - from);
export const moveAngle = (from, to, amount) => from + angleDifference(from, to) * amount;
