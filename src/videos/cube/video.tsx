import React from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame,useVideoConfig,interpolate,Easing,spring} from 'remotion';
import captions from './captions.json';
import {ALL,STAGES,REMOVED,LAYERS,key,isCross,type Voxel} from './geometry';
import {VIDEO_WIDTH,VIDEO_HEIGHT,SAFE_LEFT,SAFE_RIGHT,SAFE_TOP,SAFE_BOTTOM,SAFE_WIDTH,CONTENT_LEFT,CONTENT_RIGHT,CONTENT_WIDTH,SAFE_SIDES,SUBTITLE_HEIGHT,BODY_BOTTOM} from './layout';
import timeline from './timeline.json';

const C={paper:'#F7F5EF',ink:'#172D3D',muted:'#6B7D87',line:'#DCDDD7',blue:'#6895DC',teal:'#48B8AC',gold:'#E4B44E',orange:'#E37B57',hole:'#EBEAE3'};
const COLORS=[C.blue,C.teal,C.gold,C.teal,C.blue];
const FONT="'Noto Sans CJK SC', sans-serif";
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const smooth={...clamp,easing:Easing.bezier(.2,.8,.2,1)};
const mix=(a:string,b:string,t:number)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const cueStart=(id:string,fallback:number)=>captions.find(c=>c.id===id)?.start??fallback;

type Face={points:string;fill:string;depth:number;opacity:number};
type Ghost={cells:Voxel[];axis:'x'|'y'|'z';progress:number};

// A 2D SVG projection of the actual voxel boundary. Only exposed faces are
// rendered, including cavity walls. All drilling and slice views share STAGES.
const VoxelModel:React.FC<{cells:Voxel[];width?:number;height?:number;explode?:number;layerColors?:boolean;highlight?:Set<string>;ghost?:Ghost}>=({cells,width=920,height=900,explode=0,layerColors=false,highlight,ghost})=>{
  const unit=(x:number,y:number,z:number)=>[.8660254*(x-y),.5*(x+y)-z];
  const bounds=ALL.flatMap(v=>Array.from({length:8},(_,i)=>[v.x+(i&1),v.y+((i>>1)&1),v.z+((i>>2)&1)+(v.z-2)*explode])).map(([x,y,z])=>unit(x,y,z));
  const minX=Math.min(...bounds.map(p=>p[0])),maxX=Math.max(...bounds.map(p=>p[0]));
  const minY=Math.min(...bounds.map(p=>p[1])),maxY=Math.max(...bounds.map(p=>p[1]));
  const scale=Math.min((width-95)/(maxX-minX),(height-100)/(maxY-minY));
  const project=(x:number,y:number,z:number)=>{
    const [u,v]=unit(x,y,z);
    return [width/2+(u-(minX+maxX)/2)*scale,height/2+(v-(minY+maxY)/2)*scale];
  };
  const faces:Face[]=[];
  const append=(voxels:Voxel[],isGhost=false)=>{
    const occupied=new Set(voxels.map(key));
    for(const v of voxels){
      const layerShift=(v.z-2)*explode;
      // One-cell travel stays inside the SVG margin. Fade before clipping can
      // turn a moving column into the pale rectangular remnant seen at old 15s.
      const motion=isGhost?(ghost?.progress??0)*1.25:0;
      const offset={x:isGhost&&ghost?.axis==='x'?motion:0,y:isGhost&&ghost?.axis==='y'?motion:0,z:layerShift+(isGhost&&ghost?.axis==='z'?motion:0)};
      const x=v.x+offset.x,y=v.y+offset.y,z=v.z+offset.z;
      const color=isGhost||highlight?.has(key(v))?C.orange:layerColors?COLORS[4-v.z]:C.blue;
      const definitions=[
        {neighbor:{x:v.x+1,y:v.y,z:v.z},direction:'x',vertices:[[x+1,y,z],[x+1,y+1,z],[x+1,y+1,z+1],[x+1,y,z+1]],shade:-.18},
        {neighbor:{x:v.x,y:v.y+1,z:v.z},direction:'y',vertices:[[x,y+1,z],[x+1,y+1,z],[x+1,y+1,z+1],[x,y+1,z+1]],shade:.04},
        {neighbor:{x:v.x,y:v.y,z:v.z+1},direction:'z',vertices:[[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]],shade:.4},
      ];
      for(const face of definitions){
        if(occupied.has(key(face.neighbor))&&!(explode>.01&&face.direction==='z'))continue;
        const internal=face.neighbor.x<5&&face.neighbor.y<5&&face.neighbor.z<5&&!isGhost&&explode<.01;
        const shade=face.shade-(internal ? .22 : 0);
        const fill=mix(color,shade>=0?'#FFFFFF':'#172D3D',Math.abs(shade));
        const points=face.vertices.map(([a,b,c])=>project(a,b,c).join(',')).join(' ');
        const depth=face.vertices.reduce((sum,p)=>sum+p[0]+p[1]+p[2],0)/4;
        faces.push({points,fill,depth,opacity:isGhost?interpolate(ghost?.progress??0,[0,.3,.65],[1,1,0],clamp):1});
      }
    }
  };
  append(cells);
  if(ghost)append(ghost.cells,true);
  faces.sort((a,b)=>a.depth-b.depth);
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:'hidden'}}>
    <ellipse cx={width/2} cy={height-46} rx={width*.28} ry={21} fill='#172D3D' opacity='.07'/>
    {faces.map((face,i)=><polygon key={i} points={face.points} fill={face.fill} stroke={mix(face.fill,'#172D3D',.27)} strokeWidth={1.1} strokeLinejoin='round' opacity={face.opacity}/>)}
  </svg>;
};

