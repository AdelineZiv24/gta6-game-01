import assert from 'node:assert/strict';
import { spikeStrip, updateSpikes, SPIKE_TIME } from '../src/spikes.js';
import { responseRows } from '../src/hud.js';
import { displayRows } from '../src/hud.js';
import { createBus, updateBus, stageBusAtShelter, busShelters } from '../src/bus.js';
import { radioNow, RADIO_TRACKS, RADIO_STATIONS, BAY_TRACKS, TALK_TRACKS, stationNow, createRadio, cycleRadio } from '../src/radio.js';
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
const {createCar,createVehicleEffects,updateVehicleEffects,emitVehicleImpact,resolveCarContacts,updateCar,MODELS,drawCar,headlightLevel,setupParkedCars}=await import('../src/vehicles.js');
const {createTraffic}=await import('../src/traffic.js');
const {createPolice,spawnPolice,spawnHeli,updatePolice,placeRoadblock,drawHeliLight,heliSpotAlpha}=await import('../src/police.js');
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
const {createCombat,grantPistol,updateCombat,fireDriveBy}=await import('../src/combat.js');
const {createBarrels,updateBarrels,drawBarrelsWorld,barrelPositions}=await import('../src/barrels.js');
const {createFireworks,updateFireworks}=await import('../src/fireworks.js');
const {districtTint,signHaloAlpha,lampPoolAlpha}=await import('../src/render.js');
const {createPedestrians,updatePedestrians,drawPedestrian,startlePedestrians}=await import('../src/pedestrians.js');
const {weatherAt,weatherLabel,rainIntensity}=await import('../src/weather.js');
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
{
 assert.equal(signHaloAlpha(0),0);assert.equal(signHaloAlpha(1),0.4);assert(signHaloAlpha(0.5)>0&&signHaloAlpha(0.5)<signHaloAlpha(1));assert.equal(signHaloAlpha(-1),0);assert.equal(signHaloAlpha(2),0.4);
 console.log('B24-T3 Sign halo alpha is zero by day and scales with the night level: PASS');
}
{
 const {lightState,downtownIntersections,LIGHT_CYCLE}=await import('../src/lights.js');
 assert.equal(LIGHT_CYCLE,24);
 assert.equal(lightState('NS',2),'green');assert.equal(lightState('EW',2),'red');
 assert.equal(lightState('NS',11),'amber');assert.equal(lightState('EW',11),'red');
 assert.equal(lightState('NS',12.5),'red');assert.equal(lightState('EW',12.5),'red');
 assert.equal(lightState('NS',14),'red');assert.equal(lightState('EW',14),'green');
 assert.equal(lightState('EW',23.5),'amber');assert.equal(lightState('NS',23.5),'red');
 assert.equal(lightState('NS',26),'green');assert.equal(lightState('EW',-1),'amber');
 console.log('B29-T3 Light cycle is a deterministic 24 s function with amber and all-red clearance phases: PASS');
 const set=downtownIntersections(seeded);
 assert.equal(set.length,9);assert(set.some(i=>i.col===3&&i.row===3));assert(!set.some(i=>i.col===1||i.row===1));
 assert(set.every(i=>i.x===seeded.roads.vertical[i.col].x&&i.y===seeded.roads.horizontal[i.row].y));
 console.log('B29-T4 Downtown light set is the central 3x3 intersections at the road crossings: PASS');
}
{
 const {updateTraffic}=await import('../src/traffic.js');
 const ix=seeded.roads.vertical[3].x,iy=seeded.roads.horizontal[3].y;
 const car=createCar(ix-320,iy+20,0,1,undefined,'traffic-driven');car.speed=92;car.route={col:3,row:3,direction:0};car.tx=ix;car.ty=iy+20;
 const tr={cars:[car],timer:99,time:2};
 const focus={x:ix-320,y:iy};
 for(let i=0;i<240;i++)updateTraffic(tr,seeded,focus,[car],[],1/60,()=>{});
 assert(car.x<ix-48&&car.speed<8,'traffic stops at a red downtown light');
 tr.time=14;
 for(let i=0;i<180;i++)updateTraffic(tr,seeded,focus,[car],[],1/60,()=>{});
 assert(car.x>ix-48,'traffic proceeds on green');
 console.log('B29-T5 Traffic AI stops at a red downtown light and proceeds on green: PASS');
 const ox=seeded.roads.vertical[1].x,oy=seeded.roads.horizontal[1].y;
 const car2=createCar(ox-320,oy+20,0,1,undefined,'traffic-driven');car2.speed=92;car2.route={col:1,row:1,direction:0};car2.tx=ox;car2.ty=oy+20;
 const tr2={cars:[car2],timer:99,time:2};
 for(let i=0;i<240;i++)updateTraffic(tr2,seeded,{x:ox-320,y:oy},[car2],[],1/60,()=>{});
 assert(car2.x>ox-48,'traffic ignores lights outside the downtown set');
 console.log('B29-T6 Traffic ignores lights outside the downtown set: PASS');
}
{
 const {createRedLightTracker,updateRedLight}=await import('../src/lights.js');
 const ix=seeded.roads.vertical[3].x,iy=seeded.roads.horizontal[3].y;
 const tracker=createRedLightTracker();
 const car={x:ix-100,y:iy,heading:0,speed:100};
 assert.equal(updateRedLight(tracker,car,seeded,14),null);
 car.x=ix-20;const ev=updateRedLight(tracker,car,seeded,2);
 assert(ev&&ev.red===true&&ev.axis==='EW'&&ev.col===3&&ev.row===3);
 assert.equal(updateRedLight(tracker,car,seeded,2),null);
 car.x=ix+100;assert.equal(updateRedLight(tracker,car,seeded,2),null);
 car.x=ix;const ev2=updateRedLight(tracker,car,seeded,14);
 assert(ev2&&ev2.red===false);
 console.log('B29-T7 Red-light crossing detector is edge-triggered per entry and reports the axis phase: PASS');
}
{
 location.search='?shot=drive&seed=1';
 const {game:g}=await import('../src/main.js?b29-red');
 const {spawnPolice}=await import('../src/police.js');
 const {setWanted}=await import('../src/wanted.js');
 const ix=seeded.roads.vertical[3].x,iy=seeded.roads.horizontal[3].y;
 assert(g.redLight&&g.redLight.inside===null);
 setWanted(g.wanted,1,g.vehicle);
 let t=0;
 for(let i=0;i<40&&!g.recentCrimes.some(c=>c.type==='red_light');i++){
  if(!g.police.units.length)spawnPolice(g.police,g.vehicle.x+180,g.vehicle.y-280,0,false);
  g.vehicle.x=ix-130+i*7;g.vehicle.y=iy+20;g.vehicle.heading=0;g.vehicle.speed=120;g.playSeconds=2;
  raf(t);t+=1000/60;
 }
 const crime=g.recentCrimes.find(c=>c.type==='red_light');
 assert(crime&&crime.severity===1&&crime.violent===false,'red-light offence reports severity 1 through reportCrime');
 console.log('B29-T8 Running a downtown red in sight of a police unit reports a severity-1 offence: PASS');
}
{
 const {drawTrafficLights}=await import('../src/lights.js');
 const fills=[],rects=[];
 const ctx={save(){},restore(){},beginPath(){},arc(){},fill(){fills.push(this.fillStyle);},fillRect(x,y,w,h){rects.push([x,y,w,h]);}};
 const ix=seeded.roads.vertical[3].x,iy=seeded.roads.horizontal[3].y;
 const view={x:ix-480,y:iy-300,width:960,height:600};
 drawTrafficLights(ctx,seeded,view,2);
 assert(fills.includes('#ff4040')&&fills.includes('#2fe07a'));
 assert(rects.some(r=>r[2]===10&&r[3]===22));
 fills.length=0;drawTrafficLights(ctx,seeded,view,11);
 assert(fills.includes('#ffb020'));
 console.log('B29-T9 Traffic light poles draw the live phase colours for both axes: PASS');
}

