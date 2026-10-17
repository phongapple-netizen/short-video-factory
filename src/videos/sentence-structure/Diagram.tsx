import React from 'react';
import type {DiagramProps} from '../../shared/story';

const FONT = "'Noto Sans CJK SC','Noto Sans SC',sans-serif";
const INK = '#172D3D';
const MUTED = '#60727D';
const PAPER = '#FFFFFF';

// 成分色
const C = {
  subject: '#386AA9',   // 主语 蓝
  predicate: '#E4572E', // 谓语 红橙
  object: '#147E75',    // 宾语 青
  attributive: '#D9A21B', // 定语 金
  adverbial: '#7C5CBF', // 状语 紫
  complement: '#E0688A', // 补语 粉
  error: '#C72C44',
  ok: '#1E9E6A',
};

const show = (p: number, at: number, dur = 0.18) =>
  Math.min(1, Math.max(0, (p - at) / dur));

type WordProps = {
  x: number; y: number; text: string; fontSize?: number;
  fill?: string; textColor?: string; label?: string; labelColor?: string;
  opacity?: number; sub?: string;
};
// 词语色块：圆角矩形 + 下方成分标签
const Word = ({x, y, text, fontSize = 52, fill = '#EDEBE2', textColor = INK,
  label, labelColor = MUTED, opacity = 1, sub}: WordProps) => {
  const w = text.length * fontSize + 36;
  const h = fontSize + 30;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={fill}
        stroke={fill === '#EDEBE2' ? '#DADDD7' : fill} strokeWidth={2} />
      <text x={x + w / 2} y={y + h / 2 + fontSize * 0.36} textAnchor="middle"
        fontSize={fontSize} fontWeight={800} fill={textColor} fontFamily={FONT}>{text}</text>
      {label && (
        <text x={x + w / 2} y={y + h + 40} textAnchor="middle"
          fontSize={30} fontWeight={800} fill={labelColor} fontFamily={FONT}>{label}</text>
      )}
      {sub && (
        <text x={x + w / 2} y={y + h + 76} textAnchor="middle"
          fontSize={26} fontWeight={600} fill={MUTED} fontFamily={FONT}>{sub}</text>
      )}
    </g>
  );
};

const Badge = ({x, y, text, fill, fontSize = 28}: {x: number; y: number; text: string; fill: string; fontSize?: number}) => {
  const w = text.length * fontSize + 28;
  return (
    <g>
      <rect x={x} y={y} width={w} height={fontSize + 20} rx={(fontSize + 20) / 2} fill={fill} />
      <text x={x + w / 2} y={y + (fontSize + 20) / 2 + fontSize * 0.36} textAnchor="middle"
        fontSize={fontSize} fontWeight={800} fill="#FFFFFF" fontFamily={FONT}>{text}</text>
    </g>
  );
};

