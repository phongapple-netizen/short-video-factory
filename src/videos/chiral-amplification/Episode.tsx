import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SAFE as PROFILE_SAFE} from '../../shared/profile';
import {useFrameAudit} from '../../shared/story';
import {FONT, Rod, progress} from '../../kits/rod-board';
import {KAGAN, KAGAN_EE, KAGAN_FREE, SOAI, majorityOf} from './model';
import content from './content.json';
import runtime from './runtime.json';

// 手性放大（2026 诺贝尔化学奖）：数字钩子→镜像不能重合→卡根配对示意→硖合三轮放大→生命的单一手性。
// 分子用球棍模型示意（中心原子+四个不同基团）；数量与 ee 来自 model.ts；动作挂在字幕 cue 上。

const W = 1080, H = 1920;
const SAFE = {x0: PROFILE_SAFE.left + 15, x1: PROFILE_SAFE.right - 15};
const CX = (SAFE.x0 + SAFE.x1) / 2;
const K = {
  bg: '#F3F6F2', grid: '#DDE7DF', ink: '#1E2A36', muted: '#5D6B74', paper: '#FFFFFF',
  L: '#2F7BD9', R: '#E8742E', gold: '#B87A00', yes: '#1F9D6B', no: '#D64545', dead: '#B9C0C6',
  c: '#2B2F33', a: '#E04F5F', b: '#3FB37F', d: '#F2C230', h: '#FFFFFF',
};

type Cue = {id: string; scene: string; start: number; end: number; text: string; audio?: string | null};
type Rt = {scenes: {id: string; start: number; end: number}[]; durationInFrames: number; captions: Cue[]};
const RT = runtime as unknown as Rt;
const cueAt = (id: string, frac = 0): number => {
  const cue = RT.captions.find(c => c.id === id);
  if (!cue) throw new Error(`ChiralAmplification missing cue ${id}`);
  const scene = RT.scenes.find(s => s.id === cue.scene)!;
  return cue.start - scene.start + frac * (cue.end - cue.start);
};
const pop = (frame: number, at: number) => {
  const s = spring({frame: frame - at, fps: 30, config: {damping: 10, stiffness: 170}});
  return {opacity: progress(frame, at, at + 5), transform: `scale(${Math.max(0.01, s)})`};
};
const enter = (frame: number, at: number) => ({
  opacity: progress(frame, at, at + 12), transform: `translateY(${interpolate(progress(frame, at, at + 12), [0, 1], [20, 0])}px)`,
});

// ---------- 分子：中心碳 + 四个不同基团；mirror 为 -1 时是镜像（R 型） ----------
const Ball = ({x, y, r, color}: {x: number; y: number; r: number; color: string}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth={Math.max(1.5, r * 0.08)} />
    <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.3} fill="#fff" opacity={0.45} />
  </g>
);
const Molecule = ({x, y, s = 1, flip = 1, dim = 1, ring}: {x: number; y: number; s?: number; flip?: number; dim?: number; ring?: string}) => {
  const arm = [{dx: 0, dy: -62, c: K.h, r: 16}, {dx: -56, dy: 34, c: K.a, r: 22}, {dx: 58, dy: 30, c: K.b, r: 22}, {dx: 18, dy: 54, c: K.d, r: 20}];
  return (
    <g transform={`translate(${x},${y}) scale(${s * flip},${s})`} opacity={dim}>
      {ring && <circle cx={0} cy={0} r={92} fill="none" stroke={ring} strokeWidth={8 / s} opacity={0.9} />}
      {arm.map((a, i) => <Rod key={i} p={{x: 0, y: 0}} q={{x: a.dx, y: a.dy}} color="#9AA4AE" width={10} joints={false} />)}
      {arm.map((a, i) => <Ball key={i} x={a.dx} y={a.dy} r={a.r} color={a.c} />)}
      <Ball x={0} y={0} r={20} color={K.c} />
    </g>
  );
};

