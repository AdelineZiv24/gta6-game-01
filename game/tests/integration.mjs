import assert from 'node:assert/strict';
import { responseRows } from '../src/hud.js';
import { radioNow, RADIO_TRACKS } from '../src/radio.js';
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
const {createPopups,spawnPopup,updatePopups}=await import('../src/popups.js');
const {createRace,buildRoute,raceStartPoint,startRace,updateRace,racePosition,RACE_PRIZE}=await import('../src/race.js');
const {districtTint}=await import('../src/render.js');
const {createPedestrians,updatePedestrians}=await import('../src/pedestrians.js');
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
const combo=createVehicleEffects(),comboPopups=createPopups(),passingCar=createCar(1020,lane+31,0,1);
updateVehicleEffects(combo,[playerCar,passingCar],seeded,playerCar,1/60,comboPopups);passingCar.x=25+playerCar.x;updateVehicleEffects(combo,[playerCar,passingCar],seeded,playerCar,1/60,comboPopups);assert.equal(combo.popup.text,'NEAR MISS');assert.equal(combo.nearChain,1);
for(let index=0;index<3;index++)updateVehicleEffects(combo,[playerCar],seeded,playerCar,.35);
passingCar.x=1020;passingCar.y=lane+31;updateVehicleEffects(combo,[playerCar,passingCar],seeded,playerCar,1/60,comboPopups);passingCar.x=25+playerCar.x;updateVehicleEffects(combo,[playerCar,passingCar],seeded,playerCar,1/60,comboPopups);assert.equal(combo.popup.text,'NEAR MISS ×2');assert.equal(combo.nearChain,2);assert(comboPopups.list.some(entry=>entry.life>0&&entry.text==='NEAR MISS ×2'));console.log('Near-miss combo chain and floating popup: PASS');
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
const popupTest=createPopups(),popupA=spawnPopup(popupTest,100,200,'TEST A'),popupB=spawnPopup(popupTest,300,400,'TEST B','#7be3f0');assert(popupA&&popupB&&popupA.text==='TEST A'&&popupB.text==='TEST B'&&popupA.life>0&&popupB.life>0);updatePopups(popupTest,2);assert.equal(popupA.life,0);assert.equal(popupB.life,0);const pinned=spawnPopup(popupTest,0,0,'PINNED','#ffe16d',999);updatePopups(popupTest,3);assert(pinned.life>0);assert.equal(spawnPopup(null,0,0,'x'),null);console.log('Popup pool lifecycle and null safety: PASS');
const pool=createPedestrians(seeded,playerCar);assert.equal(pool.people.length,96);assert(new Set(pool.people.map(person=>person.shirt)).size>=10);assert(pool.people.every(person=>person.pants));const walker=pool.people[0];Object.assign(walker,{x:1000,y:lane,state:'walk',panic:0,pause:0});const threatCar=createCar(940,lane,0,1,undefined,'traffic-driven');threatCar.speed=threatCar.vx=170;updatePedestrians(pool,seeded,{x:1000,y:lane},[threatCar],[],1/60,()=>{});assert(walker.panic>0);assert(Math.hypot(walker.x-threatCar.x,walker.y-threatCar.y)>60);console.log('Crowd density, palettes, pants and dodge impulse: PASS');
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

{
 const police=createPolice();police.spawnTimer=5;
 const pursuitCar={...playerCar};
 const fixture={police,wanted:{stars:5,lastKnown:pursuitCar,seen:true},player:pursuitCar,vehicle:pursuitCar,playSeconds:0};
 const spawnX=pursuitCar.x-190,spawnY=pursuitCar.y-150;
 const camera={x:pursuitCar.x,y:lane,width:500,height:400},dt=1/60;
 for(let frame=0;frame<120;frame++){
  updatePolice(police,fixture,seeded,camera,dt,()=>{});
  assert(police.heli);
  assert([police.heli.x,police.heli.y,police.heli.lightX,police.heli.lightY].every(Number.isFinite));
  assert(Math.hypot(police.heli.x-pursuitCar.x,police.heli.y-pursuitCar.y)<420);
  pursuitCar.x+=165*dt;
  fixture.playSeconds+=dt;
 }
 assert(Math.hypot(police.heli.x-spawnX,police.heli.y-spawnY)>1);
 assert(responseRows(fixture).some(row=>row.type==='HELI'&&row.state==='SPOTLIGHT'));
 fixture.wanted.seen=false;
 assert(responseRows(fixture).some(row=>row.type==='HELI'&&row.state==='SEARCHING'));
 fixture.wanted.stars=3;
 updatePolice(police,fixture,seeded,camera,dt,()=>{});
 assert.equal(police.heli,null);
}
assert.notEqual(radioNow(0).index,radioNow(25).index);
assert.equal(radioNow(24*RADIO_TRACKS.length).index,radioNow(0).index);
assert(RADIO_TRACKS.length>=5&&RADIO_TRACKS.every(track=>track.title.trim()&&track.artist.trim()));
console.log('Five-star helicopter lifecycle, response rows, Coral FM rotation: PASS');

