import { createCar } from './vehicles.js';
import { angleDifference } from './random.js';
const DX=[1,0,-1,0],DY=[0,1,0,-1];
// Clockwise rectangle: west along h[5], north up v[3], east along h[2], south down v[7].
const LEGS=[{col:3,row:5,direction:2},{col:3,row:2,direction:3},{col:7,row:2,direction:0},{col:7,row:5,direction:1}];
function legTarget(world,leg){const {col,row,direction}=LEGS[leg];return {x:world.roads.vertical[col].x-DY[direction]*20,y:world.roads.horizontal[row].y+DX[direction]*20};}
export function busShelters(world){return world.props.filter(prop=>prop.kind==='shelter');}
export function createBus(world){
  const spawn=legTarget(world,3);
  const car=createCar(spawn.x,spawn.y,Math.PI,8,'#dfe6dd','traffic-driven');
  car.bus=true;
  const shelters=busShelters(world);
  return {car,leg:0,state:'drive',stopTimer:0,time:0,shelters,readyAt:shelters.map(()=>0)};
}
export function updateBus(bus,world,allCars,pedestrians,dt){
  bus.time+=dt;
  const car=bus.car;
  if(car.disabled>0)car.disabled-=dt;
  if(car.health<=0){
    const fresh=createCar(legTarget(world,3).x,legTarget(world,3).y,Math.PI,8,'#dfe6dd','traffic-driven');
    Object.assign(car,fresh);car.bus=true;bus.leg=0;bus.state='drive';bus.stopTimer=0;car.brake=false;return;
  }
  if(bus.state==='stop'){
    car.brake=true;car.speed=Math.max(0,car.speed-220*dt);car.vx=car.vy=0;
    bus.stopTimer-=dt;
    if(bus.stopTimer<=0){bus.state='drive';car.brake=false;}
    return;
  }
  car.brake=false;
  for(let i=0;i<bus.shelters.length;i++){
    if(bus.time>=bus.readyAt[i]&&Math.hypot(car.x-bus.shelters[i].x,car.y-bus.shelters[i].y)<110){
      bus.state='stop';bus.stopTimer=3;bus.readyAt[i]=bus.time+90;car.brake=true;return;
    }
  }
  const target=legTarget(world,bus.leg);
  if(Math.hypot(target.x-car.x,target.y-car.y)<6){bus.leg=(bus.leg+1)%LEGS.length;return;}
  const heading=Math.atan2(target.y-car.y,target.x-car.x);
  car.steering=angleDifference(car.heading,heading)*.8;
  car.heading+=angleDifference(car.heading,heading)*Math.min(1,dt*8);
  let desired=95;
  const fx=Math.cos(car.heading),fy=Math.sin(car.heading);
  for(const other of allCars){if(other===car)continue;const dx=other.x-car.x,dy=other.y-car.y,ahead=dx*fx+dy*fy,side=Math.abs(dx*fy-dy*fx);if(ahead>0&&ahead<105&&side<28)desired=Math.min(desired,Math.max(0,(ahead-48)*1.6));}
  for(const p of pedestrians){if(p.state==='down')continue;const dx=p.x-car.x,dy=p.y-car.y,ahead=dx*fx+dy*fy;if(ahead>0&&ahead<85&&Math.abs(dx*fy-dy*fx)<23)desired=0;}
  car.speed+=Math.max(-220*dt,Math.min(80*dt,desired-car.speed));
  const distance=Math.hypot(target.x-car.x,target.y-car.y),step=Math.min(distance,car.speed*dt);
  car.vx=distance?((target.x-car.x)/distance*car.speed):0;car.vy=distance?((target.y-car.y)/distance*car.speed):0;
  car.x+=distance?(target.x-car.x)/distance*step:0;car.y+=distance?(target.y-car.y)/distance*step:0;
}

export function stageBusAtShelter(bus, world, point) {
  if (!bus || !bus.shelters.length) return null;
  const shelter = bus.shelters.reduce((best, s) => Math.hypot(s.x - point.x, s.y - point.y) < Math.hypot(best.x - point.x, best.y - point.y) ? s : best);
  let best = null;
  for (let leg = 0; leg < LEGS.length; leg++) {
    const a = legTarget(world, leg), b = legTarget(world, (leg + 1) % LEGS.length);
    const abx = b.x - a.x, aby = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((shelter.x - a.x) * abx + (shelter.y - a.y) * aby) / (abx * abx + aby * aby || 1)));
    const x = a.x + abx * t, y = a.y + aby * t;
    const d = Math.hypot(shelter.x - x, shelter.y - y);
    if (!best || d < best.d) best = { leg, x, y, heading: Math.atan2(aby, abx), d };
  }
  const car = bus.car;
  car.x = best.x; car.y = best.y; car.heading = best.heading; car.speed = 0; car.vx = 0; car.vy = 0; car.brake = true;
  bus.leg = best.leg; bus.state = 'stop'; bus.stopTimer = 999;
  const index = bus.shelters.indexOf(shelter);
  if (index >= 0) bus.readyAt[index] = bus.time + 999;
  return shelter;
}
