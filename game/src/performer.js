import { FONT } from './config.js';

const audience = [
  ['#e8bf62','#efc39d','#29414b'],
  ['#4d9da3','#c68d66','#4a3628'],
  ['#d7748c','#87583e','#31456b'],
  ['#80a65d','#d8aa7c','#5d5348'],
  ['#7584b5','#f2d3ae','#703838'],
];

export function performerSpot(world) {
  const fountain = world.props.find(prop=>prop.kind==='fountain');
  return fountain ? {x:fountain.x+64, y:fountain.y+16} : {x:world.roads.vertical[4].x, y:world.beach.y+70};
}

function ellipse(ctx,x,y,rx,ry,color) {
  ctx.fillStyle=color;
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}

function circle(ctx,x,y,r,end,color,start=0) {
  ctx.fillStyle=color;
  ctx.beginPath();ctx.arc(x,y,r,start,end);ctx.fill();
}

export function drawPerformer(ctx,g,time) {
  if(!g || !g.world) return;
  const spot=performerSpot(g.world);
  ctx.save();ctx.textAlign='center';
  ellipse(ctx,spot.x,spot.y+10,48,16,'rgba(182,81,88,.55)');
  audience.forEach(([shirt,skin,pants],index)=>{
    const angle=Math.PI*(.18+.16*index), x=spot.x+Math.cos(angle)*40, y=spot.y+16+Math.sin(angle)*15;
    ellipse(ctx,x,y+6,10,4,'rgba(23,49,48,.2)');
    ctx.fillStyle=pants;ctx.fillRect(x-5,y-3,10,7);
    ellipse(ctx,x,y-8,7,9,shirt);
    circle(ctx,x,y-19,5,Math.PI*2,skin);
  });
  const bob=Math.sin(time*.003)*1.5, px=spot.x, py=spot.y+bob;
  ellipse(ctx,spot.x,spot.y+7,11,4,'rgba(23,49,48,.25)');
  ctx.fillStyle='#31456b';ctx.fillRect(px-5,py-4,10,8);
  ellipse(ctx,px,py-10,8,10,'#d85d4e');
  ctx.save();ctx.translate(px+9,py-8);ctx.rotate(.5);ctx.fillStyle='#805c42';ctx.fillRect(-3,-10,6,20);ctx.restore();
  circle(ctx,px,py-22,6,Math.PI*2,'#efc39d');
  circle(ctx,px,py-24,6,Math.PI*2,'#302c2b',Math.PI);
  ctx.font=`bold 13px ${FONT}`;ctx.fillStyle='#fff3dc';ctx.strokeStyle='#173d46';ctx.lineWidth=3;
  for(let k=0;k<3;k++){
    const phase=((time*.00035)+k/3)%1, nx=spot.x+12+Math.sin(phase*5+k*2)*7, ny=spot.y-30-phase*30;
    ctx.globalAlpha=1-phase;ctx.strokeText('♪',nx,ny);ctx.fillText('♪',nx,ny);
  }
  ctx.restore();
}
