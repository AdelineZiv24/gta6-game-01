import { createRandom } from './random.js';
const random=createRandom('bay-walkers');
const shirts=['#e8bf62','#4d9da3','#d7748c','#f3ebd7','#7584b5','#80a65d','#bc876e','#9da8ce','#ce9f72','#75b8a3'];
const skins=['#efc39d','#c68d66','#87583e','#d8aa7c'];
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
  for(let i=0;i<64;i++){const n=Math.floor(random()*nodes.length),p=makePerson(nodes[n].x,nodes[n].y);p.node=n;p.target=nodes[n].links[0];pool.people.push(p);}
  return pool;
}
function makePerson(x,y){return {x,y,node:0,target:0,state:'walk',pause:random(),panic:0,facing:0,stride:0,shirt:shirts[Math.floor(random()*shirts.length)],skin:skins[Math.floor(random()*skins.length)],complaint:0,hitCooldown:0};}
export function addFleeingPedestrian(pool,x,y){let p=pool.people.find(p=>p.state!=='down'&&p.panic===0);if(!p)return;p.x=x;p.y=y;p.state='flee';p.panic=7;p.pause=0;let nearest=Infinity;for(let i=0;i<pool.nodes.length;i++){const n=pool.nodes[i],d=Math.hypot(n.x-x,n.y-y);if(d<nearest){nearest=d;p.target=i;p.node=i;}}}
export function updatePedestrians(pool,world,focus,cars,crimes,dt,report) {
  for(const p of pool.people){if(p.state==='down')continue;
    if(Math.hypot(p.x-focus.x,p.y-focus.y)>1150)continue;
    p.hitCooldown=Math.max(0,p.hitCooldown-dt);p.complaint=Math.max(0,p.complaint-dt);
    for(const crime of crimes)if(crime.id>pool.lastCrime&&crime.violent&&Math.hypot(p.x-crime.x,p.y-crime.y)<340)p.panic=6;
    let threat=null;
    for(const car of cars){const dx=p.x-car.x,dy=p.y-car.y,d=Math.hypot(dx,dy);
      if((car.impact>60&&d<240)||(Math.abs(car.speed)>130&&d<160&&dx*car.vx+dy*car.vy>0)){p.panic=5;threat=car;}
      if(d<car.radius+9&&p.hitCooldown===0){p.hitCooldown=1;
        if(Math.abs(car.speed)>65){p.state='down';if(car.driver==='player-driven')report('pedestrian_hit',p.x,p.y,3,true);car.speed*=.8;break;}
        const length=d||1;p.x+=dx/length*22;p.y+=dy/length*22;p.complaint=2;p.pause=.5;
      }
    }
    if(p.state==='down')continue;
    p.panic=Math.max(0,p.panic-dt);p.state=p.panic>0?'flee':'walk';
    if(p.pause>0&&p.panic===0){p.pause-=dt;continue;}
    const node=pool.nodes[p.target];let dx=node.x-p.x,dy=node.y-p.y;
    if(threat&&p.panic>0){dx+= (p.x-threat.x)*1.5;dy+=(p.y-threat.y)*1.5;}
    const d=Math.hypot(dx,dy),speed=p.panic>0?120:34;
    if(d<3){p.node=p.target;const links=node.links;p.target=links[Math.floor(random()*links.length)];const next=pool.nodes[p.target];p.pause=Math.hypot(next.x-node.x,next.y-node.y)<150? .8+random():random()*1.2;continue;}
    p.facing=Math.atan2(dy,dx);const step=Math.min(d,speed*dt),nx=p.x+dx/d*step,ny=p.y+dy/d*step;
    if(!world.collidesCircle(nx,ny,8)&&ny<world.water.y){p.x=nx;p.y=ny;p.stride+=step*.16;}else {p.panic=0;p.target=p.node;}
  }
  if(crimes.length)pool.lastCrime=crimes[crimes.length-1].id;
}
export function drawPedestrian(ctx,p){ctx.save();ctx.fillStyle='rgba(23,49,48,.2)';ctx.beginPath();ctx.ellipse(p.x,p.y+6,10,4,0,0,Math.PI*2);ctx.fill();ctx.translate(p.x,p.y);ctx.rotate(p.facing);if(p.state==='down'){ctx.fillStyle='#714d44';ctx.beginPath();ctx.ellipse(0,0,16,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.shirt;ctx.fillRect(-9,-5,15,10);ctx.fillStyle=p.skin;ctx.beginPath();ctx.arc(10,0,5,0,7);ctx.fill();}else{ctx.fillStyle='#29414b';const swing=Math.sin(p.stride)*3;ctx.fillRect(-5+swing,-7,9,4);ctx.fillRect(-5-swing,3,9,4);ctx.fillStyle=p.shirt;ctx.beginPath();ctx.ellipse(0,0,7,9,0,0,7);ctx.fill();ctx.fillStyle=p.skin;ctx.beginPath();ctx.arc(3,0,5,0,7);ctx.fill();}ctx.restore();if(p.complaint>0){ctx.fillStyle='#fff4dc';ctx.font='bold 11px system-ui';ctx.fillText('Watch it!',p.x-20,p.y-19);}}
