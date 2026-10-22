import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, PIRATE_COLORS, PIRATE_NAMES, RESULTS, type GameResult} from '../pirate-gold/model';
import {Pirate, Expression} from '../pirate-gold/Pirate';
import {CX, SAFE, SLOT_X, SLOT_FEET_Y} from '../pirate-gold/layout';
import {useFrameAudit} from '../../shared/story';
import content from './content.json';
import runtime from './runtime.json';

// 第2集：钩子→上集结论→四人局→五人局→规律与“超过一半”彩蛋。
// 画面数字全部来自 model.ts 的逆向归纳结果；动作时刻全部挂在字幕 cue 上，配音重生成后自动对齐。

const FONT = "'Noto Sans CJK SC','Noto Sans SC',sans-serif";
const W = 1080, H = 1920;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const NUM = {fontVariantNumeric: 'tabular-nums'} as const;
const INK = '#1B2540';
const GOLD = '#B87A00';
// 用显式宽度而不是 left+right：审计在布局初期测量，依赖父容器宽度会得到 0 宽
const SIDES = {left: SAFE.x0, width: SAFE.x1 - SAFE.x0, boxSizing: 'border-box'} as const;

type Cue = {id: string; scene: string; start: number; end: number; text: string; audio?: string | null};
type Rt = {scenes: {id: string; start: number; end: number}[]; durationInFrames: number; captions: Cue[]};
const RT = runtime as unknown as Rt;

const {r2, r3, r4, r5, r5s} = RESULTS;

/** cue 在本场景内的开始秒数；frac 取 cue 时长的比例，用于一句话内部的动作。 */
const cueAt = (id: string, frac = 0): number => {
  const cue = RT.captions.find(c => c.id === id);
  if (!cue) throw new Error(`PirateGoldEp2 missing cue ${id}`);
  const scene = RT.scenes.find(s => s.id === cue.scene)!;
  return cue.start - scene.start + frac * (cue.end - cue.start);
};

