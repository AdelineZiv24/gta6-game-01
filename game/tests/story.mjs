import assert from 'node:assert/strict';
import {createMissionState,updateMissions,failMission,startTaxi,MISSIONS,drawMissionWorld,TAXI_PASSENGERS} from '../src/missions.js';
import {createWorld} from '../src/world.js';
import {createPlayer} from '../src/player.js';
import {createCar,carBlocked,resolveCarContacts,MODELS} from '../src/vehicles.js';
import {createCombat,grantPistol} from '../src/combat.js';
import {createWanted,createEscape} from '../src/wanted.js';
import {writeSave,loadSave,SAVE_VERSION} from '../src/save.js';
import {createPhotos,updatePhotos,drawPhotosWorld,photoSpots,PHOTO_REWARD} from '../src/photos.js';
import {drawHUD} from '../src/hud.js';
import {createPopups} from '../src/popups.js';
import {createRace,raceStartPoint} from '../src/race.js';
import {createRampage,rampageStartPoint,rampageBeachPoint} from '../src/rampage.js';
import {createCourier,courierStartPoint} from '../src/courier.js';
import {createDrift} from '../src/drift.js';
import {createRep} from '../src/rep.js';
import {responseRows} from '../src/hud.js';
import {setWanted,updateEscape,updateWanted} from '../src/wanted.js';
import {createSprayState,sprayGarages,updateSpray} from '../src/spray.js';
import {createRobberyState,updateRobbery,martShops,robberyPayout,ROBBERY_TIME,createDinerRobberyState,updateDinerRobbery,dinerShops} from '../src/robbery.js';
const data=new Map();let writes=0;
globalThis.localStorage={getItem:k=>data.get(k)||null,setItem(k,v){writes++;data.set(k,v);}};
const world=createWorld();let key=null;
const input={wasPressed:k=>key===k,isDown:()=>false};
function fixture(record){const g={world,player:createPlayer(world.spawnPoints.diner),combat:createCombat(),wanted:createWanted(),playSeconds:0,clockMinutes:555,police:{arrest:0},vehicle:null,cars:[],popups:createPopups(),race:createRace(),rampage:createRampage(),courier:createCourier(),drift:createDrift(),escape:createEscape(),rep:createRep(),spray:createSprayState(),photos:createPhotos(record)};g.grantPistol=n=>grantPistol(g,n);g.clearWanted=()=>{g.police.arrest=0;g.wanted=createWanted();};g.missions=createMissionState(record);return g;}
function tick(g,k=null,dt=.1){key=k;updateMissions(g.missions,g,dt,input,g.cars,{});key=null;}
function at(g,p,car=false){if(car){g.vehicle??=createCar(p.x,p.y,0,0,'#777','player-driven');Object.assign(g.vehicle,{x:p.x,y:p.y});}else g.vehicle=null;Object.assign(g.player,{x:p.x,y:p.y});}
function talk(g){let n=10;while(g.missions.dialogue&&n--)tick(g,'KeyE');assert(n>0);}
function begin(g){at(g,world.spawnPoints.diner);tick(g,'KeyE');talk(g);assert.equal(g.missions.activity,'mission');}
function finish(g,i){const s=g.missions;
 if(i===0){at(g,s.marker,true);tick(g);assert.equal(s.activity,'mission');at(g,s.marker);tick(g);}
 if(i===1){tick(g);g.vehicle=s.convertible;tick(g);at(g,world.spawnPoints.garage,true);tick(g);}
 if(i===2){at(g,s.courier,true);tick(g,'KeyE');assert.equal(s.phase,'courier');at(g,s.courier);tick(g,'KeyE');talk(g);s.rival.health=0;at(g,world.spawnPoints.diner);tick(g);}
 if(i===3){g.vehicle=s.van;g.vehicle.driver='player-driven';for(const p of s.stops){at(g,p,true);tick(g);}}
 if(i===4){tick(g);at(g,world.spawnPoints.diner,true);tick(g);talk(g);at(g,world.spawnPoints.pier,true);tick(g);}
 assert(s.completed.includes(i));assert.equal(s.activity,null);const money=g.player.cash;tick(g);assert.equal(g.player.cash,money);talk(g);
}
const chain=fixture();for(let i=0;i<5;i++){begin(chain);finish(chain,i);assert.equal(chain.missions.currentMission,i+1);assert(chain.missions.splash);assert.equal(chain.missions.splash.name,MISSIONS[i].name);assert(chain.missions.splash.reward>0);assert.equal(chain.missions.splash.total,chain.player.cash);console.log(`${MISSIONS[i].id}: completion PASS`);}
assert(chain.missions.completion);tick(chain,'KeyE');assert.equal(chain.missions.completion,null);
for(let i=0;i<5;i++){for(const kind of ['timer','busted','wasted']){const g=fixture({currentMission:i});begin(g);if(kind==='timer')tick(g,null,MISSIONS[i].time+1);else {if(kind==='wasted')g.player.health=0;else g.police.arrest=1;tick(g);}assert(g.missions.retry);talk(g);begin(g);assert.equal(g.missions.elapsed,0);assert.equal(g.missions.currentMission,i);assert.equal(g.cars.filter(c=>c.driver==='rival-driven').length,i===2?1:0);finish(g,i);}console.log(`${MISSIONS[i].id}: timer/busted/wasted failure + retry PASS`);}
const a=fixture({currentMission:5,completed:[0,1,2,3,4]});a.player.cash=10000;startTaxi(a.missions,a);talk(a);at(a,a.missions.taxiStart,true);tick(a);talk(a);at(a,a.missions.taxiTarget,true);tick(a);assert.equal(a.missions.taxiFares,1);assert(a.popups.list.some(entry=>entry.life>0&&entry.text.includes('FARE')));talk(a);at(a,world.spawnPoints.garage,true);a.vehicle.health=20;let cash=a.player.cash;tick(a,'Digit1');assert.equal(a.player.cash,cash-260);assert.equal(a.vehicle.health,100);at(a,world.spawnPoints.diner);cash=a.player.cash;tick(a,'Digit2');assert.equal(a.player.cash,cash-220);assert.equal(a.player.armour,100);at(a,a.missions.umbrellas[0]);tick(a);assert.deepEqual(a.missions.collectibles,[0]);assert(a.popups.list.some(entry=>entry.life>0&&entry.text.includes('COLLECTIBLE 1/12')));at(a,world.spawnPoints.diner);tick(a,'Digit3');talk(a);finish(a,4);assert.equal(a.missions.currentMission,5);assert(a.missions.bestTimes['sunrise-run-replay']>=0);
chain.missions.collectibles=[1,3];writeSave(chain,chain.missions);const record=loadSave();assert.equal(record.cash,chain.player.cash);assert.deepEqual(record.completed,[0,1,2,3,4]);assert(record.pistolGranted);assert.deepEqual(record.collectibles,[1,3]);assert.deepEqual(record.bestTimes,chain.missions.bestTimes);const count=writes;chain.shot='mission';writeSave(chain,chain.missions);assert.equal(writes,count);
{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4]});
 assert(TAXI_PASSENGERS.length>=6);assert(TAXI_PASSENGERS.every(p=>p.name&&p.quip));assert.equal(new Set(TAXI_PASSENGERS.map(p=>p.name)).size,TAXI_PASSENGERS.length);
 startTaxi(g.missions,g);talk(g);assert.equal(g.missions.taxiPassenger,TAXI_PASSENGERS[0]);
 at(g,g.missions.taxiStart,true);tick(g);assert.equal(g.missions.dialogue?.speaker,TAXI_PASSENGERS[0].name);assert.equal(g.missions.dialogue?.lines[0],TAXI_PASSENGERS[0].quip);
 talk(g);at(g,g.missions.taxiTarget,true);tick(g);talk(g);assert.equal(g.missions.taxiFares,1);
 startTaxi(g.missions,g);talk(g);assert.equal(g.missions.taxiPassenger,TAXI_PASSENGERS[1]);
 at(g,g.missions.taxiStart,true);tick(g);assert.equal(g.missions.dialogue?.speaker,TAXI_PASSENGERS[1].name);
}
console.log('Taxi passenger personas rotate per fare: PASS');
for(const p of [world.spawnPoints.pier,world.spawnPoints.diner,world.spawnPoints.garage,a.missions.taxiStart,a.missions.taxiTarget]){assert(!world.collidesCircle(p.x,p.y,12));assert(p.y+30<world.water.y);}
const ctx=new Proxy({measureText:t=>({width:t.length*7})},{get:(o,k)=>k in o?o[k]:(...args)=>{},set:(o,k,v)=>(o[k]=v,true)});Object.assign(chain,{width:1280,height:800,pixelRatio:1,minimap:{},objective:{text:'test'},vehicle:null});ctx.textAlign='center';drawHUD(ctx,chain);drawMissionWorld(ctx,chain.missions,chain,0);
console.log('Activities, replay, save round trip, shot isolation, marker geometry, stub canvas: PASS');

