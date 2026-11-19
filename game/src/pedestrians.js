import { createRandom } from './random.js';
import { downtownRect } from './storefronts.js';
const random=createRandom('bay-walkers');
const reactRandom=createRandom('bay-crowd-react');
const shirts=['#e8bf62','#4d9da3','#d7748c','#f3ebd7','#7584b5','#80a65d','#bc876e','#9da8ce','#ce9f72','#75b8a3','#d95f43','#3f6fb5','#e6e1f2','#58b368','#c94f7c','#f0a13c'];
const skins=['#efc39d','#c68d66','#87583e','#d8aa7c','#6e4630','#f2d3ae'];
const pants=['#29414b','#4a3628','#31456b','#5d5348','#703838'];
export const DOWNTOWN_SPAWN_WEIGHT = 4;
// Sidewalk corner graph: four pavement corners per city block, joined across kerbs.
export function createPedestrians(world,focus) {
  const nodes=[];const cols=world.roads.vertical.length-1,rows=world.roads.horizontal.length-1;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const x=world.roads.vertical[col].x+63,y=world.roads.horizontal[row].y+63;
    const right=world.roads.vertical[col+1].x-63,bottom=world.roads.horizontal[row+1].y-63;
    const base=nodes.length;
    nodes.push({x,y,links:[base+1,base+3]},{x:right,y,links:[base,base+2]},{x:right,y:bottom,links:[base+1,base+3]},{x,y:bottom,links:[base,base+2]});
    if(col>0){nodes[base].links.push(base-3);nodes[base-3].links.push(base);nodes[base+3].links.push(base-2);nodes[base-2].links.push(base+3);}
    if(row>0){const above=base-cols*4;nodes[base].links.push(above+3);nodes[above+3].links.push(base);nodes[base+1].links.push(above+2);nodes[above+2].links.push(base+1);}
  }
  // Bend crossing links onto the painted crosswalks, with pauses at each kerb.
  const cornerCount=nodes.length;
  for(let i=0;i<cornerCount;i++)for(let k=0;k<nodes[i].links.length;k++){
    const j=nodes[i].links[k];if(j<=i)continue;
    const a=nodes[i],b=nodes[j];if(Math.hypot(a.x-b.x,a.y-b.y)>150)continue;
    const horizontal=a.y===b.y;
    const mid=nodes.length;
    const ax=horizontal?a.x:a.x+(i%4===0||i%4===3?-27:27),ay=horizontal?a.y+(i%4<2?-27:27):a.y;
    const bx=horizontal?b.x:ax,by=horizontal?ay:b.y;
    nodes.push({x:ax,y:ay,links:[i,mid+1]},{x:bx,y:by,links:[mid,j]});
    a.links[k]=mid;b.links[b.links.indexOf(i)]=mid+1;
  }
  const pool={nodes,people:[],lastCrime:0};
  // Brief-34 downtown weighting: nodes inside the downtown rect (the lit
  // 3x3, roads 2..4 — the same rect the storefronts use) appear
  // DOWNTOWN_SPAWN_WEIGHT times in the spawn table, so the single uniform
  // pick lands downtown more often. The total count (96) and the rng draws
  // consumed per ped (one pick + makePerson's four) are unchanged.
  const spawnRect=downtownRect(world),spawnTable=[];
  for(let i=0;i<nodes.length;i++){spawnTable.push(i);const nd=nodes[i];if(nd.x>=spawnRect.x0&&nd.x<=spawnRect.x1&&nd.y>=spawnRect.y0&&nd.y<=spawnRect.y1)for(let k=1;k<DOWNTOWN_SPAWN_WEIGHT;k++)spawnTable.push(i);}
  for(let i=0;i<96;i++){const n=spawnTable[Math.floor(random()*spawnTable.length)],p=makePerson(nodes[n].x,nodes[n].y);p.node=n;p.target=nodes[n].links[0];p.umbrella=(Math.imul(i+1,2654435761)>>>0)%100<35;pool.people.push(p);}
  return pool;
}
function makePerson(x,y){return {x,y,node:0,target:0,state:'walk',pause:random(),panic:0,fleeX:0,fleeY:0,fleeT:0,fleeJit:0,crouch:0,bang:0,facing:0,stride:0,shirt:shirts[Math.floor(random()*shirts.length)],skin:skins[Math.floor(random()*skins.length)],pants:pants[Math.floor(random()*pants.length)],complaint:0,hitCooldown:0};}
export function addFleeingPedestrian(pool,x,y){let p=pool.people.find(p=>p.state!=='down'&&p.panic===0);if(!p)return;p.x=x;p.y=y;p.state='flee';p.panic=7;p.pause=0;let nearest=Infinity;for(let i=0;i<pool.nodes.length;i++){const n=pool.nodes[i],d=Math.hypot(n.x-x,n.y-y);if(d<nearest){nearest=d;p.target=i;p.node=i;}}}
export function startlePedestrians(pool, world, x, y, radius = 90) {
  let startled = 0;
  for (const p of pool.people) {
    if (p.state === 'down') continue;
    const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
    if (d > radius) continue;
    startled++;
    p.pause = Math.max(p.pause || 0, .6);
    if (d >= 1) { const nx = p.x + dx / d * 13, ny = p.y + dy / d * 13; if (!world.collidesCircle(nx, ny, 8) && ny < world.water.y) { p.x = nx; p.y = ny; } }
  }
  return startled;
}
export function updatePedestrians(pool,world,focus,cars,crimes,dt,report) {
  for(const p of pool.people){if(p.state==='down')continue;
    if(Math.hypot(p.x-focus.x,p.y-focus.y)>1150)continue;
    p.hitCooldown=Math.max(0,p.hitCooldown-dt);p.complaint=Math.max(0,p.complaint-dt);
    p.crouch=Math.max(0,p.crouch-dt);p.bang=Math.max(0,p.bang-dt);p.fleeT=Math.max(0,p.fleeT-dt);
    for(const crime of crimes){
      if(crime.id<=pool.lastCrime)continue;
      const cd=Math.hypot(p.x-crime.x,p.y-crime.y);
      if(crime.violent&&cd<340)p.panic=6;
      if(crime.violent&&crime.severity>=3&&cd<300&&cd>=1){
        p.fleeX=crime.x;p.fleeY=crime.y;p.fleeT=Math.max(p.fleeT,3.5);p.fleeJit=(reactRandom()-.5)*.9;
        if(crime.type==='explosion'&&cd<170){
          const sx=p.x+(p.x-crime.x)/cd*30,sy=p.y+(p.y-crime.y)/cd*30;
          if(!world.collidesCircle(sx,sy,8)&&sy<world.water.y){p.x=sx;p.y=sy;}
        }
      }
      if(crime.type==='weapon_fired'&&cd<230){
        if(reactRandom()<.45)p.crouch=Math.max(p.crouch,1+reactRandom());
        if(reactRandom()<.22)p.bang=Math.max(p.bang,.8);
      }
    }
    let threat=null;
    for(const car of cars){const dx=p.x-car.x,dy=p.y-car.y,d=Math.hypot(dx,dy);
      if((car.impact>60&&d<240)||(Math.abs(car.speed)>130&&d<160&&dx*car.vx+dy*car.vy>0)){if(p.panic===0&&d>=car.radius+9){const nx=p.x+dx/(d||1)*13,ny=p.y+dy/(d||1)*13;if(!world.collidesCircle(nx,ny,8)&&ny<world.water.y){p.x=nx;p.y=ny;}}p.panic=5;threat=car;}
      if(d<car.radius+9&&p.hitCooldown===0){p.hitCooldown=1;
        if(Math.abs(car.speed)>65){p.state='down';if(car.driver==='player-driven')report('pedestrian_hit',p.x,p.y,3,true);car.speed*=.8;break;}
        const length=d||1;p.x+=dx/length*22;p.y+=dy/length*22;p.complaint=2;p.pause=.5;
      }
    }
    if(p.state==='down')continue;
    p.panic=Math.max(0,p.panic-dt);p.state=p.panic>0?'flee':'walk';
    if(p.pause>0&&p.panic===0){p.pause-=dt;continue;}
    if(p.crouch>0)continue;
    const node=pool.nodes[p.target];let dx=node.x-p.x,dy=node.y-p.y;
    if(threat&&p.panic>0){dx+= (p.x-threat.x)*1.5;dy+=(p.y-threat.y)*1.5;}
    if(p.fleeT>0){const fx=p.x-p.fleeX,fy=p.y-p.fleeY,fd=Math.hypot(fx,fy)||1,ca=Math.cos(p.fleeJit),sa=Math.sin(p.fleeJit);dx=(fx/fd*ca-fy/fd*sa)*190;dy=(fx/fd*sa+fy/fd*ca)*190;}
    const d=Math.hypot(dx,dy),speed=p.panic>0?120:34;
    if(d<3){p.node=p.target;const links=node.links;p.target=links[Math.floor(random()*links.length)];const next=pool.nodes[p.target];p.pause=Math.hypot(next.x-node.x,next.y-node.y)<150? .8+random():random()*1.2;continue;}
    p.facing=Math.atan2(dy,dx);const step=Math.min(d,speed*dt),nx=p.x+dx/d*step,ny=p.y+dy/d*step;
    if(!world.collidesCircle(nx,ny,8)&&ny<world.water.y){p.x=nx;p.y=ny;p.stride+=step*.16;}else {p.panic=0;p.target=p.node;}
  }
  if(crimes.length)pool.lastCrime=crimes[crimes.length-1].id;
}
export function drawPedestrian(ctx,p,rain=false){ctx.save();ctx.fillStyle='rgba(23,49,48,.2)';ctx.beginPath();ctx.ellipse(p.x,p.y+6,10,4,0,0,Math.PI*2);ctx.fill();ctx.translate(p.x,p.y);ctx.rotate(p.facing);if(p.state==='down'){ctx.fillStyle='#714d44';ctx.beginPath();ctx.ellipse(0,0,16,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.shirt;ctx.fillRect(-9,-5,15,10);ctx.fillStyle=p.skin;ctx.beginPath();ctx.arc(10,0,5,0,7);ctx.fill();}else{if(p.crouch>0)ctx.scale(.72,.85);ctx.fillStyle=p.pants||'#29414b';const swing=Math.sin(p.stride)*3;ctx.fillRect(-5+swing,-7,9,4);ctx.fillRect(-5-swing,3,9,4);ctx.fillStyle=p.shirt;ctx.beginPath();ctx.ellipse(0,0,7,9,0,0,7);ctx.fill();ctx.fillStyle=p.skin;ctx.beginPath();ctx.arc(3,0,5,0,7);ctx.fill();}if(rain&&p.umbrella&&p.state!=='down'){ctx.fillStyle=p.shirt;ctx.beginPath();ctx.ellipse(2,0,12.5,8.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,240,207,.9)';ctx.beginPath();ctx.ellipse(2,0,7,4.8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#31456b';ctx.fillRect(1.2,-0.8,1.6,6);}ctx.restore();if(p.complaint>0){ctx.fillStyle='#fff4dc';ctx.font='bold 11px system-ui';ctx.fillText('Watch it!',p.x-20,p.y-19);}if(p.bang>0){ctx.fillStyle='#ffd166';ctx.font='bold 14px system-ui';ctx.fillText('!',p.x-2,p.y-22);}}
