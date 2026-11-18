import { FONT } from './config.js';

export function createPopups() {
  return { list: Array.from({length:24},()=>({x:0,y:0,text:'',color:'#ffe16d',age:0,life:0})), cursor:0 };
}

export function spawnPopup(popups,x,y,text,color='#ffe16d',life=1.6) {
  if(!popups)return null;
  const entry=popups.list[popups.cursor++%popups.list.length];
  Object.assign(entry,{x,y,text,color,age:0,life});
  return entry;
}

export function updatePopups(popups,dt) {
  if(!popups)return;
  for(const entry of popups.list)if(entry.life>0){entry.age+=dt;if(entry.age>=entry.life)entry.life=0;}
}

export function drawPopups(ctx,popups) {
  if(!popups)return;
  for(const entry of popups.list)if(entry.life>0){
    const rise=Math.min(1,entry.age/1.1)*30;
    const alpha=entry.age>entry.life-.35?Math.max(0,(entry.life-entry.age)/.35):1;
    ctx.save();ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.font=`bold 15px ${FONT}`;ctx.strokeStyle='#173d46';ctx.lineWidth=4;ctx.strokeText(entry.text,entry.x,entry.y-rise);ctx.fillStyle=entry.color;ctx.fillText(entry.text,entry.x,entry.y-rise);ctx.restore();
  }
}
