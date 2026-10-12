import React from 'react';
import {AbsoluteFill,Audio,Sequence,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import profile,{W,H,FONT,SAFE,LEFT,RIGHT,SIDES,THEME} from './profile';
export type StoryContent={id:string;title:string;coverSubtitle:string;brand:string;subject:string;model:Record<string,unknown>;scenes:{id:string;title:string;plannedSeconds:number;cues:{id:string;text:string;voiceText:string}[]}[]};
export type StoryRuntime={timingMode:string;durationInFrames:number;scenes:{id:string;start:number;end:number}[];captions:{id:string;scene:string;start:number;end:number;text:string;audio?:string|null}[]};
export type DiagramProps={model:Record<string,unknown>;progress:number;sceneIndex:number};
export function useFrameAudit(ref:React.RefObject<HTMLDivElement|null>,frame:number,enabled:boolean){
 React.useLayoutEffect(()=>{
  if(!enabled||!ref.current)return;
  const origin=ref.current.getBoundingClientRect();
  const labels=Array.from(ref.current.querySelectorAll('[data-safe],svg text')).map(el=>{
   const r=el.getBoundingClientRect(),style=getComputedStyle(el);
   const matrix=el instanceof SVGGraphicsElement?el.getScreenCTM():null;
   const font=parseFloat(style.fontSize)*(matrix?Math.hypot(matrix.a,matrix.b):1);
   const bounds=[r.left-origin.left,r.top-origin.top,r.right-origin.left,r.bottom-origin.top];
   return {text:el.textContent,bounds,screenFont:font,withinSafe:bounds[0]>=SAFE.left-.1&&bounds[2]<=SAFE.right+.1&&bounds[1]>=SAFE.top-.1&&bounds[3]<=SAFE.bottom+.1};
  });
  console.warn('FACTORY_AUDIT '+JSON.stringify({frame,labels,titleCount:ref.current.querySelectorAll('[data-title]').length}));
 },[frame,enabled,ref]);
}
export const StoryVideo=({content,runtime,Diagram,debugAudit=false,showSafeArea=false}:{content:StoryContent;runtime:StoryRuntime;Diagram:React.FC<DiagramProps>;debugAudit?:boolean;showSafeArea?:boolean})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),seconds=frame/fps,ref=React.useRef<HTMLDivElement>(null);
 useFrameAudit(ref,frame,debugAudit);
 const index=Math.max(0,runtime.scenes.findIndex(s=>seconds>=s.start&&seconds<s.end));
 const timing=runtime.scenes[index],scene=content.scenes[index],local=seconds-timing.start;
 const cue=runtime.captions.find(c=>seconds>=c.start&&seconds<c.end);
 const opacity=(index===0?1:interpolate(local,[0,.25],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}))*interpolate(local,[timing.end-timing.start-.25,timing.end-timing.start],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill ref={ref} style={{background:THEME.paper,fontFamily:FONT,color:THEME.ink}}>
  <div data-safe style={{position:'absolute',...SIDES,top:SAFE.top,fontSize:32,fontWeight:800,display:'flex',justifyContent:'space-between'}}><span>{content.brand}</span><span>{index+1}/{content.scenes.length}</span></div>
  <div data-safe data-title style={{position:'absolute',...SIDES,top:SAFE.top+85,fontSize:profile.typography.opening_title_px,lineHeight:1.22,fontWeight:900,opacity,whiteSpace:'pre-line'}}>{scene.title}</div>
  <svg style={{position:'absolute',left:LEFT,top:560}} width={RIGHT-LEFT} height={760} viewBox={`0 0 ${RIGHT-LEFT} 760`}><Diagram model={content.model} progress={Math.min(1,local/Math.max(.1,timing.end-timing.start))} sceneIndex={index}/></svg>
  {cue&&<div data-safe data-caption style={{position:'absolute',...SIDES,top:SAFE.bottom-profile.layout.subtitle_height,height:profile.layout.subtitle_height,boxSizing:'border-box',padding:'14px 22px',background:'#FFFFFF',border:`1px solid ${THEME.line}`,borderRadius:18,fontSize:profile.typography.subtitle_px,lineHeight:profile.typography.subtitle_line_height,fontWeight:650,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center'}}><span>{cue.text}</span></div>}
  {runtime.captions.filter(c=>c.audio).map(c=><Sequence key={c.id} from={Math.round(c.start*fps)} durationInFrames={Math.ceil((c.end-c.start)*fps)} premountFor={fps}><Audio src={staticFile(c.audio!)}/></Sequence>)}
  {showSafeArea&&<svg width={W} height={H} style={{position:'absolute'}}><rect x={SAFE.left} y={SAFE.top} width={SAFE.right-SAFE.left} height={SAFE.bottom-SAFE.top} fill='none' stroke='#C72C44' strokeDasharray='12 8'/></svg>}
 </AbsoluteFill>;
};
export const StoryCover=({content,Diagram}:{content:StoryContent;Diagram:React.FC<DiagramProps>})=><AbsoluteFill style={{background:THEME.paper,color:THEME.ink,fontFamily:FONT}}>
 <div style={{position:'absolute',...SIDES,top:SAFE.top,fontSize:34,fontWeight:800}}>{content.brand}</div>
 <div style={{position:'absolute',...SIDES,top:SAFE.top+85,fontSize:88,lineHeight:1.22,fontWeight:900,whiteSpace:'pre-line'}}>{content.title}</div>
 <div style={{position:'absolute',...SIDES,top:SAFE.top+340,fontSize:36,fontWeight:750,color:THEME.secondary}}>{content.coverSubtitle}</div>
 <svg style={{position:'absolute',left:LEFT,top:650}} width={RIGHT-LEFT} height={760}><Diagram model={content.model} progress={1} sceneIndex={content.scenes.length-1}/></svg>
</AbsoluteFill>;
