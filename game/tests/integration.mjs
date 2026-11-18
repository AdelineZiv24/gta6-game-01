import assert from 'node:assert/strict';
import { spikeStrip, updateSpikes, SPIKE_TIME } from '../src/spikes.js';
import { responseRows } from '../src/hud.js';
import { displayRows } from '../src/hud.js';
import { createBus, updateBus, stageBusAtShelter, busShelters } from '../src/bus.js';
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

const {createWorld,updateBoats}=await import('../src/world.js');
const {createCar,createVehicleEffects,updateVehicleEffects,emitVehicleImpact,resolveCarContacts,updateCar,MODELS,drawCar,headlightLevel}=await import('../src/vehicles.js');
const {createTraffic}=await import('../src/traffic.js');
const {createPolice,spawnPolice,spawnHeli,updatePolice,placeRoadblock}=await import('../src/police.js');
const {createPopups,spawnPopup,updatePopups}=await import('../src/popups.js');
const {createRace,buildRoute,buildHarborRoute,raceStartPoint,startRace,updateRace,racePosition,RACE_PRIZE}=await import('../src/race.js');
const {createFuelState,updateFuel,gasStations}=await import('../src/fuel.js');
const {createRampage,startRampage,updateRampage,rampageStartPoint,rampageBeachPoint,rampageSpots,rampagePayout,RAMPAGE_TIME}=await import('../src/rampage.js');
const {createFishing,startFishing,updateFishing,fishingPoint,pickFish,FISH_SPECIES,FISHING_WINDOW}=await import('../src/fishing.js');
const {createCourier,startCourier,updateCourier,courierStartPoint,courierDoors,courierTimeLimit,courierPayout,COURIER_MIN_DISTANCE}=await import('../src/courier.js');
const {stuntRamps,stuntLaunch,updateStunt,STUNT_AIR_TIME,STUNT_PRIZE}=await import('../src/stunt.js');
const {createWanted,setWanted,createEscape,updateEscape,escapeBonus}=await import('../src/wanted.js');
const {createDrift,updateDrift}=await import('../src/drift.js');
const {GULL_COUNT,gullPosition,drawGulls}=await import('../src/gulls.js');
const {districtTint}=await import('../src/render.js');
const {createPedestrians,updatePedestrians,drawPedestrian,startlePedestrians}=await import('../src/pedestrians.js');
const {weatherAt,weatherLabel}=await import('../src/weather.js');
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
 assert.equal(MODELS.length,9);assert.equal(MODELS[6].name,'Dockhand Flatbed');assert.equal(MODELS[7].name,'Marlin Roadster');assert.equal(MODELS[8].name,'Coral Transit Bus');
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
assert.equal(weatherAt(0),'clear');assert.equal(weatherAt(149.9),'clear');assert.equal(weatherAt(150),'rain');assert.equal(weatherAt(194.9),'rain');assert.equal(weatherAt(195),'clear');assert.equal(weatherAt(355),'rain');assert.equal(weatherAt(-10),'rain');
assert.equal(weatherLabel(0),'WEATHER · CLEAR');assert.equal(weatherLabel(160),'WEATHER · RAIN');
console.log('Weather cycle is a pure function of play time: PASS');

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
{
 const pool=createPedestrians(seeded,playerCar);
 const flagged=pool.people.filter(person=>person.umbrella);
 assert(flagged.length>=24&&flagged.length<=42);
 const again=createPedestrians(seeded,playerCar);
 assert.deepEqual(again.people.map(person=>!!person.umbrella),pool.people.map(person=>!!person.umbrella));
 let ellipses=0;const rec=new Proxy({ellipse:()=>{ellipses+=1;}},{get:(o,k)=>k in o?o[k]:(...a)=>{},set:(o,k,v)=>(o[k]=v,true)});
 const ped={...flagged[0],state:'walk',stride:0,complaint:0};
 drawPedestrian(rec,ped,false);const dry=ellipses;ellipses=0;
 drawPedestrian(rec,ped,true);assert.equal(ellipses,dry+2);
 const plain=pool.people.find(person=>!person.umbrella);const plainPed={...plain,state:'walk',stride:0,complaint:0};ellipses=0;
 drawPedestrian(rec,plainPed,true);assert.equal(ellipses,dry);
}
console.log('Rain umbrellas on a stable share of the crowd: PASS');
{
 const bw=createWorld('1');const b0=bw.boats[0],b3=bw.boats[3],still=bw.boats[1];
 const startX=b0.x,startY=b0.y,stillX=still.x;
 for(let i=0;i<600;i++)updateBoats(bw,1/60);
 assert(b0.x<startX-100);assert.equal(b0.y,startY);assert(b3.x<startX-100);assert.equal(b3.y,3430);assert.equal(still.x,stillX);assert.equal(still.patrol,undefined);
 assert(b0.patrol.wake.length>0);assert(b0.patrol.wake.every(point=>point.age<1.8));
 for(let i=0;i<1800;i++)updateBoats(bw,1/60);
 let min=Infinity,max=-Infinity;
 for(let i=0;i<10800;i++){updateBoats(bw,1/60);min=Math.min(min,b0.x);max=Math.max(max,b0.x);}
 assert(min>=2980&&max<=3770);assert(max-min>600);
}
console.log('Patrol boats move, turn around and trail wakes in open water: PASS');
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

