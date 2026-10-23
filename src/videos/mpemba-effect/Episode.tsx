import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, interpolateColors, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SAFE as PROFILE_SAFE} from '../../shared/profile';
import {useFrameAudit} from '../../shared/story';
import content from './content.json';
import runtime from './runtime.json';

// 姆潘巴效应：直觉→传说→争论→过冷与气流→结论。
// 杯子、温度计、冰箱、曲线都是代码画的；动作时刻挂在字幕 cue 上，配音重生成后自动对齐。

const FONT = "'Noto Sans CJK SC','Noto Sans SC',sans-serif";
const W = 1080, H = 1920;
const SAFE = {x0: PROFILE_SAFE.left + 15, x1: PROFILE_SAFE.right - 15, y0: PROFILE_SAFE.top, y1: PROFILE_SAFE.bottom};
const CX = (SAFE.x0 + SAFE.x1) / 2;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const NUM = {fontVariantNumeric: 'tabular-nums'} as const;
const K = {
  bg: '#EAF3F8', bgDeep: '#D6E8F2', ink: '#16324A', muted: '#55707F', paper: '#FFFFFF',
  hot: '#E4572E', hotSoft: '#FFE3D8', cold: '#2E86DE', coldSoft: '#DCEEFF', ice: '#CFEFFF', iceLine: '#7CC6F2',
  gold: '#B87A00', yes: '#1F9D6B', no: '#D64545', fridge: '#F4F8FB', fridgeLine: '#9DB4C4',
};
// 用显式宽度而不是 left+right：审计在布局初期测量，依赖父容器宽度会得到 0 宽
const SIDES = {left: SAFE.x0, width: SAFE.x1 - SAFE.x0, boxSizing: 'border-box'} as const;

type Cue = {id: string; scene: string; start: number; end: number; text: string; audio?: string | null};
type Rt = {scenes: {id: string; start: number; end: number}[]; durationInFrames: number; captions: Cue[]};
const RT = runtime as unknown as Rt;

/** cue 在本场景内的开始秒数；frac 取 cue 时长的比例 */
const cueAt = (id: string, frac = 0): number => {
  const cue = RT.captions.find(c => c.id === id);
  if (!cue) throw new Error(`MpembaEffect missing cue ${id}`);
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

// ---------- 模型：理想牛顿冷却（第2镜示意） ----------
const {hotStartC: HOT, coldStartC: COLD, freezerC: ENV} = content.model;
const COOL_K = 0.045; // 每分钟，示意值
const tempAt = (start: number, minutes: number) => ENV + (start - ENV) * Math.exp(-COOL_K * minutes);
const minutesTo = (start: number, target: number) => Math.log((start - ENV) / (target - ENV)) / COOL_K;
// 热水降到冷水初温所需时间；此后两条曲线重合（只差这段时间）
const CATCH_UP = minutesTo(HOT, COLD);
if (!(CATCH_UP > 0 && Math.abs(tempAt(HOT, CATCH_UP + 5) - tempAt(COLD, 5)) < 1e-9)) throw new Error('[model] 冷却曲线自检失败');

// ---------- 通用部件 ----------
const Backdrop = ({frame}: {frame: number}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: K.bg}}>
    <div style={{position: 'absolute', left: 0, top: 1300, width: W, height: 620, background: K.bgDeep}} />
    {/* 缓慢飘落的小雪花，种子固定 */}
    {Array.from({length: 14}).map((_, i) => {
      const x = random(`snow-x-${i}`) * W, speed = 0.6 + random(`snow-v-${i}`) * 0.8;
      const y = ((frame * speed + random(`snow-y-${i}`) * H) % (H + 40)) - 20;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 10, height: 10, borderRadius: 5,
        background: '#fff', opacity: 0.7}} />;
    })}
  </div>
);

const Tag = () => (
  <div data-safe style={{position: 'absolute', ...SIDES, top: 168, display: 'flex', justifyContent: 'space-between',
    fontFamily: FONT, fontSize: 32, fontWeight: 700, color: K.muted}}>
    <span>{content.brand}</span><span>物理冷知识</span>
  </div>
);

