import React from 'react';
import {AbsoluteFill,Audio,Easing,Img,Sequence,interpolate,random,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {evolvePath,getLength,getPointAtLength,getTangentAtLength} from '@remotion/paths';
import source from '../chibi.json';
import runtime from '../chibi.runtime.json';
import {Highlight} from '../video';
import {CaptionBox} from '../../components/CaptionBox';
import {FONT,SafeOverlay} from '../../components/Frame';
import {H,W,SAFE_TOP,SAFE_BOTTOM,SAFE_LEFT,SAFE_RIGHT,SUBTITLE_HEIGHT} from '../../layout';
import {WORLD,RIVER,HAN,ATTACK,FLEET,ALLY_FLEET,CAMPS,screenPoint,type Camera,type Point} from './model';

const CLAMP={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const EASE={...CLAMP,easing:Easing.inOut(Easing.cubic)};
const FIRST=runtime.scenes[3],SECOND=runtime.scenes[4];
export const MAP_PREVIEW_FRAMES=FIRST.durationInFrames+SECOND.durationInFrames;
const COLOR=WORLD.colors;
const attackLength=getLength(ATTACK);
const captionBottom=SAFE_BOTTOM-SUBTITLE_HEIGHT;

export const cameraFor=(stage:4|5,time:number,duration:number):Camera=>{
 if(stage===4)return {
  cx:interpolate(time,[0,1.2],[650,620],EASE),cy:interpolate(time,[0,1.2],[1150,1185],EASE),
  scale:interpolate(time,[0,1.2,duration-.8,duration],[2.4,4.2,4.2,3.4],EASE),
 };
 return {cx:620,cy:1185,scale:interpolate(time,[0,duration],[3.4,2.6],EASE)};
};

const MapLabel:React.FC<{point:Point;camera:Camera;text:string;color?:string;dx?:number;dy?:number}>=({point,camera,text,color='#493C2B',dx=0,dy=0})=>{
 const x=point.x+dx/camera.scale,y=point.y+dy/camera.scale;
 const screen=screenPoint({x,y},camera);const width=text.length*34+20;
 if(screen.x-width/2<SAFE_LEFT+5||screen.x+width/2>SAFE_RIGHT-5||screen.y<535||screen.y>captionBottom-36)return null;
 return <>
  {Math.abs(dy)>50&&<line x1={point.x} y1={point.y} x2={x} y2={y+(dy<0?23:-23)/camera.scale} stroke={color} strokeWidth={1.3/camera.scale} opacity={.65}/>}
  <g transform={`translate(${x},${y})`}>
  <rect x={-width/2/camera.scale} y={-23/camera.scale} width={width/camera.scale} height={46/camera.scale} rx={9/camera.scale} fill={COLOR.paper} fillOpacity={.88}/>
  <text textAnchor='middle' dominantBaseline='central' fontFamily={FONT} fontWeight={850} fontSize={34/camera.scale} fill={color}>{text}</text>
 </g></>;
};

const Boat:React.FC<{point:Point;scale:number;angle?:number;size?:number;allied?:boolean;burning?:boolean;opacity?:number}>=({point,scale,angle=0,size=1,allied=false,burning=false,opacity=1})=>
 <g transform={`translate(${point.x},${point.y}) rotate(${angle}) scale(${size})`} opacity={opacity}>
  <path d='M-5,-1.2 L5,-1.2 L3.2,2.7 L-3.6,2.7Z' fill={burning?'#DF6329':allied?COLOR.liu:COLOR.cao} stroke={allied?COLOR.sun:'#744738'} strokeWidth={1.4/scale}/>
  <path d='M0,-1V-8 L3.8,-3 H0' fill={burning?'#F8A642':allied?'#84AE93':'#BE7856'} stroke={allied?COLOR.sun:'#875139'} strokeWidth={1/scale}/>
 </g>;

const Flame:React.FC<{point:Point;scale:number;time:number;seed:string;strength?:number}>=({point,scale,time,seed,strength=1})=>{
 const pulse=1+.12*Math.sin(time*5+random(seed)*8);
 return <g transform={`translate(${point.x},${point.y})`} opacity={strength}>
  <ellipse rx={8*pulse} ry={8*pulse} cy={-2} fill='#E15825' opacity={.14}/>
  <path d={`M-3,2 Q-6,-5 -1,-11 Q-2,-6 1,-8 Q6,-4 3,2Z`} fill='#D64C27'/>
  <path d='M-1.5,2 Q-3,-3 1,-6 Q1,-2 3,0 L1,3Z' fill='#FFB545'/>
  {Array.from({length:4},(_,i)=>{
   const phase=(time*.43+random(`${seed}-${i}`))%1;
   return <circle key={i} cx={(random(`${seed}-x-${i}`)-.5)*8-phase*4} cy={-phase*16} r={1.3/scale} fill='#E78332' opacity={Math.sin(phase*Math.PI)*.8}/>;
  })}
 </g>;
};

const ArrowPath:React.FC<{path:string;progress:number;color:string;scale:number}>=({path,progress,color,scale})=>{
 const p=Math.max(0,Math.min(1,progress)),length=getLength(path),head=getPointAtLength(path,p*length)!;
 const tangent=getTangentAtLength(path,Math.max(.01,p*length))??{x:1,y:0};
 return <>
  <path d={path} {...evolvePath(p,path)} fill='none' stroke={color} strokeWidth={6/scale} strokeLinecap='round'/>
  {p>0&&<path d={`M0,0 L${-15/scale},${-8/scale} L${-15/scale},${8/scale}Z`} fill={color} transform={`translate(${head.x},${head.y}) rotate(${Math.atan2(tangent.y,tangent.x)*180/Math.PI})`}/>}
 </>;
};

const ConnectedFleet:React.FC<{camera:Camera;stage:4|5;time:number}>=({camera,stage,time})=>{
 const fireTime=stage===5?time:0;
 return <>
  {FLEET.slice(1).map((boat,i)=>{
   const previous=FLEET[i];const p=stage===5?1:interpolate(time,[1.2+i*.22,1.6+i*.22],[0,1],CLAMP);
   const d=`M${previous.x},${previous.y+1}L${boat.x},${boat.y+1}`;
   return <path key={i} d={d} {...evolvePath(p,d)} stroke={COLOR.cao} strokeWidth={2/camera.scale} fill='none' opacity={.85}/>;
  })}
  {FLEET.map((boat,i)=>{
   const entered=stage===5?1:interpolate(time,[i*.09,.7+i*.09],[0,1],EASE);
   const point={x:boat.x-(1-entered)*22,y:boat.y};
   const burning=stage===5&&fireTime>=4.8+i*.25;
   return <g key={i}>
    <Boat point={point} scale={camera.scale} opacity={entered} burning={burning}/>
    {burning&&<Flame point={point} scale={camera.scale} time={fireTime-(4.8+i*.25)} seed={`boat-${i}`}/>}
   </g>;
  })}
 </>;
};

const FireShips:React.FC<{camera:Camera;stage:4|5;time:number}>=({camera,stage,time})=><>
 {stage===5&&<ArrowPath path={ATTACK} progress={interpolate(time,[1.8,4.8],[0,1],CLAMP)} color={COLOR.sun} scale={camera.scale}/>}
 {Array.from({length:10},(_,i)=>{
  const progress=stage===4?0:interpolate(time,[1.8+i*.11,4.8+i*.11],[0,1],EASE);
  const point=getPointAtLength(ATTACK,progress*attackLength)!;
  const tangent=getTangentAtLength(ATTACK,Math.max(.01,progress*attackLength))??{x:-1,y:-1};
  const start=getPointAtLength(ATTACK,0)!;
  const initial=ALLY_FLEET[i];
  const offset={x:point.x+(initial.x-start.x)*(1-progress),y:point.y+(initial.y-start.y)*(1-progress)};
  return <Boat key={i} point={offset} angle={Math.atan2(tangent.y,tangent.x)*180/Math.PI} scale={camera.scale} size={.66} allied opacity={progress>=.99?.15:1}/>;
 })}
</>;

const Wind:React.FC<{camera:Camera;time:number}>=({camera,time})=> <g opacity={interpolate(time,[.3,1,8,10],[0,.48,.48,.1],CLAMP)}>
 {Array.from({length:4},(_,i)=>{
  const d=`M${697+i*3},${1250+i*6} C${673+i*3},${1237+i*6} ${605+i*3},${1164+i*6} ${572+i*3},${1149+i*6}`;
  const p=(time*.16+i*.18)%1;
  return <ArrowPath key={i} path={d} progress={p} color='#497D8B' scale={camera.scale}/>;
 })}
</g>;

const WorldMap:React.FC<{camera:Camera;stage:4|5;time:number}>=({camera,stage,time})=>
 <>
  <Img src={staticFile('assets/chibi/map/base.png')} style={{position:'absolute',width:1,height:1,opacity:0}}/>
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position:'absolute',inset:0}}>
   <g transform={`translate(${WORLD.focus.x},${WORLD.focus.y}) scale(${camera.scale}) translate(${-camera.cx},${-camera.cy})`}>
    <image href={staticFile('assets/chibi/map/base.png')} x={0} y={0} width={WORLD.width} height={WORLD.height}/>
    <path d={RIVER} fill='none' stroke={COLOR.river} strokeWidth={WORLD.riverWidth} strokeOpacity={.32} strokeLinecap='round'/>
    <path d={HAN} fill='none' stroke={COLOR.river} strokeWidth={6/camera.scale} strokeOpacity={.24}/>
    <ConnectedFleet camera={camera} stage={stage} time={time}/>
    {CAMPS.map((point,i)=><g key={i}>
     <path d={`M${point.x-3},${point.y+3} L${point.x},${point.y-5} L${point.x+4},${point.y+3}Z`} fill='#B98054' stroke='#7A614C' strokeWidth={1.4/camera.scale}/>
     {stage===5&&time>=8.3+i*.25&&<Flame point={point} scale={camera.scale} time={time-8.3-i*.25} seed={`camp-${i}`} strength={.9}/>}
    </g>)}
    <FireShips camera={camera} stage={stage} time={time}/>
    {stage===5&&<Wind camera={camera} time={time}/>}
    {WORLD.locations.map(p=>{
     const screen=screenPoint(p,camera);
     const visible=screen.x>=SAFE_LEFT+30&&screen.x<=SAFE_RIGHT-30&&screen.y>=570&&screen.y<=captionBottom-70;
     if(!visible)return null;
     return <g key={p.name}>
      <circle cx={p.x} cy={p.y} r={4/camera.scale} fill={p.name==='乌林'?COLOR.cao:p.name==='赤壁'?COLOR.sun:'#6E654F'}/>
      <MapLabel point={p} text={p.label??p.name} camera={camera} color={p.name==='乌林'?COLOR.cao:p.name==='赤壁'?COLOR.sun:undefined} dx={p.name==='乌林'?95:0} dy={p.name==='赤壁'?100:p.name==='乌林'?-100:-27}/>
     </g>;
    })}
    <MapLabel point={{x:596,y:1197}} camera={camera} text={WORLD.mapLabels.river} color='#436F86'/>
    <MapLabel point={{x:543,y:1223}} camera={camera} text={WORLD.mapLabels.boats} color={COLOR.cao}/>
    <MapLabel point={{x:537,y:1131}} camera={camera} text={WORLD.mapLabels.camp} color={COLOR.cao}/>
    <MapLabel point={{x:655,y:1277}} camera={camera} text={WORLD.mapLabels.attack} color={COLOR.sun}/>
    {stage===5&&<MapLabel point={{x:715,y:1230}} camera={camera} text={WORLD.mapLabels.wind} color='#436F86'/>}
   </g>
  </svg>
 </>;

