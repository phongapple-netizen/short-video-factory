import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, PIRATE_COLORS, PIRATE_NAMES, PIRATE_ROLES} from './model';
import {Pirate, Expression} from './Pirate';
import {CX, SAFE, SLOT_X, SLOT_FEET_Y, PIRATE_W, PIRATE_H, S08} from './layout';
import runtime from './runtime.json';
import sentences from './sentences.json';

const FONT = "'Noto Sans CJK SC','Noto Sans SC',sans-serif";
// ZCOOL KuaiLe 有93个分块，浏览器端加载超时；按提示词 fallback 用 Noto Sans SC 700
const TITLE_FONT = FONT;
const W = 1080, H = 1920;
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const NUM = {fontVariantNumeric: 'tabular-nums'} as const;
const INK = '#1B2540';

type Rt = {scenes: {id: string; start: number; end: number}[]; duration: number; durationInFrames: number;
  captions?: {id: string; scene: string; start: number; end: number; text: string; audio?: string | null}[]};
const RT = runtime as unknown as Rt;
type SpokenLine = {start: number; end: number; text: string};
const spokenLines = sentences as SpokenLine[];
/** 将动画节点绑定到口播句子；TTS重生成时无需手工修改动画秒数。 */
const speechAt = (sceneId: string, fragment: string, offset = 0): number => {
  const sc = RT.scenes.find(s => s.id === sceneId);
  if (!sc) throw new Error(`PirateGold missing scene ${sceneId}`);
  const line = spokenLines.find(s => s.start >= sc.start && s.start < sc.end && s.text.includes(fragment));
  if (!line) throw new Error(`PirateGold missing spoken cue ${sceneId}/${fragment}`);
  return Math.max(0, line.start - sc.start + offset);
};

// 全片单轨配音（时间轴已对齐，消除多 Audio 组件的同步/重叠风险）
const GlobalAudio = () => (
  <Audio src={staticFile('assets/pirate-gold/audio-full.mp3')} />
);

