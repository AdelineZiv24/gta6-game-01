// Traffic lights for the downtown grid: a deterministic 24 s cycle derived
// from the game clock (no rng, no save fields). NS and EW alternate with an
// amber phase and a 1 s all-red clearance. Also the pole/head renderer and
// the edge-triggered red-light crossing detector used by main.js.
export const LIGHT_CYCLE = 24;
export const LIGHT_COLORS = { red: '#ff4040', amber: '#ffb020', green: '#2fe07a' };
const LIT_COLS = [2, 3, 4];
const LIT_ROWS = [2, 3, 4];

export function downtownIntersections(world) {
  const out = [];
  for (const col of LIT_COLS) for (const row of LIT_ROWS) {
    const v = world.roads.vertical[col], h = world.roads.horizontal[row];
    if (v && h) out.push({ col, row, x: v.x, y: h.y });
  }
  return out;
}

export function lightState(axis, t) {
  const p = ((t % LIGHT_CYCLE) + LIGHT_CYCLE) % LIGHT_CYCLE;
  if (axis === 'NS') return p < 10 ? 'green' : p < 12 ? 'amber' : 'red';
  return p < 13 ? 'red' : p < 23 ? 'green' : 'amber';
}

export function createRedLightTracker() { return { inside: null }; }

// Edge-triggered crossing detector: returns an entry event
// {key, col, row, axis, red} on the frame the car enters a lit intersection
// box, otherwise null. Leaving and re-entering fires again.
export function updateRedLight(tracker, car, world, t) {
  if (!tracker || !car) return null;
  let hit = null;
  for (const i of downtownIntersections(world)) {
    if (Math.abs(car.x - i.x) < 46 && Math.abs(car.y - i.y) < 46) { hit = i; break; }
  }
  const key = hit ? hit.col + ',' + hit.row : null;
  if (key === tracker.inside) return null;
  tracker.inside = key;
  if (!hit) return null;
  const axis = Math.abs(Math.cos(car.heading)) >= Math.abs(Math.sin(car.heading)) ? 'EW' : 'NS';
  return { key, col: hit.col, row: hit.row, axis, red: lightState(axis, t) === 'red' };
}

export function drawTrafficLights(ctx, world, view, t) {
  for (const i of downtownIntersections(world)) {
    if (i.x < view.x - 90 || i.x > view.x + view.width + 90 || i.y < view.y - 90 || i.y > view.y + view.height + 90) continue;
    const poles = [
      { x: i.x - 55, y: i.y + 55, axis: 'EW' },
      { x: i.x + 55, y: i.y - 55, axis: 'EW' },
      { x: i.x - 55, y: i.y - 55, axis: 'NS' },
      { x: i.x + 55, y: i.y + 55, axis: 'NS' },
    ];
    for (const pole of poles) {
      const state = lightState(pole.axis, t);
      ctx.fillStyle = '#2b2f33';
      ctx.fillRect(pole.x - 1.5, pole.y - 23, 3, 23);
      ctx.fillStyle = '#1d2124';
      ctx.fillRect(pole.x - 5, pole.y - 45, 10, 22);
      const lamps = [['red', pole.y - 40], ['amber', pole.y - 33.5], ['green', pole.y - 27]];
      for (const [name, ly] of lamps) {
        ctx.fillStyle = name === state ? LIGHT_COLORS[name] : 'rgba(120,128,132,0.55)';
        ctx.beginPath(); ctx.arc(pole.x, ly, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}
