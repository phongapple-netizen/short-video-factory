import React from 'react';
import {AbsoluteFill,Audio,Sequence,useCurrentFrame,useVideoConfig,staticFile,spring,interpolate,Easing} from 'remotion';
import captions from './captions.json';
import timeline from './timeline.json';
import {Frame,Pill,C,FONT,SafeOverlay} from './components/Frame';
import {GeometryDiagram} from './components/GeometryDiagram';
import {W,H,FPS,SAFE,LEFT,SIDES,SUBTITLE_HEIGHT,BODY_BOTTOM} from './layout';
import {GEOMETRY_AUDIT} from './geometry';
import {CaptionBox} from './components/CaptionBox';

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const ease={...clamp,easing:Easing.bezier(.2,.8,.2,1)};
const scenes=[
  {eyebrow:'题目 / 先看清条件',title:<>对角线垂直两腰，<br/><span style={{color:C.blue}}>面积是多少？</span></>,pill:'等腰梯形ABCD · 求△ABC面积'},
  {eyebrow:'第2步 / 找等腰直角三角形',title:<>先补一个角，<br/><span style={{color:C.teal}}>得到AD=AO</span></>,pill:'高亮△AOD：45°、90°、45°'},
  {eyebrow:'第3步 / 找到圆心M',title:<>取长底的中点，<br/><span style={{color:C.teal}}>发现四点同圆</span></>,pill:'斜边中点到三个顶点距离相等'},
  {eyebrow:'第4步 / 揭开隐藏的90°',title:<>同一段圆弧，<br/><span style={{color:C.gold}}>圆心角是两倍</span></>,pill:'圆周角看D，圆心角看M'},
  {eyebrow:'第5步 / 高是上底的一半',title:<>底20，高10，<br/><span style={{color:C.blue}}>答案揭晓</span></>,pill:'N为AB中点 · MN是梯形的高'},
  {eyebrow:'奥数拓展 / 建议反复观看',title:<>两个拓展性质，<br/><span style={{color:C.blue}}>难点在发现图形</span></>,pill:'重点回看第3—5步动画'},
  {eyebrow:'最后提醒 / 垂直关系别看反',title:<>看清垂直关系，<br/><span style={{color:C.orange}}>答案会不同</span></>,pill:'AC⊥AD，BD⊥BC'},
];

const FormulaPanel:React.FC<{rows:React.ReactNode[];size?:number}>=({rows,size=40})=><div style={{position:'absolute',...SIDES,top:1110,padding:'14px 18px',borderTop:`1px solid ${C.line}`,boxSizing:'border-box'}}>
  {rows.map((row,i)=><div key={i} style={{fontSize:size,lineHeight:1.3,fontWeight:800,marginTop:i===0?0:7,color:C.ink}}>{row}</div>)}
</div>;

const LessonScene:React.FC<{stage:number;staticDiagram?:boolean}>=({stage,staticDiagram=false})=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const scene=scenes[stage];
  const areaAt=(captions.find(c=>c.id==='d2')?.start??43)-timeline.area.start;
  const areaPopStart=(captions.find(c=>c.id==='d2')?.end??47.5)-timeline.area.start-.45;
  const centralAt=(captions.find(c=>c.id==='c3')?.start??30)-timeline.step3.start+.8;
  const ctaAt=(captions.find(c=>c.id==='f2')?.start??59)-timeline.ending.start;
  const pop=spring({frame:Math.max(0,frame-areaPopStart*fps),fps,config:{damping:12,stiffness:150,mass:.8}});
  return <Frame step={stage+1} eyebrow={scene.eyebrow} title={scene.title} titleSize={stage===0?88:64}>
    <div style={{position:'absolute',left:LEFT,top:stage===0?548:480}}><Pill color={stage===1?C.teal:stage===3?C.gold:stage===6?C.orange:C.blue}>{stage===4&&t>=areaAt?'△ABC以AB为底，高CH=10':scene.pill}</Pill></div>
    <div data-diagram style={{position:'absolute',left:SAFE.left,top:540}}><GeometryDiagram stage={stage} time={t} staticDiagram={staticDiagram} areaAt={areaAt} centralAt={centralAt}/></div>
    {stage===0&&<FormulaPanel rows={[
      <span style={{color:C.orange}}>AC⊥AD　　BD⊥BC</span>,
      'AB∥CD，AB为上方短底边',
      <span style={{fontSize:36,color:C.muted}}>∠AOB=135°，AB=20 cm</span>,
    ]} size={42}/>}
    {stage===1&&<FormulaPanel rows={[
      '∠AOD=180°−135°=45°',
      '∠OAD=90° ⇒ ∠ADO=45°',
      <span style={{color:C.teal}}>∴ AD=AO</span>,
      <span style={{fontSize:34}}>D、O、B共线 ⇒ ∠ADB=45°</span>,
    ]} size={38}/>}
    {stage===2&&<FormulaPanel rows={[
      'M是长底CD的中点',
      '△ACD直角 ⇒ MA=MC=MD',
      '△BCD直角 ⇒ MB=MC=MD',
      <span style={{color:C.gold}}>∴ MA=MB=MC=MD</span>,
    ]} size={38}/>}
    {stage===3&&<FormulaPanel rows={[
      'D在圆上：∠ADB=45°',
      <span style={{fontSize:38}}>同弧AB：∠AMB=2×45°=90°</span>,
      <span style={{color:C.gold}}>MA=MB ⇒ △AMB等腰直角</span>,
    ]}/>}
    {stage===4&&<>
      <FormulaPanel rows={[
        <span style={{fontSize:36}}>△AMN等腰直角 ⇒ MN=AN</span>,
        <span style={{color:C.teal}}>高=MN=20÷2=10厘米</span>,
        <span style={{fontSize:38}}>S△ABC=20×10÷2={t<areaPopStart?'?':'100'}</span>,
      ]}/>
      {t>=areaPopStart&&<div style={{position:'absolute',left:490,top:735,width:265,textAlign:'center',transform:`scale(${.72+.28*pop})`,fontSize:78,lineHeight:1.1,fontWeight:950,color:C.blue}}>100<div style={{fontSize:30}}>平方厘米</div></div>}
    </>}
    {stage===5&&<FormulaPanel rows={[
      <span style={{fontSize:32}}>斜边中线等于斜边的一半</span>,
      <span style={{fontSize:36}}>同弧：圆心角=2×圆周角</span>,
      <span style={{fontSize:32,color:C.orange}}>通常不是普通五年级必修</span>,
      <span style={{fontSize:32}}>建议重点回看第3—5步动画</span>,
    ]} size={36}/>}
    {stage===6&&<>
      <FormulaPanel rows={[
        <span style={{color:C.orange}}>AC⊥AD　　BD⊥BC</span>,
        <span style={{fontSize:38}}>△ABC面积：100 cm²</span>,
      ]} size={44}/>
      <div style={{position:'absolute',...SIDES,top:BODY_BOTTOM-53,textAlign:'center',fontSize:38,lineHeight:1.3,fontWeight:900,opacity:interpolate(t,[ctaAt,ctaAt+.4],[0,1],ease)}}>你算对了吗？评论区告诉我</div>
    </>}
  </Frame>;
};

