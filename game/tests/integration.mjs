import assert from 'node:assert/strict';
const listeners=new Map(),elements=new Map(),storage=new Map();let raf,confirmResult=false,confirms=0,writes=0;
const ctx=new Proxy({measureText:t=>({width:t.length*7}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const value of args)if(typeof value==='number')assert(Number.isFinite(value),`${String(k)} received a non-finite coordinate`);},set:(o,k,v)=>(o[k]=v,true)});
function element(id){if(!elements.has(id))elements.set(id,{id,hidden:true,disabled:false,style:{},focus(){},addEventListener(){},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1280,height:800})});return elements.get(id);}
globalThis.window={innerWidth:1280,innerHeight:800,devicePixelRatio:1,addEventListener(k,f){if(!listeners.has(k))listeners.set(k,[]);listeners.get(k).push(f);},removeEventListener(){}};
globalThis.document={getElementById:element,createElement:()=>element(Symbol())};
Object.assign(globalThis,{innerWidth:1280,innerHeight:800,devicePixelRatio:1,location:{search:''},requestAnimationFrame:f=>raf=f,confirm:()=>{confirms++;return confirmResult;},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){writes++;storage.set(k,v);}}});
const {game}=await import('../src/main.js');
let time=0;function frame(){raf(time);time+=20;}
function key(code){for(const f of listeners.get('keydown')||[])f({code,repeat:false,preventDefault(){}});frame();for(const f of listeners.get('keyup')||[])f({code});}
frame();element('new-game').onclick();frame();Object.assign(game.player,game.world.spawnPoints.diner);key('KeyE');assert(game.missions.dialogue);key('KeyE');assert.equal(game.missions.phase,'package');game.player.x=game.missions.marker.x;game.player.y=game.missions.marker.y;frame();assert.deepEqual(game.missions.completed,[0]);assert(writes>0);key('KeyE');key('KeyP');assert.equal(game.state,'paused');assert(element('progress').textContent.includes('Umbrellas'));const cash=game.player.cash;element('quit').onclick();element('new-game').onclick();assert.equal(confirms,1);assert.equal(game.state,'menu');element('continue').onclick();assert.equal(game.player.cash,cash);assert.equal(game.missions.currentMission,1);confirmResult=true;key('KeyP');element('quit').onclick();element('new-game').onclick();assert.equal(confirms,2);assert.equal(game.missions.currentMission,0);
game.missions.currentMission=2;Object.assign(game.player,game.world.spawnPoints.diner);key('KeyE');key('KeyE');const rival=game.missions.rival;assert(rival);const origin={x:rival.x,y:rival.y};for(let i=0;i<180;i++){const old={x:rival.x,y:rival.y};frame();assert(Math.hypot(rival.x-old.x,rival.y-old.y)<8,'rival never teleports');assert(!game.world.collidesCircle(rival.x,rival.y,10),'rival stays outside buildings');}assert(Math.hypot(rival.x-origin.x,rival.y-origin.y)>50);console.log('Rival actor moves continuously through main-loop car physics: PASS');
const before=writes;location.search='?shot=mission';const shot=await import('../src/main.js?shot-test');frame();key('KeyP');assert.equal(writes,before);assert(shot.game.missions);console.log('Main loop, real input, mission autosave, pause, Continue, New Game confirmation, shot hook: PASS');