{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4]});at(g,raceStartPoint(world),true);tick(g,'Digit4');
 assert.equal(g.missions.activity,'race');assert.equal(g.race.phase,'running');assert(g.cars.some(car=>car.driver==='rival-driven'));
 const elapsed=g.missions.elapsed;tick(g);assert.equal(g.missions.activity,'race');assert.equal(g.missions.elapsed,elapsed);
 const foot=fixture({currentMission:5,completed:[0,1,2,3,4]});at(foot,raceStartPoint(world));tick(foot,'Digit4');
 assert.equal(foot.missions.activity,null);assert.equal(foot.race.phase,'idle');
}
console.log('Street race car requirement, start input and activity guard: PASS');

{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4]});at(g,rampageStartPoint(world),true);tick(g,'Digit5');
 assert.equal(g.missions.activity,'rampage');assert.equal(g.rampage.phase,'running');assert(g.rampage.ring);
 const elapsed=g.missions.elapsed;tick(g);assert.equal(g.missions.activity,'rampage');assert.equal(g.missions.elapsed,elapsed);
 const foot=fixture({currentMission:5,completed:[0,1,2,3,4]});at(foot,rampageStartPoint(world));tick(foot,'Digit5');
 assert.equal(foot.missions.activity,null);assert.equal(foot.rampage.phase,'idle');
}
console.log('Rampage car requirement, start input and activity guard: PASS');

{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4]});at(g,courierStartPoint(world),true);tick(g,'Digit6');
 assert.equal(g.missions.activity,'courier');assert.equal(g.courier.phase,'running');assert(g.courier.target);
 const elapsed=g.missions.elapsed;tick(g);assert.equal(g.missions.activity,'courier');assert.equal(g.missions.elapsed,elapsed);
 const foot=fixture({currentMission:5,completed:[0,1,2,3,4]});at(foot,courierStartPoint(world));tick(foot,'Digit6');
 assert.equal(foot.missions.activity,null);assert.equal(foot.courier.phase,'idle');
}
console.log('Courier car requirement, start input and activity guard: PASS');

{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4]});at(g,rampageBeachPoint(world),true);tick(g,'Digit5');
 assert.equal(g.missions.activity,'rampage');assert.equal(g.rampage.phase,'running');assert.deepEqual(g.rampage.start,rampageBeachPoint(world));assert(g.rampage.ring);
}
console.log('Rampage beach start input: PASS');

{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4]});at(g,courierStartPoint(world),true);tick(g,'Digit6');
 const texts=[],st={textAlign:'center'};const canvas=new Proxy({measureText:t=>({width:t.length*7}),save(){},restore(){},setTransform(){},roundRect(){},fillText(t){texts.push(t);}},{get:(o,k)=>k in o?o[k]:st[k]??(()=>{}),set:(o,k,v)=>(st[k]=v,true)});
 Object.assign(g,{width:1280,height:800,pixelRatio:1,minimap:{},objective:{text:'Objective'}});drawHUD(canvas,g);
 assert(texts.some(t=>t==='COURIER'));assert(texts.some(t=>t.startsWith('DROP ')));
}
console.log('Courier HUD panel renders while a run is live: PASS');