const Title = ({text, frame, size = 88, still = false}: {text: React.ReactNode; frame: number; size?: number; still?: boolean}) => (
  <div data-safe data-title style={{position: 'absolute', ...SIDES, top: 220, textAlign: 'center',
    fontFamily: FONT, fontSize: size, lineHeight: 1.15, fontWeight: 800, color: K.ink, whiteSpace: 'pre-line',
    ...(still ? {} : enter(frame, -5))}}>
    {text}
  </div>
);

const Banner = ({text, frame, at, top, tone = 'paper', size = 42}:
  {text: React.ReactNode; frame: number; at: number; top: number; tone?: 'paper' | 'hot' | 'cold' | 'yes' | 'no' | 'gold'; size?: number}) => {
  const border = {paper: K.ink, hot: K.hot, cold: K.cold, yes: K.yes, no: K.no, gold: '#F2B632'}[tone];
  return (
    <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, boxSizing: 'border-box', top, textAlign: 'center',
      background: K.paper, border: `4px solid ${border}`, borderRadius: 26, padding: '14px 16px', whiteSpace: 'pre-line',
      fontFamily: FONT, fontSize: size, fontWeight: 800, lineHeight: 1.3, color: tone === 'paper' || tone === 'gold' ? K.ink : border,
      ...NUM, ...enter(frame, at)}}>
      {text}
    </div>
  );
};

type Mood = 'calm' | 'sweaty' | 'smug' | 'shiver' | 'shock' | 'happy';

