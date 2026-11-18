import { createCar, updateCar } from './vehicles.js';
import { spawnPopup } from './popups.js';
import { FONT } from './config.js';

export const RACE_PRIZE = 600;

export function raceStartPoint(world) {
  return { x: world.roads.vertical[6].x, y: world.roads.horizontal[6].y };
}

export function buildRoute(world) {
  const vertical=world.roads.vertical,horizontal=world.roads.horizontal;
  return [{x:vertical[7].x,y:horizontal[6].y},{x:vertical[7].x,y:horizontal[3].y},{x:vertical[4].x,y:horizontal[3].y},{x:vertical[4].x,y:horizontal[6].y},{...raceStartPoint(world)}];
}

export function createRace() {
  return { phase:'idle', checkpoints:[], playerNext:0, rivalNext:0, elapsed:0, rival:null, position:2, result:null, resultUntil:0, rivalFinishedAt:0, stuckT:0, anchor:null };
}

export function raceProgress(next,x,y,checkpoints) {
  if(next>=checkpoints.length)return checkpoints.length*10000;
  return next*10000-Math.min(9999,Math.hypot(checkpoints[next].x-x,checkpoints[next].y-y));
}

export function racePosition(race,g) {
  const focus=g.vehicle||g.player;
  const playerProgress=raceProgress(race.playerNext,focus.x,focus.y,race.checkpoints);
  const rivalProgress=race.rival?raceProgress(race.rivalNext,race.rival.x,race.rival.y,race.checkpoints):-Infinity;
  return playerProgress>=rivalProgress?1:2;
}

export function startRace(race,g) {
  if(!race||race.phase!=='idle'||!g.vehicle||!g.world||g.missions?.activity)return false;
  const start=raceStartPoint(g.world);
  race.checkpoints=buildRoute(g.world);race.playerNext=race.rivalNext=0;race.elapsed=0;race.result=null;race.rivalFinishedAt=0;race.stuckT=0;
  const rival=createCar(start.x-95,start.y-20,0,3,'#b65158','rival-driven');
  race.rival=rival;race.anchor={x:rival.x,y:rival.y};
  if(g.parkedCars)g.parkedCars.push(rival);
  race.phase='running';race.position=racePosition(race,g);
  if(g.missions){g.missions.activity='race';g.missions.objective='Street race · reach checkpoint 1';g.missions.marker=race.checkpoints[0];}
  spawnPopup(g.popups,start.x,start.y-58,'STREET RACE · GO!','#ffe16d');
  return true;
}

function finishRace(race,g,win) {
  race.phase='done';race.result=win?'win':'lose';race.resultUntil=(g.playSeconds||0)+3.5;
  const state=g.missions,focus=g.vehicle||g.player;
  if(win){g.player.cash+=RACE_PRIZE;if(state)state.totalEarned+=RACE_PRIZE;}
  if(state){
    state.splash={name:win?'STREET RACE':'STREET RACE · OUTRUN',reward:win?RACE_PRIZE:0,total:g.player.cash,until:(g.playSeconds||0)+2.8};
    state.activity=null;state.marker=null;state.objective=win?'Street race won · +$600':'Street race lost · the rival took it';
  }
  spawnPopup(g.popups,focus.x,focus.y-44,win?'+$600 RACE WIN':'OUTRUN · NO PRIZE',win?'#8df0a5':'#ef826c');
  if(race.rival){race.rival.driver='parked';race.rival.speed=0;}
}

function abortRace(race,g) {
  if(race.rival&&g.parkedCars){const index=g.parkedCars.indexOf(race.rival);if(index>=0)g.parkedCars.splice(index,1);}
  race.rival=null;race.phase='idle';race.checkpoints=[];
  if(g.missions?.activity==='race'){g.missions.activity=null;g.missions.marker=null;}
}