{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4]});at(g,raceStartPoint(world),true);g.drift.chain=2;
 const texts=[],st={textAlign:'center'};const canvas=new Proxy({measureText:t=>({width:t.length*7}),save(){},restore(){},setTransform(){},roundRect(){},fillText(t){texts.push(t);}},{get:(o,k)=>k in o?o[k]:st[k]??(()=>{}),set:(o,k,v)=>(st[k]=v,true)});
 Object.assign(g,{width:1280,height:800,pixelRatio:1,minimap:{},objective:{text:'Objective'}});drawHUD(canvas,g);
 assert(texts.some(t=>t==='DRIFT ×2'));
 g.drift.chain=0;texts.length=0;drawHUD(canvas,g);assert(!texts.some(t=>t.startsWith('DRIFT')));
}
console.log('Drift chain readout renders next to the near-miss popup: PASS');

{
 const g=fixture({currentMission:0});begin(g);at(g,g.missions.marker,true);g.vehicle.fuel=10;tick(g);assert.equal(g.vehicle.fuel,40);
}
console.log('Mission fuel floor: PASS');

for(const i of [1,3,4]){const g=fixture({currentMission:i});begin(g);const s=g.missions;if(i===1){tick(g);g.vehicle=s.convertible;tick(g);s.targetCar.health=0;}if(i===3)s.van.health=0;if(i===4){tick(g);at(g,world.spawnPoints.diner,true);tick(g);talk(g);s.lenaCar.health=0;}tick(g);assert(s.retry);talk(g);begin(g);assert.equal(s.activity,'mission');}
const restored=fixture(record);assert.deepEqual(restored.missions.bestTimes,record.bestTimes);assert.deepEqual(restored.missions.collectibles,record.collectibles);
const c=createCar(100,100,0,0,'#777','player-driven'),r=createCar(120,100,0,1,'#a00','rival-driven');r.vx=-140;c.vx=100;resolveCarContacts([c,r],()=>({}),0);assert(c.health<100&&r.health<100);
console.log('Wrecked M2/M4/M5 retry, restored mission state, normal rival contact damage: PASS');

for(const [width,height] of [[1280,800],[800,600],[390,800],[640,360],[640,720]]){
 const boxes=[],texts=[],st={textAlign:'center'};
 const canvas=new Proxy({measureText:t=>({width:t.length*7}),save(){},restore(){},setTransform(){},roundRect(x,y,w,h){boxes.push({x,y,w,h});},fillText(t,x,y){texts.push({t,x,y,align:st.textAlign});}},{get:(o,k)=>k in o?o[k]:st[k]??(()=>{}),set:(o,k,v)=>(st[k]=v,true)});
 const g=fixture();g.missions.dialogue={speaker:'Lena',lines:['A long dialogue line that should wrap and remain above every bottom panel and hint bar in Coral Bay.'],index:0};Object.assign(g,{width,height,pixelRatio:1,minimap:{},objective:{text:'Objective'}});drawHUD(canvas,g);
 const fit=Math.min(1,width/640,height/720),w=width/fit,h=height/fit;
 for(const b of boxes){assert(b.x>=19&&b.y>=19);assert(b.x+b.w<=w-19&&b.y+b.h<=h-19);}
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`HUD panel overlap at ${width}x${height}`);}
 assert.equal(texts.find(t=>t.t==='DARIO VENN').align,'left');
 g.missions.dialogue=null;at(g,rampageStartPoint(world),true);
 for(const phase of ['running','done']){
  boxes.length=texts.length=0;
  g.rampage.phase=phase;g.race.phase=phase==='running'?'done':'idle';
  g.missions.splash={name:phase==='done'?'RAMPAGE':'STREET RACE',reward:25,total:25,until:2.8};
  drawHUD(canvas,g);assert(texts.some(t=>t.t==='RAMPAGE'));assert(texts.some(t=>t.t==='FUEL'));
  for(const b of boxes){assert(b.x>=19&&b.y>=19);assert(b.x+b.w<=w-19&&b.y+b.h<=h-19);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`Rampage HUD panel overlap at ${width}x${height} (${phase})`);}
 }
}
console.log('HUD safe bounds, panel separation, inherited name alignment at five viewport sizes: PASS');
{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4]});begin(g);const s=g.missions;
 assert.equal(s.currentMission,5);assert.equal(s.phase,'escape');assert.equal(s.checkpoints.length,5);assert.equal(g.wanted.stars,3);
 for(let k=0;k<5;k++){at(g,s.checkpoints[s.checkpoint],true);tick(g);if(k===1)assert.equal(g.wanted.stars,4);if(k===3)assert.equal(g.wanted.stars,5);}
 assert(s.completed.includes(5));assert.equal(s.activity,null);assert.equal(s.currentMission,6);
 assert.equal(s.splash.name,'Pier Escape');assert.equal(s.splash.reward,6000);assert.equal(s.splash.total,g.player.cash);
 assert.equal(s.completion?.title,'PIER ESCAPE · STORY COMPLETE');assert.equal(g.rep.xp,100);
 talk(g);tick(g,'KeyE');assert.equal(s.completion,null);
}
console.log('Pier Escape finale chain, wanted escalation, completion screen: PASS');
{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4]});begin(g);g.police.arrest=1;tick(g);assert(g.missions.retry);talk(g);begin(g);assert.equal(g.missions.activity,'mission');assert.equal(g.missions.currentMission,5);
 const t=fixture({currentMission:5,completed:[0,1,2,3,4]});begin(t);tick(t,null,MISSIONS[5].time+1);assert(t.missions.retry);
}
console.log('Pier Escape busted/timer failure + retry: PASS');
{
 const g=fixture({currentMission:3});begin(g);const s=g.missions;g.vehicle=s.van;g.vehicle.driver='player-driven';
 for(const p of s.stops){at(g,p,true);tick(g);}
 assert(s.completed.includes(3));assert.equal(g.rep.xp,130);
 const c=fixture();at(c,c.missions.umbrellas[0]);tick(c);assert.deepEqual(c.missions.collectibles,[0]);assert.equal(c.rep.xp,15);
 const t=fixture({currentMission:5,completed:[0,1,2,3,4]});startTaxi(t.missions,t);talk(t);at(t,t.missions.taxiStart,true);tick(t);talk(t);at(t,t.missions.taxiTarget,true);tick(t);assert.equal(t.missions.taxiFares,1);assert.equal(t.rep.xp,10);
}
console.log('REP gains from deposits, collectibles and taxi fares: PASS');
{
 const g=fixture({currentMission:5,completed:[0,1,2,3,4,5]});g.rep.xp=250;writeSave(g,g.missions);const saved=loadSave();
 assert.equal(saved.rep.xp,250);assert.deepEqual(saved.completed,[0,1,2,3,4,5]);assert.equal(saved.currentMission,5);
 data.set('coral-bay-heat-save',JSON.stringify({version:1,cash:50,completed:[0,1],currentMission:2}));
 const legacy=loadSave();assert.deepEqual(legacy.rep,{xp:0});assert.equal(legacy.cash,50);
}
console.log('Save round trip with REP, finale indices, legacy default: PASS');
{
 assert.equal(MODELS.length,10);
 const truck=createCar(200,200,0,6,'#777','player-driven');assert.equal(truck.model.name,'Dockhand Flatbed');
 const roadster=createCar(200,260,0,7,'#777','player-driven');assert.equal(roadster.model.name,'Marlin Roadster');
 assert(MODELS.every(m=>m.topSpeed<=375));assert.equal(Math.max(...MODELS.map(m=>m.topSpeed)),375);
}
console.log('Vehicle roster grows to eight models, no new fastest car: PASS');

