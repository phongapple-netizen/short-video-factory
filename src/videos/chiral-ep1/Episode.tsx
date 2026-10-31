import React from 'react';
import {interpolate, random} from 'remotion';
import {FONT, progress} from '../../kits/rod-board';
import {Dots, Hand, MOL, Molecule} from '../../kits/molecule';
import {Banner, CX, EpisodeShell, H, LabPaper, Label, SAFE, W, enter, makeCueAt, type Runtime, type SceneProps} from '../../kits/episode-shell';
import {CAT, CAT_EE, EE_EXAMPLE, PAIRS, PAIR_EE, eeOf, productEe} from './model';
import content from './content.json';
import runtime from './runtime.json';

// 上集：手 → 镜像不能重合 → 手性碳 vs 无手性 → 香芹酮与受体手套 → ee → 手性催化剂 → 卡根曲线 → 配对罢工 → 预告。

const RT = runtime as unknown as Runtime;
const cueAt = makeCueAt(RT, 'ChiralEp1');
const INK = '#1E2A36', MUTED = '#5D6B74', GOLD = '#B87A00', YES = '#1F9D6B', NO = '#D64545';
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>{children}</svg>
);
const Note: React.FC<{text: string; top: number; frame: number; at: number}> = ({text, top, frame, at}) => (
  <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top, textAlign: 'center', fontFamily: FONT,
    fontSize: 30, fontWeight: 600, color: MUTED, opacity: progress(frame, at, at + 10)}}>{text}</div>
);

// ---------- 01 手 ----------
const Scene01 = ({frame, fps}: SceneProps) => {
  const turnAt = cueAt('s01-01', 0.2) * fps, nobel = cueAt('s01-02', 0.4) * fps;
  const turn = interpolate(progress(frame, turnAt, turnAt + 50), [0, 1], [0, 360]);
  return (
    <div>
      <Svg>
        {/* 只在平面内转动：翻面会露出手背，不能当作变成另一只手 */}
        <g transform={`rotate(${turn} ${CX - 200} 860)`}><Hand x={CX - 200} y={860} s={1.3} color={MOL.L} /></g>
        <Hand x={CX + 200} y={860} s={1.3} flip={-1} color={MOL.R} />
      </Svg>
      <Label text="左手" x={CX - 200} y={1000} color={MOL.L} frame={frame} at={-20} w={160} />
      <Label text="右手" x={CX + 200} y={1000} color={MOL.R} frame={frame} at={-20} w={160} />
      {frame >= turnAt + 50 && <Label text="变不过去 ✕" x={CX} y={560} color={NO} frame={frame} at={turnAt + 50} w={260} />}
      {frame >= nobel && <Banner frame={frame} at={nobel} top={1140} tone="#F2B632" text="2026 诺贝尔化学奖" />}
    </div>
  );
};

// ---------- 02 镜像 ≠ 重合 ----------
const Scene02 = ({frame, fps}: SceneProps) => {
  const mirror = cueAt('s02-01', 0.2) * fps, slide = cueAt('s02-02', 0.15) * fps, word = cueAt('s02-02', 0.7) * fps;
  const reflect = progress(frame, mirror, mirror + 24);
  const move = progress(frame, slide, slide + 24) - progress(frame, slide + 60, slide + 80);
  return (
    <div>
      <Svg>
        <line x1={CX} y1={520} x2={CX} y2={1080} stroke={MUTED} strokeWidth={4} strokeDasharray="14 10" />
        <Hand x={CX - 200} y={840} s={1.2} color={MOL.L} />
        <g opacity={reflect}><Hand x={CX + 200 - move * 400} y={840} s={1.2} flip={-interpolate(reflect, [0, 1], [-1, 1])} color={MOL.R} dim={0.85} /></g>
        {move > 0.95 && <circle cx={CX - 200} cy={840} r={150} fill="none" stroke={NO} strokeWidth={6} strokeDasharray="12 8" />}
      </Svg>
      <Label text="镜子" x={CX} y={1090} color={MUTED} frame={frame} at={-20} w={140} size={32} />
      {move > 0.95 && <Label text="拇指方向相反 ✕" x={CX - 140} y={520} color={NO} frame={frame} at={slide + 24} w={320} />}
      {frame >= word && <Banner frame={frame} at={word} top={1150} tone={MOL.L} text="镜像，却不能重合 → 手性" />}
    </div>
  );
};

