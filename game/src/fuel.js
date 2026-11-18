import { spawnPopup } from './popups.js';
import { FONT } from './config.js';

export const FUEL_PRICE = .1;
export const REFILL_RATE = 55;
export const STATION_RADIUS = 62;

export function gasStations(world) {
  const v=world.roads.vertical,h=world.roads.horizontal;
  return [{x:v[1].x,y:h[1].y,name:'WESTSIDE GAS'},{x:v[5].x,y:h[4].y,name:'HARBOR GAS'},{x:v[2].x,y:h[6].y,name:'BEACH GAS'}];
}

export function createFuelState() {
  return {refilling:false,gain:0,paid:0,bill:0};
}

function endRefill(g) {
  const state=g.fuel,car=g.vehicle;
  state.refilling=false;
  if(car&&state.gain>=5){
    const cost=state.paid>0?`-$${state.paid}`:'FREE';
    spawnPopup(g.popups,car.x,car.y-44,`REFUELLED +${Math.round(state.gain)} · ${cost}`,state.paid>0?'#ffe16d':'#8df0a5');
  }
  state.gain=state.paid=state.bill=0;
}

export function updateFuel(g,dt) {
  const state=g.fuel,car=g.vehicle;
  if(!state)return;
  if(!car){endRefill(g);return;}
  if(car.fuel===undefined)car.fuel=100;
  const station=gasStations(g.world).find(station=>Math.hypot(station.x-car.x,station.y-car.y)<=STATION_RADIUS);
  const active=station&&Math.abs(car.speed)<6&&car.fuel<100;
  if(active){
    if(!state.refilling){state.refilling=true;state.gain=state.paid=state.bill=0;}
    const gain=Math.min(100-car.fuel,REFILL_RATE*dt);
    car.fuel+=gain;state.gain+=gain;state.bill+=gain*FUEL_PRICE;
    const due=Math.min(g.player.cash,Math.floor(state.bill));
    if(due>0){g.player.cash-=due;state.paid+=due;state.bill-=due;}
    if(g.player.cash<=0)state.bill=0;
    if(car.fuel>=100)endRefill(g);
  }else if(state.refilling)endRefill(g);
}

export function drawFuelWorld(ctx,g,time) {
  if(!g.world)return;
  const pulse=1+Math.sin(time*.005)*.12;
  ctx.save();ctx.textAlign='center';
  for(const station of gasStations(g.world)){
    ctx.strokeStyle='#7be3f0cc';ctx.fillStyle='#7be3f022';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(station.x,station.y+4,30*pulse,14*pulse,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    for(const offset of [-40,40]){
      const x=station.x+offset,y=station.y+offset;
      ctx.fillStyle='rgba(38,66,64,0.25)';ctx.beginPath();ctx.roundRect(x-8,y-12,18,26,3);ctx.fill();
      ctx.fillStyle='#d45748';ctx.beginPath();ctx.roundRect(x-10,y-15,18,26,3);ctx.fill();
      ctx.fillStyle='#fff3dc';ctx.fillRect(x-6,y-11,10,8);
      ctx.fillStyle='#173d46';ctx.fillRect(x+5,y-4,3,10);
    }
    ctx.font=`bold 12px ${FONT}`;ctx.strokeStyle='#173d46';ctx.lineWidth=4;ctx.fillStyle='#fff3dc';
    ctx.strokeText('FUEL',station.x,station.y-30);ctx.fillText('FUEL',station.x,station.y-30);
  }
  ctx.restore();
}
