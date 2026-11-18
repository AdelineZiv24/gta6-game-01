import { hasSight } from './wanted.js';
export function createCombat(){return {weapon:'fists',pistol:false,ammo:0,reserve:0,magazine:12,reload:0,cooldown:0,lastDamage:-100,lastAction:-100,flash:0,shake:0,effects:[],trigger:false,reloadHeld:false,swing:0};}
// Mission API. Granting again adds reserve ammunition without resetting the magazine.
export function grantPistol(game,rounds=48){const c=game.combat;if(!c.pistol){c.pistol=true;c.ammo=Math.min(12,rounds);rounds-=c.ammo;}c.reserve+=Math.max(0,rounds);c.weapon='pistol';}
export function damagePlayer(game,amount){if(game.state!=='playing'||amount<=0)return;const p=game.player,c=game.combat;const absorbed=Math.min(p.armour,amount*.65);p.armour-=absorbed;p.health=Math.max(0,p.health-(amount-absorbed));c.lastDamage=game.playSeconds;c.flash=.25;c.shake=Math.min(7,amount*.3);}
function effect(c,item){if(c.effects.length>=100)c.effects.shift();c.effects.push(item);}
function shoot(game,world,origin,angle,cars,people,units,report,policeShot=false){
  game.audio?.effect('gun');
  const c=game.combat,max=600,dx=Math.cos(angle),dy=Math.sin(angle);
  let end=max;
  // Building hit distance bounds both hitscan and tracer.
  for(let d=8;d<=max;d+=8)if(!hasSight(world,origin,{x:origin.x+dx*d,y:origin.y+dy*d},max)){end=d-8;break;}
  const targets=policeShot?[{actor:game.vehicle||game.player,r:game.vehicle?25:12,kind:'player'}]:[
    ...units.filter(u=>u.health>0&&u.onFoot).map(u=>({actor:u,r:12,kind:'officer'})),
    ...people.filter(p=>p.state!=='down').map(p=>({actor:p,r:10,kind:'person'})),
    ...cars.map(car=>({actor:car,r:car.model.length*.43,kind:'car'}))];
  let hit=null;
  for(const t of targets){const x=t.actor.x-origin.x,y=t.actor.y-origin.y,along=x*dx+y*dy,side=Math.abs(x*dy-y*dx);if(along>8&&side<t.r){const near=along-Math.sqrt(t.r*t.r-side*side);if(near<end){end=Math.max(0,near);hit=t;}}}
  if(hit){const a=hit.actor;
    if(hit.kind==='player'){if(game.vehicle)game.vehicle.health=Math.max(0,game.vehicle.health-9);damagePlayer(game,game.vehicle?6:14);}
    else if(hit.kind==='person'){a.state='down';report('pedestrian_hit',a.x,a.y,3,true);}
    else {a.health=Math.max(0,a.health-(hit.kind==='car'?18:40));if(hit.kind==='officer'||a.police){const crime=report('police_hit',a.x,a.y,4,true);crime.againstPolice=true;for(const u of units)u.hostile=true;}}
  }
  const x=origin.x+dx*end,y=origin.y+dy*end;
  effect(c,{kind:'tracer',x:origin.x,y:origin.y,tx:x,ty:y,life:.09,max:.09});
  effect(c,{kind:'spark',x,y,life:.22,max:.22});effect(c,{kind:'spark',x:origin.x+dx*17,y:origin.y+dy*17,life:.06,max:.06});
  // Police shots also enter the public feed, but cannot attribute a new crime to Dario.
  const crime=report(policeShot?'police_gunfire':'weapon_fired',origin.x,origin.y,3,true);crime.policeShot=policeShot;
}
export function policeFire(game,world,u,cars,people,report){const p=game.vehicle||game.player,d=Math.hypot(p.x-u.x,p.y-u.y),spread=.035+d*.0005;shoot(game,world,u,Math.atan2(p.y-u.y,p.x-u.x)+(Math.random()-.5)*spread*2,cars,people,game.police.units,report,true);}
export function updateCombat(game,world,input,camera,cars,people,report,dt){
  const c=game.combat,p=game.player;
  c.cooldown=Math.max(0,c.cooldown-dt);c.flash=Math.max(0,c.flash-dt);c.shake=Math.max(0,c.shake-dt*18);c.swing=Math.max(0,c.swing-dt);
  for(const e of c.effects)e.life-=dt;c.effects=c.effects.filter(e=>e.life>0);
  if(p.health<30&&game.playSeconds-Math.max(c.lastDamage,c.lastAction)>10&&!game.wanted.seen)p.health=Math.min(30,p.health+dt*1.8);
  if(c.reload>0){c.reload=Math.max(0,c.reload-dt);if(c.reload===0){const n=Math.min(c.magazine-c.ammo,c.reserve);c.ammo+=n;c.reserve-=n;}}
  const trigger=input.mouseDown(0),reload=input.isDown('KeyR');
  if(!game.vehicle&&!game.entering){
    if(input.wasPressed('Digit1'))c.weapon='fists';if(input.wasPressed('Digit2')&&c.pistol)c.weapon='pistol';
    if(input.mouseDown(2)||c.weapon==='pistol'){const mouse=input.mousePosition(),scale=Math.min(game.width*game.pixelRatio/camera.width,game.height*game.pixelRatio/camera.height);if(mouse.moved||mouse.x||mouse.y)p.facing=Math.atan2(camera.y-camera.height/2+mouse.y/scale-p.y,camera.x-camera.width/2+mouse.x/scale-p.x);}
    if(reload&&!c.reloadHeld&&c.weapon==='pistol'&&!c.reload&&c.ammo<c.magazine&&c.reserve)c.reload=1.3;
    const melee=input.isDown('KeyF')||(c.weapon==='fists'&&trigger&&!c.trigger);
    if(c.cooldown===0&&melee){
      game.audio?.effect('punch');
      c.cooldown=.45;c.swing=.2;c.lastAction=game.playSeconds;
      report('assault',p.x,p.y,2,true);
      const targets=[...people.filter(a=>a.state!=='down'),...game.police.units.filter(u=>u.onFoot&&u.health>0)];
      for(const a of targets){const d=Math.hypot(a.x-p.x,a.y-p.y),angle=Math.atan2(a.y-p.y,a.x-p.x)-p.facing;if(d<53&&Math.cos(angle)>.45&&hasSight(world,p,a,53)){if('car' in a){a.health=Math.max(0,a.health-34);a.hostile=true;const crime=report('police_hit',a.x,a.y,3,true);crime.againstPolice=true;}else a.state='down';effect(c,{kind:'spark',x:a.x,y:a.y,life:.2,max:.2});}}
    }else if(trigger&&!c.trigger&&c.weapon==='pistol'&&!c.reload&&c.cooldown===0){
      if(c.ammo>0){c.ammo--;c.cooldown=.22;c.lastAction=game.playSeconds;shoot(game,world,p,p.facing+(Math.random()-.5)*.055,cars,people,game.police.units,report);}
      else if(c.reserve)c.reload=1.3;
      else game.audio?.effect('empty');
    }
  }
  c.trigger=trigger;c.reloadHeld=reload;
}
export function drawCombat(ctx,game){const c=game.combat,p=game.player;
  if(!game.vehicle){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.facing);if(c.weapon==='pistol'){ctx.fillStyle='#263746';ctx.fillRect(9,4,17,5);}if(c.swing>0){ctx.strokeStyle='#fff0b9aa';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,35,-.8,.8);ctx.stroke();}ctx.restore();}
  for(const e of c.effects){ctx.save();ctx.globalAlpha=e.life/e.max;ctx.strokeStyle='#ffe6a0';ctx.lineWidth=2;ctx.beginPath();if(e.kind==='tracer'){ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);}else{for(let i=0;i<5;i++){const a=i*1.256;ctx.moveTo(e.x+Math.cos(a)*3,e.y+Math.sin(a)*3);ctx.lineTo(e.x+Math.cos(a)*11,e.y+Math.sin(a)*11);}}ctx.stroke();ctx.restore();}
}