const Page:React.FC<{chapter:number;eyebrow:string;title:React.ReactNode;children:React.ReactNode;titleSize?:number;showCounter?:boolean}>=({chapter,eyebrow,title,children,titleSize=64,showCounter=true})=><AbsoluteFill style={{background:C.paper,color:C.ink,fontFamily:FONT}}>
  <svg width={VIDEO_WIDTH} height={VIDEO_HEIGHT} style={{position:'absolute',inset:0}}>
    <path d={`M${CONTENT_LEFT} ${SAFE_TOP+62}H${CONTENT_RIGHT}`} stroke={C.line}/>
    <circle cx={CONTENT_LEFT+20} cy={SAFE_TOP+25} r='17' fill={C.blue}/><path d={`M${CONTENT_LEFT+8} ${SAFE_TOP+25}H${CONTENT_LEFT+32}M${CONTENT_LEFT+20} ${SAFE_TOP+13}V${SAFE_TOP+37}`} stroke={C.paper} strokeWidth='3'/>
  </svg>
  <div style={{position:'absolute',left:CONTENT_LEFT+52,top:SAFE_TOP+2,fontSize:30,fontWeight:800,letterSpacing:2}}>几何实验室</div>
  {showCounter&&<div style={{position:'absolute',right:SAFE_SIDES.right,top:SAFE_TOP+2,fontSize:30,color:C.muted}}><b style={{color:C.ink,fontSize:32}}>0{chapter}</b> / 05</div>}
  <div style={{position:'absolute',left:CONTENT_LEFT,top:SAFE_TOP+78,fontSize:30,fontWeight:700,color:C.muted,letterSpacing:2}}>{eyebrow}</div>
  <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+132,fontSize:titleSize,lineHeight:1.25,fontWeight:900,letterSpacing:-2}}>{title}</div>
  {children}
</AbsoluteFill>;

const Pill:React.FC<{children:React.ReactNode;color?:string;style?:React.CSSProperties}>=({children,color=C.blue,style})=><div style={{display:'inline-flex',alignItems:'center',padding:'8px 20px',background:mix(color,C.paper,.87),borderRadius:50,color:mix(color,C.ink,.25),fontSize:30,fontWeight:800,...style}}>{children}</div>;

const CrossDiagram=()=> <div style={{display:'grid',gridTemplateColumns:'repeat(5, 30px)',gap:4}}>{Array.from({length:25},(_,i)=><div key={i} style={{width:30,height:30,borderRadius:4,background:isCross(i%5,Math.floor(i/5))?C.orange:'#E3E3DD',border:'1px solid #FFFFFF80'}}/>)}</div>;

