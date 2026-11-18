import assert from 'node:assert/strict';
import { responseRows } from '../src/hud.js';
import { radioNow, RADIO_TRACKS, RADIO_STATIONS, BAY_TRACKS, stationNow, createRadio, cycleRadio } from '../src/radio.js';
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
const {createCar,createVehicleEffects,updateVehicleEffects,emitVehicleImpact,resolveCarContacts,updateCar,MODELS,drawCar,headlightLevel}=await import('../src/vehicles.js');
const {createTraffic}=await import('../src/traffic.js');
const {createPolice,spawnPolice,spawnHeli,updatePolice}=await import('../src/police.js');
const {createPopups,spawnPopup,updatePopups}=await import('../src/popups.js');
const {createRace,buildRoute,raceStartPoint,startRace,updateRace,racePosition,RACE_PRIZE}=await import('../src/race.js');
const {createFuelState,updateFuel,gasStations}=await import('../src/fuel.js');
const {createRampage,startRampage,updateRampage,rampageStartPoint,rampagePayout,RAMPAGE_TIME}=await import('../src/rampage.js');
const {districtTint}=await import('../src/render.js');
const {createPedestrians,updatePedestrians}=await import('../src/pedestrians.js');
const {createRep,repLevel,repProgress,awardRep,REP_RAMPAGE_CAP}=await import('../src/rep.js');
const {performerSpot,drawPerformer}=await import('../src/performer.js');
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
assert.equal(createCar(0,0).fuel,100);
const drainCar=createCar(300,lane,0,1,undefined,'player-driven');
for(let frame=0;frame<600;frame++)updateCar(drainCar,{isDown:key=>key==='KeyW'},seeded,1/60);
assert(drainCar.fuel<98&&drainCar.fuel>93);
const parkedCar=createCar(300,lane,0,1);parkedCar.speed=200;
updateCar(parkedCar,{isDown:()=>true},seeded,1/60);assert.equal(parkedCar.fuel,100);
const limpCar=createCar(300,lane,0,1,undefined,'player-driven');limpCar.fuel=0;
for(let frame=0;frame<180;frame++)updateCar(limpCar,{isDown:key=>key==='KeyW'},seeded,1/60);
assert(limpCar.speed<=40.5&&limpCar.speed>20);assert.equal(limpCar.fuel,0);

