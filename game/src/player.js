import { PLAYER } from './config.js';

export function createPlayer(spawn) {
  return { name: 'Dario Venn', x: spawn.x, y: spawn.y, previousX: spawn.x, previousY: spawn.y,
    facing: spawn.heading ?? 0, vx: 0, vy: 0, radius: PLAYER.radius,
    health: 100, maxHealth: 100, armour: 0, maxArmour: 100, cash: 180, stride: 0 };
}

export function updatePlayer(player, input, world, dt) {
  player.previousX = player.x; player.previousY = player.y;
  let x = Number(input.isDown('KeyD') || input.isDown('ArrowRight')) - Number(input.isDown('KeyA') || input.isDown('ArrowLeft'));
  let y = Number(input.isDown('KeyS') || input.isDown('ArrowDown')) - Number(input.isDown('KeyW') || input.isDown('ArrowUp'));
  const length = Math.hypot(x, y);
  if (length) { x /= length; y /= length; player.facing = Math.atan2(y, x); }
  const speed = input.isDown('ShiftLeft') || input.isDown('ShiftRight') ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
  const smoothing = 1 - Math.exp(-14 * dt);
  player.vx += (x * speed - player.vx) * smoothing;
  player.vy += (y * speed - player.vy) * smoothing;
  const blocked = (px, py) => world.collidesCircle(px, py, player.radius) || world.pointInWater({ x: px, y: py + player.radius });
  // Small axis-separated steps prevent tunnelling and preserve sliding at walls.
  const steps = Math.max(1, Math.ceil(Math.hypot(player.vx, player.vy) * dt / (player.radius / 2)));
  const dx = player.vx * dt / steps, dy = player.vy * dt / steps;
  for (let i = 0; i < steps; i++) {
    if (!blocked(player.x + dx, player.y)) player.x += dx;
    if (!blocked(player.x, player.y + dy)) player.y += dy;
  }
  player.stride += Math.hypot(player.x - player.previousX, player.y - player.previousY) * 0.12;
}

export function drawPlayer(ctx, player, alpha = 1) {
  const x = player.previousX + (player.x - player.previousX) * alpha;
  const y = player.previousY + (player.y - player.previousY) * alpha;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#183d4055'; ctx.beginPath(); ctx.ellipse(3, 5, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(player.facing);
  const swing = Math.sin(player.stride) * Math.min(5, Math.hypot(player.vx, player.vy) / 30);
  ctx.fillStyle = '#24394e'; ctx.fillRect(-6 + swing, -8, 12, 6); ctx.fillRect(-6 - swing, 2, 12, 6);
  ctx.fillStyle = '#f37f64'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b987'; ctx.beginPath(); ctx.arc(4, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#343132'; ctx.beginPath(); ctx.arc(2, 0, 5, Math.PI / 2, Math.PI * 1.5); ctx.fill();
  ctx.restore();
}