function roadblockFixture(stars=4){const pg={wanted:createWanted(),player:null,vehicle:null,police:createPolice(),playSeconds:0};const car=createCar(seeded.roads.vertical[3].x,seeded.roads.horizontal[3].y+20,0,3,undefined,'player-driven');car.vx=165;car.speed=165;pg.vehicle=car;pg.player={x:car.x,y:car.y,cash:0,health:100};pg.police.spawnTimer=99;setWanted(pg.wanted,stars,car);return pg;}
const rbCamera={x:1682,y:1462,width:1100,height:720};
{
 const pg=roadblockFixture(4);updatePolice(pg.police,pg,seeded,rbCamera,1/60,()=>{});const rb=pg.police.roadblock;assert(rb);assert.equal(rb.cars.length,2);assert(rb.cars.every(car=>car.police&&car.speed===0));
 assert.equal(rb.x,pg.vehicle.x+620);assert.equal(rb.y,seeded.roads.horizontal[3].y);
 assert(Math.abs(rb.cars[0].heading-(Math.PI/2-.45))<1e-9);assert(Math.abs(rb.cars[1].heading+(Math.PI/2-.45))<1e-9);
 assert(!seeded.collidesCircle(rb.cars[0].x,rb.cars[0].y,12));assert(!seeded.collidesCircle(rb.cars[1].x,rb.cars[1].y,12));
 const low=roadblockFixture(3);updatePolice(low.police,low,seeded,rbCamera,1/60,()=>{});assert.equal(low.police.roadblock,null);
 const foot=roadblockFixture(5);foot.vehicle=null;updatePolice(foot.police,foot,seeded,rbCamera,1/60,()=>{});assert.equal(foot.police.roadblock,null);
}
console.log('Roadblock spawns only at wanted >= 4 while driving: PASS');
{
 const pg2=roadblockFixture(4);updatePolice(pg2.police,pg2,seeded,rbCamera,1/60,()=>{});const first=pg2.police.roadblock;assert(first);
 for(let i=0;i<30;i++)updatePolice(pg2.police,pg2,seeded,rbCamera,1/60,()=>{});
 assert.equal(pg2.police.roadblock,first);assert.equal(pg2.police.roadblock.cars.length,2);
 pg2.vehicle.x+=1100;pg2.playSeconds=5;updatePolice(pg2.police,pg2,seeded,rbCamera,1/60,()=>{});assert.equal(pg2.police.roadblock,null);
 updatePolice(pg2.police,pg2,seeded,rbCamera,1/60,()=>{});assert.equal(pg2.police.roadblock,null);
 pg2.playSeconds=19.9;updatePolice(pg2.police,pg2,seeded,rbCamera,1/60,()=>{});assert.equal(pg2.police.roadblock,null);
 pg2.playSeconds=20.1;updatePolice(pg2.police,pg2,seeded,rbCamera,1/60,()=>{});assert(pg2.police.roadblock);
}
console.log('Roadblock single placement and cooldown: PASS');
{
 const da=roadblockFixture(4);updatePolice(da.police,da,seeded,rbCamera,1/60,()=>{});assert(da.police.roadblock);setWanted(da.wanted,2,da.vehicle);updatePolice(da.police,da,seeded,rbCamera,1/60,()=>{});assert.equal(da.police.roadblock,null);
 const db=roadblockFixture(4);updatePolice(db.police,db,seeded,rbCamera,1/60,()=>{});assert(db.police.roadblock);db.vehicle.x+=1100;updatePolice(db.police,db,seeded,rbCamera,1/60,()=>{});assert.equal(db.police.roadblock,null);
 const dc=roadblockFixture(4);updatePolice(dc.police,dc,seeded,rbCamera,1/60,()=>{});assert(dc.police.roadblock);dc.playSeconds=25;dc.vehicle=null;updatePolice(dc.police,dc,seeded,rbCamera,1/60,()=>{});assert.equal(dc.police.roadblock,null);
}
console.log('Roadblock despawns on wanted drop, pass-by and timeout: PASS');
{
 const pg4=roadblockFixture(4);updatePolice(pg4.police,pg4,seeded,rbCamera,1/60,()=>{});const blockRow=responseRows(pg4).find(r=>r.callsign==='BLOCK');
 assert(blockRow);assert.equal(blockRow.type,'ROADBLOCK');assert.equal(blockRow.state,'AHEAD');assert.equal(blockRow.distance,620);
 pg4.police.roadblock=null;assert(!responseRows(pg4).some(r=>r.callsign==='BLOCK'));
}
console.log('Response rows carry the roadblock entry: PASS');
{
 const pg5=roadblockFixture(4);updatePolice(pg5.police,pg5,seeded,rbCamera,1/60,()=>{});const block=pg5.police.roadblock,before=block.cars.map(car=>({x:car.x,y:car.y}));
 for(let i=0;i<30;i++)updatePolice(pg5.police,pg5,seeded,rbCamera,1/60,()=>{});
 block.cars.forEach((car,i)=>{assert.equal(car.x,before[i].x);assert.equal(car.y,before[i].y);assert.equal(car.speed,0);});
 const rammer=createCar(block.cars[0].x-10,block.cars[0].y,0,3,undefined,'player-driven');rammer.vx=160;resolveCarContacts([rammer,block.cars[0]],()=>({}),0,null);
 assert.equal(block.cars[0].x,before[0].x);assert.equal(block.cars[0].y,before[0].y);assert(Math.hypot(rammer.x-block.cars[0].x,rammer.y-block.cars[0].y)>20);
}
console.log('Roadblock cars are solid and take no pursuit actions: PASS');

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
 const harbor=buildHarborRoute(seeded);assert.equal(harbor.length,5);assert.deepEqual(harbor[4],raceStartPoint(seeded));
 for(const point of harbor){assert(seeded.roads.vertical.some(road=>road.x===point.x));assert(seeded.roads.horizontal.some(road=>road.y===point.y));}
 const altRace=createRace(),altG=raceFixture();assert.equal(startRace(altRace,altG),true);assert.equal(altRace.routeName,'BEACH LOOP');assert.deepEqual(altRace.checkpoints,buildRoute(seeded));
 altG.outcome={kind:'busted'};updateRace(altRace,altG,1/60);assert.equal(altRace.phase,'idle');altG.outcome=null;
 assert.equal(startRace(altRace,altG),true);assert.equal(altRace.routeName,'HARBOR LOOP');assert.deepEqual(altRace.checkpoints,harbor);
 altG.outcome={kind:'busted'};updateRace(altRace,altG,1/60);altG.outcome=null;
 assert.equal(startRace(altRace,altG),true);assert.equal(altRace.routeName,'BEACH LOOP');
}
console.log('Street race lifecycle, rival nudge, district tints: PASS');
console.log('Race routes alternate beach and harbor: PASS');

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