const enter = (frame: number, at: number) => {
  const o = interpolate(frame, [at, at + 15], [0, 1], {easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(frame, [at, at + 15], [24, 0], {easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {opacity: o, transform: `translateY(${y}px)`};
};

const pop = (frame: number, at: number) => {
  const s = spring({frame: frame - at, fps: 30, config: {damping: 10, stiffness: 180}});
  return {opacity: interpolate(frame, [at, at + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    transform: `scale(${Math.max(0.01, s)})`};
};

// ---------- 背景 ----------
const Background = ({frame}: {frame: number}) => {
  const w1 = Math.sin(frame / 40) * 20;
  const w2 = Math.sin(frame / 55 + 2) * 24;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 980, background: C.sky}} />
      <div style={{position: 'absolute', left: 830, top: 120, width: 160, height: 160,
        background: C.sun, borderRadius: '50%', border: `4px solid ${INK}`}} />
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
      {/* 甲板 */}
      <div style={{position: 'absolute', left: 100, top: 930, width: 880, height: 180,
        background: C.deck, border: `4px solid ${INK}`, borderRadius: 18}} />
      {[990, 1050].map(y => (
        <div key={y} style={{position: 'absolute', left: 104, top: y, width: 872, height: 4, background: C.deckLine, opacity: 0.7}} />
      ))}
    </div>
  );
};

// ---------- 章节标题 ----------
const ChapterHead = ({label, title, frame}: {label: string; title: string; frame: number}) => (
  <React.Fragment>
    <div style={{position: 'absolute', left: SAFE.x0, right: W - SAFE.x1, top: 190, textAlign: 'center',
      fontFamily: FONT, fontSize: 36, fontWeight: 500, color: C.muted, ...enter(frame, 0)}}>{label}</div>
    <div style={{position: 'absolute', left: SAFE.x0, right: W - SAFE.x1, top: 230, textAlign: 'center',
      fontFamily: TITLE_FONT, fontSize: 96, fontWeight: 700, color: INK, ...enter(frame, 2)}}>{title}</div>
  </React.Fragment>
);

// ---------- 金币药丸 ----------
const CoinPill = ({x, y, n, frame, at}: {x: number; y: number; n: number; frame: number; at: number}) => {
  const shown = Math.round(interpolate(frame, [at, at + 12], [0, n], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div style={{position: 'absolute', left: x - 75, top: y, width: 150, height: 72,
      background: C.paper, border: `3px solid ${INK}`, borderRadius: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, ...enter(frame, at)}}>
      <svg width={36} height={36} viewBox="0 0 36 36">
        <circle cx={18} cy={18} r={14} fill={C.coin} stroke={INK} strokeWidth={3} />
        <ellipse cx={13} cy={12} rx={6} ry={4} fill={C.coinHi} opacity={0.8} />
      </svg>
      <span style={{fontFamily: FONT, fontSize: 46, fontWeight: 700, color: INK, ...NUM}}>{shown}</span>
    </div>
  );
};

// ---------- 场景 01：标题 ----------
const Scene01 = ({frame, fps}: {frame: number; fps: number}) => {
  const t = frame / fps;
  return (
    <div>
      <div style={{position: 'absolute', left: SAFE.x0, right: W - SAFE.x1, top: 300, textAlign: 'center',
        fontFamily: FONT, fontSize: 52, fontWeight: 500, color: C.muted, ...enter(frame, 0)}}>
        五个海盗
      </div>
      <div style={{position: 'absolute', left: SAFE.x0, right: W - SAFE.x1, top: 380, textAlign: 'center',
        fontFamily: TITLE_FONT, fontSize: 130, fontWeight: 700, color: INK, ...enter(frame, 30)}}>
        分金币
      </div>
      {t >= 4 && (
        <div style={{position: 'absolute', left: 140, right: 140, top: 600, textAlign: 'center',
          background: '#fff', border: `4px solid #F2B632`, borderRadius: 28, padding: '24px 16px',
          fontFamily: FONT, fontSize: 52, fontWeight: 700, color: INK, ...enter(frame, 4 * fps)}}>
          第一个海盗拿 <span style={{color: '#B87A00', ...NUM}}>98</span> 枚？
        </div>
      )}
      {/* 宝箱 */}
      {t >= 6 && (
        <div style={{position: 'absolute', left: CX - 130, top: 800, ...pop(frame, 6 * fps)}}>
          <svg width={260} height={200} viewBox="0 0 260 200">
            <rect x={20} y={70} width={220} height={110} rx={16} fill={C.deck} stroke={INK} strokeWidth={5} />
            <path d="M20,86 Q130,-10 240,86 L240,100 L20,100 Z" fill={C.deckLine} stroke={INK} strokeWidth={5} />
            <rect x={115} y={70} width={30} height={44} rx={8} fill="#F2B632" stroke={INK} strokeWidth={4} />
            {[60, 110, 160, 205].map(x => (
              <g key={x}>
                <circle cx={x} cy={52} r={18} fill={C.coin} stroke={INK} strokeWidth={3.5} />
                <ellipse cx={x - 5} cy={45} rx={7} ry={5} fill={C.coinHi} opacity={0.85} />
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};

// ---------- 场景 02：规则① 资历 ----------
const Scene02 = ({frame, fps}: {frame: number; fps: number}) => (
  <div>
    <ChapterHead label="规则" title="① 按资历排" frame={frame} />
    {[0, 1, 2, 3, 4].map(k => {
      const at = (2 + k * 0.9) * fps;
      return (
        <div key={k} style={{position: 'absolute', left: SLOT_X[k] - 75, top: SLOT_FEET_Y - 230,
          transformOrigin: '75px 230px', ...pop(frame, at)}}>
          <Pirate id={k} expression="happy" state="active" crown={k === 0} frame={frame} />
          <div style={{position: 'absolute', left: -10, top: 234, width: 170, textAlign: 'center',
            fontFamily: FONT, fontSize: 30, fontWeight: 700, color: INK, whiteSpace: 'nowrap'}}>
            {PIRATE_NAMES[k]}·{PIRATE_ROLES[k]}
          </div>
        </div>
      );
    })}
    {frame / fps >= 7 && (
      <div style={{position: 'absolute', left: 195, right: 195, top: 1180, textAlign: 'center',
        background: C.paper, border: `3px solid ${INK}`, borderRadius: 24, padding: '18px 12px',
        fontFamily: FONT, fontSize: 40, fontWeight: 500, color: INK, ...enter(frame, 7 * fps)}}>
        资历最高的先提方案
      </div>
    )}
  </div>
);

// ---------- 场景 03：规则② 投票 ----------
const Scene03 = ({frame, fps}: {frame: number; fps: number}) => {
  const t = frame / fps;
  // 环形进度 0→50%
  const prog = interpolate(frame, [1.5 * fps, 6 * fps], [0, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
  const R = 110, CIRC = 2 * Math.PI * R;
  return (
    <div>
      <ChapterHead label="规则" title="② 投票" frame={frame} />
      <div style={{position: 'absolute', left: CX - 130, top: 480, ...enter(frame, 1 * fps)}}>
        <svg width={260} height={260} viewBox="0 0 260 260">
          <circle cx={130} cy={130} r={R} fill="none" stroke="#E5DFCF" strokeWidth={26} />
          <circle cx={130} cy={130} r={R} fill="none" stroke={C.yes} strokeWidth={26} strokeLinecap="round"
            strokeDasharray={`${CIRC * prog} ${CIRC}`} transform="rotate(-90 130 130)" />
          <text x={130} y={122} textAnchor="middle" fontFamily={FONT} fontSize={56} fontWeight={700} fill={INK}>50%</text>
          <text x={130} y={162} textAnchor="middle" fontFamily={FONT} fontSize={30} fontWeight={500} fill={C.muted}>即通过</text>
        </svg>
      </div>
      {t >= 5 && (
        <div style={{position: 'absolute', left: 195, right: 195, top: 780, textAlign: 'center',
          fontFamily: FONT, fontSize: 52, fontWeight: 700, color: INK, ...NUM, ...enter(frame, 5 * fps)}}>
          3/5 票即通过
        </div>
      )}
      {/* 五个小头像 + 旗 */}
      {t >= 6 && [0, 1, 2, 3, 4].map((k, i) => {
        const at = (6 + i * 0.4) * fps;
        const yes = i < 3;
        return (
          <div key={k} style={{position: 'absolute', left: SLOT_X[k] - 55, top: 950, ...pop(frame, at)}}>
            <div style={{width: 110, height: 110, borderRadius: '50%', background: PIRATE_COLORS[k],
              border: `4px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT, fontSize: 52, fontWeight: 700, color: '#fff'}}>{PIRATE_NAMES[k]}</div>
            <svg width={60} height={70} viewBox="0 0 60 70" style={{position: 'absolute', left: 70, top: -50}}>
              <line x1={10} y1={68} x2={10} y2={6} stroke={INK} strokeWidth={4} strokeLinecap="round" />
              <path d="M10,6 L54,6 L46,18 L54,30 L10,30 Z" fill={yes ? C.yes : C.no} stroke={INK} strokeWidth={2.5} />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

// ---------- 场景 04：规则③ 下海 ----------
const Scene04 = ({frame, fps}: {frame: number; fps: number}) => {
  const t = frame / fps;
  // A 下沉：5s 开始
  const sink = interpolate(frame, [5 * fps, 7.5 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.quad});
  const flip = interpolate(frame, [5 * fps, 7.5 * fps], [0, 180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div>
      <ChapterHead label="规则" title="③ 下海" frame={frame} />
      {t >= 2.5 && (
        <div style={{position: 'absolute', left: 195, right: 195, top: 440, textAlign: 'center',
          background: '#fff', border: `3px solid ${C.no}`, borderRadius: 24, padding: '16px 12px',
          fontFamily: FONT, fontSize: 44, fontWeight: 700, color: C.no, ...enter(frame, 2.5 * fps)}}>
          方案被否决
        </div>
      )}
      {/* A 下沉翻转 */}
      <div style={{position: 'absolute', left: SLOT_X[0] - 75,
        top: SLOT_FEET_Y - 230 + sink * 260, opacity: 1 - sink * 0.7,
        transform: `rotate(${flip}deg)`, transformOrigin: '75px 115px'}}>
        <Pirate id={0} expression="worried" state="active" frame={frame} />
      </div>
      {t >= 5 && (
        <div style={{position: 'absolute', left: SLOT_X[0] - 60, top: 1050, fontFamily: FONT,
          fontSize: 90, fontWeight: 700, color: C.no, ...pop(frame, 5 * fps)}}>✕</div>
      )}
      {/* B 戴上皇冠 */}
      {t >= 6.5 && [1, 2, 3, 4].map(k => (
        <div key={k} style={{position: 'absolute', left: SLOT_X[k] - 75, top: SLOT_FEET_Y - 230}}>
          <Pirate id={k} expression={k === 1 ? 'smug' : 'neutral'} state="active" crown={k === 1} frame={frame} />
        </div>
      ))}
      {t >= 7.5 && (
        <div style={{position: 'absolute', left: 195, right: 195, top: 1180, textAlign: 'center',
          background: C.paper, border: `3px solid ${INK}`, borderRadius: 24, padding: '18px 12px',
          fontFamily: FONT, fontSize: 40, fontWeight: 500, color: INK, ...enter(frame, 7.5 * fps)}}>
          提议者下海，下一位继续提
        </div>
      )}
    </div>
  );
};

// ---------- 场景 05：规则④ 偏好 ----------
const PRIORITIES = [
  {icon: '🛡', text: '保命', sub: '先活下去'},
  {icon: '🪙', text: '金币', sub: '再多拿钱'},
  {icon: '👁', text: '看别人下海', sub: '收益一样时'},
];
const Scene05 = ({frame, fps}: {frame: number; fps: number}) => {
  const t = frame / fps;
  return (
    <div>
      <ChapterHead label="规则" title="④ 偏好" frame={frame} />
      {t >= 1.5 && (
        <div style={{position: 'absolute', left: 240, right: 240, top: 430, textAlign: 'center',
          background: '#fff', border: `3px solid ${INK}`, borderRadius: 24, padding: '14px 8px',
          fontFamily: FONT, fontSize: 40, fontWeight: 700, color: INK, ...enter(frame, 1.5 * fps)}}>
          所有海盗绝顶聪明
        </div>
      )}
      {PRIORITIES.map((p, i) => {
        const at = (3 + i * 1.6) * fps;
        if (t < 3 + i * 1.6) return null;
        return (
          <React.Fragment key={p.text}>
            <div style={{position: 'absolute', left: 150, right: 150, top: 560 + i * 170,
              background: i === 0 ? '#fff' : C.paper,
              border: i === 0 ? `4px solid #F2B632` : `3px solid ${INK}`,
              borderRadius: 28, padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 24,
              ...enter(frame, at)}}>
              <span style={{fontSize: 64}}>{p.icon}</span>
              <div>
                <div style={{fontFamily: FONT, fontSize: 52, fontWeight: 700, color: INK}}>{p.text}</div>
                <div style={{fontFamily: FONT, fontSize: 34, fontWeight: 500, color: C.muted}}>{p.sub}</div>
              </div>
              <span style={{marginLeft: 'auto', fontFamily: FONT, fontSize: 44, fontWeight: 700, color: '#B87A00', ...NUM}}>
                {i + 1}
              </span>
            </div>
            {i < 2 && t >= 3 + (i + 1) * 1.6 - 0.4 && (
              <div style={{position: 'absolute', left: 0, right: 0, top: 560 + i * 170 + 138,
                textAlign: 'center', fontSize: 44, color: INK, ...enter(frame, (3 + (i + 1) * 1.6 - 0.4) * fps)}}>∨</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------- 场景 06：倒着推 ----------
const Scene06 = ({frame, fps}: {frame: number; fps: number}) => {
  const t = frame / fps;
  return (
    <div>
      <div style={{position: 'absolute', left: SAFE.x0, right: W - SAFE.x1, top: 280, textAlign: 'center',
        fontFamily: TITLE_FONT, fontSize: 110, fontWeight: 700, color: INK, ...enter(frame, 0)}}>
        ← 倒着推
      </div>
      <div style={{position: 'absolute', left: SAFE.x0, right: W - SAFE.x1, top: 440, textAlign: 'center',
        fontFamily: FONT, fontSize: 40, fontWeight: 500, color: C.muted, ...enter(frame, 20)}}>
        别从 A 开始，从最后面看
      </div>
      {/* 5→2 人数条 */}
      {[5, 4, 3, 2].map((n, i) => {
        const at = (2 + i * 1.2) * fps;
        if (t < 2 + i * 1.2) return null;
        return (
          <div key={n} style={{position: 'absolute', left: 190, right: 190, top: 580 + i * 150,
            background: i === 3 ? '#fff' : C.paper,
            border: i === 3 ? `4px solid #F2B632` : `3px solid ${INK}`,
            borderRadius: 24, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 18,
            ...enter(frame, at)}}>
            <span style={{fontFamily: FONT, fontSize: 52, fontWeight: 700, color: INK, ...NUM}}>{n} 人</span>
            <div style={{display: 'flex', gap: 8}}>
              {Array.from({length: n}).map((_, j) => (
                <div key={j} style={{width: 44, height: 44, borderRadius: '50%',
                  background: PIRATE_COLORS[5 - n + j] || C.muted, border: `3px solid ${INK}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT, fontSize: 26, fontWeight: 700, color: '#fff'}}>
                  {PIRATE_NAMES[5 - n + j]}
                </div>
              ))}
            </div>
            {i === 3 && (
              <span style={{marginLeft: 'auto', fontFamily: FONT, fontSize: 36, fontWeight: 700, color: '#B87A00'}}>
                最简单 ✓
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------- 场景 07：两人局 ----------
const Scene07 = ({frame, fps}: {frame: number; fps: number}) => {
  const t = frame / fps;
  const flipT = 6; // 翻转时刻
  const rot = interpolate(frame, [flipT * fps, (flipT + 1) * fps],
    [0, 180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
  const showBack = rot > 90;
  return (
    <div>
      <ChapterHead label="倒推" title="两人局" frame={frame} />
      {/* 只剩 D、E */}
      <div style={{position: 'absolute', left: 0, right: 0, top: SLOT_FEET_Y - 230, display: 'flex', justifyContent: 'center', gap: 60}}>
        {[3, 4].map(k => (
          <div key={k} style={{width: 150}}>
            <Pirate id={k} expression={k === 3 ? 'smug' : 'worried'} state="active" crown={k === 3} frame={frame} />
          </div>
        ))}
      </div>
      {/* 翻转卡 */}
      <div style={{position: 'absolute', left: 190, right: 190, top: 480,
        transform: `perspective(900px) rotateY(${rot}deg)`, transformStyle: 'preserve-3d'}}>
        <div style={{background: showBack ? '#fff' : C.paper, border: `4px solid ${INK}`, borderRadius: 28,
          padding: '30px 24px', textAlign: 'center', transform: showBack ? 'rotateY(180deg)' : 'none'}}>
          {!showBack ? (
            <div style={{fontFamily: FONT, fontSize: 52, fontWeight: 700, color: INK}}>
              只剩 D、E，会怎样？
            </div>
          ) : (
            <div>
              <div style={{fontFamily: FONT, fontSize: 52, fontWeight: 700, color: INK, ...NUM}}>
                D <span style={{color: '#B87A00'}}>100</span>，E 0
              </div>
              <div style={{fontFamily: FONT, fontSize: 40, fontWeight: 500, color: C.muted, marginTop: 12, ...NUM}}>
                1/2 票 ✓通过
              </div>
            </div>
          )}
        </div>
      </div>
      {/* D 的金币堆 */}
      {t >= flipT + 1 && (
        <div style={{position: 'absolute', left: CX - 200, top: 1010, ...pop(frame, (flipT + 1) * fps)}}>
          <svg width={400} height={130} viewBox="0 0 400 130">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <g key={i} transform={`translate(${40 + i * 48},${i % 2 ? 78 : 60})`}>
                <circle r={26} fill={C.coin} stroke={INK} strokeWidth={4} />
                <ellipse cx={-8} cy={-9} rx={10} ry={7} fill={C.coinHi} opacity={0.85} />
              </g>
            ))}
          </svg>
          <div style={{textAlign: 'center', fontFamily: FONT, fontSize: 36, fontWeight: 700, color: INK, ...NUM}}>
            D 独吞 100 枚
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- 通用回合场景（08/09/10） ----------
type RoundCfg = {
  key: string; title: string; countText: string;
  present: number[]; proposer: number;
  expr: Record<number, Expression>;
  thought: {title: string; mini: [string, number][]} | null;
  prices: {k: number; text: string; selected: boolean}[];
  plan: number[]; votes: boolean[]; needed: number;
  resultCard: string;
  timing: {bubbleAt: number; pricesAt: number; planAt: number; votesAt: number; verdictAt: number; cardAt: number};
};

const ROUNDS: Record<string, RoundCfg> = {
  '08': {
    key: 's08', title: '三人局', countText: '当前：C、D、E',
    present: [2, 3, 4], proposer: 2,
    expr: {2: 'smug', 3: 'worried', 4: 'happy'},
    thought: {title: '如果我下海…', mini: [['D', 100], ['E', 0]]},
    prices: [{k: 3, text: '要101枚', selected: false}, {k: 4, text: '0+1=1枚', selected: true}],
    plan: [99, 0, 1], votes: [true, false, true], needed: 2,
    resultCard: '三人局：C 99，D 0，E 1',
    timing: {bubbleAt: speechAt('08', 'C要拿到两票', -0.2), pricesAt: speechAt('08', 'E呢？'),
      planAt: speechAt('08', '方案：', -0.15), votesAt: speechAt('08', '两票，通过。', -0.2),
      verdictAt: speechAt('08', '两票，通过。', 0.2), cardAt: speechAt('08', '两票，通过。', 0.7)},
  },
  '09': {
    key: 's09', title: '四人局', countText: '当前：B、C、D、E',
    present: [1, 2, 3, 4], proposer: 1,
    expr: {1: 'smug', 2: 'neutral', 3: 'happy', 4: 'neutral'},
    thought: {title: '如果我下海…', mini: [['C', 99], ['D', 0], ['E', 1]]},
    prices: [{k: 3, text: '0+1=1枚', selected: true}, {k: 4, text: '1+1=2枚', selected: false}],
    plan: [99, 0, 1, 0], votes: [true, false, true, false], needed: 2,
    resultCard: '四人局：B 99，C 0，D 1，E 0',
    timing: {bubbleAt: speechAt('09', 'B要两票', -0.15), pricesAt: speechAt('09', '收买价'),
      planAt: speechAt('09', '方案：', -0.15), votesAt: speechAt('09', '两票，通过。', -0.2),
      verdictAt: speechAt('09', '两票，通过。', 0.2), cardAt: speechAt('09', '两票，通过。', 0.7)},
  },
  '10': {
    key: 's10', title: '五人局', countText: '当前：A、B、C、D、E',
    present: [0, 1, 2, 3, 4], proposer: 0,
    expr: {0: 'smug', 1: 'worried', 2: 'happy', 3: 'worried', 4: 'happy'},
    thought: {title: '如果我下海…', mini: [['B', 99], ['C', 0], ['D', 1], ['E', 0]]},
    prices: [
      {k: 2, text: '0+1=1枚', selected: true},
      {k: 3, text: '1+1=2枚', selected: false},
      {k: 4, text: '0+1=1枚', selected: true},
    ],
    plan: [98, 0, 1, 0, 1], votes: [true, false, true, false, true], needed: 3,
    resultCard: '五人局：A 98，B 0，C 1，D 0，E 1',
    timing: {bubbleAt: speechAt('10', '如果A被扔下海', -0.2), pricesAt: speechAt('10', 'D是一枚', -0.2),
      planAt: speechAt('10', '方案：', -0.15), votesAt: speechAt('10', '三票，通过。', -0.2),
      verdictAt: speechAt('10', '三票，通过。', 0.2), cardAt: speechAt('10', '三票，通过。', 0.7)},
  },
};

const RoundScene = ({frame, fps, cfg}: {frame: number; fps: number; cfg: RoundCfg}) => {
  const T = cfg.timing;
  const t = frame / fps;
  const presentSet = new Set(cfg.present);
  const n = cfg.present.length;
  const yes = cfg.votes.filter(Boolean).length;
  // 气泡 x：以提议者为中心，夹在安全区内
  const propX = SLOT_X[cfg.proposer];
  const bubbleX = Math.min(495, Math.max(75, propX - 210));
  const tailX = Math.min(390, Math.max(30, propX - bubbleX - 14));
  // 价格牌：按槽位平铺
  const priceW = 170;
  return (
    <div>
      <ChapterHead label="倒推" title={cfg.title} frame={frame} />
      <div style={{position: 'absolute', left: CX - 220, top: 360, width: 440, height: 64,
        background: C.paper, border: `3px solid ${INK}`, borderRadius: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontSize: 36, fontWeight: 500, color: INK, ...enter(frame, 4)}}>
        {cfg.countText}
      </div>

      {[0, 1, 2, 3, 4].map(k => (
        <div key={k} style={{position: 'absolute', left: SLOT_X[k] - 75, top: SLOT_FEET_Y - 230}}>
          <Pirate id={k} expression={presentSet.has(k) ? (cfg.expr[k] || 'neutral') : 'neutral'}
            state={presentSet.has(k) ? 'active' : 'absent'} crown={k === cfg.proposer && presentSet.has(k)} frame={frame} />
        </div>
      ))}
      {cfg.present.map(k => (
        <div key={k} style={{position: 'absolute', left: SLOT_X[k] - 28, top: 985, width: 56, height: 56,
          background: PIRATE_COLORS[k], border: `4px solid ${INK}`, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT, fontSize: 36, fontWeight: 700, color: '#fff', ...enter(frame, 6)}}>
          {PIRATE_NAMES[k]}
        </div>
      ))}

      {/* 思考气泡 */}
      {cfg.thought && t >= T.bubbleAt && t < T.pricesAt && (
        <div style={{position: 'absolute', left: bubbleX, top: 500, width: 420,
          background: '#fff', border: `3px solid ${INK}`, borderRadius: 28, padding: '20px 24px',
          ...enter(frame, T.bubbleAt * fps)}}>
          <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 700, color: INK, textAlign: 'center'}}>
            {cfg.thought.title}
          </div>
          <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap'}}>
            {cfg.thought.mini.map(([nm, v]) => (
              <div key={nm} style={{border: `3px dashed ${INK}`, borderRadius: 20, padding: '8px 20px',
                fontFamily: FONT, fontSize: 36, fontWeight: 700, color: INK, ...NUM, opacity: 0.75}}>
                {nm} {v}
              </div>
            ))}
          </div>
          <div style={{position: 'absolute', left: tailX, bottom: -18, width: 28, height: 28,
            background: '#fff', borderRight: `3px solid ${INK}`, borderBottom: `3px solid ${INK}`,
            transform: 'rotate(45deg)'}} />
        </div>
      )}

      {/* 收买价 */}
      {t >= T.pricesAt && cfg.prices.map((p, i) => (
        <div key={p.k} style={{position: 'absolute', left: SLOT_X[p.k] - priceW / 2, top: 440,
          width: priceW, height: 64,
          background: p.selected ? '#fff' : C.paper,
          border: p.selected ? `3px solid ${PIRATE_COLORS[p.k]}` : `3px solid ${INK}`,
          borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT, fontSize: 36, fontWeight: 700, color: INK, ...NUM,
          ...enter(frame, (T.pricesAt + i * 0.5) * fps)}}>
          {p.text}
        </div>
      ))}

      {/* 方案行 */}
      {t >= T.planAt && cfg.present.map((k, i) => (
        <div key={k} style={{position: 'absolute', left: SLOT_X[k] - 75, top: 520, width: 150, height: 72,
          background: k === cfg.proposer ? '#fff' : C.paper,
          border: k === cfg.proposer ? `3px solid #F2B632` : `3px solid ${INK}`, borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT, fontSize: 46, fontWeight: 700, color: INK, ...NUM,
          ...enter(frame, (T.planAt + i * 0.3) * fps)}}>
          {cfg.plan[i]}
        </div>
      ))}

      {/* 投票旗 */}
      {t >= T.votesAt && cfg.present.map((k, i) => {
        const vyes = cfg.votes[i];
        const at = (T.votesAt + i * 0.35) * fps;
        const rise = interpolate(frame, [at, at + 8], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const o = interpolate(frame, [at, at + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div key={k} style={{position: 'absolute', left: SLOT_X[k] - 40, top: 610 + rise, width: 80, opacity: o}}>
            <svg width={80} height={90} viewBox="0 0 80 90">
              <line x1={14} y1={88} x2={14} y2={8} stroke={INK} strokeWidth={5} strokeLinecap="round" />
              <path d="M14,8 L72,8 L60,24 L72,40 L14,40 Z"
                fill={vyes ? C.yes : C.no} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
              <text x={38} y={31} textAnchor="middle" fontFamily={FONT} fontSize={24} fontWeight={700} fill="#fff">
                {vyes ? '同意' : '反对'}
              </text>
            </svg>
          </div>
        );
      })}

      {/* 判定条 */}
      {t >= T.verdictAt && (
        <div style={{position: 'absolute', left: 195, top: 1140, width: 690, ...enter(frame, T.verdictAt * fps)}}>
          <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
            {cfg.votes.map((v, i) => (
              <div key={i} style={{width: 60, height: 44, background: v ? C.yes : C.no,
                border: `3px solid ${INK}`, borderRadius: 12}} />
            ))}
            <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 700, color: INK, marginLeft: 16, ...NUM}}>
              {yes}/{n}票，需要{cfg.needed}票 ✓通过
            </div>
          </div>
        </div>
      )}

      {/* 结论卡 */}
      {t >= T.cardAt && (
        <div style={{position: 'absolute', left: 195, top: 1240, width: 690, padding: '18px 0',
          background: C.paper, border: `3px solid ${INK}`, borderRadius: 28, textAlign: 'center',
          fontFamily: FONT, fontSize: 44, fontWeight: 700, color: INK, ...NUM,
          ...enter(frame, T.cardAt * fps)}}>
          {cfg.resultCard}
        </div>
      )}

      {/* 金币药丸 */}
      {cfg.present.map((k, i) => (
        <CoinPill key={k} x={SLOT_X[k]} y={1062} n={t >= T.planAt ? cfg.plan[i] : 0}
          frame={frame} at={(T.planAt + 1 + i * 0.3) * fps} />
      ))}
    </div>
  );
};

// ---------- 场景 11：常见疑问 ----------
const QAS = [
  {q: 'C、E 为什么接受 1 枚？', a: '拒绝还是 0，1 枚 > 0 枚',
    ask: '有人会问：C和E', answer: '因为拒绝的话'},
  {q: 'B、D 反对为什么没用？', a: '即使反对，A 仍有 3 票',
    ask: 'B和D为什么不反对', answer: '他们反对也没用'},
  {q: 'A 为什么不多给？', a: '对聪明人，+1 枚就够了',
    ask: '还有人问：A为什么', answer: '不需要。'},
];
const Scene11 = ({frame, fps}: {frame: number; fps: number}) => {
  const t = frame / fps;
  return (
    <div>
      <ChapterHead label="复盘" title="常见疑问" frame={frame} />
      {QAS.map((qa, i) => {
        const askAt = speechAt('11', qa.ask);
        const flipAt = speechAt('11', qa.answer);
        if (t < askAt) return null;
        const rot = interpolate(frame, [flipAt * fps, (flipAt + 1) * fps],
          [0, 180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
        const back = rot > 90;
        return (
          <div key={i} style={{position: 'absolute', left: 150, right: 150, top: 480 + i * 260,
            transform: `perspective(1000px) rotateY(${rot}deg)`, transformStyle: 'preserve-3d'}}>
            <div style={{background: back ? '#fff' : C.paper, border: `4px solid ${INK}`, borderRadius: 28,
              padding: '28px 24px', textAlign: 'center', transform: back ? 'rotateY(180deg)' : 'none'}}>
              {!back ? (
                <div style={{fontFamily: FONT, fontSize: 46, fontWeight: 700, color: INK}}>❓ {qa.q}</div>
              ) : (
                <div style={{fontFamily: FONT, fontSize: 46, fontWeight: 700, color: '#0E7A4F'}}>💡 {qa.a}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- 场景 12：规律与结果 ----------
const Scene12 = ({frame, fps}: {frame: number; fps: number}) => {
  const t = frame / fps;
  // 金币雨
  const coins = Array.from({length: 24}).map((_, i) => {
    const x = (i * 197) % 1000 + 40;
    const speed = 500 + (i % 5) * 120;
    const y = t >= 8 ? ((t - 8) * speed + (i * 130) % 400) % 1500 - 100 : -100;
    const o = t >= 8 && y < 1350 ? 1 : 0;
    return {x, y, o, r: (i * 37) % 360};
  });
  return (
    <div>
      {t >= 8 && coins.map((c, i) => (
        <div key={i} style={{position: 'absolute', left: c.x, top: c.y, opacity: c.o, transform: `rotate(${c.r}deg)`}}>
          <svg width={40} height={40} viewBox="0 0 36 36">
            <circle cx={18} cy={18} r={14} fill={C.coin} stroke={INK} strokeWidth={3} />
            <ellipse cx={13} cy={12} rx={6} ry={4} fill={C.coinHi} opacity={0.8} />
          </svg>
        </div>
      ))}
      <ChapterHead label="总结" title="规律" frame={frame} />
      {t >= 1.5 && (
        <div style={{position: 'absolute', left: 150, right: 150, top: 460,
          background: '#fff', border: `4px solid #F2B632`, borderRadius: 28, padding: '28px 24px',
          textAlign: 'center', fontFamily: FONT, fontSize: 44, fontWeight: 700, color: INK,
          ...enter(frame, 1.5 * fps)}}>
          只收买<b style={{color: '#B87A00'}}>下一轮拿 0 枚</b>的人<br />
          每人 <b style={{color: '#B87A00', ...NUM}}>1</b> 枚，凑够过半票
        </div>
      )}
      {/* 2x2 回顾 */}
      {t >= 4.5 && (
        <div style={{position: 'absolute', left: 150, right: 150, top: 730, display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: 16, ...enter(frame, 4.5 * fps)}}>
          {[['2人', 'D 100'], ['3人', 'C 99'], ['4人', 'B 99'], ['5人', 'A 98']].map(([a, b]) => (
            <div key={a} style={{background: C.paper, border: `3px solid ${INK}`, borderRadius: 20,
              padding: '16px 12px', textAlign: 'center',
              fontFamily: FONT, fontSize: 40, fontWeight: 700, color: INK, ...NUM}}>
              {a}：{b}
            </div>
          ))}
        </div>
      )}
      {/* 最终结果 */}
      {t >= 8 && (
        <div style={{position: 'absolute', left: 120, right: 120, top: 1080,
          background: '#fff', border: `4px solid ${INK}`, borderRadius: 28, padding: '24px 16px',
          textAlign: 'center', fontFamily: FONT, fontSize: 48, fontWeight: 700, color: INK, ...NUM,
          ...pop(frame, 8 * fps)}}>
          A 98，B 0，C 1，D 0，E 1
        </div>
      )}
    </div>
  );
};

// ---------- 场景 13：彩蛋 ----------
const Scene13 = ({frame, fps}: {frame: number; fps: number}) => {
  const t = frame / fps;
  const flipAt = 2;
  const rot = interpolate(frame, [flipAt * fps, (flipAt + 1.2) * fps],
    [0, 180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
  const back = rot > 90;
  return (
    <div>
      <ChapterHead label="彩蛋" title="规则一改？" frame={frame} />
      <div style={{position: 'absolute', left: 150, right: 150, top: 480,
        transform: `perspective(1000px) rotateY(${rot}deg)`, transformStyle: 'preserve-3d'}}>
        <div style={{background: back ? '#fff' : C.paper, border: `4px solid ${INK}`, borderRadius: 28,
          padding: '36px 24px', textAlign: 'center', transform: back ? 'rotateY(180deg)' : 'none'}}>
          {!back ? (
            <div style={{fontFamily: FONT, fontSize: 46, fontWeight: 700, color: INK}}>
              如果必须<b>超过</b>一半才通过？
            </div>
          ) : (
            <div style={{fontFamily: FONT, fontSize: 52, fontWeight: 700, color: INK, ...NUM}}>
              A 最多拿 <span style={{color: '#B87A00'}}>97</span> 枚
            </div>
          )}
        </div>
      </div>
      {t >= 6 && (
        <div style={{position: 'absolute', left: 150, right: 150, top: 800, textAlign: 'center',
          background: C.paper, border: `3px solid ${INK}`, borderRadius: 28, padding: '28px 20px',
          fontFamily: FONT, fontSize: 48, fontWeight: 700, color: INK, ...enter(frame, 6 * fps)}}>
          你算对了吗？<br />
          <span style={{fontSize: 40, fontWeight: 500, color: C.muted}}>评论区告诉我</span>
        </div>
      )}
      {t >= 9 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1080, display: 'flex',
          justifyContent: 'center', gap: 24, ...enter(frame, 9 * fps)}}>
          {[0, 1, 2, 3, 4].map(k => (
            <div key={k} style={{width: 110}}>
              <Pirate id={k} expression="happy" state="active" frame={frame} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PirateGoldVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const scenes = RT.scenes;
  let idx = scenes.findIndex(s => seconds >= s.start && seconds < s.end);
  if (idx < 0) idx = scenes.length - 1;
  const sc = scenes[idx];
  const localFrame = frame - sc.start * fps;
  // 句子级字幕：显示当前正在说的句子
  const sent = (sentences as {start: number; end: number; text: string}[]).find(
    s => seconds >= s.start && seconds < s.end);

  return (
    <AbsoluteFill style={{background: C.sky, fontFamily: FONT}}>
      <Background frame={frame} />
      <GlobalAudio />
      {sc.id === '01' && <Scene01 frame={localFrame} fps={fps} />}
      {sc.id === '02' && <Scene02 frame={localFrame} fps={fps} />}
      {sc.id === '03' && <Scene03 frame={localFrame} fps={fps} />}
      {sc.id === '04' && <Scene04 frame={localFrame} fps={fps} />}
      {sc.id === '05' && <Scene05 frame={localFrame} fps={fps} />}
      {sc.id === '06' && <Scene06 frame={localFrame} fps={fps} />}
      {sc.id === '07' && <Scene07 frame={localFrame} fps={fps} />}
      {(sc.id === '08' || sc.id === '09' || sc.id === '10') &&
        <RoundScene frame={localFrame} fps={fps} cfg={ROUNDS[sc.id]} />}
      {sc.id === '11' && <Scene11 frame={localFrame} fps={fps} />}
      {sc.id === '12' && <Scene12 frame={localFrame} fps={fps} />}
      {sc.id === '13' && <Scene13 frame={localFrame} fps={fps} />}
      {sent && (
        <div style={{position: 'absolute', left: 75, top: 1360, width: 840, minHeight: 124,
          background: 'rgba(255,255,255,0.92)', border: '1px solid #E5DFCF', borderRadius: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          fontFamily: FONT, fontSize: 42, fontWeight: 500, color: INK, padding: '16px 24px',
          lineHeight: 1.4}}>
          {sent.text}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const PirateGoldCover: React.FC = () => (
  <AbsoluteFill style={{background: C.sky, fontFamily: FONT}}>
    <Background frame={0} />
    <div style={{position: 'absolute', left: SAFE.x0, right: W - SAFE.x1, top: 230, textAlign: 'center',
      fontFamily: TITLE_FONT, fontSize: 110, fontWeight: 700, color: INK, lineHeight: 1.25}}>
      五个海盗<br />分金币
    </div>
    <div style={{position: 'absolute', left: 180, right: 180, top: 620, textAlign: 'center',
      background: '#fff', border: `4px solid #F2B632`, borderRadius: 28, padding: '20px 12px',
      fontFamily: FONT, fontSize: 52, fontWeight: 700, color: INK}}>
      第一个拿 <span style={{color: '#B87A00', ...NUM}}>98</span> 枚？
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', justifyContent: 'center', gap: 8}}>
      {[0, 1, 2, 3, 4].map(k => (
        <div key={k} style={{width: 150}}><Pirate id={k} expression="happy" state="active" frame={0} /></div>
      ))}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 200, textAlign: 'center',
      fontFamily: FONT, fontSize: 40, fontWeight: 500, color: C.muted}}>
      科普时间
    </div>
  </AbsoluteFill>
);