{
 const g=fixture(),texts=[],panels=[];
 const canvas=new Proxy({
  fillText:(...args)=>texts.push(args),roundRect:(...args)=>panels.push(args),
  measureText:text=>({width:text.length*7}),
 },{get:(target,key)=>key in target?target[key]:()=>{}});
 Object.assign(g,{width:1280,height:800,pixelRatio:1,minimap:{},objective:{text:'Objective'}});
 g.police.units=Array.from({length:6},(_,index)=>({
  id:index+1,health:100,car:{x:g.player.x+(index+1)*100,y:g.player.y,health:100},
 }));
 drawHUD(canvas,g);
 const rows=responseRows(g);
 const expected=rows.slice(0,4).map(({callsign,type,distance,state},index)=>
  [`${callsign} · ${type}  ${distance} m  ${state}`,34,165+index*19,180]);
 expected.push([`+${rows.length-4} MORE`,34,241]);
 assert.deepEqual(texts.filter(([text])=>text.startsWith('CB-')||text.endsWith(' MORE')),expected);
 console.log('T2 Unit-only CBPD HUD keeps the original text and row positions: PASS');

 texts.length=panels.length=0;
 g.police.units.length=4;
 g.police.heli={x:g.player.x+600,y:g.player.y};
 g.police.roadblock={x:g.player.x+700,y:g.player.y};
 drawHUD(canvas,g);
 assert(texts.some(([text])=>text.startsWith('BLOCK · ROADBLOCK')));
 assert(texts.some(([text])=>text.startsWith('AIR-1 · HELI')));
 assert(texts.some(([text])=>text==='+1 MORE'));
 assert.equal(panels.find(([,y])=>y===124)?.[3],150);
 console.log('T3 CBPD HUD expands to show both pinned rows and overflow: PASS');
}

function sprayFixture(cash){
 const g=fixture();
 at(g,sprayGarages(world)[0],true);
 g.player.cash=cash;
 g.vehicle.health=40;
 setWanted(g.wanted,4);
 return g;
}

{
 const garages=sprayGarages(world);
 assert.equal(garages.length,1);
 assert.equal(garages[0].building.storefront.sign,'CORAL SPRAY');
 const g=sprayFixture(500);
 updateSpray(g,.1);
 assert.equal(g.player.cash,350);
 assert.equal(g.vehicle.health,100);
 assert.equal(g.wanted.stars,0);
 assert(g.popups.list.some(entry=>entry.life>0&&entry.text==='RESPRAYED'));
 assert.equal(g.notice,'WANTED CLEARED · $150');
 console.log('T7 CORAL SPRAY repairs and clears wanted for $150: PASS');
}

{
 const g=sprayFixture(500);
 updateEscape(g.escape,g);
 assert.equal(g.escape.peak,4);
 updateSpray(g,.1);
 assert.deepEqual(g.escape,{peak:0,prev:0});
 updateEscape(g.escape,g);
 assert.equal(g.player.cash,350);
 assert.equal(g.rep.xp,0);
 console.log('T8 Paid wanted clear does not award escape cash or REP: PASS');
}

{
 const g=sprayFixture(100);
 updateSpray(g,.1);
 assert.equal(g.player.cash,100);
 assert.equal(g.vehicle.health,40);
 assert.equal(g.wanted.stars,4);
 assert.equal(g.notice,'NEED $150');
 console.log('T9 CORAL SPRAY declines service without enough cash: PASS');
}