const stations=gasStations(seeded);assert.equal(stations.length,3);
for(const station of stations){
 assert(seeded.roads.vertical.some(road=>road.x===station.x));
 assert(seeded.roads.horizontal.some(road=>road.y===station.y));
 assert(!seeded.collidesCircle(station.x,station.y,12));
}
function fuelFixture(cash){
 const g={world:seeded,player:{cash},vehicle:createCar(stations[0].x,stations[0].y,0,1,undefined,'player-driven'),popups:createPopups(),fuel:createFuelState(),playSeconds:0};
 g.vehicle.fuel=30;g.vehicle.speed=0;return g;
}
const fuelGame=fuelFixture(100);
for(let tick=0;tick<25;tick++)updateFuel(fuelGame,.1);
assert.equal(fuelGame.vehicle.fuel,100);assert.equal(fuelGame.fuel.refilling,false);
assert(fuelGame.player.cash<100&&fuelGame.player.cash>=92);
assert(fuelGame.popups.list.some(entry=>entry.life>0&&entry.text.startsWith('REFUELLED')&&entry.text.includes('-$')));
const freeFuel=fuelFixture(0);
for(let tick=0;tick<25;tick++)updateFuel(freeFuel,.1);
assert.equal(freeFuel.vehicle.fuel,100);assert.equal(freeFuel.player.cash,0);
assert(freeFuel.popups.list.some(entry=>entry.life>0&&entry.text.includes('FREE')));
const noRefill=fuelFixture(100);noRefill.vehicle.speed=50;
for(let tick=0;tick<5;tick++)updateFuel(noRefill,.1);
assert.equal(noRefill.vehicle.fuel,30);
noRefill.vehicle.speed=0;noRefill.vehicle.x+=500;
for(let tick=0;tick<5;tick++)updateFuel(noRefill,.1);
assert.equal(noRefill.vehicle.fuel,30);
console.log('Fuel drain, limp mode, station locations and refills: PASS');
assert.equal(headlightLevel(720),0);assert(headlightLevel(1040)>0.5);assert.equal(headlightLevel(0),1);assert(headlightLevel(555)<0.25);
console.log('Headlight level follows the render daylight curve: PASS');
{
 let gradients=0;const grad={addColorStop(){}};const rec=new Proxy({createLinearGradient:()=>{gradients++;return grad;},measureText:t=>({width:t.length*7})},{get:(o,k)=>k in o?o[k]:(...a)=>{},set:(o,k,v)=>(o[k]=v,true)});
 const car=createCar(300,lane,0,1,undefined,'traffic-driven');
 drawCar(rec,car,0,0);assert.equal(gradients,0);
 drawCar(rec,car,0,headlightLevel(1040));assert.equal(gradients,2);
 const parked=createCar(300,lane,0,1,undefined,'parked');
 drawCar(rec,parked,0,1);assert.equal(gradients,2);
}
console.log('Headlight cones gated by dusk level, twin gradients: PASS');
{
 assert.equal(MODELS.length,8);assert.equal(MODELS[6].name,'Dockhand Flatbed');assert.equal(MODELS[7].name,'Marlin Roadster');
 for(const m of MODELS){assert(m.topSpeed<=375&&m.topSpeed>=245);assert(m.acceleration<=215&&m.acceleration>=120);}
 const flatbed=createCar(300,lane,0,6,undefined,'player-driven');assert.equal(flatbed.model.name,'Dockhand Flatbed');assert.equal(flatbed.radius,MODELS[6].width/2+2);
 const roadster=createCar(320,lane,0,7,undefined,'traffic-driven');assert.equal(roadster.model.name,'Marlin Roadster');
 for(let frame=0;frame<600;frame++)updateCar(flatbed,{isDown:key=>key==='KeyW'},seeded,1/60);
 assert(flatbed.x>300&&flatbed.speed>100);
}
console.log('Flatbed and roadster models spawn, drive, stay in stat range: PASS');
{
 const focus={x:2100,y:1500};let sawFlatbed=false,sawRoadster=false;
 for(let fleet=0;fleet<8;fleet++){const t=createTraffic(seeded,focus);for(const car of t.cars){if(car.model===MODELS[6])sawFlatbed=true;if(car.model===MODELS[7])sawRoadster=true;}}
 assert(sawFlatbed&&sawRoadster);
}
console.log('Traffic fleets include the flatbed and the roadster: PASS');
{
 assert.equal(RADIO_STATIONS.length,2);assert.equal(RADIO_STATIONS[0].name,'CORAL FM 98.1');assert.equal(RADIO_STATIONS[1].name,'BAY FM 101.3');assert.equal(BAY_TRACKS.length,5);assert(BAY_TRACKS.every(t=>t.title&&t.artist));
 assert.equal(stationNow(0,0).station,'CORAL FM 98.1');assert.equal(stationNow(0,1).station,'BAY FM 101.3');
 assert.notEqual(stationNow(0,1).index,stationNow(25,1).index);assert.equal(stationNow(24*BAY_TRACKS.length,1).index,stationNow(0,1).index);
 const radio=createRadio();assert.equal(radio.station,0);assert.equal(cycleRadio(radio),1);assert.equal(cycleRadio(radio),2);assert.equal(cycleRadio(radio),0);
}
console.log('BAY FM second station and CORAL-BAY-OFF cycle: PASS');

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

const csPolice=createPolice();
spawnPolice(csPolice,200,lane);spawnPolice(csPolice,300,lane);spawnPolice(csPolice,400,lane,0,true);
const csGame={police:csPolice,wanted:{stars:3,seen:true},player:playerCar,vehicle:playerCar};
const csRows=responseRows(csGame);
assert(csRows.some(row=>row.callsign==='CB-01'));assert(csRows.some(row=>row.callsign==='CB-02'));assert(csRows.some(row=>row.callsign==='INT-3'));
assert.deepEqual(responseRows(csGame).map(row=>row.callsign),csRows.map(row=>row.callsign));
spawnHeli(csPolice,500,lane);
assert.equal(responseRows(csGame).find(row=>row.type==='HELI')?.callsign,'AIR-1');
console.log('Stable ground and air callsigns: PASS');