{
 const start=raceStartPoint(seeded),route=buildRoute(seeded);
 assert.equal(route.length,5);assert.deepEqual(route[4],start);
 for(const point of route){assert(seeded.roads.vertical.some(road=>road.x===point.x));assert(seeded.roads.horizontal.some(road=>road.y===point.y));}
 function raceFixture(){
  const rg={world:seeded,player:{...playerCar},vehicle:null,parkedCars:[],missions:{activity:null,totalEarned:0,splash:null},popups:createPopups(),playSeconds:0,vehicleEffects:createVehicleEffects(),outcome:null};
  rg.vehicle=createCar(start.x,start.y,0,3,undefined,'player-driven');Object.assign(rg.player,start);return rg;
 }
 {
  const race=createRace(),rg=raceFixture();
  assert.equal(startRace(race,rg),true);assert.equal(race.phase,'running');assert.equal(rg.missions.activity,'race');assert(rg.parkedCars.includes(race.rival));assert.equal(race.position,1);
  Object.assign(rg.vehicle,race.checkpoints[0]);updateRace(race,rg,1/60);
  assert.equal(race.playerNext,1);assert(rg.popups.list.some(entry=>entry.life>0&&entry.text==='CHECKPOINT 1/5'));assert.equal(racePosition(race,rg),1);
 }
 {
  const race=createRace(),rg=raceFixture();startRace(race,rg);
  const rival=race.rival,target=race.checkpoints[0],distance=Math.hypot(rival.x-target.x,rival.y-target.y);
  for(let frame=0;frame<90;frame++)updateRace(race,rg,1/60);
  assert(Math.hypot(rival.x-target.x,rival.y-target.y)<distance);assert(!seeded.collidesCircle(rival.x,rival.y,10));
  const building=seeded.buildings[0],centre={x:building.x+building.width/2,y:building.y+building.height/2};
  Object.assign(rival,centre);race.anchor={...centre};race.stuckT=0;
  for(let frame=0;frame<5;frame++)updateRace(race,rg,1.1);
  assert(Math.hypot(rival.x-centre.x,rival.y-centre.y)>0);assert(!seeded.collidesCircle(rival.x,rival.y,10));
 }
 {
  const race=createRace(),rg=raceFixture();startRace(race,rg);race.playerNext=4;Object.assign(rg.vehicle,race.checkpoints[4]);
  const cash=rg.player.cash;updateRace(race,rg,1/60);
  assert.equal(race.phase,'done');assert.equal(race.result,'win');assert.equal(rg.player.cash,cash+RACE_PRIZE);assert.equal(rg.missions.splash?.name,'STREET RACE');assert.equal(rg.missions.activity,null);assert.equal(race.rival.driver,'parked');
 }
 {
  const race=createRace(),rg=raceFixture();startRace(race,rg);const rival=race.rival;rg.outcome={kind:'busted'};updateRace(race,rg,1/60);
  assert.equal(race.phase,'idle');assert(!rg.parkedCars.includes(rival));
 }
 const downtown={x:(seeded.roads.vertical[3].x+seeded.roads.vertical[4].x)/2,y:(seeded.roads.horizontal[2].y+seeded.roads.horizontal[3].y)/2};
 const downtownTint=districtTint(downtown.x,downtown.y,seeded),docksTint=districtTint(seeded.pier.x-100,seeded.roads.horizontal[6].y+100,seeded),residentialTint=districtTint(500,400,seeded);
 assert.equal(districtTint(downtown.x,downtown.y,seeded),downtownTint);assert.notEqual(downtownTint,null);assert.notEqual(docksTint,null);assert.notEqual(docksTint,downtownTint);assert.equal(districtTint(2000,3150,seeded),null);assert.notEqual(residentialTint,null);assert.notEqual(residentialTint,downtownTint);
}
console.log('Street race lifecycle, rival nudge, district tints: PASS');

const {updateTraffic}=await import('../src/traffic.js');
const stagedCar=createCar(1000,lane,0,1,undefined,'traffic-driven');stagedCar.speed=92;
updateTraffic({cars:[stagedCar],timer:1},seeded,playerCar,[stagedCar],[],1/60,()=>{});
assert([stagedCar.x,stagedCar.y,stagedCar.heading,stagedCar.tx,stagedCar.ty].every(Number.isFinite),'staged traffic gets a valid route');
for(const scene of ['start','mission','foot','chase','cover']){
 location.search=`?shot=${scene}&seed=1`;
 const {game:staged}=await import(`../src/main.js?scene-${scene}`);
 let frameTime=0;
 for(let index=0;index<180;index++){raf(frameTime);frameTime+=1000/60;}
 assert.equal(staged.world.seed,'1');assert.equal(staged.clockMinutes,scene==='start'?555:1040);
 assert.equal(staged.state,scene==='start'?'menu':'playing');
 assert([staged.player.x,staged.player.y].every(Number.isFinite));
 for(const unit of staged.police.units)assert([unit.x,unit.y,unit.car.x,unit.car.y,unit.car.heading].every(Number.isFinite));
 if(scene==='chase'){assert(staged.police.units.length>=3);assert(staged.police.units.some(unit=>unit.car.interceptor));assert(staged.vehicleEffects.markCursor>0);assert(staged.race);assert.equal(staged.race.phase,'running');assert(staged.race.rival);assert.equal(staged.race.checkpoints.length,5);assert.equal(staged.race.position,2);}
 if(scene==='cover'){
  assert.equal(staged.race.phase,'idle');
  assert.equal(staged.state,'playing');assert.equal(staged.wanted.stars,5);assert.equal(staged.police.units.length,4);assert(staged.police.units.some(unit=>unit.car.interceptor));assert(staged.vehicleEffects.popup);assert.equal(staged.vehicleEffects.popup.text,'NEAR MISS ×3');assert.equal(staged.vehicleEffects.nearChain,3);assert(staged.popups.list.some(entry=>entry.life>0&&entry.text==='NEAR MISS ×3'));assert(staged.vehicleEffects.markCursor>0);
  assert(staged.police.heli);assert([staged.police.heli.x,staged.police.heli.y].every(Number.isFinite));
  assert.equal(staged.combat.weapon,'pistol');assert.equal(staged.combat.ammo,12);assert.equal(staged.combat.reserve,36);
 }
 console.log(`Seed=1 ${scene} scene: 180 frames, pinned clock, finite actors PASS`);
}
