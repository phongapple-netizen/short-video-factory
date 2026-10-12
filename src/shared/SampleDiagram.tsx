import React from 'react';
import {evolvePath} from '@remotion/paths';
import {FONT,THEME} from './profile';
import type {DiagramProps} from './story';
export const SampleDiagram:React.FC<DiagramProps>=({model,progress,sceneIndex})=>{
 const style={fontFamily:FONT,fontSize:34,fontWeight:800,fill:THEME.ink};
 if(model.kind==='triangle'){
  const base=Number(model.base),height=Number(model.height);
  if(!(base>0&&height>0))throw Error('三角形底和高必须为正数');
  const ratio=Math.min(520/base,360/height),bottom=440,top=bottom-height*ratio,right=120+base*ratio;
  return <g>
   <path d={`M120,${bottom} L${right},${bottom} L${120+base*ratio*.65},${top}Z`} fill='#386AA915' stroke={THEME.accent} strokeWidth={5}/>
   <line x1={120+base*ratio*.65} y1={top} x2={120+base*ratio*.65} y2={bottom} stroke={THEME.secondary} strokeWidth={4} strokeDasharray='10 8'/>
   <text {...style} x={120+base*ratio/2} y={bottom+55} textAnchor='middle'>底 {base} cm</text>
   <text {...style} x={right-70} y={(top+bottom)/2}>高 {height} cm</text>
   <text {...style} fontSize={46} x={420} y={600} textAnchor='middle'>{sceneIndex>0?`${base}×${height}÷2=${base*height/2}`:'面积是多少？'}</text>
  </g>;
 }
 if(model.kind==='route'){
  const points=model.points as {name:string;x:number;y:number}[],d=String(model.river),route=String(model.route);
  return <g>
   <path d={d} fill='none' stroke='#6b8fa3' strokeWidth={55} opacity={.45} strokeLinecap='round'/>
   <path d={route} {...evolvePath(progress,route)} fill='none' stroke='#b5412f' strokeWidth={6}/>
   {points.map(p=><g key={p.name}><circle cx={p.x} cy={p.y} r={7} fill={THEME.accent}/><text {...style} x={p.x} y={p.y-28} textAnchor='middle'>{p.name}</text></g>)}
   <text {...style} x={420} y={670} textAnchor='middle'>示意图，非精确地理</text>
  </g>;
 }
 if(model.kind==='forces'){
  const weight=Number(model.mass)*Number(model.gravity);if(!(weight>0))throw Error('质量和重力加速度必须为正数');
  return <g>
   <line x1={100} y1={390} x2={730} y2={390} stroke={THEME.muted} strokeWidth={5}/>
   <rect x={260} y={285} width={190} height={105} rx={12} fill='#386AA925' stroke={THEME.accent} strokeWidth={4}/>
   <path d='M355,340V150 M340,175L355,150L370,175' fill='none' stroke={THEME.secondary} strokeWidth={6}/>
   <path d='M355,340V565 M340,540L355,565L370,540' fill='none' stroke='#BF5434' strokeWidth={6}/>
   <text {...style} x={475} y={205}>支持力 {weight} N</text><text {...style} x={475} y={520}>重力 {weight} N</text>
   <text {...style} x={420} y={680} textAnchor='middle'>静止在水平桌面上</text>
  </g>;
 }
 if(model.kind==='molecules'){
  const atom=(x:number,y:number,label:string)=><g><circle cx={x} cy={y} r={25} fill={label==='O'?'#BF543430':'#386AA925'} stroke={label==='O'?'#BF5434':THEME.accent} strokeWidth={3}/><text {...style} fontSize={30} x={x} y={y+11} textAnchor='middle'>{label}</text></g>;
  return <g>
   {atom(100,210,'H')}{atom(150,210,'H')}{atom(100,400,'H')}{atom(150,400,'H')}{atom(270,305,'O')}{atom(320,305,'O')}
   <path d='M380,305H465 M445,285L465,305L445,325' fill='none' stroke={THEME.secondary} strokeWidth={6}/>
   {[210,400].map(y=><g key={y}>{atom(630,y,'O')}{atom(583,y+40,'H')}{atom(677,y+40,'H')}</g>)}
   <text {...style} fontSize={46} x={420} y={610} textAnchor='middle'>2H₂ + O₂ → 2H₂O</text><text {...style} x={420} y={680} textAnchor='middle'>粒子示意：原子数守恒</text>
  </g>;
 }
 throw Error('需要为本题提供Diagram组件或有效model.kind');
};
