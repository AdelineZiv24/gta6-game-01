import { awardRep, REP_ESCAPE } from './rep.js';
// Shared visibility check: a segment must not intersect any building rectangle.
export function hasSight(world, a, b, range = 420) {
  if (Math.hypot(a.x-b.x,a.y-b.y)>range) return false;
  const dx=b.x-a.x,dy=b.y-a.y;
  for(const r of world.buildings){
    let lo=0,hi=1;
    for(const [origin,delta,min,max] of [[a.x,dx,r.x,r.x+r.width],[a.y,dy,r.y,r.y+r.height]]){
      if(Math.abs(delta)<.00001){if(origin<min||origin>max){lo=2;break;}}
      else {let t1=(min-origin)/delta,t2=(max-origin)/delta;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);}
    }
    if(lo<=hi&&hi>=0&&lo<=1)return false;
  }
  return true;
}
export function createWanted(){return {stars:0,heat:0,seen:false,evade:0,lastCrime:-100,lastId:0,lastKnown:null};}
export function clearWanted(wanted, sequence = wanted.lastId){Object.assign(wanted,createWanted(),{lastId:sequence});}
export function setWanted(wanted,stars,position){wanted.stars=Math.max(0,Math.min(5,Math.floor(stars)));wanted.heat=wanted.stars*25;wanted.evade=0;if(position)wanted.lastKnown={x:position.x,y:position.y};}
export function updateWanted(w,world,player,crimes,witnesses,units,time,dt){
  w.seen=units.some(u=>u.health>0&&hasSight(world,u,player,420));
  if(w.seen)w.lastKnown={x:player.x,y:player.y};
  for(const c of crimes){if(c.id<=w.lastId)continue;w.lastId=c.id;if(c.policeShot)continue;
    const witnessed=c.againstPolice||c.type==='police_hit'||units.some(u=>u.health>0&&hasSight(world,u,c,420))||witnesses.some(p=>p.state!=='down'&&!p.abandoned&&hasSight(world,p,c,300))||units.some(u=>u.health>0&&hasSight(world,u,c,420));
    c.witnessed=Boolean(witnessed);
    if(!witnessed)continue;
    const minor=['vehicle_theft','reckless_crash','vehicle_collision'].includes(c.type);
    w.heat=Math.min(125,w.heat+(minor?12:Math.max(25,c.severity*14)));w.stars=Math.min(5,Math.ceil(w.heat/25));w.lastCrime=time;w.evade=0;w.lastKnown={x:c.x,y:c.y};
  }
  if(!w.stars){w.evade=0;return;}
  if(time-w.lastCrime>12){w.heat=Math.max(0,w.heat-dt*.12);w.stars=Math.ceil(w.heat/25);}
  if(w.seen)w.evade=0;
  else if(time-w.lastCrime>3){w.evade+=dt/(18+w.stars*3);if(w.evade>=1){w.stars--;w.heat=w.stars*25;w.evade=0;}}
}
export function createEscape(){return {peak:0,prev:0};}
export function escapeBonus(peak){return 50*peak;}
export function updateEscape(escape,game){
  if(!escape||!game?.wanted)return 0;
  const stars=game.wanted.stars;
  if(stars>0){escape.peak=escape.prev===0?stars:Math.max(escape.peak,stars);}
  else if(escape.prev>0){
    const peak=escape.peak;escape.peak=0;
    if(peak>=3&&!game.outcome&&(game.police?.arrest??0)<1&&(game.player?.health??0)>0){
      const bonus=escapeBonus(peak);
      game.player.cash+=bonus;if(game.missions)game.missions.totalEarned+=bonus;
      const s=game.missions;
      if(s&&(!s.splash||(game.playSeconds||0)>=(s.splash.until||0)))s.splash={header:'WANTED CLEARED',name:'ESCAPED',reward:bonus,total:game.player.cash,until:(game.playSeconds||0)+2.8};
      awardRep(game,REP_ESCAPE*peak);
      escape.prev=0;return bonus;
    }
  }
  escape.prev=stars;return 0;
}