/** 会说话的玻璃杯：水温决定颜色，ice 0..1 决定结冰程度 */
const Cup = ({x, y, temp, ice = 0, steam = 0, mood = 'calm', frame, scale = 1, supercool = false}:
  {x: number; y: number; temp: number; ice?: number; steam?: number; mood?: Mood; frame: number; scale?: number; supercool?: boolean}) => {
  const w = 190, h = 230, top = 20;
  const water = interpolateColors(temp, [-5, 0, 20, 50, 85], ['#9AD8FF', '#B9E6FF', '#5AA9E6', '#F08A5D', '#E4572E']);
  const shake = mood === 'shiver' ? Math.sin(frame * 1.7) * 3 : 0;
  const levelY = top + 40;
  const iceH = (h - 40 - 12) * ice;
  const cup = `M10,${top} L${w - 10},${top} L${w - 26},${top + h} Q${w / 2},${top + h + 10} 26,${top + h} Z`;
  const eyeY = top + 120;
  return (
    <div style={{position: 'absolute', left: x - (w / 2) * scale + shake, top: y - (h + top + 20) * scale,
      width: w * scale, height: (h + top + 20) * scale}}>
      <svg width={w * scale} height={(h + top + 20) * scale} viewBox={`0 0 ${w} ${h + top + 20}`} overflow="visible">
        <defs><clipPath id={`cup-${x}-${y}`}><path d={cup} /></clipPath></defs>
        {/* 热气 */}
        {steam > 0 && [0, 1, 2].map(i => {
          const phase = ((frame * 1.4 + i * 37 + random(`steam-${x}-${i}`) * 50) % 90) / 90;
          const sx = 50 + i * 45, sy = top - 10 - phase * 90;
          return <path key={i} d={`M${sx},${sy + 40} q-14,-14 0,-26 q14,-12 0,-26`} fill="none" stroke="#C9D3DA"
            strokeWidth={9} strokeLinecap="round" opacity={steam * (1 - phase) * 0.9} />;
        })}
        <g clipPath={`url(#cup-${x}-${y})`}>
          <rect x={0} y={levelY} width={w} height={h} fill={water} />
          {/* 冰层从水面往下长 */}
          {ice > 0 && <rect x={0} y={levelY} width={w} height={iceH} fill={K.ice} opacity={0.95} />}
          {ice > 0 && [0, 1, 2, 3].map(i => (
            <path key={i} d={`M${30 + i * 42},${levelY + 6} l14,${Math.min(iceH - 8, 40)} l-8,${Math.min(iceH - 8, 30)}`}
              stroke={K.iceLine} strokeWidth={4} fill="none" opacity={Math.min(1, ice * 2)} />
          ))}
          {supercool && <rect x={0} y={levelY} width={w} height={h} fill="#E9F6FF" opacity={0.25 + 0.15 * Math.sin(frame / 6)} />}
        </g>
        <path d={cup} fill="none" stroke={K.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M28,${top + 30} L40,${top + h - 30}`} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
        {/* 表情 */}
        {mood === 'shock' ? (
          <g><circle cx={70} cy={eyeY} r={13} fill="#fff" stroke={K.ink} strokeWidth={4} /><circle cx={70} cy={eyeY} r={5} fill={K.ink} />
            <circle cx={120} cy={eyeY} r={13} fill="#fff" stroke={K.ink} strokeWidth={4} /><circle cx={120} cy={eyeY} r={5} fill={K.ink} /></g>
        ) : (
          <g>{frame % 80 < 5
            ? <g stroke={K.ink} strokeWidth={5} strokeLinecap="round"><line x1={60} y1={eyeY} x2={80} y2={eyeY} /><line x1={110} y1={eyeY} x2={130} y2={eyeY} /></g>
            : <g fill={K.ink}><ellipse cx={70} cy={eyeY} rx={8} ry={10} /><ellipse cx={120} cy={eyeY} rx={8} ry={10} /></g>}</g>
        )}
        {mood === 'happy' || mood === 'calm' ? <path d={`M78,${eyeY + 30} Q95,${eyeY + (mood === 'happy' ? 50 : 42)} 112,${eyeY + 30}`} stroke={K.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          : mood === 'smug' ? <path d={`M80,${eyeY + 36} Q100,${eyeY + 42} 114,${eyeY + 28}`} stroke={K.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          : mood === 'shock' ? <ellipse cx={95} cy={eyeY + 40} rx={11} ry={14} fill={K.ink} />
          : mood === 'shiver' ? <path d={`M76,${eyeY + 36} l8,-6 l8,6 l8,-6 l8,6 l8,-6`} stroke={K.ink} strokeWidth={4} fill="none" />
          : <path d={`M80,${eyeY + 40} Q95,${eyeY + 28} 110,${eyeY + 40}`} stroke={K.ink} strokeWidth={5} fill="none" strokeLinecap="round" />}
        {mood === 'sweaty' && <path d={`M150,${eyeY - 30} q8,14 0,22 q-8,-8 0,-22`} fill="#8FD0FF" stroke={K.ink} strokeWidth={3} />}
        {(mood === 'calm' || mood === 'happy') && <g fill="#F7A8A8" opacity={0.7}><ellipse cx={52} cy={eyeY + 24} rx={12} ry={7} /><ellipse cx={138} cy={eyeY + 24} rx={12} ry={7} /></g>}
      </svg>
    </div>
  );
};

/** 温度计：读数用阿拉伯数字，单位°C */
const Thermo = ({x, y, temp, frame, at = -20, label}: {x: number; y: number; temp: number; frame: number; at?: number; label?: string}) => {
  const hgt = 240, lo = -20, hi = 90;
  const fill = interpolate(temp, [lo, hi], [0, hgt - 30], clamp);
  const color = temp > 30 ? K.hot : K.cold;
  const zero = hgt - 30 - interpolate(0, [lo, hi], [0, hgt - 30]);
  return (
    <div style={{position: 'absolute', left: x - 30, top: y, width: 60, height: hgt + 110, ...enter(frame, at)}}>
      <svg width={60} height={hgt + 30} viewBox={`0 0 60 ${hgt + 30}`}>
        <rect x={20} y={0} width={20} height={hgt - 10} rx={10} fill="#fff" stroke={K.ink} strokeWidth={4} />
        <rect x={25} y={hgt - 30 - fill} width={10} height={fill + 10} fill={color} />
        <circle cx={30} cy={hgt} r={22} fill={color} stroke={K.ink} strokeWidth={4} />
        <line x1={8} y1={zero} x2={52} y2={zero} stroke={K.ink} strokeWidth={3} strokeDasharray="5 4" />
      </svg>
      <div data-safe style={{position: 'absolute', left: -30, top: hgt + 34, width: 120, textAlign: 'center',
        fontFamily: FONT, fontSize: 36, fontWeight: 800, color, ...NUM}}>{label ?? `${Math.round(temp)}°C`}</div>
    </div>
  );
};

/** 冰箱：门 open 0..1 打开；shelfY 为隔板高度 */
const Fridge = ({open, frame, wind = 0, windBias = 0}: {open: number; frame: number; wind?: number; windBias?: number}) => {
  const left = CX - 400, top = 480, w = 800, h = 760;
  return (
    <div style={{position: 'absolute', left, top, width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, background: '#DDF1FF', border: `6px solid ${K.fridgeLine}`, borderRadius: 34}} />
      {/* 霜 */}
      {Array.from({length: 9}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 30 + i * 92, top: 18, width: 60, height: 22, borderRadius: 11,
          background: '#fff', opacity: 0.8}} />
      ))}
      <div style={{position: 'absolute', left: 20, top: h - 120, width: w - 40, height: 14, background: K.fridgeLine, borderRadius: 7}} />
      {/* 冷风 */}
      {wind > 0 && [0, 1, 2, 3].map(i => {
        const lane = i < 2 ? 0 : 1; // 0 吹左杯，1 吹右杯
        const strength = lane === 0 ? 1 - windBias : windBias;
        const phase = ((frame * 6 + i * 70) % 260) / 260;
        return (
          <svg key={i} style={{position: 'absolute', left: (lane === 0 ? 80 : 470) + phase * 220, top: 260 + (i % 2) * 120}}
            width={200} height={60} viewBox="0 0 200 60" opacity={wind * (0.25 + 0.75 * strength) * (1 - phase)}>
            <path d="M0,30 q50,-26 100,0 t90,0" stroke="#7CC6F2" strokeWidth={6 + strength * 8} fill="none" strokeLinecap="round" />
          </svg>
        );
      })}
      {/* 门：向左侧合页折叠，不越出冰箱轮廓 */}
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: 'left center',
        transform: `scaleX(${1 - open * 0.94})`, background: K.fridge,
        border: `6px solid ${K.fridgeLine}`, borderRadius: 34,
        boxShadow: '0 10px 0 rgba(22,50,74,0.08)'}}>
        <div style={{position: 'absolute', right: 40, top: 300, width: 20, height: 160, borderRadius: 10, background: K.fridgeLine}} />
      </div>
    </div>
  );
};

// ---------- 01 钩子 ----------
const Scene01 = ({frame, fps}: {frame: number; fps: number}) => {
  const vote = cueAt('s01-02') * fps, hotSay = cueAt('s01-02', 0.65) * fps;
  const open = ramp(frame, 0, 18);
  const slide = ramp(frame, 6, 30);
  return (
    <div>
      <Title text={'热水冷水\n谁先结冰？'} frame={0} size={96} still />
      <Fridge open={open} frame={frame} />
      <Cup x={interpolate(slide, [0, 1], [330, 340])} y={1110} temp={HOT} steam={1} mood={frame >= hotSay ? 'smug' : 'sweaty'} frame={frame} />
      <Cup x={interpolate(slide, [0, 1], [760, 740])} y={1110} temp={COLD} mood={frame >= vote ? 'happy' : 'calm'} frame={frame} />
      <div data-safe style={{position: 'absolute', left: 340 - 80, top: 1130, width: 160, textAlign: 'center',
        fontFamily: FONT, fontSize: 40, fontWeight: 800, color: K.hot}}>热水</div>
      <div data-safe style={{position: 'absolute', left: 740 - 80, top: 1130, width: 160, textAlign: 'center',
        fontFamily: FONT, fontSize: 40, fontWeight: 800, color: K.cold}}>冷水</div>
      <div data-safe style={{position: 'absolute', left: CX - 60, top: 640, width: 120, height: 120, borderRadius: 60,
        background: '#fff', border: `5px solid ${K.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontSize: 72, fontWeight: 900, color: K.gold,
        transform: `rotate(${Math.sin(frame / 8) * 8}deg)`}}>?</div>
      {frame >= vote && <Banner frame={frame} at={vote} top={480} tone="cold" text="直觉：冷水先！" size={40} />}
      {frame >= hotSay && (
        <div data-safe style={{position: 'absolute', left: 300 - 130, top: 640, width: 260, textAlign: 'center',
          background: K.hotSoft, border: `4px solid ${K.hot}`, borderRadius: 24, padding: '10px 0',
          fontFamily: FONT, fontSize: 40, fontWeight: 800, color: K.hot, ...pop(frame, hotSay)}}>我先！</div>
      )}
    </div>
  );
};