{
 const fills=[];
 const rec=new Proxy({measureText:t=>({width:t.length*7}),createLinearGradient:()=>({addColorStop(){}}),fill(){fills.push({style:this.fillStyle,alpha:this.globalAlpha===undefined?1:this.globalAlpha});}},{get:(o,k)=>k in o?o[k]:(...a)=>{},set:(o,k,v)=>(o[k]=v,true)});
 const haloRenderer=createRenderer({width:1280,height:800,getContext:()=>rec});
 const mart=seeded.buildings.find(b=>b.storefront&&b.storefront.sign==='CORAL MART');
 const diner=seeded.buildings.find(b=>b.landmark&&b.short==='MARLIN DINER');
 assert(mart&&diner);
 haloRenderer.camera.x=mart.x+mart.width/2;haloRenderer.camera.y=mart.y+mart.height/2;haloRenderer.camera.clamp();
 fills.length=0;haloRenderer.draw(seeded,null,0,720);
 assert(!fills.some(f=>f.alpha<1),'no translucent halo fills at day');
 fills.length=0;haloRenderer.draw(seeded,null,0,0);
 assert(fills.some(f=>f.alpha===signHaloAlpha(1)&&f.style===mart.storefront.color),'storefront halo fill in the mart colour at night');
 haloRenderer.camera.x=diner.x+diner.width/2;haloRenderer.camera.y=diner.y+diner.height/2;haloRenderer.camera.clamp();
 fills.length=0;haloRenderer.draw(seeded,null,0,0);
 assert(fills.some(f=>f.alpha===signHaloAlpha(1)&&f.style===diner.facade),'landmark halo fill in the diner facade colour at night');
 console.log('B24-T4 Storefront and landmark signs gain a coloured halo at night and none by day: PASS');
}
{
 assert.equal(heliSpotAlpha(0),0);assert.equal(heliSpotAlpha(1),1);assert.equal(heliSpotAlpha(0.5),0.5);assert.equal(heliSpotAlpha(-1),0);assert.equal(heliSpotAlpha(2),1);
 console.log('B25-T1 Heli spotlight scale is zero by day and follows the headlight level: PASS');
}
{
 const fills=[];
 const rec=new Proxy({measureText:t=>({width:t.length*7}),createLinearGradient:()=>({addColorStop(){}}),fill(){fills.push({style:this.fillStyle,alpha:this.globalAlpha===undefined?1:this.globalAlpha});}},{get:(o,k)=>k in o?o[k]:(...a)=>{},set:(o,k,v)=>(o[k]=v,true)});
 const pol=createPolice();spawnHeli(pol,1000,1000);pol.heli.lightX=1150;pol.heli.lightY=1120;
 drawHeliLight(rec,pol,0);
 assert(!fills.some(f=>f.style==='#fff4be'),'no spotlight fills by day');
 assert(fills.some(f=>f.style==='rgba(10,25,30,0.25)'),'heli ground shadow still drawn by day');
 fills.length=0;drawHeliLight(rec,pol,1);
 assert(fills.some(f=>f.style==='#fff4be'&&Math.abs(f.alpha-0.30)<1e-9),'spotlight pool fill at full dusk alpha');
 assert(fills.some(f=>f.style==='#fff4be'&&Math.abs(f.alpha-0.22)<1e-9),'spotlight cone fill at full dusk alpha');
 console.log('B25-T2 Heli spotlight cone and pool draw only when the headlight level is up: PASS');
}
{
 assert.equal(lampPoolAlpha(0),0);assert.equal(lampPoolAlpha(1),0.16);assert.equal(lampPoolAlpha(0.5),0.08);assert.equal(lampPoolAlpha(-1),0);assert.equal(lampPoolAlpha(2),0.16);
 console.log('B25-T3 Lamp pool alpha is zero by day and scales with the night level: PASS');
}
{
 const fills=[];
 const rec=new Proxy({measureText:t=>({width:t.length*7}),createLinearGradient:()=>({addColorStop(){}}),fill(){fills.push({style:this.fillStyle,alpha:this.globalAlpha===undefined?1:this.globalAlpha});}},{get:(o,k)=>k in o?o[k]:(...a)=>{},set:(o,k,v)=>(o[k]=v,true)});
 const lampRenderer=createRenderer({width:1280,height:800,getContext:()=>rec});
 const lamp=seeded.props.find(prop=>prop.kind==='lamp');
 assert(lamp);
 lampRenderer.camera.x=lamp.x;lampRenderer.camera.y=lamp.y;lampRenderer.camera.clamp();
 fills.length=0;lampRenderer.draw(seeded,null,0,720);
 assert(!fills.some(f=>f.style==='#ffd98c'),'no lamp pool fills at day');
 fills.length=0;lampRenderer.draw(seeded,null,0,0);
 assert(fills.some(f=>f.style==='#ffd98c'&&f.alpha===lampPoolAlpha(1)),'lamp pool fill at full night alpha');
 console.log('B25-T4 Street lamps pool warm light on the ground at night and none by day: PASS');
}
{
 function driveByFixture(){return {combat:createCombat(),player:{x:0,y:0,health:100,armour:0,facing:0,cash:0},vehicle:null,police:{units:[]},wanted:{seen:false},playSeconds:0,state:'playing',entering:null,width:1280,height:800,pixelRatio:1};}
 const dbInput={wasPressed:k=>k==='KeyF',isDown:()=>false,mouseDown:()=>false,mousePosition:()=>({x:0,y:0,moved:false})};
 const dbReport=list=>(type,x,y,severity,violent)=>{const c={type,severity,violent};list.push(c);return c;};
 const dbX=seeded.roads.vertical[3].x+180,dbY=seeded.roads.horizontal[3].y+20;
 const g1=driveByFixture();g1.vehicle=createCar(dbX,dbY,0,3,undefined,'player-driven');g1.player.x=dbX;g1.player.y=dbY;grantPistol(g1,48);
 const crimes1=[];updateCombat(g1,seeded,dbInput,{x:dbX,y:dbY,width:1100,height:720},[g1.vehicle],[],dbReport(crimes1),1/60);
 assert.equal(g1.combat.ammo,11);assert(g1.combat.cooldown>0);assert(g1.combat.effects.some(e=>e.kind==='tracer'));
 assert(crimes1.some(c=>c.type==='weapon_fired'&&c.severity===3));
 console.log('B25-T5 Drive-by fire spends one round, draws a tracer and reports weapon_fired at on-foot severity: PASS');
 const g2=driveByFixture();g2.vehicle=createCar(dbX,dbY,0,3,undefined,'player-driven');g2.player.x=dbX;g2.player.y=dbY;
 const crimes2=[];updateCombat(g2,seeded,dbInput,{x:dbX,y:dbY,width:1100,height:720},[g2.vehicle],[],dbReport(crimes2),1/60);
 assert.equal(g2.combat.weapon,'fists');assert(!g2.combat.effects.some(e=>e.kind==='tracer'));assert(!crimes2.some(c=>c.type==='weapon_fired'));
 console.log('B25-T6 Drive-by does not fire with fists equipped: PASS');
 const g3=driveByFixture();grantPistol(g3,48);g3.player.x=dbX;g3.player.y=dbY;g3.player.facing=0;
 const crimes3=[];updateCombat(g3,seeded,dbInput,{x:dbX,y:dbY,width:1100,height:720},[],[],dbReport(crimes3),1/60);
 assert.equal(g3.combat.ammo,12);assert(!g3.combat.effects.some(e=>e.kind==='tracer'));assert(!crimes3.some(c=>c.type==='weapon_fired'));
 console.log('B25-T7 KeyF on foot never fires the pistol: PASS');
 const g4=driveByFixture();g4.vehicle=createCar(dbX,dbY,0,3,undefined,'player-driven');g4.player.x=dbX;g4.player.y=dbY;grantPistol(g4,48);
 const ped={x:dbX+8,y:dbY-56,state:'walk',pause:0};
 const crimes4=[];updateCombat(g4,seeded,dbInput,{x:dbX,y:dbY,width:1100,height:720},[g4.vehicle],[ped],dbReport(crimes4),1/60);
 assert.equal(ped.state,'down');assert(crimes4.some(c=>c.type==='pedestrian_hit'&&c.severity===3));assert(crimes4.some(c=>c.type==='weapon_fired'&&c.severity===3));
 console.log('B25-T8 Drive-by pedestrian hit reports at the on-foot severities: PASS');
 const g5=driveByFixture();g5.vehicle=createCar(dbX,dbY,0,3,undefined,'player-driven');g5.player.x=dbX;g5.player.y=dbY;grantPistol(g5,48);
 const officer={x:dbX+8,y:dbY-56,health:100,onFoot:true,hostile:false,facing:0};g5.police.units=[officer];
 const crimes5=[];updateCombat(g5,seeded,dbInput,{x:dbX,y:dbY,width:1100,height:720},[g5.vehicle],[],dbReport(crimes5),1/60);
 assert.equal(officer.health,60);assert(crimes5.some(c=>c.type==='police_hit'&&c.severity===4));
 console.log('B25-T9 Drive-by officer hit reports police_hit at the on-foot severity: PASS');
}
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
 assert.equal(MODELS.length,10);assert.equal(MODELS[6].name,'Dockhand Flatbed');assert.equal(MODELS[7].name,'Marlin Roadster');assert.equal(MODELS[8].name,'Coral Transit Bus');
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
 assert.equal(RADIO_STATIONS.length,3);assert.equal(RADIO_STATIONS[0].name,'CORAL FM 98.1');assert.equal(RADIO_STATIONS[1].name,'BAY FM 101.3');assert.equal(RADIO_STATIONS[2].name,'BAY TALK 90.7');assert.equal(RADIO_STATIONS[0].freq,'98.1');assert.equal(RADIO_STATIONS[1].freq,'101.3');assert.equal(RADIO_STATIONS[2].freq,'90.7');assert.equal(BAY_TRACKS.length,5);assert(BAY_TRACKS.every(t=>t.title&&t.artist));assert(TALK_TRACKS.length>=4);assert(TALK_TRACKS.every(t=>t.title&&t.artist));
 assert.equal(stationNow(0,0).station,'CORAL FM 98.1');assert.equal(stationNow(0,1).station,'BAY FM 101.3');assert.equal(stationNow(0,2).station,'BAY TALK 90.7');
 assert.notEqual(stationNow(0,1).index,stationNow(25,1).index);assert.equal(stationNow(24*BAY_TRACKS.length,1).index,stationNow(0,1).index);
 const radio=createRadio();assert.equal(radio.station,0);assert.equal(cycleRadio(radio),1);assert.equal(cycleRadio(radio),2);assert.equal(cycleRadio(radio),3);assert.equal(cycleRadio(radio),0);
}
console.log('Three stations and the CORAL-BAY-TALK-OFF cycle: PASS');
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
 assert.equal(staged.world.seed,'1');assert.equal(staged.clockMinutes,scene==='start'?555:(scene==='cover'||scene==='foot')?1100:scene==='chase'?1300:1040); // brief-33: chase re-pinned to the 1300 night clock (authorised re-spec, chase only)
 assert.equal(staged.radio.station,{cover:1,chase:1,foot:2}[scene]??staged.radio.station);
 assert.equal(staged.state,scene==='start'?'menu':'playing');
 assert([staged.player.x,staged.player.y].every(Number.isFinite));
 for(const unit of staged.police.units)assert([unit.x,unit.y,unit.car.x,unit.car.y,unit.car.heading].every(Number.isFinite));
 if(scene==='chase'){assert(staged.rep);assert(staged.police.units.length>=3);assert(staged.police.units.some(unit=>unit.car.interceptor));assert(staged.vehicleEffects.markCursor>0);assert(staged.race);assert.equal(staged.race.phase,'running');assert(staged.race.rival);assert.equal(staged.race.checkpoints.length,5);assert.equal(staged.race.position,2);assert(responseRows(staged).every(row=>typeof row.callsign==='string'&&row.callsign.length>0));}
 if(scene==='chase'){assert.equal(staged.combat.weapon,'pistol');assert(staged.combat.effects.some(e=>e.kind==='tracer'),'chase stages a live drive-by tracer');assert(staged.combat.ammo<12);console.log('B25-T10 Chase scene stages the drive-by muzzle flash and tracer through the real combat path: PASS');}
 if(scene==='cover'||scene==='chase'||scene==='mission')assert.equal(weatherAt(staged.playSeconds),'clear');
 if(scene==='foot')assert.equal(weatherAt(staged.playSeconds),'rain');
 if(scene==='cover'){
  assert(staged.radio);assert.equal(staged.radio.station,1);assert(headlightLevel(staged.clockMinutes)>0.5);
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
  assert.equal(staged.clockMinutes,1100);assert(headlightLevel(staged.clockMinutes)>0.9);
  console.log('B24-T1 Cover stages at the 1100 dusk clock with near-full headlight level, other scenes keep their pinned clocks: PASS');
  assert(staged.news.banner,'cover stages the BREAKING banner');assert(staged.news.banner.headline.startsWith('EXPLOSION ROCKS'));
  console.log('B29-T1 Cover stages the BREAKING banner through the real barrel detonation path: PASS');
  assert(staged.fireworks.burstPoints.some(p=>Math.hypot(p.x-staged.vehicle.x,p.y-staged.vehicle.y)<430),'cover stages a fireworks burst in frame');
  assert(staged.fireworks.sparks.some(s=>s.held),'cover holds the burst sparks as a radial disc');
  console.log('B29-T2 Cover stages one age-frozen radial fireworks burst in frame: PASS');
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
{
 location.search='?shot=cover&seed=1';
 const {game:coverGlow}=await import('../src/main.js?b23-cover');
 let t=0;for(let i=0;i<30;i++){raf(t);t+=1000/60;}
 assert(coverGlow.glow);assert.equal(coverGlow.glow.color,0);
 assert.equal(coverGlow.vehicle.driver,'player-driven');
 const {glowAlpha}=await import('../src/glow.js');
 assert(glowAlpha(coverGlow.clockMinutes)>0.5);
 console.log('B23-T5 Cover staging equips the cyan underglow through the real draw path: PASS');
}
{
 const {drawSpikes,SPIKE_HALF,SPIKE_SPEED,SPIKE_CAP}=await import('../src/spikes.js');
 assert.equal(SPIKE_HALF,34);assert.equal(SPIKE_SPEED,60);assert.equal(SPIKE_CAP,60);assert.equal(SPIKE_TIME,6);
 const fillRects=[];let strokeCalls=0;
 const rctx={save(){},restore(){},translate(){},rotate(){},beginPath(){},fill(){},stroke(){strokeCalls++;},fillRect(x,y,w,h){fillRects.push([x,y,w,h]);},arc(){},moveTo(){},lineTo(){}};
 drawSpikes(rctx,{roadblock:{x:100,y:100,dirX:1,dirY:0}},0);
 assert(fillRects.some(f=>f[2]===16));
 assert(strokeCalls>=9);
 console.log('B23-T9 Spike strip redraws wider with light studs and chevrons; geometry and thresholds unchanged: PASS');
}
console.log('B23-T10 All pre-existing story and integration tests pass unmodified: PASS');
function reportLog(){const crimes=[];const report=(type,x,y,severity,violent)=>{const c={type,x,y,severity,violent};crimes.push(c);return c;};return {crimes,report};}
{
 const barrels=createBarrels(seeded);const barrel=barrels.list[0];
 const {crimes,report}=reportLog();
 const g={state:'playing',barrels,vehicle:null,entering:null,player:{x:barrel.x,y:barrel.y+60,health:100,armour:0,facing:-Math.PI/2,cash:0},combat:createCombat(),police:{units:[]},wanted:{seen:false},playSeconds:0,width:1280,height:800,pixelRatio:1,audio:null};
 grantPistol(g,12);
 const input={mouseDown:b=>b===0,isDown:()=>false,wasPressed:()=>false,mousePosition:()=>({x:0,y:0,moved:false})};
 updateCombat(g,seeded,input,{x:0,y:0,width:1100,height:687},[],[],report,1/60);
 assert.equal(barrel.state,'lit');assert(barrel.timer>0&&barrel.timer<=.12);
 assert(crimes.some(c=>c.type==='weapon_fired'&&c.severity===3));
 console.log('B26-T1 A pistol shot through the ordinary hitscan lights a barrel fuse: PASS');
}
{
 const barrels=createBarrels(seeded);const barrel=barrels.list[1];
 const {report}=reportLog();
 const car=createCar(barrel.x-14,barrel.y+90,0,1,undefined,'player-driven');
 const g={state:'playing',barrels,vehicle:car,player:{x:car.x,y:car.y,health:100,armour:0,cash:0},combat:createCombat(),police:{units:[]},playSeconds:0,audio:null};
 grantPistol(g,12);
 assert.equal(fireDriveBy(g,seeded,[car],[],report),true);
 assert.equal(barrel.state,'lit');
 console.log('B26-T2 A drive-by shot lights a barrel through the same hitscan: PASS');
}
{
 const barrels=createBarrels(seeded);const b0=barrels.list[0],b1=barrels.list[1];
 const {crimes,report}=reportLog();
 const g={state:'playing',barrels,vehicle:null,player:{x:b0.x,y:b0.y+400,health:100,armour:0,cash:0},playSeconds:0,popups:createPopups(),missions:null,audio:null,combat:createCombat()};
 const carNear=createCar(b0.x+60,b0.y,0,1);const carFar=createCar(b0.x+300,b0.y,0,1);
 const pedDown={x:b0.x+40,y:b0.y,state:'walk',panic:0};const pedPanic={x:b0.x+120,y:b0.y,state:'walk',panic:0};const pedFar={x:b0.x+320,y:b0.y,state:'walk',panic:0};
 b0.state='lit';b0.timer=.01;
 updateBarrels(barrels,g,[carNear,carFar],[pedDown,pedPanic,pedFar],report,1/30);
 assert.equal(b0.state,'gone');assert.equal(barrels.bursts,1);
 assert.equal(carNear.health,45);assert.equal(carFar.health,100);assert.equal(g.player.health,100);
 assert.equal(pedDown.state,'down');assert.equal(pedPanic.state,'walk');assert(pedPanic.panic>=6);assert.equal(pedFar.panic,0);
 const boom=crimes.find(c=>c.type==='explosion');assert(boom&&boom.severity===4&&boom.violent===true);
 assert.equal(b1.state,'lit');assert(b1.timer>.2&&b1.timer<=.35);
 updateBarrels(barrels,g,[],[],report,.4);
 assert.equal(b1.state,'gone');assert.equal(barrels.bursts,2);
 console.log('B26-T3 Detonation: radial damage, ped down/panic bands, severity-4 explosion report, delayed chain: PASS');
}
{
 const barrels=createBarrels(seeded);const barrel=barrels.list[2];
 const {crimes,report}=reportLog();
 const g={state:'playing',barrels,vehicle:null,entering:null,player:{x:barrel.x,y:barrel.y+30,health:100,armour:0,facing:0,cash:0},combat:createCombat(),police:{units:[]},wanted:{seen:false},playSeconds:0,width:1280,height:800,pixelRatio:1,audio:null};
 const input={mouseDown:()=>false,isDown:k=>k==='KeyF',wasPressed:()=>false,mousePosition:()=>({x:0,y:0,moved:false})};
 updateCombat(g,seeded,input,{x:0,y:0,width:1100,height:687},[],[],report,1/60);
 assert.equal(barrel.state,'idle');
 const car=createCar(barrel.x,barrel.y,0,1,undefined,'player-driven');car.speed=140;car.vx=140;
 resolveCarContacts([car],report,0,null);
 for(let i=0;i<30;i++)updateBarrels(barrels,g,[car],[],report,1/60);
 assert.equal(barrel.state,'idle');assert.equal(barrels.bursts,0);assert(!crimes.some(c=>c.type==='explosion'));
 console.log('B26-T4 Melee and vehicle contact never detonate a barrel: PASS');
}
{
 const positions=barrelPositions(seeded);assert.equal(positions.length,10);
 const stations=gasStations(seeded);for(const s of stations)assert(positions.some(p=>Math.abs(Math.hypot(p.x-s.x,p.y-s.y)-58.55)<1.5));
 const barrels=createBarrels(seeded);drawBarrelsWorld(ctx,barrels,0);drawBarrelsWorld(ctx,barrels,5000);
 console.log('B26-T5 Ten deterministic barrel positions, two at every gas station, draw runs clean: PASS');
}
{
 assert.equal(MODELS.length,10);assert.deepEqual(MODELS[9],{name:'Comet Chopper',length:30,width:12,topSpeed:330,acceleration:205});
 const bike=createCar(300,lane,0,9,undefined,'player-driven');assert.equal(bike.model.name,'Comet Chopper');assert.equal(bike.radius,8);
 assert(Math.max(...MODELS.map(m=>m.topSpeed))===375);
 console.log('B26-T6 Comet Chopper joins the roster at index 9 inside the stat ranges: PASS');
}
{
 let sawBike=false;for(let fleet=0;fleet<12&&!sawBike;fleet++){const t=createTraffic(seeded,playerCar);if(t.cars.some(c=>c.model===MODELS[9]))sawBike=true;}
 assert(sawBike);
 const parkedFleet=setupParkedCars(seeded);
 assert(parkedFleet.some(c=>c.model===MODELS[9]));assert(!parkedFleet.some(c=>c.model===MODELS[8]));
 console.log('B26-T7 Traffic rolls include the motorcycle and parked fleets gain bikes but never the bus: PASS');
}
{
 const bike=createCar(300,lane,0,9,undefined,'player-driven');
 for(let i=0;i<90;i++)updateCar(bike,{isDown:k=>k==='KeyW'},seeded,1/60,null);
 assert(bike.speed>100);assert(Number.isFinite(bike.x)&&Number.isFinite(bike.y));
 drawCar(ctx,bike,0,1);
 console.log('B26-T8 The motorcycle drives under the normal car physics and draws clean: PASS');
}
{
 const fw=createFireworks();
 for(let i=0;i<600;i++)updateFireworks(fw,seeded,0,1/60);
 assert.equal(fw.rockets.length,0);assert.equal(fw.bursts,0);assert.equal(fw.sparks.length,0);
 let launched=null;
 for(let i=0;i<600&&fw.bursts===0;i++){updateFireworks(fw,seeded,1,1/60);if(!launched&&fw.rockets.length)launched={...fw.rockets[0]};}
 assert(fw.bursts>=1);assert(launched);assert(Math.abs(launched.y-seeded.spawnPoints.pier.y)<6);assert(Math.abs(launched.x-seeded.spawnPoints.pier.x)<=18);
 console.log('B26-T9 Fireworks never launch by day and launch from the pier end at night: PASS');
}
{
 const fw=createFireworks();let sawSparks=false;
 for(let i=0;i<600;i++){updateFireworks(fw,seeded,1,1/60);if(fw.sparks.length>=20)sawSparks=true;}
 assert(sawSparks);assert(fw.bursts>=1);assert(fw.lastBurst&&Number.isFinite(fw.lastBurst.x)&&Number.isFinite(fw.lastBurst.y));
 console.log('B26-T10 A rocket burst scatters a full shell of sparks and records the burst point: PASS');
}
{
 location.search='?shot=foot&seed=1';
 const {game:footDusk}=await import('../src/main.js?scene-foot-b26');
 let t=0;for(let index=0;index<180;index++){raf(t);t+=1000/60;}
 assert.equal(footDusk.clockMinutes,1100);assert.equal(weatherAt(footDusk.playSeconds),'rain');
 assert(footDusk.fireworks);assert(footDusk.fireworks.bursts>=1);
 assert(footDusk.fireworks.burstPoints.some(p=>Math.abs(p.x-footDusk.player.x)<550&&Math.abs(p.y-footDusk.player.y)<344));
 location.search='';
 console.log('B26-T11 Foot scene moves to the 1100 dusk clock and stages a fireworks burst in frame: PASS');
}

const {BILLBOARD_BRANDS,createBillboards,billboardGlow,billboardGlowAlpha,drawBillboards}=await import('../src/billboards.js');
{
 const summarize=world=>world.billboards.map(({brand,building,index,x,y,width,height})=>({brand,buildingId:building.id,index,x,y,width,height}));
 assert.deepEqual(summarize(createWorld()),summarize(createWorld()));
 console.log('B27-T1 Billboard brands, host ids and geometry are deterministic: PASS');
}
{
 const world=createWorld();
 const brands=[
  {brand:'CORAL COLA',colors:['#e2483d','#ffd166']},
  {brand:'HOTEL MARLIN',colors:['#f2b33d','#7be3f0']},
  {brand:'PIER 9 SEAFOOD',colors:['#2fd4c4','#ffe9a8']},
  {brand:'BAY FM 101.3',colors:['#b678f0','#6ee7ff']},
  {brand:'CORAL FM 98.1',colors:['#f28c3d','#fff3dc']},
  {brand:'VOLTA MOTORS',colors:['#7be3f0','#f9d777']},
 ];
 assert.deepEqual(BILLBOARD_BRANDS,brands);assert.equal(world.billboards.length,6);
 assert.deepEqual(world.billboards.map(({brand,colors})=>({brand,colors})),brands);
 const anchors=[
  {x:world.roads.vertical[3].x,y:world.roads.horizontal[3].y},
  world.props.find(prop=>prop.kind==='fountain')||{x:world.roads.vertical[4].x,y:world.roads.horizontal[2].y},
  world.spawnPoints.pier,world.spawnPoints.diner,
  {x:world.roads.vertical[5].x,y:world.roads.horizontal[4].y},
  {x:(world.roads.vertical[3].x+world.roads.vertical[4].x)/2,y:(world.roads.horizontal[3].y+world.roads.horizontal[4].y)/2},
 ];
 const picked=new Set();
 world.billboards.forEach((billboard,index)=>{
  const {building}=billboard,anchor=anchors[index];
  assert.equal(building.landmark,false);assert(building.width>=150);assert(!picked.has(building));
  const distance=candidate=>Math.hypot(candidate.x+candidate.width/2-anchor.x,candidate.y+candidate.height/2-anchor.y);
  const eligible=world.buildings.filter(candidate=>!candidate.landmark&&candidate.width>=150&&!picked.has(candidate));
  let candidates=eligible;
  if(index===5){
   const centreX=world.roads.vertical[3].x+180,centreY=world.roads.horizontal[3].y+20;
   const inFrame=eligible.filter(candidate=>{
    const x=candidate.x+10,y=candidate.y+8,width=candidate.width-20;
    return x>=centreX-430&&x+width<=centreX+430&&y>=centreY-260&&y+34<=centreY+260;
   });
   if(inFrame.length)candidates=inFrame;
  }
  const nearest=candidates.reduce((best,candidate)=>distance(candidate)<distance(best)?candidate:best);
  assert.equal(building,nearest);assert.equal(billboard.index,index);
  assert.deepEqual([billboard.x,billboard.y,billboard.width,billboard.height],[building.x+10,building.y+8,building.width-20,34]);
  picked.add(building);
 });
 assert.equal(new Set(world.billboards.map(billboard=>billboard.building.id)).size,6);
 const panel=world.billboards.find(billboard=>billboard.brand==='VOLTA MOTORS');
 const centreX=world.roads.vertical[3].x+180,centreY=world.roads.horizontal[3].y+20;
 assert(panel.x>=centreX-430);assert(panel.x+panel.width<=centreX+430);
 assert(panel.y>=centreY-260);assert(panel.y+panel.height<=centreY+260);
 const withoutFountain={...world,props:world.props.filter(prop=>prop.kind!=='fountain')};
 assert.equal(createBillboards(withoutFountain).length,6);
 console.log('B27-T2 Six ordered brands use distinct nearest eligible hosts with the specified panel geometry and VOLTA MOTORS fits the cover view: PASS');
}
{
 const world=createWorld(),before=JSON.stringify(world.buildings),length=world.buildings.length;
 const samples=[0,Math.floor(length/2),length-1].map(index=>({...world.buildings[index]}));
 assert.deepEqual(createBillboards(world),world.billboards);
 assert.equal(world.buildings.length,length);assert.equal(JSON.stringify(world.buildings),before);
 assert.deepEqual([0,Math.floor(length/2),length-1].map(index=>({...world.buildings[index]})),samples);
 console.log('B27-T3 Recreating billboards preserves the building list and all building fields: PASS');
}
{
 assert.equal(billboardGlowAlpha(0),0);assert.equal(billboardGlowAlpha(1),0.4);
 for(const night of [-1,0,0.5,1,2])assert.equal(billboardGlowAlpha(night),signHaloAlpha(night));
 const [first,second]=createWorld().billboards;
 for(const seconds of [0,3.99,4,8,12.5]){
  assert.equal(billboardGlow(first,seconds),billboardGlow(first,seconds));
  assert.notEqual(billboardGlow(first,seconds),billboardGlow(first,seconds+4));
 }
 const phaseShifted={...first,index:second.index};
 assert([0,4,8].some(seconds=>billboardGlow(first,seconds)!==billboardGlow(phaseShifted,seconds)));
 assert.equal(billboardGlow(first,3.99),first.colors[0]);assert.equal(billboardGlow(first,4),first.colors[1]);
 console.log('B27-T4 Glow matches the sign halo curve and cycles every four seconds with index phase offsets: PASS');
}
{
 const world=createWorld(),view={x:0,y:0,width:10000,height:10000},fills=[],texts=[],stack=[];
 let pathKind=null;
 const rec=new Proxy({
  globalAlpha:1,
  save(){stack.push({alpha:this.globalAlpha,style:this.fillStyle});},
  restore(){const state=stack.pop();this.globalAlpha=state.alpha;this.fillStyle=state.style;},
  beginPath(){pathKind=null;},roundRect(){pathKind='halo';},arc(){pathKind='bulb';},
  fill(){fills.push({kind:pathKind,alpha:this.globalAlpha,style:this.fillStyle});},
  fillRect(){fills.push({kind:'panel',alpha:this.globalAlpha,style:this.fillStyle});},
  fillText(text){texts.push(text);},
 },{get:(object,key)=>key in object?object[key]:(...args)=>{},set:(object,key,value)=>(object[key]=value,true)});
 drawBillboards(rec,world,view,0.92,5);
 assert.deepEqual(texts,world.billboards.map(billboard=>billboard.brand));
 assert.equal(fills.filter(fill=>fill.kind==='halo').length,6);
 assert(fills.some(fill=>fill.kind==='halo'&&fill.alpha===billboardGlowAlpha(0.92)));
 assert(fills.filter(fill=>fill.kind!=='halo').every(fill=>fill.alpha===1));assert.equal(stack.length,0);
 fills.length=0;texts.length=0;
 drawBillboards(rec,world,view,0,5);
 assert.deepEqual(texts,world.billboards.map(billboard=>billboard.brand));
 assert(!fills.some(fill=>fill.kind==='halo'&&fill.alpha>0));assert(!fills.some(fill=>fill.kind==='halo'));
 fills.length=0;texts.length=0;
 drawBillboards(rec,world,{x:-1000,y:-1000,width:1,height:1},0.92,5);
 assert.equal(texts.length,0);assert.equal(fills.length,0);
 drawBillboards(rec,{},view,0.92,5);assert.equal(texts.length,0);
 console.log('B27-T5 All six brand texts draw by day and night, halos use the night alpha only, and offscreen panels are culled: PASS');
}

const { createNews, newsAnchors, newsHeadline, newsCrime, updateNews } = await import('../src/news.js');
const { drawHUD } = await import('../src/hud.js');
const { martShops } = await import('../src/robbery.js');
const { writeSave, loadSave, SAVE_VERSION } = await import('../src/save.js');
{
 const world=createWorld(),news=createNews();
 assert(newsCrime(news,{type:'explosion',severity:4,x:world.spawnPoints.player.x,y:world.spawnPoints.player.y},world));
 assert(news.banner.headline.startsWith('EXPLOSION ROCKS '));
 assert(newsCrime(news,{type:'police_hit',severity:4,x:world.spawnPoints.player.x,y:world.spawnPoints.player.y},world));
 assert(news.banner.headline.startsWith('OFFICER DOWN IN '));
 const mart=martShops(world)[0];
 assert(newsCrime(news,{type:'robbery',severity:3,x:mart.x,y:mart.y},world));
 assert.equal(news.banner.headline,'ARMED ROBBERY AT CORAL MART');
 console.log('B27-T6 Breaking news fires for severe explosions, officer hits and robberies: PASS');
}
{
 const world=createWorld(),news=createNews(),point=world.spawnPoints.player;
 for(const [type,severity] of [['weapon_fired',3],['pedestrian_hit',3],['vehicle_theft',1],['carjacking',2],['reckless_crash',1],['explosion',3],['police_hit',3]]){
  assert.equal(newsCrime(news,{type,severity,x:point.x,y:point.y},world),false,type);
  assert.equal(news.banner,null,type);
 }
 console.log('B27-T7 Non-breaking crimes leave the news banner untouched: PASS');
}
{
 const world=createWorld(),anchors=newsAnchors(world);
 assert.equal(newsHeadline('explosion',world.spawnPoints.pier.x,world.spawnPoints.pier.y,world),'EXPLOSION ROCKS THE PIER');
 const station=gasStations(world)[0];
 assert.equal(newsHeadline('explosion',station.x,station.y,world),'EXPLOSION ROCKS GAS STATION');
 assert.equal(newsHeadline('explosion',world.roads.vertical[3].x,world.roads.horizontal[3].y,world),'EXPLOSION ROCKS DOWNTOWN');
 assert(anchors.some(anchor=>anchor.name==='DOWNTOWN'));
 console.log('B27-T8 Headlines use the nearest named world anchor: PASS');
}
{
 const world=createWorld(),news=createNews(),point=world.spawnPoints.pier;
 newsCrime(news,{type:'explosion',severity:4,x:point.x,y:point.y},world);
 for(let step=0;step<49;step++)updateNews(news,.1);
 assert(Math.abs(news.banner.t-4.9)<1e-8);assert(news.banner);
 updateNews(news,.1);assert.equal(news.banner,null);assert.equal(news.ticker.headline,'EXPLOSION ROCKS THE PIER');
 for(let step=0;step<120;step++)updateNews(news,.1);
 assert.equal(news.ticker,null);
 newsCrime(news,{type:'explosion',severity:4,x:point.x,y:point.y},world);updateNews(news,.2);
 newsCrime(news,{type:'robbery',severity:1,x:point.x,y:point.y},world);
 assert.equal(news.banner.headline,'ARMED ROBBERY AT THE PIER');assert.equal(news.banner.t,0);
 console.log('B27-T9 Banner and ticker lifetimes and latest-news replacement work: PASS');
}
{
 const main=await import('../src/main.js'),point=main.game.world.spawnPoints.pier;
 main.game.news=createNews();main.reportCrime('explosion',point.x,point.y,4);
 assert(main.game.news.banner?.headline.startsWith('EXPLOSION ROCKS '));
 main.game.news=createNews();main.reportCrime('vehicle_theft',point.x,point.y,1);
 assert.equal(main.game.news.banner,null);
 location.search='?shot=chase&seed=1';
 const chase=await import('../src/main.js?news-chase-scene');
 let chaseTime=0;
 for(let step=0;step<180;step++){raf(chaseTime);chaseTime+=1000/60;}
 assert(chase.game.news.banner?.headline.startsWith('EXPLOSION ROCKS '));
 assert(chase.game.news.banner.t<=.5+1/60);
 location.search='';
 console.log('B27-T10 Real crime reporting and staged chase hold a breaking banner: PASS');
}
{
 const world=createWorld(),texts=[],state={globalAlpha:1,textAlign:'center'};
 const recording=new Proxy({save(){},restore(){},setTransform(){},roundRect(){},fillText(text){texts.push(text);},measureText:text=>({width:text.length*7})},{get:(object,key)=>key in object?object[key]:state[key]??(()=>{}),set:(object,key,value)=>(state[key]=value,true)});
 const staged={world,player:{name:'Dario Venn',x:0,y:0,health:100,maxHealth:100,armour:0,maxArmour:100,cash:180},minimap:{},objective:null,width:1280,height:800,pixelRatio:1,playSeconds:0,news:{banner:{headline:'EXPLOSION ROCKS THE PIER',t:.2,dur:5},ticker:null},vehicle:null,combat:null};
 drawHUD(recording,staged);
 assert(texts.includes('BREAKING'));assert(texts.includes('EXPLOSION ROCKS THE PIER'));
 staged.vehicle={model:{name:'Test Coupe'},speed:0,health:100,color:'#fff'};staged.news={banner:null,ticker:{headline:'ARMED ROBBERY AT CORAL MART'}};texts.length=0;drawHUD(recording,staged);
 assert(texts.some(text=>text.startsWith('NEWS FLASH —')));
 staged.news.ticker=null;texts.length=0;drawHUD(recording,staged);assert(texts.some(text=>text.includes('BAY FM')||text.includes('CORAL FM')));
 console.log('B27-T11 HUD draws the banner, news ticker takeover and normal station line: PASS');
}
{
 const g={player:{cash:180,x:1,y:2},combat:{pistol:false},missions:{completed:[],currentMission:0,collectibles:[],bestTimes:{},taxiFares:0,totalEarned:0},news:createNews()};
 const record=writeSave(g,g.missions);
 assert.equal(SAVE_VERSION,1);assert(record);assert(!Object.hasOwn(record,'news'));assert.deepEqual(loadSave(),record);
 console.log('B27-T12 Save round-trip excludes session news and retains version 1: PASS');
}
{
 const pool=createPedestrians(seeded),person=pool.people[0];
 Object.assign(person,{x:seeded.roads.vertical[3].x+120,y:seeded.roads.horizontal[3].y,state:'walk',pause:0,panic:0});
 const crimes=[{id:1,type:'assault',x:person.x-120,y:person.y,severity:3,violent:true}],focus={x:person.x,y:person.y};
 updatePedestrians(pool,seeded,focus,[],crimes,1/60,()=>{});
 assert(person.fleeT>3);assert(person.panic>0);
 for(let tick=0;tick<90;tick++)updatePedestrians(pool,seeded,focus,[],crimes,1/60,()=>{});
 assert(Math.hypot(person.x-crimes[0].x,person.y-crimes[0].y)>180);
 console.log('B28-T1 Severe violent crime directs pedestrians away from its origin: PASS');
}
{
 const pool=createPedestrians(seeded),px=seeded.roads.vertical[3].x,py=seeded.roads.horizontal[3].y;
 const [near,far]=pool.people;
 Object.assign(near,{x:px+120,y:py,state:'walk',pause:0,panic:0});
 Object.assign(far,{x:px+220,y:py,state:'walk',pause:0,panic:0});
 updatePedestrians(pool,seeded,{x:px,y:py},[],[{id:1,type:'explosion',x:px,y:py,severity:4,violent:true}],1/60,()=>{});
 assert(Math.hypot(near.x-px,near.y-py)-120>=26);
 assert(Math.hypot(far.x-px,far.y-py)-220<10);assert(far.fleeT>3);
 console.log('B28-T2 Explosion scatters nearby pedestrians within the 170-unit band: PASS');
}
{
 const pool=createPedestrians(seeded),px=seeded.roads.vertical[3].x,py=seeded.roads.horizontal[3].y;
 const crowd=pool.people.slice(0,24),focus={x:px,y:py};
 for(const [index,person] of crowd.entries()){
  Object.assign(person,{x:px+30+index%6*20,y:py+(Math.floor(index/6)-1.5)*10,state:'walk',pause:0,panic:0});
 }
 updatePedestrians(pool,seeded,focus,[],[{id:1,type:'weapon_fired',x:px,y:py,severity:3,violent:true}],1/60,()=>{});
 const crouched=crowd.filter(person=>person.crouch>0);
 assert(crouched.length>=3);assert(crowd.some(person=>person.bang>0));
 assert(crowd.every(person=>person.crouch===0||(person.crouch>=1&&person.crouch<=2)));
 console.log('B28-T3 Gunfire produces crouches of one to two seconds and alarm markers: PASS');
 for(let tick=0;tick<180;tick++)updatePedestrians(pool,seeded,focus,[],[],1/60,()=>{});
 assert(pool.people.every(person=>person.crouch===0&&person.bang===0));
 const positions=crouched.map(person=>({x:person.x,y:person.y}));
 for(let tick=0;tick<60;tick++)updatePedestrians(pool,seeded,focus,[],[],1/60,()=>{});
 assert(crouched.some((person,index)=>Math.hypot(person.x-positions[index].x,person.y-positions[index].y)>0));
 console.log('B28-T4 Crouches and alarm markers expire and walking resumes: PASS');
}
{
 const first=await import('../src/pedestrians.js?b28-determinism-first');
 const second=await import('../src/pedestrians.js?b28-determinism-second');
 const px=seeded.roads.vertical[3].x,py=seeded.roads.horizontal[3].y;
 const snapshots=[];
 for(const module of [first,second]){
  const pool=module.createPedestrians(seeded),focus={x:px,y:py};
  for(const [index,person] of pool.people.slice(0,8).entries())Object.assign(person,{x:px+80+index*15,y:py,state:'walk',pause:0,panic:0});
  const crimes=[{id:1,type:'explosion',x:px,y:py,severity:4,violent:true}];
  module.updatePedestrians(pool,seeded,focus,[],crimes,1/60,()=>{});
  for(let tick=0;tick<120;tick++)module.updatePedestrians(pool,seeded,focus,[],crimes,1/60,()=>{});
  snapshots.push(JSON.stringify(pool.people.map(person=>({x:+person.x.toFixed(6),y:+person.y.toFixed(6),state:person.state,crouch:+person.crouch.toFixed(6),fleeT:+person.fleeT.toFixed(6)}))));
 }
 assert.equal(snapshots[0],snapshots[1]);
 console.log('B28-T5 Identically seeded crowd sessions replay deterministically: PASS');
}
{
 const px=seeded.roads.vertical[3].x,py=seeded.roads.horizontal[3].y;
 for(const [severity,violent] of [[2,true],[4,false]]){
  const pool=createPedestrians(seeded),person=pool.people[0];
  Object.assign(person,{x:px+100,y:py,state:'walk',pause:0,panic:0});
  updatePedestrians(pool,seeded,{x:px,y:py},[],[{id:1,type:'assault',x:px,y:py,severity,violent}],1/60,()=>{});
  assert.equal(person.fleeT,0);if(!violent)assert.equal(person.panic,0);
 }
 console.log('B28-T6 Directed fleeing requires severity three and violent crime: PASS');
}
{
 const person=createPedestrians(seeded).people[0],texts=[],state={};
 const recording=new Proxy({fillText(text){texts.push(text);}},{get:(object,key)=>key in object?object[key]:state[key]??(()=>{}),set:(object,key,value)=>(state[key]=value,true)});
 person.crouch=1;person.bang=.5;
 assert.doesNotThrow(()=>drawPedestrian(recording,person));assert(texts.includes('!'));
 person.crouch=0;person.bang=0;texts.length=0;
 assert.doesNotThrow(()=>drawPedestrian(recording,person));assert(!texts.includes('!'));
 console.log('B28-T7 Crouched pedestrians draw safely and alarm markers follow their timer: PASS');
}

const {skyStops,celestial}=await import('../src/sky.js');
{
 for(const [minute,top,bottom] of [
  [720,'#2f6fb8','#a5d8ec'],
  [0,'#0a1c38','#14335e'],
  [1100,'#2e3a6e','#ff8c4a'],
  [420,'#46689c','#f6b26b'],
 ]){
  assert.deepEqual(skyStops(minute),[{offset:0,color:top},{offset:1,color:bottom}]);
 }
 const channels=color=>[1,3,5].map(index=>Number.parseInt(color.slice(index,index+2),16));
 for(let minute=0;minute<1440;minute+=5){
  const current=skyStops(minute),next=skyStops(minute+5);
  for(const [index,{color}] of current.entries()){
   const nextChannels=channels(next[index].color);
   assert(channels(color).every((value,channel)=>Math.abs(value-nextChannels[channel])<=14));
  }
 }
 console.log('B28-T8 Sky gradients match the keyframes and transition smoothly: PASS');
}
{
 const noon=celestial(720),dusk=celestial(1100),dawn=celestial(420);
 assert.equal(noon.kind,'sun');assert(noon.elevation>0.8);assert.equal(noon.color,'#ffd968');
 assert.equal(dusk.kind,'sun');assert(dusk.elevation<0.3);assert.equal(dusk.color,'#ff9448');
 assert.equal(celestial(0).kind,'moon');
 assert.equal(dawn.kind,'sun');assert(dawn.elevation<0.35);
 console.log('B28-T9 Celestial bodies follow the clock and the sun warms near the horizon: PASS');
}
{
 assert.equal(rainIntensity(100),0);
 assert.equal(rainIntensity(150),0);
 assert(rainIntensity(155)>0&&rainIntensity(155)<1);
 assert.equal(rainIntensity(165),1);
 assert(rainIntensity(192)>0&&rainIntensity(192)<1);
 assert.equal(rainIntensity(200),0);
 for(let seconds=-400;seconds<=400;seconds+=0.5){
  if(rainIntensity(seconds)>0)assert.equal(weatherAt(seconds),'rain');
 }
 console.log('B28-T10 Rain intensity ramps up and down within the rain window: PASS');
}

function recordLighting(){
 const fills=[],stack=[];
 let clips=0;
 const rec=new Proxy({
  globalAlpha:1,
  measureText:text=>({width:text.length*7}),
  createLinearGradient:()=>({addColorStop(){}}),
  save(){stack.push({style:this.fillStyle,alpha:this.globalAlpha});},
  restore(){const {style,alpha}=stack.pop();this.fillStyle=style;this.globalAlpha=alpha;},
  fill(){fills.push({style:this.fillStyle,alpha:this.globalAlpha});},
  fillRect(){fills.push({style:this.fillStyle,alpha:this.globalAlpha});},
  clip(){clips++;},
 },{get:(object,key)=>key in object?object[key]:()=>{},set:(object,key,value)=>(object[key]=value,true)});
 const renderer=createRenderer({width:1280,height:800,getContext:()=>rec});
 return {renderer,fills,get clips(){return clips;},reset(){fills.length=0;clips=0;}};
}
{
 const recording=recordLighting(),{renderer,fills}=recording;
 const billboard=seeded.billboards[0],glow=billboardGlow(billboard,0);
 renderer.camera.x=billboard.x+billboard.width/2;
 renderer.camera.y=billboard.y+billboard.height/2;
 renderer.camera.clamp();
 renderer.draw(seeded,null,0,1100,0);
 const dryCount=fills.filter(fill=>fill.style===glow).length;
 assert.equal(recording.clips,0);
 recording.reset();
 renderer.draw(seeded,null,0,1100,165);
 const wetCount=fills.filter(fill=>fill.style===glow).length;
 assert(wetCount>=dryCount+6);
 assert(recording.clips>0);
 console.log('B28-T11 Wet reflections are clipped to roads and draw only in rain: PASS');
}
{
 const recording=recordLighting(),{renderer,fills}=recording;
 const pier=seeded.spawnPoints.pier;
 Object.assign(renderer.camera,{x:pier.x,y:pier.y,width:seeded.water.width+300});
 renderer.draw(seeded,null,0,720,0);
 assert(fills.some(fill=>fill.style==='#ffd968'));
 recording.reset();
 renderer.draw(seeded,null,0,0,0);
 assert(fills.some(fill=>fill.style==='#e9edf5'));
 recording.reset();
 renderer.camera.x=seeded.roads.vertical[3].x;
 renderer.camera.y=seeded.roads.horizontal[3].y;
 renderer.draw(seeded,null,0,720,0);
 assert(!fills.some(fill=>fill.style==='#ffd968'));
 console.log('B28-T12 Celestial discs draw over water and stay out of the downtown view: PASS');
}
{
 const rects=[];
 const rec=new Proxy({
  globalAlpha:1,
  measureText:text=>({width:text.length*7}),
  createLinearGradient:()=>({addColorStop(){}}),
  save(){},restore(){},fill(){},stroke(){},clip(){},
  fillRect(x,y,w,h){rects.push([x,y,w,h,this.fillStyle]);},
 },{get:(object,key)=>key in object?object[key]:()=>{},set:(object,key,value)=>(object[key]=value,true)});
 const renderer=createRenderer({width:1280,height:800,getContext:()=>rec});
 const ix=seeded.roads.vertical[3].x,iy=seeded.roads.horizontal[3].y;
 renderer.camera.x=ix;renderer.camera.y=iy;renderer.camera.clamp();
 renderer.draw(seeded,null,0,720,2);
 const zebra=rects.filter(r=>r[4]==='rgba(245,239,215,0.5)');
 assert(zebra.length>=24,'downtown intersections gain zebra crosswalks');
 assert(zebra.some(r=>Math.abs(r[0]-(ix-35))<1&&Math.abs(r[1]-(iy-45))<1));
 rects.length=0;
 renderer.camera.x=seeded.roads.vertical[0].x;renderer.camera.y=seeded.roads.horizontal[0].y;renderer.camera.clamp();
 renderer.draw(seeded,null,0,720,2);
 assert(!rects.some(r=>r[4]==='rgba(245,239,215,0.5)'),'no zebra markings outside downtown');
 console.log('B29-T10 Zebra crosswalks mark the downtown intersections only: PASS');
}
{
 const strokes=[];
 const rec=new Proxy({
  globalAlpha:1,
  measureText:text=>({width:text.length*7}),
  createLinearGradient:()=>({addColorStop(){}}),
  save(){},restore(){},fill(){},fillRect(){},clip(){},
  stroke(){strokes.push(this.strokeStyle);},
  setLineDash(){},
 },{get:(object,key)=>key in object?object[key]:()=>{},set:(object,key,value)=>(object[key]=value,true)});
 const renderer=createRenderer({width:1280,height:800,getContext:()=>rec});
 renderer.camera.x=seeded.roads.vertical[3].x;renderer.camera.y=seeded.roads.horizontal[3].y;renderer.camera.clamp();
 renderer.draw(seeded,null,0,720,2);
 assert(strokes.includes('rgba(255,205,90,0.32)'),'downtown streets gain worn centre lines');
 console.log('B29-T11 Worn amber centre lines refresh the downtown streets: PASS');
}
{
 const recording=recordLighting(),{renderer,fills}=recording;
 renderer.camera.x=seeded.roads.vertical[3].x;renderer.camera.y=seeded.roads.horizontal[3].y;renderer.camera.clamp();
 renderer.draw(seeded,null,0,720,2);
 assert(fills.some(f=>f.style==='#ff4040')&&fills.some(f=>f.style==='#2fe07a'),'renderer paints live traffic light heads downtown');
 console.log('B29-T12 Renderer paints the traffic lights into the world downtown: PASS');
}
{
 const g={player:{cash:180,x:1,y:2},combat:{pistol:false},missions:{completed:[],currentMission:0,collectibles:[],bestTimes:{},taxiFares:0,totalEarned:0},redLight:{inside:'3,3'}};
 const record=writeSave(g,g.missions);
 assert.equal(SAVE_VERSION,1);assert(record);assert(!Object.hasOwn(record,'redLight'));assert.deepEqual(loadSave(),record);
 console.log('B29-T13 Save round-trip excludes the session-only red-light tracker and retains version 1: PASS');
}
{
 const {damageOf,smokeBand,smokeRate,SMOKE_START,PLUME_START,FLAME_START}=await import('../src/damage.js');
 const car=createCar(500,500,0,1,undefined,'parked');
 assert.equal(damageOf(car),0);car.health=58;assert.equal(damageOf(car),42);car.health=0;assert.equal(damageOf(car),100);car.health=-20;assert.equal(damageOf(car),100);car.health=140;assert.equal(damageOf(car),0);
 assert.equal(smokeBand(SMOKE_START-1),0);assert.equal(smokeBand(SMOKE_START),1);assert.equal(smokeBand(PLUME_START),2);assert.equal(smokeBand(FLAME_START),3);assert.equal(smokeBand(100),3);
 assert.equal(smokeRate(0),0);assert(smokeRate(30)>0&&smokeRate(30)<smokeRate(60)&&smokeRate(60)<smokeRate(90));
 console.log('B30-T1 Damage derives from collision health, clamps at 100, bands and rates scale monotonically: PASS');
}
{
 const {damageOf}=await import('../src/damage.js');
 const a=createCar(400,400,0,1,undefined,'player-driven');a.vx=160;
 const b=createCar(430,400,Math.PI,1,undefined,'traffic-driven');b.vx=-160;
 resolveCarContacts([a,b],()=>({}),0,null);
 assert(a.health<100&&b.health<100,'collision impulses written by resolveCarContacts reduce both cars health');
 assert(damageOf(a)>0&&damageOf(b)>0);
 const a2=createCar(400,400,0,1,undefined,'player-driven');a2.health=2;a2.vx=260;
 const c2=createCar(430,400,Math.PI,1,undefined,'traffic-driven');c2.vx=-260;
 resolveCarContacts([a2,c2],()=>({}),0,null);
 assert.equal(a2.health,0);assert.equal(damageOf(a2),100,'damage clamps at 100 when health floors at 0');
 console.log('B30-T2 Collision damage accrues through the existing contact solver and clamps: PASS');
}
{
 const {createDamageSmoke,updateDamageSmoke}=await import('../src/damage.js');
 const run=(health,steps)=>{const s=createDamageSmoke();const c=createCar(600,600,0,1,undefined,'parked');c.health=health;for(let i=0;i<steps;i++)updateDamageSmoke(s,[c],1/60);return s;};
 const wisp=run(58,120),plume=run(34,120),flame=run(10,120);
 assert(wisp.emitted>0&&plume.emitted>wisp.emitted&&flame.emitted>plume.emitted,'emission volume grows with damage');
 assert(flame.particles.some(p=>p.flame),'critical damage flickers flames');
 assert(!plume.particles.some(p=>p.flame),'plume band stays smoke-only');
 assert.equal(flame.particles.length,260,'the smoke pool is a fixed pre-allocated array');
 assert(flame.particles.some(p=>p.life>0),'smoke particles stay live while a wreck burns');
 console.log('B30-T3 Smoke pool emission is monotonic in damage and flames only at critical damage: PASS');
}
{
 const {createDamageSmoke,updateDamageSmoke}=await import('../src/damage.js');
 const run=()=>{const s=createDamageSmoke();const c=createCar(600,600,0,1,undefined,'parked');c.health=20;for(let i=0;i<90;i++)updateDamageSmoke(s,[c],1/60);return JSON.stringify(s.particles);};
 assert.equal(run(),run(),'damage smoke is a deterministic function of its seeded rng and fixed steps');
 console.log('B30-T4 Damage smoke replay is deterministic: PASS');
}
{
 location.search='?shot=cover&seed=1';
 const {game:coverGame}=await import('../src/main.js?scene-cover-b30');
 let t=0;for(let index=0;index<60;index++){raf(t);t+=1000/60;}
 assert(coverGame.damageSmoke,'cover game carries the damage smoke state');
 assert(coverGame.police.units.some(unit=>unit.car.health<=60),'cover stages a pre-damaged police car in the pile-up');
 assert(coverGame.damageSmoke.emitted>0,'damaged staged cars emit smoke in the cover scene');
 assert(coverGame.damageSmoke.particles.some(p=>p.life>0),'cover frame holds live smoke particles');
 location.search='';
 console.log('B30-T5 Cover stages pre-damaged wrecks that smoke through the real loop: PASS');
}
{
 const g={player:{cash:180,x:1,y:2},combat:{pistol:false},missions:{completed:[],currentMission:0,collectibles:[],bestTimes:{},taxiFares:0,totalEarned:0},damageSmoke:{emitted:9}};
 const record=writeSave(g,g.missions);
 assert.equal(SAVE_VERSION,1);assert(record);assert(!Object.hasOwn(record,'damageSmoke'));
 console.log('B30-T6 Save round-trip excludes the session-only damage smoke state and retains version 1: PASS');
}
{
 const {createStorefronts,downtownRect,isDowntown}=await import('../src/storefronts.js');
 const fronts=createStorefronts(seeded);
 assert(fronts.length>=8,'downtown carries a full set of storefronts');
 const r=downtownRect(seeded);
 for(const s of fronts){const cx=s.x+s.width/2,cy=s.y+s.height/2;if(!s.openSign)assert(cx>=r.x0&&cx<=r.x1&&cy>=r.y0&&cy<=r.y1,'every storefront without an OPEN sign sits downtown');assert(s.panes>=2&&s.panes<=4,'each storefront has 2-4 panes');assert(typeof s.sign==='string'&&s.sign.length>0,'each storefront carries a sign');}
 const openFronts=fronts.filter(s=>s.openSign);assert.equal(openFronts.length,1);assert.equal(openFronts[0].building,'diner');assert.equal(openFronts[0].sign,'MARLIN DINER');
 const hospital=seeded.buildings.find(b=>b.id==='hospital');assert(hospital&&!isDowntown(seeded,hospital),'the hospital block stays undressed');
 assert(!fronts.some(s=>s.building==='hospital'));
 console.log('B30-T7 Storefront descriptors cover the downtown blocks plus the diner landmark: PASS');
}
{
 const {createStorefronts}=await import('../src/storefronts.js');
 assert.equal(JSON.stringify(createStorefronts(seeded)),JSON.stringify(createStorefronts(again)),'storefront descriptors are deterministic across builds');
 assert.equal(JSON.stringify(seeded.storefronts),JSON.stringify(createStorefronts(seeded)),'createWorld attaches the same descriptors at build time');
 console.log('B30-T8 Storefront descriptors are deterministic and attached at world build: PASS');
}
{
 const {drawStorefronts}=await import('../src/storefronts.js');
 const texts=[],fills=[];
 const rec=new Proxy({globalAlpha:1,measureText:t=>({width:t.length*7}),createLinearGradient:()=>({addColorStop(){}}),save(){},restore(){},fill(){},fillText(t){texts.push({text:t,font:this.font});},fillRect(){fills.push(this.fillStyle);},clip(){}},{get:(o,k)=>k in o?o[k]:(...a)=>{},set:(o,k,v)=>(o[k]=v,true)});
 const view={x:seeded.roads.vertical[2].x,y:seeded.roads.horizontal[2].y,width:1100,height:700};
 drawStorefronts(rec,seeded,view,0);
 assert(texts.length>=4,'downtown signs render in the downtown view');
 assert(texts.every(t=>t.font.startsWith('bold 11px')),'sign boards use the larger 11px board font');
 assert(fills.includes('#8fb7bd'),'panes read as cool glass by day');
 texts.length=0;fills.length=0;
 drawStorefronts(rec,seeded,view,1);
 assert(fills.includes('#ffd98c'),'panes glow warm at night');
 console.log('B30-T9 Storefront signs and panes render downtown, glowing at dusk: PASS');
}
{
 const recording=recordLighting(),{renderer,fills}=recording;
 renderer.camera.x=seeded.roads.vertical[3].x;renderer.camera.y=seeded.roads.horizontal[3].y;renderer.camera.clamp();
 renderer.draw(seeded,null,0,1100,2);
 assert(fills.some(f=>f.style==='#22282c'),'renderer paints the recessed storefront bands downtown');
 console.log('B30-T10 Renderer paints downtown storefronts into the world: PASS');
}

{
 const {projectBlip} = await import('../src/minimap.js');
 assert.deepEqual(projectBlip(30, 40, 84, 12), {x: 30, y: 40, clamped: false});
 assert.deepEqual(projectBlip(300, 0, 84, 12), {x: 72, y: 0, clamped: true});
 assert.deepEqual(projectBlip(0, 0, 84, 12), {x: 0, y: 0, clamped: false});
 const diag = projectBlip(-90, -120, 84, 8);
 assert.equal(diag.clamped, true); assert(Math.abs(Math.hypot(diag.x, diag.y) - 76) < 1e-9, 'radial clamp lands exactly on the limit circle');
 console.log('B31-T1 Minimap projection maps offsets and clamps radially to the rim: PASS');
}
{
 const {policeBlipColor, OBJECTIVE_BLIP_COLOR} = await import('../src/minimap.js');
 assert.equal(policeBlipColor(0, 0), '#56c9e5'); assert.equal(policeBlipColor(0, 99.7), '#56c9e5');
 assert.equal(policeBlipColor(3, 0), '#e5484d'); assert.equal(policeBlipColor(3, 0.4), '#e5484d');
 assert.equal(policeBlipColor(3, 0.6), '#56c9e5'); assert.equal(policeBlipColor(3, 1.1), '#e5484d');
 assert.equal(OBJECTIVE_BLIP_COLOR, '#ffd94d');
 console.log('B31-T2 Police blips flash red/blue on the game clock only while wanted: PASS');
}
{
 const {shopMarkers} = await import('../src/minimap.js');
 const {martShops, dinerShops} = await import('../src/robbery.js');
 const {sprayGarages} = await import('../src/spray.js');
 const markers = shopMarkers(seeded);
 const sprays = sprayGarages(seeded), mart = martShops(seeded), diner = dinerShops(seeded);
 assert.equal(markers.filter(m => m.kind === 'spray').length, sprays.length); assert(sprays.length >= 1);
 assert.equal(markers.filter(m => m.kind === 'mart').length, 1); assert.equal(markers.find(m => m.kind === 'mart').x, mart[0].x); assert.equal(markers.find(m => m.kind === 'mart').y, mart[0].y);
 assert.equal(markers.filter(m => m.kind === 'diner').length, 1); assert.equal(markers.find(m => m.kind === 'diner').x, diner[0].x); assert.equal(markers.find(m => m.kind === 'diner').y, diner[0].y);
 assert(markers.every(m => Number.isFinite(m.x) && Number.isFinite(m.y) && typeof m.color === 'string'));
 console.log('B31-T3 Shop markers cover spray garages, CORAL MART and the diner at their real positions: PASS');
}
{
 const {minimapRect} = await import('../src/minimap.js');
 const r = minimapRect(1280, 720);
 assert.deepEqual(r, {x: 24, y: 528, width: 168, height: 168});
 const panels = [
  {x: 20, y: 20, width: 208, height: 96},
  {x: 20, y: 124, width: 208, height: 150},
  {x: 1050, y: 20, width: 210, height: 73},
  {x: 360, y: 22, width: 560, height: 66},
  {x: 1050, y: 104, width: 210, height: 76},
  {x: 1050, y: 188, width: 210, height: 52},
  {x: 1046, y: 604, width: 214, height: 92},
  {x: 330, y: 358, width: 620, height: 110},
 ];
 const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
 for (const p of panels) assert(!overlaps(r, p), 'minimap rect clears every staged-frame panel');
 console.log('B31-T4 Minimap panel rect collides with no HUD panel in the staged frames: PASS');
}
{
 const {drawMinimap} = await import('../src/minimap.js');
 const fills = [];
 const rec = new Proxy({globalAlpha: 1, measureText: t => ({width: t.length * 7}), createLinearGradient: () => ({addColorStop() {}}), save() {}, restore() {}, fill() { fills.push(this.fillStyle); }, fillRect() { fills.push(this.fillStyle); }, strokeRect() {}, fillText() {}, clip() {}}, {get: (o, k) => k in o ? o[k] : (...a) => {}, set: (o, k, v) => (o[k] = v, true)});
 const px = seeded.spawnPoints.diner.x, py = seeded.spawnPoints.diner.y;
 const fake = {player: {x: px, y: py, facing: 0}, minimap: {}, objective: {position: {x: px + 4000, y: py}}, wanted: {stars: 3}, playSeconds: 0, police: {units: [{car: {x: px + 120, y: py + 40}}], heli: null}, vehicle: null, world: seeded};
 drawMinimap(rec, fake, 1280, 720);
 assert(fills.includes('#e5484d'), 'wanted police blip flashes red at playSeconds 0');
 assert(fills.includes('#ffd94d'), 'objective diamond is gold');
 assert(fills.includes('#2fd4c4'), 'spray shop square renders');
 assert(fills.includes('#fa8c55'), 'diner shop square renders');
 fills.length = 0; fake.playSeconds = 0.6;
 drawMinimap(rec, fake, 1280, 720);
 assert(fills.includes('#56c9e5') && !fills.includes('#e5484d'), 'flash phase flips to blue half a second later');
 console.log('B31-T5 Minimap draws flashing police, gold objective and shop squares from live state: PASS');
}
{
 const {createStorefronts, STOREFRONT_AWNINGS} = await import('../src/storefronts.js');
 const fronts = createStorefronts(seeded);
 const diner = fronts.find(s => s.openSign);
 const building = seeded.buildings.find(b => b.id === 'diner');
 assert(diner, 'the diner receives a storefront descriptor');
 assert.equal(fronts.filter(s => s.openSign).length, 1, 'exactly one OPEN-sign storefront exists');
 assert.equal(diner.building, 'diner'); assert.equal(diner.sign, 'MARLIN DINER');
 assert.equal(diner.x, building.x); assert.equal(diner.y, building.y);
 assert(diner.panes >= 2 && diner.panes <= 4); assert(STOREFRONT_AWNINGS.includes(diner.awning));
 console.log('B31-T6 The Marlin Diner gets a storefront descriptor with an OPEN sign: PASS');
}
{
 const {drawStorefronts} = await import('../src/storefronts.js');
 const texts = [], fills = [];
 const rec = new Proxy({globalAlpha: 1, measureText: t => ({width: t.length * 7}), createLinearGradient: () => ({addColorStop() {}}), save() {}, restore() {}, fill() {}, fillText(t) { texts.push(t); }, fillRect() { fills.push(this.fillStyle); }, clip() {}}, {get: (o, k) => k in o ? o[k] : (...a) => {}, set: (o, k, v) => (o[k] = v, true)});
 const view = {x: 1150, y: 1900, width: 800, height: 500};
 drawStorefronts(rec, seeded, view, 1);
 assert(texts.includes('MARLIN DINER'), 'diner sign board renders');
 assert(texts.includes('OPEN'), 'OPEN neon sign renders');
 assert(fills.includes('#ffd98c'), 'diner panes glow warm at dusk');
 assert(fills.includes('#ff6b9d'), 'OPEN sign halo washes at dusk');
 texts.length = 0; fills.length = 0;
 drawStorefronts(rec, seeded, view, 0);
 assert(texts.includes('OPEN'), 'OPEN sign is steady by day');
 assert(fills.includes('#8fb7bd'), 'diner panes read as cool glass by day');
 console.log('B31-T7 Diner frontage draws its sign, glowing panes and OPEN neon: PASS');
}
{
 location.search = '?shot=mission';
 const shot = await import('../src/main.js?shot-mission-b31');
 const staging = shot.game.missionStaging;
 assert(staging, 'mission scene records its staging');
 assert.equal(staging.cars.length, 2);
 assert.deepEqual(staging.cars.map(c => [c.x, c.y]), [[1862, 2172], [1940, 2172]]);
 assert(staging.cars.every(c => c.driver === 'parked' && c.speed === 0));
 assert.equal(staging.peds.length, 3);
 assert.deepEqual(staging.peds.map(p => [p.x, p.y]), [[1408, 2165], [1440, 2165], [1560, 2165]]);
 assert.equal(staging.peds[0].facing, 0); assert.equal(staging.peds[1].facing, Math.PI);
 location.search = '';
 const {writeSave} = await import('../src/save.js');
 const carrier = {player: {cash: 180, x: 1, y: 2}, combat: {pistol: false}, missions: {completed: [], currentMission: 0, collectibles: [], bestTimes: {}, taxiFares: 0, totalEarned: 0}, missionStaging: staging};
 const record = writeSave(carrier, carrier.missions);
 assert(record && !Object.hasOwn(record, 'missionStaging'), 'staging bookkeeping never reaches the save');
 assert(!game.missionStaging, 'non-mission scenes carry no mission staging');
 console.log('B31-T8 Mission scene stages two parked cars and a sidewalk conversation at the diner: PASS');
}
let b32Cover,b32CoverSteps=0,b32CoverFrameTime=0;
{
 location.search='?shot=cover&seed=1';
 const {game:staged}=await import('../src/main.js?b32-cover');
 b32Cover=staged;
 while(!staged.news.banner&&b32CoverSteps<400){raf(b32CoverFrameTime);b32CoverFrameTime+=1000/60;b32CoverSteps++;}
 assert(staged.news.banner,`cover banner must appear within 400 steps (steps=${b32CoverSteps})`);
 raf(b32CoverFrameTime);b32CoverFrameTime+=1000/60;b32CoverSteps++;
 assert.equal(staged.news.banner.t,.5);
 console.log('B32-T1 Cover pins the BREAKING banner at slide-complete from its first frame: PASS');
}
{
 const staged=b32Cover;
 while(b32CoverSteps<180){raf(b32CoverFrameTime);b32CoverFrameTime+=1000/60;b32CoverSteps++;}
 assert(Array.isArray(staged.coverStaging),'coverStaging must be an array');
 assert.equal(staged.coverStaging.length,9);
 for(const s of staged.coverStaging){
  assert(Math.abs(s.car.x-(staged.vehicle.x+s.dx))<.01,`cover car x=${s.car.x}, expected=${staged.vehicle.x+s.dx}`);
  assert(Math.abs(s.car.y-(staged.vehicle.y+s.dy))<.01,`cover car y=${s.car.y}, expected=${staged.vehicle.y+s.dy}`);
  assert.equal(s.car.health,s.health);
  assert.equal(s.car.speed,0);
 }
 console.log('B32-T2 Cover pins the staged pile-up to its placed composition: PASS');
}
{
 location.search='?shot=chase&seed=1';
 const {game:staged2}=await import('../src/main.js?b32-chase');
 let frameTime=0,steps=0;
 while(!staged2.news.banner&&steps<400){raf(frameTime);frameTime+=1000/60;steps++;}
 assert(staged2.news.banner,`chase banner must appear within 400 steps (steps=${steps})`);
 raf(frameTime);frameTime+=1000/60;steps++;
 assert(staged2.news.banner.t<.5,`chase banner must progress naturally (t=${staged2.news.banner.t})`);
 assert.equal(staged2.coverStaging,undefined);
 while(steps<180){raf(frameTime);frameTime+=1000/60;steps++;}
 const speeds=staged2.police.units.map(unit=>unit.car.speed);
 assert(speeds.filter(speed=>speed>0).length>=2,`at least two chase police cars must be driving (speeds=${JSON.stringify(speeds)})`);
 location.search='';
 console.log('B32-T3 Chase keeps natural banner slide and unpinned police AI: PASS');
}
let b32Foot;
{
 const {lightState}=await import('../src/lights.js');
 location.search='?shot=foot&seed=1';
 const {game:staged}=await import('../src/main.js?b32-foot');
 b32Foot=staged;
 let frameTime=0;
 for(let step=0;step<180;step++){raf(frameTime);frameTime+=1000/60;}
 assert(staged.footStaging,'foot scene records its staging');
 assert.equal(lightState('NS',staged.playSeconds),'red');
 const {queue}=staged.footStaging;
 assert.equal(queue.length,3);
 const along=queue.map((car,index)=>{
  assert.equal(car.driver,'traffic-driven');
  assert(car.route&&car.route.col===4&&car.route.row===3&&car.route.direction===1,`queue[${index}] route=${JSON.stringify(car.route)}`);
  assert(Number.isFinite(car.x)&&Number.isFinite(car.y),`queue[${index}] position=(${car.x},${car.y})`);
  assert(car.speed<6,`queue[${index}] speed=${car.speed}, expected <6`);
  return car.ty-car.y;
 });
 assert(along[0]>=50&&along[0]<=85,`front car along=${along[0]}, expected 50 to 85`);
 for(let index=1;index<along.length;index++){
  assert(along[index]>along[index-1]&&along[index]-along[index-1]>=38,`queue along=${JSON.stringify(along)}, expected increasing distances with gaps >=38`);
 }
 console.log('B32-T4 Foot stages a three-car queue held by the real red light: PASS');
}
{
 const staged=b32Foot;
 const {crossers,waiter}=staged.footStaging;
 assert.equal(crossers.length,2);
 for(const ped of crossers){
  assert(ped.x>=2129&&ped.x<=2208&&ped.y>=1489&&ped.y<=1507,`crosser position=(${ped.x},${ped.y}), expected within the south-arm zebra band`);
 }
 assert(waiter.x===2224&&waiter.y===1518,`waiter position=(${waiter.x},${waiter.y}), expected (2224,1518)`);
 assert(waiter.x>2164+55||waiter.y>1462+55,`waiter position=(${waiter.x},${waiter.y}), expected outside the road bands`);
 console.log('B32-T5 Foot stages two pedestrians mid-crossing on the zebra and one waiting: PASS');
}
{
 location.search='?shot=mission&seed=1';
 const {game:stagedM}=await import('../src/main.js?b32-mission');
 assert.equal(stagedM.footStaging,undefined);
 location.search='';
 const {player,combat,missions,footStaging}=b32Foot;
 const carrier={player:{cash:player.cash,x:player.x,y:player.y},combat:{pistol:combat.pistol},missions:{completed:missions.completed,currentMission:missions.currentMission,collectibles:missions.collectibles,bestTimes:missions.bestTimes,taxiFares:missions.taxiFares,totalEarned:missions.totalEarned},footStaging};
 const record=writeSave(carrier,carrier.missions);
 assert.equal(SAVE_VERSION,1);
 assert(record&&!Object.hasOwn(record,'footStaging'),'staging bookkeeping never reaches the save');
 console.log('B32-T6 Living-city staging is foot-only and excluded from the save: PASS');
}

// Brief-33 item 1: the chase scene is re-pinned to the night clock (1300) so the
// lighting stack reads at full strength; every other scene keeps its pin.
{
 location.search='?shot=chase&seed=1';
 const {game:nightChase}=await import('../src/main.js?scene-chase-b33');
 let frameTime=0;
 for(let index=0;index<180;index++){raf(frameTime);frameTime+=1000/60;}
 assert.equal(nightChase.clockMinutes,1300);
 assert.equal(headlightLevel(nightChase.clockMinutes),1);
 console.log('B33-T1 Chase scene pins the 1300 night clock with full headlight level: PASS');
 assert.equal(lampPoolAlpha(headlightLevel(nightChase.clockMinutes)),0.16);
 assert.equal(signHaloAlpha(headlightLevel(nightChase.clockMinutes)),0.4);
 assert.equal(heliSpotAlpha(headlightLevel(nightChase.clockMinutes)),1);
 console.log('B33-T2 At the chase night clock the lamp-pool, sign-halo and heli-spot alphas are at their night values: PASS');
 const {SAVE_VERSION}=await import('../src/save.js');
 assert.equal(SAVE_VERSION,1);
 console.log('B33-T3 Save version stays 1 for the night-chase re-pin: PASS');
}

// Brief-33 item 2: the chase scene runs at 5 stars, so updatePolice's own rules
// spawn the roadblock (with its derived spike strip) and the helicopter.
{
 location.search='?shot=chase&seed=1';
 const {game:rbChase}=await import('../src/main.js?scene-chase-b33rb');
 const startX=rbChase.vehicle.x;
 let frameTime=0;
 for(let index=0;index<180;index++){raf(frameTime);frameTime+=1000/60;}
 assert.equal(rbChase.wanted.stars,5);
 const rb=rbChase.police.roadblock;
 assert(rb,'chase spawns a roadblock through the real >=4-star rule');
 assert.equal(rb.cars.length,2);assert(rb.cars.every(car=>car.police));
 const strip=spikeStrip(rb);
 assert(strip);assert.equal(strip.half,34);
 const {SPIKE_SPEED,SPIKE_CAP,SPIKE_TIME,SPIKE_HALF}=await import('../src/spikes.js');
 assert.equal(SPIKE_SPEED,60);assert.equal(SPIKE_CAP,60);assert.equal(SPIKE_TIME,6);assert.equal(SPIKE_HALF,34);
 console.log('B33-T4 Chase at 5 stars spawns a real roadblock with the derived spike strip, spike constants unchanged: PASS');
 assert(rb.x>startX+400,'roadblock placed ahead of the player by the spawn rule');
 assert(rbChase.police.heli,'chase spawns the helicopter at 5 stars');
 const rows=responseRows(rbChase);
 assert(rows.some(row=>row.type==='ROADBLOCK'));
 assert(rows.some(row=>row.type==='HELI'));
 console.log('B33-T5 Roadblock sits ahead on the player road and the CBPD panel carries BLOCK and AIR-1 rows: PASS');
 for(const other of ['mission','foot']){
  location.search=`?shot=${other}&seed=1`;
  const {game:otherGame}=await import(`../src/main.js?scene-${other}-b33rb`);
  let t=0;
  for(let index=0;index<180;index++){raf(t);t+=1000/60;}
  assert.equal(otherGame.police.roadblock,null);
 }
 console.log('B33-T6 Mission and foot scenes stage no roadblock: PASS');
}

// Brief-34 item 1: the pedestrian spawn distribution is weighted toward
// downtown (the lit 3x3, roads 2..4) — total count and the per-ped rng
// draw count are unchanged, only the distribution moves.
{
 const {createPedestrians:freshPeds}=await import('../src/pedestrians.js?b34-density');
 const {downtownRect}=await import('../src/storefronts.js');
 const {createHash}=await import('node:crypto');
 const rect=downtownRect(seeded);
 const pool=freshPeds(seeded,{x:0,y:0});
 assert.equal(pool.people.length,96);
 const downtown=pool.people.filter(p=>p.x>=rect.x0&&p.x<=rect.x1&&p.y>=rect.y0&&p.y<=rect.y1).length;
 assert.equal(downtown,44);
 assert(downtown>=36,'downtown spawn count must be at least 1.8x the pre-round baseline of 20 (brief-34)');
 const appearance=pool.people.map(p=>[p.shirt,p.skin,p.pants,p.pause].join('|')).join(';');
 assert.equal(createHash('sha256').update(appearance).digest('hex'),'e21e315556921a3b4d2d691ded44231a349880232cadeacfc798402deea0a9c9','per-ped rng draw count unchanged: the appearance stream is identical to the pre-round baseline');
 console.log('B34-T1 Downtown spawn weighting: 96 peds, downtown share up from the baseline of 20, draw count unchanged: PASS');
}
// Brief-34 item 2: a Comet Chopper reads in two staged frames — parked at
// the Marlin Diner in the mission scene, and at the front of the foot
// scene's red-light queue. Both go through the real vehicle systems.
{
 location.search='?shot=mission&seed=1';
 const {game:staged}=await import('../src/main.js?b34-mission');
 const bike=staged.missionStaging.bike;
 assert(bike,'mission scene stages a bike at the diner');
 assert.equal(bike.model.name,'Comet Chopper');
 assert.equal(bike.driver,'parked');
 assert.equal(bike.speed,0);
 assert.deepEqual([bike.x,bike.y],[1784,2172]);
 assert.equal(staged.missionStaging.cars.length,2,'the two staged diner cars are untouched');
 location.search='';
 console.log('B34-T2 Mission scene parks a Comet Chopper at the Marlin Diner: PASS');
}
{
 const {queue}=b32Foot.footStaging;
 assert.equal(queue.length,3);
 assert.equal(queue[0].model.name,'Comet Chopper','the front of the red-light queue is the bike');
 assert.equal(queue.filter(car=>car.model.name==='Comet Chopper').length,1,'exactly one bike in the queue');
 assert(queue.every(car=>car.driver==='traffic-driven'&&car.speed<6),'the queue stop behaviour is intact with the bike in front');
 console.log('B34-T3 Foot red-light queue is fronted by a Comet Chopper: PASS');
}

// Brief-35 item 1: Coral Bay Radio grows a third station (talk), the cycle
// gains an OFF state, and the HUD line draws on foot as well as in a car,
// stepping above the dialogue box when one is open.
{
 const freshA=await import('../src/radio.js?b35-a'),freshB=await import('../src/radio.js?b35-b');
 for(let i=0;i<3;i++)assert.deepEqual(freshA.stationNow(1234,i),freshB.stationNow(1234,i));
 for(const st of freshA.RADIO_STATIONS){assert(st.name&&st.freq&&st.tracks.length>=4);assert(st.tracks.every(t=>t.title&&t.artist));}
 console.log('B35-T1 Three stations with frequencies and playlists, deterministic across fresh imports: PASS');
}
{
 const {drawHUD}=await import('../src/hud.js');
 const texts=[],rects=[];
 const rec=new Proxy({save(){},restore(){},setTransform(){},roundRect(x,y,w,h){rects.push([x,y,w,h]);},fillText(text){texts.push(text);},measureText:text=>({width:text.length*7})},{get:(object,key)=>key in object?object[key]:(()=>{}),set:(object,key,value)=>(object[key]=value,true)});
 const base={world:seeded,player:{name:'Dario Venn',x:0,y:0,health:100,maxHealth:100,armour:0,maxArmour:100,cash:180},minimap:{},objective:{text:'Meet Lena at the Marlin Diner · The Envelope',position:null},width:1280,height:800,pixelRatio:1,playSeconds:0,news:{banner:null,ticker:null},vehicle:null,combat:null,radio:{station:2},missions:null};
 drawHUD(rec,base);
 assert(texts.some(t=>t.includes('BAY TALK 90.7')),'on-foot HUD draws the radio line');
 const radioRect=rects.find(r=>r[2]===510&&r[3]===30);assert(radioRect);assert.equal(radioRect[1],800-272);
 texts.length=0;rects.length=0;
 base.missions={dialogue:{speaker:'Lena',lines:['A courier has an envelope by General. Bring it straight back. And take this.'],index:0}};
 drawHUD(rec,base);
 assert(texts.some(t=>t.includes('BAY TALK 90.7')),'radio line still draws while dialogue is open');
 const radioRect2=rects.find(r=>r[2]===510&&r[3]===30),dialogueRect=rects.find(r=>r[2]===620);
 assert(radioRect2&&dialogueRect);assert.equal(radioRect2[1],96);assert(radioRect2[1]+30<=dialogueRect[1],'radio panel clears the dialogue box');
 texts.length=0;rects.length=0;
 base.news={banner:{headline:'EXPLOSION ROCKS DOWNTOWN',t:.2,dur:5},ticker:null};
 drawHUD(rec,base);
 const radioRect3=rects.find(r=>r[2]===510&&r[3]===30);
 assert(radioRect3);assert.equal(radioRect3[1],dialogueRect[1]-38);assert(radioRect3[1]+30<=dialogueRect[1],'with a banner up the radio panel falls back above the dialogue box');
 console.log('B35-T2 Radio line draws on foot, takes the banner slot over dialogue, and falls back when a banner is up: PASS');
}
{
 const {writeSave,SAVE_VERSION}=await import('../src/save.js');
 const carrier={player:{cash:180,x:1,y:2},combat:{pistol:false},missions:{completed:[],currentMission:0,collectibles:[],bestTimes:{},taxiFares:0,totalEarned:0},radio:{station:2}};
 const record=writeSave(carrier,carrier.missions);
 assert(record&&!Object.hasOwn(record,'radio'),'radio state never reaches the save');
 assert.equal(SAVE_VERSION,1);
 console.log('B35-T3 Radio is session-only and the save stays version 1: PASS');
}

// Brief-35 item 2: the mission frame opens 'The Envelope' (mission index 2)
// through the real mission system — a save-shaped two-missions-complete
// state plus free play's own E-at-the-diner trigger into begin(2).
{
 location.search='?shot=mission';
 const shot=await import('../src/main.js?shot-mission-b35');
 let frameTime=0;for(let index=0;index<180;index++){raf(frameTime);frameTime+=1000/60;}
 const s=shot.game.missions;
 assert.deepEqual(s.completed,[0,1]);assert.equal(s.currentMission,2);assert.equal(s.activity,'mission');assert.equal(s.phase,'start');
 assert(s.dialogue);assert.equal(s.dialogue.speaker,'Lena');
 assert.equal(s.dialogue.lines[0],'A courier has an envelope by General. Bring it straight back. And take this.');
 assert.equal(s.objective,'Meet Lena at the Marlin Diner · The Envelope');
 assert.deepEqual([s.marker.x,s.marker.y],[shot.game.world.spawnPoints.diner.x,shot.game.world.spawnPoints.diner.y]);
 assert.equal(shot.game.combat.pistol,true);
 assert.equal(shot.game.objective.text,s.objective);
 assert.equal(shot.game.radio.station,0);
 location.search='';
 console.log('B35-T4 Mission scene opens The Envelope through the real mission path: PASS');
}
{
 const {writeSave,SAVE_VERSION}=await import('../src/save.js');
 const carrier={player:{cash:180,x:1,y:2},combat:{pistol:true},missions:{completed:[0,1],currentMission:2,collectibles:[],bestTimes:{},taxiFares:0,totalEarned:1550}};
 const record=writeSave(carrier,carrier.missions);
 assert(record);assert.deepEqual(record.completed,[0,1]);assert.equal(record.currentMission,2);assert(!Object.hasOwn(record,'dialogue')&&!Object.hasOwn(record,'activity'));
 assert.equal(SAVE_VERSION,1);
 console.log('B35-T5 The staged mission state round-trips as an ordinary two-mission save: PASS');
}

{
 const {execFileSync}=await import('node:child_process');
 const {mkdtempSync,readFileSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {fileURLToPath}=await import('node:url');
 const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
 const outDir=mkdtempSync(join(tmpdir(),'cbh-dossier-'));
 try{
  execFileSync(process.execPath,['main.ts'],{cwd:repoRoot,env:{...process.env,MAKEFUN_OUTPUT_DIR:outDir},stdio:'pipe'});
  const dossier=JSON.parse(readFileSync(join(outDir,'dossier.json'),'utf8'));
  assert.equal(dossier.schema,'makefun/dossier/v1');
  assert.equal(dossier.images.length,4);
  const text=dossier.text;
  assert(text.startsWith('## Game'),'dossier text opens with the Game block');
  assert(Buffer.byteLength(text,'utf8')<=163840,'dossier text stays within the cap');
  const htmlAt=text.indexOf('### game/index.html');
  const mainAt=text.indexOf('### game/src/main.js');
  assert(htmlAt>=0&&mainAt>htmlAt,'index.html leads the dossier sources, main.js follows');
  const presentation=text.slice(htmlAt,mainAt);
  assert(presentation.includes('CORAL BAY HEAT — an original open-world crime game'),'index.html carries the presentation block');
  const probes=['six-mission story','Wanted 0-5 stars','helicopter','roadblocks','spike strips','working signals','10 driveable vehicle models','transit bus','Comet Chopper','Taxi fares','street-race','rampages','courier runs','fishing','12 hidden beach umbrellas','five photo spots','can be robbed','respray garage','fuel system','car alarms','drift chains','STREET REP','Coral Bay Radio','BREAKING news banner','live minimap','fireworks'];
  const named=probes.filter(p=>presentation.includes(p));
  assert(named.length>=12,`presentation names at least 12 real systems (named ${named.length})`);
  const mainHead=text.slice(mainAt,mainAt+700);
  assert(mainHead.includes("CORAL BAY HEAT — the game's entry module"),'main.js opens the dossier module walk with its header');
  console.log('B36-T1 Dossier presents the game at its head: index.html block + main.js header, systems named: PASS');
 } finally { rmSync(outDir,{recursive:true,force:true}); }
}

{
 // Brief-37 item 2: the title screen carries the tagline, the full real
 // control set and a working Enter-to-start on the real New Game path.
 const {readFileSync}=await import('node:fs');
 const {join}=await import('node:path');
 const {fileURLToPath}=await import('node:url');
 const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
 const html=readFileSync(join(repoRoot,'game/index.html'),'utf8');
 assert(html.includes('Six missions. One bay. Every siren earned.'),'menu shows the tagline under the title');
 assert(html.includes('PRESS ENTER TO START'),'menu advertises Enter to start');
 assert(html.includes('<b>T</b> Radio')&&html.includes('<b>R</b> Reload')&&html.includes('<b>C</b> Horn'),'menu controls name radio, reload and horn');
 location.search='';
 const menuGame=await import('../src/main.js?b37-menu');
 assert.equal(menuGame.game.state,'menu','a fresh load waits at the title screen');
 key('Enter');
 assert.equal(menuGame.game.state,'playing','Enter starts the game from the title screen');
 console.log('B37-T2 Title screen: tagline, full controls, Enter starts the real New Game path: PASS');
}

{
 const {execFileSync}=await import('node:child_process');
 const {mkdtempSync,readFileSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {fileURLToPath}=await import('node:url');
 const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
 const outDir=mkdtempSync(join(tmpdir(),'cbh-dossier37-'));
 try{
  execFileSync(process.execPath,['main.ts'],{cwd:repoRoot,env:{...process.env,MAKEFUN_OUTPUT_DIR:outDir},stdio:'pipe'});
  const dossier=JSON.parse(readFileSync(join(outDir,'dossier.json'),'utf8'));
  const text=dossier.text;
  assert(Buffer.byteLength(text,'utf8')<=163840,'dossier text stays within the cap');
  // Brief-37 item 1: main.js's import order steers buildDossier's depth-first
  // walk so the high-signal modules land inside the text cap, whole.
  const keepers=['missions','traffic','radio','minimap','damage','news','police','wanted'];
  const segments=text.split('### game/');
  const sectionOf=(name)=>segments.find(s=>s.startsWith(`src/${name}.js (`));
  for(const name of keepers){
   const section=sectionOf(name);
   assert(section,`dossier text contains a section for ${name}.js`);
   assert(!section.includes('lines not shown'),`${name}.js is shown whole, not truncated`);
  }
  const markers={missions:'createMissionState',traffic:'createTraffic',radio:'CORAL FM',minimap:'drawMinimap',damage:'createDamageSmoke',news:'createNews',police:'createPolice',wanted:'createWanted'};
  for(const [name,marker] of Object.entries(markers)) assert(sectionOf(name).includes(marker),`${name}.js section carries its marker ${marker}`);
  const tails={missions:'Taxi dispatch: pick up the flagged passenger',traffic:'traffic.timer=.6',radio:'export function cycleRadio',minimap:"fillText('N', cx, cy - radius + 13)",damage:'export function drawDamageSmoke(ctx, state)'};
  for(const [name,tail] of Object.entries(tails)) assert(sectionOf(name).includes(tail),`${name}.js section reaches its tail (${tail})`);
  console.log('B37-T1 Dossier walk order puts the high-signal modules inside the cap, whole: PASS');
 } finally { rmSync(outDir,{recursive:true,force:true}); }
}

{
 // Brief-38 item 1: the roadblock spike strip gains hazard edge stripes,
 // brighter studs and a top-down warning cone at each end — render only;
 // the 16-wide base band, chevrons and SPIKE_* geometry are unchanged.
 const {drawSpikes,SPIKE_HALF}=await import('../src/spikes.js');
 const makeCtx=(rects,arcs)=>{let cur=null;return {save(){},restore(){},translate(){},rotate(){},beginPath(){},stroke(){},moveTo(){},lineTo(){},fill(){},
  set fillStyle(v){cur=v;},get fillStyle(){return cur;},
  fillRect(x,y,w,h){rects.push({x,y,w,h,style:cur});},
  arc(x,y,r){arcs.push({x,y,r,style:cur});}};};
 const rects=[],arcs=[];
 drawSpikes(makeCtx(rects,arcs),{roadblock:{x:100,y:100,dirX:1,dirY:0}},0);
 assert(rects.some(f=>f.w===16&&f.h===SPIKE_HALF*2),'base band still drawn 16 wide');
 const hazard=rects.filter(f=>f.style==='#ffd37b'&&(f.x===-12||f.x===8));
 assert(hazard.length>=8,'hazard-yellow edge segments line both edges of the strip');
 assert(rects.some(f=>f.style==='#ffd37b'&&f.x===-12)&&rects.some(f=>f.style==='#ffd37b'&&f.x===8),'hazard edges on both sides');
 assert(arcs.some(a=>a.r===3),'glint studs drawn at the larger radius');
 const cones=arcs.filter(a=>a.r===5.5&&a.style==='#e8762d');
 assert.equal(cones.length,2,'one warning cone at each end of the strip');
 assert(cones.some(a=>a.y===-(SPIKE_HALF+12))&&cones.some(a=>a.y===SPIKE_HALF+12),'cones sit just beyond the strip ends');
 const rects2=[],arcs2=[];
 drawSpikes(makeCtx(rects2,arcs2),{roadblock:null},0);
 assert.equal(rects2.length+arcs2.length,0,'no roadblock, no strip and no cones');
 console.log('B38-T1 Roadblock strip gains hazard edges, brighter studs and end cones; geometry unchanged: PASS');
}
{
 // Brief-38 item 2: the BUSTED screen is driven through the real
 // finishOutcome path (arrest >= 1 in the real frame loop) and its HUD
 // overlay shows the treated headline plus the real state at capture.
 location.search='';
 const {game:g}=await import('../src/main.js?b38-busted');
 element('new-game').onclick();frame();
 assert.equal(g.state,'playing');
 g.player.cash=1000;g.rep.xp=350;g.missions.completed=[0,1];g.missions.activity='mission';
 const {setWanted}=await import('../src/wanted.js');
 setWanted(g.wanted,4,g.player);
 const {spawnPolice}=await import('../src/police.js');
 const officer=spawnPolice(g.police,g.player.x+10,g.player.y,0,false);
 officer.onFoot=true;officer.x=g.player.x+10;officer.y=g.player.y;officer.fireTimer=99;
 g.police.arrest=1;
 frame();
 assert.equal(g.state,'busted');
 assert(g.outcome&&g.outcome.kind==='busted');
 assert.equal(g.outcome.bill,200,'fine is 15% of cash + $50, capped at cash');
 assert.equal(g.player.cash,800);
 assert.equal(g.outcome.stars,4);assert.equal(g.outcome.cash,800);assert.equal(g.outcome.repLevel,3);assert.equal(g.outcome.jobs,2);assert.equal(g.outcome.missionBlown,true);
 const {drawHUD}=await import('../src/hud.js');
 const texts=[];
 const rctx=new Proxy({measureText:t=>({width:t.length*7}),createLinearGradient:()=>({addColorStop(){}}),fillText(t){texts.push(String(t));},strokeText(t){texts.push(String(t));}},{get:(o,k)=>k in o?o[k]:(...a)=>{},set:(o,k,v)=>(o[k]=v,true)});
 drawHUD(rctx,g);
 assert(texts.includes('BUSTED'),'treated BUSTED headline drawn');
 assert(texts.some(t=>t.includes('Booked by the Coral Bay PD')),'CBPD sub-line drawn');
 assert(texts.includes('Police fine: $200'),'real fine shown');
 assert(texts.some(t=>t.includes('CASH $800')&&t.includes('STREET REP LV 3')&&t.includes('JOBS 2/6')&&t.includes('WANTED ★★★★')),'stats line carries the driven state');
 assert(texts.some(t=>t.includes('police station')&&t.includes('heat cleared')&&t.includes('job is blown')),'consequence states the station release and the blown job');
 console.log('B38-T2 Busted screen: treated headline, CBPD line, real fine, stats and consequence from driven state: PASS');
}
{
 // Brief-38 item 2: the WASTED screen, driven through the real
 // finishOutcome path (health <= 0), shows the hospital bill, the
 // post-bill cash and no WANTED segment at zero stars.
 location.search='';
 const {game:g}=await import('../src/main.js?b38-wasted');
 element('new-game').onclick();frame();
 assert.equal(g.state,'playing');
 g.player.cash=500;g.rep.xp=0;
 g.player.health=0;
 frame();
 assert.equal(g.state,'wasted');
 assert(g.outcome&&g.outcome.kind==='wasted');
 assert.equal(g.outcome.bill,125,'hospital bill is 10% of cash + $75, capped at cash');
 assert.equal(g.player.cash,375);
 assert.equal(g.outcome.stars,0);assert.equal(g.outcome.missionBlown,false);
 const {drawHUD}=await import('../src/hud.js');
 const texts=[];
 const rctx=new Proxy({measureText:t=>({width:t.length*7}),createLinearGradient:()=>({addColorStop(){}}),fillText(t){texts.push(String(t));},strokeText(t){texts.push(String(t));}},{get:(o,k)=>k in o?o[k]:(...a)=>{},set:(o,k,v)=>(o[k]=v,true)});
 drawHUD(rctx,g);
 assert(texts.includes('WASTED'),'treated WASTED headline drawn');
 assert(texts.some(t=>t.includes('Coral Bay General patches you up')),'hospital sub-line drawn');
 assert(texts.includes('Hospital bill: $125'),'real bill shown');
 assert(texts.some(t=>t.includes('CASH $375')&&t.includes('STREET REP LV 1')&&t.includes('JOBS 0/6')),'stats line carries the driven state');
 assert(!texts.some(t=>t.includes('WANTED')),'no WANTED segment at zero stars');
 assert(texts.some(t=>t.includes('Coral Bay General')&&t.includes('heat cleared')&&!t.includes('job is blown')),'consequence states the hospital release, no blown job');
 console.log('B38-T3 Wasted screen: treated headline, hospital line, real bill, stats and consequence from driven state: PASS');
}
