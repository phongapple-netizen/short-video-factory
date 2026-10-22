import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, PIRATE_COLORS, PIRATE_NAMES, RESULTS} from '../pirate-gold/model';
import {Pirate, Expression} from '../pirate-gold/Pirate';
import {CX, SAFE, SLOT_X, SLOT_FEET_Y} from '../pirate-gold/layout';
import {useFrameAudit} from '../../shared/story';
import content from './content.json';
import runtime from './runtime.json';

// 第1集：钩子→规则→倒推→两人局→三人局→收买价与悬念。
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

const {r2, r3, r5} = RESULTS;

/** cue 在本场景内的开始秒数；frac 取 cue 时长的比例，用于一句话内部的动作。 */
const cueAt = (id: string, frac = 0): number => {
  const cue = RT.captions.find(c => c.id === id);
  if (!cue) throw new Error(`PirateGoldEp1 missing cue ${id}`);
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
      background: tone === 'paper' ? C.paper : '#fff', border: `4px solid ${border}`, borderRadius: 26, padding: '14px 16px',
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
const HookTitle = () => (
  <>100枚金币{'\n'}船长独吞<span style={{color: GOLD, fontSize: 120, ...NUM}}>{r5.dist[0]}</span>枚</>
);

const CoinPile = ({frame}: {frame: number}) => {
  // 第一帧已有半堆金币，随后继续堆高
  const count = Math.round(interpolate(frame, [0, 24], [5, 9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const spots = [[20, 70], [56, 70], [92, 70], [38, 44], [74, 44], [110, 70], [56, 18], [92, 44], [128, 44]];
  return (
    <svg style={{position: 'absolute', left: SLOT_X[0] - 40, top: 950}} width={190} height={120} viewBox="0 0 190 120">
      {spots.slice(0, count).map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <ellipse cx={18} cy={18} rx={22} ry={14} fill={C.coin} stroke={INK} strokeWidth={3.5} />
          <ellipse cx={12} cy={13} rx={8} ry={4} fill={C.coinHi} opacity={0.85} />
        </g>
      ))}
    </svg>
  );
};

const Scene01 = ({frame, fps}: {frame: number; fps: number}) => {
  const ask = cueAt('s01-02') * fps;
  const asked = frame >= ask;
  return (
    <div>
      <Title text={<HookTitle />} frame={0} still />
      <Crew frame={frame} present={[0, 1, 2, 3, 4]} proposer={0}
        expr={asked ? {0: 'smug', 1: 'worried', 2: 'happy', 3: 'worried', 4: 'happy'} : {0: 'smug', 1: 'worried', 3: 'worried'}} />
      {r5.dist.map((n, k) => <CoinPill key={k} k={k} n={n} from={k === 0 ? 60 : n} frame={frame} at={-14} gold={k === 0} />)}
      <CoinPile frame={frame} />
      {asked && r5.votes.map((v, k) => <VoteFlag key={k} k={k} yes={v} frame={frame} at={ask + k * 4} />)}
      {asked && (
        <Banner frame={frame} at={ask + 26} top={1140} tone="gold"
          text={<>{r5.yes}/{r5.n}票 ≥ 一半 → <span style={{color: GOLD}}>通过？！</span></>} />
      )}
    </div>
  );
};

// ---------- 02 规则 ----------
const RULES = [
  {cue: 's02-01', frac: 0, main: '① 船长提方案，全员投票', sub: '提方案的人自己也投票'},
  {cue: 's02-01', frac: 0.45, main: '② 赞成 ≥ 一半 → 通过', sub: '否则提议者下海，下一位接着提'},
  {cue: 's02-02', frac: 0, main: '③ 保命 ＞ 多拿钱 ＞ 看别人下海', sub: '钱一样多时，宁愿看别人下海'},
];
const Scene02 = ({frame, fps}: {frame: number; fps: number}) => (
  <div>
    <Title text="规则只有三条" frame={frame} size={88} />
    {RULES.map((r, i) => {
      const at = cueAt(r.cue, r.frac) * fps;
      if (frame < at) return null;
      return (
        <div key={i} style={{position: 'absolute', ...SIDES, top: 420 + i * 230,
          background: i === 2 ? '#fff' : C.paper, border: `4px solid ${i === 2 ? C.coin : INK}`, borderRadius: 28,
          padding: '24px 28px', ...enter(frame, at)}}>
          <div data-safe style={{fontFamily: FONT, fontSize: 46, fontWeight: 800, color: INK}}>{r.main}</div>
          <div data-safe style={{fontFamily: FONT, fontSize: 34, fontWeight: 500, color: C.muted, marginTop: 8}}>{r.sub}</div>
        </div>
      );
    })}
  </div>
);

// ---------- 03 倒着推 ----------
const Scene03 = ({frame, fps}: {frame: number; fps: number}) => {
  const outAt = [0.3, 0.45, 0.6].map(f => cueAt('s03-01', f) * fps);
  const arrow = interpolate(frame, [cueAt('s03-01', 0.05) * fps, cueAt('s03-01', 0.3) * fps], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
  const gone = (k: number) => k < 3 && frame >= outAt[k];
  return (
    <div>
      <Title text={'别从船长想\n倒着推'} frame={frame} size={88} />
      {[0, 1, 2, 3, 4].map(k => (
        <div key={k} style={{position: 'absolute', left: SLOT_X[k] - 55, top: 500, width: 110, height: 110}}>
          <div data-safe style={{width: 110, height: 110, borderRadius: '50%', boxSizing: 'border-box',
            background: gone(k) ? '#B8B2A6' : PIRATE_COLORS[k], border: `4px solid ${INK}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT, fontSize: 52, fontWeight: 800, color: '#fff'}}>{PIRATE_NAMES[k]}</div>
          {k < 3 && frame >= outAt[k] && (
            <div style={{position: 'absolute', left: 0, top: 0, width: 110, height: 110, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 96, fontWeight: 800,
              color: C.no, ...pop(frame, outAt[k])}}>✕</div>
          )}
        </div>
      ))}
      {/* 从 E 指向 A 的倒推箭头 */}
      <svg style={{position: 'absolute', left: SLOT_X[0], top: 630}} width={SLOT_X[4] - SLOT_X[0]} height={40}>
        {arrow > 0 && <line x1={SLOT_X[4] - SLOT_X[0]} y1={20} x2={(SLOT_X[4] - SLOT_X[0]) * (1 - arrow) + 24} y2={20}
          stroke={GOLD} strokeWidth={8} strokeLinecap="round" />}
        {arrow > 0.98 && <path d="M0,20 L28,4 L28,36 Z" fill={GOLD} />}
      </svg>
      <Crew frame={frame} present={[0, 1, 2, 3, 4].filter(k => !gone(k))} proposer={frame >= outAt[2] ? 3 : 0}
        expr={{3: 'smug', 4: 'worried'}} />
    </div>
  );
};

// ---------- 04 两人局 ----------
const Scene04 = ({frame, fps}: {frame: number; fps: number}) => {
  const plan = cueAt('s04-01', 0.3) * fps, vote = cueAt('s04-02') * fps;
  return (
    <div>
      <Title text="两人局" frame={frame} size={88} />
      <Banner frame={frame} at={4} top={380} text="只剩 D、E，D 提方案" size={40} />
      <Crew frame={frame} present={[3, 4]} proposer={3} expr={{3: 'smug', 4: 'worried'}} />
      {frame >= plan && r2.dist.map((n, i) => <CoinPill key={i} k={3 + i} n={n} frame={frame} at={plan + i * 6} gold={i === 0} />)}
      {frame >= vote && r2.votes.map((v, i) => <VoteFlag key={i} k={3 + i} yes={v} frame={frame} at={vote + i * 5} />)}
      {frame >= vote + 15 && (
        <Banner frame={frame} at={vote + 15} top={1140} tone="yes"
          text={`${r2.yes}/${r2.n}票，正好一半 ✓ 通过`} />
      )}
    </div>
  );
};

// ---------- 05 三人局 ----------
const Scene05 = ({frame, fps}: {frame: number; fps: number}) => {
  const [need, think, buy, zero, plan] = ['s05-01', 's05-02', 's05-03', 's05-04', 's05-05'].map(id => cueAt(id) * fps);
  const t = frame;
  const eExpr: Expression = t >= plan ? 'happy' : t >= zero ? 'smug' : t >= buy ? 'happy' : 'worried';
  return (
    <div>
      <Title text="三人局" frame={frame} size={88} />
      {t < think && <Banner frame={frame} at={need} top={380} text={`C 需要 ${r3.needed} 票：自己 1 票，再拉 1 票`} size={40} />}
      <Crew frame={frame} present={[2, 3, 4]} proposer={2} expr={{2: 'smug', 3: 'neutral', 4: eExpr}} />

      {/* E 的思考气泡：C 下海后的两人局 */}
      {t >= think && t < buy && (
        <div style={{position: 'absolute', left: 435, top: 380, width: 480, boxSizing: 'border-box',
          background: '#fff', border: `4px solid ${INK}`, borderRadius: 28, padding: '18px 20px', ...enter(frame, think)}}>
          <div data-safe style={{fontFamily: FONT, fontSize: 34, fontWeight: 800, color: GOLD}}>想一想</div>
          <div data-safe style={{fontFamily: FONT, fontSize: 38, fontWeight: 800, color: INK, marginTop: 6, ...NUM}}>
            C 下海 → D {r2.dist[0]}，E {r2.dist[1]}
          </div>
          <div style={{position: 'absolute', left: SLOT_X[4] - 435 - 14, bottom: -18, width: 28, height: 28, background: '#fff',
            borderRight: `4px solid ${INK}`, borderBottom: `4px solid ${INK}`, transform: 'rotate(45deg)'}} />
        </div>
      )}

      {/* 收买价：E 下一轮 0 枚，所以 0+1=1 */}
      {t >= buy && t < plan && (
        <Banner frame={frame} at={buy} top={400} tone="gold" size={40}
          text={<>E 的收买价：{r2.dist[1]} + 1 = <span style={{color: GOLD}}>{r3.prices[2]}</span> 枚</>} />
      )}
      {t >= buy && t < zero && <CoinPill k={4} n={r3.prices[2]!} from={r3.prices[2]!} frame={frame} at={buy + 6} gold />}
      {t >= zero && t < plan && (
        <>
          <CoinPill k={4} n={0} frame={frame} at={zero} />
          <Banner frame={frame} at={zero + 8} top={1140} tone="no" size={40}
            text="给0枚：和C下海一样多 → E 投反对" />
        </>
      )}

      {t >= plan && r3.dist.map((n, i) => <CoinPill key={i} k={2 + i} n={n} frame={frame} at={plan + i * 5} gold={i === 0} />)}
      {t >= plan && r3.votes.map((v, i) => <VoteFlag key={i} k={2 + i} yes={v} frame={frame} at={plan + 15 + i * 5} />)}
      {t >= plan + 30 && (
        <Banner frame={frame} at={plan + 30} top={1140} tone="yes"
          text={`C ${r3.dist[0]}，D ${r3.dist[1]}，E ${r3.dist[2]}：${r3.yes}/${r3.n}票 ✓`} />
      )}
    </div>
  );
};

// ---------- 06 收买价 + 下集悬念 ----------
const Scene06 = ({frame, fps}: {frame: number; fps: number}) => {
  const ask = cueAt('s06-02') * fps;
  return (
    <div>
      <Title text={'收买价＝\n下一轮能拿的＋1'} frame={frame} size={88} />
      {frame < ask && (
        <>
          <Banner frame={frame} at={cueAt('s06-01', 0.35) * fps} top={462} tone="gold"
            text={<>E：下一轮 {r2.dist[1]} 枚 → 收买价 <span style={{color: GOLD}}>{r3.prices[2]}</span> 枚</>} size={40} />
          <Crew frame={frame} present={[2, 3, 4]} proposer={2} expr={{2: 'smug', 4: 'happy'}} />
          {r3.dist.map((n, i) => <CoinPill key={i} k={2 + i} n={n} frame={frame} at={-14} y={604} />)}
        </>
      )}
      {frame >= ask && (
        <>
          <Banner frame={frame} at={ask} top={480} tone="paper" text="四人局：B 该收买谁？" />
          <Crew frame={frame} present={[1, 2, 3, 4]} proposer={1} expr={{1: 'smug', 2: 'worried', 3: 'worried', 4: 'worried'}} />
          {[2, 3, 4].map((k, i) => (
            <div key={k} data-safe style={{position: 'absolute', left: SLOT_X[k] - 40, top: 600, width: 80, height: 80,
              borderRadius: '50%', background: '#fff', border: `4px solid ${INK}`, boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT, fontSize: 48, fontWeight: 800, color: GOLD, ...pop(frame, ask + 10 + i * 5)}}>?</div>
          ))}
          <Banner frame={frame} at={ask + 30} top={1140} tone="gold" text="评论区写答案 · 下集揭晓" />
        </>
      )}
    </div>
  );
};

const SCENES: Record<string, React.FC<{frame: number; fps: number}>> = {
  '01': Scene01, '02': Scene02, '03': Scene03, '04': Scene04, '05': Scene05, '06': Scene06,
};

export const PirateGoldEp1Video: React.FC<{debugAudit?: boolean; showSafeArea?: boolean}> = ({debugAudit = false, showSafeArea = false}) => {
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

export const PirateGoldEp1Cover: React.FC = () => (
  <AbsoluteFill style={{background: C.sky, fontFamily: FONT}}>
    <Background frame={0} />
    <SeriesTag />
    <Title text={<HookTitle />} frame={0} still />
    <Crew frame={0} present={[0, 1, 2, 3, 4]} proposer={0} expr={{0: 'smug', 1: 'worried', 2: 'happy', 3: 'worried', 4: 'happy'}} />
    {r5.dist.map((n, k) => <CoinPill key={k} k={k} n={n} frame={30} at={0} gold={k === 0} />)}
    <CoinPile frame={30} />
    <Banner frame={30} at={0} top={1140} tone="gold" text={content.coverSubtitle} />
  </AbsoluteFill>
);