// ---------- 03 手性碳 vs 无手性 ----------
const Scene03 = ({frame, fps}: SceneProps) => {
  const pair = cueAt('s03-01', 0.3) * fps, spin = cueAt('s03-02', 0.05) * fps, achiral = cueAt('s03-03', 0.05) * fps;
  const turn = interpolate(progress(frame, spin, spin + 50), [0, 1], [0, 360]);
  const slide = progress(frame, spin + 50, spin + 70);
  const aSlide = progress(frame, achiral + 30, achiral + 50);
  const isAchiral = frame >= achiral;
  return (
    <div>
      <Svg>
        <line x1={CX} y1={520} x2={CX} y2={1060} stroke={MUTED} strokeWidth={4} strokeDasharray="14 10" />
        <Molecule x={CX - 200} y={780} s={1.3} ring={isAchiral ? MUTED : MOL.L} achiral={isAchiral} />
        <g opacity={progress(frame, pair, pair + 15)}>
          <Molecule x={CX + 200 - (isAchiral ? aSlide : slide) * 400} y={780} s={1.3} flip={-1} turn={isAchiral ? 0 : turn}
            ring={isAchiral ? MUTED : MOL.R} achiral={isAchiral} dim={0.85} />
        </g>
      </Svg>
      {!isAchiral && <Label text={'四个不同基团'} x={CX - 200} y={960} color={MOL.L} frame={frame} at={6} w={300} size={34} />}
      {!isAchiral && slide > 0.95 && <Label text="红绿对调，对不上 ✕" x={CX} y={540} color={NO} frame={frame} at={spin + 70} w={380} />}
      {isAchiral && <Label text={'两个基团相同'} x={CX - 200} y={960} color={MUTED} frame={frame} at={achiral + 4} w={300} size={34} />}
      {isAchiral && aSlide > 0.95 && <Label text="完全重合 ✓ 没有手性" x={CX} y={540} color={YES} frame={frame} at={achiral + 50} w={400} />}
    </div>
  );
};

// ---------- 04 香芹酮、受体手套、药物 ----------
const Bottle: React.FC<{x: number; color: string; flip: number}> = ({x, color, flip}) => (
  <g>
    <rect x={x - 90} y={620} width={180} height={260} rx={30} fill="#FFFFFF" stroke={color} strokeWidth={6} />
    <rect x={x - 40} y={580} width={80} height={50} rx={10} fill={color} />
    <Molecule x={x} y={760} s={0.7} flip={flip} ring={color} />
  </g>
);
const Scene04 = ({frame, fps}: SceneProps) => {
  const glove = cueAt('s04-02') * fps, drug = cueAt('s04-03') * fps;
  const fitL = progress(frame, glove + 20, glove + 40), fitR = progress(frame, glove + 55, glove + 75);
  return (
    <div>
      {frame < glove && (
        <>
          <Svg><Bottle x={CX - 200} color={MOL.L} flip={1} /><Bottle x={CX + 200} color={MOL.R} flip={-1} /></Svg>
          <Label text="留兰香味" x={CX - 200} y={900} color={MOL.L} frame={frame} at={10} w={240} />
          <Label text="葛缕子味" x={CX + 200} y={900} color={MOL.R} frame={frame} at={20} w={240} />
          <Note text="香芹酮的一对镜像分子" top={1000} frame={frame} at={20} />
        </>
      )}
      {frame >= glove && (
        <>
          <Svg>
            <Hand x={CX - 200} y={780} s={1.15} color="#1F9D6B" outline />
            <Hand x={CX + 200} y={780} s={1.15} color="#1F9D6B" outline />
            <Hand x={CX - 200} y={780 + (1 - fitL) * 260} s={1.15} color={MOL.L} dim={0.9} />
            <Hand x={CX + 200} y={780 + (1 - fitR) * 260} s={1.15} flip={-1} color={MOL.R} dim={0.9} />
          </Svg>
          <Label text="受体（手套）" x={CX} y={480} color={YES} frame={frame} at={glove} w={300} size={34} />
          {fitL > 0.95 && <Label text="合适 ✓" x={CX - 200} y={1000} color={YES} frame={frame} at={glove + 40} w={180} />}
          {fitR > 0.95 && <Label text="套不进 ✕" x={CX + 200} y={1000} color={NO} frame={frame} at={glove + 75} w={200} />}
        </>
      )}
      {frame >= drug && <Banner frame={frame} at={drug} top={1150} text="药物：左手版、右手版作用可能不同" size={38} />}
    </div>
  );
};