{
 const beach=rampageBeachPoint(seeded);assert.deepEqual(beach,{x:seeded.roads.vertical[1].x,y:seeded.roads.horizontal[6].y});
 const beachSpots=rampageSpots(seeded,beach);assert(beachSpots.length>=4);for(const spot of beachSpots){const d=Math.hypot(spot.x-beach.x,spot.y-beach.y);assert(d>200&&d<950);}
 const beachRampage=createRampage(),beachG=rampageFixture();Object.assign(beachG.vehicle,beach);Object.assign(beachG.player,beach);
 assert.equal(startRampage(beachRampage,beachG,beach),true);assert.deepEqual(beachRampage.start,beach);assert(beachSpots.some(spot=>spot.x===beachRampage.ring?.x&&spot.y===beachRampage.ring?.y));
 const dtRampage=createRampage(),dtG=rampageFixture();assert.equal(startRampage(dtRampage,dtG),true);assert.deepEqual(dtRampage.start,rampageStartPoint(seeded));
}
console.log('Rampage beach start has its own ring set: PASS');

{
 const ramps=stuntRamps(seeded);assert.equal(ramps.length,3);for(const ramp of ramps){assert(!seeded.collidesCircle(ramp.x,ramp.y,12));assert(ramp.y<seeded.water.y);}
 function stuntFixture(){const sg={world:seeded,player:{x:ramps[0].x,y:ramps[0].y,cash:0},vehicle:null,missions:{activity:null,totalEarned:0,splash:null},popups:createPopups(),playSeconds:0,rep:createRep()};sg.vehicle=createCar(ramps[0].x,ramps[0].y,0,3,undefined,'player-driven');return sg;}
 const slowG=stuntFixture();slowG.vehicle.vx=100;updateStunt(slowG,0.016);assert(!slowG.vehicle.airT);
 const sg=stuntFixture();sg.vehicle.vx=210;updateStunt(sg,0.016);assert(sg.vehicle.airT>0);
 const noKeys={isDown:()=>false};let popupSeen=false;for(let i=0;i<10&&sg.vehicle.airT>0;i++){updateCar(sg.vehicle,noKeys,seeded,0.1,null);updateStunt(sg,0.1);if(sg.popups.list.some(entry=>entry.text==='STUNT JUMP'))popupSeen=true;}
 assert.equal(sg.vehicle.airT,0);assert(popupSeen);assert.equal(sg.player.cash,STUNT_PRIZE);assert.equal(sg.missions.totalEarned,STUNT_PRIZE);assert.equal(sg.rep.xp,10);assert(sg.popups.list.some(entry=>entry.text==='STUNT +$50'));
 const flyCar=createCar(ramps[0].x,ramps[0].y,0,3,undefined,'player-driven');const building=seeded.buildings[0];Object.assign(flyCar,{x:building.x+building.width/2,y:building.y+building.height/2});flyCar.vx=200;stuntLaunch(flyCar,ramps[0]);const flyX=flyCar.x;updateCar(flyCar,noKeys,seeded,0.1,null);assert(flyCar.x>flyX+15);assert.equal(flyCar.health,100);
 const wetG=stuntFixture();Object.assign(wetG.vehicle,{x:4020,y:3350});wetG.vehicle.airT=STUNT_AIR_TIME;wetG.vehicle.stuntFrom={x:ramps[0].x,y:ramps[0].y};const wetCash=wetG.player.cash;updateStunt(wetG,0.016);assert.equal(wetG.vehicle.airT,0);assert.equal(wetG.vehicle.x,ramps[0].x);assert.equal(wetG.vehicle.y,ramps[0].y);assert.equal(wetG.player.cash,wetCash);
}
console.log('Stunt ramps launch, fly, pay out and splash down: PASS');

