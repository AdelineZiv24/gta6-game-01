import { FONT } from './config.js';

export const BILLBOARD_BRANDS = [
  { brand: 'CORAL COLA', colors: ['#e2483d', '#ffd166'] },
  { brand: 'HOTEL MARLIN', colors: ['#f2b33d', '#7be3f0'] },
  { brand: 'PIER 9 SEAFOOD', colors: ['#2fd4c4', '#ffe9a8'] },
  { brand: 'BAY FM 101.3', colors: ['#b678f0', '#6ee7ff'] },
  { brand: 'CORAL FM 98.1', colors: ['#f28c3d', '#fff3dc'] },
  { brand: 'VOLTA MOTORS', colors: ['#7be3f0', '#f9d777'] },
];

export function createBillboards(world) {
  const anchors = [
    { x: world.roads.vertical[3].x, y: world.roads.horizontal[3].y },
    world.props.find(prop => prop.kind === 'fountain') || {
      x: world.roads.vertical[4].x,
      y: world.roads.horizontal[2].y,
    },
    world.spawnPoints.pier,
    world.spawnPoints.diner,
    { x: world.roads.vertical[5].x, y: world.roads.horizontal[4].y },
    {
      x: (world.roads.vertical[3].x + world.roads.vertical[4].x) / 2,
      y: (world.roads.horizontal[3].y + world.roads.horizontal[4].y) / 2,
    },
  ];
  const picked = new Set();
  return BILLBOARD_BRANDS.map(({ brand, colors }, index) => {
    const anchor = anchors[index];
    let candidates = world.buildings;
    if (index === 5) {
      const centreX = world.roads.vertical[3].x + 180;
      const centreY = world.roads.horizontal[3].y + 20;
      const inFrame = candidates.filter(candidate => {
        if (candidate.landmark || candidate.width < 150 || picked.has(candidate)) return false;
        const x = candidate.x + 10;
        const y = candidate.y + 8;
        const width = candidate.width - 20;
        return x >= centreX - 430 && x + width <= centreX + 430
          && y >= centreY - 260 && y + 34 <= centreY + 260;
      });
      if (inFrame.length) candidates = inFrame;
    }
    let building;
    let nearest = Infinity;
    for (const candidate of candidates) {
      if (candidate.landmark || candidate.width < 150 || picked.has(candidate)) continue;
      const distance = (candidate.x + candidate.width / 2 - anchor.x) ** 2
        + (candidate.y + candidate.height / 2 - anchor.y) ** 2;
      if (distance < nearest) {
        building = candidate;
        nearest = distance;
      }
    }
    picked.add(building);
    return {
      brand, colors, building, index,
      x: building.x + 10,
      y: building.y + 8,
      width: building.width - 20,
      height: 34,
    };
  });
}

export function billboardGlowAlpha(night) {
  return Math.max(0, Math.min(1, night)) * 0.4;
}

export function billboardGlow(billboard, seconds) {
  return billboard.colors[(Math.floor(seconds / 4) + billboard.index) % billboard.colors.length];
}

export function drawBillboards(context, world, view, night, timeSeconds) {
  const alpha = billboardGlowAlpha(night);
  for (const billboard of world.billboards || []) {
    const { x, y, width, height, colors, brand } = billboard;
    if (x + width < view.x || y + height < view.y
      || x > view.x + view.width || y > view.y + view.height) continue;
    const glow = billboardGlow(billboard, timeSeconds);
    if (alpha > 0) {
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = glow;
      context.beginPath();
      context.roundRect(x - 7, y - 7, width + 14, height + 14, 10);
      context.fill();
      context.restore();
    }
    context.fillStyle = night > 0.05 ? '#14232b' : colors[0];
    context.fillRect(x, y, width, height);
    context.lineWidth = 3;
    context.strokeStyle = night > 0.05 ? glow : '#fff6df';
    context.strokeRect(x, y, width, height);
    for (let offset = 0, position = 0; offset <= width; offset += 18, position += 1) {
      context.fillStyle = night > 0.05 ? glow : colors[position % colors.length];
      for (const edge of [y, y + height]) {
        context.beginPath();
        context.arc(x + offset, edge, 2, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.font = `bold 17px ${FONT}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = night > 0.05 ? glow : '#fff8e6';
    context.fillText(brand, x + width / 2, y + height / 2 + 1, width - 16);
  }
}
