import React from 'react';
import {AbsoluteFill,Audio,Img,Sequence,getStaticFiles,interpolate,spring,staticFile,useCurrentFrame} from 'remotion';
import source from './chibi.json';
import runtime from './chibi.runtime.json';
import {Frame,Pill,C,FONT,SafeOverlay} from '../components/Frame';
import {CaptionBox} from '../components/CaptionBox';
import {FPS,LEFT,SAFE_TOP,BODY_BOTTOM,SIDES,WIDTH} from '../layout';

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
type Scene=typeof source.scenes[number];
type Timing=typeof runtime.scenes[number];
const IMAGE_TOP=SAFE_TOP+460;
const files=new Set(getStaticFiles().map(f=>f.name));
export const Highlight:React.FC<{text:string}>=({text})=>{
  const tokens=source.highlights;
  const pieces=text.split(new RegExp(`(${tokens.join('|')})`,'g'));
  return <>{pieces.map((s,i)=>tokens.includes(s)?<strong key={i} style={{color:C.orange,fontWeight:900}}>{s}</strong>:<React.Fragment key={i}>{s}</React.Fragment>)}</>;
};

const Illustration:React.FC<{scene:Scene;index:number;progress:number;height:number;time:number}>=({scene,index,progress,height,time})=>{
  const exists=scene.image&&files.has(scene.image);
  const [failed,setFailed]=React.useState(false);
  React.useEffect(()=>{if(scene.image&&!exists)console.warn(`Missing ${scene.image}; using gradient placeholder.`);},[scene.image,exists]);
  return <div style={{position:'absolute',...SIDES,top:IMAGE_TOP,height,borderRadius:22,overflow:'hidden',
    background:`linear-gradient(150deg,#D8DDD0 0%,#ADBEC0 48%,#AE8463 100%)`,border:`1px solid ${C.line}`,boxSizing:'border-box'}}>
    {exists&&!failed&&<Img src={staticFile(scene.image!)} onError={()=>setFailed(true)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:index===0?'center 60%':'center',
      transform:`scale(${1+.08*progress}) translateX(${(index%2===0?1:-1)*(progress-.5)*2}%)`}}/>}
    {scene.graphic==='fire'&&<>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 60% 100%,#FF651550,transparent 70%)',opacity:.45+.15*Math.sin(time*2)}}/>
      {Array.from({length:11},(_,i)=>{
        const phase=(time*.19+i*.137)%1;
        return <div key={i} style={{position:'absolute',left:`${14+(i*17)%75}%`,bottom:`${phase*76}%`,width:4+(i%3),height:8+(i%3),borderRadius:'50%',background:'#F0AA53',opacity:.5*Math.sin(phase*Math.PI),transform:`translateX(${Math.sin(time+i)*15}px)`}}/>;
      })}
    </>}
  </div>;
};

const Bars:React.FC<{scene:Scene;time:number}>=({scene,time})=>{
 const values=scene.bars??[];
 return <svg width={WIDTH} height={282} viewBox={`0 0 ${WIDTH} 282`} style={{position:'absolute',left:LEFT,top:BODY_BOTTOM-289,fontFamily:FONT}}>
   <line x1={40} y1={196} x2={810} y2={196} stroke={C.line} strokeWidth={2}/>
   {values.map((bar,i)=>{const x=155+i*260;const p=interpolate(time,[.7+i*.25,2+i*.25],[0,1],clamp);const h=bar.value/80*132*p;
     return <g key={bar.label}>
       <rect x={x-57} y={196-h} width={114} height={h} rx={5} fill={[C.blue,C.orange,C.teal][i]} fillOpacity={.8}/>
       <text x={x} y={196-h-17} textAnchor='middle' fill={[C.blue,C.orange,C.teal][i]} fontSize={36} fontWeight={900}>{bar.display}</text>
       <text x={x} y={234} textAnchor='middle' fill={C.ink} fontSize={30} fontWeight={800}>{bar.label}</text>
     </g>;
   })}
   <text x={810} y={274} textAnchor='end' fill={C.muted} fontSize={30} fontWeight={700}>{scene.note}</text>
 </svg>;
};

const Ships:React.FC<{scene:Scene;time:number}>=({scene,time})=>
 <div style={{position:'absolute',...SIDES,top:BODY_BOTTOM-274}}>
  <svg width={WIDTH} height={180} viewBox={`0 0 ${WIDTH} 180`}>
    {[35,240,445,650].map((x,i)=><g key={x}>
      <path d={`M${x},112 L${x+145},112 L${x+125},140 L${x+15},140Z`} fill={`${C.blue}22`} stroke={C.blue} strokeWidth={4}/>
      <path d={`M${x+65},112V43L${x+111},86H${x+65}`} fill={`${C.gold}33`} stroke={C.gold} strokeWidth={3}/>
      {i<3&&<line x1={x+145} y1={122} x2={x+205} y2={122} stroke={C.orange} strokeWidth={5} strokeDasharray={60} strokeDashoffset={60*(1-interpolate(time,[1+i*.75,1.7+i*.75],[0,1],clamp))}/>}
    </g>)}
  </svg>
  <div style={{fontSize:32,fontWeight:800,textAlign:'center',color:C.ink}}><Highlight text={scene.graphicCaption??''}/></div>
 </div>;

