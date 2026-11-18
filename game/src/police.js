import { createCar, carBlocked, emitVehicleImpact } from './vehicles.js';
import { hasSight } from './wanted.js';
import { angleDifference } from './random.js';

export function createPolice(){return {units:[],spawnTimer:0,arrest:0,nextId:0};}
export function spawnPolice(police,x,y,heading=0,interceptor=false){
  const car=createCar(x,y,heading,1,interceptor?'#243f50':'#f2f3e7','police-driven');car.police=true;car.interceptor=interceptor;car.model={...car.model,name:interceptor?'CBPD Interceptor':'CBPD Patrol'};
  const unit={id:++police.nextId,x,y,car,health:100,onFoot:false,down:false,lost:0,life:24,fireTimer:1,hostile:false,waypoint:null};police.units.push(unit);return unit;
}
function nearest(list,value,key){return list.reduce((a,b)=>Math.abs(b[key]-value)<Math.abs(a[key]-value)?b:a);}
// A modest grid route: join the nearest intersection, then follow road axes.
function waypoint(world,u,target){
  const vs=world.roads.vertical,hs=world.roads.horizontal;
  const v=nearest(vs,u.x,'x'),h=nearest(hs,u.y,'y');
  if(Math.abs(u.x-v.x)>6&&Math.abs(u.y-h.y)>6)return Math.abs(u.x-v.x)<Math.abs(u.y-h.y)?{x:v.x,y:u.y}:{x:u.x,y:h.y};
  const tv=nearest(vs,target.x,'x'),th=nearest(hs,target.y,'y');
  if(Math.abs(u.x-v.x)<=6&&Math.abs(u.y-h.y)>6)return {x:v.x,y:h.y};
  if(Math.abs(u.y-h.y)<=6&&Math.abs(u.x-v.x)>6)return {x:v.x,y:h.y};
  if(Math.abs(tv.x-u.x)>8)return {x:u.x+Math.sign(tv.x-u.x)*Math.min(482,Math.abs(tv.x-u.x)),y:h.y};
  if(Math.abs(th.y-u.y)>8)return {x:v.x,y:u.y+Math.sign(th.y-u.y)*Math.min(422,Math.abs(th.y-u.y))};
  return target;
}
export function updatePolice(police,game,world,camera,dt,fire){
  const w=game.wanted,p=game.player,focus=game.vehicle||p;
  police.spawnTimer-=dt;
  if(w.stars&&police.units.length<Math.min(7,w.stars+1)&&police.spawnTimer<=0){
    police.spawnTimer=4;
    const station=world.spawnPoints.police;
    const candidates=[{x:nearest(world.roads.vertical,station.x,'x').x,y:nearest(world.roads.horizontal,station.y,'y').y}];
    for(const v of world.roads.vertical)for(const h of world.roads.horizontal)candidates.push({x:v.x,y:h.y});
    const spots=candidates.filter(s=>(Math.abs(s.x-camera.x)>camera.width/2+80||Math.abs(s.y-camera.y)>camera.height/2+80)&&Math.hypot(s.x-focus.x,s.y-focus.y)<1600&&!police.units.some(u=>Math.hypot(u.x-s.x,u.y-s.y)<80));
    const spot=spots.sort((a,b)=>Math.hypot(a.x-focus.x,a.y-focus.y)-Math.hypot(b.x-focus.x,b.y-focus.y))[0];
    if(spot)spawnPolice(police,spot.x,spot.y,0,w.stars>=3&&police.units.length>=2&&!police.units.some(unit=>unit.car.interceptor));
  }
  let close=0;const bearings=[];
  for(let i=police.units.length-1;i>=0;i--){const u=police.units[i],car=u.car;
    const distance=Math.hypot(u.x-focus.x,u.y-focus.y);
    if((!w.stars&&distance>650)||(u.onFoot&&(u.life<=0||u.health<=0))){police.units.splice(i,1);continue;}
    if(u.health<=0){u.down=true;car.speed=car.vx=car.vy=0;continue;}
    if(car.health<=0&&!u.onFoot){u.onFoot=true;car.speed=car.vx=car.vy=0;car.driver='wrecked';u.life=24;u.x=car.x+32;u.y=car.y;}
    const sees=hasSight(world,u,focus,420);u.lost=sees?0:u.lost+dt;
    let target=sees?focus:(w.lastKnown||focus);
    if(u.lost>8&&Math.hypot(u.x-target.x,u.y-target.y)<100){const phase=Math.floor(game.playSeconds/5)+u.id;target={x:nearest(world.roads.vertical,target.x,'x').x+Math.sin(phase*Math.PI/2)*482,y:nearest(world.roads.horizontal,target.y,'y').y+Math.cos(phase*Math.PI/2)*422};}
    if(!game.vehicle&&sees&&distance<150)u.onFoot=true;
    if(u.onFoot){
      u.life-=car.health<=0?dt:0;u.facing=Math.atan2(target.y-u.y,target.x-u.x);
      if(w.stars&&distance>23){const s=(120+w.stars*9)*dt,dx=Math.cos(u.facing)*s,dy=Math.sin(u.facing)*s;if(!world.collidesCircle(u.x+dx,u.y,10))u.x+=dx;if(!world.collidesCircle(u.x,u.y+dy,10))u.y+=dy;}
      if(sees&&(u.hostile||w.stars>=3)){u.fireTimer-=dt;if(u.fireTimer<=0&&distance<350){u.fireTimer=1.5-w.stars*.12;fire(u);}}
      // Return to the patrol car if Dario drives away.
      if(game.vehicle&&car.health>0&&distance>210){u.onFoot=false;u.x=car.x;u.y=car.y;}
    } else if(w.stars){
      if(!u.waypoint||Math.hypot(u.waypoint.x-u.x,u.waypoint.y-u.y)<8)u.waypoint=waypoint(world,u,target);
      const direct=sees&&hasSight(world,car,target,300)&&!carBlocked(world,car,(car.x+target.x)/2,(car.y+target.y)/2);
      const aim=direct?{x:target.x+(w.stars>=3?(target.vx||0)*.35:0),y:target.y+(w.stars>=3?(target.vy||0)*.35:0)}:u.waypoint;
      const angle=Math.atan2(aim.y-car.y,aim.x-car.x);car.heading+=angleDifference(car.heading,angle)*Math.min(1,dt*6);
      const desired=distance<65?(game.vehicle&&w.stars>=3?160:0):145+w.stars*27;
      car.speed+=(desired-car.speed)*Math.min(1,dt*2);car.vx=Math.cos(car.heading)*car.speed;car.vy=Math.sin(car.heading)*car.speed;
      const dx=car.vx*dt,dy=car.vy*dt;
      if(!carBlocked(world,car,car.x+dx,car.y+dy)){car.x+=dx;car.y+=dy;}else {emitVehicleImpact(game.vehicleEffects,car.x+Math.cos(car.heading)*car.model.length/2,car.y+Math.sin(car.heading)*car.model.length/2,car.speed,false,car);car.speed=car.vx=car.vy=0;u.waypoint=null;}
      u.x=car.x;u.y=car.y;
    }else car.speed=car.vx=car.vy=0;
    if(sees&&u.health>0&&distance<(game.vehicle?85:34)){close++;bearings.push(Math.atan2(u.y-focus.y,u.x-focus.x));}
  }
  const surrounded=bearings.some(a=>bearings.some(b=>Math.abs(angleDifference(a,b))>1.2));
  const arresting=w.stars>0&&(!game.vehicle?close>0:Math.abs(game.vehicle.speed)<18&&close>=2&&surrounded);
  police.arrest=Math.max(0,Math.min(1,police.arrest+(arresting?dt/3:-dt*.65)));
}
export function drawOfficers(ctx,police){for(const u of police.units){if(!u.onFoot)continue;ctx.save();ctx.translate(u.x,u.y);ctx.rotate(u.facing||0);ctx.fillStyle=u.health>0?'#214c87':'#62646a';ctx.fillRect(-8,-10,16,20);ctx.fillStyle='#dfb18b';ctx.beginPath();ctx.arc(4,0,6,0,7);ctx.fill();ctx.fillStyle='#f9d777';ctx.fillRect(-2,-7,4,4);ctx.fillStyle='#192e40';ctx.fillRect(8,4,13,4);ctx.restore();}}