const {createWorld}=await import('../src/world.js');
const {createCar,createVehicleEffects,updateVehicleEffects,emitVehicleImpact,resolveCarContacts,updateCar}=await import('../src/vehicles.js');
const {createPolice,spawnPolice,updatePolice}=await import('../src/police.js');
const seeded=createWorld('1'),again=createWorld('1');
assert.equal(JSON.stringify(seeded),JSON.stringify(again));
assert(seeded.buildings.every(building=>building.rooftop.some(prop=>prop.kind==='ac')));
assert(seeded.buildings.filter(building=>building.storeys>=4).every(building=>building.rooftop.some(prop=>prop.kind==='tank')));
assert(seeded.props.filter(prop=>['umbrella','towel'].includes(prop.kind)).every(prop=>prop.color));
const geometry=JSON.stringify({buildings:seeded.buildings,parkingSpots:seeded.parkingSpots});
const {createRenderer}=await import('../src/render.js');
const testRenderer=createRenderer({width:1280,height:800,getContext:()=>ctx});
for(const time of [0,1000,3000])testRenderer.draw(seeded,null,time,555);
assert.equal(geometry,JSON.stringify({buildings:seeded.buildings,parkingSpots:seeded.parkingSpots}));
const lane=seeded.roads.horizontal[2].y+20;
const effects=createVehicleEffects(),car=createCar(1000,lane,0,1,undefined,'traffic-driven');
car.speed=180;updateVehicleEffects(effects,[car],seeded,null,1/60);
car.x+=2;car.speed=140;updateVehicleEffects(effects,[car],seeded,null,1/60);
assert(effects.marks.some(mark=>mark.life>0),'hard-braking traffic lays tyre marks');
car.x+=2;car.heading=.05;updateVehicleEffects(effects,[car],seeded,null,.05);
assert(effects.markCursor>=4,'fast turns lay tyre marks');
const playerCar=createCar(1000,lane,0,1,undefined,'player-driven');playerCar.speed=playerCar.vx=180;
const passing=createCar(1020,lane+31,0,1);const near=createVehicleEffects();
updateVehicleEffects(near,[playerCar,passing],seeded,playerCar,1/60);
passing.x=25+playerCar.x;updateVehicleEffects(near,[playerCar,passing],seeded,playerCar,1/60);
assert(near.shake>1.1,'clean close pass gives a small near-miss shake');
const touching=createVehicleEffects();passing.y=lane+20;passing.x=playerCar.x;
updateVehicleEffects(touching,[playerCar,passing],seeded,playerCar,1/60);
passing.x+=5;updateVehicleEffects(touching,[playerCar,passing],seeded,playerCar,1/60);
assert.equal(touching.shake,0,'overlap is never a near miss');
emitVehicleImpact(effects,car.x,car.y,180,true,playerCar);
assert(effects.particles.some(particle=>particle.life>0&&particle.spark));
assert(effects.shake<=1.1,'contact shake is smaller than near-miss shake');
const aiA=createCar(900,lane,0,1,undefined,'traffic-driven'),aiB=createCar(915,lane,0,1,undefined,'police-driven');aiA.vx=160;
const aiEffects=createVehicleEffects();resolveCarContacts([aiA,aiB],()=>({}),0,aiEffects);
assert(aiEffects.particles.some(particle=>particle.spark&&particle.life>0),'AI contact emits sparks');
const wallCar=createCar(1000,lane,0,1,undefined,'player-driven');wallCar.speed=wallCar.vx=180;
const wallEffects=createVehicleEffects();updateCar(wallCar,{isDown:()=>false},{water:seeded.water,collidesCircle:()=>true},1/60,wallEffects);
assert(wallEffects.particles.some(particle=>particle.life>0&&!particle.spark),'wall contact emits dust');
for(let index=0;index<1000;index++)emitVehicleImpact(effects,1000,lane,200,true);
for(let index=0;index<700;index++){car.x+=2;car.heading+=.03;updateVehicleEffects(effects,[car],seeded,null,1/60);}
assert(effects.markCursor>420,'skid pool wraps safely under sustained turning');
assert.equal(effects.particles.length,128);assert.equal(effects.marks.length,420);
for(let index=0;index<420;index++)updateVehicleEffects(effects,[],seeded,null,1/60);
assert(effects.marks.every(mark=>mark.life===0));assert(effects.particles.every(particle=>particle.life===0));
for(const stars of [1,2,3]){
 const police=createPolice();if(stars>=2){spawnPolice(police,200,lane);spawnPolice(police,300,lane);}
 const fixture={wanted:{stars,lastKnown:playerCar},player:playerCar,vehicle:playerCar,playSeconds:0};
 updatePolice(police,fixture,seeded,{x:1000,y:lane,width:500,height:400},1/60,()=>{});
 assert.equal(police.units.filter(unit=>unit.car.interceptor).length,stars>=3?1:0);
}
console.log('Seed determinism, rooftop/beach dressing, pooled skids/particles, near misses, high-pressure interceptor: PASS');

const {updateTraffic}=await import('../src/traffic.js');
const stagedCar=createCar(1000,lane,0,1,undefined,'traffic-driven');stagedCar.speed=92;
updateTraffic({cars:[stagedCar],timer:1},seeded,playerCar,[stagedCar],[],1/60,()=>{});
assert([stagedCar.x,stagedCar.y,stagedCar.heading,stagedCar.tx,stagedCar.ty].every(Number.isFinite),'staged traffic gets a valid route');
for(const scene of ['start','mission','foot','chase']){
 location.search=`?shot=${scene}&seed=1`;
 const {game:staged}=await import(`../src/main.js?scene-${scene}`);
 let frameTime=0;
 for(let index=0;index<180;index++){raf(frameTime);frameTime+=1000/60;}
 assert.equal(staged.world.seed,'1');assert.equal(staged.clockMinutes,555);
 assert.equal(staged.state,scene==='start'?'menu':'playing');
 assert([staged.player.x,staged.player.y].every(Number.isFinite));
 for(const unit of staged.police.units)assert([unit.x,unit.y,unit.car.x,unit.car.y,unit.car.heading].every(Number.isFinite));
 if(scene==='chase'){assert(staged.police.units.length>=3);assert(staged.police.units.some(unit=>unit.car.interceptor));assert(staged.vehicleEffects.markCursor>0);}
 console.log(`Seed=1 ${scene} scene: 180 frames, pinned clock, finite actors PASS`);
}