// ---------- 分子群：type[i] 为 'L' | 'R' | 'dead' ----------
const CROWD_N = 40;
const crowdPos = Array.from({length: CROWD_N}, (_, i) => ({
  x: SAFE.x0 + 70 + (i % 8) * 102 + (random(`cx${i}`) - 0.5) * 30,
  y: 560 + Math.floor(i / 8) * 108 + (random(`cy${i}`) - 0.5) * 24,
  rot: (random(`cr${i}`) - 0.5) * 40,
}));
// 固定的随机名次：majors 变化时只翻转名次靠后的个体
const RANK = (() => {
  const order = crowdPos.map((_, i) => i).sort((a, b) => random(`co${a}`) - random(`co${b}`));
  const rank: number[] = [];
  order.forEach((i, r) => { rank[i] = r; });
  return rank;
})();
const Crowd = ({majors, frame}: {majors: number; frame: number}) => (
  <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
    {crowdPos.map((p, i) => {
      const isL = RANK[i] < majors;
      const wob = Math.sin(frame / 14 + i) * 4;
      return (
        <g key={i} transform={`rotate(${p.rot + wob} ${p.x} ${p.y})`}>
          <Molecule x={p.x} y={p.y} s={0.42} flip={isL ? 1 : -1} ring={isL ? K.L : K.R} />
        </g>
      );
    })}
  </svg>
);

const Tag = ({text, x, y, color, size = 36, frame, at, w = 240}: {text: React.ReactNode; x: number; y: number; color: string; size?: number; frame: number; at: number; w?: number}) => (
  <div data-safe style={{position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', background: K.paper,
    border: `4px solid ${color}`, borderRadius: 20, padding: '6px 4px', fontFamily: FONT, fontSize: size, fontWeight: 900,
    color, whiteSpace: 'pre-line', lineHeight: 1.25, boxSizing: 'border-box', ...pop(frame, at)}}>{text}</div>
);
const Banner = ({text, frame, at, top, tone = K.ink, size = 40}: {text: React.ReactNode; frame: number; at: number; top: number; tone?: string; size?: number}) => (
  <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, boxSizing: 'border-box', top, textAlign: 'center',
    background: K.paper, border: `4px solid ${tone}`, borderRadius: 26, padding: '12px 16px', whiteSpace: 'pre-line',
    fontFamily: FONT, fontSize: size, fontWeight: 900, lineHeight: 1.3, color: K.ink, ...enter(frame, at)}}>{text}</div>
);

// ---------- 01 钩子 ----------
const Scene01 = ({frame, fps}: {frame: number; fps: number}) => {
  const a = cueAt('s01-01', 0.1) * fps, b = cueAt('s01-01', 0.95) * fps, nobel = cueAt('s01-02') * fps;
  const step = Math.min(3, Math.max(0, Math.floor(interpolate(frame, [a, b], [0, 3.999], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))));
  const r = SOAI[step];
  return (
    <div>
      <Crowd majors={majorityOf(r.ee, CROWD_N)} frame={frame} />
      <div data-safe style={{position: 'absolute', left: CX - 330, width: 660, top: 1120, display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT, fontSize: 40, fontWeight: 900, color: K.ink}}>
        <span>{step === 0 ? '起点' : `第${step}轮`}</span><span style={{color: K.L}}>多数一方 ee {r.label}</span>
      </div>
      {frame >= nobel && <Banner frame={frame} at={nobel} top={1190} tone="#F2B632" text="2026 诺贝尔化学奖" />}
    </div>
  );
};