const QuestionScene=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const preview=Math.min(3,Math.floor(t/1.5));
  return <Page chapter={1} eyebrow='01 / 6秒看懂题目' titleSize={88} title={<>三个孔打通，<br/><span style={{color:C.blue}}>体积多少？</span></>}>
    <div style={{position:'absolute',left:CONTENT_LEFT,top:SAFE_TOP+388}}><Pill>棱长5厘米</Pill></div>
    <div data-safe-box style={{position:'absolute',left:CONTENT_LEFT+5,top:SAFE_TOP+460}}><VoxelModel cells={STAGES[preview]} width={CONTENT_WIDTH-10} height={480}/></div>
    <div style={{position:'absolute',left:CONTENT_LEFT+65,top:SAFE_TOP+825,fontSize:32,color:C.muted,rotate:'30deg'}}>5 cm</div>
    <div style={{position:'absolute',right:SAFE_SIDES.right+65,top:SAFE_TOP+825,fontSize:32,color:C.muted,rotate:'-30deg'}}>5 cm</div>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+930,display:'flex',gap:30,padding:'16px 20px',alignItems:'center',borderTop:`1px solid ${C.line}`,borderBottom:`1px solid ${C.line}`}}>
      <CrossDiagram/>
      <div><div style={{fontSize:34,fontWeight:900}}>每孔截面：<span style={{color:C.orange}}>5格小十字</span></div><div style={{fontSize:30,lineHeight:1.5,color:C.muted,marginTop:10}}>上下、左右、前后三方向贯通<br/>孔宽1格，每条孔长5 cm</div></div>
    </div>
    <div style={{position:'absolute',top:BODY_BOTTOM-50,...SAFE_SIDES,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:32}}><span style={{color:C.muted}}>原有小方块</span><b>5 × 5 × 5 = <span style={{color:C.blue}}>125</span></b></div>
  </Page>;
};

const cutStarts=['c2_01','c2_02','c2_04'].map(id=>cueStart(id,timeline.drill.start)-timeline.drill.start+.18);
const DrillLayout:React.FC<{t:number}>=({t})=>{
  let active=0;for(let i=0;i<3;i++)if(t>=cutStarts[i])active=i;
  const started=t>=cutStarts[0];
  const p=started?interpolate(t,[cutStarts[active]+.42,cutStarts[active]+2.3],[0,1],smooth):0;
  const previous=STAGES[active];
  const highlight=started&&p===0?new Set(REMOVED[active].map(key)):undefined;
  const cells=started&&p>0?STAGES[active+1]:previous;
  const ghost=started&&p>0&&p<.65?{cells:REMOVED[active],axis:(['z','x','y'] as const)[active],progress:p}:undefined;
  const completed=started&&p>.65?active+1:active;
  return <Page chapter={2} eyebrow='02 / 三方向打孔' title={<>依次挖走，<br/><span style={{color:C.orange}}>重叠部分不重复数</span></>}>
    <div style={{position:'absolute',left:CONTENT_LEFT,top:SAFE_TOP+318}}><Pill color={C.orange}>{['① 上下贯通','② 左右贯通','③ 前后贯通'][active]}</Pill></div>
    <div data-safe-box style={{position:'absolute',left:CONTENT_LEFT+5,top:SAFE_TOP+390}}><VoxelModel cells={cells} width={CONTENT_WIDTH-10} height={530} highlight={highlight} ghost={ghost}/></div>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+960,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div><div style={{fontSize:30,color:C.muted}}>本次新增挖走</div><div style={{fontSize:80,lineHeight:1.15,fontWeight:900,color:C.orange,marginTop:8}}>{REMOVED[active].length}<span style={{fontSize:32,marginLeft:12}}>个</span></div></div>
      <div style={{textAlign:'right'}}><div style={{fontSize:30,color:C.muted}}>剩余小方块</div><div style={{fontSize:88,lineHeight:1.15,fontWeight:900,color:C.ink,marginTop:8}}>{STAGES[completed].length}</div></div>
    </div>
    <div style={{position:'absolute',...SAFE_SIDES,top:BODY_BOTTOM-89,display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:`1px solid ${C.line}`,paddingTop:10}}>
      {[125,100,86,76].map((n,i)=><React.Fragment key={n}><div style={{fontSize:42,fontWeight:900,color:i===completed?C.blue:C.muted,opacity:i<=completed?1:.65}}>{n}</div>{i<3&&<div style={{textAlign:'center'}}><div style={{fontSize:30,color:C.orange,fontWeight:800}}>−{REMOVED[i].length}</div><div style={{fontSize:30,lineHeight:1,color:C.muted}}>→</div></div>}</React.Fragment>)}
    </div>
  </Page>;
};
const DrillScene=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return <DrillLayout t={f/fps}/>;};

