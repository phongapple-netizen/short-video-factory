import React from 'react';
import {interpolate} from 'remotion';
import {FONT, progress} from '../../kits/rod-board';
import {Dots, MOL, Molecule} from '../../kits/molecule';
import {Banner, CX, EpisodeShell, H, LabPaper, Label, SAFE, W, enter, makeCueAt, type Runtime, type SceneProps} from '../../kits/episode-shell';
import {COPY, MILLION, MILLION_EE, SOAI, TOY, eeOf} from './model';
import content from './content.json';
import runtime from './runtime.json';

// 下集：只多 1 个 → 回顾 ee → 自催化 → 单纯复制比例不变 → 异手配对罢工（逐轮计数）→ 2003 年真实数据 → 意义。

const RT = runtime as unknown as Runtime;
const cueAt = makeCueAt(RT, 'ChiralEp2');
const INK = '#1E2A36', MUTED = '#5D6B74', GOLD = '#B87A00', NO = '#D64545';
const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (e: number) => `${(e * 100).toFixed(e < 0.1 ? 1 : 0)}%`;
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>{children}</svg>
);
const Note: React.FC<{text: string; top: number; frame: number; at: number}> = ({text, top, frame, at}) => (
  <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top, textAlign: 'center', fontFamily: FONT,
    fontSize: 30, fontWeight: 600, color: MUTED, opacity: progress(frame, at, at + 10)}}>{text}</div>
);
const Count: React.FC<{L: React.ReactNode; R: React.ReactNode; top: number; size?: number}> = ({L, R, top, size = 44}) => (
  <div data-safe style={{position: 'absolute', left: CX - 380, width: 760, top, display: 'flex', justifyContent: 'space-between',
    fontFamily: FONT, fontSize: size, fontWeight: 900, fontVariantNumeric: 'tabular-nums'}}>
    <span style={{color: MOL.L}}>左 {L}</span><span style={{color: MOL.R}}>右 {R}</span>
  </div>
);

// ---------- 01 钩子 ----------
const Scene01 = ({frame, fps}: SceneProps) => {
  const jump = cueAt('s01-02', 0.1) * fps;
  const step = Math.min(3, Math.max(0, Math.floor(interpolate(frame, [jump, jump + 60], [0, 3.999], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))));
  const share = (1 + SOAI[step].ee) / 2;
  return (
    <div>
      <Svg>
        <rect x={CX - 380} y={560} width={760 * share} height={90} rx={18} fill={MOL.L} />
        <rect x={CX - 380 + 760 * share} y={560} width={760 * (1 - share)} height={90} rx={18} fill={MOL.R} />
        <line x1={CX} y1={540} x2={CX} y2={670} stroke={INK} strokeWidth={4} strokeDasharray="8 6" />
      </Svg>
      <Count L={step === 0 ? fmt(MILLION.L) : `${Math.round(share * 100)}%`} R={step === 0 ? fmt(MILLION.R) : `${Math.round((1 - share) * 100)}%`} top={680} />
      <Label text={step === 0 ? '起点：左边只多 1 个' : `第${step}轮：ee ${SOAI[step].label}`} x={CX} y={790} color={step === 0 ? MUTED : MOL.L}
        frame={frame} at={step === 0 ? -20 : jump + (step - 1) * 20} w={460} />
      {frame >= jump + 70 && <Banner frame={frame} at={jump + 70} top={1120} tone="#F2B632" text="硖合反应（2026 诺贝尔化学奖）" />}
    </div>
  );
};

// ---------- 02 回顾 ----------
const Scene02 = ({frame, fps}: SceneProps) => {
  const calc = cueAt('s02-02') * fps;
  return (
    <div>
      <Svg>
        <Molecule x={CX - 200} y={640} s={0.9} ring={MOL.L} />
        <line x1={CX} y1={530} x2={CX} y2={760} stroke={MUTED} strokeWidth={4} strokeDasharray="12 8" />
        <Molecule x={CX + 200} y={640} s={0.9} flip={-1} ring={MOL.R} />
      </Svg>
      <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, top: 800, boxSizing: 'border-box', textAlign: 'center',
        background: '#FFFFFF', border: `4px solid ${GOLD}`, borderRadius: 26, padding: '14px 10px', fontFamily: FONT, fontSize: 42,
        fontWeight: 900, color: INK, ...enter(frame, 10)}}>ee =（多的 − 少的）÷ 总数</div>
      {frame >= calc && (
        <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, top: 930, textAlign: 'center', fontFamily: FONT, fontSize: 38,
          fontWeight: 900, color: MOL.L, lineHeight: 1.4, ...enter(frame, calc)}}>
          1 ÷ {fmt(MILLION.L + MILLION.R)}{'\n'}≈ {(MILLION_EE * 100).toFixed(5)}%
        </div>
      )}
    </div>
  );
};

