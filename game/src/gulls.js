export const GULL_COUNT = 6;

export function gullPosition(index, time) {
  const cx = 620 + index * 590;
  const cy = 3160 + (index % 3) * 78;
  const rx = 120 + (index % 3) * 42;
  const ry = 24 + (index % 2) * 10;
  const angle = time * 0.00011 * (1 + (index % 3) * 0.18) + index * 1.93;
  return {
    x: cx + Math.cos(angle) * rx,
    y: cy + Math.sin(angle) * ry,
    flap: Math.sin(time * 0.018 + index * 1.7) >= 0 ? 5 : -3,
  };
}

export function drawGulls(ctx, g, time) {
  if (!g || !g.world) return;
  ctx.save(); ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < GULL_COUNT; i++) {
    const { x, y, flap } = gullPosition(i, time);
    ctx.fillStyle = 'rgba(23,49,48,.16)';
    ctx.beginPath(); ctx.ellipse(x + 16, y + 92, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(250,252,252,.92)';
    ctx.beginPath();
    ctx.moveTo(x - 9, y - flap); ctx.quadraticCurveTo(x - 4, y + 2, x, y);
    ctx.quadraticCurveTo(x + 4, y + 2, x + 9, y - flap);
    ctx.stroke();
    ctx.fillStyle = '#f4f7f4'; ctx.beginPath(); ctx.ellipse(x, y, 3.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