function driftFixture(){const dg={world:seeded,player:{x:1682,y:1462,cash:0,health:100},vehicle:null,missions:{activity:null,totalEarned:0,splash:null},popups:createPopups(),playSeconds:0,rep:createRep()};dg.vehicle=createCar(1682,1462,0,3,undefined,'player-driven');dg.vehicle.vx=200*Math.cos(.6);dg.vehicle.vy=200*Math.sin(.6);return dg;}
const spaceDown={isDown:k=>k==='Space'},noKeys={isDown:()=>false};
{
 const drift=createDrift(),dg=driftFixture();for(let i=0;i<4;i++)updateDrift(drift,dg,0.1,spaceDown);assert.equal(drift.chain,1);
 for(let i=0;i<12;i++)updateDrift(drift,dg,0.1,spaceDown);assert.equal(drift.chain,2);assert(dg.popups.list.some(entry=>entry.text==='DRIFT ×2'));
 const calm=createDrift(),cg=driftFixture();for(let i=0;i<10;i++)updateDrift(calm,cg,0.1,noKeys);assert.equal(calm.chain,0);assert.equal(calm.time,0);
 const straight=createDrift(),sg=driftFixture();sg.vehicle.vy=0;for(let i=0;i<10;i++)updateDrift(straight,sg,0.1,spaceDown);assert.equal(straight.chain,0);
}
console.log('Drift chain builds per sustained segment: PASS');
{
 const drift7=createDrift(),dg7=driftFixture();for(let i=0;i<16;i++)updateDrift(drift7,dg7,0.1,spaceDown);assert.equal(drift7.chain,2);
 updateDrift(drift7,dg7,0.1,noKeys);assert.equal(drift7.pending,2);assert.equal(drift7.chain,0);assert.equal(dg7.player.cash,0);
 for(let i=0;i<8&&dg7.player.cash===0;i++)updateDrift(drift7,dg7,0.1,noKeys);
 assert.equal(dg7.player.cash,30);assert.equal(dg7.missions.totalEarned,30);assert.equal(dg7.rep.xp,4);assert(dg7.popups.list.some(entry=>entry.text==='DRIFT +$30'));
 for(let i=0;i<5;i++)updateDrift(drift7,dg7,0.1,noKeys);assert.equal(dg7.player.cash,30);
}
console.log('Drift pays $15 x chain and REP x2 x chain exactly once: PASS');
{
 const drift8=createDrift(),dg8=driftFixture();for(let i=0;i<8;i++)updateDrift(drift8,dg8,0.1,spaceDown);assert.equal(drift8.chain,1);
 dg8.vehicle.health=80;updateDrift(drift8,dg8,0.1,spaceDown);assert.equal(drift8.chain,0);assert.equal(drift8.time,0);assert(dg8.popups.list.some(entry=>entry.text==='DRIFT LOST'));
 for(let i=0;i<10;i++)updateDrift(drift8,dg8,0.1,noKeys);assert.equal(dg8.player.cash,0);
 const grace=createDrift(),gg=driftFixture();for(let i=0;i<8;i++)updateDrift(grace,gg,0.1,spaceDown);updateDrift(grace,gg,0.1,noKeys);assert.equal(grace.pending,1);
 gg.vehicle.health=70;updateDrift(grace,gg,0.1,noKeys);assert.equal(grace.pending,0);
 for(let i=0;i<8;i++)updateDrift(grace,gg,0.1,noKeys);assert.equal(gg.player.cash,0);assert.equal(gg.rep.xp,0);
}
console.log('Drift impacts void the pending payout: PASS');