// ---------- 05 抛硬币与 ee ----------
const Scene05 = ({frame, fps}: SceneProps) => {
  const formula = cueAt('s05-02') * fps, example = cueAt('s05-03', 0.1) * fps;
  const L = frame >= example ? EE_EXAMPLE.L : 50;
  const ee = eeOf(L, 100 - L);
  return (
    <div>
      <Svg>
        <Dots x={CX - 285} y={500} n={L} color={MOL.L} cols={20} r={11} gap={30} />
        {/* 右手点接在左手点之后 */}
        {Array.from({length: 100 - L}).map((_, i) => {
          const k = L + i;
          return <circle key={i} cx={CX - 285 + (k % 20) * 30} cy={500 + Math.floor(k / 20) * 30} r={11} fill={MOL.R} stroke="rgba(0,0,0,0.25)" strokeWidth={2} />;
        })}
      </Svg>
      <div data-safe style={{position: 'absolute', left: CX - 330, width: 660, top: 670, display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT, fontSize: 40, fontWeight: 900}}>
        <span style={{color: MOL.L}}>左手 {L}</span><span style={{color: MOL.R}}>右手 {100 - L}</span>
      </div>
      {frame < formula && <Label text="像抛硬币：50 ∶ 50" x={CX} y={780} color={MUTED} frame={frame} at={8} w={420} />}
      {frame >= formula && (
        <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, top: 780, boxSizing: 'border-box', textAlign: 'center',
          background: '#FFFFFF', border: `4px solid ${GOLD}`, borderRadius: 26, padding: '16px 10px', fontFamily: FONT, fontSize: 42,
          fontWeight: 900, color: INK, ...enter(frame, formula)}}>ee =（多的 − 少的）÷ 总数</div>
      )}
      {frame >= example && (
        <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, top: 900, textAlign: 'center', fontFamily: FONT,
          fontSize: 44, fontWeight: 900, color: MOL.L, ...enter(frame, example + 10)}}>
          （{EE_EXAMPLE.L} − {EE_EXAMPLE.R}）÷ 100 = {Math.round(ee * 100)}%
        </div>
      )}
    </div>
  );
};

