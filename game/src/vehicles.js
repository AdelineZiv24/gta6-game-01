import { createRandom, clamp } from './random.js';
export const MODELS = [
  {name:'Mica Hatch',length:40,width:23,topSpeed:285,acceleration:175},
  {name:'Cypress Sedan',length:48,width:25,topSpeed:320,acceleration:165},
  {name:'Breakwater Pickup',length:52,width:27,topSpeed:290,acceleration:150},
  {name:'Solstice Convertible',length:46,width:25,topSpeed:375,acceleration:215},
  {name:'Parcel Pelican',length:55,width:28,topSpeed:245,acceleration:120},
  {name:'Sunline Taxi',length:48,width:25,topSpeed:315,acceleration:170},
];
export function modelByName(name) { return MODELS.find(model=>model.name===name) || MODELS[0]; }
const colors=['#dc735b','#5ba8a8','#eee1b9','#577997','#936f99','#87a96b','#e3b854'];
export function createCar(x,y,heading=0,model=0,color=colors[model%colors.length],driver='parked') {
  const m=typeof model==='number'?MODELS[model]:model;
  return {x,y,heading,model:m,color:m===MODELS[5]?'#efc650':color,speed:0,steering:0,health:100,driver,vx:0,vy:0,radius:m.width/2+2,shake:0,impact:0,cooldown:0,disabled:0};
}
export function setupParkedCars(world) {
  const random=createRandom('bay-parking'); const cars=[];
  for(const p of world.parkingSpots) if(random()<.62) cars.push(createCar(p.x,p.y,p.heading,Math.floor(random()*MODELS.length),colors[Math.floor(random()*colors.length)]));
  return cars;
}
function blocked(world,x,y,r) {return world.collidesCircle(x,y,r)||y+r>=world.water.y;}
export function carBlocked(world,car,x,y,heading=car.heading) {
  const offset=car.model.length/2-car.radius;
  return blocked(world,x+Math.cos(heading)*offset,y+Math.sin(heading)*offset,car.radius)||blocked(world,x-Math.cos(heading)*offset,y-Math.sin(heading)*offset,car.radius);
}
export function updateCar(car,input,world,dt) {
  car.shake=Math.max(0,car.shake-dt*14); car.impact=0;car.cooldown=Math.max(0,car.cooldown-dt);
  if(car.driver!=='player-driven') return;
  if(car.health<=0){car.speed=car.vx=car.vy=0;return;}
  const throttle=Number(input.isDown('KeyW')||input.isDown('ArrowUp'));
  const brake=Number(input.isDown('KeyS')||input.isDown('ArrowDown'));
  const hand=input.isDown('Space');
  car.speed+=(throttle*(car.speed< -5?300:car.model.acceleration)-brake*(car.speed>5?310:car.model.acceleration*.65))*dt;
  car.speed*=Math.exp(-(hand?2.6:.19)*dt);
  car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-(hand?65:8)*dt);
  car.speed=clamp(car.speed,-95,car.model.topSpeed*(car.health<20?.6:1));
  const steer=Number(input.isDown('KeyD')||input.isDown('ArrowRight'))-Number(input.isDown('KeyA')||input.isDown('ArrowLeft'));
  car.steering+=(steer*.55-car.steering)*Math.min(1,dt*9);
  const oldHeading=car.heading;
  car.heading+=car.steering*(car.speed/65)/(1+Math.abs(car.speed)/145)*dt*(hand?1.7:1);
  if(carBlocked(world,car,car.x,car.y)) car.heading=oldHeading;
  const grip=1-Math.exp(-(hand?1.8:9)*dt);
  car.vx+=(Math.cos(car.heading)*car.speed-car.vx)*grip; car.vy+=(Math.sin(car.heading)*car.speed-car.vy)*grip;
  const steps=Math.max(1,Math.ceil(Math.hypot(car.vx,car.vy)*dt/6));
  for(let i=0;i<steps;i++) {
    const dx=car.vx*dt/steps,dy=car.vy*dt/steps;
    let hit=false;
    if(!carBlocked(world,car,car.x+dx,car.y))car.x+=dx;else {car.vx*= -.12;hit=true;}
    if(!carBlocked(world,car,car.x,car.y+dy))car.y+=dy;else {car.vy*= -.12;hit=true;}
    if(hit){car.impact=Math.abs(car.speed);car.health=Math.max(0,car.health-Math.abs(car.speed)*.025);car.speed*=.65;car.shake=Math.min(5,car.impact/55);}
  }
}
export function resolveCarContacts(cars,report,time) {
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++) {
    const a=cars[i],b=cars[j]; if(a.driver!=='player-driven'&&b.driver!=='player-driven')continue;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),limit=(a.model.length+b.model.length)*.36;
    if(d>=limit||d<.01)continue;
    const force=Math.hypot(a.vx-b.vx,a.vy-b.vy);
    const moving=a.driver==='player-driven'?a:b,other=moving===a?b:a;
    moving.x-=dx/d*(limit-d)*(moving===a?1:-1);moving.y-=dy/d*(limit-d)*(moving===a?1:-1);
    if(moving.cooldown>0)continue;
    moving.speed*=.4;moving.vx*=.4;moving.vy*=.4;moving.shake=Math.min(6,force/40);moving.cooldown=.7;
    moving.health=Math.max(0,moving.health-force*.04);other.health=Math.max(0,other.health-force*.09); other.impact=force;
    if(force>65&&other.police){const crime=report('police_hit',moving.x,moving.y,4,true);crime.againstPolice=true;}
    if(force>65){other.disabled=3+force/30;other.speed=0;report('vehicle_collision',moving.x,moving.y,2,true);}
  }
}
export function drawCar(ctx,car,time=0) {
  const l=car.model.length,w=car.model.width;
  ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.heading);
  ctx.fillStyle='#163b4344';ctx.beginPath();ctx.roundRect(-l/2+3,-w/2+4,l,w,6);ctx.fill();
  ctx.fillStyle='#222d34';
  for(const x of [-l*.3,l*.3])for(const y of [-w/2,w/2]){ctx.save();ctx.translate(x,y);if(x>0)ctx.rotate(car.steering);ctx.fillRect(-6,-3,12,6);ctx.restore();}
  ctx.fillStyle=car.color;ctx.beginPath();ctx.roundRect(-l/2,-w/2,l,w,5);ctx.fill();
  ctx.fillStyle='#163b49';ctx.fillRect(-l*.23,-w*.37,l*.43,w*.74);
  ctx.fillStyle=car.model===MODELS[3]?'#b89266':car.color;ctx.fillRect(-l*.13,-w*.31,l*.18,w*.62);
  if(car.model===MODELS[2]){ctx.fillStyle='#344c4c';ctx.fillRect(-l*.43,-w*.34,l*.23,w*.68);}
  if(car.model===MODELS[4]){ctx.fillStyle='#f4e9cd';ctx.fillRect(-l*.4,-w*.35,l*.49,w*.7);}
  if(car.model===MODELS[5]){ctx.fillStyle='#fff2c6';ctx.fillRect(-4,-5,9,10);}
  if(car.police){ctx.fillStyle='#2864a2';ctx.fillRect(-l*.42,-w/2,l*.8,4);ctx.fillRect(-l*.42,w/2-4,l*.8,4);ctx.fillStyle='#f1f3ed';ctx.fillRect(-6,-w*.32,12,w*.64);ctx.fillStyle=Math.floor(time/150)%2?'#ff4b58':'#822a48';ctx.fillRect(-3,-10,6,9);ctx.fillStyle=Math.floor(time/150)%2?'#254b98':'#54baff';ctx.fillRect(-3,1,6,9);}
  ctx.fillStyle='#fff0b4';ctx.fillRect(l/2-3,-w/2+3,3,6);ctx.fillRect(l/2-3,w/2-9,3,6);
  if (car.driver === 'player-driven' || car.driver === 'traffic-driven' || car.police) {
    ctx.save();
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = '#fff2ae';
    ctx.beginPath(); ctx.moveTo(l / 2, -w / 2 + 2); ctx.lineTo(l / 2 + 100, -34); ctx.lineTo(l / 2 + 100, 34); ctx.lineTo(l / 2, w / 2 - 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle='#e34e45';ctx.fillRect(-l/2,-w/2+3,3,5);ctx.fillRect(-l/2,w/2-8,3,5);
  if(car.health<35){for(let i=0;i<3;i++){const p=(time*.001+i*.33)%1;ctx.fillStyle=`rgba(61,65,64,${(1-p)*.5})`;ctx.beginPath();ctx.arc(l*.3-p*18,-p*22,4+p*10,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
}