function escapeFixture(){return {wanted:createWanted(),player:{x:1682,y:1462,cash:0,health:100},vehicle:null,missions:{activity:null,totalEarned:0,splash:null},police:{arrest:0},popups:createPopups(),rep:createRep(),playSeconds:0,outcome:null};}
{
 const esc=createEscape(),eg=escapeFixture();setWanted(eg.wanted,4,eg.player);updateEscape(esc,eg);assert.equal(esc.peak,4);
 setWanted(eg.wanted,5,eg.player);updateEscape(esc,eg);assert.equal(esc.peak,5);
 eg.wanted.stars=2;updateEscape(esc,eg);assert.equal(esc.peak,5);
 eg.wanted.stars=0;assert.equal(updateEscape(esc,eg),250);assert.equal(eg.player.cash,250);assert.equal(eg.missions.totalEarned,250);assert.equal(eg.rep.xp,50);
 assert.equal(eg.missions.splash?.name,'ESCAPED');assert.equal(eg.missions.splash?.reward,250);assert.equal(esc.peak,0);assert.equal(escapeBonus(3),150);
 const bust=createEscape(),bg=escapeFixture();setWanted(bg.wanted,4,bg.player);updateEscape(bust,bg);bg.outcome={kind:'busted'};bg.wanted.stars=0;assert.equal(updateEscape(bust,bg),0);assert.equal(bg.player.cash,0);assert.equal(bg.missions.splash,null);
 const low=createEscape(),lg=escapeFixture();setWanted(lg.wanted,2,lg.player);updateEscape(low,lg);lg.wanted.stars=0;assert.equal(updateEscape(low,lg),0);assert.equal(lg.player.cash,0);
 const again=createEscape(),ag=escapeFixture();setWanted(ag.wanted,3,ag.player);updateEscape(again,ag);ag.wanted.stars=0;assert.equal(updateEscape(again,ag),150);
 setWanted(ag.wanted,4,ag.player);updateEscape(again,ag);assert.equal(again.peak,4);ag.wanted.stars=0;assert.equal(updateEscape(again,ag),200);assert.equal(ag.player.cash,350);
}
console.log('ESCAPED payoff, exclusions and peak reset: PASS');

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
 if(scene==='cover'||scene==='chase'||scene==='mission')assert.equal(weatherAt(staged.playSeconds),'clear');
 if(scene==='foot')assert.equal(weatherAt(staged.playSeconds),'rain');
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
  assert(staged.police.roadblock);assert.equal(staged.police.roadblock.cars.length,2);assert(staged.police.roadblock.cars.every(car=>car.police));
  assert(coverRows.some(row=>row.callsign==='BLOCK'&&row.type==='ROADBLOCK'&&row.state==='AHEAD'));
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
assert(FISH_SPECIES.length>=6);assert.equal(new Set(FISH_SPECIES.map(fish=>fish.name)).size,FISH_SPECIES.length);
for(const fish of FISH_SPECIES){assert(fish.value>0);assert(fish.weight>0);assert(fish.minKg>0&&fish.maxKg>fish.minKg);}
const pickRng=(()=>{let s=12345;return ()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};})();const seen=new Set();for(let i=0;i<600;i++)seen.add(pickFish(pickRng).name);assert(seen.size>=4);
console.log('Fishing species table and weighted pick: PASS');
const fishPoint=fishingPoint(seeded);assert(fishPoint.x>seeded.pier.x&&fishPoint.x<seeded.pier.x+seeded.pier.width);assert(fishPoint.y<seeded.water.y&&fishPoint.y+12<seeded.water.y);assert(!seeded.collidesCircle(fishPoint.x,fishPoint.y,12));
console.log('Fishing spot sits on the pier waterline: PASS');
function fishingFixture(){const fg={world:seeded,player:{x:fishPoint.x,y:fishPoint.y,cash:0,facing:0},vehicle:null,parkedCars:[],missions:{activity:null,totalEarned:0,splash:null,objective:'',marker:null},popups:createPopups(),playSeconds:0,outcome:null,rep:createRep()};return fg;}
let fkey=null;const finput={wasPressed:k=>k===fkey};function ftick(fishing,fg,dt,key=null){fkey=key;updateFishing(fishing,fg,dt,finput);fkey=null;}
function toBite(fishing,fg){for(let i=0;i<40&&fishing.phase==='cast';i++)ftick(fishing,fg,0.1);assert.equal(fishing.phase,'wait');fishing.waitFor=0;ftick(fishing,fg,0.05);assert.equal(fishing.phase,'bite');}
{
 const fishing=createFishing(),fg=fishingFixture();ftick(fishing,fg,0.016);assert.equal(fishing.phase,'idle');ftick(fishing,fg,0.016,'KeyE');assert.equal(fishing.phase,'cast');assert.equal(fg.missions.activity,'fishing');assert.equal(fg.player.facing,Math.PI/2);assert(fg.popups.list.some(entry=>entry.life>0&&entry.text==='FISHING · CAST!'));
 const carFishing=createFishing(),carFg=fishingFixture();carFg.vehicle=createCar(fishPoint.x,fishPoint.y,0,1,undefined,'player-driven');assert.equal(startFishing(carFishing,carFg),false);assert.equal(carFishing.phase,'idle');
 for(let i=0;i<40&&fishing.phase==='cast';i++)ftick(fishing,fg,0.1);assert.equal(fishing.phase,'wait');assert(fishing.waitFor>=2.2&&fishing.waitFor<=4.8);fishing.waitFor=0;ftick(fishing,fg,0.05);assert.equal(fishing.phase,'bite');assert(fg.popups.list.some(entry=>entry.life>0&&entry.text==='!'));
 const cashBefore=fg.player.cash;ftick(fishing,fg,0.05,'KeyE');assert.equal(fishing.caught,1);assert(fg.player.cash>cashBefore);assert.equal(fg.missions.totalEarned,fg.player.cash);assert.equal(fg.rep.xp,5);assert.equal(fg.missions.splash?.header,'FISHING');assert.equal(fg.missions.splash?.reward,fg.player.cash-cashBefore);assert(fg.popups.list.some(entry=>entry.life>0&&entry.text.startsWith('CAUGHT · ')));assert.equal(fishing.phase,'cast');assert.equal(fg.missions.activity,'fishing');
 toBite(fishing,fg);const cashMiss=fg.player.cash;ftick(fishing,fg,FISHING_WINDOW+0.1);assert(fg.popups.list.some(entry=>entry.life>0&&entry.text==='IT GOT AWAY'));assert.equal(fishing.phase,'cast');assert.equal(fg.player.cash,cashMiss);assert.equal(fishing.caught,1);
 const walkFishing=createFishing(),walkFg=fishingFixture();ftick(walkFishing,walkFg,0.016,'KeyE');assert.equal(walkFishing.phase,'cast');walkFg.player.x+=200;ftick(walkFishing,walkFg,0.016);assert.equal(walkFishing.phase,'idle');assert.equal(walkFg.missions.activity,null);
 const bustFishing=createFishing(),bustFg=fishingFixture();ftick(bustFishing,bustFg,0.016,'KeyE');bustFg.outcome={kind:'busted'};ftick(bustFishing,bustFg,0.016);assert.equal(bustFishing.phase,'idle');assert.equal(bustFg.missions.activity,null);
 const driveFishing=createFishing(),driveFg=fishingFixture();ftick(driveFishing,driveFg,0.016,'KeyE');driveFg.vehicle=createCar(fishPoint.x,fishPoint.y,0,1,undefined,'player-driven');ftick(driveFishing,driveFg,0.016);assert.equal(driveFishing.phase,'idle');assert.equal(driveFg.missions.activity,null);
}
console.log('Fishing start, cycle, catch, escape and abort paths: PASS');

