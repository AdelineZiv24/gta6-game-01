import { CAMERA, CITY, FONT, PALETTE, WORLD } from './config.js';
import { clamp, createRandom } from './random.js';

function visible(rect, view) {
  return rect.x < view.x + view.width && rect.x + rect.width > view.x && rect.y < view.y + view.height && rect.y + rect.height > view.y;
}

export function createCamera(x = WORLD.width / 2, y = WORLD.height / 2, width = CAMERA.width, height = CAMERA.height) {
  const camera = { x, y, width, height };
  camera.follow = (targetX, targetY, amount = CAMERA.followLerp) => {
    camera.x += (targetX - camera.x) * amount;
    camera.y += (targetY - camera.y) * amount;
    camera.clamp();
  };
  camera.clamp = () => {
    camera.x = clamp(camera.x, camera.width / 2, WORLD.width - camera.width / 2);
    camera.y = clamp(camera.y, camera.height / 2, WORLD.height - camera.height / 2);
  };
  camera.view = () => ({ x: camera.x - camera.width / 2, y: camera.y - camera.height / 2, width: camera.width, height: camera.height });
  return camera;
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

const asphaltRandom = createRandom('coral-bay-asphalt');
const asphaltSpecks = Array.from({ length: 1500 }, () => ({ x: asphaltRandom() * WORLD.width, y: asphaltRandom() * CITY.beachStartY }));

function drawWater(context, world, view, time) {
  context.fillStyle = PALETTE.water;
  context.fillRect(world.water.x, world.water.y, world.water.width, world.water.height);
  const minX = Math.max(0, Math.floor(view.x / 210) * 210);
  const maxX = view.x + view.width;
  const minY = Math.max(world.water.y, view.y);
  const maxY = Math.min(WORLD.height, view.y + view.height);
  context.lineWidth = 2;
  for (let y = minY; y < maxY; y += 38) {
    for (let x = minX; x < maxX; x += 210) {
      const offset = Math.sin(time * 0.001 + x * 0.025 + y * 0.013) * 15;
      context.strokeStyle = (Math.floor(x / 210 + y / 38) % 2) ? 'rgba(230,255,235,0.15)' : 'rgba(255,255,255,0.23)';
      context.beginPath();
      context.moveTo(x + offset, y);
      context.quadraticCurveTo(x + 28 + offset, y - 4, x + 56 + offset, y);
      context.stroke();
    }
  }
}

function drawRoads(context, world, view) {
  for (const road of world.roads.horizontal) {
    const rect = { x: 0, y: road.y - road.width / 2, width: WORLD.width, height: road.width };
    if (!visible(rect, view)) continue;
    context.fillStyle = PALETTE.roadEdge; context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.fillStyle = PALETTE.road; context.fillRect(rect.x, rect.y + 5, rect.width, rect.height - 10);
    context.strokeStyle = PALETTE.roadMark; context.lineWidth = 3; context.setLineDash([22, 22]);
    context.beginPath(); context.moveTo(view.x, road.y); context.lineTo(view.x + view.width, road.y); context.stroke();
    context.setLineDash([]);
  }
  for (const road of world.roads.vertical) {
    const rect = { x: road.x - road.width / 2, y: 0, width: road.width, height: road.length };
    if (!visible(rect, view)) continue;
    context.fillStyle = PALETTE.roadEdge; context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.fillStyle = PALETTE.road; context.fillRect(rect.x + 5, rect.y, rect.width - 10, rect.height);
    context.strokeStyle = PALETTE.roadMark; context.lineWidth = 3; context.setLineDash([22, 22]);
    context.beginPath(); context.moveTo(road.x, view.y); context.lineTo(road.x, view.y + view.height); context.stroke();
    context.setLineDash([]);
  }
  for (const h of world.roads.horizontal) for (const v of world.roads.vertical) {
    if (h.y < view.y - 60 || h.y > view.y + view.height + 60 || v.x < view.x - 60 || v.x > view.x + view.width + 60) continue;
    context.fillStyle = 'rgba(245, 239, 215, 0.75)';
    for (let dash = -3; dash <= 3; dash += 1) {
      context.fillRect(v.x + dash * 10, h.y - 44, 5, 16);
      context.fillRect(v.x + dash * 10, h.y + 28, 5, 16);
      context.fillRect(v.x - 44, h.y + dash * 10, 16, 5);
      context.fillRect(v.x + 28, h.y + dash * 10, 16, 5);
    }
  }
}

function drawBuilding(context, building, night = 0) {
  const { x, y, width, height } = building;
  context.fillStyle = PALETTE.shadow;
  roundedRect(context, x + 8, y + 12, width, height, 5);
  context.fillStyle = building.facade;
  roundedRect(context, x, y, width, height, 4);
  context.fillStyle = building.roof;
  context.fillRect(x + 5, y + 5, width - 10, height - 10);
  context.fillStyle = building.facade;
  context.fillRect(x + 11, y + 11, width - 22, height - 22);
  const padX = Math.max(14, width * 0.1);
  const padY = Math.max(16, height * 0.12);
  const gapX = (width - padX * 2) / building.windowCols;
  const gapY = (height - padY * 2) / building.windowRows;
  const winW = Math.max(7, Math.min(15, gapX * 0.48));
  const winH = Math.max(8, Math.min(13, gapY * 0.42));
  context.fillStyle = night > 0.15 ? PALETTE.windowLit : PALETTE.window;
  for (let row = 0; row < building.windowRows; row += 1) {
    for (let col = 0; col < building.windowCols; col += 1) context.fillRect(x + padX + col * gapX + (gapX - winW) / 2, y + padY + row * gapY + (gapY - winH) / 2, winW, winH);
  }
  if (building.landmark) {
    context.fillStyle = '#fff8df'; roundedRect(context, x + width / 2 - 44, y - 12, 88, 20, 3);
    context.fillStyle = '#384d4e'; context.font = `bold 9px ${FONT}`; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(building.short, x + width / 2, y - 2);
  }
}

function drawProp(context, prop, night = 0) {
  context.save(); context.translate(prop.x, prop.y); context.rotate(prop.rotation ?? 0); context.scale(prop.scale, prop.scale);
  if (prop.kind === 'palm') {
    context.strokeStyle = PALETTE.palmTrunk; context.lineWidth = 7; context.beginPath(); context.moveTo(0, 8); context.quadraticCurveTo(4, -8, 0, -22); context.stroke();
    context.strokeStyle = PALETTE.palm; context.lineWidth = 5;
    for (let index = 0; index < 7; index += 1) { const angle = index * Math.PI * 2 / 7; context.beginPath(); context.moveTo(0, -21); context.quadraticCurveTo(Math.cos(angle) * 22, -29 + Math.sin(angle) * 12, Math.cos(angle) * 35, -18 + Math.sin(angle) * 22); context.stroke(); }
  } else if (prop.kind === 'lamp') {
    context.strokeStyle = PALETTE.lamp; context.lineWidth = 4; context.beginPath(); context.moveTo(0, 10); context.lineTo(0, -18); context.lineTo(9, -24); context.stroke();
    context.fillStyle = night > 0.15 ? '#ffe6a0' : '#fff2bb';
    if (night > 0.15) { context.shadowColor = '#ffd970'; context.shadowBlur = 18; }
    context.beginPath(); context.arc(9, -24, 4, 0, Math.PI * 2); context.fill();
  } else if (prop.kind === 'bench') {
    context.fillStyle = PALETTE.bench; context.fillRect(-12, -4, 24, 5); context.fillRect(-12, 3, 24, 5); context.fillRect(-9, 8, 3, 6); context.fillRect(6, 8, 3, 6);
  } else if (prop.kind === 'fountain') {
    context.fillStyle = '#b9c7c2'; context.beginPath(); context.ellipse(0, 5, 30, 14, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#5fb5bd'; context.beginPath(); context.ellipse(0, 3, 23, 9, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#d7ddd0'; context.fillRect(-4, -18, 8, 20);
  } else if (prop.kind === 'path') {
    context.fillStyle = '#d7bd8c'; context.fillRect(-(prop.width || 18) / 2, -(prop.height || 18) / 2, prop.width || 18, prop.height || 18);
  } else {
    context.fillStyle = '#d75b50'; context.fillRect(-3, -7, 6, 14); context.fillStyle = '#eee5d4'; context.fillRect(-4, -2, 8, 3);
  }
  context.restore();
}

function paintWorld(context, world, view, time = 0, clockMinutes = 600) {
  const hour = ((clockMinutes % 1440) + 1440) % 1440;
  const daylight = Math.max(0, Math.min(1, (Math.sin((hour - 360) / 1440 * Math.PI * 2) + 0.18) / 1.18));
  const warm = Math.max(0, 1 - Math.abs(hour - 720) / 480) < 0.35 ? 0.12 : 0;
  const night = 1 - daylight;
  context.fillStyle = PALETTE.grass;
  context.fillRect(0, 0, WORLD.width, CITY.beachStartY);
  context.fillStyle = PALETTE.grassDark;
  for (let y = 80; y < CITY.beachStartY; y += 240) context.fillRect(0, y, WORLD.width, 4);
  drawWater(context, world, view, time);
  context.fillStyle = PALETTE.sand; context.fillRect(world.beach.x, world.beach.y, world.beach.width, world.beach.height);
  context.fillStyle = PALETTE.sandLight; context.fillRect(0, world.beach.y, WORLD.width, 10);
  context.fillStyle = '#a98763'; context.fillRect(world.pier.x, world.pier.y, world.pier.width, world.pier.height);
  context.strokeStyle = '#d1ae7d'; context.lineWidth = 6;
  for (let x = world.pier.x + 20; x < world.pier.x + world.pier.width; x += 44) { context.beginPath(); context.moveTo(x, world.pier.y); context.lineTo(x, world.pier.y + world.pier.height); context.stroke(); }
  drawRoads(context, world, view);
  context.fillStyle = PALETTE.sidewalk;
  for (const sidewalk of world.sidewalks) if (visible(sidewalk, view)) context.fillRect(sidewalk.x, sidewalk.y, sidewalk.width, sidewalk.height);
  context.fillStyle = 'rgba(35, 40, 43, 0.18)';
  for (const { x, y } of asphaltSpecks) {
    const onHorizontal = world.roads.horizontal.some((road) => Math.abs(y - road.y) < road.width * 0.43);
    const onVertical = world.roads.vertical.some((road) => Math.abs(x - road.x) < road.width * 0.43 && y < road.length);
    if ((onHorizontal || onVertical) && x >= view.x && x <= view.x + view.width && y >= view.y && y <= view.y + view.height) context.fillRect(x, y, 2, 2);
  }
  for (const building of world.buildings) if (visible(building, view)) drawBuilding(context, building, night);
  for (const prop of world.props) if (prop.x >= view.x - 42 && prop.x <= view.x + view.width + 42 && prop.y >= view.y - 48 && prop.y <= view.y + view.height + 48) drawProp(context, prop, night);
  for (const boat of world.boats) if (boat.x >= view.x - 70 && boat.x <= view.x + view.width + 70 && boat.y >= view.y - 40 && boat.y <= view.y + view.height + 40) {
    context.save(); context.translate(boat.x, boat.y); context.rotate(boat.heading); context.fillStyle = '#f4e3bf';
    context.beginPath(); context.moveTo(-boat.length / 2, 0); context.lineTo(-boat.length / 2 + 10, -9); context.lineTo(boat.length / 2, -6); context.lineTo(boat.length / 2 - 8, 9); context.closePath(); context.fill();
    context.fillStyle = '#50858b'; context.fillRect(-boat.length * .16, -5, boat.length * .3, 8); context.restore();
  }
  if (night > 0.05) {
    context.fillStyle = `rgba(18, 38, 88, ${0.34 * night})`;
    context.fillRect(view.x, view.y, view.width, view.height);
    if (warm > 0) { context.fillStyle = `rgba(255, 143, 76, ${warm})`; context.fillRect(view.x, view.y, view.width, view.height); }
  }
}

export function drawMinimapBase(canvas, world) {
  const context = canvas.getContext('2d');
  const sx = canvas.width / WORLD.width;
  const sy = canvas.height / WORLD.height;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = PALETTE.grass; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = PALETTE.water; context.fillRect(0, world.water.y * sy, canvas.width, canvas.height - world.water.y * sy);
  context.fillStyle = PALETTE.sand; context.fillRect(0, world.beach.y * sy, canvas.width, world.beach.height * sy);
  context.fillStyle = PALETTE.road;
  for (const road of world.roads.horizontal) context.fillRect(0, (road.y - road.width / 2) * sy, canvas.width, road.width * sy);
  for (const road of world.roads.vertical) context.fillRect((road.x - road.width / 2) * sx, 0, road.width * sx, road.length * sy);
  context.fillStyle = PALETTE.sidewalk;
  for (const sidewalk of world.sidewalks) context.fillRect(sidewalk.x * sx, sidewalk.y * sy, sidewalk.width * sx, sidewalk.height * sy);
  context.fillStyle = '#bf8e61'; context.fillRect(world.pier.x * sx, world.pier.y * sy, world.pier.width * sx, world.pier.height * sy);
  context.fillStyle = '#fff3d5';
  for (const building of world.buildings) if (building.landmark) context.fillRect(building.x * sx, building.y * sy, building.width * sx, building.height * sy);
  return canvas;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const camera = createCamera();
  let pixelRatio = 1;
  function resize() {
    pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * pixelRatio);
    canvas.height = Math.round(window.innerHeight * pixelRatio);
  }
  function draw(world, target, time = 0, clockMinutes = 600) {
    if (target) camera.follow(target.x, target.y);
    const view = camera.view();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.waterDeep; context.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / camera.width, canvas.height / camera.height);
    const offsetX = (canvas.width - camera.width * scale) / 2;
    const offsetY = (canvas.height - camera.height * scale) / 2;
    context.setTransform(scale, 0, 0, scale, offsetX - view.x * scale + Math.sin(time*.071)*(camera.shake||0)*scale, offsetY - view.y * scale + Math.cos(time*.097)*(camera.shake||0)*scale);
    paintWorld(context, world, view, time, clockMinutes);
  }
  resize(); window.addEventListener('resize', resize);
  return { camera, draw, resize };
}
