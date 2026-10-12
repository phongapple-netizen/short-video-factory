import React from 'react';
import {AbsoluteFill} from 'remotion';
import {W,H,SAFE,LEFT,RIGHT,SIDES} from '../layout';
export const C={paper:'#F7F5EF',ink:'#172D3D',muted:'#60727D',line:'#DADDD7',blue:'#386AA9',teal:'#147E75',orange:'#BF5434',gold:'#956E17'};
export {FONT} from '../../../shared/profile';
import {FONT} from '../../../shared/profile';
export const Frame:React.FC<{step:number;eyebrow:string;title:React.ReactNode;children:React.ReactNode;titleSize?:number;cover?:boolean;brand?:string;totalSteps?:number}>=({step,eyebrow,title,children,titleSize=64,cover=false,brand='几何实验室',totalSteps=7})=><AbsoluteFill style={{background:C.paper,color:C.ink,fontFamily:FONT}}>
  <svg width={W} height={H} style={{position:'absolute',inset:0}}>
    <path d={`M${LEFT} ${SAFE.top+62}H${RIGHT}`} stroke={C.line}/>
    <circle cx={LEFT+20} cy={SAFE.top+25} r={17} fill={C.blue}/>
    <path d={`M${LEFT+8} ${SAFE.top+25}H${LEFT+32}M${LEFT+20} ${SAFE.top+13}V${SAFE.top+37}`} stroke={C.paper} strokeWidth={3}/>
  </svg>
  <div style={{position:'absolute',left:LEFT+52,top:SAFE.top+2,fontSize:30,fontWeight:800,letterSpacing:2}}>{brand}</div>
  {!cover&&<div style={{position:'absolute',right:SIDES.right,top:SAFE.top+2,fontSize:30,color:C.muted}}><b style={{fontSize:32,color:C.ink}}>{String(step).padStart(2,'0')}</b> / {String(totalSteps).padStart(2,'0')}</div>}
  <div style={{position:'absolute',left:LEFT,top:SAFE.top+78,fontSize:30,color:C.muted,fontWeight:800}}>{eyebrow}</div>
  <div style={{position:'absolute',...SIDES,top:SAFE.top+132,fontSize:titleSize,lineHeight:1.25,fontWeight:900,letterSpacing:-2}}>{title}</div>
  {children}
</AbsoluteFill>;
export const Pill:React.FC<{children:React.ReactNode;color?:string}>=({children,color=C.blue})=><span style={{display:'inline-flex',alignItems:'center',padding:'9px 18px',background:`${color}10`,borderRadius:40,fontSize:32,fontWeight:800,color}}>{children}</span>;
export const SafeOverlay=()=> <svg width={W} height={H} style={{position:'absolute',inset:0,pointerEvents:'none'}}><rect x={SAFE.left} y={SAFE.top} width={SAFE.right-SAFE.left} height={SAFE.bottom-SAFE.top} fill='none' stroke='#C72C44' strokeWidth={2} strokeDasharray='12 8'/></svg>;
