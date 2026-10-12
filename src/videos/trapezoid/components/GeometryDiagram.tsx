import React from 'react';
import {interpolate,Easing} from 'remotion';
import {P,type Point,SQRT2} from '../geometry';
import {SAFE} from '../layout';
import {C,FONT} from './Frame';

export const DIAGRAM_WIDTH=SAFE.right-SAFE.left;
export const DIAGRAM_HEIGHT=600;
export const GEOMETRY_WIDTH=780;
const SCALE=GEOMETRY_WIDTH/(20*SQRT2);
const BASELINE=460;
export const project=(p:Point):Point=>({x:DIAGRAM_WIDTH/2+p.x*SCALE,y:BASELINE-p.y*SCALE});
const V=Object.fromEntries(Object.entries(P).map(([name,p])=>[name,project(p)])) as Record<keyof typeof P,Point>;
const R=Math.hypot(V.C.x-V.M.x,V.C.y-V.M.y);
const points=(names:(keyof typeof P)[])=>names.map(name=>`${V[name].x},${V[name].y}`).join(' ');
const normalized=(p:Point,v:Point)=>{const dx=p.x-v.x,dy=p.y-v.y,d=Math.hypot(dx,dy);return {x:dx/d,y:dy/d};};
const rightAngle=(v:Point,p:Point,q:Point,size=22)=>{
  const a=normalized(p,v),b=normalized(q,v);
  return `${v.x+a.x*size},${v.y+a.y*size} ${v.x+(a.x+b.x)*size},${v.y+(a.y+b.y)*size} ${v.x+b.x*size},${v.y+b.y*size}`;
};
const arc=(v:Point,p:Point,q:Point,r:number)=>{
  const a=Math.atan2(p.y-v.y,p.x-v.x),b=Math.atan2(q.y-v.y,q.x-v.x);
  let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
  const start={x:v.x+r*Math.cos(a),y:v.y+r*Math.sin(a)};
  const end={x:v.x+r*Math.cos(a+d),y:v.y+r*Math.sin(a+d)};
  return `M${start.x},${start.y} A${r},${r} 0 0 ${d>0?1:0} ${end.x},${end.y}`;
};
const Label:React.FC<{x:number;y:number;children:React.ReactNode;color?:string;size?:number;anchor?:'start'|'middle'|'end'}>=({x,y,children,color=C.ink,size=36,anchor='middle'})=><text x={x} y={y} fontFamily={FONT} fontSize={size} fontWeight={800} fill={color} textAnchor={anchor} dominantBaseline='middle' stroke={C.paper} strokeWidth={9} paintOrder='stroke' strokeLinejoin='round'>{children}</text>;
const EqualMarks:React.FC<{a:Point;b:Point;double?:boolean}>=({a,b,double=false})=>{
  const u=normalized(b,a),n={x:-u.y,y:u.x},mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  return <>{(double?[-5,5]:[0]).map((offset,i)=><line key={i} x1={mid.x+u.x*offset-n.x*10} y1={mid.y+u.y*offset-n.y*10} x2={mid.x+u.x*offset+n.x*10} y2={mid.y+u.y*offset+n.y*10} stroke={C.orange} strokeWidth={4}/>)}</>;
};

