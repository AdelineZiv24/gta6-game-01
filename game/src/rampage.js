import { spawnPopup } from './popups.js';
import { awardRep, REP_RAMPAGE_CAP } from './rep.js';
import { FONT } from './config.js';

export const RAMPAGE_TIME = 60;
export const RING_POINTS = 250;

export function rampageStartPoint(world) {
  return {x:world.roads.vertical[3].x,y:world.roads.horizontal[3].y};
}

export function rampageSpots(world) {
  const start=rampageStartPoint(world),spots=[];
  for(const {x} of world.roads.vertical)for(const {y} of world.roads.horizontal){
    const distance=Math.hypot(x-start.x,y-start.y);
    if(distance>200&&distance<950)spots.push({x,y});
  }
  return spots;
}

export function createRampage() {
  return {phase:'idle',score:0,timeLeft:0,ring:null,ringIndex:0,spots:[],lastChain:0,result:null,resultUntil:0,payout:0};
}

export function rampagePayout(score) {
  return score>=2000?500:score>=1000?250:score>=400?100:score>0?25:0;
}

export function startRampage(rampage,g) {
  if(!rampage||rampage.phase!=='idle'||!g.vehicle||!g.world||g.missions?.activity)return false;
  g.vehicle.fuel=Math.max(g.vehicle.fuel??100,40);
  rampage.spots=rampageSpots(g.world);rampage.ringIndex=0;rampage.ring=rampage.spots[0]??null;
  rampage.score=0;rampage.timeLeft=RAMPAGE_TIME;rampage.lastChain=0;rampage.result=null;rampage.payout=0;rampage.phase='running';
  const state=g.missions,start=rampageStartPoint(g.world);
  if(state){state.activity='rampage';state.objective='Rampage · hit the rings, chain near misses';state.marker=rampage.ring;}
  spawnPopup(g.popups,start.x,start.y-58,'RAMPAGE · GO!','#ef826c');
  return true;
}

function finishRampage(rampage,g) {
  const state=g.missions,focus=g.vehicle||g.player,{score}=rampage;
  rampage.phase='done';rampage.result='done';rampage.resultUntil=(g.playSeconds||0)+3.5;
  const payout=rampage.payout=rampagePayout(score);
  if(payout>0){g.player.cash+=payout;if(state)state.totalEarned+=payout;}
  if(state){
    state.splash={name:'RAMPAGE',reward:payout,total:g.player.cash,until:(g.playSeconds||0)+2.8};
    state.activity=null;state.marker=null;state.objective=`Rampage over · ${score} pts`;
  }
  const repGain = Math.min(REP_RAMPAGE_CAP, Math.floor(score / 10)); if(repGain > 0) awardRep(g, repGain);
  spawnPopup(g.popups,focus.x,focus.y-44,`RAMPAGE ${score} PTS${payout>0?` · +$${payout}`:''}`,'#ffe16d');
}

function abortRampage(rampage,g) {
  rampage.phase='idle';rampage.ring=null;rampage.spots=[];
  if(g.missions?.activity==='rampage'){g.missions.activity=null;g.missions.marker=null;}
}

export function updateRampage(rampage,g,dt) {
  if(!rampage||rampage.phase==='idle')return;
  if(rampage.phase==='done'){
    if((g.playSeconds||0)>=rampage.resultUntil){rampage.phase='idle';rampage.ring=null;rampage.spots=[];}
    return;
  }
  if(g.outcome){abortRampage(rampage,g);return;}
  rampage.timeLeft-=dt;
  if(rampage.timeLeft<=0){finishRampage(rampage,g);return;}
  const focus=g.vehicle||g.player,effects=g.vehicleEffects,state=g.missions;
  if(effects){
    if(effects.time>=effects.nearChainUntil)rampage.lastChain=0;
    else if(g.vehicle&&effects.nearChain>rampage.lastChain){
      const points=100*effects.nearChain;
      rampage.score+=points;rampage.lastChain=effects.nearChain;
      spawnPopup(g.popups,focus.x,focus.y-58,`STUNT +${points}`,'#7be3f0');
    }
  }
  const ring=rampage.ring;
  if(ring&&Math.hypot(focus.x-ring.x,focus.y-ring.y)<=60){
    rampage.score+=RING_POINTS;
    spawnPopup(g.popups,ring.x,ring.y-40,`RING +${RING_POINTS}`,'#ffe16d');
    rampage.ringIndex++;rampage.ring=rampage.spots.length?rampage.spots[rampage.ringIndex%rampage.spots.length]:null;
  }
  if(state){state.objective=`Rampage · ${rampage.score} pts · ${Math.ceil(rampage.timeLeft)}s`;state.marker=rampage.ring;}
  g.objective={text:state?state.objective:'Rampage',position:rampage.ring};
}

export function drawRampageWorld(ctx,rampage,g,time) {
  if(!rampage)return;
  ctx.save();ctx.textAlign='center';ctx.lineWidth=4;
  const pulse=1+Math.sin(time*.005)*.12;
  if(rampage.phase==='idle'){
    const start=rampageStartPoint(g.world);
    ctx.strokeStyle='#ef826ccc';ctx.fillStyle='#ef826c22';ctx.beginPath();ctx.ellipse(start.x,start.y+4,30*pulse,14*pulse,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.font=`bold 13px ${FONT}`;ctx.strokeStyle='#173d46';ctx.fillStyle='#fff3dc';ctx.strokeText('RAMPAGE',start.x,start.y-26);ctx.fillText('RAMPAGE',start.x,start.y-26);
  }else if(rampage.phase==='running'&&rampage.ring){
    const {x,y}=rampage.ring;
    ctx.strokeStyle='#ffe16dcc';ctx.fillStyle='#ffe16d22';ctx.beginPath();ctx.ellipse(x,y+4,29*pulse,13*pulse,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.save();ctx.globalAlpha=.32+Math.sin(time*.004)*.08;ctx.fillStyle='#ffdc62';ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x+12,y);ctx.lineTo(x+5,y-100);ctx.lineTo(x-5,y-100);ctx.closePath();ctx.fill();ctx.restore();
    ctx.font=`bold 14px ${FONT}`;ctx.strokeStyle='#173d46';ctx.fillStyle='#ffe16d';ctx.strokeText('★',x,y-34);ctx.fillText('★',x,y-34);
  }
  ctx.restore();
}