const enter = (frame: number, at: number) => {
  const o = interpolate(frame, [at, at + 12], [0, 1], {easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(frame, [at, at + 12], [20, 0], {easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {opacity: o, transform: `translateY(${y}px)`};
};

const pop = (frame: number, at: number) => {
  const s = spring({frame: frame - at, fps: 30, config: {damping: 10, stiffness: 180}});
  return {opacity: interpolate(frame, [at, at + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    transform: `scale(${Math.max(0.01, s)})`};
};

// ---------- 背景（与13镜版同一套海面与甲板） ----------
const Background = ({frame}: {frame: number}) => {
  const w1 = Math.sin(frame / 40) * 20;
  const w2 = Math.sin(frame / 55 + 2) * 24;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 980, background: C.sky}} />
      <svg style={{position: 'absolute', left: 0, top: 820, width: W, height: 160}}>
        <path d="M60,160 Q180,90 320,130 Q420,150 520,120 L520,160 Z" fill={C.island} stroke={INK} strokeWidth={4} />
        <path d="M700,160 Q800,100 920,135 Q980,150 1020,130 L1020,160 Z" fill={C.island} stroke={INK} strokeWidth={4} />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 980, width: W, height: 940, background: C.sea}} />
      <div style={{position: 'absolute', left: 0, top: 1300, width: W, height: 620, background: C.deepSea, opacity: 0.45}} />
      {[1100, 1250, 1420].map((y, i) => (
        <svg key={y} style={{position: 'absolute', left: 0, top: y, width: W, height: 40}}>
          <path d={`M-40,20 Q80,${8 + (i === 0 ? w1 * 0.3 : i === 1 ? w2 * 0.3 : 0)},200,20 T440,20 T680,20 T920,20 T1160,20`}
            fill="none" stroke={C.wave} strokeWidth={5} strokeLinecap="round" />
        </svg>
      ))}
      <div style={{position: 'absolute', left: 100, top: 930, width: 880, height: 180,
        background: C.deck, border: `4px solid ${INK}`, borderRadius: 18}} />
      {[990, 1050].map(y => (
        <div key={y} style={{position: 'absolute', left: 104, top: y, width: 872, height: 4, background: C.deckLine, opacity: 0.7}} />
      ))}
    </div>
  );
};

// ---------- 通用部件 ----------
const SeriesTag = () => (
  <div data-safe style={{position: 'absolute', ...SIDES, top: 168, display: 'flex', justifyContent: 'space-between',
    fontFamily: FONT, fontSize: 32, fontWeight: 700, color: C.muted}}>
    <span>{content.series.title}</span>
    <span style={NUM}>第{content.series.episode}集</span>
  </div>
);

const Title = ({text, frame, size = 96, still = false}: {text: React.ReactNode; frame: number; size?: number; still?: boolean}) => (
  <div data-safe data-title style={{position: 'absolute', ...SIDES, top: 220, textAlign: 'center',
    fontFamily: FONT, fontSize: size, lineHeight: 1.15, fontWeight: 800, color: INK, whiteSpace: 'pre-line',
    ...(still ? {} : enter(frame, -5))}}>
    {text}
  </div>
);

const Coin = ({size = 36}: {size?: number}) => (
  <svg width={size} height={size} viewBox="0 0 36 36">
    <circle cx={18} cy={18} r={14} fill={C.coin} stroke={INK} strokeWidth={3} />
    <ellipse cx={13} cy={12} rx={6} ry={4} fill={C.coinHi} opacity={0.8} />
  </svg>
);

/** 金币药丸：数字从 from 数到 n */
const CoinPill = ({k, n, frame, at, from = 0, y = 520, gold = false}:
  {k: number; n: number; frame: number; at: number; from?: number; y?: number; gold?: boolean}) => {
  const shown = Math.round(interpolate(frame, [at, at + 14], [from, n], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div data-safe style={{position: 'absolute', left: SLOT_X[k] - 75, top: y, width: 150, height: 72, boxSizing: 'border-box',
      background: gold ? '#fff' : C.paper, border: `${gold ? 4 : 3}px solid ${gold ? C.coin : INK}`, borderRadius: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontFamily: FONT, fontSize: 46, fontWeight: 800, color: gold ? GOLD : INK, ...NUM, ...enter(frame, at)}}>
      <Coin />{shown}
    </div>
  );
};

/** 投票旗：文字 30px，满足最小可见字号 */
const VoteFlag = ({k, yes, frame, at}: {k: number; yes: boolean; frame: number; at: number}) => {
  const rise = interpolate(frame, [at, at + 8], [24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = interpolate(frame, [at, at + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: SLOT_X[k] - 55, top: 604 + rise, width: 110, height: 92, opacity: o}}>
      <div style={{position: 'absolute', left: 8, top: 4, width: 5, height: 88, background: INK, borderRadius: 3}} />
      <div data-safe style={{position: 'absolute', left: 12, top: 4, width: 94, height: 48, boxSizing: 'border-box',
        background: yes ? C.yes : C.no, border: `3px solid ${INK}`, borderRadius: '4px 14px 14px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontSize: 30, fontWeight: 800, color: '#fff'}}>
        {yes ? '同意' : '反对'}
      </div>
    </div>
  );
};

const Banner = ({text, frame, at, top, tone = 'paper', size = 44}:
  {text: React.ReactNode; frame: number; at: number; top: number; tone?: 'paper' | 'gold' | 'yes' | 'no'; size?: number}) => {
  const border = tone === 'gold' ? C.coin : tone === 'yes' ? C.yes : tone === 'no' ? C.no : INK;
  return (
    <div data-safe style={{position: 'absolute', left: CX - 390, width: 780, boxSizing: 'border-box', top, textAlign: 'center',
      background: tone === 'paper' ? C.paper : '#fff', border: `4px solid ${border}`, borderRadius: 26, padding: '14px 16px', whiteSpace: 'pre-line',
      fontFamily: FONT, fontSize: size, fontWeight: 800, lineHeight: 1.3, ...NUM,
      color: tone === 'yes' ? '#0E7A4F' : tone === 'no' ? '#B42318' : INK, ...enter(frame, at)}}>
      {text}
    </div>
  );
};

const Crew = ({frame, present, proposer, expr}:
  {frame: number; present: number[]; proposer: number; expr: Record<number, Expression>}) => (
  <>
    {[0, 1, 2, 3, 4].map(k => {
      const on = present.includes(k);
      return (
        <div key={k} style={{position: 'absolute', left: SLOT_X[k] - 75, top: SLOT_FEET_Y - 230}}>
          <Pirate id={k} expression={on ? (expr[k] || 'neutral') : 'neutral'} state={on ? 'active' : 'absent'}
            crown={on && k === proposer} frame={frame} />
          <div data-safe style={{position: 'absolute', left: 47, top: 250, width: 56, height: 56, borderRadius: '50%',
            boxSizing: 'border-box', background: on ? PIRATE_COLORS[k] : '#B8B2A6', border: `4px solid ${INK}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT, fontSize: 32, fontWeight: 800, color: '#fff'}}>
            {PIRATE_NAMES[k]}
          </div>
        </div>
      );
    })}
  </>
);

// ---------- 01 钩子：第一帧就给出反常识结果 ----------
const spent = r5.dist.reduce((sum, n, k) => sum + (k === 0 ? 0 : n), 0);
const HookTitle = () => (
  <>只花{spent}枚金币{'\n'}船长拿走<span style={{color: GOLD, fontSize: 120, ...NUM}}>{r5.dist[0]}</span>枚</>
);

const Scene01 = ({frame, fps}: {frame: number; fps: number}) => {
  const vote = cueAt('s01-01', 0.55) * fps;
  return (
    <div>
      <Title text={<HookTitle />} frame={0} still />
      <Crew frame={frame} present={[0, 1, 2, 3, 4]} proposer={0}
        expr={{0: 'smug', 1: 'worried', 2: 'happy', 3: 'worried', 4: 'happy'}} />
      {r5.dist.map((n, k) => <CoinPill key={k} k={k} n={n} from={n} frame={frame} at={-14} gold={k === 0 || n > 0} />)}
      {frame >= vote && r5.votes.map((v, k) => <VoteFlag key={k} k={k} yes={v} frame={frame} at={vote + k * 4} />)}
      <Banner frame={frame} at={-14} top={1140} tone="gold"
        text={<>{spent}枚金币 → 买到 {r5.needed - 1} 票，方案通过</>} />
    </div>
  );
};

// ---------- 02 上集结论 ----------
const Scene02 = ({frame, fps}: {frame: number; fps: number}) => (
  <div>
    <Title text="上集结论" frame={frame} size={88} />
    <Banner frame={frame} at={cueAt('s02-01', 0.2) * fps} top={380} tone="gold" text="收买价 ＝ 下一轮能拿的 ＋ 1" />
    <Crew frame={frame} present={[2, 3, 4]} proposer={2} expr={{2: 'smug', 4: 'happy'}} />
    {r3.dist.map((n, i) => <CoinPill key={i} k={2 + i} n={n} from={n} frame={frame} at={-14} gold={i === 0} />)}
    <Banner frame={frame} at={cueAt('s02-01', 0.5) * fps} top={1140} tone="paper" size={40}
      text={`三人局：C ${r3.dist[0]}，D ${r3.dist[1]}，E ${r3.dist[2]}`} />
  </div>
);

// ---------- 03/04 通用回合：需要几票 → 下一轮分配 → 收买价 → 方案与投票 ----------
type Round = {
  title: string; cues: [string, string, string, string];
  present: number[]; result: GameResult; next: GameResult; nextLabel: string;
  verdict: (r: GameResult) => string;
};

/** 小牌：下一轮的分配（虚线）或收买价（选中为金色） */
const Tag = ({k, text, tone, frame, at}: {k: number; text: string; tone: 'ghost' | 'price' | 'chosen'; frame: number; at: number}) => (
  <div data-safe style={{position: 'absolute', left: SLOT_X[k] - 75, top: 520, width: 150, height: 72, boxSizing: 'border-box',
    background: tone === 'chosen' ? '#fff' : C.paper, borderRadius: 36,
    border: tone === 'ghost' ? `3px dashed ${INK}` : `${tone === 'chosen' ? 4 : 3}px solid ${tone === 'chosen' ? C.coin : INK}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT, fontSize: 40, fontWeight: 800, color: tone === 'chosen' ? GOLD : INK,
    ...NUM, ...enter(frame, at)}}>
    {text}
  </div>
);

const RoundScene = ({frame, fps, round}: {frame: number; fps: number; round: Round}) => {
  const [need, next, price, plan] = round.cues.map(id => cueAt(id) * fps);
  const {result, next: nr, present} = round;
  const proposer = present[0];
  const bought = present.filter((_, i) => i > 0 && result.dist[i] > 0);
  const others = present.slice(1);
  const phase = frame >= plan ? 'plan' : frame >= price ? 'price' : frame >= next ? 'next' : 'need';
  const top = {
    need: `${PIRATE_NAMES[proposer]} 需要 ${result.needed} 票：自己 1 票，再买 ${result.needed - 1} 票`,
    next: `如果 ${PIRATE_NAMES[proposer]} 下海 → ${round.nextLabel}`,
    price: '收买价 ＝ 下一轮 ＋ 1，挑最便宜的',
    plan: `买下 ${bought.map(k => PIRATE_NAMES[k]).join('、')}，每人 ${result.dist[present.indexOf(bought[0])]} 枚`,
  }[phase];
  return (
    <div>
      <Title text={round.title} frame={frame} size={88} />
      <Banner key={phase} frame={frame} at={{need, next, price, plan}[phase]} top={380} size={40}
        tone={phase === 'plan' ? 'gold' : 'paper'} text={top} />
      <Crew frame={frame} present={present} proposer={proposer}
        expr={Object.fromEntries(present.map((k, i) => [k, i === 0 ? 'smug' : phase === 'plan' && result.dist[i] > 0 ? 'happy' : 'worried']))} />
      {phase === 'next' && others.map((k, i) => (
        <Tag key={k} k={k} text={`${nr.dist[i]}`} tone="ghost" frame={frame} at={next + i * 5} />
      ))}
      {phase === 'price' && others.map((k, i) => (
        <Tag key={k} k={k} text={`要${result.prices[i + 1]}`} tone={bought.includes(k) ? 'chosen' : 'price'}
          frame={frame} at={price + i * 5} />
      ))}
      {phase === 'plan' && result.dist.map((n, i) => (
        <CoinPill key={present[i]} k={present[i]} n={n} frame={frame} at={plan + i * 4} gold={i === 0} />
      ))}
      {phase === 'plan' && result.votes.map((v, i) => (
        <VoteFlag key={present[i]} k={present[i]} yes={v} frame={frame} at={plan + 20 + i * 4} />
      ))}
      {phase === 'next' && (
        <Banner frame={frame} at={next + 10} top={1140} tone="paper" size={40} text="虚线：下一轮各自能拿的" />
      )}
      {phase === 'plan' && frame >= plan + 40 && (
        <Banner frame={frame} at={plan + 40} top={1140} tone="yes" text={round.verdict(result)} />
      )}
    </div>
  );
};

const ROUNDS: Record<string, Round> = {
  '03': {title: '四人局', cues: ['s03-01', 's03-02', 's03-03', 's03-04'], present: [1, 2, 3, 4],
    result: r4, next: r3, nextLabel: '三人局',
    verdict: r => `${r.yes}/${r.n}票 ≥ 一半 ✓ 上集答案：买D`},
  '04': {title: '五人局', cues: ['s04-01', 's04-02', 's04-03', 's04-04'], present: [0, 1, 2, 3, 4],
    result: r5, next: r4, nextLabel: '四人局',
    verdict: r => `${r.yes}/${r.n}票 ≥ 一半 ✓ 船长留 ${r.dist[0]} 枚`},
};
const Scene03 = ({frame, fps}: {frame: number; fps: number}) => <RoundScene frame={frame} fps={fps} round={ROUNDS['03']} />;
const Scene04 = ({frame, fps}: {frame: number; fps: number}) => <RoundScene frame={frame} fps={fps} round={ROUNDS['04']} />;

// ---------- 05 规律 + 彩蛋 ----------
const SUMMARY: [string, string][] = [
  ['2人', `D ${r2.dist[0]}`], ['3人', `C ${r3.dist[0]}`], ['4人', `B ${r4.dist[0]}`], ['5人', `A ${r5.dist[0]}`],
];
const Scene05 = ({frame, fps}: {frame: number; fps: number}) => {
  const twist = cueAt('s05-02') * fps;
  return (
    <div>
      <Title text={'只收买\n下一轮拿0的人'} frame={frame} size={88} />
      <div style={{position: 'absolute', left: CX - 390, top: 470, width: 780, display: 'grid',
        gridTemplateColumns: '1fr 1fr', gap: 16, ...enter(frame, 0)}}>
        {SUMMARY.map(([n, v]) => (
          <div key={n} data-safe style={{background: C.paper, border: `3px solid ${INK}`, borderRadius: 20, padding: '14px 12px',
            textAlign: 'center', fontFamily: FONT, fontSize: 40, fontWeight: 800, color: INK, ...NUM}}>{n}：{v}</div>
        ))}
      </div>
      {frame >= twist && (
        <>
          <Banner frame={frame} at={twist} top={760} tone="gold"
            text={<>必须“超过”一半？{'\n'}船长最多 <span style={{color: GOLD}}>{r5s.dist[0]}</span> 枚</>} />
          <Banner frame={frame} at={twist + 30} top={1140} tone="paper" text="为什么？评论区见" />
        </>
      )}
    </div>
  );
};

const SCENES: Record<string, React.FC<{frame: number; fps: number}>> = {
  '01': Scene01, '02': Scene02, '03': Scene03, '04': Scene04, '05': Scene05,
};

export const PirateGoldEp2Video: React.FC<{debugAudit?: boolean; showSafeArea?: boolean}> = ({debugAudit = false, showSafeArea = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ref = React.useRef<HTMLDivElement>(null);
  useFrameAudit(ref, frame, debugAudit);
  const seconds = frame / fps;
  let idx = RT.scenes.findIndex(s => seconds >= s.start && seconds < s.end);
  if (idx < 0) idx = RT.scenes.length - 1;
  const sc = RT.scenes[idx];
  const Scene = SCENES[sc.id];
  // 句间短暂停顿时保留上一句字幕，避免闪烁
  const cue = [...RT.captions].reverse().find(c => c.scene === sc.id && seconds >= c.start && seconds < c.end + 0.6);
  return (
    <AbsoluteFill ref={ref} style={{background: C.sky, fontFamily: FONT}}>
      <Background frame={frame} />
      <SeriesTag />
      <Scene frame={Math.round(frame - sc.start * fps)} fps={fps} />
      {cue && (
        <div data-safe data-caption style={{position: 'absolute', left: SAFE.x0, top: 1360, width: SAFE.x1 - SAFE.x0, minHeight: 124,
          boxSizing: 'border-box', background: 'rgba(255,255,255,0.94)', border: '1px solid #E5DFCF', borderRadius: 28,
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
          <rect x={SAFE.x0} y={SAFE.y0} width={SAFE.x1 - SAFE.x0} height={SAFE.y1 - SAFE.y0} fill="none" stroke="#C72C44" strokeDasharray="12 8" />
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const PirateGoldEp2Cover: React.FC = () => (
  <AbsoluteFill style={{background: C.sky, fontFamily: FONT}}>
    <Background frame={0} />
    <SeriesTag />
    <Title text={<HookTitle />} frame={0} still />
    <Crew frame={0} present={[0, 1, 2, 3, 4]} proposer={0} expr={{0: 'smug', 1: 'worried', 2: 'happy', 3: 'worried', 4: 'happy'}} />
    {r5.dist.map((n, k) => <CoinPill key={k} k={k} n={n} frame={30} at={0} gold={k === 0 || n > 0} />)}
    <Banner frame={30} at={0} top={1140} tone="gold" text={content.coverSubtitle} size={40} />
  </AbsoluteFill>
);
