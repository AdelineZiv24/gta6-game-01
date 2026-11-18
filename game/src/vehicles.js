import { createRandom, clamp } from './random.js';
import { spawnPopup } from './popups.js';
export const MODELS = [
  {name:'Mica Hatch',length:40,width:23,topSpeed:285,acceleration:175},
  {name:'Cypress Sedan',length:48,width:25,topSpeed:320,acceleration:165},
  {name:'Breakwater Pickup',length:52,width:27,topSpeed:290,acceleration:150},
  {name:'Solstice Convertible',length:46,width:25,topSpeed:375,acceleration:215},
  {name:'Parcel Pelican',length:55,width:28,topSpeed:245,acceleration:120},
  {name:'Sunline Taxi',length:48,width:25,topSpeed:315,acceleration:170},
  {name:'Dockhand Flatbed',length:58,width:28,topSpeed:262,acceleration:132},
  {name:'Marlin Roadster',length:42,width:24,topSpeed:338,acceleration:198},
];
export function modelByName(name) { return MODELS.find(model=>model.name===name) || MODELS[0]; }
export const CAR_COLORS=['#dc735b','#5ba8a8','#eee1b9','#577997','#936f99','#87a96b','#e3b854','#b9c8c0','#c38c74','#83b9c3','#baa3bd','#b8b574'];
const colors=CAR_COLORS;
export function createCar(x,y,heading=0,model=0,color=colors[model%colors.length],driver='parked') {
  const m=typeof model==='number'?MODELS[model]:model;
  return {x,y,heading,model:m,color:m===MODELS[5]?'#efc650':color,speed:0,steering:0,health:100,driver,vx:0,vy:0,radius:m.width/2+2,shake:0,impact:0,cooldown:0,disabled:0,fuel:100};
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
export function updateCar(car,input,world,dt,effects=null) {
  car.shake=Math.max(0,car.shake-dt*14); car.impact=0;car.cooldown=Math.max(0,car.cooldown-dt);
  if(car.driver!=='player-driven') return;
  if(car.health<=0){car.speed=car.vx=car.vy=0;return;}
  if(car.airT>0){
    car.airT+=dt;car.x+=car.vx*dt;car.y+=car.vy*dt;
    if(car.fuel>0)car.fuel=Math.max(0,car.fuel-Math.hypot(car.vx,car.vy)*dt*.0011);
    return;
  }
  const throttle=Number(input.isDown('KeyW')||input.isDown('ArrowUp'));
  const brake=Number(input.isDown('KeyS')||input.isDown('ArrowDown'));
  const hand=input.isDown('Space');
  car.speed+=(throttle*(car.speed< -5?300:car.model.acceleration)-brake*(car.speed>5?310:car.model.acceleration*.65))*dt;
  car.speed*=Math.exp(-(hand?2.6:.19)*dt);
  car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-(hand?65:8)*dt);
  const topSpeed=car.model.topSpeed*(car.health<20?.6:1),fuelCap=(car.fuel??100)<=0?Math.min(40,topSpeed):topSpeed;
  car.speed=clamp(car.speed,-95,fuelCap);
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
    if(hit){car.impact=Math.abs(car.speed);emitVehicleImpact(effects,car.x+Math.cos(car.heading)*car.model.length/2,car.y+Math.sin(car.heading)*car.model.length/2,car.impact,false,car);car.health=Math.max(0,car.health-Math.abs(car.speed)*.025);car.speed*=.65;car.shake=Math.min(5,car.impact/55);}
  }
  if(car.fuel>0)car.fuel=Math.max(0,car.fuel-Math.hypot(car.vx,car.vy)*dt*.0011);
}
export function resolveCarContacts(cars,report,time,effects=null) {
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++) {
    const a=cars[i],b=cars[j];
    if(a.driver!=='player-driven'&&b.driver!=='player-driven'){
      if(effects&&(Math.abs(a.vx)+Math.abs(a.vy)+Math.abs(b.vx)+Math.abs(b.vy)>30)&&Math.hypot(a.x-b.x,a.y-b.y)<(a.model.length+b.model.length)*.36){
        const force=Math.hypot(a.vx-b.vx,a.vy-b.vy);
        emitVehicleImpact(effects,(a.x+b.x)/2,(a.y+b.y)/2,force,true,a);
      }
      continue;
    }
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),limit=(a.model.length+b.model.length)*.36;
    if(d>=limit||d<.01)continue;
    const force=Math.hypot(a.vx-b.vx,a.vy-b.vy);
    const moving=a.driver==='player-driven'?a:b,other=moving===a?b:a;
    moving.x-=dx/d*(limit-d)*(moving===a?1:-1);moving.y-=dy/d*(limit-d)*(moving===a?1:-1);
    if(moving.cooldown>0)continue;
    emitVehicleImpact(effects,(a.x+b.x)/2,(a.y+b.y)/2,force,true,moving);
    moving.speed*=.4;moving.vx*=.4;moving.vy*=.4;moving.shake=Math.min(6,force/40);moving.cooldown=.7;
    moving.health=Math.max(0,moving.health-force*.04);other.health=Math.max(0,other.health-force*.09); other.impact=force;
    if(force>65&&other.police){const crime=report('police_hit',moving.x,moving.y,4,true);crime.againstPolice=true;}
    if(force>65){other.disabled=3+force/30;other.speed=0;report('vehicle_collision',moving.x,moving.y,2,true);}
  }
}
export function createVehicleEffects() {
  return {marks:Array.from({length:420},()=>({life:0})),particles:Array.from({length:128},()=>({life:0})),markCursor:0,particleCursor:0,cars:new WeakMap(),nearCars:new WeakMap(),random:createRandom('bay-tyres-and-dust'),time:0,shake:0,nearCooldown:0,popup:null,nearChain:0,nearChainUntil:0};
}
export function emitVehicleImpact(effects,x,y,force,metal=false,car=null) {
  if(!effects||force<30)return;
  const state=car&&effects.cars.get(car);
  if(state&&effects.time<(state.nextImpact||0))return;
  if(state)state.nextImpact=effects.time+.12;
  if(car?.driver==='player-driven')effects.shake=Math.max(effects.shake,Math.min(1.1,force/180));
  const sparks=metal&&force>110?6:0;
  for(let index=0;index<5+sparks;index++){
    const particle=effects.particles[effects.particleCursor++%effects.particles.length],spark=index>=5;
    const angle=effects.random()*Math.PI*2,speed=(spark?55:15)+effects.random()*(spark?95:30);
    Object.assign(particle,{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:spark?.18+effects.random()*.15:.4+effects.random()*.3,maxLife:spark?.33:.7,spark,size:spark?1:2+effects.random()*2});
  }
}
function onRoad(world,x,y) {
  return world.roads.horizontal.some(road=>Math.abs(y-road.y)<road.width/2-5)||world.roads.vertical.some(road=>Math.abs(x-road.x)<road.width/2-5&&y<road.length);
}
function carClearance(a,b) {
  const dx=b.x-a.x,dy=b.y-a.y;
  let gap=-Infinity;
  for(const heading of [a.heading,b.heading])for(const turn of [0,Math.PI/2]){
    const axis=heading+turn,nx=Math.cos(axis),ny=Math.sin(axis);
    const radius=car=>Math.abs(Math.cos(car.heading)*nx+Math.sin(car.heading)*ny)*car.model.length/2+Math.abs(-Math.sin(car.heading)*nx+Math.cos(car.heading)*ny)*car.model.width/2;
    gap=Math.max(gap,Math.abs(dx*nx+dy*ny)-radius(a)-radius(b));
  }
  return gap;
}
export function updateVehicleEffects(effects,cars,world,playerCar,dt,popups=null) {
  effects.time+=dt;effects.shake*=Math.exp(-22*dt);effects.nearCooldown=Math.max(0,effects.nearCooldown-dt);
  for(const mark of effects.marks)mark.life=Math.max(0,mark.life-dt);
  for(const particle of effects.particles)if(particle.life>0){particle.life=Math.max(0,particle.life-dt);particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.vx*=Math.exp(-4*dt);particle.vy*=Math.exp(-4*dt);}
  for(const car of cars){
    let state=effects.cars.get(car);
    if(!state){state={x:car.x,y:car.y,heading:car.heading,speed:car.speed,nextMark:0,nextImpact:0};effects.cars.set(car,state);}
    const distance=Math.hypot(car.x-state.x,car.y-state.y),speed=Math.abs(state.speed);
    const turning=Math.abs(Math.atan2(Math.sin(car.heading-state.heading),Math.cos(car.heading-state.heading)))/dt;
    const braking=(speed-Math.abs(car.speed))/dt;
    if(distance>1&&distance<60&&speed>70&&(braking>150||(speed>95&&turning>.45))&&effects.time>=state.nextMark){
      for(const side of [-1,1]){
        const rear=car.model.length*.29,track=car.model.width*.43*side;
        const x=car.x-Math.cos(car.heading)*rear-Math.sin(car.heading)*track,y=car.y-Math.sin(car.heading)*rear+Math.cos(car.heading)*track;
        const oldX=state.x-Math.cos(state.heading)*rear-Math.sin(state.heading)*track,oldY=state.y-Math.sin(state.heading)*rear+Math.cos(state.heading)*track;
        const length=Math.hypot(x-oldX,y-oldY),fraction=Math.min(1,12/Math.max(1,length));
        const fromX=x+(oldX-x)*fraction,fromY=y+(oldY-y)*fraction;
        if(onRoad(world,x,y)&&onRoad(world,fromX,fromY))Object.assign(effects.marks[effects.markCursor++%effects.marks.length],{x,y,fromX,fromY,life:6});
      }
      state.nextMark=effects.time+.045;
    }
    Object.assign(state,{x:car.x,y:car.y,heading:car.heading,speed:car.speed});
  }
  if(!playerCar||Math.abs(playerCar.speed)<120)return;
  for(const car of cars){
    if(car===playerCar)continue;
    const distance=Math.hypot(car.x-playerCar.x,car.y-playerCar.y);
    const previous=effects.nearCars.get(car);
    if(distance>110){if(previous)effects.nearCars.delete(car);continue;}
    const gap=carClearance(playerCar,car),contactLimit=(playerCar.model.length+car.model.length)*.36;
    const clear=gap>0&&distance>contactLimit+1;
    const relativeSpeed=Math.hypot(playerCar.vx-car.vx,playerCar.vy-car.vy);
    if(previous?.near&&clear&&distance>previous.distance&&relativeSpeed>110&&effects.nearCooldown===0&&playerCar.cooldown===0){
      effects.shake=2.2;effects.nearCooldown=.9;
      if(effects.time<effects.nearChainUntil)effects.nearChain+=1;else effects.nearChain=1;
      effects.nearChainUntil=effects.time+3.5;
      const label=effects.nearChain>1?`NEAR MISS ×${effects.nearChain}`:'NEAR MISS';
      effects.popup={text:label,until:effects.time+1.15};
      if(popups)spawnPopup(popups,(playerCar.x+car.x)/2,(playerCar.y+car.y)/2-26,label,'#ffe16d');
    }
    const state=previous||{};state.distance=distance;state.near=clear&&gap<9;effects.nearCars.set(car,state);
  }
}
export function drawVehicleEffects(ctx,effects,view,particles=false) {
  ctx.save();
  for(const item of particles?effects.particles:effects.marks){
    if(item.life<=0||item.x<view.x-20||item.x>view.x+view.width+20||item.y<view.y-20||item.y>view.y+view.height+20)continue;
    if(particles){
      ctx.globalAlpha=Math.min(1,item.life/item.maxLife)*(item.spark?1:.35);ctx.fillStyle=item.spark?'#ffe4a0':'#d8c6a0';
      if(item.spark){ctx.strokeStyle='#ffd37b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(item.x,item.y);ctx.lineTo(item.x-item.vx*.035,item.y-item.vy*.035);ctx.stroke();}
      else {ctx.beginPath();ctx.arc(item.x,item.y,item.size+(1-item.life/item.maxLife)*5,0,Math.PI*2);ctx.fill();}
    }else {ctx.globalAlpha=Math.min(1,item.life/2)*.32;ctx.strokeStyle='#202a2c';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(item.fromX,item.fromY);ctx.lineTo(item.x,item.y);ctx.stroke();}
  }
  ctx.restore();
}
export function headlightLevel(clockMinutes){const hour=((clockMinutes%1440)+1440)%1440;const daylight=Math.max(0,Math.min(1,(Math.sin((hour-360)/1440*Math.PI*2)+0.18)/1.18));return 1-daylight;}
export function drawCar(ctx,car,time=0,light=0) {
  const l=car.model.length,w=car.model.width;
  ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.heading);
  ctx.fillStyle='#163b4344';ctx.beginPath();ctx.roundRect(-l/2+3,-w/2+4,l,w,6);ctx.fill();
  const lift=car.airT>0?Math.sin(Math.min(1,car.airT/.7)*Math.PI)*26:0;
  if(lift>0)ctx.translate(0,-lift);
  ctx.fillStyle='#222d34';
  for(const x of [-l*.3,l*.3])for(const y of [-w/2,w/2]){ctx.save();ctx.translate(x,y);if(x>0)ctx.rotate(car.steering);ctx.fillRect(-6,-3,12,6);ctx.restore();}
  ctx.fillStyle=car.color;ctx.beginPath();ctx.roundRect(-l/2,-w/2,l,w,5);ctx.fill();
  ctx.fillStyle='#163b49';ctx.fillRect(-l*.23,-w*.37,l*.43,w*.74);
  ctx.fillStyle=car.model===MODELS[3]?'#b89266':car.color;ctx.fillRect(-l*.13,-w*.31,l*.18,w*.62);
  if(car.model===MODELS[2]){ctx.fillStyle='#344c4c';ctx.fillRect(-l*.43,-w*.34,l*.23,w*.68);}
  if(car.model===MODELS[4]){ctx.fillStyle='#f4e9cd';ctx.fillRect(-l*.4,-w*.35,l*.49,w*.7);}
  if(car.model===MODELS[5]){ctx.fillStyle='#fff2c6';ctx.fillRect(-4,-5,9,10);}
  if(car.model===MODELS[6]){ctx.fillStyle='#54686a';ctx.fillRect(-l*.47,-w*.37,l*.36,w*.74);ctx.fillStyle='#2e3f42';ctx.fillRect(-l*.47,-w*.37,l*.36,3);ctx.fillRect(-l*.47,w*.37-3,l*.36,3);ctx.fillRect(-l*.47,-w*.37,3,w*.74);ctx.fillStyle='#8a6f4d';ctx.fillRect(-l*.42,-w*.24,l*.14,w*.48);ctx.fillStyle='#22333d';ctx.beginPath();ctx.arc(-l*.16,0,4.5,0,Math.PI*2);ctx.fill();}
  if(car.model===MODELS[7]){ctx.fillStyle='rgba(179,216,224,.9)';ctx.fillRect(l*.02,-w*.34,3,w*.68);ctx.fillStyle='#7a4a35';ctx.fillRect(-l*.17,-w*.32,l*.16,w*.26);ctx.fillRect(-l*.17,w*.06,l*.16,w*.26);ctx.fillStyle='#31456b';ctx.fillRect(-l*.13,-w*.26,l*.10,w*.15);ctx.fillStyle='#efc39d';ctx.beginPath();ctx.arc(-l*.07,-w*.185,4.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2b2b2b';ctx.fillRect(-l*.21,-w*.36,3,w*.72);}
  if(car.police){ctx.fillStyle=car.interceptor?'#dfc572':'#2864a2';ctx.fillRect(-l*.42,-w/2,l*.8,4);ctx.fillRect(-l*.42,w/2-4,l*.8,4);ctx.fillStyle=car.interceptor?'#283c49':'#f1f3ed';ctx.fillRect(-6,-w*.32,12,w*.64);ctx.fillStyle=Math.floor(time/150)%2?'#ff4b58':'#822a48';ctx.fillRect(-3,-10,6,9);ctx.fillStyle=Math.floor(time/150)%2?'#254b98':'#54baff';ctx.fillRect(-3,1,6,9);if(car.interceptor){ctx.fillStyle='#eee1b9';ctx.fillRect(l*.27,-w*.3,l*.13,w*.6);ctx.fillStyle='#172e3e';ctx.fillRect(-l*.43,-w*.43,3,w*.86);}}
  ctx.fillStyle='#fff0b4';ctx.fillRect(l/2-3,-w/2+3,3,6);ctx.fillRect(l/2-3,w/2-9,3,6);
  if(light>0.05&&(car.driver==='player-driven'||car.driver==='traffic-driven'||car.police)){
    for(const side of [-1,1]){
      const hy=side*(w/2-5);const grad=ctx.createLinearGradient(l/2,0,l/2+92,0);
      grad.addColorStop(0,`rgba(255,242,174,${0.34*light})`);grad.addColorStop(1,'rgba(255,242,174,0)');
      ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(l/2,hy-2.5);ctx.lineTo(l/2+92,hy-16);ctx.lineTo(l/2+92,hy+16);ctx.lineTo(l/2,hy+2.5);ctx.closePath();ctx.fill();
    }
    ctx.fillStyle='#fff6c8';for(const side of [-1,1]){ctx.beginPath();ctx.arc(l/2-1,side*(w/2-6),2.6,0,Math.PI*2);ctx.fill();}
  }
  ctx.fillStyle='#e34e45';ctx.fillRect(-l/2,-w/2+3,3,5);ctx.fillRect(-l/2,w/2-8,3,5);
  if(car.health<35){for(let i=0;i<3;i++){const p=(time*.001+i*.33)%1;ctx.fillStyle=`rgba(61,65,64,${(1-p)*.5})`;ctx.beginPath();ctx.arc(l*.3-p*18,-p*22,4+p*10,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
}