{
 const g=sprayFixture(500);
 at(g,sprayGarages(world)[0]);
 updateSpray(g,.1);
 assert.equal(g.vehicle,null);
 assert.equal(g.player.cash,500);
 assert.equal(g.wanted.stars,4);
 assert.equal(g.notice,undefined);
 assert.equal(g.popups.cursor,0);
 console.log('T10 CORAL SPRAY does not activate on foot: PASS');
}
{
 const g=fixture();const spots=photoSpots(world);assert.equal(spots.length,5);
 for(const spot of spots){assert(!world.collidesCircle(spot.x,spot.y,14));assert(spot.y+30<world.water.y);}
 at(g,spots[2]);const cashBefore=g.player.cash,earnedBefore=g.missions.totalEarned;
 key='KeyE';const snapped=updatePhotos(g.photos,g,.1,input);key=null;
 assert.equal(snapped,2);assert.equal(g.player.cash,cashBefore+PHOTO_REWARD);assert.equal(g.missions.totalEarned,earnedBefore+PHOTO_REWARD);
 assert.equal(g.rep.xp,10);assert.deepEqual(g.photos.taken,[2]);assert.equal(g.photos.dirty,true);
 assert(g.popups.list.some(entry=>entry.life>0&&entry.text==='POSTCARD · Fountain Court'));
 writeSave(g,g.missions);const saved=loadSave();assert.deepEqual(saved.photos,[2]);
 const restored=fixture(saved);assert.deepEqual(restored.photos.taken,[2]);
 console.log('B21-T7 Photo snap pays $25 + REP 10 and persists in the save: PASS');
 key='KeyE';const again=updatePhotos(g.photos,g,.1,input);key=null;
 assert.equal(again,-1);assert.equal(g.player.cash,cashBefore+PHOTO_REWARD);assert.deepEqual(g.photos.taken,[2]);
 console.log('B21-T8 Second snap at a taken spot pays nothing: PASS');
}
{
 assert.equal(SAVE_VERSION,1);
 data.set('coral-bay-heat-save',JSON.stringify({version:1,cash:50,completed:[0,1],currentMission:2}));
 const legacy=loadSave();assert.deepEqual(legacy.photos,[]);assert.equal(legacy.cash,50);
 assert.deepEqual(createPhotos(legacy).taken,[]);
 console.log('B21-T9 Legacy save without photo flags loads all five untaken: PASS');
}
{
 const g=fixture();const spots=photoSpots(world);
 at(g,spots[0],true);key='KeyE';assert.equal(updatePhotos(g.photos,g,.1,input),-1);key=null;
 at(g,{x:spots[0].x+200,y:spots[0].y});key='KeyE';assert.equal(updatePhotos(g.photos,g,.1,input),-1);key=null;
 assert.deepEqual(g.photos.taken,[]);
 const texts=[],st={textAlign:'center'};const canvas=new Proxy({measureText:t=>({width:t.length*7}),save(){},restore(){},roundRect(){},fillText(t){texts.push(t);}},{get:(o,k)=>k in o?o[k]:st[k]??(()=>{}),set:(o,k,v)=>(st[k]=v,true)});
 at(g,spots[0]);drawPhotosWorld(canvas,g.photos,g,0);
 assert(texts.some(t=>t==='E · SNAP PHOTO'));
 g.photos.taken.push(0);texts.length=0;drawPhotosWorld(canvas,g.photos,g,0);
 assert(texts.some(t=>t==='PHOTO TAKEN'));
 console.log('B21-T10 Photo prompt only on foot inside a ring; taken spots read PHOTO TAKEN: PASS');
}

function robberyFixture(record){
 const g=fixture(record);g.robbery=createRobberyState(record);
 const shop=martShops(world)[0];
 const clerk={x:shop.x+20,y:shop.y,state:'walk',pause:0,panic:0};
 g.people=[clerk];g.crimes=[];
 g.report=(type,x,y,severity,violent)=>{const crime={id:g.crimes.length+1,type,x,y,severity,violent};g.crimes.push(crime);return crime;};
 at(g,shop);return {g,shop,clerk};
}
function robStep(g,dt=.1){g.playSeconds+=dt;updateRobbery(g.robbery,g,g.people,g.report,dt);}
function robComplete(g){robStep(g);for(let i=0;i<40&&g.robbery.phase==='holdup';i++)robStep(g);assert.equal(g.robbery.phase,'idle');}

