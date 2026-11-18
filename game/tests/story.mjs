import assert from 'node:assert/strict';
import {createMissionState,updateMissions,failMission,startTaxi,MISSIONS,drawMissionWorld} from '../src/missions.js';
import {createWorld} from '../src/world.js';
import {createPlayer} from '../src/player.js';
import {createCar,carBlocked,resolveCarContacts} from '../src/vehicles.js';
import {createCombat,grantPistol} from '../src/combat.js';
import {createWanted} from '../src/wanted.js';
import {writeSave,loadSave} from '../src/save.js';
import {drawHUD} from '../src/hud.js';
const data=new Map();let writes=0;
globalThis.localStorage={getItem:k=>data.get(k)||null,setItem(k,v){writes++;data.set(k,v);}};
const world=createWorld();let key=null;
const input={wasPressed:k=>key===k,isDown:()=>false};
function fixture(record){const g={world,player:createPlayer(world.spawnPoints.diner),combat:createCombat(),wanted:createWanted(),playSeconds:0,clockMinutes:555,police:{arrest:0},vehicle:null,cars:[]};g.grantPistol=n=>grantPistol(g,n);g.clearWanted=()=>{g.police.arrest=0;g.wanted=createWanted();};g.missions=createMissionState(record);return g;}
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
const chain=fixture();for(let i=0;i<5;i++){begin(chain);finish(chain,i);assert.equal(chain.missions.currentMission,i+1);console.log(`${MISSIONS[i].id}: completion PASS`);}
assert(chain.missions.completion);tick(chain,'KeyE');assert.equal(chain.missions.completion,null);
for(let i=0;i<5;i++){for(const kind of ['timer','busted','wasted']){const g=fixture({currentMission:i});begin(g);if(kind==='timer')tick(g,null,MISSIONS[i].time+1);else {if(kind==='wasted')g.player.health=0;else g.police.arrest=1;tick(g);}assert(g.missions.retry);talk(g);begin(g);assert.equal(g.missions.elapsed,0);assert.equal(g.missions.currentMission,i);assert.equal(g.cars.filter(c=>c.driver==='rival-driven').length,i===2?1:0);finish(g,i);}console.log(`${MISSIONS[i].id}: timer/busted/wasted failure + retry PASS`);}
const a=fixture({currentMission:5,completed:[0,1,2,3,4]});a.player.cash=10000;startTaxi(a.missions,a);talk(a);at(a,a.missions.taxiStart,true);tick(a);talk(a);at(a,a.missions.taxiTarget,true);tick(a);assert.equal(a.missions.taxiFares,1);talk(a);at(a,world.spawnPoints.garage,true);a.vehicle.health=20;let cash=a.player.cash;tick(a,'Digit1');assert.equal(a.player.cash,cash-260);assert.equal(a.vehicle.health,100);at(a,world.spawnPoints.diner);cash=a.player.cash;tick(a,'Digit2');assert.equal(a.player.cash,cash-220);assert.equal(a.player.armour,100);at(a,a.missions.umbrellas[0]);tick(a);assert.deepEqual(a.missions.collectibles,[0]);at(a,world.spawnPoints.diner);tick(a,'Digit3');talk(a);finish(a,4);assert.equal(a.missions.currentMission,5);assert(a.missions.bestTimes['sunrise-run-replay']>=0);
chain.missions.collectibles=[1,3];writeSave(chain,chain.missions);const record=loadSave();assert.equal(record.cash,chain.player.cash);assert.deepEqual(record.completed,[0,1,2,3,4]);assert(record.pistolGranted);assert.deepEqual(record.collectibles,[1,3]);assert.deepEqual(record.bestTimes,chain.missions.bestTimes);const count=writes;chain.shot='mission';writeSave(chain,chain.missions);assert.equal(writes,count);
for(const p of [world.spawnPoints.pier,world.spawnPoints.diner,world.spawnPoints.garage,a.missions.taxiStart,a.missions.taxiTarget]){assert(!world.collidesCircle(p.x,p.y,12));assert(p.y+30<world.water.y);}
const ctx=new Proxy({measureText:t=>({width:t.length*7})},{get:(o,k)=>k in o?o[k]:(...args)=>{},set:(o,k,v)=>(o[k]=v,true)});Object.assign(chain,{width:1280,height:800,pixelRatio:1,minimap:{},objective:{text:'test'},vehicle:null});ctx.textAlign='center';drawHUD(ctx,chain);drawMissionWorld(ctx,chain.missions,chain,0);
console.log('Activities, replay, save round trip, shot isolation, marker geometry, stub canvas: PASS');

for(const i of [1,3,4]){const g=fixture({currentMission:i});begin(g);const s=g.missions;if(i===1){tick(g);g.vehicle=s.convertible;tick(g);s.targetCar.health=0;}if(i===3)s.van.health=0;if(i===4){tick(g);at(g,world.spawnPoints.diner,true);tick(g);talk(g);s.lenaCar.health=0;}tick(g);assert(s.retry);talk(g);begin(g);assert.equal(s.activity,'mission');}
const restored=fixture(record);assert.deepEqual(restored.missions.bestTimes,record.bestTimes);assert.deepEqual(restored.missions.collectibles,record.collectibles);
const c=createCar(100,100,0,0,'#777','player-driven'),r=createCar(120,100,0,1,'#a00','rival-driven');r.vx=-140;c.vx=100;resolveCarContacts([c,r],()=>({}),0);assert(c.health<100&&r.health<100);
console.log('Wrecked M2/M4/M5 retry, restored mission state, normal rival contact damage: PASS');

for(const [width,height] of [[1280,800],[800,600],[390,800],[640,360]]){
 const boxes=[],texts=[],st={textAlign:'center'};
 const canvas=new Proxy({measureText:t=>({width:t.length*7}),save(){},restore(){},setTransform(){},roundRect(x,y,w,h){boxes.push({x,y,w,h});},fillText(t,x,y){texts.push({t,x,y,align:st.textAlign});}},{get:(o,k)=>k in o?o[k]:st[k]??(()=>{}),set:(o,k,v)=>(st[k]=v,true)});
 const g=fixture();g.missions.dialogue={speaker:'Lena',lines:['A long dialogue line that should wrap and remain above every bottom panel and hint bar in Coral Bay.'],index:0};Object.assign(g,{width,height,pixelRatio:1,minimap:{},objective:{text:'Objective'}});drawHUD(canvas,g);
 const fit=Math.min(1,width/640,height/720),w=width/fit,h=height/fit;
 for(const b of boxes){assert(b.x>=19&&b.y>=19);assert(b.x+b.w<=w-19&&b.y+b.h<=h-19);}
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`HUD panel overlap at ${width}x${height}`);}
 assert.equal(texts.find(t=>t.t==='DARIO VENN').align,'left');
}
console.log('HUD safe bounds, panel separation, inherited name alignment at four viewport sizes: PASS');
