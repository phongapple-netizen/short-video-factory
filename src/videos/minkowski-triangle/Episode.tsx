import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig, staticFile} from 'remotion';
import {SAFE as PROFILE_SAFE} from '../../shared/profile';
import {useFrameAudit} from '../../shared/story';
import {Board, Classroom, Fill, FONT, ROD, Rod, RodLabel, Sqrt, Sup, progress, type Pt} from '../../kits/rod-board';
import {SIDES as S, EQUAL_D, apart, joined, lerp} from './model';
import content from './content.json';
import runtime from './runtime.json';

// 闵可夫斯基不等式：彩色根号公式→两组直角边→长出斜边→首尾拼接→绿色第三边→填充“折线 vs 直线”→比例相等时折线拉直。
// 所有点由 model.ts 计算；动作时刻挂在字幕 cue 上。

const W = 1080, H = 1920;
const SAFE = {x0: PROFILE_SAFE.left + 15, x1: PROFILE_SAFE.right - 15};
const CX = (SAFE.x0 + SAFE.x1) / 2;
const BOARD = {left: CX - 430, top: 430, width: 860, height: 900};
const INK = ROD.ink;

type Cue = {id: string; scene: string; start: number; end: number; text: string; audio?: string | null};
type Rt = {scenes: {id: string; start: number; end: number}[]; durationInFrames: number; captions: Cue[]};
const RT = runtime as unknown as Rt;
const cueAt = (id: string, frac = 0): number => {
  const cue = RT.captions.find(c => c.id === id);
  if (!cue) throw new Error(`MinkowskiTriangle missing cue ${id}`);
  const scene = RT.scenes.find(s => s.id === cue.scene)!;
  return cue.start - scene.start + frac * (cue.end - cue.start);
};

// ---------- 画面状态：后面的场景继承前面已完成的步骤 ----------
type State = {intro: number; hypB: number; hypR: number; move: number; aux: number; green: number; fill: number; tags: number; eq: number;
  callout: React.ReactNode | null; calloutAt: number; calloutTone: string};
const DONE: State = {intro: 1, hypB: 1, hypR: 1, move: 1, aux: 1, green: 1, fill: 1, tags: 1, eq: 0, callout: null, calloutAt: 0, calloutTone: INK};

function stateFor(id: string, f: number, fps: number): State {
  const c = (cue: string, frac = 0) => cueAt(cue, frac) * fps;
  switch (id) {
    case '01': return {...DONE, intro: progress(f, 0, 40), hypB: 0, hypR: 0, move: 0, aux: 0, green: 0, fill: 0, tags: 0};
    case '02': return {...DONE, hypB: progress(f, c('s02-01', 0.15), c('s02-01', 0.55)), hypR: progress(f, c('s02-02', 0.1), c('s02-02', 0.6)),
      move: 0, aux: 0, green: 0, fill: 0, tags: 0};
    case '03': return {...DONE, move: progress(f, c('s03-01', 0.05), c('s03-01', 0.05) + 40), aux: progress(f, c('s03-02'), c('s03-02') + 15),
      green: 0, fill: 0, tags: 0};
    case '04': return {...DONE, green: progress(f, c('s04-01', 0.05), c('s04-01', 0.4)), fill: 0, tags: 0};
    case '05': return {...DONE, fill: progress(f, c('s05-01', 0.45), c('s05-01', 0.45) + 15), tags: progress(f, c('s05-01'), c('s05-01') + 12),
      callout: '两边之和 ≥ 第三边', calloutAt: c('s05-01', 0.6), calloutTone: ROD.orange};
    default: {
      const ask = c('s06-02');
      return {...DONE, eq: progress(f, c('s06-01', 0.15), c('s06-01', 0.7)),
        callout: f >= ask ? <>还想看哪个证明？<br />评论区告诉我</> : <>a∶b = c∶d<br />折线拉直 → 取等号</>,
        calloutAt: f >= ask ? ask : c('s06-01', 0.7), calloutTone: f >= ask ? ROD.blue : ROD.green};
    }
  }
}

// ---------- 白板上的图 ----------
const BLUE_AT: Pt = {x: 100, y: 620}, RED_AT: Pt = {x: 460, y: 620}, CORNER: Pt = {x: 150, y: 790};