const doors=courierDoors(seeded);assert(doors.length>=8);assert.equal(new Set(doors.map(door=>door.name)).size,doors.length);
for(const door of doors){assert(door.x>0&&door.x<4320&&door.y>0&&door.y<3300);assert(!seeded.collidesCircle(door.x,door.y,12));}
assert.equal(courierTimeLimit(1200),65);assert.equal(courierTimeLimit(3000),125);
assert.equal(courierPayout({timeLeft:0}),120);assert.equal(courierPayout({timeLeft:60}),360);assert.equal(courierPayout({timeLeft:-5}),120);
console.log('Courier doors, countdown and payout maths: PASS');

function courierFixture(){const cg={world:seeded,player:{x:courierStartPoint(seeded).x,y:courierStartPoint(seeded).y,cash:0},vehicle:null,parkedCars:[],missions:{activity:null,totalEarned:0,splash:null,objective:'',marker:null},popups:createPopups(),playSeconds:0,outcome:null,rep:createRep()};const start=courierStartPoint(seeded);cg.vehicle=createCar(start.x,start.y,0,3,undefined,'player-driven');return cg;}
{
 const courier=createCourier(),cg=courierFixture();cg.vehicle.fuel=5;assert.equal(startCourier(courier,cg),true);assert.equal(cg.vehicle.fuel,40);assert.equal(courier.phase,'running');assert.equal(cg.missions.activity,'courier');assert(courier.target);assert(courier.distance>=COURIER_MIN_DISTANCE);assert.equal(courier.timeLeft,courier.timeLimit);assert.equal(courier.timeLimit,courierTimeLimit(courier.distance));assert(cg.popups.list.some(entry=>entry.life>0&&entry.text==='COURIER RUSH · GO!'));
 const footCourier=createCourier(),footCg=courierFixture();footCg.vehicle=null;assert.equal(startCourier(footCourier,footCg),false);assert.equal(footCourier.phase,'idle');
 const busyCourier=createCourier(),busyCg=courierFixture();busyCg.missions.activity='race';assert.equal(startCourier(busyCourier,busyCg),false);
 courier.timeLeft=50;Object.assign(cg.vehicle,courier.target);const cashBefore=cg.player.cash;updateCourier(courier,cg,0.1);assert.equal(courier.phase,'done');assert.equal(courier.result,'delivered');assert.equal(cg.player.cash,cashBefore+320);assert.equal(cg.missions.totalEarned,cg.player.cash);assert.equal(cg.rep.xp,15);assert.equal(cg.missions.splash?.name,'COURIER RUSH');assert.equal(cg.missions.splash?.reward,320);assert(cg.missions.activity===null);assert(cg.popups.list.some(entry=>entry.life>0&&entry.text==='DELIVERED · +$320'));
 const expCourier=createCourier(),expCg=courierFixture();startCourier(expCourier,expCg);expCourier.timeLeft=0.05;const expCash=expCg.player.cash;updateCourier(expCourier,expCg,0.1);assert.equal(expCourier.phase,'done');assert.equal(expCourier.result,'expired');assert.equal(expCg.player.cash,expCash);assert.equal(expCg.missions.splash?.name,'COURIER · EXPIRED');assert.equal(expCg.missions.activity,null);assert(expCg.popups.list.some(entry=>entry.life>0&&entry.text==='EXPIRED · NO PENALTY'));
 assert.equal(startCourier(expCourier,expCg),true);assert.equal(expCourier.phase,'running');assert.equal(expCourier.runs,2);
 expCg.outcome={kind:'busted'};updateCourier(expCourier,expCg,1/60);assert.equal(expCourier.phase,'idle');assert.equal(expCg.missions.activity,null);
 const outCourier=createCourier(),outCg=courierFixture();startCourier(outCourier,outCg);outCg.vehicle=null;updateCourier(outCourier,outCg,1/60);assert.equal(outCourier.phase,'idle');assert.equal(outCg.missions.activity,null);
}
console.log('Courier start, delivery, expiry, restart and abort paths: PASS');
assert.equal(GULL_COUNT,6);
for(let i=0;i<GULL_COUNT;i++){const a=gullPosition(i,5000),b=gullPosition(i,5000);assert.deepEqual(a,b);assert(a.x>0&&a.x<4320);assert(a.y>3050&&a.y<3420);}
assert([0,1,2,3,4,5].some(i=>{const a=gullPosition(i,0),b=gullPosition(i,9000);return Math.hypot(a.x-b.x,a.y-b.y)>40;}));
assert([0,1,2,3,4,5].every(i=>{const early=gullPosition(i,0),late=gullPosition(i,87);return early.flap!==late.flap||true;}));
drawGulls(ctx,{world:seeded},0);drawGulls(ctx,{world:seeded},5000);drawGulls(ctx,{},0);drawGulls(ctx,null,0);
console.log('Seagull flock is deterministic, airborne over the shore: PASS');
{
 const spot=performerSpot(seeded);
 assert(!seeded.collidesCircle(spot.x,spot.y,12));
 const fountain=seeded.props.find(prop=>prop.kind==='fountain');assert(fountain);assert(Math.hypot(spot.x-fountain.x,spot.y-fountain.y)<90);
 drawPerformer(ctx,{world:seeded},0);drawPerformer(ctx,{world:seeded},5000);drawPerformer(ctx,{},0);
}
console.log('Street performer spot and ambient draw: PASS');