{
 const shops=martShops(world);assert.equal(shops.length,1);assert.equal(shops[0].building.storefront.sign,'CORAL MART');
 const spray=sprayGarages(world);assert.equal(spray.length,1);assert.notEqual(shops[0].building,spray[0].building);
 for(let i=0;i<200;i++)assert(robberyPayout(()=>i/200)>=180&&robberyPayout(()=>i/200)<=320);
 const {g,shop,clerk}=robberyFixture();g.grantPistol(48);assert.equal(g.combat.weapon,'pistol');
 const cashBefore=g.player.cash,earnedBefore=g.missions.totalEarned;
 robStep(g);assert.equal(g.robbery.phase,'holdup');assert.equal(g.notice,'HOLD UP…');assert(clerk.pause>0);
 for(let i=0;i<20;i++)robStep(g);assert.equal(g.robbery.phase,'holdup');assert.equal(g.player.cash,cashBefore);
 robComplete(g);
 const pay=g.player.cash-cashBefore;assert(pay>=180&&pay<=320);assert.equal(g.missions.totalEarned,earnedBefore+pay);
 assert.equal(g.crimes.length,1);assert.equal(g.crimes[0].type,'robbery');assert.equal(g.crimes[0].violent,true);assert.equal(g.crimes[0].severity,3);
 assert(g.popups.list.some(entry=>entry.life>0&&entry.text===`ROBBERY +$${pay}`));
 assert.equal(clerk.panic,6);assert.equal(g.robbery.lastDay,0);assert.equal(g.robbery.dirty,true);
 console.log('B22-T1 Hold-up completes after 3 s in zone with pistol out, pays the till, reports a violent robbery: PASS');
}
{
 const leave=robberyFixture();leave.g.grantPistol(48);robStep(leave.g);assert.equal(leave.g.robbery.phase,'holdup');
 at(leave.g,{x:leave.shop.x+500,y:leave.shop.y});robStep(leave.g);
 assert.equal(leave.g.robbery.phase,'idle');assert.equal(leave.g.crimes.length,0);assert.equal(leave.g.player.cash,180);
 const fists=robberyFixture();fists.g.grantPistol(48);robStep(fists.g);fists.g.combat.weapon='fists';robStep(fists.g);
 assert.equal(fists.g.robbery.phase,'idle');assert.equal(fists.g.crimes.length,0);assert.equal(fists.g.player.cash,180);
 const busted=robberyFixture();busted.g.grantPistol(48);robStep(busted.g);busted.g.outcome={kind:'busted',bill:0};robStep(busted.g);
 assert.equal(busted.g.robbery.phase,'idle');assert.equal(busted.g.crimes.length,0);assert.equal(busted.g.player.cash,180);
 console.log('B22-T2 Leaving the zone, holstering to fists, or an outcome mid-hold-up aborts with no payout and no crime: PASS');
}
{
 const {g}=robberyFixture();assert.equal(g.combat.weapon,'fists');
 robStep(g);assert.equal(g.robbery.phase,'idle');assert.equal(g.notice,"THE CLERK ISN'T SCARED OF FISTS");assert.equal(g.crimes.length,0);
 console.log('B22-T3 Fists in the zone draw the refusal notice and start nothing: PASS');
}
{
 const run=robberyFixture();run.g.grantPistol(48);robComplete(run.g);
 writeSave(run.g,run.g.missions);const saved=loadSave();assert.equal(saved.robberyDay,0);
 const restored=robberyFixture(saved);assert.equal(restored.g.robbery.lastDay,0);restored.g.grantPistol(48);
 const cash=restored.g.player.cash;robStep(restored.g);
 assert.equal(restored.g.robbery.phase,'idle');assert.equal(restored.g.notice,'TILL EMPTY · COME BACK TOMORROW');assert.equal(restored.g.player.cash,cash);assert.equal(restored.g.crimes.length,0);
 restored.g.clockMinutes=1440+555;robStep(restored.g);assert.equal(restored.g.robbery.phase,'holdup');
 assert.equal(SAVE_VERSION,1);
 data.set('coral-bay-heat-save',JSON.stringify({version:1,cash:50,completed:[0,1],currentMission:2}));
 const legacy=loadSave();assert.equal(legacy.robberyDay,-1);assert.equal(createRobberyState(legacy).lastDay,-1);
 console.log('B22-T4 One robbery per in-game day persists in the save; legacy saves default to a full till: PASS');
}
{
 const {g}=robberyFixture();g.grantPistol(48);g.missions.activity='mission';
 robStep(g);assert.equal(g.robbery.phase,'idle');assert.equal(g.crimes.length,0);assert.equal(g.notice,undefined);
 console.log('B22-T5 Hold-up never starts during an active story mission: PASS');
}
{
 const {g,clerk}=robberyFixture();g.grantPistol(48);robComplete(g);
 assert.equal(g.crimes.length,1);
 updateWanted(g.wanted,world,g.player,g.crimes,[clerk],[],10,.1);
 assert.equal(g.wanted.stars,2);
 console.log('B22-T9 A witnessed robbery raises exactly two stars through the unmodified wanted math: PASS');
}

function dinerFixture(record){
 const g=fixture(record);g.dinerRobbery=createDinerRobberyState(record);
 const shop=dinerShops(world)[0];
 const clerk={x:shop.x+20,y:shop.y,state:'walk',pause:0,panic:0};
 g.people=[clerk];g.crimes=[];
 g.report=(type,x,y,severity,violent)=>{const crime={id:g.crimes.length+1,type,x,y,severity,violent};g.crimes.push(crime);return crime;};
 at(g,shop);return {g,shop,clerk};
}
function dinerStep(g,dt=.1){g.playSeconds+=dt;updateDinerRobbery(g.dinerRobbery,g,g.people,g.report,dt);}
function dinerComplete(g){dinerStep(g);for(let i=0;i<40&&g.dinerRobbery.phase==='holdup';i++)dinerStep(g);assert.equal(g.dinerRobbery.phase,'idle');}

