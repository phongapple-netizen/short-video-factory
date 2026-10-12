import React from 'react';
import {AbsoluteFill,Audio,Easing,Img,Sequence,interpolate,spring,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {evolvePath,getLength,getPointAtLength} from '@remotion/paths';
import source from '../chibi.json';
import runtime from '../chibi.runtime.json';
import {Highlight} from '../video';
import {CaptionBox} from '../../components/CaptionBox';
import {FONT,SafeOverlay} from '../../components/Frame';
import {W,H,SAFE_TOP,SAFE_BOTTOM,SAFE_LEFT,SAFE_RIGHT} from '../../layout';
import {WORLD,RIVER,HAN,LOCATIONS,smoothPath,screenPoint,type Camera} from './model';
import {WorldMap,MapLabel,ArrowPath,cameraFor} from './preview';
const C=WORLD.colors,L=WORLD.fullLabels;
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const ease={...clamp,easing:Easing.inOut(Easing.cubic)};
const paths=Object.fromEntries(Object.entries(WORLD.routes).map(([k,p])=>[k,smoothPath(p)]));
const lengths=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,getLength(p)]));
const target=(index:number):Camera=>{const a=WORLD.fullScenes[index];return {cx:a.center[0],cy:a.center[1],scale:a.scale};};
export const fullCamera=(index:number,time:number,duration:number):Camera=>{
 if(index===3||index===4)return cameraFor(index===3?4:5,time,duration);
 if(index===0){
  const progress=interpolate(time,[.4,duration-1],[0,.6],clamp);
  const point=getPointAtLength(paths.cao,progress*lengths.cao)!;
  const mix=interpolate(time,[1.2,1.7],[0,1],ease);
  return {cx:interpolate(mix,[0,1],[680,point.x+40]),cy:interpolate(mix,[0,1],[800,point.y+40]),scale:1.3};
 }
 if(index===5&&time>4){
  const progress=interpolate(time,[.4,duration-1],[0,1],clamp),point=getPointAtLength(paths.retreat,progress*lengths.retreat)!;
  const mix=interpolate(time,[4,6],[0,1],ease);
  return {cx:interpolate(mix,[0,1],[470,point.x]),cy:interpolate(mix,[0,1],[1130,point.y+80]),scale:2};
 }
 const previous=index===1?fullCamera(0,runtime.scenes[0].duration,runtime.scenes[0].duration):index===6?fullCamera(5,runtime.scenes[5].duration,runtime.scenes[5].duration):index===5?{cx:620,cy:1185,scale:2.6}:target(index-1);
 const next=target(index);
 if(index===1)next.cx=interpolate(time,[1.6,5],[840,690],ease);
 const p=interpolate(time,[0,1.6],[0,1],ease);
 return {cx:interpolate(p,[0,1],[previous.cx,next.cx]),cy:interpolate(p,[0,1],[previous.cy,next.cy]),scale:interpolate(p,[0,1],[previous.scale,next.scale])};
};
const MovingArmy=({route,progress,color,camera,retreat=false}:{route:string;progress:number;color:string;camera:Camera;retreat?:boolean})=>{
 const path=paths[route],len=lengths[route];
 return <g>
  {retreat?<path d={path} {...evolvePath(progress,path)} fill='none' stroke={color} strokeWidth={6/camera.scale} strokeDasharray={`${12/camera.scale} ${10/camera.scale}`}/>:<ArrowPath path={path} progress={progress} color={color} scale={camera.scale}/>}
  {Array.from({length:retreat?18:9},(_,i)=>{
   const position=Math.max(0,progress-i*.012),point=getPointAtLength(path,position*len)!;
   const opacity=retreat?Math.max(.1,1-progress*(i/10+.4)):1;
   return <circle key={i} cx={point.x} cy={point.y} r={5/camera.scale} fill={retreat&&i>8?'#715149':color} opacity={opacity} stroke={retreat?'none':'#EFE3C8'} strokeWidth={1.5/camera.scale}/>;
  })}
 </g>;
};
const Troops=({camera,time}:{camera:Camera;time:number})=>{
 const shrink=interpolate(time,[2,4],[0,1],ease);
 return <>
  <MapLabel point={{x:610,y:1048}} camera={camera} text={time<3?L.claimed:L.actual} color={C.cao}/>
  {Array.from({length:80},(_,i)=>{
   const x=520+(i%10)*12,y=1070+Math.floor(i/10)*10;
   const keep=i<20,dim=keep&&time>7+i*.16;
   return <g key={i} transform={`translate(${x},${y})`} opacity={keep?1:1-shrink}>
    <circle r={(keep?6:5.3)/camera.scale*(keep?1:1-shrink*.8)} fill={time>3&&keep?(dim?'#785D52':C.cao):'none'} stroke={C.cao} strokeWidth={2/camera.scale}/>
    {dim&&<circle r={(11+3*Math.sin(time*3+i))/camera.scale} fill='none' stroke='#B5412F' strokeWidth={2/camera.scale} opacity={.32}/>}
   </g>;
  })}
  <MapLabel point={{x:661,y:1240}} camera={camera} text={L.allied} color={C.sun}/>
  {Array.from({length:5},(_,i)=><circle key={i} cx={625+i*16} cy={1207} r={7/camera.scale} fill={C.sun} stroke={C.liu} strokeWidth={3/camera.scale}/>)}
  {time>6&&<MapLabel point={{x:614,y:1155}} camera={camera} text={L.plague} color={C.cao}/>}
 </>;
};
const OverviewWorld=({camera,index,time,duration}:{camera:Camera;index:number;time:number;duration:number})=>{
 const p=interpolate(time,[.4,duration-1],[0,1],clamp);
 const matrix=`translate(${WORLD.focus.x},${WORLD.focus.y}) scale(${camera.scale}) translate(${-camera.cx},${-camera.cy})`;
 return <>
  <Img src={staticFile('assets/chibi/map/base.png')} style={{position:'absolute',width:1,height:1,opacity:0}}/>
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position:'absolute',inset:0}}>
   <defs><clipPath id='map-safe'><rect x={SAFE_LEFT} y={560} width={SAFE_RIGHT-SAFE_LEFT} height={790}/></clipPath></defs>
   <g transform={matrix}><image href={staticFile('assets/chibi/map/base.png')} x={0} y={0} width={WORLD.width} height={WORLD.height}/><path d={RIVER} stroke={C.river} strokeWidth={WORLD.riverWidth} opacity={.28} fill='none'/><path d={HAN} stroke={C.river} strokeWidth={6/camera.scale} fill='none' opacity={.3}/></g>
   <g clipPath='url(#map-safe)'><g transform={matrix}>
    {index===0&&<MovingArmy route='cao' progress={p*.6} color={C.cao} camera={camera}/>}
    {index===1&&<>
     <MovingArmy route='cao' progress={.6+p*.4} color={C.cao} camera={camera}/>
     <MovingArmy route='liu' progress={p} color={C.liu} camera={camera}/>
     <MovingArmy route='sun' progress={p} color={C.sun} camera={camera}/>
     <path d={paths.diplomat} {...evolvePath(p,paths.diplomat)} fill='none' stroke={C.liu} strokeWidth={4/camera.scale} strokeDasharray={`${10/camera.scale} ${8/camera.scale}`}/>
     {time>duration*.65&&<g transform={`translate(655,1212)`}><circle r={29/camera.scale} fill={C.sun} stroke={C.liu} strokeWidth={8/camera.scale}/><text fontFamily={FONT} fontSize={32/camera.scale} fill='white' textAnchor='middle' dominantBaseline='central'>{L.alliance}</text></g>}
    </>}
    {index===2&&<Troops camera={camera} time={time}/>}
    {index===5&&<>
     <ellipse cx={470} cy={1150} rx={52} ry={28} fill='#8B7052' opacity={.3}/>
     <path d='M432,1135 Q450,1140 482,1136 M450,1163 Q470,1153 500,1165' fill='none' stroke='#715539' strokeWidth={3/camera.scale} opacity={.5}/>
     <MovingArmy route='retreat' progress={p} color={C.cao} camera={camera} retreat/>
     <MapLabel point={{x:475,y:1195}} camera={camera} text={L.mud} color='#715539'/>
    </>}
    {index===6&&<g opacity={interpolate(time,[1,2],[0,.25],clamp)}>
     <image href={staticFile('assets/chibi/map/regions.png')} x={0} y={0} width={WORLD.width} height={WORLD.height}/>
    </g>}
    {index!==2&&index!==6&&WORLD.locations.map(point=>{
     if(index!==5&&point.name==='华容道')return null;
     const sp=screenPoint(point,camera);
     if(sp.x<SAFE_LEFT+70||sp.x>SAFE_RIGHT-70||sp.y<605||sp.y>1295)return null;
     const offsets:Record<string,[number,number]>={'江陵':[-15,-36],'乌林':[35,-65],'赤壁':[45,75],'夏口':[-10,-38],'樊口':[35,40],'柴桑':[0,45],'华容道':[-20,40]};
     const [dx,dy]=offsets[point.name]??[0,-32];
     return <g key={point.name}><circle cx={point.x} cy={point.y} r={4/camera.scale} fill='#493C2B'/><MapLabel point={point} text={point.label??point.name} camera={camera} dx={dx} dy={dy}/></g>;
    })}
    {index===6&&time>=1.6&&<>
     <MapLabel point={{x:650,y:725}} camera={camera} text={source.scenes[6].regions![0].label} color={C.cao}/>
     <MapLabel point={{x:480,y:1100}} camera={camera} text={source.scenes[6].regions![1].label} color={C.liu}/>
     <MapLabel point={{x:900,y:1100}} camera={camera} text={source.scenes[6].regions![2].label} color={C.sun}/>
    </>}
   </g></g>
  </svg>
 </>;
};
export const ChibiMapFull=({showSafeArea=false,debugAudit=false}:{showSafeArea?:boolean;debugAudit?:boolean})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),seconds=frame/fps;
 const container=React.useRef<HTMLDivElement>(null);
 React.useLayoutEffect(()=>{
  if(!debugAudit||!container.current)return;
  const origin=container.current.getBoundingClientRect();
  const labels=Array.from(container.current.querySelectorAll('svg text')).map(el=>{
   const text=el as SVGTextElement,r=text.getBoundingClientRect(),m=text.getScreenCTM()!;
   const bounds=[r.left-origin.left,r.top-origin.top,r.right-origin.left,r.bottom-origin.top];
   return {text:text.textContent,bounds,screenFont:parseFloat(getComputedStyle(text).fontSize)*Math.hypot(m.a,m.b),withinSafe:bounds[0]>=SAFE_LEFT&&bounds[2]<=SAFE_RIGHT&&bounds[1]>=SAFE_TOP&&bounds[3]<=SAFE_BOTTOM};
  });
  const title=container.current.querySelector('[data-map-title]')!,r=title.getBoundingClientRect();
  const titleBounds=[r.left-origin.left,r.top-origin.top,r.right-origin.left,r.bottom-origin.top];
  const caption=container.current.querySelector('[data-caption]'),cr=caption?.getBoundingClientRect();
  console.warn('MAP_AUDIT '+JSON.stringify({frame,labels,titleBounds,titleCount:container.current.querySelectorAll('[data-map-title]').length,caption:cr?[cr.left-origin.left,cr.top-origin.top,W-parseFloat(getComputedStyle(caption!).right),cr.bottom-origin.top]:null}));
 },[frame,debugAudit]);
 const index=Math.max(0,runtime.scenes.findIndex(s=>seconds>=s.start&&seconds<s.end));
 const timing=runtime.scenes[index],scene=source.scenes[index],time=seconds-timing.start;
 const camera=fullCamera(index,time,timing.duration);
 const plannedTime=time/timing.duration*scene.planned;
 const opacity=(index===0?1:interpolate(time,[0,.25],[0,1],clamp))*interpolate(time,[timing.duration-.25,timing.duration],[1,0],clamp);
 const photo=index===0?interpolate(time,[0,1.2,1.7],[1,1,0],clamp):index===4?interpolate(plannedTime,[6,6.3,7.7,8],[0,.7,.7,0],clamp):index===5?interpolate(plannedTime,[4,4.3,5.7,6],[0,.7,.7,0],clamp):0;
 const cue=runtime.captions.find(c=>seconds>=c.start&&seconds<c.end);
 const titleHeight=scene.title.includes('\n')?330:210;
 return <AbsoluteFill ref={container} style={{background:C.paper,color:'#493C2B',fontFamily:FONT}}>
  {index===3||index===4?<WorldMap camera={camera} stage={index===3?4:5} time={time}/>:<OverviewWorld camera={camera} index={index} time={time} duration={timing.duration}/>}
  {photo>0&&<Img src={staticFile(scene.image!)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:photo,transform:`scale(${1+time*.005})`}}/>}
  <div style={{position:'absolute',left:SAFE_LEFT,top:SAFE_TOP,width:SAFE_RIGHT-SAFE_LEFT,height:titleHeight,background:'#EFE3C8ED',borderRadius:18,boxSizing:'border-box',padding:'12px 18px'}}>
   <div style={{display:'flex',justifyContent:'space-between',fontSize:32,fontWeight:800}}><span>{source.series} · {scene.id}/07</span><span>{WORLD.timeLabel}</span></div>
   <div data-map-title style={{fontSize:88,lineHeight:1.22,fontWeight:900,letterSpacing:-2,marginTop:15,opacity}}>{scene.title.split('\n').map((line,i)=><React.Fragment key={i}>{i>0&&<br/>}<span style={{color:i===0?'#493C2B':C.cao}}>{line}</span></React.Fragment>)}</div>
  </div>
  <div style={{position:'absolute',left:SAFE_LEFT+12,top:SAFE_TOP+titleHeight+15,fontSize:32,fontWeight:750,padding:'5px 10px',background:'#EFE3C8D9',borderRadius:8}}>{index===6?L.later:WORLD.disclaimer}</div>
  {index===0&&time>=1.7&&<div style={{position:'absolute',right:W-SAFE_RIGHT+20,top:570,color:C.cao,fontSize:48,fontWeight:900,background:'#EFE3C8DD',padding:'10px 20px',borderRadius:12}}>号称 {Math.round(interpolate(time,[1.7,4],[0,80],clamp))}万</div>}
  {index===2&&<div style={{position:'absolute',left:SAFE_RIGHT-245,top:SAFE_TOP+titleHeight+15,fontSize:32,color:'#6A5943',background:'#EFE3C8DD',padding:10}}>{source.scenes[2].note}</div>}
  {index===6&&<>
   <div style={{position:'absolute',left:SAFE_LEFT+20,top:620,width:SAFE_RIGHT-SAFE_LEFT-40,display:'flex',justifyContent:'space-between',fontSize:38,fontWeight:900}}>{L.years.map((year,i)=><span key={year} style={{color:time>1+i*.6?C.cao:'#8B7A62',opacity:time>i*.6?1:.25}}>{year}{i<3?' →':''}</span>)}</div>
   <div style={{position:'absolute',left:SAFE_LEFT+20,top:1030,width:SAFE_RIGHT-SAFE_LEFT-40,display:'flex',justifyContent:'space-between',fontSize:42,fontWeight:900}}>{source.scenes[6].keywords!.map((word,i)=><span key={word} style={{padding:'12px 15px',borderRadius:12,background:'#EFE3C8EE',color:[C.cao,C.sun,C.liu][i],transform:`scale(${spring({frame:Math.max(0,Math.round((time-1.5-i*.65)*fps)),fps,config:{damping:16}})})`,opacity:time>1.5+i*.65?1:0}}>{word}</span>)}</div>
   <div style={{position:'absolute',left:SAFE_LEFT+20,top:1260,width:SAFE_RIGHT-SAFE_LEFT-40,fontSize:38,textAlign:'center',fontWeight:800,opacity:interpolate(time,[timing.duration-3,timing.duration-2.3],[0,1],clamp),background:'#EFE3C8EE',padding:'10px 0',borderRadius:12}}>{source.ending}</div>
  </>}
  {cue&&<CaptionBox><Highlight text={cue.text}/></CaptionBox>}
  {runtime.scenes.map(s=><Sequence key={s.id} from={Math.round(s.audioStart*fps)} durationInFrames={Math.ceil(s.audioDuration*fps)} premountFor={fps}><Audio src={staticFile(s.audio)}/></Sequence>)}
  {runtime.bgmExists&&<Audio src={staticFile(source.audio.bgm)} volume={source.audio.bgmVolume} loop/>}
  {showSafeArea&&<SafeOverlay/>}
 </AbsoluteFill>;
};
export const ChibiMapCover=()=> <AbsoluteFill style={{background:C.paper,fontFamily:FONT,color:'#493C2B'}}>
 <WorldMap camera={{cx:620,cy:1185,scale:3.4}} stage={5} time={7.8}/>
 <div style={{position:'absolute',left:SAFE_LEFT,top:SAFE_TOP,width:SAFE_RIGHT-SAFE_LEFT,background:'#EFE3C8F0',padding:'25px 20px',boxSizing:'border-box',borderRadius:20}}>
  <div style={{fontSize:34,fontWeight:800,marginBottom:25}}>{source.series} · 地图推演</div>
  <div style={{fontSize:96,lineHeight:1.25,fontWeight:900}}>赤壁之战：<br/><span style={{color:C.cao}}>曹操为什么会输？</span></div>
  <div style={{fontSize:42,fontWeight:800,marginTop:30}}>{source.coverSubtitle}</div>
 </div>
</AbsoluteFill>;