type Props={stage:number;time:number;staticDiagram?:boolean;areaAt?:number;centralAt?:number};
export const GeometryDiagram:React.FC<Props>=({stage,time,staticDiagram=false,areaAt=5,centralAt=3})=>{
 const opening=stage===0&&!staticDiagram;
 const reveal=opening?interpolate(time,[0,1.2],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.2,.8,.2,1)}):1;
 const opacity=opening?interpolate(time,[.8,2],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):1;
 const centralOpacity=stage===3?interpolate(time,[centralAt,centralAt+1.2],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):1;
 const circle=stage===2||stage===3||stage===5;
 const height=stage===4&&time<areaAt;
 const area=stage===4&&time>=areaAt;
 const amb=stage===3||stage===5||height;
 const original=stage<=3||stage===5||stage===6;
 const triangle=stage===1?['A','O','D']:stage===2?(time<4.5?['A','C','D']:['B','C','D']):amb?['A','M','B']:area?['A','B','C']:[];
 const clipHeight=(BASELINE+65-(V.A.y-92))*reveal;
 return <svg width={DIAGRAM_WIDTH} height={DIAGRAM_HEIGHT} viewBox={`0 0 ${DIAGRAM_WIDTH} ${DIAGRAM_HEIGHT}`} role='img' aria-label='短底AB在上，长底CD在下；M为CD中点，N为AB中点'>
 <defs><clipPath id='draw-up'><rect x={0} y={BASELINE+65-clipHeight} width={DIAGRAM_WIDTH} height={clipHeight}/></clipPath></defs>
 <g clipPath={opening?'url(#draw-up)':undefined}>
 <polygon points={points(['A','B','C','D'])} fill='#EAF0F4' fillOpacity={.7}/>
 {triangle.length>0&&<polygon points={points(triangle as (keyof typeof P)[])} fill={C.teal} fillOpacity={.2}/>}
 <polygon points={points(['D','C','B','A'])} fill='none' stroke={C.blue} strokeWidth={4.5} strokeLinejoin='round'/>
 {circle&&<path opacity={stage===2?interpolate(time,[1,3],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):1} d={`M${V.D.x},${V.D.y} A${R},${R} 0 0 1 ${V.C.x},${V.C.y}`} fill='none' stroke={C.gold} strokeWidth={3.5} strokeDasharray={stage===2?'9 6':undefined}/>}
 <g opacity={opacity}>
 {original&&<>
 <line x1={V.A.x} y1={V.A.y} x2={V.C.x} y2={V.C.y} stroke={C.teal} strokeWidth={4}/>
 <line x1={V.B.x} y1={V.B.y} x2={V.D.x} y2={V.D.y} stroke={C.orange} strokeWidth={4}/>
 <polyline points={rightAngle(V.A,V.C,V.D)} fill='none' stroke={C.orange} strokeWidth={4}/>
 <polyline points={rightAngle(V.B,V.D,V.C)} fill='none' stroke={C.orange} strokeWidth={4}/>
 {stage<=1||stage===6?<><circle cx={V.O.x} cy={V.O.y} r={5} fill={C.ink}/><Label x={V.O.x+18} y={V.O.y+40} anchor='start' size={34}>O</Label></>:null}
 </>}
 {stage===0||stage===6?<><path d={arc(V.O,V.A,V.B,54)} fill='none' stroke={C.orange} strokeWidth={3}/><Label x={V.O.x} y={V.O.y-82} color={C.orange} size={34}>135°</Label></>:null}
 {stage===1&&<>
 <polyline points={points(['A','O','D','A'])} fill='none' stroke={C.teal} strokeWidth={6}/>
 <path d={arc(V.O,V.A,V.D,44)} fill='none' stroke={C.teal} strokeWidth={3}/>
 <path d={arc(V.D,V.A,V.O,48)} fill='none' stroke={C.teal} strokeWidth={3}/>
 <EqualMarks a={V.A} b={V.D}/><EqualMarks a={V.A} b={V.O}/>
 <Label x={V.O.x-100} y={V.O.y+7} color={C.teal} size={32}>45°</Label>
 <Label x={V.D.x+94} y={V.D.y-74} color={C.teal} size={32}>45°</Label>
 </>}
 {(circle||height)&&<>
 <line x1={V.M.x} y1={V.M.y} x2={V.A.x} y2={V.A.y} stroke={C.gold} strokeWidth={4.5}/>
 <line x1={V.M.x} y1={V.M.y} x2={V.B.x} y2={V.B.y} stroke={C.gold} strokeWidth={4.5}/>
 <EqualMarks a={V.M} b={V.A}/><EqualMarks a={V.M} b={V.B}/>
 <circle cx={V.M.x} cy={V.M.y} r={5} fill={C.gold}/>
 <Label x={V.M.x} y={V.M.y+34} color={C.gold}>M</Label>
 </>}
 {stage===2&&<><EqualMarks a={V.M} b={V.D}/><EqualMarks a={V.M} b={V.C}/></>}
 {(stage===3||stage===5)&&<>
 <path d={arc(V.M,V.A,V.B,R)} fill='none' stroke={C.teal} strokeWidth={7}/>
 <path d={arc(V.D,V.A,V.B,48)} fill='none' stroke={C.orange} strokeWidth={4}/>
 <Label x={V.D.x+94} y={V.D.y-74} color={C.orange} size={32}>45°</Label>
 <polyline opacity={centralOpacity} points={rightAngle(V.M,V.A,V.B,28)} fill='none' stroke={C.gold} strokeWidth={4}/>
 <g opacity={centralOpacity}><Label x={V.M.x} y={V.M.y-92} color={C.gold} size={38}>90°</Label></g>
 </>}
 {height&&<>
 <polygon points={points(['A','N','M'])} fill={C.gold} fillOpacity={.15}/>
 <line x1={V.N.x} y1={V.N.y} x2={V.M.x} y2={V.M.y} stroke={C.teal} strokeWidth={5} strokeDasharray='9 6'/>
 <polyline points={rightAngle(V.N,V.A,V.M)} fill='none' stroke={C.teal} strokeWidth={4}/>
 <polyline points={rightAngle(V.M,V.A,V.B,25)} fill='none' stroke={C.gold} strokeWidth={4}/>
 <EqualMarks a={V.A} b={V.N} double/><EqualMarks a={V.N} b={V.M} double/>
 <Label x={V.N.x+20} y={V.N.y+31} anchor='start' size={34}>N</Label>
 <Label x={V.N.x+32} y={(V.N.y+V.M.y)/2} anchor='start' color={C.teal}>10</Label>
 <Label x={(V.A.x+V.N.x)/2} y={V.A.y+32} color={C.teal} size={32}>10</Label>
 <Label x={V.A.x+90} y={V.A.y+72} color={C.gold} size={32}>45°</Label>
 </>}
 {area&&<>
 <line x1={V.A.x} y1={V.A.y} x2={V.C.x} y2={V.C.y} stroke={C.teal} strokeWidth={4}/>
 <line x1={V.B.x} y1={V.B.y} x2={V.H.x} y2={V.H.y} stroke={C.muted} strokeWidth={3} strokeDasharray='8 6'/>
 <line x1={V.C.x} y1={V.C.y} x2={V.H.x} y2={V.H.y} stroke={C.gold} strokeWidth={5} strokeDasharray='9 6'/>
 <polyline points={rightAngle(V.H,V.B,V.C)} fill='none' stroke={C.gold} strokeWidth={3}/>
 <Label x={V.H.x+25} y={V.H.y-28} anchor='end' size={34}>H</Label>
 <Label x={V.C.x+4} y={(V.H.y+V.C.y)/2} anchor='start' color={C.gold} size={32}>10</Label>
 </>}
 <Label x={V.A.x-18} y={V.A.y-27} anchor='end'>A</Label>
 <Label x={V.B.x+18} y={V.B.y-27} anchor='start'>B</Label>
 <Label x={V.C.x+28} y={V.C.y+32} anchor='end'>C</Label>
 <Label x={V.D.x-23} y={V.D.y+32} anchor='start'>D</Label>
 <Label x={(V.A.x+V.B.x)/2} y={V.A.y-58} color={C.blue}>AB=20</Label>
 </g></g></svg>;
};