const Subtitles=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const cue=captions.find(c=>t>=c.start&&t<c.end);if(!cue)return null;
  return <CaptionBox>{cue.text}</CaptionBox>;
};

export type Props={showSafeArea?:boolean};
export const TrapezoidExplainer=({showSafeArea=false}:Props)=> <AbsoluteFill style={{background:C.paper,fontFamily:FONT,color:C.ink}}>
  <Sequence name='题目' from={timeline.question.start*FPS} durationInFrames={(timeline.question.end-timeline.question.start)*FPS} premountFor={FPS}><LessonScene stage={0}/></Sequence>
  <Sequence name='邻补角与等腰直角三角形' from={timeline.step1.start*FPS} durationInFrames={(timeline.step1.end-timeline.step1.start)*FPS} premountFor={FPS}><LessonScene stage={1}/></Sequence>
  <Sequence name='斜边中点性质' from={timeline.step2.start*FPS} durationInFrames={(timeline.step2.end-timeline.step2.start)*FPS} premountFor={FPS}><LessonScene stage={2}/></Sequence>
  <Sequence name='同弧关系与隐藏直角' from={timeline.step3.start*FPS} durationInFrames={(timeline.step3.end-timeline.step3.start)*FPS} premountFor={FPS}><LessonScene stage={3}/></Sequence>
  <Sequence name='面积' from={timeline.area.start*FPS} durationInFrames={(timeline.area.end-timeline.area.start)*FPS} premountFor={FPS}><LessonScene stage={4}/></Sequence>
  <Sequence name='奥数拓展与复习' from={timeline.verify.start*FPS} durationInFrames={(timeline.verify.end-timeline.verify.start)*FPS} premountFor={FPS}><LessonScene stage={5}/></Sequence>
  <Sequence name='结尾' from={timeline.ending.start*FPS} durationInFrames={(timeline.ending.end-timeline.ending.start)*FPS} premountFor={FPS}><LessonScene stage={6}/></Sequence>
  {captions.map(cue=><Sequence key={cue.id} from={Math.round(cue.start*FPS)} durationInFrames={Math.ceil(cue.duration*FPS)} premountFor={FPS}><Audio src={staticFile(cue.audio)}/></Sequence>)}
  <Subtitles/>
  {showSafeArea&&<SafeOverlay/>}
</AbsoluteFill>;

export const Cover=({showSafeArea=false}:Props)=> <Frame step={1} cover eyebrow='等腰梯形 · 读图挑战' titleSize={88} title={<>对角线垂直两腰，<br/><span style={{color:C.blue}}>面积是多少？</span></>}>
  <div style={{position:'absolute',left:LEFT,top:548}}><Pill>短底AB=20 · ∠AOB=135°</Pill></div>
  <div style={{position:'absolute',left:SAFE.left,top:540}}><GeometryDiagram stage={0} time={4} staticDiagram/></div>
  <FormulaPanel rows={[
    <span style={{color:C.orange}}>AC⊥AD　　BD⊥BC</span>,
    <span style={{fontSize:38}}>看清垂直关系，再算△ABC面积</span>,
  ]} size={44}/>
  {showSafeArea&&<SafeOverlay/>}
</Frame>;