// ---------- 02 镜像、药物、各一半 ----------
const Scene02 = ({frame, fps}: {frame: number; fps: number}) => {
  const mirror = cueAt('s02-01', 0.15) * fps, overlap = cueAt('s02-01', 0.6) * fps, drug = cueAt('s02-02') * fps, half = cueAt('s02-03') * fps;
  const flip = interpolate(progress(frame, mirror, mirror + 25), [0, 1], [1, -1]);
  const slide = progress(frame, overlap, overlap + 20) - progress(frame, overlap + 40, overlap + 55);
  const showPair = frame < drug;
  return (
    <div>
      {showPair && (
        <>
          <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
            <line x1={CX} y1={500} x2={CX} y2={1020} stroke={K.muted} strokeWidth={4} strokeDasharray="14 10" />
            <Molecule x={CX - 190} y={760} s={1.25} ring={K.L} />
            <Molecule x={CX + 190 - slide * 380} y={760} s={1.25} flip={flip} ring={K.R} dim={frame >= mirror ? 1 : 0} />
          </svg>
          <Tag text="左手型 L" x={CX - 190} y={930} color={K.L} frame={frame} at={6} />
          {frame >= mirror && <Tag text="镜像 R" x={CX + 190} y={930} color={K.R} frame={frame} at={mirror + 20} />}
          {frame >= overlap + 22 && frame < overlap + 50 && <Tag text="对不上 ✕" x={CX - 190} y={520} color={K.no} frame={frame} at={overlap + 22} />}
        </>
      )}
      {frame >= drug && frame < half && (
        <>
          <Tag text={'左手版\n可能治病'} x={CX - 190} y={620} color={K.L} frame={frame} at={drug} w={300} size={40} />
          <Tag text={'右手版\n可能无效或有害'} x={CX + 190} y={620} color={K.R} frame={frame} at={drug + 10} w={330} size={40} />
          <Banner frame={frame} at={drug + 25} top={880} text="同一个分子式，作用可能完全不同" size={38} />
        </>
      )}
      {frame >= half && (
        <>
          <Crowd majors={20} frame={frame} />
          <Banner frame={frame} at={half + 6} top={1150} text="普通方法：左 50%  右 50%" size={40} />
        </>
      )}
    </div>
  );
};

// ---------- 03 卡根：配对示意 ----------
const Scene03 = ({frame, fps}: {frame: number; fps: number}) => {
  const pairAt = cueAt('s03-02', 0.15) * fps;
  const p = progress(frame, pairAt, pairAt + 35);
  const n = KAGAN.L + KAGAN.R;
  const slots = Array.from({length: n}, (_, i) => ({x: SAFE.x0 + 80 + (i % 7) * 115, y: 560 + Math.floor(i / 7) * 130}));
  // 前 6 个 L 与 6 个 R 配对，移到下方“失效区”
  const items = [
    ...Array.from({length: KAGAN.L}, (_, i) => ({hand: 'L', paired: i < KAGAN.R, k: i})),
    ...Array.from({length: KAGAN.R}, (_, i) => ({hand: 'R', paired: true, k: i})),
  ];
  return (
    <div>
      <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
        {frame >= pairAt && <rect x={SAFE.x0 + 20} y={960} width={SAFE.x1 - SAFE.x0 - 40} height={150} rx={22} fill="#EEF0F2" stroke={K.dead}
          strokeWidth={4} strokeDasharray="12 8" opacity={p} />}
        {items.map((it, idx) => {
          const from = slots[idx];
          const to = {x: SAFE.x0 + 90 + it.k * 125 + (it.hand === 'R' ? 46 : 0), y: 1035};
          const pos = it.paired ? {x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p} : from;
          return <Molecule key={idx} x={pos.x} y={pos.y} s={0.45} flip={it.hand === 'L' ? 1 : -1}
            ring={it.paired && p > 0.9 ? K.dead : it.hand === 'L' ? K.L : K.R} dim={it.paired ? 1 - 0.55 * p : 1} />;
        })}
      </svg>
      <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 460, textAlign: 'center',
        fontFamily: FONT, fontSize: 38, fontWeight: 900, color: K.ink}}>
        催化剂：<span style={{color: K.L}}>L {KAGAN.L}</span> · <span style={{color: K.R}}>R {KAGAN.R}</span>（ee {Math.round(KAGAN_EE * 100)}%）
      </div>
      {frame >= pairAt && <div data-safe style={{position: 'absolute', left: SAFE.x0 + 40, top: 1118, width: 500, fontFamily: FONT, fontSize: 32,
        fontWeight: 800, color: K.muted, opacity: p}}>左右配对 → 失效</div>}
      {p > 0.95 && <Tag text={`剩下 ${KAGAN_FREE.L} 个全是 L`} x={CX + 200} y={790} color={K.L} frame={frame} at={pairAt + 36} w={330} size={36} />}
      <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 1180, textAlign: 'center', fontFamily: FONT,
        fontSize: 30, fontWeight: 600, color: K.muted, opacity: progress(frame, pairAt + 40, pairAt + 52)}}>示意：异手配对失活的极端情况，非实验数据</div>
    </div>
  );
};

