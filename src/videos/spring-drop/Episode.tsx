import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SAFE as PROFILE_SAFE} from '../../shared/profile';
import {useFrameAudit} from '../../shared/story';
import {P, DROP_A, DROP_B, LAG_A, LAG_B, ballAt, nodeAt, cmAt} from './model';
import content from './content.json';
import runtime from './runtime.json';

// 三个弹簧球：选择题钩子→直觉→实拍感下落→400倍慢放悬停→重心曲线→理想模型D与真实弹簧C、B、A→彩虹圈彩蛋。
// 所有位移、悬停时间、落地差都来自 model.ts 的离散弹簧模拟；动作时刻挂在字幕 cue 上。

const FONT = "'Noto Sans CJK SC','Noto Sans SC',sans-serif";
const W = 1080, H = 1920;
const SAFE = {x0: PROFILE_SAFE.left + 15, x1: PROFILE_SAFE.right - 15, y0: PROFILE_SAFE.top, y1: PROFILE_SAFE.bottom};
const CX = (SAFE.x0 + SAFE.x1) / 2;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const NUM = {fontVariantNumeric: 'tabular-nums'} as const;
const K = {
  bg: '#F4F1EA', wall: '#E9E3D6', ink: '#1E2A36', muted: '#5B6670', paper: '#FFFFFF', wood: '#8A5A33', woodDark: '#6B4324',
  steel: '#7D8790', rope: '#C8B48A', ball: '#23272B', accent: '#E8742E', gold: '#B87A00', yes: '#1F9D6B', no: '#D64545',
  a: '#E8742E', b: '#2F7BD9', c: '#1F9D6B',
};
const SIDES = {left: SAFE.x0, width: SAFE.x1 - SAFE.x0, boxSizing: 'border-box'} as const;
const SLOW = content.model.slowMotion;

// 口播里的数字必须与模型一致
const HOVER_MS = Math.round(DROP_A.hover * 1000);
const LAG_A_MS = (LAG_A * 1000).toFixed(2), LAG_B_MS = (LAG_B * 1000).toFixed(2);
if (HOVER_MS !== 16 || LAG_A_MS !== '0.25' || LAG_B_MS !== '0.06' || SLOW !== 400)
  throw new Error(`[SpringDrop] 口播数字与模型不一致: ${HOVER_MS} ${LAG_A_MS} ${LAG_B_MS}`);
if (!(LAG_A > LAG_B && LAG_B > 0)) throw new Error('[SpringDrop] 真实弹簧的落地顺序应为 C、B、A');

type Cue = {id: string; scene: string; start: number; end: number; text: string; audio?: string | null};
type Rt = {scenes: {id: string; start: number; end: number}[]; durationInFrames: number; captions: Cue[]};
const RT = runtime as unknown as Rt;
const cueAt = (id: string, frac = 0): number => {
  const cue = RT.captions.find(c => c.id === id);
  if (!cue) throw new Error(`SpringDrop missing cue ${id}`);
  const scene = RT.scenes.find(s => s.id === cue.scene)!;
  return cue.start - scene.start + frac * (cue.end - cue.start);
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (frame: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(frame, [a, Math.max(a + 1, b)], [from, to], {...clamp, easing: EASE});
const enter = (frame: number, at: number) => ({
  opacity: ramp(frame, at, at + 12), transform: `translateY(${ramp(frame, at, at + 12, 20, 0)}px)`,
});
const pop = (frame: number, at: number) => {
  const s = spring({frame: frame - at, fps: 30, config: {damping: 10, stiffness: 170}});
  return {opacity: ramp(frame, at, at + 5), transform: `scale(${Math.max(0.01, s)})`};
};

// ---------- 通用部件 ----------
const Backdrop = () => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: K.bg}}>
    <div style={{position: 'absolute', left: 0, top: 1290, width: W, height: 630, background: K.wall}} />
    <div style={{position: 'absolute', left: 0, top: 1286, width: W, height: 8, background: K.woodDark, opacity: 0.6}} />
  </div>
);