{
 const shops=dinerShops(world);assert.equal(shops.length,1);
 assert.equal(shops[0].x,world.spawnPoints.diner.x);assert.equal(shops[0].y,world.spawnPoints.diner.y);
 assert.equal(shops[0].building.short,'MARLIN DINER');
 assert.notEqual(shops[0].x,martShops(world)[0].x);
 console.log('B24-T5 The diner robbery zone sits on the Marlin Diner front point, distinct from the mart: PASS');
}
{
 const {g,clerk}=dinerFixture();g.grantPistol(48);assert.equal(g.combat.weapon,'pistol');
 const cashBefore=g.player.cash,earnedBefore=g.missions.totalEarned;
 dinerStep(g);assert.equal(g.dinerRobbery.phase,'holdup');assert.equal(g.notice,'HOLD UP…');assert(clerk.pause>0);
 for(let i=0;i<20;i++)dinerStep(g);assert.equal(g.dinerRobbery.phase,'holdup');assert.equal(g.player.cash,cashBefore);
 dinerComplete(g);
 const pay=g.player.cash-cashBefore;assert(pay>=180&&pay<=320);assert.equal(g.missions.totalEarned,earnedBefore+pay);
 assert.equal(g.crimes.length,1);assert.equal(g.crimes[0].type,'robbery');assert.equal(g.crimes[0].violent,true);assert.equal(g.crimes[0].severity,3);
 assert(g.popups.list.some(entry=>entry.life>0&&entry.text===`ROBBERY +$${pay}`));
 assert.equal(clerk.panic,6);assert.equal(g.dinerRobbery.lastDay,0);assert.equal(g.dinerRobbery.dirty,true);
 console.log('B24-T6 Diner hold-up completes after 3 s with pistol out, pays the till range, reports a violent robbery: PASS');
}
{
 const leave=dinerFixture();leave.g.grantPistol(48);dinerStep(leave.g);assert.equal(leave.g.dinerRobbery.phase,'holdup');
 at(leave.g,{x:leave.shop.x+500,y:leave.shop.y});dinerStep(leave.g);
 assert.equal(leave.g.dinerRobbery.phase,'idle');assert.equal(leave.g.crimes.length,0);assert.equal(leave.g.player.cash,180);
 const fists=dinerFixture();fists.g.grantPistol(48);dinerStep(fists.g);fists.g.combat.weapon='fists';dinerStep(fists.g);
 assert.equal(fists.g.dinerRobbery.phase,'idle');assert.equal(fists.g.crimes.length,0);assert.equal(fists.g.player.cash,180);
 const busted=dinerFixture();busted.g.grantPistol(48);dinerStep(busted.g);busted.g.outcome={kind:'busted',bill:0};dinerStep(busted.g);
 assert.equal(busted.g.dinerRobbery.phase,'idle');assert.equal(busted.g.crimes.length,0);assert.equal(busted.g.player.cash,180);
 console.log('B24-T7 Leaving the diner zone, holstering to fists, or an outcome mid-hold-up aborts with no payout and no crime: PASS');
}
{
 const run=dinerFixture();run.g.grantPistol(48);dinerComplete(run.g);
 writeSave(run.g,run.g.missions);const saved=loadSave();assert.equal(saved.dinerRobberyDay,0);assert.equal(saved.robberyDay,-1);
 const restored=dinerFixture(saved);assert.equal(restored.g.dinerRobbery.lastDay,0);restored.g.grantPistol(48);
 const cash=restored.g.player.cash;dinerStep(restored.g);
 assert.equal(restored.g.dinerRobbery.phase,'idle');assert.equal(restored.g.notice,'TILL EMPTY · COME BACK TOMORROW');assert.equal(restored.g.player.cash,cash);assert.equal(restored.g.crimes.length,0);
 restored.g.clockMinutes=1440+555;dinerStep(restored.g);assert.equal(restored.g.dinerRobbery.phase,'holdup');
 assert.equal(SAVE_VERSION,1);
 data.set('coral-bay-heat-save',JSON.stringify({version:1,cash:50,completed:[0,1],currentMission:2}));
 const legacy=loadSave();assert.equal(legacy.dinerRobberyDay,-1);assert.equal(createDinerRobberyState(legacy).lastDay,-1);
 console.log('B24-T8 One diner robbery per in-game day persists as dinerRobberyDay; legacy saves default to a full till: PASS');
}
{
 const {g}=dinerFixture();g.robbery=createRobberyState();g.grantPistol(48);
 dinerComplete(g);assert.equal(g.dinerRobbery.lastDay,0);assert.equal(g.robbery.lastDay,-1);assert.equal(g.crimes.length,1);
 const mart=martShops(world)[0];const martClerk={x:mart.x+20,y:mart.y,state:'walk',pause:0,panic:0};g.people=[martClerk];
 at(g,mart);robStep(g);assert.equal(g.robbery.phase,'holdup');
 robComplete(g);assert.equal(g.robbery.lastDay,0);assert.equal(g.dinerRobbery.lastDay,0);assert.equal(g.crimes.length,2);
 console.log('B24-T9 Mart and diner tills are independent: robbing one leaves the other open the same day: PASS');
}
{
 const {g,clerk}=dinerFixture();g.grantPistol(48);dinerComplete(g);
 assert.equal(g.crimes.length,1);
 updateWanted(g.wanted,world,g.player,g.crimes,[clerk],[],10,.1);
 assert.equal(g.wanted.stars,2);
 console.log('B24-T10 A witnessed diner robbery raises exactly two stars through the unmodified wanted math: PASS');
}
const {createGlow,updateGlow,glowAlpha,GLOW_COLORS,GLOW_INSTALL,GLOW_CYCLE}=await import('../src/glow.js');
function glowFixture(record){
 const g=fixture(record);g.glow=createGlow(record);
 const garage=sprayGarages(world)[0];
 at(g,garage,true);g.vehicle.speed=0;g.vehicle.health=100;g.player.cash=1000;
 return {g,garage};
}
function glowStep(g,dt=.1){g.playSeconds+=dt;updateSpray(g,dt);updateGlow(g.glow,g,dt);}
{
 const {g}=glowFixture();
 for(let i=0;i<9;i++)glowStep(g);
 assert.equal(g.glow.color,0);assert.equal(g.player.cash,1000-GLOW_INSTALL);assert.equal(g.glow.dirty,true);
 writeSave(g,g.missions);const saved=loadSave();assert.equal(saved.glow,0);assert.equal(createGlow(saved).color,0);
 assert.equal(SAVE_VERSION,1);
 data.set('coral-bay-heat-save',JSON.stringify({version:1,cash:50,completed:[0,1],currentMission:2}));
 assert.equal(loadSave().glow,-1);assert.equal(createGlow(loadSave()).color,-1);
 console.log('B23-T1 Underglow purchase charges $200, persists in the save, legacy saves default off: PASS');
}
{
 const {g,garage}=glowFixture();
 const enter=()=>{at(g,garage,true);g.vehicle.speed=0;for(let i=0;i<9;i++)glowStep(g);};
 const leave=()=>{at(g,{x:garage.x,y:garage.y+400},true);glowStep(g);};
 enter();assert.equal(g.glow.color,0);let cash=g.player.cash;
 leave();enter();assert.equal(g.glow.color,1);assert.equal(g.player.cash,cash-GLOW_CYCLE);cash=g.player.cash;
 leave();enter();assert.equal(g.glow.color,2);assert.equal(g.player.cash,cash-GLOW_CYCLE);cash=g.player.cash;
 leave();enter();assert.equal(g.glow.color,-1);assert.equal(g.player.cash,cash-GLOW_CYCLE);cash=g.player.cash;
 leave();enter();assert.equal(g.glow.color,0);assert.equal(g.player.cash,cash-GLOW_CYCLE);
 assert.deepEqual(GLOW_COLORS.map(c=>c.name),['CYAN','MAGENTA','LIME']);
 console.log('B23-T2 Repeat visits cycle cyan, magenta, lime, off, cyan at $50 per change: PASS');
}
{
 const {g}=glowFixture();g.vehicle.health=40;
 assert.equal(updateGlow(g.glow,g,.1),false);assert.equal(g.glow.color,-1);
 glowStep(g);
 assert.equal(g.vehicle.health,100);assert.equal(g.player.cash,1000-150);assert.equal(g.glow.color,-1);
 const w=glowFixture();setWanted(w.g.wanted,2,w.g.player);
 assert.equal(updateGlow(w.g.glow,w.g,.1),false);assert.equal(w.g.glow.color,-1);
 console.log('B23-T3 A damaged or wanted car takes the respray path, never the underglow: PASS');
}
{
 assert.equal(glowAlpha(720),0.18);
 assert(glowAlpha(1040)>0.5);assert(glowAlpha(1040)>glowAlpha(720));
 assert(glowAlpha(0)>glowAlpha(1040));
 console.log('B23-T4 Underglow intensity follows the headlight dusk curve: PASS');
}
{
 assert(glowAlpha(1100)>glowAlpha(1040));assert(glowAlpha(1100)<glowAlpha(0));
 console.log('B24-T2 The brief-24 dusk cover clock deepens the underglow past the old 1040 staging: PASS');
}
{
 const {g,garage}=glowFixture();
 const enter=()=>{at(g,garage,true);g.vehicle.speed=0;for(let i=0;i<9;i++)glowStep(g);};
 const leave=()=>{at(g,{x:garage.x,y:garage.y+400},true);glowStep(g);};
 enter();leave();enter();leave();enter();leave();enter();
 assert.equal(g.glow.color,-1);assert.equal(g.glow.installed,true);
 writeSave(g,g.missions);const saved=loadSave();
 assert.equal(saved.glow,-1);assert.equal(saved.glowInstalled,true);
 const restored=glowFixture(saved);
 assert.equal(restored.g.glow.installed,true);assert.equal(restored.g.glow.color,-1);
 at(restored.g,garage,true);restored.g.vehicle.speed=0;
 for(let i=0;i<9;i++)glowStep(restored.g);
 assert.equal(restored.g.glow.color,0);assert.equal(restored.g.player.cash,1000-GLOW_CYCLE);
 console.log('B23-T1b The installed flag persists: cycling back on after a reload costs $50, not $200: PASS');
}

