export const WEATHER_PERIOD = 195;
export const WEATHER_RAIN_START = 150;
export function weatherAt(seconds) {
  const t = ((seconds % WEATHER_PERIOD) + WEATHER_PERIOD) % WEATHER_PERIOD;
  return t >= WEATHER_RAIN_START ? 'rain' : 'clear';
}
export function weatherLabel(seconds) {
  return weatherAt(seconds) === 'rain' ? 'WEATHER · RAIN' : 'WEATHER · CLEAR';
}
export function drawRain(ctx, game, time) {
  ctx.save();
  ctx.setTransform(game.pixelRatio, 0, 0, game.pixelRatio, 0, 0);
  ctx.fillStyle = 'rgba(88,108,128,0.12)';
  ctx.fillRect(0, 0, game.width, game.height);
  ctx.strokeStyle = 'rgba(205,226,240,0.33)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 120; i++) {
    const sx = ((i * 167.31 + time * 0.16) % (game.width + 90)) - 45;
    const sy = ((i * 89.17 + time * 0.62) % (game.height + 70)) - 35;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 4, sy + 14);
  }
  ctx.stroke();
  ctx.restore();
}

export function rainIntensity(seconds) {
  const t = ((seconds % WEATHER_PERIOD) + WEATHER_PERIOD) % WEATHER_PERIOD;
  if (t < WEATHER_RAIN_START) return 0;
  return Math.min(1, (t - WEATHER_RAIN_START) / 8, (WEATHER_PERIOD - t) / 8);
}