const Formula = ({tags}: {tags: number}) => {
  const size = 50;
  const tag = (t: string) => (
    <span data-safe style={{position: 'absolute', left: '50%', top: -44, transform: 'translateX(-50%)', fontSize: 30, fontWeight: 800,
      color: INK, whiteSpace: 'nowrap', opacity: tags}}>{t}</span>
  );
  return (
    <div data-safe style={{position: 'absolute', left: 0, top: 60, width: BOARD.width, display: 'flex', justifyContent: 'center',
      alignItems: 'center', gap: 10, fontFamily: FONT, fontSize: size, fontWeight: 800, color: INK}}>
      <span style={{position: 'relative', display: 'inline-flex', gap: 10, alignItems: 'center'}}>
        {tags > 0 && tag('2条斜边')}
        <Sqrt color={ROD.blue} size={size}>a<Sup>2</Sup>+b<Sup>2</Sup></Sqrt>+<Sqrt color={ROD.red} size={size}>c<Sup>2</Sup>+d<Sup>2</Sup></Sqrt>
      </span>
      <span>≥</span>
      <span style={{position: 'relative', display: 'inline-flex'}}>
        {tags > 0 && tag('1条斜边')}
        <Sqrt color={ROD.green} size={size}>(a+c)<Sup>2</Sup>+(b+d)<Sup>2</Sup></Sqrt>
      </span>
    </div>
  );
};

const Diagram = ({s, frame}: {s: State; frame: number}) => {
  const d = interpolate(s.eq, [0, 1], [S.d, EQUAL_D]);
  const A = apart(S.a, S.b, S.c, S.d, BLUE_AT, RED_AT), J = joined(S.a, S.b, S.c, d, CORNER);
  const mv = (from: Pt, to: Pt) => lerp(from, to, s.move);
  const blue = {right: mv(A.blue.right, J.blue.right), top: mv(A.blue.top, J.blue.top), foot: mv(A.blue.foot, J.blue.foot)};
  const red = {right: mv(A.red.right, J.red.right), top: mv(A.red.top, J.red.top), foot: mv(A.red.foot, J.red.foot)};
  const L = (t: number) => Math.min(1, t * 1.5);
  return (
    <>
      <svg style={{position: 'absolute', left: 0, top: 0}} width={BOARD.width} height={BOARD.height} overflow="visible">
        <Fill points={[J.apex, J.kink, J.end]} color={ROD.orange} opacity={0.5 * s.fill * (1 - s.eq * 0.9)} />
        <Rod p={J.blue.right} q={J.corner} color={ROD.gray} dashed opacity={s.aux} width={10} />
        <Rod p={J.corner} q={J.red.right} color={ROD.gray} dashed opacity={s.aux} width={10} />
        <Rod p={blue.top} q={blue.right} color={ROD.blue} />
        <Rod p={blue.right} q={blue.foot} color={ROD.blue} />
        <Rod p={blue.top} q={blue.foot} color={ROD.blue} grow={s.hypB} />
        <Rod p={red.top} q={red.right} color={ROD.red} />
        <Rod p={red.right} q={red.foot} color={ROD.red} />
        <Rod p={red.top} q={red.foot} color={ROD.red} grow={s.hypR} />
        <Rod p={J.apex} q={J.end} color={ROD.green} grow={s.green} width={13} />
      </svg>
      <RodLabel p={blue.top} q={blue.right} color={ROD.blue} rotate={false}>a</RodLabel>
      <RodLabel p={blue.right} q={blue.foot} color={ROD.blue} rotate={false}>b</RodLabel>
      <RodLabel p={red.top} q={red.right} color={ROD.red} rotate={false}>c</RodLabel>
      <RodLabel p={red.right} q={red.foot} color={ROD.red} rotate={false}>d</RodLabel>
      <RodLabel p={blue.top} q={blue.foot} side={-1} gap={40} color={ROD.blue} size={32} opacity={L(s.hypB)}>
        <Sqrt color={ROD.blue} size={32}>a<Sup>2</Sup>+b<Sup>2</Sup></Sqrt>
      </RodLabel>
      <RodLabel p={red.top} q={red.foot} side={-1} gap={40} color={ROD.red} size={32} opacity={L(s.hypR)}>
        <Sqrt color={ROD.red} size={32}>c<Sup>2</Sup>+d<Sup>2</Sup></Sqrt>
      </RodLabel>
      <RodLabel p={J.blue.right} q={J.corner} color={ROD.gray} opacity={s.aux} rotate={false}>c</RodLabel>
      <RodLabel p={J.corner} q={J.red.right} color={ROD.gray} opacity={s.aux} rotate={false}>b</RodLabel>
      <RodLabel p={J.apex} q={J.corner} gap={84} color={INK} opacity={s.aux} rotate={false}>a+c</RodLabel>
      <RodLabel p={J.corner} q={J.end} gap={84} color={INK} opacity={s.aux} rotate={false}>b+d</RodLabel>
      <RodLabel p={J.apex} q={J.end} side={-1} gap={46 + 64 * s.eq} color={ROD.green} size={30} opacity={L(s.green)}>
        <Sqrt color={ROD.green} size={30}>(a+c)<Sup>2</Sup>+(b+d)<Sup>2</Sup></Sqrt>
      </RodLabel>
      {s.callout && (
        <div data-safe style={{position: 'absolute', left: 440, top: 200, width: 380, boxSizing: 'border-box', textAlign: 'center',
          background: '#fff', border: `5px solid ${s.calloutTone}`, borderRadius: 22, padding: '12px 10px',
          fontFamily: FONT, fontSize: 36, fontWeight: 900, color: INK, lineHeight: 1.3,
          opacity: progress(frame, s.calloutAt, s.calloutAt + 10), transform: `scale(${interpolate(progress(frame, s.calloutAt, s.calloutAt + 10), [0, 1], [0.7, 1])})`}}>
          {s.callout}
        </div>
      )}
    </>
  );
};