const Tag = () => (
  <div data-safe style={{position: 'absolute', ...SIDES, top: 168, display: 'flex', justifyContent: 'space-between',
    fontFamily: FONT, fontSize: 32, fontWeight: 700, color: K.muted}}>
    <span>{content.brand}</span><span>物理易错题</span>
  </div>
);

const Title = ({text, frame, size = 88, still = false}: {text: React.ReactNode; frame: number; size?: number; still?: boolean}) => (
  <div data-safe data-title style={{position: 'absolute', ...SIDES, top: 220, textAlign: 'center',
    fontFamily: FONT, fontSize: size, lineHeight: 1.15, fontWeight: 900, color: K.ink, whiteSpace: 'pre-line',
    ...(still ? {} : enter(frame, -5))}}>
    {text}
  </div>
);

const Banner = ({text, frame, at, top, tone = 'paper', size = 42}:
  {text: React.ReactNode; frame: number; at: number; top: number; tone?: 'paper' | 'gold' | 'yes' | 'no'; size?: number}) => {
  const border = {paper: K.ink, gold: '#F2B632', yes: K.yes, no: K.no}[tone];
  return (
    <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, boxSizing: 'border-box', top, textAlign: 'center',
      background: K.paper, border: `4px solid ${border}`, borderRadius: 26, padding: '14px 16px', whiteSpace: 'pre-line',
      fontFamily: FONT, fontSize: size, fontWeight: 800, lineHeight: 1.3, color: tone === 'yes' || tone === 'no' ? border : K.ink,
      ...NUM, ...enter(frame, at)}}>
      {text}
    </div>
  );
};

/** 竖直弹簧：y1 上端，y2 下端，coils 圈数 */
const Spring = ({x, y1, y2, coils = 14, width = 50, color = K.steel, stroke = 5}:
  {x: number; y1: number; y2: number; coils?: number; width?: number; color?: string; stroke?: number}) => {
  const pts: string[] = [`M${x},${y1}`];
  const lead = Math.min(14, (y2 - y1) * 0.08), body = y2 - y1 - 2 * lead;
  pts.push(`L${x},${y1 + lead}`);
  for (let i = 0; i < coils * 2; i++) pts.push(`L${x + (i % 2 ? -width / 2 : width / 2)},${y1 + lead + (body * (i + 0.5)) / (coils * 2)}`);
  pts.push(`L${x},${y2 - lead}`, `L${x},${y2}`);
  return <path d={pts.join(' ')} stroke={color} strokeWidth={stroke} fill="none" strokeLinejoin="round" />;
};

const Ball = ({x, y, r = 58, label, color}: {x: number; y: number; r?: number; label: string; color: string}) => (
  <>
    <svg style={{position: 'absolute', left: x - r - 6, top: y - r - 6}} width={2 * r + 12} height={2 * r + 12}>
      <circle cx={r + 6} cy={r + 6} r={r} fill={K.ball} stroke={color} strokeWidth={6} />
      <ellipse cx={r - r * 0.25} cy={r - r * 0.3} rx={r * 0.28} ry={r * 0.18} fill="#fff" opacity={0.25} />
    </svg>
    <div data-safe style={{position: 'absolute', left: x - 40, top: y - 36, width: 80, textAlign: 'center',
      fontFamily: FONT, fontSize: Math.round(r * 0.95), lineHeight: '72px', fontWeight: 900, color: '#fff'}}>{label}</div>
  </>
);