const LayerScene=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const explode=interpolate(t,[.3,3.2],[0,1.65],smooth);
  return <Page chapter={3} eyebrow='03 / 按高度分层' title={<>同一个模型，<br/><span style={{color:C.teal}}>拆成五层来看</span></>}>
    <div style={{position:'absolute',left:CONTENT_LEFT,top:SAFE_TOP+318}}><Pill color={C.teal}>对称的层，使用同一颜色</Pill></div>
    <div data-safe-box style={{position:'absolute',left:CONTENT_LEFT,top:SAFE_TOP+390}}><VoxelModel cells={STAGES[3]} width={660} height={780} explode={explode} layerColors/></div>
    <div style={{position:'absolute',left:SAFE_RIGHT-160,top:SAFE_TOP+415,display:'flex',flexDirection:'column',gap:42,opacity:interpolate(t,[1.7,3.1],[0,1],smooth)}}>{LAYERS.map((layer,i)=><div key={i} style={{height:100,borderLeft:`5px solid ${COLORS[i]}`,paddingLeft:18}}><div style={{fontSize:30,color:C.muted}}>第 {i+1} 层</div><div style={{fontSize:48,lineHeight:1.2,fontWeight:900,color:mix(COLORS[i],C.ink,.25)}}>{layer.length}<span style={{fontSize:30,marginLeft:6}}>格</span></div></div>)}</div>
    <div style={{position:'absolute',...SAFE_SIDES,top:BODY_BOTTOM-46,textAlign:'center',fontSize:30,color:C.ink}}>外层 × 2　＋　次外层 × 2　＋　中心层</div>
  </Page>;
};

