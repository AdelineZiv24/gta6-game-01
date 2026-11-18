import { createWanted, updateWanted, clearWanted, setWanted } from './wanted.js';
import { createPolice, spawnPolice, updatePolice, drawOfficers } from './police.js';
import { createCombat, grantPistol, updateCombat, policeFire, damagePlayer, drawCombat } from './combat.js';
import { WORLD } from './config.js';
import { createWorld } from './world.js';
import { createRenderer, drawMinimapBase } from './render.js';
import { createInput } from './input.js';
import { createPlayer, updatePlayer, drawPlayer } from './player.js';
import { drawHUD } from './hud.js';
import { createCar, modelByName, setupParkedCars, updateCar, drawCar, resolveCarContacts } from './vehicles.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPedestrians, updatePedestrians, drawPedestrian, addFleeingPedestrian } from './pedestrians.js';
import { createMissionState, updateMissions, drawMissionWorld, failMission } from './missions.js';
import { loadSave, writeSave, hasSave } from './save.js';
import { createAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const world = createWorld(WORLD.seed);
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();
const minimap = document.createElement('canvas');
minimap.width = 864; minimap.height = 720; drawMinimapBase(minimap, world);
const shot = new URLSearchParams(location.search).get('shot');
export const game = {
  shot, state: 'menu', world, player: createPlayer(world.spawnPoints.player), minimap,
  objective: { text: 'Meet Lena Marsh at the Marlin Diner', position: world.spawnPoints.diner },
  clockMinutes: 9 * 60 + 15, playSeconds: 0,
  save: loadSave(), missions: null, input,
  width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio || 1,
  audio,
};
canvas.addEventListener('pointerdown',()=>{audio.unlock();if(game.missions?.dialogue)game.dialogueClick=true;});
window.addEventListener('keydown', event => { audio.unlock(); if (event.code === 'KeyM' && !event.repeat) audio.toggleMute(); });
// Public integration contract for the police/combat step. Time is playing seconds.
game.wanted=createWanted();game.police=createPolice();game.combat=createCombat();
game.grantPistol=(rounds)=>grantPistol(game,rounds);
game.clearWanted=()=>{clearWanted(game.wanted,game.crimeSequence);game.police.arrest=0;};
game.recentCrimes = []; game.crimeSequence = 0;
export function reportCrime(type, x, y, severity = 1, violent = false) {
  const crime = { id: ++game.crimeSequence, type, x, y, time: game.playSeconds, severity, violent };
  game.recentCrimes.push(crime);
  if (game.recentCrimes.length > 128) game.recentCrimes.shift();
  return crime;
}
let parked = setupParkedCars(world), traffic = createTraffic(world,game.player), pedestrians = createPedestrians(world,game.player);
const allCars = [];
function collectCars() {
  allCars.length=0;
  for(const car of parked) allCars.push(car);
  for(const car of traffic.cars) allCars.push(car);
  for(const unit of game.police.units)allCars.push(unit.car);
  if(game.vehicle && !allCars.includes(game.vehicle)) allCars.push(game.vehicle);
  if(game.missions?.rival&&!allCars.includes(game.missions.rival))allCars.push(game.missions.rival);
}
function freeExit(car) {
  let best=null,bestDistance=Infinity;
  for(let ring=0;ring<3;ring++)for(let side=0;side<8;side++){
    const angle=car.heading+Math.PI/2+side*Math.PI/4,r=car.model.length/2+18+ring*14;
    const x=car.x+Math.cos(angle)*r,y=car.y+Math.sin(angle)*r;
    if(world.collidesCircle(x,y,12)||y+12>=world.water.y)continue;
    let occupied=false;for(const other of allCars)if(other!==car&&Math.hypot(x-other.x,y-other.y)<other.model.length/2+12)occupied=true;
    if(!occupied&&r<bestDistance){best={x,y};bestDistance=r;}
  }return best;
}
function enterCar(car) {
  const hijack=car.driver==='traffic-driven';
  if(car.police){const crime=reportCrime('police_hit',car.x,car.y,4,true);crime.againstPolice=true;}
  if(hijack){addFleeingPedestrian(pedestrians,car.x+Math.sin(car.heading)*35,car.y-Math.cos(car.heading)*35);const index=traffic.cars.indexOf(car);if(index>=0)traffic.cars.splice(index,1);parked.push(car);}
  reportCrime(hijack?'carjacking':'vehicle_theft',car.x,car.y,hijack?2:1,hijack);
  car.driver='player-driven';car.disabled=0;car.abandoned=false;game.vehicle=car;game.entering=null;game.player.vx=game.player.vy=0;
}
function interact() {
  if(game.entering){game.entering=null;return;}
  if(game.vehicle){
    if(Math.abs(game.vehicle.speed)>35){game.notice='Slow down to get out';game.noticeUntil=game.playSeconds+2;return;}
    const spot=freeExit(game.vehicle);if(!spot){game.notice='No room to get out';game.noticeUntil=game.playSeconds+2;return;}
    game.player.x=game.player.previousX=spot.x;game.player.y=game.player.previousY=spot.y;
    game.vehicle.driver='parked';game.vehicle.speed=game.vehicle.vx=game.vehicle.vy=0;game.vehicle=null;return;
  }
  let nearest=null,dist=65;
  for(const car of allCars){const d=Math.hypot(car.x-game.player.x,car.y-game.player.y);if(car!==game.missions?.rival&&!car.police&&car.health>0&&d<dist&&Math.abs(car.speed)<120){nearest=car;dist=d;}}
  if(nearest)game.entering={car:nearest,remaining:nearest.driver==='traffic-driven'?.35:.7};
}
function finishOutcome(kind){
  if(game.outcome)return;
  const bill=Math.min(game.player.cash,Math.ceil(game.player.cash*(kind==='busted'?.15:.1))+(kind==='busted'?50:75));
  game.player.cash-=bill;game.outcome={kind,bill};game.audio?.effect(kind==='busted'?'busted':'hospital');game.entering=null;if(game.missions?.activity==='mission')failMission(game.missions,kind==='busted'?'The police got you. Lena says to come back when you are ready.':'You are in the hospital. The job can wait.');setState(kind);
}
function respawn(){
  const spot=world.spawnPoints[game.outcome.kind==='busted'?'police':'hospital'];
  if(game.vehicle){game.vehicle.driver='parked';game.vehicle.speed=game.vehicle.vx=game.vehicle.vy=0;game.vehicle=null;}
  Object.assign(game.player,{x:spot.x,y:spot.y,previousX:spot.x,previousY:spot.y,vx:0,vy:0,health:100,armour:0,carriedItem:null,missionItem:null});
  game.carriedItem=null;game.missionCriticalItem=null;game.clearWanted();game.police=createPolice();game.combat.lastDamage=game.playSeconds;game.combat.flash=game.combat.shake=0;game.combat.effects=[];game.outcome=null;input.reset();
  if(game.missions?.retry){game.missions.objective='Meet Lena at the diner to retry';game.missions.marker=world.spawnPoints.diner;}
  renderer.camera.x=spot.x;renderer.camera.y=spot.y;renderer.camera.clamp();collectCars();setState('playing');
}
window.addEventListener('keydown',event=>{if(game.outcome&&!event.repeat){event.preventDefault();respawn();}});
let helpReturn = 'menu';
function setState(state) {
  if(state==='paused'&&game.missions){game.save=writeSave(game,game.missions);document.getElementById('progress').textContent=`Jobs ${game.missions.completed.length}/5 · Umbrellas ${game.missions.collectibles.length}/12 · Taxi fares ${game.missions.taxiFares} · Total earned $${game.missions.totalEarned.toLocaleString()} · Best ${Object.entries(game.missions.bestTimes).map(([k,v])=>`${k}: ${Math.floor(v/60)}:${String(Math.floor(v%60)).padStart(2,'0')}`).join(', ')||'none'}`;}
  game.state = state;
  for (const [id, mode] of [['menu','menu'],['pause','paused'],['help','help']]) document.getElementById(id).hidden = state !== mode;
  document.getElementById('status').textContent = state === 'playing' ? 'Explore Coral Bay as Dario Venn.' : `${state} screen`;
  if (state !== 'playing') { game.player.vx = 0; game.player.vy = 0; }
  const focus = { menu:'new-game', paused:'resume', help:'close-help' }[state];
  if (focus) document.getElementById(focus).focus({ preventScroll:true });
}
function syncMenu(){document.getElementById('continue').disabled=!hasSave();}
function startGame(foot = false, record=null) {
  parked=setupParkedCars(world);
  const near=parked.reduce((a,b)=>Math.hypot(b.x-2100,b.y-1500)<Math.hypot(a.x-2100,a.y-1500)?b:a);
  const spawn = foot ? {x:near.x,y:near.y+36,heading:-Math.PI/2} : world.spawnPoints.player;
  game.player = createPlayer(spawn); game.playSeconds = 0; game.clockMinutes = 555;
  if(record){game.player.cash=record.cash; if(record.position){spawn.x=record.position.x;spawn.y=record.position.y;game.player.x=game.player.previousX=spawn.x;game.player.y=game.player.previousY=spawn.y;}}
  game.missions=createMissionState(record);game.save=record;
  game.missions.marker=game.missions.currentMission<5?world.spawnPoints.diner:null;
  if(game.missions.currentMission>=5)game.missions.objective='Story complete · Free roam in Coral Bay';
  game.objective={text:game.missions.objective,position:game.missions.marker};
  game.wanted=createWanted();game.police=createPolice();game.combat=createCombat();game.outcome=null;
  game.vehicle=null;game.entering=null;game.interactionRequested=false;game.noticeUntil=0;game.recentCrimes.length=0;
  if(shot==='drive'||shot==='chase'){
    const car=createCar(world.roads.vertical[3].x+180,world.roads.horizontal[3].y+20,0,3,'#e17c65','player-driven');
    parked.push(car);game.vehicle=car;game.player.x=spawn.x=car.x;game.player.y=spawn.y=car.y;
  }
  if(record?.pistolGranted)grantPistol(game,48);
  if(record?.currentCar){game.vehicle=createCar(record.currentCar.x,record.currentCar.y,record.currentCar.heading,modelByName(record.currentCar.model),record.currentCar.color,'player-driven');game.vehicle.health=record.currentCar.health;parked.push(game.vehicle);game.player.x=game.vehicle.x;game.player.y=game.vehicle.y;}
  traffic=createTraffic(world,game.player);pedestrians=createPedestrians(world,game.player);
  if(shot==='chase'){setWanted(game.wanted,3,game.vehicle);game.wanted.lastCrime=0;game.vehicle.speed=165;for(let i=0;i<2;i++){const u=spawnPolice(game.police,game.vehicle.x-115-i*105,game.vehicle.y+(i?20:-20),0);u.car.speed=180;}game.police.spawnTimer=5;}
  collectCars();
  renderer.camera.x = spawn.x; renderer.camera.y = spawn.y; renderer.camera.clamp();
  if(shot==='mission'){game.player.x=game.player.previousX=world.spawnPoints.diner.x+70;game.player.y=game.player.previousY=world.spawnPoints.diner.y;renderer.camera.x=game.player.x;renderer.camera.y=game.player.y;renderer.camera.clamp();game.missions.currentMission=0;game.missions.activity='mission';game.missions.phase='package';game.missions.elapsed=55;game.missions.marker=world.spawnPoints.pier;game.missions.objective='Deliver Lena’s package to the marina pier';game.missions.dialogue={speaker:'Lena',lines:['Take this across town to the pier. The marina guard knows to expect you.'],index:0};game.objective={text:game.missions.objective,position:game.missions.marker};}
  setState('playing');syncMenu();
}
function openHelp() { helpReturn = game.state; setState('help'); }
document.getElementById('new-game').onclick = () => { if(hasSave()&&!confirm('Overwrite your existing Coral Bay save?'))return; startGame(); };
document.getElementById('continue').onclick = () => {const record=loadSave();if(record)startGame(false,record);};
document.getElementById('resume').onclick = () => setState('playing');
document.getElementById('quit').onclick = () => {setState('menu');syncMenu();};
document.getElementById('menu-help').onclick = openHelp;
document.getElementById('pause-help').onclick = openHelp;
document.getElementById('close-help').onclick = () => setState(helpReturn);
function resize() {
  renderer.resize();
  game.width = innerWidth; game.height = innerHeight; game.pixelRatio = devicePixelRatio || 1;
  // Preserve world scale while filling any aspect ratio without letterboxing.
  const scale = Math.max(innerWidth / 1100, innerHeight / 720);
  renderer.camera.width = Math.min(WORLD.width, innerWidth / scale);
  renderer.camera.height = Math.min(WORLD.height, innerHeight / scale);
  renderer.camera.clamp();
}
window.addEventListener('resize', resize); resize();
window.addEventListener('blur', () => { if (game.state === 'playing' && !shot) setState('paused'); });
setState('menu');syncMenu(); if (shot === 'foot' || shot === 'drive' || shot === 'chase'||shot==='mission') startGame(true);
const STEP = 1 / 60;
let missionKeysConsumed=false;
const missionInput={wasPressed:code=>!missionKeysConsumed&&input.wasPressed(code)};
let lastTime, accumulator = 0;
function update(dt, time) {
  if (game.state === 'playing') {
    if(game.missions?.dialogue||game.missions?.completion){updateMissions(game.missions,game,dt,missionInput,parked,traffic);missionKeysConsumed=true;game.interactionRequested=false;game.objective={text:game.missions.objective,position:game.missions.marker};return;}
    collectCars();
    if(game.interactionRequested){interact();game.interactionRequested=false;}
    if(game.entering){
      const entry=game.entering;
      if(Math.hypot(entry.car.x-game.player.x,entry.car.y-game.player.y)>80)game.entering=null;
      else {entry.car.speed=0;entry.car.disabled=.1;entry.remaining-=dt;if(entry.remaining<=0)enterCar(entry.car);}
    }
    if (shot === 'chase' && game.vehicle) {
      const lane = world.roads.horizontal.reduce((best, road) => Math.abs(road.y - game.vehicle.y) < Math.abs(best.y - game.vehicle.y) ? road : best, world.roads.horizontal[0]);
      game.vehicle.y += (lane.y + 20 - game.vehicle.y) * Math.min(1, dt * 3);
      game.vehicle.heading = 0;
      game.vehicle.speed = 165;
      game.vehicle.vx = game.vehicle.speed;
      game.vehicle.vy = 0;
      if (game.vehicle.x > WORLD.width - 260) game.vehicle.x = world.roads.vertical[1].x;
      else game.vehicle.x += game.vehicle.speed * dt;
    } else if(game.vehicle)updateCar(game.vehicle,input,world,dt);
    else if(!game.entering)updatePlayer(game.player,input,world,dt);
    const focus=game.vehicle||game.player;
    updatePolice(game.police,game,world,renderer.camera,dt,u=>policeFire(game,world,u,allCars,pedestrians.people,reportCrime));
    updateTraffic(traffic,world,focus,allCars,pedestrians.people,dt,(x,y)=>addFleeingPedestrian(pedestrians,x,y));
    if(game.missions?.rival&&game.vehicle!==game.missions.rival&&game.missions.activity==='mission'&&!game.missions.dialogue){
      const rival=game.missions.rival,target=game.vehicle||game.player;
      if(rival.health<=0){rival.speed=rival.vx=rival.vy=0;}
      else {
        const xs=world.roads.vertical.map(r=>r.x),ys=world.roads.horizontal.map(r=>r.y);
        const closest=(values,v)=>values.reduce((a,b)=>Math.abs(b-v)<Math.abs(a-v)?b:a);
        if(!rival.waypoint||Math.hypot(rival.x-rival.waypoint.x,rival.y-rival.waypoint.y)<8){
          const x=closest(xs,rival.x),y=closest(ys,rival.y),tx=closest(xs,target.x),ty=closest(ys,target.y);
          rival.waypoint=x!==tx?{x:xs[xs.indexOf(x)+Math.sign(tx-x)],y}:{x,y:ys[ys.indexOf(y)+Math.sign(ty-y)]};
        }
        const p=rival.waypoint;
        rival.heading=Math.atan2(p.y-rival.y,p.x-rival.x);
        rival.driver='player-driven';
        updateCar(rival,{isDown:k=>k==='KeyW'&&Math.hypot(p.x-rival.x,p.y-rival.y)>8},world,dt);
        rival.driver='rival-driven';rival.speed=Math.min(rival.speed,145);
      }
    }
    collectCars();const carHealth=game.vehicle?.health;resolveCarContacts(allCars,reportCrime,game.playSeconds);if(game.vehicle?.impact>45)audio.effect('collision',game.vehicle.impact/220);
    if(game.vehicle&&carHealth>game.vehicle.health)damagePlayer(game,(carHealth-game.vehicle.health)*.65);
    updatePedestrians(pedestrians,world,focus,allCars,game.recentCrimes,dt,reportCrime);
    if(game.vehicle){game.player.x=game.vehicle.x;game.player.y=game.vehicle.y;game.player.facing=game.vehicle.heading;
      if(game.vehicle.impact>65&&game.vehicle.cooldown===0){reportCrime('reckless_crash',focus.x,focus.y,1,false);game.vehicle.cooldown=.8;}}

    if(game.vehicle&&game.vehicle.impact>65&&game.combat.lastCrashTime!==game.playSeconds){damagePlayer(game,game.vehicle.impact*.035);game.combat.lastCrashTime=game.playSeconds;}
    if(!game.vehicle)for(const car of allCars)if(Math.abs(car.speed)>65&&Math.hypot(car.x-game.player.x,car.y-game.player.y)<car.radius+10&&game.playSeconds-game.combat.lastDamage>.8)damagePlayer(game,Math.abs(car.speed)*.12);
    if(!game.missions?.dialogue&&!game.missions?.completion)updateCombat(game,world,input,renderer.camera,allCars,pedestrians.people,reportCrime,dt);
    if (shot !== 'chase') updateWanted(game.wanted,world,focus,game.recentCrimes,[...pedestrians.people,...traffic.cars.filter(c=>!c.abandoned)],game.police.units,game.playSeconds,dt);
    if(game.player.health<=0)finishOutcome('wasted');else if(game.police.arrest>=1)finishOutcome('busted');
    if(game.missions&&!game.outcome){const before=game.missions.completed.length,faresBefore=game.missions.taxiFares,itemsBefore=game.missions.collectibles.length,dialogueBefore=game.missions.dialogue?.index;updateMissions(game.missions,game,dt,missionInput,parked,traffic);missionKeysConsumed=true;if(game.missions.dialogue?.index!==dialogueBefore)audio.effect('dialogue');if(game.missions.completed.length>before||game.missions.taxiFares>faresBefore||game.missions.collectibles.length>itemsBefore){audio.effect(game.missions.taxiFares>faresBefore?'cash':'pickup');game.save=writeSave(game,game.missions);}game.objective={text:game.missions.objective,position:game.missions.marker};}
    if(game.player.health<=0)finishOutcome('wasted');else if(game.police.arrest>=1)finishOutcome('busted');
    if(game.recentCrimes.length>96){const floor=game.wanted.lastId-32;game.recentCrimes=game.recentCrimes.filter(c=>c.id>floor);}
    game.playSeconds += dt; if (shot !== 'start' && shot !== 'foot' && shot !== 'mission' && shot !== 'chase') game.clockMinutes += dt;
    audio.update(game, dt);
    const car=game.vehicle,look=car?car.speed*.3:0;
    renderer.camera.follow(focus.x+(car?Math.cos(car.heading)*look:0),focus.y+(car?Math.sin(car.heading)*look:0),1-Math.exp(-6*dt));
  } else if (game.state === 'menu' || (game.state === 'help' && helpReturn === 'menu')) {
    renderer.camera.x = WORLD.width / 2 + Math.sin(time / 45000) * 450;
    renderer.camera.y = 2200 + Math.cos(time / 55000) * 240;
    renderer.camera.clamp();
  }
}
function frame(time) {
  missionKeysConsumed=false;
  if(game.state==='playing'&&game.player.health<=0)finishOutcome('wasted');
  const elapsed = lastTime === undefined ? 0 : Math.min((time-lastTime)/1000,.1); lastTime = time;
  
  if (!game.outcome && input.anyPressed('Escape','KeyP')) {
    if(game.state==='help') setState(helpReturn);
    else if(game.state==='playing') setState('paused');
    else if(game.state==='paused') setState('playing');
  } else if(!game.outcome&&input.wasPressed('KeyH') && game.state!=='help') openHelp();
  if(game.state==='playing'&&input.wasPressed('KeyE')&&!game.missions?.dialogue&&!game.missions?.completion&&!(game.missions?.phase==='courier'&&!game.vehicle&&Math.hypot(game.player.x-game.missions.courier.x,game.player.y-game.missions.courier.y)<55)&&!(!game.vehicle&&!game.missions?.activity&&Math.hypot(game.player.x-world.spawnPoints.diner.x,game.player.y-world.spawnPoints.diner.y)<90))game.interactionRequested=true;
  accumulator += elapsed;
  while(accumulator>=STEP){update(STEP,time);accumulator-=STEP;}
  if (game.state !== 'playing') audio.update(game, elapsed);
  renderer.camera.shake=Math.max(game.vehicle?.shake||0,game.combat.shake);
  renderer.draw(world, null, time, game.clockMinutes);
  // WORLD ACTORS: draw cars and pedestrians here, then Dario; HUD always comes last.
  if(game.state!=='menu' && !(game.state==='help' && helpReturn==='menu')) {
    const camera=renderer.camera;
    for(const p of pedestrians.people)if(Math.abs(p.x-camera.x)<camera.width/2+40&&Math.abs(p.y-camera.y)<camera.height/2+40)drawPedestrian(ctx,p);
    for(const car of allCars)if(Math.abs(car.x-camera.x)<camera.width/2+60&&Math.abs(car.y-camera.y)<camera.height/2+60)drawCar(ctx,car,time);
    drawOfficers(ctx,game.police);
    if(game.missions)drawMissionWorld(ctx,game.missions,game,time);
    if(!game.vehicle)drawPlayer(ctx,game.player,accumulator/STEP);
    drawCombat(ctx,game);
    drawHUD(ctx,game);
  }
  input.endFrame(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