// ---------- 06/07 催化剂与卡根曲线 ----------
const Graph: React.FC<{frame: number; lineAt: number; curveAt: number; markAt: number}> = ({frame, lineAt, curveAt, markAt}) => {
  const gx = CX - 300, gy = 520, gw = 600, gh = 520;
  const px = (e: number) => gx + e * gw, py = (e: number) => gy + gh - e * gh;
  const line = progress(frame, lineAt, lineAt + 25), curve = progress(frame, curveAt, curveAt + 40);
  const pts = Array.from({length: 61}, (_, i) => i / 60).filter(e => e <= curve);
  const path = pts.map((e, i) => `${i ? 'L' : 'M'}${px(e).toFixed(1)},${py(productEe(e)).toFixed(1)}`).join(' ');
  const mx = px(CAT_EE), my = py(productEe(CAT_EE)), ly = py(CAT_EE);
  return (
    <>
      <Svg>
        <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke={INK} strokeWidth={5} />
        <line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke={INK} strokeWidth={5} />
        {line > 0 && <line x1={px(0)} y1={py(0)} x2={px(line)} y2={py(line)} stroke={MUTED} strokeWidth={6} strokeDasharray="14 10" />}
        {curve > 0 && <path d={path} stroke={MOL.L} strokeWidth={9} fill="none" strokeLinecap="round" />}
        {frame >= markAt && (
          <g opacity={progress(frame, markAt, markAt + 10)}>
            <line x1={mx} y1={gy + gh} x2={mx} y2={my} stroke={GOLD} strokeWidth={4} strokeDasharray="8 6" />
            <circle cx={mx} cy={ly} r={12} fill="#fff" stroke={MUTED} strokeWidth={5} />
            <circle cx={mx} cy={my} r={14} fill="#fff" stroke={MOL.L} strokeWidth={6} />
          </g>
        )}
      </Svg>
      <div data-safe style={{position: 'absolute', left: gx, top: gy + gh + 12, width: gw, textAlign: 'center', fontFamily: FONT, fontSize: 32,
        fontWeight: 800, color: INK}}>催化剂的 ee →</div>
      <div data-safe style={{position: 'absolute', left: gx + 14, top: gy - 8, width: 260, fontFamily: FONT, fontSize: 32, fontWeight: 800,
        color: INK}}>↑ 产物的 ee</div>
      {line > 0.9 && <div data-safe style={{position: 'absolute', left: px(0.6), top: py(0.6) + 20, width: 230, fontFamily: FONT, fontSize: 30,
        fontWeight: 800, color: MUTED}}>按常理：成正比</div>}
      {frame >= markAt && <div data-safe style={{position: 'absolute', left: mx + 20, top: my - 70, width: 300, fontFamily: FONT, fontSize: 32,
        fontWeight: 900, color: MOL.L, ...enter(frame, markAt)}}>40% → 约{Math.round(productEe(CAT_EE) * 100)}%</div>}
    </>
  );
};
const Scene06 = ({frame, fps}: SceneProps) => {
  const graph = cueAt('s06-02') * fps;
  return (
    <div>
      {frame < graph && (
        <>
          <Svg>
            <Hand x={CX - 220} y={760} s={1.1} color={MOL.L} outline />
            <Molecule x={CX - 220} y={780} s={0.55} ring={MOL.L} />
            {[0, 1, 2].map(i => (
              <g key={i} opacity={progress(frame, 20 + i * 15, 30 + i * 15)}>
                <Molecule x={CX + 120 + i * 120} y={760 + (i % 2) * 90} s={0.5} ring={MOL.L} />
              </g>
            ))}
            <path d={`M${CX - 60},770 L${CX + 30},770 M${CX + 10},752 L${CX + 40},770 L${CX + 10},788`} stroke={GOLD} strokeWidth={8}
              fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Label text={'手性催化剂\n“左手模具”'} x={CX - 220} y={950} color={MOL.L} frame={frame} at={6} w={300} size={34} />
          <Label text="多造左手产物" x={CX + 240} y={950} color={MOL.L} frame={frame} at={40} w={260} size={34} />
        </>
      )}
      {frame >= graph && <Graph frame={frame} lineAt={graph + 5} curveAt={1e9} markAt={1e9} />}
    </div>
  );
};
const Scene07 = ({frame, fps}: SceneProps) => {
  const curve = cueAt('s07-01', 0.4) * fps, mark = cueAt('s07-02', 0.2) * fps;
  return (
    <div>
      <Graph frame={frame} lineAt={-30} curveAt={curve} markAt={mark} />
      {frame >= mark && <Note text="示意曲线：ML₂ 模型，一左一右的组合不干活" top={1150} frame={frame} at={mark + 15} />}
    </div>
  );
};