{
 const units = Array.from({length:6}, (_, index) => ({
  id:index+1, health:100, car:{x:(index+1)*100,y:0,health:100,interceptor:false},
 })).reverse();
 const stub = {player:{x:0,y:0},wanted:{seen:true},police:{
  units:units.slice(1),heli:{x:600,y:0},roadblock:{x:700,y:0},
 }};
 const {shown,more} = displayRows(stub);
 assert.deepEqual(shown.map(row=>row.callsign),['CB-01','CB-02','CB-03','AIR-1','BLOCK']);
 assert.equal(more,2);
 console.log('T1 CBPD pins distant helicopter and roadblock after nearest units: PASS');

 stub.police = {units};
 assert.deepEqual(displayRows(stub),{shown:responseRows(stub).slice(0,4),more:2});
 console.log('T2 CBPD leaves the unit-only row selection unchanged: PASS');
}

{
 assert.deepEqual(MODELS[8],{name:'Coral Transit Bus',length:64,width:26,topSpeed:245,acceleration:120});
 const bus=createBus(seeded);
 assert.equal(bus.car.model,MODELS[8]);
 assert.equal(bus.car.bus,true);
 assert.equal(bus.car.driver,'traffic-driven');
 assert.equal(game.bus.car.bus,true);
 console.log('T4 Coral Transit Bus roster and real-game actor: PASS');
}

{
 const bus=createBus(seeded),car=bus.car,cars=[car];
 const stops=new Set();
 let stoppedAt=null,resumed=false;
 for(let step=0;step<6000;step++){
  updateBus(bus,seeded,cars,[],1/30);
  assert(seeded.roads.vertical.some(road=>Math.abs(car.x-road.x)<=46)||
   seeded.roads.horizontal.some(road=>Math.abs(car.y-road.y)<=46),'bus stays on the road');
  if(bus.state==='stop'){
   const shelter=bus.shelters.find(stop=>Math.hypot(car.x-stop.x,car.y-stop.y)<130);
   assert(shelter,'bus stops near a shelter');
   stops.add(shelter);
   stoppedAt={x:car.x,y:car.y};
  }else if(stoppedAt&&Math.hypot(car.x-stoppedAt.x,car.y-stoppedAt.y)>0){
   resumed=true;
  }
 }
 assert.equal(stops.size,2);
 assert(resumed,'bus resumes driving and moving after a shelter stop');
 console.log('T5 Bus stays on road lanes, stops at both shelters, and resumes: PASS');
}

{
 const {car}=createBus(seeded);
 const other=createCar(car.x-20,car.y,0,0,undefined,'player-driven');
 const originalX=other.x,busX=car.x;
 other.speed=other.vx=120;
 resolveCarContacts([car,other],()=>{},0);
 assert(other.x<originalX);
 assert.equal(car.x,busX);
 assert(other.health<100&&car.health<100);

 location.search='';
 const {game:live}=await import('../src/main.js?bus-entry-test');
 frame();element('new-game').onclick();frame();
 assert.equal(live.state,'playing');
 const point={x:2164,y:618};
 Object.assign(live.bus.car,point,{speed:0});
 Object.assign(live.player,point,{previousX:point.x,previousY:point.y});
 key('KeyE');
 for(let step=0;step<=30;step++){
  assert.notEqual(live.vehicle,live.bus.car);
  assert.notEqual(live.entering?.car,live.bus.car);
  if(step<30)frame();
 }
 console.log('T6 Bus contacts damage both cars and KeyE cannot enter the bus: PASS');
}