// ---------- 03 自催化 ----------
const Scene03 = ({frame, fps}: SceneProps) => {
  const copy = cueAt('s03-01', 0.5) * fps, both = cueAt('s03-02') * fps;
  const c = progress(frame, copy, copy + 25);
  const Pair = ({x, flip, color}: {x: number; flip: number; color: string}) => (
    <>
      <Molecule x={x} y={640} s={0.75} flip={flip} ring={color} />
      <g opacity={c}><Molecule x={x - 80} y={880} s={0.6} flip={flip} ring={color} /><Molecule x={x + 80} y={880} s={0.6} flip={flip} ring={color} /></g>
      <path d={`M${x},720 L${x},790 M${x - 18},772 L${x},796 L${x + 18},772`} stroke={GOLD} strokeWidth={7} fill="none" opacity={c} strokeLinecap="round" />
    </>
  );
  return (
    <div>
      <Svg>
        <Pair x={frame >= both ? CX - 200 : CX} flip={1} color={MOL.L} />
        {frame >= both && <g opacity={progress(frame, both, both + 12)}><Pair x={CX + 200} flip={-1} color={MOL.R} /></g>}
      </Svg>
      <Label text="产物 = 催化剂" x={CX} y={480} color={GOLD} frame={frame} at={copy - 10} w={320} />
      {frame >= both && <Banner frame={frame} at={both + 10} top={1060} text={'左手造左手，右手造右手'} />}
    </div>
  );
};

// ---------- 04 单纯复制：比例不变 ----------
const Scene04 = ({frame, fps}: SceneProps) => {
  const dbl = cueAt('s04-02', 0.25) * fps;
  const done = frame >= dbl;
  const n = done ? COPY.after : COPY.before;
  return (
    <div>
      <Svg>
        <Dots x={CX - 375} y={500} n={n.L} color={MOL.L} cols={done ? 13 : 9} r={done ? 10 : 13} gap={done ? 28 : 38} />
        <Dots x={CX + 20} y={500} n={n.R} color={MOL.R} cols={done ? 13 : 9} r={done ? 10 : 13} gap={done ? 28 : 38} />
      </Svg>
      <Count L={n.L} R={n.R} top={760} />
      <Label text={`ee ${pct(eeOf(n.L, n.R))}`} x={CX} y={850} color={MUTED} frame={frame} at={-20} w={240} />
      {done && <Label text="翻倍后比例没变 ✕" x={CX} y={960} color={NO} frame={frame} at={dbl + 15} w={380} />}
    </div>
  );
};

// ---------- 05 异手配对：逐轮计数（简化示意） ----------
const Scene05 = ({frame, fps}: SceneProps) => {
  const start = cueAt('s05-01', 0.6) * fps, end = cueAt('s05-03', 0.8) * fps;
  const per = Math.max(30, (end - start) / (TOY.length - 1));
  const k = Math.min(TOY.length - 1, Math.max(0, Math.floor((frame - start) / per) + 1));
  const phase = frame < start ? 0 : ((frame - start) % per) / per; // 0..0.5 翻倍，0.5..1 配对
  const r = TOY[k], prev = TOY[Math.max(0, k - 1)];
  const showDouble = frame >= start && phase < 0.5;
  const L = frame < start ? TOY[0].L : showDouble ? r.doubled.L : r.L;
  const R = frame < start ? TOY[0].R : showDouble ? r.doubled.R : r.R;
  return (
    <div>
      <Svg>
        <Dots x={CX - 375} y={500} n={Math.min(L, 104)} color={MOL.L} cols={13} r={10} gap={28} />
        <Dots x={CX + 20} y={500} n={Math.min(R, 104)} color={MOL.R} cols={13} r={10} gap={28} />
      </Svg>
      <Count L={L} R={R} top={760} size={40} />
      <div data-safe style={{position: 'absolute', left: CX - 380, width: 760, top: 830, display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT, fontSize: 36, fontWeight: 900, color: INK}}>
        <span>{frame < start ? '起点' : `第${k}轮 · ${showDouble ? '翻倍' : `配对罢工 ${r.paired} 对`}`}</span>
        <span style={{color: MOL.L}}>ee {pct(frame < start ? TOY[0].ee : showDouble ? prev.ee : r.ee)}</span>
      </div>
      <div data-safe style={{position: 'absolute', left: CX - 380, width: 760, top: 900, textAlign: 'center', fontFamily: FONT, fontSize: 36,
        fontWeight: 800, color: GOLD, ...enter(frame, cueAt('s05-02', 0.4) * fps)}}>左右之差：{TOY[0].L - TOY[0].R} → {r.L - r.R}，只翻倍、不抵消</div>
      <Note text="简化示意：每轮先翻倍，再让八成少数派配对罢工" top={1150} frame={frame} at={start} />
    </div>
  );
};

