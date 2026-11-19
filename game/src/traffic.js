import { createCar, CAR_COLORS } from './vehicles.js';
import { createRandom, angleDifference } from './random.js';
const random=createRandom('bay-traffic');
// Cardinal directions clockwise in screen coordinates; right-hand lanes are +20 normal.
const DX=[1,0,-1,0],DY=[0,1,0,-1];
const MODEL_ROLL=[0,1,2,3,4,5,0,1,6,7,9];
function target(car,world) {
  const a=car.route,d=a.direction;
  car.tx=world.roads.vertical[a.col].x-DY[d]*20;car.ty=world.roads.horizontal[a.row].y+DX[d]*20;
}
function next(car,world) {
  const a=car.route;let d=a.direction;
  const roll=random();if(roll>.68)d=(d+(roll>.85?3:1))%4;
  let col=a.col+DX[d],row=a.row+DY[d];
  if(col<0||row<0||col>=world.roads.vertical.length||row>=world.roads.horizontal.length){d=(d+2)%4;col=a.col+DX[d];row=a.row+DY[d];}
  a.direction=d;a.col=col;a.row=row;target(car,world);
}
function spawn(world,focus) {
  for(let tries=0;tries<70;tries++){
    const col=Math.floor(random()*(world.roads.vertical.length-1)),row=Math.floor(random()*(world.roads.horizontal.length-1));
    const d=Math.floor(random()*4),x=world.roads.vertical[col].x,y=world.roads.horizontal[row].y;
    const dist=Math.hypot(x-focus.x,y-focus.y);if(dist<350||dist>1350)continue;
    const car=createCar(x-DY[d]*20,y+DX[d]*20,d*Math.PI/2,MODEL_ROLL[Math.floor(random()*MODEL_ROLL.length)],CAR_COLORS[(col*7+row*3+d)%CAR_COLORS.length],'traffic-driven');
    car.route={col,row,direction:d};next(car,world);car.speed=65+random()*35;return car;
  }return null;
}
export function createTraffic(world,focus){const cars=[];for(let i=0;i<28;i++){const car=spawn(world,focus);if(car)cars.push(car);}return {cars,timer:0};}
export function updateTraffic(traffic,world,focus,allCars,pedestrians,dt,onFlee) {
  traffic.timer-=dt;
  for(let i=traffic.cars.length-1;i>=0;i--){const car=traffic.cars[i];
    if(car.driver!=='traffic-driven') {traffic.cars.splice(i,1);continue;}
    if(Math.hypot(car.x-focus.x,car.y-focus.y)>1700){traffic.cars.splice(i,1);continue;}
    if(!car.route){car.route={col:world.roads.vertical.reduce((best,road,index)=>Math.abs(road.x-car.x)<Math.abs(world.roads.vertical[best].x-car.x)?index:best,0),row:world.roads.horizontal.reduce((best,road,index)=>Math.abs(road.y-car.y)<Math.abs(world.roads.horizontal[best].y-car.y)?index:best,0),direction:((Math.round(car.heading/(Math.PI/2))%4)+4)%4};next(car,world);}
    if((car.impact>105||car.health<28)&&!car.abandoned){car.abandoned=true;car.disabled=9999;onFlee(car.x+Math.sin(car.heading)*30,car.y-Math.cos(car.heading)*30);}
    car.impact=0;
    if(car.disabled>0){car.disabled-=dt;car.speed=0;car.vx=car.vy=0;continue;}
    if(Math.hypot(car.tx-car.x,car.ty-car.y)<5)next(car,world);
    const heading=Math.atan2(car.ty-car.y,car.tx-car.x);
    car.steering=angleDifference(car.heading,heading)*.8;
    car.heading+=angleDifference(car.heading,heading)*Math.min(1,dt*8);
    let desired=100;
    const fx=Math.cos(car.heading),fy=Math.sin(car.heading);
    for(const other of allCars){if(other===car)continue;const dx=other.x-car.x,dy=other.y-car.y,ahead=dx*fx+dy*fy,side=Math.abs(dx*fy-dy*fx);if(ahead>0&&ahead<105&&side<28)desired=Math.min(desired,Math.max(0,(ahead-48)*1.6));}
    for(const p of pedestrians){if(p.state==='down')continue;const dx=p.x-car.x,dy=p.y-car.y,ahead=dx*fx+dy*fy;if(ahead>0&&ahead<85&&Math.abs(dx*fy-dy*fx)<23)desired=0;}
    car.speed+=Math.max(-220*dt,Math.min(80*dt,desired-car.speed));
    // Move toward the lane waypoint without overshooting tight intersection turns.
    const distance=Math.hypot(car.tx-car.x,car.ty-car.y),step=Math.min(distance,car.speed*dt);
    car.vx=distance?((car.tx-car.x)/distance*car.speed):0;car.vy=distance?((car.ty-car.y)/distance*car.speed):0;
    car.x+=distance?(car.tx-car.x)/distance*step:0;car.y+=distance?(car.ty-car.y)/distance*step:0;
  }
  if(traffic.timer<=0){traffic.timer=.6;if(traffic.cars.length<22){const car=spawn(world,focus);if(car){let free=true;for(const other of allCars)if(Math.hypot(other.x-car.x,other.y-car.y)<80)free=false;if(free)traffic.cars.push(car);}}}
}