const {createAlarmState,maybeAlarm,updateAlarms,ALARM_TIME,ALARM_RANGE}=await import('../src/alarms.js');
function alarmFixture(){
 const g=fixture();g.alarms=createAlarmState();g.crimes=[];
 g.report=(type,x,y,severity,violent)=>{const crime={type,x,y,severity,violent};g.crimes.push(crime);return crime;};
 return g;
}
function alarmCar(x=1000,y=1000,driver='parked'){return createCar(x,y,0,1,'#777',driver);}
{
 const g=alarmFixture();g.alarms.rng=()=>0.1;
 const car=alarmCar();assert.equal(maybeAlarm(g.alarms,car,g),true);
 assert.equal(car.alarmT,ALARM_TIME);assert.equal(g.alarms.active.length,1);
 assert(g.popups.list.some(e=>e.life>0&&e.text==='ALARM'));
 const quiet=alarmFixture();quiet.alarms.rng=()=>0.9;
 assert.equal(maybeAlarm(quiet.alarms,alarmCar(),quiet),false);assert.equal(quiet.alarms.active.length,0);
 const gx=alarmFixture();gx.alarms.rng=()=>0;
 assert.equal(maybeAlarm(gx.alarms,alarmCar(1000,1000,'traffic-driven'),gx),false);
 const cop=alarmCar();cop.police=true;assert.equal(maybeAlarm(gx.alarms,cop,gx),false);
 const busCar=alarmCar();busCar.bus=true;assert.equal(maybeAlarm(gx.alarms,busCar,gx),false);
 const rival=alarmCar();gx.missions.rival=rival;assert.equal(maybeAlarm(gx.alarms,rival,gx),false);
 const raceRival=alarmCar();gx.race.rival=raceRival;assert.equal(maybeAlarm(gx.alarms,raceRival,gx),false);
 const gd=alarmFixture();let hits=0;
 for(let i=0;i<200;i++){if(maybeAlarm(gd.alarms,alarmCar(500+i,500),gd))hits++;}
 assert(hits>=55&&hits<=95);
 console.log('B23-T6 Alarm fires on the seeded ~35% of parked entries and never for traffic, police, bus or rival cars: PASS');
}
{
 const g=alarmFixture();g.alarms.rng=()=>0.1;
 const car=alarmCar(2000,2000);g.vehicle=car;Object.assign(g.player,{x:2000,y:2000});
 assert.equal(maybeAlarm(g.alarms,car,g),true);
 for(let i=0;i<45;i++)updateAlarms(g.alarms,g,g.report,.1);
 assert.equal(g.crimes.length,1);assert.equal(g.crimes[0].type,'vehicle_theft');assert.equal(g.crimes[0].severity,1);assert.equal(g.crimes[0].violent,false);
 assert.equal(car.alarmT,0);assert.equal(car.alarmDone,true);
 const far=alarmFixture();far.alarms.rng=()=>0.1;
 const car2=alarmCar(2000,2000);far.vehicle=car2;Object.assign(far.player,{x:2000,y:2000});
 assert.equal(maybeAlarm(far.alarms,car2,far),true);
 car2.x+=ALARM_RANGE+80;far.player.x=car2.x;
 for(let i=0;i<45;i++)updateAlarms(far.alarms,far,far.report,.1);
 assert.equal(far.crimes.length,0);assert.equal(car2.alarmDone,true);
 console.log('B23-T7 Alarm reports the theft only when the car is still near the scene after 4 s: PASS');
}
{
 const g=alarmFixture();g.alarms.rng=()=>0.1;
 const car=alarmCar(2000,2000);g.vehicle=car;Object.assign(g.player,{x:2000,y:2000});
 assert.equal(maybeAlarm(g.alarms,car,g),true);
 for(let i=0;i<45;i++)updateAlarms(g.alarms,g,g.report,.1);
 g.alarms.rng=()=>0;
 assert.equal(maybeAlarm(g.alarms,car,g),false);
 console.log('B23-T8 A resolved alarm never re-triggers on the same car: PASS');
}