const Stage = ({id, frame, fps}: {id: string; frame: number; fps: number}) => {
  const s = stateFor(id, frame, fps);
  const scene = content.scenes.find(x => x.id === id)!;
  return (
    <>
      <div data-safe data-title style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, boxSizing: 'border-box', top: 220,
        textAlign: 'center', background: 'rgba(255,255,255,0.92)', borderRadius: 24, padding: '10px 12px',
        fontFamily: FONT, fontSize: id === '01' ? 96 : 88, lineHeight: 1.15, fontWeight: 900, color: INK,
        opacity: id === '01' ? 1 : progress(frame, -5, 8)}}>
        {scene.title}
      </div>
      <Board {...BOARD} intro={s.intro}>
        <Formula tags={s.tags} />
        <div data-safe style={{position: 'absolute', left: BOARD.width - 440, top: 140, width: 400, textAlign: 'right', whiteSpace: 'nowrap',
          fontFamily: FONT, fontSize: 30, fontWeight: 600, color: '#6B7680'}}>（a、b、c、d 取正数）</div>
        <Diagram s={s} frame={frame} />
      </Board>
    </>
  );
};

export const MinkowskiVideo: React.FC<{debugAudit?: boolean; showSafeArea?: boolean}> = ({debugAudit = false, showSafeArea = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ref = React.useRef<HTMLDivElement>(null);
  useFrameAudit(ref, frame, debugAudit);
  const seconds = frame / fps;
  let idx = RT.scenes.findIndex(s => seconds >= s.start && seconds < s.end);
  if (idx < 0) idx = RT.scenes.length - 1;
  const sc = RT.scenes[idx];
  const cue = [...RT.captions].reverse().find(c => c.scene === sc.id && seconds >= c.start && seconds < c.end + 0.6);
  return (
    <AbsoluteFill ref={ref} style={{background: ROD.wall, fontFamily: FONT}}>
      <Classroom width={W} height={H} />
      <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 168, display: 'flex',
        justifyContent: 'space-between', fontFamily: FONT, fontSize: 32, fontWeight: 800, color: INK}}>
        <span>{content.brand}</span><span>图形证明</span>
      </div>
      <Stage id={sc.id} frame={Math.round(frame - sc.start * fps)} fps={fps} />
      {cue && (
        <div data-safe data-caption style={{position: 'absolute', left: SAFE.x0, top: 1360, width: SAFE.x1 - SAFE.x0, minHeight: 124,
          boxSizing: 'border-box', background: 'rgba(255,255,255,0.96)', border: '1px solid #C9D6DA', borderRadius: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre-line',
          fontFamily: FONT, fontSize: 40, fontWeight: 600, color: INK, padding: '8px 24px', lineHeight: 1.35}}>
          {cue.text}
        </div>
      )}
      {RT.captions.filter(c => c.audio).map(c => (
        <Sequence key={c.id} from={Math.round(c.start * fps)} durationInFrames={Math.ceil((c.end - c.start) * fps)} premountFor={fps}>
          <Audio src={staticFile(c.audio!)} />
        </Sequence>
      ))}
      {showSafeArea && (
        <svg width={W} height={H} style={{position: 'absolute'}}>
          <rect x={PROFILE_SAFE.left} y={PROFILE_SAFE.top} width={PROFILE_SAFE.right - PROFILE_SAFE.left}
            height={PROFILE_SAFE.bottom - PROFILE_SAFE.top} fill="none" stroke="#C72C44" strokeDasharray="12 8" />
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const MinkowskiCover: React.FC = () => (
  <AbsoluteFill style={{background: ROD.wall, fontFamily: FONT}}>
    <Classroom width={W} height={H} />
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 168, display: 'flex', justifyContent: 'space-between',
      fontFamily: FONT, fontSize: 32, fontWeight: 800, color: INK}}><span>{content.brand}</span><span>图形证明</span></div>
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 220, textAlign: 'center', background: 'rgba(255,255,255,0.92)',
      borderRadius: 24, padding: '10px 12px', fontFamily: FONT, fontSize: 96, fontWeight: 900, color: INK, boxSizing: 'border-box'}}>{content.title}</div>
    <Board {...BOARD} intro={1}>
      <Formula tags={1} />
      <Diagram s={{...DONE, callout: content.coverSubtitle, calloutAt: -20, calloutTone: ROD.orange}} frame={0} />
    </Board>
  </AbsoluteFill>
);
