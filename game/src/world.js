import { CITY, PALETTE, WORLD } from './config.js';
import { createRandom, pick, randomInt, randomRange } from './random.js';

const LANDMARKS = [
  { id: 'hospital', name: 'Coral Bay General', short: 'CB GENERAL', gx: 1, gy: 1, color: PALETTE.hospital, w: 170, h: 130 },
  { id: 'police', name: 'Coral Bay Police', short: 'POLICE', gx: 6, gy: 1, color: PALETTE.police, w: 170, h: 132 },
  { id: 'diner', name: 'Marlin Diner', short: 'MARLIN DINER', gx: 2, gy: 4, color: PALETTE.diner, w: 150, h: 110 },
  { id: 'garage', name: 'Marlin Auto Works', short: 'MARLIN AUTO', gx: 6, gy: 4, color: PALETTE.garage, w: 170, h: 112 },
  { id: 'safehouse', name: 'Seabreeze Apartments', short: 'SEABREEZE', gx: 4, gy: 5, color: PALETTE.safehouse, w: 180, h: 144 },
];

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

export function createWorld(seed = WORLD.seed) {
  const random = createRandom(seed);
  const buildings = [];
  const props = [];
  const sidewalks = [];
  const parkingSpots = [];
  const lots = [];
  const boats = [];
  const spawnPoints = {};
  const roads = { horizontal: [], vertical: [] };
  const blockStartX = CITY.marginX + CITY.roadWidth;
  const blockStartY = CITY.marginY + CITY.roadWidth;
  const pitchX = CITY.blockWidth + CITY.roadWidth;
  const pitchY = CITY.blockHeight + CITY.roadWidth;
  const cols = Math.floor((WORLD.width - CITY.marginX * 2 - CITY.roadWidth) / pitchX);
  const rows = Math.floor((CITY.beachStartY - CITY.marginY - CITY.roadWidth) / pitchY);

  for (let index = 0; index <= cols; index += 1) {
    const x = CITY.marginX + CITY.roadWidth / 2 + index * pitchX;
    roads.vertical.push({ x, y: 0, length: CITY.beachStartY, width: CITY.roadWidth });
  }
  for (let index = 0; index <= rows; index += 1) {
    const y = CITY.marginY + CITY.roadWidth / 2 + index * pitchY;
    roads.horizontal.push({ x: 0, y, length: WORLD.width, width: CITY.roadWidth });
  }

  function addBuilding(building) {
    const item = {
      id: building.id ?? `building-${buildings.length}`, name: building.name ?? '', short: building.short ?? '',
      x: building.x, y: building.y, width: building.width, height: building.height,
      storeys: building.storeys ?? randomInt(random, 1, 5),
      facade: building.facade ?? pick(random, PALETTE.building),
      roof: building.roof ?? pick(random, PALETTE.roof),
      windowRows: building.windowRows ?? randomInt(random, 2, 5),
      windowCols: building.windowCols ?? randomInt(random, 3, 7),
      windowPattern: Array.from({ length: (building.windowRows ?? 3) * (building.windowCols ?? 4) }, () => random() > .18),
      storefront: !building.landmark && building.width > 125 && random() > .42 ? {
        sign: pick(random, ['BAYFRONT MARKET', 'SALT & SAIL', 'SUNLINE CAFE', 'CORAL CYCLES', 'PALM CORNER', 'TIDEMARK GOODS']),
        color: pick(random, ['#d85d4e', '#287f86', '#d39b39', '#47704f']),
      } : null,
      landmark: Boolean(building.landmark),
    };
    buildings.push(item);
    return item;
  }

  for (let gy = 0; gy < rows; gy += 1) {
    for (let gx = 0; gx < cols; gx += 1) {
      const cell = { x: blockStartX + gx * pitchX, y: blockStartY + gy * pitchY, width: CITY.blockWidth, height: CITY.blockHeight };
      const landmark = LANDMARKS.find((item) => item.gx === gx && item.gy === gy);
      if (landmark) {
        const building = addBuilding({ ...landmark, x: cell.x + (cell.width - landmark.w) / 2, y: cell.y + (cell.height - landmark.h) / 2, width: landmark.w, height: landmark.h, storeys: landmark.id === 'safehouse' ? 5 : 2, facade: landmark.color, landmark: true });
        spawnPoints[landmark.id] = { x: building.x + building.width / 2, y: building.y + building.height + 28, heading: -Math.PI / 2 };
      }
      const inner = CITY.buildingInset + CITY.sidewalk;
      const left = cell.x + inner;
      const top = cell.y + inner;
      const areaW = cell.width - inner * 2;
      const areaH = cell.height - inner * 2;
      const isLot = !landmark && (gx + gy * 3) % 11 === 4;
      const isPark = gx === 4 && gy === 2;
      const count = landmark ? 1 : isLot || isPark ? 0 : randomInt(random, 4, 6);
      if (isLot) {
        lots.push({ x: cell.x + 35, y: cell.y + 45, width: cell.width - 70, height: cell.height - 90 });
        for (let bay = 0; bay < 12; bay++) parkingSpots.push({ x: cell.x + 56 + (bay % 4) * 78, y: cell.y + 78 + Math.floor(bay / 4) * 82, heading: Math.PI / 2, width: 30, length: 54, lot: true });
      }
      if (isPark) {
        props.push({ kind: 'fountain', x: cell.x + cell.width / 2, y: cell.y + cell.height / 2, scale: 1, rotation: 0 });
        props.push({ kind: 'path', x: cell.x + cell.width / 2, y: cell.y + 45, width: 18, height: cell.height - 90, rotation: 0 });
        props.push({ kind: 'path', x: cell.x + 45, y: cell.y + cell.height / 2, width: cell.width - 90, height: 18, rotation: 0 });
        for (let p = 0; p < 6; p++) props.push({ kind: 'palm', x: cell.x + 60 + (p % 3) * 130, y: cell.y + 66 + Math.floor(p / 3) * 190, scale: .9, rotation: 0 });
      }
      for (let index = 0; index < count; index += 1) {
        const width = randomRange(random, 112, Math.min(182, areaW - 12));
        const height = randomRange(random, 90, Math.min(154, areaH - 12));
        const columns = count <= 2 ? 1 : 2;
        const slot = index % columns;
        const row = Math.floor(index / columns);
        const x = left + (areaW / columns) * slot + (areaW / columns - width) / 2;
        const y = top + (areaH / Math.ceil(count / columns)) * row + (areaH / Math.ceil(count / columns) - height) / 2;
        if (landmark && index === 0) continue;
        addBuilding({ x, y, width, height });
      }
      const sidewalk = { x: cell.x + CITY.buildingInset, y: cell.y + CITY.buildingInset, width: cell.width - CITY.buildingInset * 2, height: cell.height - CITY.buildingInset * 2 };
      const pavement = CITY.sidewalk;
      sidewalks.push(
        { x: cell.x + 8, y: cell.y + 8, width: cell.width - 16, height: pavement },
        { x: cell.x + 8, y: cell.y + cell.height - pavement - 8, width: cell.width - 16, height: pavement },
        { x: cell.x + 8, y: cell.y + 8 + pavement, width: pavement, height: cell.height - 16 - pavement * 2 },
        { x: cell.x + cell.width - pavement - 8, y: cell.y + 8 + pavement, width: pavement, height: cell.height - 16 - pavement * 2 },
      );
      const propKinds = ['palm', 'lamp', 'bench', 'hydrant'];
      for (let index = 0; index < 6; index += 1) {
        const edge = index % 4;
        const along = randomRange(random, 0.12, 0.88);
        const point = edge === 0 ? { x: sidewalk.x + sidewalk.width * along, y: sidewalk.y }
          : edge === 1 ? { x: sidewalk.x + sidewalk.width, y: sidewalk.y + sidewalk.height * along }
            : edge === 2 ? { x: sidewalk.x + sidewalk.width * along, y: sidewalk.y + sidewalk.height }
              : { x: sidewalk.x, y: sidewalk.y + sidewalk.height * along };
        props.push({ kind: pick(random, propKinds), x: point.x, y: point.y, scale: randomRange(random, 0.8, 1.2), rotation: randomRange(random, 0, Math.PI * 2) });
      }
      for (let index = 0; index < 3; index += 1) {
        const x = cell.x + 42 + index * ((cell.width - 84) / 2);
        props.push({ kind: 'lamp', x, y: cell.y + 22, scale: 0.85, rotation: 0 });
      }
      const kerbY = cell.y - 15;
      for (let spot = 0; spot < 5; spot += 1) parkingSpots.push({ x: cell.x + 48 + spot * 70, y: kerbY, heading: 0, width: 30, length: 54 });
    }
  }

  const beach = { x: 0, y: CITY.beachStartY, width: WORLD.width, height: CITY.waterStartY - CITY.beachStartY };
  const water = { x: 0, y: CITY.waterStartY, width: WORLD.width, height: WORLD.height - CITY.waterStartY };
  const pier = { x: WORLD.width - 500, y: CITY.waterStartY - 24, width: 400, height: 220 };
  for (let index = 0; index < 9; index += 1) props.push({ kind: 'palm', x: 70 + index * 430, y: CITY.beachStartY + 55 + (index % 2) * 38, scale: 1.2, rotation: 0 });
  for (let index = 0; index < 14; index += 1) props.push({ kind: 'palm', x: 120 + index * 310, y: CITY.beachStartY - 28, scale: 1.05, rotation: 0 });
  for (let index = 0; index < 3; index += 1) props.push({ kind: 'billboard', x: 520 + index * 1420, y: 220 + (index % 2) * 1050, scale: 1, rotation: 0, slogan: ['CORAL BAY: STAY FOR THE SUN', 'THE COAST IS YOURS', 'LIVE WELL. GO TIDAL.'][index] });
  for (const cell of [{x:blockStartX+pitchX*2,y:blockStartY+pitchY*3},{x:blockStartX+pitchX*6,y:blockStartY+pitchY*2}]) props.push({kind:'shelter',x:cell.x+CITY.blockWidth-24,y:cell.y+CITY.blockHeight/2,scale:1,rotation:Math.PI/2});
  for (let index = 0; index < 24; index += 1) props.push({ kind: index % 2 ? 'towel' : 'umbrella', x: 130 + index * 168, y: CITY.beachStartY + 110 + (index % 4) * 34, scale: .8 + random() * .3, rotation: randomRange(random, -.4, .4) });
  for (let index = 0; index < 7; index += 1) boats.push({ x: WORLD.width - 390 + (index % 3) * 105, y: CITY.waterStartY + 72 + Math.floor(index / 3) * 58, heading: index % 2 ? .12 : -.1, length: 42 + index % 3 * 12 });
  spawnPoints.pier = { x: pier.x + pier.width - 35, y: water.y - 65, heading: 0 };
  spawnPoints.player = spawnPoints.safehouse;

  const dressing = createRandom(`${seed}:roof-and-beach`);
  for (const building of buildings) {
    const roofX = building.x + 20, roofY = building.y + 20;
    building.rooftop = [
      { kind: 'ac', x: roofX, y: roofY, width: 18 + Math.floor(dressing() * 9), height: 14 },
    ];
    if (building.storeys >= 4) building.rooftop.push({ kind: 'tank', x: building.x + building.width - 33, y: roofY + 9, radius: 10 });
    if (dressing() > .45) building.rooftop.push({ kind: 'aerial', x: building.x + building.width * .6, y: building.y + building.height * .47 });
    if (dressing() > .7) building.rooftop.push({ kind: 'rail', x: roofX, y: building.y + building.height - 40, width: building.width * .38 });
  }
  const beachColors = ['#dd795f', '#569da5', '#e7b954', '#8e91b0', '#87ab88'];
  for (const prop of props) if (prop.kind === 'umbrella' || prop.kind === 'towel') prop.color = pick(dressing, beachColors);

  function pointInWater(point) { return point.y >= water.y && point.y <= WORLD.height && point.x >= 0 && point.x <= WORLD.width; }
  function collidesCircle(x, y, radius) {
    if (x - radius < 0 || y - radius < 0 || x + radius > WORLD.width || y + radius > WORLD.height) return true;
    return buildings.some((building) => {
      const nearestX = Math.max(building.x, Math.min(x, building.x + building.width));
      const nearestY = Math.max(building.y, Math.min(y, building.y + building.height));
      const dx = x - nearestX;
      const dy = y - nearestY;
      return dx * dx + dy * dy < radius * radius;
    });
  }
  const sprayAnchor = { x: roads.vertical[4].x, y: roads.horizontal[3].y };
  let sprayBuilding = null, sprayDistance = Infinity;
  for (const building of buildings) {
    if (!building.storefront) continue;
    const distance = Math.hypot(building.x + building.width / 2 - sprayAnchor.x, building.y + building.height / 2 - sprayAnchor.y);
    if (distance < sprayDistance) { sprayDistance = distance; sprayBuilding = building; }
  }
  if (sprayBuilding) { sprayBuilding.storefront.sign = 'CORAL SPRAY'; sprayBuilding.storefront.color = '#1f8f83'; }
  const martAnchor = { x: roads.vertical[1].x, y: roads.horizontal[1].y };
  let martBuilding = null, martDistance = Infinity;
  for (const building of buildings) {
    if (!building.storefront || building === sprayBuilding) continue;
    const distance = Math.hypot(building.x + building.width / 2 - martAnchor.x, building.y + building.height / 2 - martAnchor.y);
    if (distance < martDistance) { martDistance = distance; martBuilding = building; }
  }
  if (martBuilding) { martBuilding.storefront.sign = 'CORAL MART'; martBuilding.storefront.color = '#c94f43'; }
  return { seed, buildings, props, sidewalks, roads, parkingSpots, lots, boats, spawnPoints, beach, water, pier, pointInWater, collidesCircle };
}

export const worldGeometry = { intersects, pointInRect };
export function updateBoats(world, dt) {
  for (const index of [0, 3]) {
    const boat = world.boats[index];
    if (!boat) continue;
    if (!boat.patrol) boat.patrol = { dir: -1, heading: boat.heading, wake: [], timer: 0 };
    const p = boat.patrol;
    boat.x += p.dir * 15 * dt;
    if (boat.x < 2980) { boat.x = 2980; p.dir = 1; }
    if (boat.x > 3770) { boat.x = 3770; p.dir = -1; }
    const target = p.dir > 0 ? 0 : Math.PI;
    const diff = ((target - p.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    p.heading += Math.max(-0.8 * dt, Math.min(0.8 * dt, diff));
    boat.heading = p.heading + Math.sin(boat.x * 0.01) * 0.04;
    p.timer -= dt;
    if (p.timer <= 0) {
      p.timer = 0.14;
      p.wake.push({ x: boat.x - Math.cos(boat.heading) * boat.length / 2, y: boat.y - Math.sin(boat.heading) * boat.length / 2, age: 0 });
      if (p.wake.length > 16) p.wake.shift();
    }
    for (const point of p.wake) point.age += dt;
    p.wake = p.wake.filter(point => point.age < 1.8);
  }
}