// ---------- 06 真实数据 ----------
const Scene06 = ({frame, fps}: SceneProps) => {
  const bars = cueAt('s06-01') * fps;
  return (
    <div>
      <div style={{position: 'absolute', left: CX - 380, top: 520, width: 760}}>
        {SOAI.map((r, i) => {
          const at = bars + (i === 0 ? 0 : cueAt('s06-02', (i - 1) * 0.3) * fps - bars);
          const w = Math.max(6, r.ee * 500) * progress(frame, at, at + 18);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, height: 120, ...enter(frame, at)}}>
              <div data-safe style={{width: 130, fontFamily: FONT, fontSize: 38, fontWeight: 900, color: INK}}>{i === 0 ? '起点' : `第${i}轮`}</div>
              <div style={{width: w, height: 56, borderRadius: 14, background: MOL.L}} />
              <div data-safe style={{fontFamily: FONT, fontSize: 40, fontWeight: 900, color: MOL.L, whiteSpace: 'nowrap'}}>{r.label}</div>
            </div>
          );
        })}
      </div>
      <Note text="数据：Sato、Soai 等，2003 年（对映体过量 ee）" top={1040} frame={frame} at={bars + 20} />
    </div>
  );
};

// ---------- 07 意义 ----------
const Scene07 = ({frame, fps}: SceneProps) => {
  const life = cueAt('s07-02') * fps, ask = cueAt('s07-03') * fps;
  return (
    <div>
      {frame < life && (
        <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, top: 640, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontFamily: FONT, fontSize: 42, fontWeight: 900, color: INK, ...enter(frame, 10)}}>
          <span>一点偏差</span><span style={{color: GOLD}}>→ 自己放大 →</span><span>几乎全部</span>
        </div>
      )}
      {frame >= life && (
        <>
          <Svg>
            {Array.from({length: 5}).map((_, i) => (
              <Molecule key={i} x={SAFE.x0 + 90 + i * 170} y={620} s={0.6} ring={MOL.L} dim={progress(frame, life + i * 5, life + 10 + i * 5)} />
            ))}
          </Svg>
          <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 720, textAlign: 'center', fontFamily: FONT,
            fontSize: 38, fontWeight: 900, color: MOL.L, ...enter(frame, life + 10)}}>蛋白质里的氨基酸：几乎都是 L 型</div>
          <Note text="一种可能的解释，生命单一手性的起源仍在研究中" top={800} frame={frame} at={life + 25} />
        </>
      )}
      {frame >= ask && <Banner frame={frame} at={ask} top={1100} tone="#F2B632" text="最初那一点偏差从哪来？评论区聊聊" />}
    </div>
  );
};

const SCENES = {'01': Scene01, '02': Scene02, '03': Scene03, '04': Scene04, '05': Scene05, '06': Scene06, '07': Scene07};

export const ChiralEp2Video: React.FC<{debugAudit?: boolean; showSafeArea?: boolean}> = props => (
  <EpisodeShell rt={RT} content={content} scenes={SCENES} tag="诺奖解读 · 下集" background={<LabPaper />} {...props} />
);

export const ChiralEp2Cover: React.FC = () => (
  <div style={{position: 'absolute', inset: 0}}>
    <LabPaper />
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 168, display: 'flex', justifyContent: 'space-between',
      fontFamily: FONT, fontSize: 32, fontWeight: 800, color: MUTED}}><span>{content.brand}</span><span>诺奖解读 · 下集</span></div>
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 220, textAlign: 'center', fontFamily: FONT, fontSize: 96,
      lineHeight: 1.1, fontWeight: 900, color: INK, whiteSpace: 'pre-line'}}>{content.title}</div>
    <Svg>
      <rect x={CX - 380} y={600} width={760 * 0.9975} height={90} rx={18} fill={MOL.L} />
      <rect x={CX - 380 + 760 * 0.9975} y={600} width={760 * 0.0025} height={90} rx={18} fill={MOL.R} />
    </Svg>
    <div style={{position: 'absolute', left: CX - 380, width: 760, top: 720, textAlign: 'center', fontFamily: FONT, fontSize: 48, fontWeight: 900,
      color: MOL.L}}>0.00005% → 99.5%</div>
    <Banner frame={30} at={0} top={1120} tone="#F2B632" text={content.coverSubtitle} />
  </div>
);
