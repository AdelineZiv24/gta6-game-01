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

export function signHaloAlpha(night) {
  return Math.max(0, Math.min(1, night)) * 0.4;
}

export function lampPoolAlpha(night) {
  return Math.max(0, Math.min(1, night)) * 0.16;
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
  if (world.water.y >= view.y - 10 && world.water.y <= view.y + view.height + 10) {
    const tide = Math.sin(time * .0008) * 2;
    context.strokeStyle = 'rgba(255,250,226,.55)'; context.lineWidth = 3;
    context.beginPath();
    const start = Math.max(0, Math.floor(view.x / 40) * 40);
    for (let x = start; x <= Math.min(WORLD.width, view.x + view.width + 40); x += 40) {
      const y = world.water.y + 3 + tide + Math.sin(x * .022 + time * .0011) * 2;
      if (x === start) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.stroke();
  }
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
  const halo = signHaloAlpha(night);
  context.fillStyle = PALETTE.shadow;
  roundedRect(context, x + 8, y + 12, width, height, 5);
  context.fillStyle = building.facade;
  roundedRect(context, x, y, width, height, 4);
  context.fillStyle = building.roof;
  context.fillRect(x + 5, y + 5, width - 10, height - 10);
  context.fillStyle = building.facade;
  context.fillRect(x + 11, y + 11, width - 22, height - 22);
  if (building.storefront) {
    const awningY = y + height - 30;
    context.fillStyle = '#fff2d5'; context.fillRect(x + 12, awningY - 4, width - 24, 5);
    context.fillStyle = building.storefront.color; context.fillRect(x + 12, awningY, width - 24, 10);
    if (halo > 0) {
      context.save(); context.globalAlpha = halo; context.fillStyle = building.storefront.color;
      roundedRect(context, x + width * .28 - 6, y + height - 23, width * .44 + 12, 29, 9);
      context.restore();
    }
    context.fillStyle = '#fff8df'; context.fillRect(x + width * .28, y + height - 17, width * .44, 17);
    context.fillStyle = building.storefront.color; context.font = `bold 8px ${FONT}`; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(building.storefront.sign, x + width / 2, y + height - 12, width * .42);
  }
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
  for (const prop of building.rooftop || []) {
    const { x: px, y: py } = prop;
    if (prop.kind === 'ac') {
      context.fillStyle = PALETTE.shadow; context.fillRect(px + 4, py + 5, prop.width, prop.height);
      context.fillStyle = '#788888'; context.fillRect(px, py, prop.width, prop.height);
      context.fillStyle = '#d1d5c5'; context.fillRect(px, py, prop.width, 3);
      context.fillStyle = '#465c60';
      for (let vent = 5; vent < prop.width - 3; vent += 4) context.fillRect(px + vent, py + 5, 2, 6);
    } else if (prop.kind === 'tank') {
      context.fillStyle = PALETTE.shadow; context.beginPath(); context.ellipse(px + 5, py + 6, 11, 10, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#647775'; context.fillRect(px - 8, py, 16, 12);
      context.fillStyle = '#d4d6bf'; context.beginPath(); context.ellipse(px, py, prop.radius, 7, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#8faaa3'; context.fillRect(px - 5, py - 2, 10, 2);
    } else {
      context.strokeStyle = '#4c6464'; context.lineWidth = 1.5; context.beginPath();
      if (prop.kind === 'aerial') {
        context.moveTo(px + 4, py + 7); context.lineTo(px, py - 14);
        context.moveTo(px - 10, py - 10); context.lineTo(px + 10, py - 10);
        context.moveTo(px - 6, py - 16); context.lineTo(px + 6, py - 16);
      } else {
        context.moveTo(px, py); context.lineTo(px + prop.width, py);
        for (let post = 0; post <= prop.width; post += 10) { context.moveTo(px + post, py - 3); context.lineTo(px + post, py + 4); }
      }
      context.stroke();
    }
  }
  if (building.landmark) {
    if (halo > 0) {
      context.save(); context.globalAlpha = halo; context.fillStyle = building.facade;
      roundedRect(context, x + width / 2 - 50, y - 18, 100, 32, 8);
      context.restore();
    }
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
    const pool = lampPoolAlpha(night);
    if (pool > 0) {
      context.save(); context.globalAlpha = pool; context.fillStyle = '#ffd98c';
      context.beginPath(); context.ellipse(9, 4, 30, 19, 0, 0, Math.PI * 2); context.fill();
      context.restore();
    }
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
  } else if (prop.kind === 'billboard') {
    context.fillStyle = '#4a5554'; context.fillRect(-3, 0, 6, 38);
    context.fillStyle = '#f4e2b9'; context.fillRect(-74, -38, 148, 39);
    context.fillStyle = '#d45748'; context.fillRect(-74, -38, 148, 6);
    context.fillStyle = '#285c60'; context.font = `bold 9px ${FONT}`; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(prop.slogan, 0, -17, 136);
  } else if (prop.kind === 'umbrella') {
    context.fillStyle = PALETTE.shadow; context.beginPath(); context.ellipse(7, 9, 23, 18, 0, 0, Math.PI * 2); context.fill();
    for (let panel = 0; panel < 8; panel++) {
      context.fillStyle = panel % 2 ? '#fff0cf' : prop.color;
      context.beginPath(); context.moveTo(0, 0); context.arc(0, 0, 22, panel * Math.PI / 4, (panel + 1) * Math.PI / 4); context.closePath(); context.fill();
    }
    context.fillStyle = '#f7e6bd'; context.beginPath(); context.arc(0, 0, 3, 0, Math.PI * 2); context.fill();
  } else if (prop.kind === 'towel') {
    context.fillStyle = PALETTE.shadow; context.fillRect(-10, -17, 23, 38);
    context.fillStyle = prop.color; context.fillRect(-12, -20, 23, 38);
    context.fillStyle = '#f9ecd0'; context.fillRect(-12, -16, 23, 3); context.fillRect(-12, 10, 23, 3);
  } else if (prop.kind === 'shelter') {
    context.fillStyle = '#4b7777'; context.fillRect(-28, -15, 56, 4); context.fillRect(-25, -11, 3, 24); context.fillRect(22, -11, 3, 24);
    context.fillStyle = 'rgba(207,239,230,.72)'; context.fillRect(-22, -9, 44, 17);
    context.fillStyle = '#315a60'; context.fillRect(-30, 8, 60, 5);
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
  context.strokeStyle = 'rgba(255,239,187,.62)'; context.lineWidth = 2; context.setLineDash([18, 24]);
  for (const road of world.roads.horizontal) if (road.width >= 90 && visible({x:view.x,y:road.y-road.width/2,width:view.width,height:road.width},view)) { context.beginPath(); context.moveTo(view.x,road.y); context.lineTo(view.x+view.width,road.y); context.stroke(); }
  context.setLineDash([]);
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
    if (boat.patrol) for (const point of boat.patrol.wake) { context.fillStyle = `rgba(235,250,245,${0.16 * (1 - point.age / 1.8)})`; context.beginPath(); context.ellipse(point.x, point.y, 6 + point.age * 7, 3.5 + point.age * 3.5, 0, 0, Math.PI * 2); context.fill(); }
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

export function districtTint(x,y,world) {
  if(y>=world.beach.y)return null;
  if(x>world.pier.x-620&&y>world.roads.horizontal[world.roads.horizontal.length-1].y-40)return 'rgba(110,165,205,0.30)';
  const midX=(world.roads.vertical[3].x+world.roads.vertical[4].x)/2,midY=(world.roads.horizontal[2].y+world.roads.horizontal[3].y)/2;
  if(Math.abs(x-midX)<560&&Math.abs(y-midY)<500)return 'rgba(245,200,95,0.30)';
  if(y>world.roads.horizontal[world.roads.horizontal.length-1].y-460)return 'rgba(250,220,150,0.32)';
  return ((Math.floor(x/482)+Math.floor(y/422))%2)?'rgba(255,255,255,0.10)':'rgba(46,110,60,0.14)';
}

export function drawMinimapBase(canvas, world) {
  const context = canvas.getContext('2d');
  const sx = canvas.width / WORLD.width;
  const sy = canvas.height / WORLD.height;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = PALETTE.grass; context.fillRect(0, 0, canvas.width, canvas.height);
  for(let column=0;column<world.roads.vertical.length-1;column++)for(let row=0;row<world.roads.horizontal.length;row++){
    const left=world.roads.vertical[column],right=world.roads.vertical[column+1],top=world.roads.horizontal[row],bottom=world.roads.horizontal[row+1];
    const x0=left.x+left.width/2,x1=right.x-right.width/2,y0=top.y+top.width/2,y1=bottom?bottom.y-bottom.width/2:world.beach.y;
    if(x1<=x0||y1<=y0)continue;
    const tint=districtTint((x0+x1)/2,(y0+y1)/2,world);
    if(tint){context.fillStyle=tint;context.fillRect(x0*sx,y0*sy,(x1-x0)*sx,(y1-y0)*sy);}
  }
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