const Scissors = ({x, y, frame, at, snip}: {x: number; y: number; frame: number; at: number; snip: number}) => {
  const close = ramp(frame, snip, snip + 4) - ramp(frame, snip + 6, snip + 12);
  const open = 22 * (1 - close);
  return (
    <svg style={{position: 'absolute', left: x - 70, top: y - 40, ...pop(frame, at), opacity: pop(frame, at).opacity * (1 - ramp(frame, snip + 12, snip + 24))}} width={110} height={80} viewBox="0 0 110 80" overflow="visible">
      <g transform={`rotate(${-open} 55 40)`}><path d="M55,40 L108,34" stroke={K.ink} strokeWidth={6} strokeLinecap="round" /><circle cx={30} cy={52} r={14} fill="none" stroke={K.accent} strokeWidth={7} /><line x1={42} y1={46} x2={55} y2={40} stroke={K.ink} strokeWidth={6} /></g>
      <g transform={`rotate(${open} 55 40)`}><path d="M55,40 L108,46" stroke={K.ink} strokeWidth={6} strokeLinecap="round" /><circle cx={30} cy={28} r={14} fill="none" stroke={K.accent} strokeWidth={7} /><line x1={42} y1={34} x2={55} y2={40} stroke={K.ink} strokeWidth={6} /></g>
      {frame >= snip && frame < snip + 10 && <text x={90} y={10} fontFamily={FONT} fontSize={30} fontWeight={900} fill={K.accent}>咔</text>}
    </svg>
  );
};

// ---------- 三套装置（第1、2镜），px/m 由下落高度决定 ----------
const BAR_Y = 460, HANG_Y = 900, R = 58, FLOOR = 1290;
const X = {A: 230, B: 495, C: 760};
const PX = (FLOOR - R - HANG_Y) / P.h; // 每米像素
const SPRING_TOP_A = 600, CUT = {A: 560, B: 650, C: 650};

const Rig = ({frame, cutAt = 1e9, simT = 0, swing = 0}: {frame: number; cutAt?: number; simT?: number; swing?: number}) => {
  const cut = frame >= cutAt;
  const dA = cut ? ballAt(DROP_A, simT) * PX : 0, dB = cut ? ballAt(DROP_B, simT) * PX : 0, dC = cut ? ballAt(null, simT) * PX : 0;
  const land = (d: number) => Math.min(d, FLOOR - R - HANG_Y);
  const yA = HANG_Y + land(dA), yB = HANG_Y + land(dB), yC = HANG_Y + land(dC);
  // 剪断后弹簧收缩到原长（随球下落）；A 的整根弹簧原长约 25 cm，按同一比例缩放
  const relaxA = cut ? Math.min(1, simT / DROP_A.hover) : 0, relaxB = cut ? Math.min(1, simT / DROP_B.hover) : 0;
  const lenA = (HANG_Y - R - SPRING_TOP_A) * (1 - 0.16 * relaxA);
  const lenB = (HANG_Y - R - CUT.B) * (1 - 0.16 * relaxB);
  const sway = Math.sin(frame / 18) * swing;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `rotate(${sway}deg)`, transformOrigin: `${CX}px ${BAR_Y}px`}}>
      <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
        {/* A：绳—弹簧—球 */}
        <line x1={X.A} y1={BAR_Y} x2={X.A} y2={cut ? CUT.A - 6 : SPRING_TOP_A} stroke={K.rope} strokeWidth={6} />
        {cut && <line x1={X.A} y1={yA - R - lenA - (SPRING_TOP_A - CUT.A - 6)} x2={X.A} y2={yA - R - lenA} stroke={K.rope} strokeWidth={6} />}
        <Spring x={X.A} y1={yA - R - lenA} y2={yA - R} coils={9} />
        {/* B：弹簧挂横杆，中间剪断 */}
        <Spring x={X.B} y1={BAR_Y} y2={cut ? CUT.B - 40 : CUT.B} coils={7} />
        <Spring x={X.B} y1={yB - R - lenB} y2={yB - R} coils={7} />
        {/* C：绳—球 */}
        <line x1={X.C} y1={BAR_Y} x2={X.C} y2={cut ? CUT.C - 6 : CUT.C} stroke={K.rope} strokeWidth={6} />
        <line x1={X.C} y1={yC - R - (HANG_Y - R - CUT.C - 6)} x2={X.C} y2={yC - R} stroke={K.rope} strokeWidth={6} />
        <rect x={130} y={BAR_Y - 30} width={730} height={34} rx={10} fill={K.wood} stroke={K.woodDark} strokeWidth={4} />
      </svg>
      <Ball x={X.A} y={yA} label="A" color={K.a} />
      <Ball x={X.B} y={yB} label="B" color={K.b} />
      <Ball x={X.C} y={yC} label="C" color={K.c} />
    </div>
  );
};