// ---------- 04 硖合：自催化 + 三轮数据 ----------
const Scene04 = ({frame, fps}: {frame: number; fps: number}) => {
  const copy = cueAt('s04-01', 0.25) * fps, bars = cueAt('s04-02') * fps;
  const count = 8; // 复制动画：每 20 帧翻倍一次，最多 8 个
  return (
    <div>
      {frame < bars && (
        <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
          {Array.from({length: count}).map((_, i) => {
            const x = CX + ((i % 4) - 1.5) * 190, y = 640 + Math.floor(i / 4) * 230;
            // 第 g 代在 copy + (g-1)*20 帧出现（1 → 2 → 4 → 8）
            const g = i === 0 ? 0 : Math.floor(Math.log2(i)) + 1, at = copy + (g - 1) * 20;
            return <Molecule key={i} x={x} y={y} s={0.75} ring={K.L} dim={i === 0 ? 1 : progress(frame, at, at + 12)} />;
          })}
        </svg>
      )}
      {frame >= copy && frame < bars && <Banner frame={frame} at={copy + 10} top={1130} tone={K.L} text="L 型产物 → 催化生成更多 L 型" size={38} />}
      {frame >= bars && (
        <div style={{position: 'absolute', left: CX - 380, top: 520, width: 760}}>
          {SOAI.map((r, i) => {
            const at = bars + i * 12 + 6;
            const w = Math.max(6, r.ee * 520) * progress(frame, at, at + 18);
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, height: 120, ...enter(frame, at)}}>
                <div data-safe style={{width: 130, fontFamily: FONT, fontSize: 36, fontWeight: 900, color: K.ink}}>{i === 0 ? '起点' : `第${i}轮`}</div>
                <div style={{width: w, height: 54, borderRadius: 14, background: K.L}} />
                <div data-safe style={{fontFamily: FONT, fontSize: 40, fontWeight: 900, color: K.L, whiteSpace: 'nowrap'}}>{r.label}</div>
              </div>
            );
          })}
          <div data-safe style={{marginTop: 18, textAlign: 'center', fontFamily: FONT, fontSize: 30, fontWeight: 600, color: K.muted,
            opacity: progress(frame, bars + 60, bars + 72)}}>数据：Sato、Soai 等，2003 年，对映体过量 ee</div>
        </div>
      )}
    </div>
  );
};

// ---------- 05 生命的单一手性 ----------
const Scene05 = ({frame, fps}: {frame: number; fps: number}) => {
  const idea = cueAt('s05-02') * fps, ask = cueAt('s05-03') * fps;
  return (
    <div>
      <svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H}>
        {Array.from({length: 5}).map((_, i) => (
          <Molecule key={i} x={SAFE.x0 + 90 + i * 170} y={600} s={0.62} ring={K.L} dim={progress(frame, 4 + i * 5, 14 + i * 5)} />
        ))}
      </svg>
      <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 700, textAlign: 'center', fontFamily: FONT,
        fontSize: 38, fontWeight: 900, color: K.L, ...enter(frame, 10)}}>蛋白质里的氨基酸：几乎都是 L 型</div>
      {frame >= idea && (
        <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, top: 800, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontFamily: FONT, fontSize: 38, fontWeight: 900, color: K.ink, ...enter(frame, idea)}}>
          <span>一点偏差</span><span style={{color: K.gold}}>→ 放大 →</span><span>几乎全部？</span>
        </div>
      )}
      {frame >= idea && <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 880, textAlign: 'center',
        fontFamily: FONT, fontSize: 32, fontWeight: 700, color: K.muted, ...enter(frame, idea + 15)}}>一种可能的机制，起源之谜仍在研究中</div>}
      {frame >= ask && <Banner frame={frame} at={ask} top={1100} tone="#F2B632" text="最初的偏差从哪来？评论区聊聊" />}
    </div>
  );
};