// 波浪线（病句标记）
const Wavy = ({x, y, w, color = C.error}: {x: number; y: number; w: number; color?: string}) => {
  let d = `M${x},${y}`;
  const n = Math.max(2, Math.round(w / 24));
  for (let i = 0; i < n; i++) {
    const seg = w / n;
    d += ` q${seg / 4},-12 ${seg / 2},0 q${seg / 4},12 ${seg / 2},0`;
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />;
};

const TS = ({fill, children}: {fill: string; children: React.ReactNode}) => (
  <tspan fill={fill}>{children}</tspan>
);

// ---------- 场景 ----------
const S01 = ({p}: {p: number}) => (
  <g fontFamily={FONT}>
    <text x={435} y={90} textAnchor="middle" fontSize={46} fontWeight={800} fill={INK}>
      听了这个故事，使我深受感动。
    </text>
    <g opacity={show(p, 0.25)}>
      <Wavy x={452} y={118} w={56} />
      <text x={435} y={220} textAnchor="middle" fontSize={120} fontWeight={900} fill={C.error}>？</text>
      <text x={435} y={310} textAnchor="middle" fontSize={44} fontWeight={800} fill={C.error}>
        病在哪？
      </text>
    </g>
    <g opacity={show(p, 0.55)}>
      <text x={435} y={430} textAnchor="middle" fontSize={36} fontWeight={700} fill={MUTED}>
        主语丢了——句子缺了一块
      </text>
      <text x={435} y={530} textAnchor="middle" fontSize={40} fontWeight={800} fill={INK}>
        学会找<TS fill={C.subject}>主语</TS><TS fill={C.predicate}>谓语</TS><TS fill={C.object}>宾语</TS>，
      </text>
      <text x={435} y={590} textAnchor="middle" fontSize={40} fontWeight={800} fill={INK}>
        病句一眼看穿
      </text>
    </g>
  </g>
);

const S02 = ({p}: {p: number}) => {
  // 小明 吃 苹果：小明高亮为主语
  const items: {t: string; col: string; label?: string; sub?: string}[] = [
    {t: '小明', col: C.subject, label: '主语', sub: '谁？'},
    {t: '吃', col: ''},
    {t: '苹果', col: ''},
  ];
  const total = items.reduce((a, it) => a + it.t.length * 56 + 36 + 28, 0) - 28;
  let x = 435 - total / 2;
  return (
    <g fontFamily={FONT}>
      <text x={435} y={80} textAnchor="middle" fontSize={36} fontWeight={700} fill={MUTED}>
        谁发出的动作，谁就是主语
      </text>
      {items.map((it, i) => {
        const active = it.col !== '';
        const el = (
          <g key={it.t} opacity={show(p, i * 0.15)}>
            <Word x={x} y={180} text={it.t} fontSize={56}
              fill={active ? it.col : '#EDEBE2'} textColor={active ? '#FFF' : INK}
              label={it.label} labelColor={it.col} sub={it.sub} />
          </g>
        );
        x += it.t.length * 56 + 36 + 28;
        return el;
      })}
      <g opacity={show(p, 0.6)}>
        <text x={435} y={520} textAnchor="middle" fontSize={38} fontWeight={800} fill={INK}>
          提问“谁吃？”→ <TS fill={C.subject}>小明</TS>
        </text>
        <text x={435} y={590} textAnchor="middle" fontSize={34} fontWeight={600} fill={MUTED}>
          主语常在句首，是句子的“主角”
        </text>
      </g>
    </g>
  );
};

const S03 = ({p}: {p: number}) => {
  const items = [
    {t: '小明', col: C.subject, label: '主语', sub: '谁？'},
    {t: '吃', col: C.predicate, label: '谓语', sub: '干什么？'},
    {t: '苹果', col: C.object, label: '宾语', sub: '吃什么？'},
  ];
  const total = items.reduce((a, it) => a + it.t.length * 52 + 36 + 24, 0) - 24;
  let x = 435 - total / 2;
  const boxes = items.map(it => {
    const w = it.t.length * 52 + 36;
    const b = {...it, x, w};
    x += w + 24;
    return b;
  });
  return (
    <g fontFamily={FONT}>
      {boxes.map((b, i) => (
        <g key={b.t} opacity={show(p, i * 0.18)}>
          <Word x={b.x} y={150} text={b.t} fontSize={52} fill={b.col} textColor="#FFF"
            label={b.label} labelColor={b.col} sub={b.sub} />
        </g>
      ))}
      <g opacity={show(p, 0.62)}>
        <rect x={boxes[0].x - 10} y={400} width={total + 20} height={90} rx={16}
          fill="none" stroke={INK} strokeWidth={4} />
        <text x={435} y={458} textAnchor="middle" fontSize={40} fontWeight={900} fill={INK}>
          主干
        </text>
        <text x={435} y={560} textAnchor="middle" fontSize={36} fontWeight={700} fill={MUTED}>
          主谓宾齐了，句子才站得住
        </text>
      </g>
    </g>
  );
};

const S04 = ({p}: {p: number}) => (
  <g fontFamily={FONT}>
    <text x={435} y={80} textAnchor="middle" fontSize={36} fontWeight={700} fill={MUTED}>
      修饰名词，回答“什么样的”
    </text>
    <g opacity={show(p, 0.05)}>
      <Word x={140} y={170} text="红红的" fontSize={56} fill={C.attributive} textColor="#FFF"
        label="定语" labelColor={C.attributive} sub="什么样的？" />
      <Word x={430} y={170} text="苹果" fontSize={56} />
    </g>
    <g opacity={show(p, 0.4)}>
      <Badge x={240} y={118} text="的" fill={C.attributive} />
      <text x={435} y={470} textAnchor="middle" fontSize={38} fontWeight={800} fill={INK}>
        定语 + <TS fill={C.attributive}>的</TS>，站在名词前面
      </text>
      <text x={435} y={540} textAnchor="middle" fontSize={34} fontWeight={600} fill={MUTED}>
        我的书包 / 美丽的校园 / 认真的小明
      </text>
    </g>
  </g>
);

const S05 = ({p}: {p: number}) => (
  <g fontFamily={FONT}>
    <text x={435} y={80} textAnchor="middle" fontSize={36} fontWeight={700} fill={MUTED}>
      修饰动词，表时间、地点、方式
    </text>
    <g opacity={show(p, 0.05)}>
      <Word x={60} y={160} text="小明" fontSize={48} />
      <Word x={250} y={160} text="大口地" fontSize={48} fill={C.adverbial} textColor="#FFF"
        label="状语" labelColor={C.adverbial} sub="怎么吃？" />
      <Word x={500} y={160} text="吃" fontSize={48} />
      <Word x={640} y={160} text="苹果" fontSize={48} />
    </g>
    <g opacity={show(p, 0.35)}>
      <Badge x={340} y={110} text="地" fill={C.adverbial} />
    </g>
    <g opacity={show(p, 0.5)}>
      <text x={435} y={430} textAnchor="middle" fontSize={36} fontWeight={700} fill={MUTED}>
        他在<TS fill={C.adverbial}>教室里</TS>读书
      </text>
      <text x={435} y={500} textAnchor="middle" fontSize={38} fontWeight={800} fill={INK}>
        状语 + <TS fill={C.adverbial}>地</TS>，站在谓语前面
      </text>
      <text x={435} y={570} textAnchor="middle" fontSize={34} fontWeight={600} fill={MUTED}>
        认真地听 / 开心地笑 / 在操场上跑
      </text>
    </g>
  </g>
);

const S06 = ({p}: {p: number}) => (
  <g fontFamily={FONT}>
    <text x={435} y={80} textAnchor="middle" fontSize={36} fontWeight={700} fill={MUTED}>
      在谓语后面，补充说明结果或程度
    </text>
    <g opacity={show(p, 0.05)}>
      <Word x={170} y={170} text="他跑" fontSize={56} />
      <Word x={400} y={170} text="得很快" fontSize={56} fill={C.complement} textColor="#FFF"
        label="补语" labelColor={C.complement} sub="跑得怎么样？" />
    </g>
    <g opacity={show(p, 0.4)}>
      <Badge x={440} y={118} text="得" fill={C.complement} />
      <text x={435} y={470} textAnchor="middle" fontSize={38} fontWeight={800} fill={INK}>
        谓语 + <TS fill={C.complement}>得</TS> + 补语，在谓语后面
      </text>
      <text x={435} y={540} textAnchor="middle" fontSize={34} fontWeight={600} fill={MUTED}>
        写得认真 / 长得很高 / 气得说不出话
      </text>
    </g>
    <g opacity={show(p, 0.65)}>
      <rect x={135} y={600} width={600} height={80} rx={16} fill="#EDEBE2" />
      <text x={435} y={652} textAnchor="middle" fontSize={36} fontWeight={800} fill={INK}>
        定语、状语、补语 = 枝叶
      </text>
    </g>
  </g>
);

const S07 = ({p}: {p: number}) => {
  // 缩句：修饰语随 progress 淡出
  const fade = 1 - show(p, 0.35, 0.3) * 0.85;
  return (
    <g fontFamily={FONT}>
      <text x={435} y={80} textAnchor="middle" fontSize={36} fontWeight={700} fill={MUTED}>
        去掉枝叶，只留主谓宾
      </text>
      <g opacity={show(p, 0.05)}>
        <Word x={40} y={150} text="可爱的" fontSize={44} fill={C.attributive} textColor="#FFF" opacity={fade} />
        <Word x={280} y={150} text="小明" fontSize={44} fill={C.subject} textColor="#FFF" />
        <Word x={440} y={150} text="大口地" fontSize={44} fill={C.adverbial} textColor="#FFF" opacity={fade} />
        <Word x={680} y={150} text="吃着" fontSize={44} fill={C.predicate} textColor="#FFF" />
        <Word x={40} y={260} text="红红的" fontSize={44} fill={C.attributive} textColor="#FFF" opacity={fade} />
        <Word x={280} y={260} text="苹果" fontSize={44} fill={C.object} textColor="#FFF" />
        <text x={560} y={312} fontSize={40} fontWeight={800} fill={INK} opacity={fade}>。</text>
      </g>
      <g opacity={show(p, 0.55)}>
        <text x={435} y={430} textAnchor="middle" fontSize={64} fontWeight={900} fill={INK}>↓</text>
        <Word x={245} y={480} text="小明" fontSize={52} fill={C.subject} textColor="#FFF" label="主语" labelColor={C.subject} />
        <Word x={393} y={480} text="吃" fontSize={52} fill={C.predicate} textColor="#FFF" label="谓语" labelColor={C.predicate} />
        <Word x={501} y={480} text="苹果" fontSize={52} fill={C.object} textColor="#FFF" label="宾语" labelColor={C.object} />
      </g>
    </g>
  );
};

const ErrorCard = ({y, bad, badHi, type, fix, opacity}: {
  y: number; bad: string; badHi: string; type: string; fix: string; opacity: number}) => {
  const idx = bad.indexOf(badHi);
  const before = idx >= 0 ? bad.slice(0, idx) : bad;
  const after = idx >= 0 ? bad.slice(idx + badHi.length) : '';
  const hi = idx >= 0 ? badHi : '';
  return (
    <g opacity={opacity} fontFamily={FONT}>
      <rect x={40} y={y} width={790} height={200} rx={20} fill={PAPER}
        stroke="#DADDD7" strokeWidth={2} />
      <Badge x={64} y={y + 18} text={type} fill={C.error} fontSize={26} />
      <text x={64} y={y + 108} fontSize={31} fontWeight={700} fill={INK}>
        {before}<TS fill={C.error}>{hi}</TS>{after}
      </text>
      <text x={64} y={y + 162} fontSize={29} fontWeight={700} fill={C.ok}>
        改：{fix}
      </text>
    </g>
  );
};

const S08 = ({p}: {p: number}) => (
  <g>
    <ErrorCard y={20} bad="听了这个故事，使我深受感动。" badHi="使" type="成分残缺"
      fix="删“使”→听了这个故事，我深受感动。" opacity={show(p, 0.02)} />
    <ErrorCard y={245} bad="他的学习态度有了很大的提高。" badHi="提高" type="搭配不当"
      fix="态度不能提高→态度有了很大的转变。" opacity={show(p, 0.34)} />
    <ErrorCard y={470} bad="我们要认真克服并发现工作中的缺点。" badHi="发现" type="搭配不当"
      fix="→克服缺点，并发现问题。" opacity={show(p, 0.66)} />
  </g>
);

const S09 = ({p}: {p: number}) => (
  <g fontFamily={FONT}>
    <g opacity={show(p, 0.02)}>
      <rect x={255} y={30} width={360} height={340} rx={20} fill="#EDEBE2" />
      <text x={435} y={88} textAnchor="middle" fontSize={36} fontWeight={900} fill={INK}>主干</text>
      <Word x={280} y={110} text="主语" fontSize={36} fill={C.subject} textColor="#FFF" />
      <Word x={448} y={110} text="谓语" fontSize={36} fill={C.predicate} textColor="#FFF" />
      <Word x={280} y={220} text="宾语" fontSize={36} fill={C.object} textColor="#FFF" />
      <text x={435} y={440} textAnchor="middle" fontSize={36} fontWeight={900} fill={INK}>枝叶</text>
      <Word x={150} y={470} text="定语" fontSize={36} fill={C.attributive} textColor="#FFF" />
      <Word x={363} y={470} text="状语" fontSize={36} fill={C.adverbial} textColor="#FFF" />
      <Word x={576} y={470} text="补语" fontSize={36} fill={C.complement} textColor="#FFF" />
    </g>
    <g opacity={show(p, 0.45)}>
      <rect x={135} y={610} width={600} height={72} rx={16} fill={INK} />
      <text x={435} y={658} textAnchor="middle" fontSize={36} fontWeight={900} fill="#FFF">
        的定 · 地状 · 得后补
      </text>
    </g>
  </g>
);

export const Diagram: React.FC<DiagramProps> = ({progress, sceneIndex}) => {
  const p = progress;
  switch (sceneIndex) {
    case 0: return <S01 p={p} />;
    case 1: return <S02 p={p} />;
    case 2: return <S03 p={p} />;
    case 3: return <S04 p={p} />;
    case 4: return <S05 p={p} />;
    case 5: return <S06 p={p} />;
    case 6: return <S07 p={p} />;
    case 7: return <S08 p={p} />;
    default: return <S09 p={p} />;
  }
};