const OPTIONS = [['A', 'A先落地'], ['B', 'B先落地'], ['C', 'C先落地'], ['D', 'D同时落地']];
const Options = ({frame, at, highlight, think = -1}: {frame: number; at: number; highlight?: string; think?: number}) => (
  <div style={{position: 'absolute', left: CX - 400, top: 1120, width: 800, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
    {OPTIONS.map(([k, t], i) => {
      const lit = highlight === k || (think >= 0 && Math.floor((frame - think) / 8) % 4 === i && frame >= think);
      return (
        <div key={k} data-safe style={{background: lit ? '#FFF4D6' : K.paper, border: `4px solid ${lit ? '#F2B632' : K.ink}`, borderRadius: 22,
          padding: '8px 0', textAlign: 'center', fontFamily: FONT, fontSize: 36, fontWeight: 800, color: K.ink,
          ...enter(frame, at + i * 3), transform: `${enter(frame, at + i * 3).transform}${lit ? ' scale(1.05)' : ''}`}}>{t}</div>
      );
    })}
  </div>
);

// ---------- 01 钩子：选择题 ----------
const Scene01 = ({frame, fps}: {frame: number; fps: number}) => {
  const show = [0.05, 0.4, 0.75].map(f => cueAt('s01-02', f) * fps);
  const think = cueAt('s01-03') * fps;
  return (
    <div>
      <Title text={'三个铁球\n谁先落地？'} frame={0} size={96} still />
      <Rig frame={frame} swing={0.6} />
      <Scissors x={X.A} y={CUT.A} frame={frame} at={show[0]} snip={1e9} />
      <Scissors x={X.B} y={CUT.B} frame={frame} at={show[1]} snip={1e9} />
      <Scissors x={X.C} y={CUT.C} frame={frame} at={show[2]} snip={1e9} />
      {[['A', '剪绳'], ['B', '剪弹簧中间'], ['C', '剪绳']].map(([k, t], i) => frame >= show[i] && (
        <div key={k} data-safe style={{position: 'absolute', left: X[k as 'A'] - 110, top: 1000, width: 220, textAlign: 'center',
          fontFamily: FONT, fontSize: 32, fontWeight: 800, color: K.accent, ...enter(frame, show[i] + 4)}}>{t}</div>
      ))}
      <Options frame={frame} at={-20} think={think} />
    </div>
  );
};

// ---------- 02 直觉 + 慢放4倍的下落 ----------
const DROP_SLOW = 4;
const FREE_T = Math.sqrt((2 * P.h) / P.g);
const Scene02 = ({frame, fps}: {frame: number; fps: number}) => {
  const doubt = cueAt('s02-01') * fps, cut = cueAt('s02-02') * fps;
  const simT = Math.max(0, (frame - cut) / fps / DROP_SLOW);
  const landed = simT >= Math.max(DROP_A.landing, DROP_B.landing);
  return (
    <div>
      <Title text={'弹簧会\n拖后腿？'} frame={frame} />
      <Rig frame={frame} cutAt={cut} simT={simT} />
      {[X.A, X.B, X.C].map((x, i) => <Scissors key={i} x={x} y={Object.values(CUT)[i]} frame={frame} at={-20} snip={cut} />)}
      {frame >= doubt && frame < cut && [X.A, X.B].map(x => (
        <svg key={x} style={{position: 'absolute', left: x + 60, top: 700, ...pop(frame, doubt + 8)}} width={60} height={160}>
          <path d="M30,150 L30,30 M10,50 L30,20 L50,50" stroke={K.no} strokeWidth={8} fill="none" strokeLinecap="round" />
        </svg>
      ))}
      {frame >= doubt && frame < cut && <Banner frame={frame} at={doubt} top={1120} tone="no" size={40} text="弹簧还拉着球 → A、B慢一拍？" />}
      {frame >= cut && <div data-safe style={{position: 'absolute', left: SAFE.x1 - 220, top: 500, width: 220, textAlign: 'right',
        fontFamily: FONT, fontSize: 32, fontWeight: 800, color: K.muted}}>慢放{DROP_SLOW}倍</div>}
      {landed && [X.A, X.B, X.C].map(x => (
        <div key={x} style={{position: 'absolute', left: x - 90, top: FLOOR - 40, width: 180, height: 40, borderRadius: '50%',
          background: '#CBBFA8', opacity: 0.7 * (1 - ramp(frame, cut + fps * DROP_SLOW * FREE_T + 2, cut + fps * DROP_SLOW * FREE_T + 25))}} />
      ))}
      {landed && <Banner frame={frame} at={cut + fps * DROP_SLOW * FREE_T} top={560} tone="yes" text="咚！几乎同时落地" />}
    </div>
  );
};
// ---------- 03 400倍慢放：A悬停 ----------
const Z = 1500; // 每米像素（放大图）
const Scene03 = ({frame, fps}: {frame: number; fps: number}) => {
  const cut = (cueAt('s03-01') + 0.3) * fps, msgAt = cueAt('s03-02') * fps;
  const simT = Math.max(0, (frame - cut) / fps / SLOW);
  const N = P.N, top0 = 540, x = 380, cX = 760;
  // 静止时各节点位置（与模型同一初始条件：拉力 = 下方重量）
  const rest = Array.from({length: N + 1}, (_, i) => {
    let y = 0;
    for (let j = 0; j < i; j++) {
      const below = P.M + (P.ms / N) * (N - j - 0.5);
      y += P.L0 / N + (below * P.g) / (P.k * N);
    }
    return top0 + y * Z;
  });
  const nodes = rest.map((y, i) => y + nodeAt(DROP_A, i, simT) * Z);
  const ballY = nodes[N] + 70, cBall = rest[N] + 70 + ballAt(null, simT) * Z;
  const hovering = frame >= cut && simT < DROP_A.hover;
  const front = nodes.findIndex((y, i) => y - rest[i] < 0.0005 * Z);
  const path = nodes.map((y, i) => `${i ? 'L' : 'M'}${x + (i === 0 || i === N ? 0 : i % 2 ? -32 : 32)},${y}`).join(' ');
  return (
    <div>
      <Title text={'慢放400倍\nA竟然悬停'} frame={frame} />
      <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
        <line x1={x} y1={470} x2={x} y2={frame >= cut ? 505 : top0} stroke={K.rope} strokeWidth={6} />
        {frame >= cut && <line x1={x} y1={nodes[0] - 30} x2={x} y2={nodes[0]} stroke={K.rope} strokeWidth={6} />}
        <path d={path} stroke={K.steel} strokeWidth={5} fill="none" strokeLinejoin="round" />
        {frame >= msgAt && front > 0 && front <= N && (
          <circle cx={x} cy={nodes[front]} r={22} fill="#F2B632" opacity={0.55 + 0.3 * Math.sin(frame / 3)} />
        )}
        <line x1={cX} y1={470} x2={cX} y2={frame >= cut ? 505 : rest[N]} stroke={K.rope} strokeWidth={6} />
        {/* 地面参考线：球的初始高度 */}
        <line x1={230} y1={rest[N] + 70} x2={900} y2={rest[N] + 70} stroke={K.muted} strokeWidth={2} strokeDasharray="8 8" />
      </svg>
      <Ball x={x} y={ballY} r={70} label="A" color={K.a} />
      <Ball x={cX} y={cBall} r={70} label="C" color={K.c} />
      <div data-safe style={{position: 'absolute', left: 560, top: 620, width: 350, textAlign: 'right',
        fontFamily: FONT, fontSize: 48, fontWeight: 900, color: K.ink, ...NUM}}>t = {(simT * 1000).toFixed(1)} ms</div>
      {hovering && (
        <div data-safe style={{position: 'absolute', left: x - 140, top: ballY + 90, width: 280, textAlign: 'center',
          background: '#FFF4D6', border: '4px solid #F2B632', borderRadius: 22, padding: '6px 0',
          fontFamily: FONT, fontSize: 38, fontWeight: 900, color: K.ink, ...pop(frame, cut + 10)}}>悬停中…</div>
      )}
      {frame >= cut && !hovering && (
        <div data-safe style={{position: 'absolute', left: x - 140, top: ballY + 90, width: 280, textAlign: 'center',
          background: '#fff', border: `4px solid ${K.a}`, borderRadius: 22, padding: '6px 0',
          fontFamily: FONT, fontSize: 38, fontWeight: 900, color: K.a}}>开始下落！</div>
      )}
      {frame >= msgAt && <Banner frame={frame} at={msgAt + 10} top={1238} tone="gold" size={36}
        text={`收缩“消息”往下传：${HOVER_MS} ms 才到底`} />}
    </div>
  );
};

// ---------- 04 重心：位移-时间曲线 ----------
const Scene04 = ({frame, fps}: {frame: number; fps: number}) => {
  const a = cueAt('s04-01') * fps, b = cueAt('s04-02') * fps;
  const gx = 190, gy = 470, gw = 680, gh = 560, tMax = 0.06, dMax = 0.018;
  const px = (t: number) => gx + (t / tMax) * gw, py = (d: number) => gy + (d / dMax) * gh;
  const curve = (f: (t: number) => number, upto: number) =>
    Array.from({length: 121}, (_, i) => (i / 120) * upto).map((t, i) => `${i ? 'L' : 'M'}${px(t).toFixed(1)},${py(f(t)).toFixed(1)}`).join(' ');
  const free = ramp(frame, a, a + 50) * tMax, ballT = ramp(frame, b, b + 50) * tMax;
  const gap = cmAt(tMax) - ballAt(DROP_A, tMax);
  return (
    <div>
      <Title text="秘密：重心" frame={frame} />
      <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
        <line x1={gx} y1={gy} x2={gx + gw} y2={gy} stroke={K.ink} strokeWidth={5} />
        <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke={K.ink} strokeWidth={5} />
        <line x1={px(DROP_A.hover)} y1={gy} x2={px(DROP_A.hover)} y2={gy + gh} stroke={K.muted} strokeWidth={2} strokeDasharray="8 8" />
        {free > 0 && <path d={curve(t => ballAt(null, t), free)} stroke={K.c} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.5} />}
        {free > 0 && <path d={curve(cmAt, free)} stroke="#F2B632" strokeWidth={6} fill="none" strokeDasharray="14 10" />}
        {ballT > 0 && <path d={curve(t => ballAt(DROP_A, t), ballT)} stroke={K.a} strokeWidth={8} fill="none" strokeLinecap="round" />}
      </svg>
      <div data-safe style={{position: 'absolute', left: gx + 10, top: gy - 50, width: 300,
        fontFamily: FONT, fontSize: 30, fontWeight: 700, color: K.muted}}>下落距离 ↓</div>
      <div data-safe style={{position: 'absolute', left: gx + gw - 300, top: gy - 50, width: 300, textAlign: 'right',
        fontFamily: FONT, fontSize: 30, fontWeight: 700, color: K.muted, ...NUM}}>时间 → {tMax * 1000} ms</div>
      <div data-safe style={{position: 'absolute', left: px(DROP_A.hover) + 10, top: gy + 10, width: 260,
        fontFamily: FONT, fontSize: 30, fontWeight: 700, color: K.muted, ...NUM}}>{HOVER_MS} ms</div>
      {frame >= a + 20 && <div data-safe style={{position: 'absolute', left: gx + 300, top: py(cmAt(0.042)) + 20, width: 380,
        fontFamily: FONT, fontSize: 34, fontWeight: 800, color: K.gold, ...enter(frame, a + 20)}}>重心 = C：自由落体</div>}
      {frame >= b + 30 && <div data-safe style={{position: 'absolute', left: gx + 60, top: py(ballAt(DROP_A, 0.05)) - 70, width: 300,
        fontFamily: FONT, fontSize: 34, fontWeight: 800, color: K.a, ...enter(frame, b + 30)}}>A 的球</div>}
      {frame >= b + 40 && <Banner frame={frame} at={b + 40} top={1100} tone="gold" size={40}
        text={`最后只比自由落体落后约 ${(gap * 1000).toFixed(1)} mm`} />}
    </div>
  );
};

// ---------- 05 两种模型：理想轻弹簧选D，真实弹簧严格是 C、B、A ----------
const Scene05 = ({frame, fps}: {frame: number; fps: number}) => {
  const ideal = cueAt('s05-01') * fps, real = cueAt('s05-02') * fps, note = cueAt('s05-03') * fps;
  const rows = [
    {k: 'C', t: '最先（基准）', c: K.c, at: cueAt('s05-02', 0.3)},
    {k: 'B', t: `晚 ${LAG_B_MS} ms`, c: K.b, at: cueAt('s05-02', 0.55)},
    {k: 'A', t: `晚 ${LAG_A_MS} ms`, c: K.a, at: cueAt('s05-02', 0.8)},
  ];
  return (
    <div>
      <Title text="D还是C？看模型" frame={frame} size={88} />
      <div style={{position: 'absolute', left: CX - 390, top: 370, width: 780, boxSizing: 'border-box', background: K.paper,
        border: `4px solid ${K.muted}`, borderRadius: 26, padding: '14px 24px', ...enter(frame, ideal)}}>
        <div data-safe style={{fontFamily: FONT, fontSize: 34, fontWeight: 800, color: K.muted}}>理想轻弹簧（没有质量）</div>
        <div data-safe style={{fontFamily: FONT, fontSize: 48, fontWeight: 900, color: K.ink, marginTop: 4}}>三球同时落地 → D</div>
      </div>
      {frame >= real && (
        <div style={{position: 'absolute', left: CX - 390, top: 580, width: 780, boxSizing: 'border-box', background: K.paper,
          border: `4px solid ${K.ink}`, borderRadius: 26, padding: '14px 24px', ...enter(frame, real)}}>
          <div data-safe style={{fontFamily: FONT, fontSize: 34, fontWeight: 800, color: K.ink}}>真实弹簧（有质量）：落地顺序</div>
          {rows.map((r, i) => (
            <div key={r.k} data-safe style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 12, fontFamily: FONT,
              fontSize: 46, fontWeight: 900, color: K.ink, ...NUM, ...enter(frame, r.at * fps)}}>
              <span style={{width: 56, height: 56, borderRadius: 28, background: r.c, color: '#fff', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 36}}>{i + 1}</span>
              <span style={{color: r.c}}>{r.k}</span><span>{r.t}</span>
            </div>
          ))}
        </div>
      )}
      {frame >= note && (
        <div data-safe style={{position: 'absolute', left: CX - 390, top: 1000, width: 780, boxSizing: 'border-box', textAlign: 'center',
          background: '#FFF4D6', border: '4px solid #F2B632', borderRadius: 26, padding: '12px 16px',
          fontFamily: FONT, fontSize: 40, fontWeight: 800, color: K.ink, ...enter(frame, note)}}>差距不到千分之一秒，肉眼分不出</div>
      )}
      <div data-safe style={{position: 'absolute', left: CX - 390, top: 1130, width: 780, textAlign: 'center',
        fontFamily: FONT, fontSize: 30, fontWeight: 600, color: K.muted, ...enter(frame, real + 30)}}>模拟估算，非实测：{content.model.assumptions}</div>
    </div>
  );
};