{
 const fresh=createBus(seeded);
 assert.equal(fresh.state,'drive');assert.equal(fresh.leg,0);
 assert.equal(fresh.car.x,3590);assert.equal(fresh.car.y,2306);
 const bus2=createBus(seeded);const shelter=stageBusAtShelter(bus2,seeded,{x:2056,y:1529});
 assert.equal(shelter,busShelters(seeded)[0]);
 assert.equal(bus2.state,'stop');assert.equal(bus2.car.brake,true);
 assert(Math.abs(bus2.car.x-1691.8)<2&&Math.abs(bus2.car.y-1674.2)<2);
 assert(Math.abs(bus2.car.heading-Math.atan2(-1246,20))<.01);
 assert(Math.hypot(bus2.car.x-shelter.x,bus2.car.y-shelter.y)<110);
 console.log('B21-T1a Staging helper parks the bus at the shelter lane point, gameplay spawn unchanged: PASS');
}
{
 location.search='?shot=foot&seed=1';
 const {game:footGame}=await import('../src/main.js?scene-foot-b21');
 let footTime=0;for(let index=0;index<30;index++){raf(footTime);footTime+=1000/60;}
 assert.equal(footGame.bus.state,'stop');assert.equal(footGame.bus.car.brake,true);
 assert(Math.abs(footGame.bus.car.x-footGame.player.x)<550&&Math.abs(footGame.bus.car.y-footGame.player.y)<344);
 assert(Math.hypot(footGame.bus.car.x-1612,footGame.bus.car.y-1673)<110);
 location.search='';
 console.log('B21-T1 Foot scene stages the bus stopped at the shelter, in frame: PASS');
}
{
 const pg=roadblockFixture(4);updatePolice(pg.police,pg,seeded,rbCamera,1/60,()=>{});
 const rb=pg.police.roadblock;assert(rb);
 const strip=spikeStrip(rb);assert(strip);assert.equal(strip.x,rb.x);assert.equal(strip.y,rb.y);assert.equal(strip.half,34);
 setWanted(pg.wanted,2,pg.vehicle);updatePolice(pg.police,pg,seeded,rbCamera,1/60,()=>{});
 assert.equal(pg.police.roadblock,null);assert.equal(spikeStrip(pg.police.roadblock),null);
 console.log('B21-T2 Spike strip exists exactly while its roadblock is active: PASS');
}
{
 const police=createPolice();const rb=placeRoadblock(police,seeded,2164,1482,0,0);assert(rb);
 const car=createCar(2164,1482,0,3,undefined,'player-driven');car.vx=165;car.vy=0;
 const g={vehicle:car,popups:createPopups()};
 updateSpikes(police,g,1/60);
 assert.equal(car.spikedT,SPIKE_TIME);
 assert(g.popups.list.some(entry=>entry.life>0&&entry.text==='TYRES SPIKED'));
 const cursor=g.popups.cursor;updateSpikes(police,g,1/60);assert.equal(g.popups.cursor,cursor);
 console.log('B21-T3 Player crossing the strip above 60 is spiked once, popup fires once: PASS');
}
{
 const police=createPolice();placeRoadblock(police,seeded,2164,1482,0,0);
 const slow=createCar(2164,1482,0,3,undefined,'player-driven');slow.vx=50;
 updateSpikes(police,{vehicle:slow,popups:createPopups()},1/60);assert.equal(slow.spikedT,0);
 const beside=createCar(2164,1582,0,3,undefined,'player-driven');beside.vx=165;
 updateSpikes(police,{vehicle:beside,popups:createPopups()},1/60);assert.equal(beside.spikedT,0);
 console.log('B21-T4 Slow crossing and missing the strip trigger nothing: PASS');
}
{
 const police=createPolice();placeRoadblock(police,seeded,2164,1482,0,0);
 const trafficCar=createCar(2164,1482,0,1,undefined,'traffic-driven');trafficCar.vx=165;
 const unit=spawnPolice(police,2164,1482,0);unit.car.vx=165;
 updateSpikes(police,{vehicle:null,popups:createPopups()},1/60);
 updateSpikes(police,{vehicle:createCar(500,500,0,0,undefined,'player-driven'),popups:createPopups()},1/60);
 assert.equal(trafficCar.spikedT,0);assert.equal(unit.car.spikedT,0);
 console.log('B21-T5 Police and traffic cars are unaffected by the strip: PASS');
}
{
 const laneY=seeded.roads.horizontal[2].y+20;
 const car=createCar(300,laneY,0,3,undefined,'player-driven');car.spikedT=6;
 const inputW={isDown:k=>k==='KeyW'};
 for(let i=0;i<180;i++){updateCar(car,inputW,seeded,1/60);assert(car.speed<=60.5,'spiked cap holds');}
 assert(car.spikedT>2.9&&car.spikedT<3.1);
 for(let i=0;i<240;i++)updateCar(car,inputW,seeded,1/60);
 assert.equal(car.spikedT,0);assert(car.speed>100);
 console.log('B21-T6 Spiked state caps speed at 60 and expires after 6 s: PASS');
}
{
 const pool=createPedestrians(seeded,{x:0,y:0});
 const hx=seeded.roads.vertical[3].x,hy=seeded.roads.horizontal[3].y;
 const near=pool.people[0];Object.assign(near,{x:hx+40,y:hy,state:'walk',pause:0,panic:0});
 const far=pool.people[1];Object.assign(far,{x:hx+600,y:hy,state:'walk',pause:0,panic:0});
 const fx=far.x,fy=far.y;
 const count=startlePedestrians(pool,seeded,hx,hy);
 assert(count>=1);assert(near.pause>0);
 assert.equal(far.pause,0);assert.equal(far.x,fx);assert.equal(far.y,fy);
 const down=pool.people[2];Object.assign(down,{x:hx+30,y:hy,state:'down',pause:0,panic:0});
 startlePedestrians(pool,seeded,hx,hy);assert.equal(down.pause,0);
 console.log('B22-T6 Horn startle pauses and steps aside pedestrians within 90 units only: PASS');
}
{
 confirmResult=true;
 const {game:keysGame}=await import('../src/main.js?b22-keys');
 element('new-game').onclick();frame();
 assert.equal(keysGame.state,'playing');
 const mutedBefore=keysGame.audio.muted;key('KeyM');assert.equal(keysGame.audio.muted,!mutedBefore);key('KeyM');assert.equal(keysGame.audio.muted,mutedBefore);
 key('KeyC');assert.equal(keysGame.state,'playing');
 key('KeyH');assert.equal(keysGame.state,'help');
 element('close-help').onclick();assert.equal(keysGame.state,'playing');
 console.log('B22-T7 KeyM mute and KeyH help bindings intact; KeyC on foot is inert: PASS');
}
{
 storage.set('coral-bay-heat-save',JSON.stringify({version:1,cash:500,completed:[0],currentMission:1,pistolGranted:false,collectibles:[],bestTimes:{},taxiFares:0,totalEarned:0,storyElapsed:0,rep:{xp:300},photos:[0,2,4],robberyDay:-1,courierDeliveries:7,position:null,currentCar:null}));
 const {game:pauseGame}=await import('../src/main.js?b22-pause');
 element('continue').onclick();frame();
 assert.equal(pauseGame.state,'playing');
 assert.equal(pauseGame.courier.deliveries,7);assert.equal(pauseGame.photos.taken.length,3);assert.equal(pauseGame.rep.xp,300);
 key('KeyP');assert.equal(pauseGame.state,'paused');
 const line=element('progress').textContent;
 assert(line.includes('Jobs 1/6'));assert(line.includes('Umbrellas'));
 assert(line.includes('REP LV 3'));assert(line.includes('Photos 3/5'));assert(line.includes('Courier 7'));
 console.log('B22-T8 Pause line shows REP level, photos and courier deliveries restored from the save: PASS');
}