const LayerGrid:React.FC<{layer:number;numbered?:boolean;reveal?:number;size?:number}>=({layer,numbered=false,reveal=100,size=94})=>{
  const set=new Set(LAYERS[layer].map(v=>`${v.x},${v.y}`));let number=0;
  return <div style={{display:'grid',gridTemplateColumns:`repeat(5, ${size}px)`,gap:size<50?4:8}}>{Array.from({length:25},(_,i)=>{
    const filled=set.has(`${i%5},${Math.floor(i/5)}`);if(filled)number++;const n=number;
    return <div key={i} style={{width:size,height:size,borderRadius:size*.12,background:filled?COLORS[layer]:C.hole,border:`1.5px solid ${filled?mix(COLORS[layer],C.ink,.15):'#D9DBD3'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.max(32,size*.35),fontWeight:800,color:mix(COLORS[layer],C.ink,.7),boxShadow:filled?'inset 0 3px 0 #FFFFFF35, 0 4px 0 #172D3D0A':'none'}}>{filled&&numbered&&n<=reveal?n:null}</div>;
  })}</div>;
};

const CountScene=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const starts=[1,2,3,4,5].map(i=>cueStart(`c4_0${i}`,timeline.count.start+(i-1)*2.4)-timeline.count.start);
  let focus=0;for(let i=0;i<5;i++)if(t>=starts[i])focus=i;
  const reveal=Math.floor(interpolate(t,[starts[focus],starts[focus]+1.25],[0,LAYERS[focus].length],clamp));
  return <Page chapter={4} eyebrow='04 / 逐层核对' title={<>数清每一层，<br/><span style={{color:mix(COLORS[focus],C.ink,.25)}}>再把五层相加</span></>}>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+318,display:'flex',justifyContent:'space-between',alignItems:'center'}}><Pill color={COLORS[focus]}>第 {focus+1} 层 / 共 5 层</Pill><span style={{fontSize:30,color:C.muted}}>空白格 = 已挖空</span></div>
    <div data-safe-box style={{position:'absolute',left:SAFE_LEFT+(SAFE_WIDTH-402)/2,top:SAFE_TOP+405,scale:interpolate(t,[starts[focus],starts[focus]+.4],[.95,1],smooth)}}><LayerGrid layer={focus} numbered reveal={reveal} size={74}/></div>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+820,textAlign:'center',lineHeight:1.2}}><span style={{fontSize:30,color:C.muted,marginRight:20}}>本层剩余</span><b style={{fontSize:72,color:mix(COLORS[focus],C.ink,.25)}}>{reveal}</b><span style={{fontSize:34,color:C.muted,marginLeft:15}}>个</span></div>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+908,display:'flex',justifyContent:'space-between',borderTop:`1px solid ${C.line}`,paddingTop:20}}>{LAYERS.map((layer,i)=><div key={i} style={{textAlign:'center'}}><div style={{fontSize:30,lineHeight:1.4,color:C.muted,marginBottom:6}}>第{i+1}层</div><LayerGrid layer={i} size={19}/><div style={{fontSize:34,lineHeight:1.3,fontWeight:900,color:mix(COLORS[i],C.ink,.25),marginTop:6}}>{layer.length}</div></div>)}</div>
    <div style={{position:'absolute',...SAFE_SIDES,top:BODY_BOTTOM-51,textAlign:'center',fontSize:38,lineHeight:1.3,fontWeight:900,color:C.ink}}>20 + 16 + 4 + 16 + 20 <span style={{color:mix(C.blue,C.ink,.35)}}>= 76</span></div>
  </Page>;
};

const AnswerScene=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  return <Page chapter={5} eyebrow='05 / 答案与验算' title={<>剩余体积，<br/><span style={{color:C.blue}}>两种方法相互验证</span></>}>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+325,textAlign:'center'}}>
      <div style={{display:'inline-block',fontSize:170,lineHeight:1.1,fontWeight:950,letterSpacing:-8,color:C.blue,scale:interpolate(t,[0,.7],[.86,1],smooth)}}>76</div><div style={{fontSize:40,fontWeight:700,marginTop:8}}>立方厘米</div>
    </div>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+620,borderTop:`1px solid ${C.line}`,paddingTop:24}}>
      <div style={{fontSize:30,color:C.muted,marginBottom:14}}>方法1 / 分层求和</div>
      <div style={{fontSize:44,fontWeight:900,textAlign:'center',whiteSpace:'nowrap'}}><span style={{color:mix(C.blue,C.ink,.25)}}>20</span> + <span style={{color:mix(C.teal,C.ink,.25)}}>16</span> + <span style={{color:mix(C.gold,C.ink,.35)}}>4</span> + <span style={{color:mix(C.teal,C.ink,.25)}}>16</span> + <span style={{color:mix(C.blue,C.ink,.25)}}>20</span> = 76</div>
    </div>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+840,borderTop:`1px solid ${C.line}`,paddingTop:24,opacity:interpolate(t,[2.8,3.4],[0,1],smooth)}}>
      <div style={{fontSize:30,color:C.muted,marginBottom:12}}>方法2 / 原体积减去挖空</div>
      <div style={{fontSize:64,lineHeight:1.2,fontWeight:900,textAlign:'center'}}>125 − <span style={{color:C.orange}}>49</span> = <span style={{color:C.blue}}>76</span></div>
      <div style={{textAlign:'center',fontSize:30,color:C.muted,marginTop:16}}>挖去：25 + 14 + 10 = 49</div>
    </div>
    <div style={{position:'absolute',...SAFE_SIDES,top:BODY_BOTTOM-85,textAlign:'center'}}><Pill color={C.teal}>分层计数与几何模型一致 ✓</Pill></div>
  </Page>;
};

const Subtitles=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const cue=captions.find(c=>t>=c.start&&t<c.end);
  if(!cue)return null;
  return <div data-safe-box style={{position:'absolute',...SAFE_SIDES,top:SAFE_BOTTOM-SUBTITLE_HEIGHT,height:SUBTITLE_HEIGHT,boxSizing:'border-box',padding:'14px 22px',display:'flex',alignItems:'center',justifyContent:'center',background:'#FFFFFFF2',border:`1px solid ${C.line}`,borderRadius:18,color:C.ink,fontFamily:FONT,textAlign:'center',fontSize:32,lineHeight:1.4,fontWeight:600,boxShadow:'0 7px 25px #172D3D08'}}>{cue.text}</div>;
};

const EndingScene=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const pop=spring({frame,fps,config:{damping:12,stiffness:115,mass:.8}});
  return <Page chapter={5} eyebrow='05 / 你的答案呢？' title={<>三个孔打通，<br/><span style={{color:C.blue}}>还剩这些体积</span></>}>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+375,textAlign:'center'}}><div style={{display:'inline-block',fontSize:260,lineHeight:1.1,fontWeight:950,letterSpacing:-12,color:C.blue,scale:.7+.3*pop}}>76</div></div>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+730,textAlign:'center',fontSize:50,fontWeight:800}}>立方厘米</div>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+935,textAlign:'center',fontSize:42,lineHeight:1.5,fontWeight:800,color:C.ink,opacity:interpolate(t,[3,3.4],[0,1],smooth)}}>你算对了吗？评论区告诉我</div>
  </Page>;
};

type SafeProps={showSafeArea?:boolean};
const SafeAreaOverlay=()=> <svg width={VIDEO_WIDTH} height={VIDEO_HEIGHT} style={{position:'absolute',inset:0,pointerEvents:'none'}}><rect x={SAFE_LEFT} y={SAFE_TOP} width={SAFE_WIDTH} height={SAFE_BOTTOM-SAFE_TOP} fill='none' stroke='#C72C44' strokeWidth='2' strokeDasharray='12 8'/></svg>;

export const MathExplainer=({showSafeArea=false}:SafeProps)=>{
  const {fps}=useVideoConfig();
  return <AbsoluteFill data-video-root style={{background:C.paper,fontFamily:FONT,color:C.ink}}>
    <Sequence name='读题' from={timeline.question.start*fps} durationInFrames={(timeline.question.end-timeline.question.start)*fps} premountFor={fps}><QuestionScene/></Sequence>
    <Sequence name='打孔' from={timeline.drill.start*fps} durationInFrames={(timeline.drill.end-timeline.drill.start)*fps} premountFor={fps}><DrillScene/></Sequence>
    <Sequence name='分层' from={timeline.layers.start*fps} durationInFrames={(timeline.layers.end-timeline.layers.start)*fps} premountFor={fps}><LayerScene/></Sequence>
    <Sequence name='逐层点数' from={timeline.count.start*fps} durationInFrames={(timeline.count.end-timeline.count.start)*fps} premountFor={fps}><CountScene/></Sequence>
    <Sequence name='答案验算' from={timeline.answer.start*fps} durationInFrames={(timeline.answer.end-timeline.answer.start)*fps} premountFor={fps}><AnswerScene/></Sequence>
    <Sequence name='互动结尾' from={timeline.ending.start*fps} durationInFrames={(timeline.ending.end-timeline.ending.start)*fps} premountFor={fps}><EndingScene/></Sequence>
    {captions.map(cue=><Sequence key={cue.id} from={Math.round(cue.start*fps)} durationInFrames={Math.ceil(cue.duration*fps)} premountFor={fps}><Audio src={staticFile(cue.audio)}/></Sequence>)}
    <Subtitles/>
    {showSafeArea&&<SafeAreaOverlay/>}
  </AbsoluteFill>;
};
export const CheckStill=()=> <DrillLayout t={18}/>;

export const DouyinCover=({showSafeArea=false}:SafeProps)=> <AbsoluteFill data-video-root>
  <Page chapter={1} showCounter={false} eyebrow='正方体体积挑战' titleSize={88} title={<>打三个孔，<br/><span style={{color:C.blue}}>体积是多少？</span></>}>
    <div style={{position:'absolute',...SAFE_SIDES,top:SAFE_TOP+390,fontSize:42,fontWeight:800,color:C.ink}}>一层一层数，不会错</div>
    <div data-safe-box style={{position:'absolute',left:CONTENT_LEFT+5,top:SAFE_TOP+490}}><VoxelModel cells={STAGES[3]} width={CONTENT_WIDTH-10} height={650}/></div>
    <div style={{position:'absolute',...SAFE_SIDES,top:BODY_BOTTOM-55,textAlign:'center',fontSize:32,fontWeight:800,color:C.muted}}>棱长5厘米 · 3方向贯通 · 每孔5格</div>
  </Page>
  {showSafeArea&&<SafeAreaOverlay/>}
</AbsoluteFill>;
