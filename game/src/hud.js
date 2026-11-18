import { WORLD, FONT } from './config.js';
import { repProgress } from './rep.js';
import { stationNow } from './radio.js';
import { gasStations } from './fuel.js';
import { weatherLabel } from './weather.js';

export function responseRows(game) {
  const focus = game.vehicle || game.player;
  const distanceTo = target => Math.round(Math.hypot(target.x-focus.x,target.y-focus.y));
  const seen = game.wanted.seen;
  const rows = game.police.units.map(unit => ({
    callsign: unit.callsign ?? (unit.car.interceptor ? `INT-${unit.id}` : `CB-${String(unit.id ?? 0).padStart(2,'0')}`),
    type: unit.car.interceptor?'INTERCEPTOR':unit.onFoot?'OFFICER · FOOT':'PATROL',
    distance: distanceTo(unit.car),
    state: unit.down||unit.health<=0||unit.car.health<=0?'DISABLED':seen?'PURSUIT':'SEARCHING',
  }));
  if(game.police.heli)rows.push({callsign:'AIR-1',type:'HELI',distance:distanceTo(game.police.heli),state:seen?'SPOTLIGHT':'SEARCHING'});
  return rows.sort((first,second)=>first.distance-second.distance);
}

function drawPortrait(ctx, speaker, x, y) {
  const styles = {
    Lena: ['#507e78', '#e4b18e', '#794b35', '#43a69c'],
    Dario: ['#987456', '#cf9a78', '#302c2b', '#ae593d'],
    Courier: ['#687e88', '#bb8c6c', '#39352e', '#91999b'],
    Passenger: ['#9b777c', '#efc3a1', '#eac471', '#e58074'],
    Dispatcher: ['#5a7388', '#d6aa89', '#403935', '#233d63'],
  };
  const [background, skin, hair, shirt] = styles[speaker] || ['#75837d', '#d8ad8b', '#635548', '#657d82'];
  ctx.save();ctx.beginPath();ctx.moveTo(x+8,y);ctx.lineTo(x+46,y);ctx.quadraticCurveTo(x+54,y,x+54,y+8);ctx.lineTo(x+54,y+46);ctx.quadraticCurveTo(x+54,y+54,x+46,y+54);ctx.lineTo(x+8,y+54);ctx.quadraticCurveTo(x,y+54,x,y+46);ctx.lineTo(x,y+8);ctx.quadraticCurveTo(x,y,x+8,y);ctx.clip();
  ctx.fillStyle=background;ctx.fillRect(x,y,54,54);
  ctx.fillStyle=hair;ctx.beginPath();ctx.arc(x+27,y+22,15,Math.PI,Math.PI*2);ctx.fill();
  if(speaker==='Lena'||speaker==='Passenger'){ctx.fillRect(x+12,y+20,8,29);ctx.fillRect(x+34,y+20,8,29);}
  ctx.fillStyle=shirt;ctx.beginPath();ctx.ellipse(x+27,y+55,23,17,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=skin;ctx.fillRect(x+23,y+32,8,12);ctx.beginPath();ctx.arc(x+27,y+25,12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=hair;ctx.beginPath();ctx.arc(x+27,y+22,13,Math.PI,Math.PI*2);ctx.fill();
  if(speaker==='Dario'){ctx.fillStyle='#705c5080';ctx.beginPath();ctx.arc(x+27,y+27,11,0,Math.PI);ctx.fill();}
  ctx.fillStyle='#283e43';ctx.fillRect(x+22,y+24,2,2);ctx.fillRect(x+30,y+24,2,2);ctx.fillRect(x+25,y+32,5,1);
  if(speaker==='Courier'){ctx.fillStyle='#e2c98a';ctx.beginPath();ctx.arc(x+27,y+18,14,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(x+12,y+16,34,5);}
  if(speaker==='Dispatcher'){ctx.strokeStyle='#a8ced0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+27,y+22,16,Math.PI,Math.PI*2);ctx.stroke();ctx.fillStyle='#233d63';ctx.fillRect(x+10,y+20,5,10);ctx.fillRect(x+39,y+20,5,10);ctx.beginPath();ctx.moveTo(x+42,y+27);ctx.lineTo(x+39,y+34);ctx.lineTo(x+30,y+34);ctx.stroke();}
  ctx.restore();
}

export function drawHUD(ctx, game) {
  const { player, minimap, objective } = game;
  const fit=Math.min(1,game.width/640,game.height/720),w=game.width/fit,h=game.height/fit;
  ctx.save(); ctx.setTransform(game.pixelRatio*fit, 0, 0, game.pixelRatio*fit, 0, 0);
  ctx.textAlign='left';ctx.globalAlpha=1;ctx.textBaseline = 'middle'; ctx.font = `bold 12px ${FONT}`;
  const panel = (x,y,width,height) => { ctx.fillStyle='#103c48e8'; ctx.beginPath(); ctx.roundRect(x,y,width,height,10); ctx.fill(); };
  const inset=20;panel(inset,20,208,96); ctx.fillStyle='#fff3dc'; ctx.fillText(player.name.toUpperCase(),inset+14,40);
  const bar = (y,value,max,color,label) => { ctx.fillStyle='#ffffff28';ctx.fillRect(34,y,150,7);ctx.fillStyle=color;ctx.fillRect(34,y,150*Math.max(0,Math.min(1,value/max)),7);ctx.fillStyle='#fff3dc';ctx.font=`10px ${FONT}`;ctx.fillText(label,193,y+4); };
  bar(59,player.health,player.maxHealth,'#ef826c','HP'); bar(80,player.armour,player.maxArmour,'#71d3d9','AR');
  if(game.police?.units?.length||game.police?.heli){
    const rows=responseRows(game);
    const rowCount=Math.min(4,rows.length)+(rows.length>4?1:0);
    panel(inset,124,208,36+rowCount*19);ctx.textAlign='left';ctx.fillStyle='#f9d777';ctx.font=`bold 11px ${FONT}`;ctx.fillText('CBPD RESPONSE',inset+14,144);
    ctx.fillStyle='#fff3dc';ctx.font=`12px ${FONT}`;
    rows.slice(0,4).forEach(({callsign,type,distance,state},index)=>{
      ctx.fillText(`${callsign} · ${type}  ${distance} m  ${state}`,inset+14,165+index*19,180);
    });
    if(rows.length>4)ctx.fillText(`+${rows.length-4} MORE`,inset+14,241);
  }
  panel(Math.max(inset,w-230),20,Math.min(210,w-2*inset),73);ctx.textAlign='right';ctx.fillStyle='#f9d777';ctx.font=`bold 22px ${FONT}`;ctx.fillText(`$${player.cash.toLocaleString('en-US')}`,w-inset-14,45);
  const rep=repProgress(game.rep?.xp??0);ctx.textAlign='left';ctx.fillStyle='#71d3d9';ctx.font=`bold 11px ${FONT}`;ctx.fillText(`REP LV ${rep.level}`,w-216,45);ctx.fillStyle='#ffffff28';ctx.fillRect(w-216,86,182,4);ctx.fillStyle='#71d3d9';ctx.fillRect(w-216,86,Math.round(182*rep.fraction),4);ctx.textAlign='right';
  const minutes = Math.floor(game.clockMinutes) % 1440;
  ctx.fillStyle='#fff3dc';ctx.font=`12px ${FONT}`;ctx.fillText(`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}  •  ${weatherLabel(game.playSeconds)}`,w-34,75);
  if (objective?.text) {
    const bw=Math.min(560,w-40); const top=w<1000?122:22;
    panel((w-bw)/2,top,bw,66);ctx.textAlign='center';ctx.fillStyle='#f9d777';ctx.font=`bold 12px ${FONT}`;ctx.fillText('CURRENT OBJECTIVE',(w)/2,top+17);
    ctx.fillStyle='#fff3dc';ctx.font=`bold 17px ${FONT}`;ctx.fillText(objective.text,w/2,top+43,bw-28);
    if(objective.position){const dx=objective.position.x-player.x,dy=objective.position.y-player.y,distance=Math.hypot(dx,dy);ctx.fillStyle='#f9d777';ctx.font=`bold 12px ${FONT}`;ctx.fillText(`${Math.round(distance)} m`,w/2,top+59);}
    if(objective.position){const dx=objective.position.x-player.x,dy=objective.position.y-player.y,a=Math.atan2(dy,dx),edgeX=w/2+Math.cos(a)*Math.min(w*.38,380),edgeY=h/2+Math.sin(a)*Math.min(h*.32,255);ctx.save();ctx.translate(edgeX,edgeY);ctx.rotate(a);ctx.fillStyle='#ffe16d';ctx.strokeStyle='#173d46';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-10,-10);ctx.lineTo(-6,0);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  }
  if(game.missions?.dialogue){const d=game.missions.dialogue,line=d.lines[d.index]||'';const bw=Math.min(620,w-40),words=line.split(' '),lines=[];let row='';ctx.font=`14px ${FONT}`;for(const word of words){if(row&&ctx.measureText(row+' '+word).width>bw-108){lines.push(row);row=word;}else row+=(row?' ':'')+word;}if(row)lines.push(row);const bh=70+lines.length*20,x=(w-bw)/2,y=h-bh-252;ctx.fillStyle='#103c48f2';ctx.beginPath();ctx.roundRect(x,y,bw,bh,8);ctx.fill();drawPortrait(ctx,d.speaker,x+14,y+14);ctx.fillStyle='#f9d777';ctx.textAlign='left';ctx.font=`bold 14px ${FONT}`;ctx.fillText(d.speaker,x+88,y+24);ctx.fillStyle='#fff3dc';ctx.font=`14px ${FONT}`;lines.forEach((text,i)=>ctx.fillText(text,x+88,y+50+i*20));ctx.textAlign='right';ctx.font=`10px ${FONT}`;ctx.fillText('E / CLICK',x+bw-18,y+bh-18);}
  if(game.missions?.retry){ctx.textAlign='center';ctx.fillStyle='#ffe39a';ctx.font=`bold 14px ${FONT}`;ctx.fillText('MISSION FAILED · RETURN TO THE DINER · E TO RETRY',w/2,h*.56);}
  if(game.missions?.currentMission<6&&!game.missions.activity&&!game.missions.retry&&game.missions?.objective?.includes('Meet Lena')){ctx.textAlign='center';ctx.fillStyle='#fff3dc';ctx.font=`11px ${FONT}`;ctx.fillText('E · TALK',w/2,h*.61);}
  if(game.missions&&!game.missions.activity&&!game.missions.retry){const p=game.player;if(Math.hypot(p.x-game.world.spawnPoints.diner.x,p.y-game.world.spawnPoints.diner.y)<75){ctx.textAlign='center';ctx.fillStyle='#fff3dc';ctx.font=`bold 12px ${FONT}`;ctx.fillText(game.missions.currentMission<6?'E · TALK TO LENA':'1 · TAXI · 2 · ARMOUR · 3 · REPLAY',w/2,h*.64);}}
  if(game.missions?.completion&&!game.missions.dialogue&&!game.missions.completion.shown){const c=game.missions.completion;ctx.fillStyle='#103c48ee';ctx.fillRect(w*.2,h*.25,w*.6,h*.45);ctx.textAlign='center';ctx.fillStyle='#f9d777';ctx.font=`bold 30px ${FONT}`;ctx.fillText(c.title||'SUNRISE RUN COMPLETE',w/2,h*.34);ctx.fillStyle='#fff3dc';ctx.font=`16px ${FONT}`;ctx.fillText(`Total earnings $${c.earnings.toLocaleString()} · Story ${Math.floor(c.time/60)}:${String(Math.floor(c.time%60)).padStart(2,'0')}`,w/2,h*.44);ctx.fillText('Press E to return to free roam',w/2,h*.54);}
  const splash=game.missions?.splash;
  const rampage=game.rampage;
  if(splash&&!game.missions?.completion&&game.playSeconds<splash.until){
    const sideSplash=w<920&&(rampage?.phase==='running'||rampage?.phase==='done');
    const sw=Math.min(460,w-(sideSplash?258:40)),sx=sideSplash?inset:(w-sw)/2,sy=sideSplash?Math.max(h*.27,263):h*.27,center=sx+sw/2;
    panel(sx,sy,sw,108);ctx.textAlign='center';ctx.fillStyle='#f9d777';ctx.font=`bold 12px ${FONT}`;ctx.fillText(splash.header||'MISSION COMPLETE',center,sy+22);ctx.fillStyle='#fff3dc';ctx.font=`bold 25px ${FONT}`;ctx.fillText(splash.name.toUpperCase(),center,sy+50);ctx.fillStyle='#8df0a5';ctx.font=`bold 20px ${FONT}`;ctx.fillText(splash.reward>0?`+$${splash.reward.toLocaleString('en-US')}`:splash.repLevel?`STREET REP · LV ${splash.repLevel}`:'+$0',center,sy+78);ctx.fillStyle='#fff3dc';ctx.font=`12px ${FONT}`;ctx.fillText(`TOTAL $${splash.total.toLocaleString('en-US')}`,center,sy+97);
  }
  if(game.notice&&game.playSeconds<(game.noticeUntil||0)){const noticeWidth=Math.min(360,w-40);ctx.fillStyle='#103c48e8';ctx.beginPath();ctx.roundRect((w-noticeWidth)/2,h*.68,noticeWidth,42,8);ctx.fill();ctx.textAlign='center';ctx.fillStyle='#fff3dc';ctx.font=`bold 13px ${FONT}`;ctx.fillText(game.notice,w/2,h*.68+21,noticeWidth-24);}
  const radius=Math.min(84,w*0.19,h*0.2), cx=24+radius,cy=h-24-radius, scale=.145;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();ctx.fillStyle='#72a879';ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2);
  ctx.drawImage(minimap,cx-player.x*scale,cy-player.y*scale,WORLD.width*scale,WORLD.height*scale);
  if (objective?.position) {
    let dx=(objective.position.x-player.x)*scale,dy=(objective.position.y-player.y)*scale;
    const d=Math.hypot(dx,dy),limit=radius-12;if(d>limit){dx*=limit/d;dy*=limit/d;}
    ctx.fillStyle='#fa6d55';ctx.strokeStyle='#fff4d8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+dx,cy+dy-8);ctx.lineTo(cx+dx+7,cy+dy);ctx.lineTo(cx+dx,cy+dy+8);ctx.lineTo(cx+dx-7,cy+dy);ctx.closePath();ctx.fill();ctx.stroke();
  }
  for(const unit of game.police?.units||[]){const dx=(unit.car.x-player.x)*scale,dy=(unit.car.y-player.y)*scale;ctx.fillStyle='#56c9e5';ctx.strokeStyle='#123d5b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx+Math.max(-radius+8,Math.min(radius-8,dx)),cy+Math.max(-radius+8,Math.min(radius-8,dy)),4,0,Math.PI*2);ctx.fill();ctx.stroke();}
  const heli=game.police?.heli;
  if(heli){
    const dx=(heli.x-player.x)*scale,dy=(heli.y-player.y)*scale,limit=radius-8;
    const blipX=cx+Math.max(-limit,Math.min(limit,dx)),blipY=cy+Math.max(-limit,Math.min(limit,dy));
    ctx.fillStyle='#eafcff';ctx.strokeStyle='#0e5a74';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(blipX,blipY,6,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(234,252,255,0.7)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(blipX,blipY,9,0,Math.PI*2);ctx.stroke();
  }
  if(game.world)for(const station of gasStations(game.world)){
    const dx=(station.x-player.x)*scale,dy=(station.y-player.y)*scale;
    ctx.fillStyle='#f9a03f';ctx.strokeStyle='#173d46';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx+Math.max(-radius+8,Math.min(radius-8,dx)),cy+Math.max(-radius+8,Math.min(radius-8,dy)),3.5,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  ctx.translate(cx,cy);ctx.rotate(player.facing);if(game.vehicle){ctx.fillStyle=game.vehicle.color;ctx.fillRect(-10,-5,20,10);ctx.fillStyle='#173c49';ctx.fillRect(-3,-4,7,8);}else {ctx.fillStyle='#fff9e6';ctx.strokeStyle='#17424b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-7,7);ctx.lineTo(-3,0);ctx.lineTo(-7,-7);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();
  ctx.strokeStyle='#fff1d9';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#163e47';ctx.font=`bold 11px ${FONT}`;ctx.fillText('N',cx,cy-radius+13);
  if(game.vehicle){panel(w-234,h-116,214,92);ctx.textAlign='right';ctx.fillStyle='#fff3dc';ctx.font=`bold 13px ${FONT}`;ctx.fillText(game.vehicle.model.name,w-34,h-99);ctx.fillStyle='#f9d777';ctx.font=`bold 40px ${FONT}`;ctx.fillText(`${Math.round(Math.abs(game.vehicle.speed)*.32)} km/h`,w-34,h-68);ctx.font=`11px ${FONT}`;ctx.fillStyle=game.vehicle.health<30?'#ef826c':'#fff3dc';ctx.fillText(`COND ${Math.max(0,Math.round(game.vehicle.health))}%`,w-34,h-40);
    const fuel=Math.max(0,Math.min(100,game.vehicle.fuel??100));ctx.textAlign='left';ctx.font=`bold 9px ${FONT}`;ctx.fillStyle='#fff3dc';ctx.fillText('FUEL',w-218,h-40);ctx.fillStyle='#ffffff28';ctx.fillRect(w-218,h-31,184,6);ctx.fillStyle=fuel<25?'#ef826c':'#8df0a5';ctx.fillRect(w-218,h-31,184*fuel/100,6);ctx.textAlign='right';
  }
  const wanted=game.wanted;
  if(wanted){const wy=w<1000?190:104;panel(w-230,wy,210,76);ctx.textAlign='right';ctx.font=`bold 35px ${FONT}`;ctx.fillStyle='#f9d777';ctx.globalAlpha=wanted.stars>=3?.82+.18*Math.sin(game.playSeconds*5):1;ctx.fillText('★'.repeat(wanted.stars)+'☆'.repeat(5-wanted.stars),w-34,wy+24);ctx.globalAlpha=1;
    ctx.font=`bold 10px ${FONT}`;ctx.fillStyle='#fff3dc';ctx.fillText(wanted.stars?(wanted.seen?'CBPD • IN SIGHT':'CBPD • SEARCHING'):'CORAL BAY POLICE DEPARTMENT',w-34,wy+47);
    if(wanted.stars&&!wanted.seen){ctx.fillStyle='#ffffff28';ctx.fillRect(w-214,wy+61,180,5);ctx.fillStyle='#71d3d9';ctx.fillRect(w-214,wy+61,180*wanted.evade,5);}
  }
  const race=game.race;
  if(race&&(race.phase==='running'||race.phase==='done')){
    const ry=(w<1000?190:104)+84;panel(w-230,ry,210,52);ctx.textAlign='right';ctx.fillStyle='#f9d777';ctx.font=`bold 11px ${FONT}`;ctx.fillText('STREET RACE',w-34,ry+14);
    ctx.fillStyle='#fff3dc';ctx.font=`bold 17px ${FONT}`;ctx.fillText(race.phase==='done'?(race.result==='win'?'YOU WIN':'OUTRUN'):`${Math.floor(race.elapsed/60)}:${String(Math.floor(race.elapsed%60)).padStart(2,'0')}.${Math.floor(race.elapsed*10)%10}`,w-34,ry+32);
    ctx.font=`bold 11px ${FONT}`;ctx.fillText(`CP ${Math.min(race.playerNext+1,race.checkpoints.length)}/${race.checkpoints.length} · POS ${race.position}/2`,w-34,ry+47);
  }
  if(rampage&&(rampage.phase==='running'||rampage.phase==='done')){
    const ry=(w<1000?190:104)+84+((race&&(race.phase==='running'||race.phase==='done'))?60:0);panel(w-230,ry,210,52);ctx.textAlign='right';ctx.fillStyle='#ef826c';ctx.font=`bold 11px ${FONT}`;ctx.fillText('RAMPAGE',w-34,ry+14);
    ctx.fillStyle='#fff3dc';ctx.font=`bold 17px ${FONT}`;ctx.fillText(rampage.phase==='done'?`${rampage.score} PTS`:`${rampage.score}`,w-34,ry+32);
    ctx.font=`bold 11px ${FONT}`;ctx.fillText(rampage.phase==='done'?(rampage.payout>0?`+$${rampage.payout}`:'NO PAYOUT'):`TIME ${Math.floor(Math.max(0,Math.ceil(rampage.timeLeft))/60)}:${String(Math.floor(Math.max(0,Math.ceil(rampage.timeLeft))%60)).padStart(2,'0')} · RING +250`,w-34,ry+47);
  }
  if(game.police?.arrest>0){panel(w/2-130,h*.32,260,54);ctx.textAlign='center';ctx.fillStyle='#ff9d8d';ctx.font=`bold 18px ${FONT}`;ctx.fillText('BUSTED',w/2,h*.32+18);ctx.fillStyle='#ffffff33';ctx.fillRect(w/2-114,h*.32+35,228,8);ctx.fillStyle='#ef826c';ctx.fillRect(w/2-114,h*.32+35,228*game.police.arrest,8);}
  const combat=game.combat;
  if(combat){
    const top=h-(game.vehicle?196:96);
    panel(w-230,top,210,72);ctx.textAlign='right';ctx.fillStyle='#fff3dc';ctx.font=`bold 15px ${FONT}`;ctx.fillText(combat.weapon==='pistol'?'PISTOL':'FISTS',w-34,top+21);
    ctx.font=`13px ${FONT}`;ctx.fillStyle='#f9d777';ctx.fillText(combat.weapon==='pistol'?(combat.reload>0?'RELOADING…':`${combat.ammo} / ${combat.reserve}   •   R RELOAD`):'CLICK / F  SWING',w-34,top+47);
  }
  if(game.vehicle){
    const mode=game.radio?.station??0;
    panel(w/2-255,h-272,510,30);ctx.textAlign='center';ctx.font=`12px ${FONT}`;ctx.fillStyle='#fff3dc';
    if(mode>=2)ctx.fillText('♪ RADIO OFF',w/2,h-257,486);
    else{const {station,title,artist}=stationNow(game.playSeconds,mode);ctx.fillText(`♪ ${station} · "${title}" — ${artist}`,w/2,h-257,486);}
  }
  const message=game.entering?'Working the door…':game.noticeUntil>game.playSeconds?game.notice:game.vehicle?'W / S  Accelerate / Brake • A / D  Steer • Space  Handbrake • E  Exit • T  Radio':'E  Enter car • RMB Aim • Click / F Attack • 1 Fists / 2 Pistol';
  panel(Math.max(inset,w/2-255),h-236,Math.min(510,w-2*inset),34);ctx.textAlign='center';ctx.font=`12px ${FONT}`;ctx.fillStyle='#fff3dc';ctx.fillText(message,w/2,h-219,Math.min(490,w-60));
  ctx.globalAlpha=1;const opacity=Math.max(0,Math.min(1,(12-game.playSeconds)/3));
  if(opacity>0&&!game.missions?.dialogue&&w>1000){ctx.globalAlpha=opacity;panel(cx+radius+18,h-68,Math.min(360,w-cx-radius-38),44);ctx.textAlign='left';ctx.fillStyle='#fff3dc';ctx.font=`12px ${FONT}`;ctx.fillText('WASD / Arrows  Move   •   Shift  Sprint   •   P  Pause',cx+radius+30,h-46,Math.max(0,w-cx-radius-62));}
  const popup=game.vehicleEffects?.popup;
  if(popup&&game.vehicleEffects.time<popup.until){ctx.save();ctx.globalAlpha=Math.min(1,(popup.until-game.vehicleEffects.time)/.3);ctx.textAlign='center';ctx.font=`bold 30px ${FONT}`;ctx.fillStyle='#ffe16d';ctx.strokeStyle='#173d46';ctx.lineWidth=5;ctx.strokeText(popup.text,w/2,h*.30);ctx.fillText(popup.text,w/2,h*.30);ctx.restore();}
  if(combat?.flash>0){ctx.fillStyle=`rgba(232,65,55,${combat.flash*.65})`;ctx.fillRect(0,0,w,h);}
  if(game.outcome){ctx.fillStyle='#092731df';ctx.fillRect(0,0,w,h);ctx.textAlign='center';ctx.fillStyle=game.outcome.kind==='busted'?'#71d3d9':'#ef826c';ctx.font=`900 64px ${FONT}`;ctx.fillText(game.outcome.kind.toUpperCase(),w/2,h/2-50);ctx.fillStyle='#fff3dc';ctx.font=`18px ${FONT}`;ctx.fillText(`${game.outcome.kind==='busted'?'Police fine':'Hospital bill'}: $${game.outcome.bill}`,w/2,h/2+12);ctx.font=`14px ${FONT}`;ctx.fillText('Press any key to continue',w/2,h/2+58);}
  ctx.restore();
}