export const ChibiMapPreview=({showSafeArea=false,debugAudit=false}:{showSafeArea?:boolean;debugAudit?:boolean})=>{
 const frame=useCurrentFrame();const {fps}=useVideoConfig();
 const container=React.useRef<HTMLDivElement>(null);
 React.useLayoutEffect(()=>{
  if(!debugAudit||!container.current)return;
  const origin=container.current.getBoundingClientRect();
  const labels=Array.from(container.current.querySelectorAll('svg text')).map(el=>{
   const text=el as SVGTextElement;const r=text.getBoundingClientRect();const m=text.getScreenCTM()!;
   const font=parseFloat(getComputedStyle(text).fontSize)*Math.hypot(m.a,m.b);
   const bounds=[r.left-origin.left,r.top-origin.top,r.right-origin.left,r.bottom-origin.top];
   return {text:text.textContent,bounds,screenFont:font,withinSafe:bounds[0]>=SAFE_LEFT&&bounds[2]<=SAFE_RIGHT&&bounds[1]>=SAFE_TOP&&bounds[3]<=SAFE_BOTTOM};
  });
  const caption=container.current.querySelector('[data-caption]');const r=caption?.getBoundingClientRect();
  console.warn('MAP_AUDIT '+JSON.stringify({frame,labels,caption:r?[r.left-origin.left,r.top-origin.top,W-parseFloat(getComputedStyle(caption!).right),r.bottom-origin.top]:null,titleCount:container.current.querySelectorAll('[data-map-title]').length}));
 },[frame,debugAudit]);
 const stage:4|5=frame<FIRST.durationInFrames?4:5;
 const localFrame=stage===4?frame:frame-FIRST.durationInFrames;
 const timing=stage===4?FIRST:SECOND;const time=localFrame/fps;
 const plannedTime=time/timing.duration*source.scenes[stage-1].planned;
 const camera=cameraFor(stage,time,timing.duration);
 const scene=source.scenes[stage-1];
 const globalTime=FIRST.start+frame/fps;
 const cue=runtime.captions.find(c=>globalTime>=c.start&&globalTime<c.end);
 const titleOpacity=(stage===4?1:interpolate(time,[0,.25],[0,1],CLAMP))*interpolate(time,[timing.duration-.25,timing.duration],[1,0],CLAMP);
 const headerHeight=scene.title.includes('\n')?330:210;
 const photoOpacity=stage===5?interpolate(plannedTime,[6,6.3,7.7,8],[0,.7,.7,0],CLAMP):0;
 return <AbsoluteFill ref={container} style={{background:COLOR.paper,fontFamily:FONT,color:'#493C2B'}}>
  <WorldMap camera={camera} stage={stage} time={time}/>
  {photoOpacity>0&&<Img src={staticFile('assets/chibi/images/05.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:photoOpacity}}/>}
  <div style={{position:'absolute',left:SAFE_LEFT,top:SAFE_TOP,width:SAFE_RIGHT-SAFE_LEFT,height:headerHeight,background:'#EFE3C8EB',borderRadius:18,boxSizing:'border-box',padding:'12px 18px'}}>
   <div style={{display:'flex',justifyContent:'space-between',fontSize:32,fontWeight:800}}><span>{source.series} · {scene.id}</span><span>{WORLD.timeLabel}</span></div>
   <div data-map-title style={{fontSize:88,lineHeight:1.22,fontWeight:900,letterSpacing:-2,marginTop:15,opacity:titleOpacity}}>{scene.title.split('\n').map((line,i)=><React.Fragment key={i}>{i>0&&<br/>}<span style={{color:i===0?'#493C2B':COLOR.cao}}>{line}</span></React.Fragment>)}</div>
  </div>
  <div style={{position:'absolute',left:SAFE_LEFT+12,top:SAFE_TOP+headerHeight+15,fontSize:32,fontWeight:750,padding:'5px 10px',background:'#EFE3C8D9',borderRadius:8}}>{WORLD.disclaimer}</div>
  {cue&&<CaptionBox><Highlight text={cue.text}/></CaptionBox>}
  <Sequence name='04配音' from={Math.round(.3*fps)} durationInFrames={Math.ceil(FIRST.audioDuration*fps)} premountFor={fps}><Audio src={staticFile(FIRST.audio)}/></Sequence>
  <Sequence name='05配音' from={FIRST.durationInFrames+Math.round(.3*fps)} durationInFrames={Math.ceil(SECOND.audioDuration*fps)} premountFor={fps}><Audio src={staticFile(SECOND.audio)}/></Sequence>
  {runtime.bgmExists&&<Audio src={staticFile(source.audio.bgm)} loop volume={source.audio.bgmVolume}/>}
  {showSafeArea&&<SafeOverlay/>}
 </AbsoluteFill>;
};