{
 const start=raceStartPoint(seeded),route=buildRoute(seeded);
 assert.equal(route.length,5);assert.deepEqual(route[4],start);
 for(const point of route){assert(seeded.roads.vertical.some(road=>road.x===point.x));assert(seeded.roads.horizontal.some(road=>road.y===point.y));}
 function raceFixture(){
  const rg={world:seeded,player:{...playerCar},vehicle:null,parkedCars:[],missions:{activity:null,totalEarned:0,splash:null},popups:createPopups(),playSeconds:0,vehicleEffects:createVehicleEffects(),outcome:null};
  rg.vehicle=createCar(start.x,start.y,0,3,undefined,'player-driven');Object.assign(rg.player,start);return rg;
 }
 {
  const race=createRace(),rg=raceFixture();rg.player.cash=0;rg.vehicle.fuel=5;
  assert.equal(startRace(race,rg),true);assert.equal(rg.vehicle.fuel,40);
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

function rampageFixture(){
 const rp={world:seeded,player:{...playerCar,cash:0},vehicle:null,parkedCars:[],missions:{activity:null,totalEarned:0,splash:null},popups:createPopups(),playSeconds:0,vehicleEffects:createVehicleEffects(),outcome:null};
 const start=rampageStartPoint(seeded);
 rp.vehicle=createCar(start.x,start.y,0,3,undefined,'player-driven');Object.assign(rp.player,start);return rp;
}
{
 const rampage=createRampage(),rp=rampageFixture();
 assert.equal(startRampage(rampage,rp),true);assert.equal(rampage.phase,'running');assert.equal(rp.missions.activity,'rampage');assert(rampage.ring);assert.equal(rampage.timeLeft,RAMPAGE_TIME);
 rp.vehicleEffects.nearChainUntil=999;rp.vehicleEffects.nearChain=1;updateRampage(rampage,rp,1/60);assert.equal(rampage.score,100);
 rp.vehicleEffects.nearChain=3;updateRampage(rampage,rp,1/60);assert.equal(rampage.score,400);
 Object.assign(rp.vehicle,rampage.ring);updateRampage(rampage,rp,1/60);assert.equal(rampage.score,650);
 rampage.timeLeft=.01;updateRampage(rampage,rp,.05);
 assert.equal(rampage.phase,'done');assert.equal(rp.player.cash,100);assert.equal(rp.missions.splash?.name,'RAMPAGE');assert.equal(rp.missions.activity,null);
 assert.equal(rampagePayout(2000),500);assert.equal(rampagePayout(1000),250);assert.equal(rampagePayout(400),100);assert.equal(rampagePayout(1),25);assert.equal(rampagePayout(0),0);
}
{
 const rampage=createRampage(),aborted=rampageFixture();
 assert.equal(startRampage(rampage,aborted),true);aborted.outcome={kind:'wasted'};
 updateRampage(rampage,aborted,1/60);
 assert.equal(rampage.phase,'idle');assert.equal(aborted.missions.activity,null);assert.equal(aborted.player.cash,0);
}
console.log('Rampage lifecycle, stunts, rings, payouts and outcome abort: PASS');

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
 if(scene==='chase'){assert(staged.rep);assert(staged.police.units.length>=3);assert(staged.police.units.some(unit=>unit.car.interceptor));assert(staged.vehicleEffects.markCursor>0);assert(staged.race);assert.equal(staged.race.phase,'running');assert(staged.race.rival);assert.equal(staged.race.checkpoints.length,5);assert.equal(staged.race.position,2);assert(responseRows(staged).every(row=>typeof row.callsign==='string'&&row.callsign.length>0));}
 if(scene==='cover'){
  assert(staged.radio);assert.equal(staged.radio.station,0);assert(headlightLevel(staged.clockMinutes)>0.5);
  assert(staged.rep);assert.equal(staged.rep.xp,0);
  assert.equal(staged.race.phase,'idle');
  assert.equal(staged.state,'playing');assert.equal(staged.wanted.stars,5);assert.equal(staged.police.units.length,4);assert(staged.police.units.some(unit=>unit.car.interceptor));assert(staged.vehicleEffects.popup);assert.equal(staged.vehicleEffects.popup.text,'NEAR MISS ×3');assert.equal(staged.vehicleEffects.nearChain,3);assert(staged.popups.list.some(entry=>entry.life>0&&entry.text==='NEAR MISS ×3'));assert(staged.vehicleEffects.markCursor>0);
  assert(staged.police.heli);assert([staged.police.heli.x,staged.police.heli.y].every(Number.isFinite));
  assert.equal(staged.combat.weapon,'pistol');assert.equal(staged.combat.ammo,12);assert.equal(staged.combat.reserve,36);
  assert(staged.fuel&&staged.rampage);assert.equal(staged.vehicle.fuel,100);
  const coverRows=responseRows(staged);
  assert(coverRows.every(row=>typeof row.callsign==='string'&&row.callsign.length>0));
  assert(coverRows.some(row=>row.callsign==='AIR-1'));assert(coverRows.some(row=>row.callsign.startsWith('INT-')));
 }
 console.log(`Seed=1 ${scene} scene: 180 frames, pinned clock, finite actors PASS`);
}
assert.equal(repLevel(0),1);assert.equal(repLevel(99),1);assert.equal(repLevel(100),2);assert.equal(repLevel(300),3);assert.equal(repLevel(4499),9);assert.equal(repLevel(4500),10);assert.equal(repLevel(100000),10);
const prog=repProgress(150);assert.equal(prog.level,2);assert.equal(prog.fraction,.25);assert.equal(repProgress(0).fraction,0);assert.equal(repProgress(99999).fraction,1);
console.log('REP level curve and progress fractions: PASS');
{
 const g={rep:createRep(),player:{...playerCar,cash:500},vehicle:null,popups:createPopups(),missions:{splash:null},playSeconds:0};
 assert.equal(awardRep(g,40),1);assert.equal(g.rep.xp,40);assert.equal(g.missions.splash,null);
 assert.equal(awardRep(g,60),2);assert.equal(g.rep.xp,100);assert.equal(g.missions.splash?.header,'STREET REP');assert.equal(g.missions.splash?.repLevel,2);
 assert(g.popups.list.some(entry=>entry.life>0&&entry.text==='REP UP · LV 2'));
 g.missions.splash={name:'KEEP ME',until:99};assert.equal(awardRep(g,200),3);assert.equal(g.missions.splash.name,'KEEP ME');assert.equal(g.rep.xp,300);
 assert.equal(awardRep({player:{cash:0}},50),0);assert.equal(awardRep(g,0),0);
}
console.log('REP award, level-up splash and overwrite guard: PASS');
{
 function repRaceFixture(){const rg={world:seeded,player:{...playerCar,cash:0},vehicle:null,parkedCars:[],missions:{activity:null,totalEarned:0,splash:null},popups:createPopups(),playSeconds:0,vehicleEffects:createVehicleEffects(),outcome:null,rep:createRep()};const start=raceStartPoint(seeded);rg.vehicle=createCar(start.x,start.y,0,3,undefined,'player-driven');Object.assign(rg.player,start);return rg;}
 const winRace=createRace(),wg=repRaceFixture();startRace(winRace,wg);winRace.playerNext=4;Object.assign(wg.vehicle,winRace.checkpoints[4]);updateRace(winRace,wg,1/60);
 assert.equal(winRace.result,'win');assert.equal(wg.rep.xp,60);
 const loseRace=createRace(),lg=repRaceFixture();startRace(loseRace,lg);loseRace.rivalFinishedAt=12;loseRace.playerNext=4;Object.assign(lg.vehicle,loseRace.checkpoints[4]);updateRace(loseRace,lg,1/60);
 assert.equal(loseRace.result,'lose');assert.equal(lg.rep.xp,20);
}
console.log('REP gains from race win and finish: PASS');
{
 const rampage=createRampage(),rp=rampageFixture();rp.rep=createRep();
 assert.equal(startRampage(rampage,rp),true);
 rp.vehicleEffects.nearChainUntil=999;rp.vehicleEffects.nearChain=1;updateRampage(rampage,rp,1/60);
 rp.vehicleEffects.nearChain=3;updateRampage(rampage,rp,1/60);
 Object.assign(rp.vehicle,rampage.ring);updateRampage(rampage,rp,1/60);
 assert.equal(rampage.score,650);
 rampage.timeLeft=.01;updateRampage(rampage,rp,.05);
 assert.equal(rampage.phase,'done');assert.equal(rp.rep.xp,50);assert.equal(rp.rep.xp,Math.min(REP_RAMPAGE_CAP,Math.floor(650/10)));
}
console.log('REP gain from rampage end (score/10 capped): PASS');
{
 const spot=performerSpot(seeded);
 assert(!seeded.collidesCircle(spot.x,spot.y,12));
 const fountain=seeded.props.find(prop=>prop.kind==='fountain');assert(fountain);assert(Math.hypot(spot.x-fountain.x,spot.y-fountain.y)<90);
 drawPerformer(ctx,{world:seeded},0);drawPerformer(ctx,{world:seeded},5000);drawPerformer(ctx,{},0);
}
console.log('Street performer spot and ambient draw: PASS');
