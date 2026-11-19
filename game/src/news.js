import { gasStations } from './fuel.js';
import { sprayGarages } from './spray.js';

export function createNews() {
  return { banner: null, ticker: null, lastHeadline: null };
}

export function newsAnchors(world) {
  const anchors = [];
  const mart = world.buildings.find(building => building.storefront?.sign === 'CORAL MART');
  if (mart) anchors.push({ name: 'CORAL MART', x: mart.x + mart.width / 2, y: mart.y + mart.height / 2 });
  const spray = sprayGarages(world)[0];
  if (spray) anchors.push({ name: 'CORAL SPRAY', x: spray.x, y: spray.y });
  const { diner, pier } = world.spawnPoints;
  anchors.push({ name: 'MARLIN DINER', x: diner.x, y: diner.y });
  anchors.push({ name: 'THE PIER', x: pier.x, y: pier.y });
  for (const station of gasStations(world)) anchors.push({ name: 'GAS STATION', x: station.x, y: station.y });
  anchors.push({ name: 'DOWNTOWN', x: world.roads.vertical[3].x, y: world.roads.horizontal[3].y });
  anchors.push({ name: 'THE HARBOR', x: world.roads.vertical[5].x, y: world.roads.horizontal[4].y });
  anchors.push({ name: 'WEST BEACH', x: world.roads.vertical[1].x, y: world.roads.horizontal[6].y });
  return anchors;
}

export function newsHeadline(type, x, y, world) {
  const nearest = newsAnchors(world).reduce((best, anchor) =>
    Math.hypot(anchor.x - x, anchor.y - y) < Math.hypot(best.x - x, best.y - y) ? anchor : best);
  const templates = { explosion: 'EXPLOSION ROCKS', police_hit: 'OFFICER DOWN IN', robbery: 'ARMED ROBBERY AT' };
  return `${templates[type]} ${nearest.name}`;
}

export function newsCrime(news, crime, world) {
  if (!news || !crime) return false;
  if (crime.type !== 'robbery' && !(crime.severity >= 4 && (crime.type === 'explosion' || crime.type === 'police_hit'))) return false;
  const headline = newsHeadline(crime.type, crime.x, crime.y, world);
  news.banner = { headline, t: 0, dur: 5 };
  news.lastHeadline = headline;
  return true;
}

export function updateNews(news, dt) {
  if (news.banner) {
    const banner = news.banner;
    banner.t += dt;
    if (banner.t >= banner.dur || banner.dur - banner.t < 1e-9) {
      news.ticker = { headline: banner.headline, t: 0, dur: 12 };
      news.banner = null;
    }
  } else if (news.ticker) {
    news.ticker.t += dt;
    if (news.ticker.t >= news.ticker.dur || news.ticker.dur - news.ticker.t < 1e-9) news.ticker = null;
  }
}