// ---------- 08 配对罢工 ----------
const Scene08 = ({frame, fps}: SceneProps) => {
  const pairAt = cueAt('s08-01', 0.3) * fps, strike = cueAt('s08-02', 0.4) * fps, sum = cueAt('s08-03', 0.3) * fps;
  const p = progress(frame, pairAt, pairAt + 35), dead = progress(frame, strike, strike + 15);
  // 10 对：LL ×5、RR ×1、LR ×4，排成两行
  const kinds = [...Array(PAIRS.LL).fill('LL'), ...Array(PAIRS.RR).fill('RR'), ...Array(PAIRS.LR).fill('LR')] as ('LL' | 'RR' | 'LR')[];
  const singles: {hand: 'L' | 'R'; pair: number; slot: number}[] = [];
  kinds.forEach((k, i) => { singles.push({hand: k[0] as 'L' | 'R', pair: i, slot: 0}, {hand: k[1] as 'L' | 'R', pair: i, slot: 1}); });
  return (
    <div>
      <Svg>
        {singles.map((m, i) => {
          const sx = SAFE.x0 + 60 + (i % 7) * 120 + (random(`s${i}`) - 0.5) * 20, sy = 560 + Math.floor(i / 7) * 130;
          const px = SAFE.x0 + 70 + (m.pair % 5) * 168 + m.slot * 62, py = 640 + Math.floor(m.pair / 5) * 230;
          const x = sx + (px - sx) * p, y = sy + (py - sy) * p;
          const isDead = kinds[m.pair] === 'LR';
          return <Molecule key={i} x={x} y={y} s={0.38} flip={m.hand === 'L' ? 1 : -1}
            ring={isDead && dead > 0.5 ? MOL.dead : m.hand === 'L' ? MOL.L : MOL.R} dim={isDead ? 1 - 0.55 * dead : 1} />;
        })}
        {p > 0.95 && kinds.map((k, i) => {
          const x = SAFE.x0 + 101 + (i % 5) * 168, y = 640 + Math.floor(i / 5) * 230;
          return <rect key={i} x={x - 70} y={y - 60} width={140} height={120} rx={20} fill="none"
            stroke={k === 'LR' && dead > 0.5 ? MOL.dead : k === 'LL' ? MOL.L : k === 'RR' ? MOL.R : INK} strokeWidth={4} strokeDasharray="10 8" />;
        })}
      </Svg>
      <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 470, textAlign: 'center', fontFamily: FONT,
        fontSize: 36, fontWeight: 900, color: INK}}>催化剂：<span style={{color: MOL.L}}>左 {CAT.L}</span> · <span style={{color: MOL.R}}>右 {CAT.R}</span>（ee {Math.round(CAT_EE * 100)}%）</div>
      {frame >= strike && <Label text="一左一右：罢工" x={CX + 170} y={1000} color={MUTED} frame={frame} at={strike + 10} w={300} size={34} />}
      {frame >= sum && <Banner frame={frame} at={sum} top={1110} tone={MOL.L}
        text={<>干活的：<span style={{color: MOL.L}}>左左 {PAIRS.LL} 对</span> vs <span style={{color: MOL.R}}>右右 {PAIRS.RR} 对</span>{'\n'}产物 ee ≈ {Math.round(PAIR_EE * 100)}%</>} />}
    </div>
  );
};

// ---------- 09 预告 ----------
const Scene09 = ({frame, fps}: SceneProps) => {
  const next = cueAt('s09-02') * fps;
  const r = (frame % 60) / 60;
  return (
    <div>
      <Svg>
        <Molecule x={CX} y={760} s={1.1} ring={MOL.L} />
        <path d={`M${CX + 130},700 A160,160 0 1,1 ${CX + 120},840`} stroke={GOLD} strokeWidth={8} fill="none" strokeDasharray="20 14"
          strokeDashoffset={-r * 68} />
      </Svg>
      <Label text="产物自己当催化剂？" x={CX} y={500} color={GOLD} frame={frame} at={6} w={420} />
      {frame >= next && <Banner frame={frame} at={next} top={1100} tone="#F2B632" text={'下集：硖合宪三的“自我复制”反应\n点关注，别错过'} />}
    </div>
  );
};

const SCENES = {'01': Scene01, '02': Scene02, '03': Scene03, '04': Scene04, '05': Scene05, '06': Scene06, '07': Scene07, '08': Scene08, '09': Scene09};

export const ChiralEp1Video: React.FC<{debugAudit?: boolean; showSafeArea?: boolean}> = props => (
  <EpisodeShell rt={RT} content={content} scenes={SCENES} tag="诺奖解读 · 上集" background={<LabPaper />} {...props} />
);

export const ChiralEp1Cover: React.FC = () => (
  <div style={{position: 'absolute', inset: 0}}>
    <LabPaper />
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 168, display: 'flex', justifyContent: 'space-between',
      fontFamily: FONT, fontSize: 32, fontWeight: 800, color: MUTED}}><span>{content.brand}</span><span>诺奖解读 · 上集</span></div>
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 220, textAlign: 'center', fontFamily: FONT, fontSize: 96,
      lineHeight: 1.1, fontWeight: 900, color: INK, whiteSpace: 'pre-line'}}>{content.title}</div>
    <Svg>
      <line x1={CX} y1={560} x2={CX} y2={1040} stroke={MUTED} strokeWidth={4} strokeDasharray="14 10" />
      <Hand x={CX - 200} y={820} s={1.2} color={MOL.L} /><Hand x={CX + 200} y={820} s={1.2} flip={-1} color={MOL.R} />
    </Svg>
    <Banner frame={30} at={0} top={1120} tone="#F2B632" text={content.coverSubtitle} />
  </div>
);