// ---------- 06 彩虹圈 ----------
const RAINBOW = ['#E84A5F', '#F28C28', '#F2C230', '#3FB37F', '#2F7BD9', '#7A5CC9'];
const Scene06 = ({frame, fps}: {frame: number; fps: number}) => {
  const drop = cueAt('s06-01', 0.35) * fps, ask = cueAt('s06-02') * fps;
  // 示意动画：上端以恒定速度追下去，下端等上端到达才动
  const t = Math.max(0, (frame - drop) / fps);
  const top0 = 560, bottom0 = 1060, collapse = 1.0; // 秒（动画时间）
  const topY = top0 + Math.min(1, t / collapse) * (bottom0 - top0 - 60);
  const fallAfter = Math.max(0, t - collapse);
  const shift = Math.min(50, 220 * fallAfter * fallAfter);
  const coils = 16;
  return (
    <div>
      <Title text={'想亲眼看悬停？'} frame={frame} />
      <div style={{position: 'absolute', left: CX - 70, top: 470, width: 140, height: 70, borderRadius: 35,
        background: '#F2C9A0', border: `4px solid ${K.ink}`, opacity: frame >= drop ? 0.4 : 1}} />
      <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
        {Array.from({length: coils}).map((_, i) => {
          const y = topY + ((bottom0 - topY) * i) / (coils - 1) + shift;
          return <ellipse key={i} cx={CX} cy={y} rx={110} ry={20} fill="none" stroke={RAINBOW[i % RAINBOW.length]} strokeWidth={10} />;
        })}
      </svg>
      {frame >= drop && t < collapse && (
        <div data-safe style={{position: 'absolute', left: CX + 140, top: bottom0 - 30, width: 220,
          fontFamily: FONT, fontSize: 36, fontWeight: 900, color: K.accent}}>底端不动！</div>
      )}
      {frame >= ask && <Banner frame={frame} at={ask} top={1150} tone="gold" size={40} text="你一开始选的是几？评论区见" />}
    </div>
  );
};

