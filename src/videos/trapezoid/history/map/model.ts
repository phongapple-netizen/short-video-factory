import {getLength,getPointAtLength} from '@remotion/paths';
import config from './world.json';

export type Point={x:number;y:number};
export type Camera={cx:number;cy:number;scale:number};
export const WORLD=config;
export const LOCATIONS=Object.fromEntries(config.locations.map(p=>[p.name,p]));
export const smoothPath=(points:number[][])=>{
 let d=`M${points[0][0]},${points[0][1]}`;
 for(let i=0;i<points.length-1;i++){
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
  d+=` C${p1[0]+(p2[0]-p0[0])/6},${p1[1]+(p2[1]-p0[1])/6} ${p2[0]-(p3[0]-p1[0])/6},${p2[1]-(p3[1]-p1[1])/6} ${p2[0]},${p2[1]}`;
 }
 return d;
};
export const RIVER=smoothPath(config.yangtze);
export const HAN=smoothPath(config.han);
export const ATTACK=config.navalAttackPath;
const riverLength=getLength(RIVER);
export const riverYAtX=(x:number)=>{
 let lo=0,hi=riverLength;
 for(let i=0;i<24;i++){
  const mid=(lo+hi)/2;const p=getPointAtLength(RIVER,mid)!;
  if(p.x<x)lo=mid;else hi=mid;
 }
 return getPointAtLength(RIVER,(lo+hi)/2)!.y;
};
// A serpentine ordering makes fire follow real adjacent connections between all 12 boats.
export const FLEET=Array.from({length:12},(_,i)=>{
 const row=i<6?0:1;const col=i<6?5-i:i-6;const x=536+15*col;
 return {x,y:riverYAtX(x)-(row===0?0:8)};
});
export const ALLY_FLEET=Array.from({length:10},(_,i)=>{const x=630+7*(i%5);return {x,y:riverYAtX(x)+11+Math.floor(i/5)*7};});
export const CAMPS=Array.from({length:5},(_,i)=>({x:527+i*7,y:1145+(i%2)*4}));
export const screenPoint=(p:Point,camera:Camera):Point=>({x:config.focus.x+(p.x-camera.cx)*camera.scale,y:config.focus.y+(p.y-camera.cy)*camera.scale});

const check=(condition:boolean,message:string)=>{if(!condition)throw new Error(`Map model: ${message}`);};
check(LOCATIONS['乌林'].y<riverYAtX(LOCATIONS['乌林'].x)-config.riverWidth/2,'Wulin must be north of the Yangtze');
check(LOCATIONS['赤壁'].y>riverYAtX(LOCATIONS['赤壁'].x)+config.riverWidth/2,'Chibi must be south of the Yangtze');
check(LOCATIONS['江陵'].x<LOCATIONS['乌林'].x&&LOCATIONS['乌林'].x<LOCATIONS['夏口'].x&&LOCATIONS['夏口'].x<LOCATIONS['樊口'].x&&LOCATIONS['樊口'].x<LOCATIONS['柴桑'].x,'Upstream-to-downstream order');
check(config.yangtze[0][0]===LOCATIONS['江陵'].x&&config.yangtze[config.yangtze.length-1]![0]===LOCATIONS['柴桑'].x,'Yangtze endpoints');
check(FLEET.length===12,'12 connected boats');
check(ALLY_FLEET.every(p=>Math.abs(p.y-riverYAtX(p.x))<config.riverWidth/2),'Allied boats must float on the river');
export const MAP_AUDIT={wulin:LOCATIONS['乌林'],riverAtWulin:riverYAtX(585),chibi:LOCATIONS['赤壁'],riverAtChibi:riverYAtX(655),riverEndpoints:[config.yangtze[0],config.yangtze[config.yangtze.length-1]],fleet:FLEET,alliedFleet:ALLY_FLEET,labelScreenPx:34,routeScreenPx:6};
