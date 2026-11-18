import { ECONOMY } from './config.js';
import { MODELS, createCar } from './vehicles.js';
import { setWanted } from './wanted.js';
import { writeSave } from './save.js';
import { spawnPopup } from './popups.js';
import { awardRep, REP_MISSION, REP_TAXI, REP_COLLECTIBLE, REP_DEPOSIT } from './rep.js';
import { startRace, raceStartPoint } from './race.js';
import { startRampage, rampageStartPoint } from './rampage.js';

export const MISSIONS = [
  { id:'first-shift', name:'First Shift', reward:ECONOMY.firstShift, time:240 },
  { id:'borrowed-wheels', name:'Borrowed Wheels', reward:ECONOMY.borrowedWheels, time:300 },
  { id:'the-envelope', name:'The Envelope', reward:ECONOMY.envelope, time:300 },
  { id:'night-deposit', name:'Night Deposit', reward:ECONOMY.nightDeposit, time:360 },
  { id:'sunrise-run', name:'Sunrise Run', reward:ECONOMY.sunriseRun, time:120 },
  { id:'pier-escape', name:'Pier Escape', reward:ECONOMY.pierEscape, time:360 },
];
const point=(x,y)=>({x,y});
const pop=(g,x,y,text,color)=>spawnPopup(g.popups,x,y,text,color);
export function createMissionState(save=null) {
  const completed=[...(save?.completed||[])];
  return { completed, currentMission:save?.currentMission??completed.length, collectibles:[...(save?.collectibles||[])], bestTimes:{...(save?.bestTimes||{})}, taxiFares:save?.taxiFares||0, totalEarned:save?.totalEarned||0, activity:null, dialogue:null, retry:false, completion:null, completedFinaleScreen:false, storyElapsed:save?.storyElapsed||0, umbrellas: Array.from({length:12},(_,i)=>point(250+i*345,3160+(i%3)*42)), taxiTarget:null, rival:null, courier:null, van:null, stop:0, elapsed:0, phase:'diner', marker:null, objective:'Meet Lena Marsh at the Marlin Diner' };
}
function say(speaker, lines, done=null) { return {speaker,lines,index:0,done}; }
function setTask(s,text,target) { s.objective=text;s.marker=target; }
function diner(g){return g.world.spawnPoints.diner;}
function cash(g,s,amount){g.player.cash+=amount;s.totalEarned+=amount;}
function begin(s,g,index){
  if(s.retry){g.clearWanted?.();g.player.health=100;g.entering=null;}
  cleanupMissionEntities(s,g);
  s.owner=g;s.attemptPistol=!!g.combat.pistol;
  s.currentMission=index;s.elapsed=0;s.retry=false;s.activity='mission';s.phase='start';s.rival=null;s.scoreRun=s.scoreRun||false;s.marker=diner(g);s.objective=`Meet Lena at the Marlin Diner · ${MISSIONS[index].name}`;
  const lines=[['Lena','You made it. Coral Bay always needs one more reliable pair of hands.'],['Lena','Bring me a convertible in decent shape. The garage is expecting it.'],['Lena','A courier has an envelope by General. Bring it straight back. And take this.'],['Lena','Three deposits, three ATMs. Keep moving and keep your head down.'],['Lena','Get me to the marina before sunrise. The whole city is looking for us.'],['Lena','One last run. Every badge in the bay will be watching. Hit the checkpoints and finish at the pier — do not stop for anyone.'],];
  if(index===2&&!g.combat.pistol){g.grantPistol(48);}
  if(index===4){g.clockMinutes=5*60+20;setWanted(g.wanted,4,g.player);g.wanted.lastCrime=g.playSeconds;}
  if(index===5){setWanted(g.wanted,3,g.player);g.wanted.lastCrime=g.playSeconds;}
  s.dialogue=say('Lena',[lines[index][1]],()=>startStep(s,g));
}
function success(s,g,index){
  const def=MISSIONS[index],elapsed=s.elapsed;
  const bonus=index===3?Math.max(0,Math.round((1-elapsed/def.time)*500)):0;
  const reward=def.reward+bonus;cash(g,s,reward);s.splash={name:def.name,reward,total:g.player.cash,until:(g.playSeconds||0)+2.8};const f=g.vehicle||g.player;pop(g,f.x,f.y-44,`+$${reward}`,'#8df0a5');s.completed=Array.from(new Set([...s.completed,index]));
  const timeKey=s.scoreRun?`${def.id}-replay`:def.id;
  s.bestTimes[timeKey]=Math.min(s.bestTimes[timeKey]??Infinity,elapsed);s.currentMission=s.scoreRun?s.resumeMission:Math.min(6,index+1);s.activity=null;s.retry=false;s.marker=diner(g);s.objective=index===5?'Story complete · Free roam in Coral Bay':index===4?'Meet Lena at the Marlin Diner · One last job':'Meet Lena at the Marlin Diner for the next job';
  cleanupMissionEntities(s,g);s.scoreRun=false;awardRep(g, REP_MISSION);g.save=writeSave(g,s);
  s.dialogue=say((index===4||index===5)?'Dario':'Lena',[index===5?`The pier, the sunrise, and $${reward.toLocaleString()}. Coral Bay never caught us.`:index===4?`We made it. $${reward.toLocaleString()} for the run. The rest is ours to decide.`:`Clean work. $${reward.toLocaleString()} is yours. I have another job when you are ready.`,],()=>{if(index===4||index===5)s.phase='free-roam';});
  if(index===4&&!s.completedStoryScreen)s.completion={earnings:s.totalEarned,time:s.storyElapsed,shown:false};
  if(index===5&&!s.completedFinaleScreen)s.completion={earnings:s.totalEarned,time:s.storyElapsed,shown:false,title:'PIER ESCAPE · STORY COMPLETE'};
}
export function failMission(s,reason){if(s.activity!=='mission')return;if(s.owner){cleanupMissionEntities(s,s.owner);if(!s.attemptPistol){Object.assign(s.owner.combat,{pistol:false,weapon:'fists',ammo:0,reserve:0});}}s.activity=null;s.retry=true;s.phase='retry';s.marker=s.owner?diner(s.owner):null;s.objective=`${MISSIONS[s.currentMission]?.name||'Mission'} failed · Press E to retry` ;s.dialogue=say('Lena',[reason,'Meet me back at the diner when you are ready.']);}
function cleanupMissionEntities(s,g){
  if(s.generatedConvertible){if(g.vehicle===s.generatedConvertible){g.player.x=g.vehicle.x;g.player.y=g.vehicle.y;g.vehicle=null;}const n=g.parkedCars?.indexOf(s.generatedConvertible);if(n>=0)g.parkedCars.splice(n,1);s.generatedConvertible=null;}
  if(s.rival&&g.parkedCars){const n=g.parkedCars.indexOf(s.rival);if(n>=0)g.parkedCars.splice(n,1);}
  if(s.van){if(g.vehicle===s.van){g.player.x=s.van.x;g.player.y=s.van.y;g.vehicle=null;}const n=g.parkedCars?.indexOf(s.van);if(n>=0)g.parkedCars.splice(n,1);}
  s.rival=null;s.van=null;s.courier=null;s.targetCar=null;s.convertible=null;s.lenaCar=null;
}
function startStep(s,g){
  const i=s.currentMission;s.phase='active';s.elapsed=0;
  if(i===0){s.phase='package';setTask(s,'Deliver the package to the marina shore · on foot',g.world.spawnPoints.pier);}
  if(i===1){s.phase='car';s.targetCar=null;s.convertible=null;setTask(s,'Find a Solstice Convertible and deliver it to Marlin Auto Works',g.world.spawnPoints.garage);}
  if(i===2){s.phase='courier';s.courier=point(g.world.spawnPoints.hospital.x+72,g.world.spawnPoints.hospital.y+28);setTask(s,'Walk to the courier by General · E to collect',s.courier);s.rival=createCar(g.world.roads.vertical[1].x,g.world.roads.horizontal[1].y,0,1,'#b65158','rival');s.rival.driver='rival-driven';g.parkedCars.push(s.rival);}
  if(i===3){s.phase='deposit';s.stop=0;s.stops=[point(g.world.roads.vertical[1].x,g.world.roads.horizontal[2].y),point(g.world.roads.vertical[4].x,g.world.roads.horizontal[4].y),point(g.world.roads.vertical[6].x,g.world.roads.horizontal[1].y)];s.van=createCar(g.world.roads.vertical[2].x,g.world.roads.horizontal[5].y,0,4,'#f1e7ca');parkMissionCar(s,g,s.van);setTask(s,'Enter the marked van with E, then drive to ATM 1 of 3',s.van);}
  if(i===4){s.phase='pickup';setTask(s,'Collect Lena at the Marlin Diner',diner(g));}
  if(i===5){s.phase='escape';s.checkpoint=0;s.checkpoints=[point(g.world.roads.vertical[5].x,g.world.roads.horizontal[1].y),point(g.world.roads.vertical[7].x,g.world.roads.horizontal[3].y),point(g.world.roads.vertical[4].x,g.world.roads.horizontal[5].y),point(g.world.roads.vertical[1].x,g.world.roads.horizontal[2].y),point(g.world.spawnPoints.pier.x,g.world.spawnPoints.pier.y)];setTask(s,'Pier Escape · checkpoint 1 of 5',s.checkpoints[0]);}
}
function parkMissionCar(s,g,car){g.parkedCars.push(car);}
function near(g,p,r=48){const f=g.vehicle||g.player;return Math.hypot(f.x-p.x,f.y-p.y)<r;}
function activeStep(s,g,dt,parked){
  const i=s.currentMission;s.elapsed+=dt;
  if(s.elapsed>MISSIONS[i].time){failMission(s,'The window closed. The job is gone for now.');return;}
  if(i===0&&!g.vehicle&&near(g,s.marker,62))success(s,g,i);
  if(i===1){if(s.phase==='car'){
    const c=g.vehicle;
    if(c?.health>0&&c?.model?.name===MODELS[3].name){s.targetCar=c;s.convertible=c;s.phase='garage';setTask(s,'Bring the Solstice Convertible to Marlin Auto Works',g.world.spawnPoints.garage);}
    else if(!s.convertible||s.convertible.health<=0||!parked.includes(s.convertible)){s.convertible=parked.find(car=>car.model.name===MODELS[3].name&&car.health>0);if(!s.convertible||s.convertible.health<=0||!parked.includes(s.convertible)){s.convertible=createCar(g.world.roads.vertical[2].x+70,g.world.roads.horizontal[3].y-45,0,3,'#e77d63','parked');parked.push(s.convertible);s.generatedConvertible=s.convertible;}setTask(s,'Find the marked Solstice Convertible',s.convertible);}
  }else if(s.phase==='garage'){
    if(!s.targetCar||s.targetCar.health<=0){failMission(s,'The convertible is wrecked. Return to the diner to retry.');return;}
    if(g.vehicle===s.targetCar&&near(g,g.world.spawnPoints.garage,85)){if(s.targetCar.health<35)failMission(s,'That convertible is too beat up to hand over.');else success(s,g,i);}
  }}
  if(i===2){if(s.phase==='courier'&&!g.vehicle&&near(g,s.courier,55)&&g.interacting){s.phase='return';setTask(s,'Get the envelope back to Lena at the diner',diner(g));s.dialogue=say('Courier',['You did not get this from me. If anybody asks, I was never here.']);}else if(s.phase==='return'&&!g.vehicle&&near(g,diner(g),65))success(s,g,i);}
  if(i===3&&g.vehicle===s.van)s.marker=s.stops[s.stop];
  if(i===3&&s.van?.health<=0){failMission(s,'The deposit van is wrecked. Return to the diner to retry.');return;}
  if(i===3&&g.vehicle===s.van&&near(g,s.stops[s.stop],72)){s.stop++;awardRep(g, REP_DEPOSIT);if(s.stop===3)success(s,g,i);else {setTask(s,`Drive to ATM ${s.stop+1} of 3`,s.stops[s.stop]);pop(g,s.van.x,s.van.y-44,`DEPOSIT ${s.stop}/3`,'#ffe16d');g.wanted.heat=Math.min(125,g.wanted.heat+25);g.wanted.stars=Math.min(5,Math.ceil(g.wanted.heat/25));g.wanted.lastCrime=g.playSeconds;}}
  if(i===4){if(s.phase==='pickup'&&g.vehicle)s.phase='await-car';if(s.phase==='pickup'&&near(g,diner(g),60)&&!g.vehicle){s.phase='await-car';setTask(s,'Get in a car, then return to Lena at the diner',diner(g));}else if(s.phase==='await-car'&&g.vehicle&&near(g,diner(g),60)){s.phase='final';s.lenaCar=g.vehicle;setTask(s,'Drive Lena to the marina pier before sunrise',g.world.spawnPoints.pier);s.dialogue=say('Lena',['I knew you would come. Keep the wheels turning.']);}else if(s.phase==='final'){if(!s.lenaCar||s.lenaCar.health<=0){failMission(s,'The car is gone. Lena cannot make the run on foot.');return;}if(g.vehicle!==s.lenaCar){s.phase='await-car';setTask(s,'Get back in Lena’s car',g.world.spawnPoints.diner);return;}if(near(g,g.world.spawnPoints.pier,72))success(s,g,i);}}
  if(i===5&&g.vehicle&&near(g,s.checkpoints[s.checkpoint],78)){s.checkpoint++;const n=s.checkpoint;if(n>=s.checkpoints.length)success(s,g,i);else{setTask(s,`Pier Escape · checkpoint ${n+1} of 5`,s.checkpoints[n]);pop(g,g.vehicle.x,g.vehicle.y-44,`CHECKPOINT ${n}/5`,'#ffe16d');if(n===2)setWanted(g.wanted,4,g.player);if(n===4)setWanted(g.wanted,5,g.player);if(n===2||n===4)g.wanted.lastCrime=g.playSeconds;}}
}
export function updateMissions(s,g,dt,input,parked,traffic){
  g.parkedCars=parked;
  if(s.currentMission<6&&!s.scoreRun&&!s.completion)s.storyElapsed+=dt;
  g.interacting=false;
  if(s.completion){if(!s.dialogue&&input.wasPressed('KeyE')){s.completion=null;s.completedStoryScreen=true;s.completedFinaleScreen=true;return;}else if(!s.dialogue)return;}
  for(let i=0;i<s.umbrellas.length;i++)if(!g.vehicle&&!s.collectibles.includes(i)&&near(g,s.umbrellas[i],25)){s.collectibles.push(i);pop(g,s.umbrellas[i].x,s.umbrellas[i].y-30,`COLLECTIBLE ${s.collectibles.length}/12`,'#7be3f0');awardRep(g, REP_COLLECTIBLE);g.save=writeSave(g,s);}
  if(s.dialogue){if(input.wasPressed('KeyE')||g.dialogueClick){g.dialogueClick=false;s.dialogue.index++;if(s.dialogue.index>=s.dialogue.lines.length){const d=s.dialogue.done;s.dialogue=null;if(d)d();}}return;}
  if(s.retry&&s.activity!=='rampage'&&!g.vehicle&&input.wasPressed('KeyE')&&near(g,diner(g),90)){begin(s,g,s.currentMission);return;}
  if(!s.activity&&!g.vehicle&&s.currentMission<6&&near(g,diner(g),58)&&input.wasPressed('KeyE')){begin(s,g,s.currentMission);return;}
  g.interacting=input.wasPressed('KeyE');
  if(!s.activity){updateActivities(s,g,dt,input,parked,traffic);return;}
  if(s.activity==='mission'&&(g.player.health<=0||g.police?.arrest>=1)){failMission(s,g.player.health<=0?'You were wasted.':'You were busted.');return;}
  if(s.activity==='race')return;
  if(s.activity==='rampage')return;
  if(s.activity==='mission'&&g.vehicle)g.vehicle.fuel=Math.max(g.vehicle.fuel??100,40);
  if(s.activity==='taxi'){updateActivities(s,g,dt,input,parked,traffic);return;}
  if(s.phase!=='start')activeStep(s,g,dt,parked);
}
function updateActivities(s,g,dt,input,parked,traffic){
  if(s.activity==='taxi'){
    if(s.phase==='pickup'&&g.vehicle&&near(g,s.taxiStart,55)){s.phase='destination';s.marker=s.taxiTarget;s.objective='Take the passenger to the marked destination';s.dialogue=say('Passenger',['Thanks for stopping. I am late for the marina.']);}
    else if(s.phase==='destination'&&g.vehicle&&near(g,s.taxiTarget,60)){const amount=Math.round(ECONOMY.taxiBase+Math.hypot(s.taxiTarget.x-s.taxiStart.x,s.taxiTarget.y-s.taxiStart.y)*ECONOMY.taxiPerUnit+Math.max(0,90-(s.elapsed||0))*2);cash(g,s,amount);pop(g,s.taxiTarget.x,s.taxiTarget.y-44,`+$${amount} FARE`,'#ffe16d');s.taxiFares++;awardRep(g, REP_TAXI);s.activity=null;s.marker=null;s.objective=`Fare complete · $${amount}`;s.dialogue=say('Dispatcher',[`Fare paid: $${amount}. Your next call is waiting.`]);}s.elapsed=(s.elapsed||0)+dt;return;
  }
  if(near(g,g.world.spawnPoints.garage,80)){s.objective='Marlin Auto Works · 1 repair';}
  if(!g.vehicle&&near(g,diner(g),75)){s.objective=s.currentMission>=5?'Marlin Diner · 1 taxi / 2 armour / 3 payphone replay':'Marlin Diner · 1 taxi / 2 armour / 3 payphone replay';}
  const raceStart=raceStartPoint(g.world);if(near(g,raceStart,95)){s.objective=g.vehicle?'Beach Road · 4 STREET RACE':'Beach Road · STREET RACE — bring a car, press 4';if(g.vehicle&&input.wasPressed('Digit4')&&g.race)startRace(g.race,g);}
  const rampageStart=rampageStartPoint(g.world);if(near(g,rampageStart,95)){s.objective=g.vehicle?'Downtown · 5 RAMPAGE':'Downtown · RAMPAGE — bring a car, press 5';if(g.vehicle&&input.wasPressed('Digit5')&&g.rampage)startRampage(g.rampage,g);}
  if(near(g,g.world.spawnPoints.garage,80)&&g.vehicle&&input.wasPressed('Digit1')&&g.player.cash>=ECONOMY.repair){g.player.cash-=ECONOMY.repair;g.vehicle.health=100;s.objective='Vehicle repaired';}
  else if(!g.vehicle&&near(g,diner(g),75)&&input.wasPressed('Digit2')&&g.player.cash>=ECONOMY.armour){g.player.cash-=ECONOMY.armour;g.player.armour=100;s.objective='Armour refilled';}
  if(!g.vehicle&&near(g,diner(g),75)&&input.wasPressed('Digit1'))startTaxi(s,g);
  else if(!g.vehicle&&near(g,diner(g),75)&&input.wasPressed('Digit3')&&s.completed.length){s.resumeMission=s.currentMission;s.scoreRun=true;begin(s,g,s.completed[s.completed.length-1]);}
}
export function drawMissionWorld(ctx,s,g,time){
  const marker=s.activity==='rampage'?null:s.marker;
  if(marker){const pulse=1+Math.sin(time*.005)*.12;ctx.save();ctx.strokeStyle='#ffe16dcc';ctx.fillStyle='#ffe16d22';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(marker.x,marker.y+4,29*pulse,13*pulse,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.32+Math.sin(time*.004)*.08;ctx.fillStyle='#ffdc62';ctx.beginPath();ctx.moveTo(marker.x-12,marker.y);ctx.lineTo(marker.x+12,marker.y);ctx.lineTo(marker.x+5,marker.y-100);ctx.lineTo(marker.x-5,marker.y-100);ctx.closePath();ctx.fill();ctx.restore();}
  for(let i=0;i<s.umbrellas.length;i++)if(!s.collectibles.includes(i)){const p=s.umbrellas[i];ctx.fillStyle='#e85f51';ctx.fillRect(p.x-10,p.y-4,20,5);ctx.fillStyle='#fff0d2';ctx.beginPath();ctx.arc(p.x,p.y-4,11,Math.PI,Math.PI*2);ctx.fill();}
}
export function startTaxi(s,g){s.activity='taxi';s.phase='pickup';s.elapsed=0;s.taxiStart=point(g.world.spawnPoints.hospital.x+40,g.world.spawnPoints.hospital.y);s.taxiTarget=point(g.world.spawnPoints.pier.x-200,g.world.spawnPoints.pier.y);s.marker=s.taxiStart;s.objective='Taxi dispatch: pick up the flagged passenger by Coral Bay General';s.dialogue=say('Dispatcher',['A fare is waiting near General. Marina drop-off. Keep the meter honest.']);}