const SCENES: Record<string, React.FC<{frame: number; fps: number}>> = {'01': Scene01, '02': Scene02, '03': Scene03, '04': Scene04, '05': Scene05};

const Backdrop = () => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: K.bg,
    backgroundImage: `linear-gradient(${K.grid} 2px, transparent 2px), linear-gradient(90deg, ${K.grid} 2px, transparent 2px)`,
    backgroundSize: '60px 60px'}} />
);

export const ChiralVideo: React.FC<{debugAudit?: boolean; showSafeArea?: boolean}> = ({debugAudit = false, showSafeArea = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ref = React.useRef<HTMLDivElement>(null);
  useFrameAudit(ref, frame, debugAudit);
  const seconds = frame / fps;
  let idx = RT.scenes.findIndex(s => seconds >= s.start && seconds < s.end);
  if (idx < 0) idx = RT.scenes.length - 1;
  const sc = RT.scenes[idx];
  const Scene = SCENES[sc.id];
  const local = Math.round(frame - sc.start * fps);
  const scene = content.scenes[idx];
  const cue = [...RT.captions].reverse().find(c => c.scene === sc.id && seconds >= c.start && seconds < c.end + 0.6);
  return (
    <AbsoluteFill ref={ref} style={{background: K.bg, fontFamily: FONT}}>
      <Backdrop />
      <div data-safe style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 168, display: 'flex',
        justifyContent: 'space-between', fontFamily: FONT, fontSize: 32, fontWeight: 800, color: K.muted}}>
        <span>{content.brand}</span><span>诺奖解读</span>
      </div>
      <div data-safe data-title style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 220, textAlign: 'center',
        fontFamily: FONT, fontSize: sc.id === '01' ? 100 : 88, lineHeight: 1.1, fontWeight: 900, color: K.ink, whiteSpace: 'pre-line',
        opacity: sc.id === '01' ? 1 : progress(local, -5, 8)}}>
        {sc.id === '01' ? <><span style={{color: K.R}}>0.00005%</span>{'\n'}变成<span style={{color: K.L}}>99.5%</span></> : scene.title}
      </div>
      <Scene frame={local} fps={fps} />
      {cue && (
        <div data-safe data-caption style={{position: 'absolute', left: SAFE.x0, top: 1360, width: SAFE.x1 - SAFE.x0, minHeight: 124,
          boxSizing: 'border-box', background: 'rgba(255,255,255,0.96)', border: '1px solid #CFD8D2', borderRadius: 28,
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
          <rect x={PROFILE_SAFE.left} y={PROFILE_SAFE.top} width={PROFILE_SAFE.right - PROFILE_SAFE.left}
            height={PROFILE_SAFE.bottom - PROFILE_SAFE.top} fill="none" stroke="#C72C44" strokeDasharray="12 8" />
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const ChiralCover: React.FC = () => (
  <AbsoluteFill style={{background: K.bg, fontFamily: FONT}}>
    <Backdrop />
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 168, display: 'flex', justifyContent: 'space-between',
      fontFamily: FONT, fontSize: 32, fontWeight: 800, color: K.muted}}><span>{content.brand}</span><span>诺奖解读</span></div>
    <div style={{position: 'absolute', left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: 220, textAlign: 'center', fontFamily: FONT, fontSize: 100,
      lineHeight: 1.1, fontWeight: 900, color: K.ink}}><span style={{color: K.R}}>0.00005%</span><br />变成<span style={{color: K.L}}>99.5%</span></div>
    <Crowd majors={38} frame={0} />
    <Banner frame={30} at={0} top={1150} tone="#F2B632" text={content.coverSubtitle} size={38} />
  </AbsoluteFill>
);