const SCENES: Record<string, React.FC<{frame: number; fps: number}>> = {
  '01': Scene01, '02': Scene02, '03': Scene03, '04': Scene04, '05': Scene05, '06': Scene06,
};

export const SpringDropVideo: React.FC<{debugAudit?: boolean; showSafeArea?: boolean}> = ({debugAudit = false, showSafeArea = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ref = React.useRef<HTMLDivElement>(null);
  useFrameAudit(ref, frame, debugAudit);
  const seconds = frame / fps;
  let idx = RT.scenes.findIndex(s => seconds >= s.start && seconds < s.end);
  if (idx < 0) idx = RT.scenes.length - 1;
  const sc = RT.scenes[idx];
  const Scene = SCENES[sc.id];
  const cue = [...RT.captions].reverse().find(c => c.scene === sc.id && seconds >= c.start && seconds < c.end + 0.6);
  return (
    <AbsoluteFill ref={ref} style={{background: K.bg, fontFamily: FONT}}>
      <Backdrop />
      <Tag />
      <Scene frame={Math.round(frame - sc.start * fps)} fps={fps} />
      {cue && (
        <div data-safe data-caption style={{position: 'absolute', left: SAFE.x0, top: 1360, width: SAFE.x1 - SAFE.x0, minHeight: 124,
          boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', border: '1px solid #D9D2C3', borderRadius: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre-line',
          fontFamily: FONT, fontSize: 40, fontWeight: 600, color: K.ink, padding: '8px 24px', lineHeight: 1.35}}>
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
          <rect x={SAFE.x0} y={SAFE.y0} width={SAFE.x1 - SAFE.x0} height={SAFE.y1 - SAFE.y0} fill="none" stroke="#C72C44" strokeDasharray="12 8" />
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const SpringDropCover: React.FC = () => (
  <AbsoluteFill style={{background: K.bg, fontFamily: FONT}}>
    <Backdrop />
    <Tag />
    <Title text={'三个铁球\n谁先落地？'} frame={0} size={96} still />
    <Rig frame={0} />
    <Options frame={30} at={0} />
  </AbsoluteFill>
);