// ---------- 02 直觉推理：理想冷却曲线 ----------
const Scene02 = ({frame, fps}: {frame: number; fps: number}) => {
  const at = cueAt('s02-01') * fps, catchAt = cueAt('s02-01', 0.35) * fps, copyAt = cueAt('s02-01', 0.6) * fps;
  const gx = 170, gy = 470, gw = 700, gh = 560, tMax = 70;
  const px = (t: number) => gx + (t / tMax) * gw;
  const py = (c: number) => gy + gh - ((c - ENV) / (HOT + 5 - ENV)) * gh;
  const path = (start: number, offset: number, upto: number) => {
    const pts: string[] = [];
    for (let t = 0; t <= upto; t += 0.5) {
      const c = tempAt(start, t);
      if (c < 0) break;
      pts.push(`${pts.length ? 'L' : 'M'}${px(t + offset).toFixed(1)},${py(c).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const draw = ramp(frame, at, catchAt, 0, 1);
  const hotTo = draw * tMax;
  return (
    <div>
      <Title text={'冷水先\n不是明摆着？'} frame={frame} />
      <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
        <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke={K.ink} strokeWidth={5} />
        <line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke={K.ink} strokeWidth={5} />
        <line x1={gx} y1={py(0)} x2={gx + gw} y2={py(0)} stroke={K.cold} strokeWidth={3} strokeDasharray="10 8" />
        <path d={path(COLD, 0, hotTo)} stroke={K.cold} strokeWidth={9} fill="none" strokeLinecap="round" />
        <path d={path(HOT, 0, hotTo)} stroke={K.hot} strokeWidth={9} fill="none" strokeLinecap="round" />
        {frame >= catchAt && (
          <g opacity={ramp(frame, catchAt, catchAt + 10)}>
            <line x1={px(CATCH_UP)} y1={py(COLD)} x2={px(CATCH_UP)} y2={gy + gh} stroke={K.hot} strokeWidth={3} strokeDasharray="8 6" />
            <circle cx={px(CATCH_UP)} cy={py(COLD)} r={12} fill="#fff" stroke={K.hot} strokeWidth={5} />
          </g>
        )}
        {frame >= copyAt && (
          <path d={path(COLD, CATCH_UP, tMax)} stroke={K.cold} strokeWidth={18} fill="none" strokeLinecap="round"
            opacity={0.25 * ramp(frame, copyAt, copyAt + 12)} />
        )}
      </svg>
      <div data-safe style={{position: 'absolute', left: gx - 100, top: py(HOT) - 24, width: 90, textAlign: 'right',
        fontFamily: FONT, fontSize: 32, fontWeight: 800, color: K.hot, ...NUM}}>{HOT}°C</div>
      <div data-safe style={{position: 'absolute', left: gx - 100, top: py(COLD) - 24, width: 90, textAlign: 'right',
        fontFamily: FONT, fontSize: 32, fontWeight: 800, color: K.cold, ...NUM}}>{COLD}°C</div>
      <div data-safe style={{position: 'absolute', left: gx - 100, top: py(0) - 24, width: 90, textAlign: 'right',
        fontFamily: FONT, fontSize: 32, fontWeight: 800, color: K.ink, ...NUM}}>0°C</div>
      <div data-safe style={{position: 'absolute', left: gx + gw - 200, top: gy + gh + 14, width: 200, textAlign: 'right',
        fontFamily: FONT, fontSize: 32, fontWeight: 700, color: K.muted}}>时间 →</div>
      {frame >= catchAt && (
        <div data-safe style={{position: 'absolute', left: px(CATCH_UP) + 20, top: py(COLD) - 90, width: 330,
          fontFamily: FONT, fontSize: 34, fontWeight: 800, color: K.hot, ...enter(frame, catchAt)}}>热水追到冷水起点</div>
      )}
      {frame >= copyAt && (
        <Banner frame={frame} at={copyAt} top={1140} tone="cold" size={40} text="之后再走一遍冷水的路 → 冷水稳赢？" />
      )}
      <div data-safe style={{position: 'absolute', left: gx + 20, top: gy + 10, width: 300,
        fontFamily: FONT, fontSize: 30, fontWeight: 600, color: K.muted}}>示意：理想冷却</div>
    </div>
  );
};

// ---------- 03 1963 冰淇淋 ----------
const IceCream = ({x, y, hot, frozen, frame}: {x: number; y: number; hot: boolean; frozen: number; frame: number}) => {
  const cream = interpolateColors(frozen, [0, 1], [hot ? '#F6C9A8' : '#FBE3C8', '#FFFFFF']);
  return (
    <div style={{position: 'absolute', left: x - 150, top: y - 260, width: 300, height: 260}}>
      <svg width={300} height={260} viewBox="0 0 300 260" overflow="visible">
        {hot && frozen < 0.5 && [0, 1, 2].map(i => {
          const phase = ((frame * 1.4 + i * 30) % 90) / 90;
          return <path key={i} d={`M${100 + i * 50},${70 - phase * 70} q-14,-14 0,-26 q14,-12 0,-26`} fill="none" stroke="#C9D3DA"
            strokeWidth={9} strokeLinecap="round" opacity={(1 - phase) * (1 - frozen * 2)} />;
        })}
        <ellipse cx={150} cy={120} rx={120} ry={40} fill={cream} stroke={K.ink} strokeWidth={5} />
        <path d="M30,120 Q150,300 270,120 Z" fill="#9CC9E8" stroke={K.ink} strokeWidth={6} strokeLinejoin="round" />
        {frozen > 0.4 && [0, 1, 2].map(i => (
          <g key={i} transform={`translate(${95 + i * 55},${112}) scale(${frozen})`} stroke={K.iceLine} strokeWidth={4}>
            <line x1={-12} y1={0} x2={12} y2={0} /><line x1={-6} y1={-10} x2={6} y2={10} /><line x1={6} y1={-10} x2={-6} y2={10} />
          </g>
        ))}
      </svg>
    </div>
  );
};

const Scene03 = ({frame, fps}: {frame: number; fps: number}) => {
  const freezeAt = cueAt('s03-02') * fps, nameAt = cueAt('s03-02', 0.55) * fps;
  const hotFrozen = ramp(frame, freezeAt, freezeAt + 30);
  return (
    <div>
      <Title text={'1963年\n姆潘巴效应'} frame={frame} />
      <Banner frame={frame} at={6} top={470} size={40} text="坦桑尼亚 · 中学生做冰淇淋" />
      <IceCream x={330} y={960} hot frozen={hotFrozen} frame={frame} />
      <IceCream x={750} y={960} hot={false} frozen={0} frame={frame} />
      <div data-safe style={{position: 'absolute', left: 330 - 140, top: 980, width: 280, textAlign: 'center',
        fontFamily: FONT, fontSize: 38, fontWeight: 800, color: K.hot}}>趁热放进去</div>
      <div data-safe style={{position: 'absolute', left: 750 - 140, top: 980, width: 280, textAlign: 'center',
        fontFamily: FONT, fontSize: 38, fontWeight: 800, color: K.cold}}>放凉再放</div>
      {frame >= freezeAt && (
        <div data-safe style={{position: 'absolute', left: 330 - 110, top: 600, width: 220, textAlign: 'center',
          background: '#fff', border: `4px solid ${K.yes}`, borderRadius: 22, padding: '8px 0',
          fontFamily: FONT, fontSize: 40, fontWeight: 800, color: K.yes, ...pop(frame, freezeAt + 20)}}>先冻住！</div>
      )}
      {frame >= nameAt && <Banner frame={frame} at={nameAt} top={1140} tone="gold" text="姆潘巴效应：热的反而先结冰？" size={40} />}
    </div>
  );
};

// ---------- 04 争论：两份实验报告 ----------
const Report = ({x, year, line1, line2, ok, frame, at}:
  {x: number; year: string; line1: React.ReactNode; line2: string; ok: boolean; frame: number; at: number}) => (
  <div style={{position: 'absolute', left: x, top: 500, width: 360, height: 560, boxSizing: 'border-box',
    background: '#fff', border: `5px solid ${K.ink}`, borderRadius: 28, padding: '28px 24px', ...enter(frame, at),
    transform: `${enter(frame, at).transform} rotate(${ok ? 1.5 : -1.5}deg)`}}>
    <div data-safe style={{fontFamily: FONT, fontSize: 56, fontWeight: 900, color: K.ink, ...NUM}}>{year}</div>
    <div data-safe style={{fontFamily: FONT, fontSize: 36, fontWeight: 700, color: K.muted, marginTop: 10, lineHeight: 1.35}}>{line1}</div>
    <div data-safe style={{position: 'absolute', left: 24, bottom: 120, width: 300, fontFamily: FONT, fontSize: 40, fontWeight: 800,
      color: ok ? K.yes : K.no, lineHeight: 1.3}}>{line2}</div>
    <div style={{position: 'absolute', right: 24, bottom: 20, width: 90, height: 90, borderRadius: 45,
      border: `6px solid ${ok ? K.yes : K.no}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, fontSize: 56, fontWeight: 900, color: ok ? K.yes : K.no, ...pop(frame, at + 18)}}>{ok ? '✓' : '✕'}</div>
  </div>
);

const Scene04 = ({frame, fps}: {frame: number; fps: number}) => {
  const a = cueAt('s04-01') * fps, b = cueAt('s04-02') * fps;
  const count = Math.round(ramp(frame, b + 6, b + 40, 0, 176));
  return (
    <div>
      <Title text={'科学家\n吵了几十年'} frame={frame} />
      <Report x={130} year="2016" line1={'精确测量\n降到0°C的时间'} line2={'热水\n并不更快'} ok={false} frame={frame} at={a} />
      {frame >= b && (
        <Report x={540} year="2026" line1={<>测了 <span style={{color: K.ink, ...NUM}}>{count}</span> 次{'\n'}看谁先结冰</>}
          line2={'热水\n多次先结冰'} ok frame={frame} at={b} />
      )}
      {frame >= b + 45 && <Banner frame={frame} at={b + 45} top={1140} tone="gold" text="结论相反：至今还在争" size={40} />}
    </div>
  );
};

// ---------- 05 过冷与冷风 ----------
const Scene05 = ({frame, fps}: {frame: number; fps: number}) => {
  const sc = cueAt('s05-01') * fps, deep = cueAt('s05-02') * fps, wind = cueAt('s05-03') * fps;
  // 左杯（原热水）先到0°C附近并开始结冰；右杯（原冷水）过冷：降到0°C以下仍是液体
  const leftT = interpolate(frame, [0, sc + 30], [6, 0], clamp);
  const rightT = interpolate(frame, [0, sc + 20, sc + 50], [3, 0, -4], clamp);
  const leftIce = ramp(frame, deep, deep + 60, 0, 0.7);
  return (
    <div>
      <Title text="秘密：过冷" frame={frame} />
      <Fridge open={1} frame={frame} wind={ramp(frame, wind, wind + 15)} windBias={0.2} />
      <Cup x={360} y={1110} temp={leftT} ice={leftIce} mood={frame >= deep ? 'happy' : 'calm'} frame={frame} />
      <Cup x={700} y={1110} temp={rightT} supercool={frame >= sc + 40} mood={frame >= sc + 40 ? 'shiver' : 'calm'} frame={frame} />
      <Thermo x={160} y={560} temp={leftT} frame={frame} />
      <Thermo x={850} y={560} temp={rightT} frame={frame} label={frame >= sc + 40 ? '<0°C' : undefined} />
      <div data-safe style={{position: 'absolute', left: 360 - 120, top: 1130, width: 240, textAlign: 'center',
        fontFamily: FONT, fontSize: 36, fontWeight: 800, color: K.hot}}>原来的热水</div>
      <div data-safe style={{position: 'absolute', left: 700 - 120, top: 1130, width: 240, textAlign: 'center',
        fontFamily: FONT, fontSize: 36, fontWeight: 800, color: K.cold}}>原来的冷水</div>
      {frame >= sc + 40 && frame < wind && (
        <div data-safe style={{position: 'absolute', left: 700 - 170, top: 500, width: 340, textAlign: 'center',
          background: '#fff', border: `4px solid ${K.cold}`, borderRadius: 22, padding: '10px 0', whiteSpace: 'pre-line',
          fontFamily: FONT, fontSize: 36, fontWeight: 800, color: K.cold, lineHeight: 1.3, ...pop(frame, sc + 40)}}>{'零下了\n还是液体！'}</div>
      )}
      {frame >= deep && frame < wind && (
        <div data-safe style={{position: 'absolute', left: 360 - 140, top: 500, width: 260, textAlign: 'center',
          background: '#fff', border: `4px solid ${K.yes}`, borderRadius: 22, padding: '10px 0',
          fontFamily: FONT, fontSize: 36, fontWeight: 800, color: K.yes, ...pop(frame, deep + 20)}}>开始结冰</div>
      )}
      {frame >= wind && <Banner frame={frame} at={wind + 10} top={500} tone="cold" size={38} text="冷风不均匀：左杯被吹得更多" />}
    </div>
  );
};

// ---------- 06 结论 ----------
const Scene06 = ({frame, fps}: {frame: number; fps: number}) => {
  const ask = cueAt('s06-02') * fps;
  return (
    <div>
      <Title text={'热水能赢\n但不是冷得快'} frame={frame} />
      <div style={{position: 'absolute', left: CX - 390, top: 500, width: 780, display: 'flex', flexDirection: 'column', gap: 18}}>
        {[
          {t: '热水先结冰：真的会发生', c: K.yes, at: cueAt('s06-01', 0.05)},
          {t: '原因①：冷水过冷，迟迟不结冰', c: K.cold, at: cueAt('s06-01', 0.45)},
          {t: '原因②：冰箱里的风不均匀', c: K.cold, at: cueAt('s06-01', 0.75)},
        ].map(r => (
          <div key={r.t} data-safe style={{background: '#fff', border: `4px solid ${r.c}`, borderRadius: 24, padding: '16px 22px',
            fontFamily: FONT, fontSize: 40, fontWeight: 800, color: K.ink, ...enter(frame, r.at * fps)}}>{r.t}</div>
        ))}
      </div>
      <Cup x={330} y={1110} temp={0} ice={0.7} mood="happy" frame={frame} scale={0.8} />
      <Cup x={750} y={1110} temp={-2} supercool mood="shock" frame={frame} scale={0.8} />
      {frame >= ask && <Banner frame={frame} at={ask} top={1140} tone="gold" text="你家冰箱试过吗？评论区说说" size={40} />}
    </div>
  );
};

const SCENES: Record<string, React.FC<{frame: number; fps: number}>> = {
  '01': Scene01, '02': Scene02, '03': Scene03, '04': Scene04, '05': Scene05, '06': Scene06,
};

export const MpembaVideo: React.FC<{debugAudit?: boolean; showSafeArea?: boolean}> = ({debugAudit = false, showSafeArea = false}) => {
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
      <Backdrop frame={frame} />
      <Tag />
      <Scene frame={Math.round(frame - sc.start * fps)} fps={fps} />
      {cue && (
        <div data-safe data-caption style={{position: 'absolute', left: SAFE.x0, top: 1360, width: SAFE.x1 - SAFE.x0, minHeight: 124,
          boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', border: '1px solid #C9DCE7', borderRadius: 28,
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

export const MpembaCover: React.FC = () => (
  <AbsoluteFill style={{background: K.bg, fontFamily: FONT}}>
    <Backdrop frame={0} />
    <Tag />
    <Title text={'热水冷水\n谁先结冰？'} frame={0} size={96} still />
    <Fridge open={1} frame={0} />
    <Cup x={340} y={1110} temp={HOT} steam={1} mood="smug" frame={10} />
    <Cup x={740} y={1110} temp={COLD} mood="calm" frame={10} />
    <Banner frame={30} at={0} top={1140} tone="gold" text={content.coverSubtitle} size={40} />
  </AbsoluteFill>
);