export function updateRace(race,g,dt) {
  if(!race||race.phase==='idle')return;
  if(race.phase==='done'){
    if((g.playSeconds||0)>=race.resultUntil){race.phase='idle';race.rival=null;race.checkpoints=[];}
    return;
  }
  if(g.outcome||!g.vehicle){abortRace(race,g);return;}
  race.elapsed+=dt;
  const focus=g.vehicle,rival=race.rival;
  if(rival){
    if(rival.health<=0)rival.speed=rival.vx=rival.vy=0;
    else if(race.rivalNext<race.checkpoints.length){
      const target=race.checkpoints[race.rivalNext],dist=Math.hypot(target.x-rival.x,target.y-rival.y);
      if(dist<78){
        race.rivalNext++;
        if(race.rivalNext===race.checkpoints.length){race.rivalFinishedAt=race.elapsed;rival.driver='parked';rival.speed=0;}
      }else{
        rival.heading=Math.atan2(target.y-rival.y,target.x-rival.x);rival.driver='player-driven';
        updateCar(rival,{isDown:key=>key==='KeyW'&&dist>10},g.world,dt,g.vehicleEffects||null);
        rival.driver='rival-driven';rival.speed=Math.min(rival.speed,148);
        if(Math.hypot(rival.x-race.anchor.x,rival.y-race.anchor.y)>30){race.anchor={x:rival.x,y:rival.y};race.stuckT=0;}
        else{
          race.stuckT+=dt;
          if(race.stuckT>4){
            const previous=race.rivalNext>0?race.checkpoints[race.rivalNext-1]:{x:rival.x-1,y:rival.y};
            const dx=target.x-previous.x,dy=target.y-previous.y,length=Math.hypot(dx,dy);
            rival.x=target.x-dx/length*130;rival.y=target.y-dy/length*130;rival.heading=Math.atan2(dy,dx);rival.speed=70;
            race.anchor={x:rival.x,y:rival.y};race.stuckT=0;
          }
        }
      }
    }
  }
  if(race.playerNext<race.checkpoints.length){
    const target=race.checkpoints[race.playerNext];
    if(Math.hypot(focus.x-target.x,focus.y-target.y)<78){
      race.playerNext++;
      if(race.playerNext===race.checkpoints.length)finishRace(race,g,!race.rivalFinishedAt);
      else spawnPopup(g.popups,target.x,target.y-40,`CHECKPOINT ${race.playerNext}/${race.checkpoints.length}`,'#ffe16d');
    }
  }
  if(race.phase==='running'){
    race.position=racePosition(race,g);
    const state=g.missions,length=race.checkpoints.length,target=race.checkpoints[Math.min(race.playerNext,length-1)];
    if(state){state.objective=`Street race · checkpoint ${Math.min(race.playerNext+1,length)}/${length}`;state.marker=target;}
    g.objective={text:state?state.objective:'Street race',position:state?state.marker:target};
  }
}

export function stageRaceShot(race,g) {
  if(!race||!g.vehicle)return null;
  const vertical=g.world.roads.vertical,horizontal=g.world.roads.horizontal,car=g.vehicle;
  race.checkpoints=[{x:vertical[5].x,y:horizontal[3].y},{x:vertical[7].x,y:horizontal[3].y},{x:vertical[7].x,y:horizontal[6].y},{x:vertical[4].x,y:horizontal[6].y},{x:vertical[4].x,y:horizontal[3].y}];
  race.playerNext=0;race.rivalNext=0;race.elapsed=41.7;race.result=null;race.rivalFinishedAt=0;race.stuckT=0;
  race.rival=createCar(car.x+250,car.y,0,3,'#b65158','rival-driven');race.rival.speed=150;
  race.anchor={x:race.rival.x,y:race.rival.y};race.phase='running';race.position=2;
  return race.rival;
}

export function drawRaceWorld(ctx,race,g,time) {
  if(!race)return;
  ctx.save();
  const pulse=1+Math.sin(time*.005)*.12;
  ctx.textAlign='center';ctx.strokeStyle='#173d46';ctx.lineWidth=4;
  if(race.phase==='idle'){
    const start=raceStartPoint(g.world);
    ctx.strokeStyle='#ffe16dcc';ctx.fillStyle='#ffe16d22';ctx.beginPath();ctx.ellipse(start.x,start.y+4,30*pulse,14*pulse,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.font=`bold 13px ${FONT}`;ctx.strokeStyle='#173d46';ctx.fillStyle='#fff3dc';ctx.strokeText('STREET RACE',start.x,start.y-26);ctx.fillText('STREET RACE',start.x,start.y-26);
  }else if(race.phase==='running'){
    race.checkpoints.forEach((point,index)=>{
      const playerTarget=index===race.playerNext,rivalTarget=index===race.rivalNext;
      if(playerTarget){
        ctx.strokeStyle='#ffe16dcc';ctx.fillStyle='#ffe16d22';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(point.x,point.y+4,29*pulse,13*pulse,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.globalAlpha=.32+Math.sin(time*.004)*.08;ctx.fillStyle='#ffdc62';ctx.beginPath();ctx.moveTo(point.x-12,point.y);ctx.lineTo(point.x+12,point.y);ctx.lineTo(point.x+5,point.y-100);ctx.lineTo(point.x-5,point.y-100);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
      }else{ctx.strokeStyle=rivalTarget?'#7be3f0aa':'#ffffff55';ctx.lineWidth=3;ctx.beginPath();ctx.arc(point.x,point.y,20,0,Math.PI*2);ctx.stroke();}
      ctx.font=`bold 14px ${FONT}`;ctx.lineWidth=4;ctx.strokeStyle='#173d46';ctx.fillStyle=playerTarget?'#ffe16d':rivalTarget?'#7be3f0':'rgba(255,255,255,0.66)';
      ctx.strokeText(String(index+1),point.x,point.y-34);ctx.fillText(String(index+1),point.x,point.y-34);
    });
  }
  ctx.restore();
}