const Map:React.FC<{scene:Scene;time:number}>=({scene,time})=>
 <>
  <svg width={WIDTH} height={530} viewBox={`0 0 ${WIDTH} 530`} style={{position:'absolute',left:LEFT,top:SAFE_TOP+465,fontFamily:FONT}}>
   {(scene.regions??[]).map(region=><g key={region.label}>
     <polygon points={region.points} fill={C[region.color as 'blue'|'teal'|'orange']} fillOpacity={.16} stroke={C[region.color as 'blue'|'teal'|'orange']} strokeWidth={4} strokeLinejoin='round'/>
     <text x={region.x} y={region.y} textAnchor='middle' dominantBaseline='middle' fill={C[region.color as 'blue'|'teal'|'orange']} fontSize={80} fontWeight={900}>{region.label}</text>
   </g>)}
  </svg>
  <div style={{position:'absolute',...SIDES,top:BODY_BOTTOM-184,display:'flex',justifyContent:'space-between',gap:10}}>
   {(scene.keywords??[]).map((word,i)=>{
    const p=spring({frame:Math.max(0,Math.round((time-.25-i*.65)*FPS)),fps:FPS,config:{damping:14,stiffness:150}});
    return <div key={word} style={{flex:1,padding:'16px 10px',background:`${[C.blue,C.orange,C.teal][i]}10`,borderRadius:15,color:[C.blue,C.orange,C.teal][i],textAlign:'center',fontSize:36,fontWeight:900,opacity:interpolate(time,[.25+i*.65,.55+i*.65],[0,1],clamp),transform:`scale(${.9+.1*p})`}}>{word}</div>;
   })}
  </div>
 </>;

const SceneView:React.FC<{scene:Scene;timing:Timing;index:number;cover?:boolean}>=({scene,timing,index,cover=false})=>{
 const frame=useCurrentFrame();const time=frame/FPS;
 const progress=interpolate(time,[0,timing.duration],[0,1],clamp);
 const opacity=index===0||cover?1:interpolate(time,[0,source.transitionSeconds],[0,1],clamp);
 const compact=scene.graphic==='bars'||scene.graphic==='ships';
 return <AbsoluteFill style={{opacity}}>
  <Frame brand={source.series} step={index+1} totalSteps={source.scenes.length} cover={cover} eyebrow={cover?source.series:scene.eyebrow} titleSize={88} title={scene.title.split('\n').map((line,i)=><React.Fragment key={i}>{i>0&&<br/>}<span style={{color:i===0?C.ink:C.blue}}>{line}</span></React.Fragment>)}>
   <div style={{position:'absolute',left:LEFT,top:SAFE_TOP+388}}><Pill color={C.gold}><Highlight text={cover?source.coverSubtitle:scene.topic}/></Pill></div>
   {scene.image&&<Illustration scene={scene} index={index} progress={progress} height={compact?420:BODY_BOTTOM-IMAGE_TOP-14} time={time}/>}
   {scene.graphic==='bars'&&<Bars scene={scene} time={time}/>}
   {scene.graphic==='ships'&&<Ships scene={scene} time={time}/>}
   {scene.graphic==='map'&&<Map scene={scene} time={time}/>}
   {scene.graphic==='map'&&!cover&&<div style={{position:'absolute',...SIDES,top:BODY_BOTTOM-64,textAlign:'center',fontSize:32,fontWeight:800,opacity:interpolate(time,[timing.duration-3,timing.duration-2.5],[0,1],clamp)}}>{source.ending}</div>}
  </Frame>
 </AbsoluteFill>;
};

export const HistoryVideo=({showSafeArea=false}:{showSafeArea?:boolean})=>{
 const frame=useCurrentFrame();
 const cue=runtime.captions.find(c=>frame/FPS>=c.start&&frame/FPS<c.end);
 return <AbsoluteFill style={{background:C.paper,fontFamily:FONT,color:C.ink}}>
  {source.scenes.map((scene,index)=>{const timing=runtime.scenes[index];return <Sequence key={scene.id} from={Math.round(timing.start*FPS)} durationInFrames={timing.durationInFrames+(index<source.scenes.length-1?Math.round(source.transitionSeconds*FPS):0)} premountFor={FPS}><SceneView scene={scene} timing={timing} index={index}/></Sequence>;})}
  {runtime.scenes.map(timing=><Sequence key={timing.id} from={Math.round(timing.audioStart*FPS)} durationInFrames={Math.ceil(timing.audioDuration*FPS)} premountFor={FPS}><Audio src={staticFile(timing.audio)}/></Sequence>)}
  {runtime.bgmExists&&<Audio src={staticFile(source.audio.bgm)} volume={source.audio.bgmVolume} loop/>}
  {cue&&<CaptionBox><Highlight text={cue.text}/></CaptionBox>}
  {showSafeArea&&<SafeOverlay/>}
 </AbsoluteFill>;
};

export const HistoryCover=({showSafeArea=false}:{showSafeArea?:boolean})=><>
 <SceneView scene={source.scenes[0]} timing={runtime.scenes[0]} index={0} cover/>
 {showSafeArea&&<SafeOverlay/>}
</>;
